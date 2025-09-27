// Player Note Database Migration System
// 🔵 青信号: REQ-401, REQ-402, REQ-403 データ整合性要件に基づく

use rusqlite::{params, Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// マイグレーション情報
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Migration {
    pub version: i32,
    pub name: String,
    pub description: String,
    pub up_sql: String,
    pub down_sql: String,
    pub applied_at: Option<String>,
}

// マイグレーション実行結果
#[derive(Debug, Serialize, Deserialize)]
pub struct MigrationResult {
    pub success: bool,
    pub version: i32,
    pub name: String,
    pub message: String,
    pub executed_at: String,
}

// マイグレーション状態
#[derive(Debug, Serialize, Deserialize)]
pub struct MigrationStatus {
    pub current_version: i32,
    pub available_migrations: Vec<Migration>,
    pub pending_migrations: Vec<Migration>,
    pub applied_migrations: Vec<Migration>,
}

// マイグレーションエラー
#[derive(Debug, Serialize, Deserialize)]
pub enum MigrationError {
    DatabaseError(String),
    InvalidVersion(String),
    MigrationNotFound(String),
    RollbackNotSupported(String),
}

impl std::fmt::Display for MigrationError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            MigrationError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
            MigrationError::InvalidVersion(msg) => write!(f, "Invalid version: {}", msg),
            MigrationError::MigrationNotFound(msg) => write!(f, "Migration not found: {}", msg),
            MigrationError::RollbackNotSupported(msg) => {
                write!(f, "Rollback not supported: {}", msg)
            }
        }
    }
}

impl std::error::Error for MigrationError {}

// マイグレーションマネージャー
pub struct MigrationManager {
    migrations: HashMap<i32, Migration>,
}

impl MigrationManager {
    pub fn new() -> Self {
        let mut manager = MigrationManager {
            migrations: HashMap::new(),
        };

        manager.register_default_migrations();
        manager
    }

    // デフォルトマイグレーションの登録
    fn register_default_migrations(&mut self) {
        // Migration 1: Player Note初期スキーマ
        self.add_migration(Migration {
            version: 1,
            name: "create_player_note_tables".to_string(),
            description: "Player Note機能の初期テーブル作成".to_string(),
            up_sql: include_str!("migrations/001_create_player_note_tables.sql").to_string(),
            down_sql: include_str!("migrations/001_create_player_note_tables_down.sql").to_string(),
            applied_at: None,
        });

        // Migration 2: インデックス追加（将来的な拡張例）
        self.add_migration(Migration {
            version: 2,
            name: "add_performance_indexes".to_string(),
            description: "パフォーマンス向上のための追加インデックス".to_string(),
            up_sql: include_str!("migrations/002_add_performance_indexes.sql").to_string(),
            down_sql: include_str!("migrations/002_add_performance_indexes_down.sql").to_string(),
            applied_at: None,
        });

        // Migration 3: Rich Text Support for Player Notes (TASK-0511)
        self.add_migration(Migration {
            version: 3,
            name: "update_player_notes_for_rich_text".to_string(),
            description: "TASK-0511: リッチテキストメモAPI実装 - プレイヤーノートテーブルの拡張".to_string(),
            up_sql: include_str!("migrations/003_update_player_notes_for_rich_text.sql").to_string(),
            down_sql: include_str!("migrations/003_update_player_notes_for_rich_text_down.sql").to_string(),
            applied_at: None,
        });
    }

    // マイグレーション追加
    pub fn add_migration(&mut self, migration: Migration) {
        self.migrations.insert(migration.version, migration);
    }

    // マイグレーション管理テーブルの初期化
    pub fn init_migration_table(&self, conn: &Connection) -> SqliteResult<()> {
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                checksum TEXT
            )
            "#,
            [],
        )?;
        Ok(())
    }

    // 現在のマイグレーションバージョンを取得
    pub fn get_current_version(&self, conn: &Connection) -> SqliteResult<i32> {
        let mut stmt = conn.prepare("SELECT MAX(version) FROM schema_migrations")?;

        let version: Option<i32> = stmt.query_row([], |row| row.get(0)).unwrap_or(Some(0));
        Ok(version.unwrap_or(0))
    }

    // 適用済みマイグレーションを取得
    pub fn get_applied_migrations(&self, conn: &Connection) -> SqliteResult<Vec<Migration>> {
        let mut stmt = conn.prepare(
            "SELECT version, name, description, applied_at FROM schema_migrations ORDER BY version",
        )?;

        let migration_iter = stmt.query_map([], |row| {
            Ok(Migration {
                version: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                up_sql: String::new(),   // 履歴からは取得不要
                down_sql: String::new(), // 履歴からは取得不要
                applied_at: row.get(3)?,
            })
        })?;

        let mut migrations = Vec::new();
        for migration in migration_iter {
            migrations.push(migration?);
        }

        Ok(migrations)
    }

    // 保留中のマイグレーションを取得
    pub fn get_pending_migrations(&self, conn: &Connection) -> SqliteResult<Vec<Migration>> {
        let current_version = self.get_current_version(conn)?;
        let mut pending = Vec::new();

        for (version, migration) in &self.migrations {
            if *version > current_version {
                pending.push(migration.clone());
            }
        }

        pending.sort_by_key(|m| m.version);
        Ok(pending)
    }

    // マイグレーション状態を取得
    pub fn get_migration_status(&self, conn: &Connection) -> SqliteResult<MigrationStatus> {
        let current_version = self.get_current_version(conn)?;
        let applied_migrations = self.get_applied_migrations(conn)?;
        let pending_migrations = self.get_pending_migrations(conn)?;

        let available_migrations: Vec<Migration> = self.migrations.values().cloned().collect();

        Ok(MigrationStatus {
            current_version,
            available_migrations,
            pending_migrations,
            applied_migrations,
        })
    }

    // マイグレーション実行
    pub fn migrate(&self, conn: &Connection) -> Result<Vec<MigrationResult>, MigrationError> {
        self.init_migration_table(conn)
            .map_err(|e| MigrationError::DatabaseError(e.to_string()))?;

        let pending = self
            .get_pending_migrations(conn)
            .map_err(|e| MigrationError::DatabaseError(e.to_string()))?;

        let mut results = Vec::new();

        for migration in pending {
            let result = self.apply_migration(conn, &migration)?;
            results.push(result);
        }

        Ok(results)
    }

    // 特定バージョンまでのマイグレーション実行
    pub fn migrate_to(
        &self,
        conn: &Connection,
        target_version: i32,
    ) -> Result<Vec<MigrationResult>, MigrationError> {
        self.init_migration_table(conn)
            .map_err(|e| MigrationError::DatabaseError(e.to_string()))?;

        let current_version = self
            .get_current_version(conn)
            .map_err(|e| MigrationError::DatabaseError(e.to_string()))?;

        let mut results = Vec::new();

        if target_version > current_version {
            // アップマイグレーション
            for version in (current_version + 1)..=target_version {
                if let Some(migration) = self.migrations.get(&version) {
                    let result = self.apply_migration(conn, migration)?;
                    results.push(result);
                } else {
                    return Err(MigrationError::MigrationNotFound(format!(
                        "Migration version {} not found",
                        version
                    )));
                }
            }
        } else if target_version < current_version {
            // ダウンマイグレーション（ロールバック）
            for version in ((target_version + 1)..=current_version).rev() {
                if let Some(migration) = self.migrations.get(&version) {
                    let result = self.rollback_migration(conn, migration)?;
                    results.push(result);
                } else {
                    return Err(MigrationError::MigrationNotFound(format!(
                        "Migration version {} not found",
                        version
                    )));
                }
            }
        }

        Ok(results)
    }

    // 単一マイグレーションの適用
    fn apply_migration(
        &self,
        conn: &Connection,
        migration: &Migration,
    ) -> Result<MigrationResult, MigrationError> {
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| MigrationError::DatabaseError(e.to_string()))?;

        // SQLを実行
        match tx.execute_batch(&migration.up_sql) {
            Ok(_) => {
                // マイグレーション履歴を記録
                tx.execute(
                    "INSERT INTO schema_migrations (version, name, description) VALUES (?1, ?2, ?3)",
                    params![migration.version, migration.name, migration.description],
                ).map_err(|e| MigrationError::DatabaseError(e.to_string()))?;

                // トランザクションをコミット
                tx.commit()
                    .map_err(|e| MigrationError::DatabaseError(e.to_string()))?;

                Ok(MigrationResult {
                    success: true,
                    version: migration.version,
                    name: migration.name.clone(),
                    message: format!("Migration {} applied successfully", migration.version),
                    executed_at: chrono::Utc::now().to_rfc3339(),
                })
            }
            Err(e) => {
                // ロールバック（自動的に実行される）
                Err(MigrationError::DatabaseError(format!(
                    "Failed to apply migration {}: {}",
                    migration.version, e
                )))
            }
        }
    }

    // 単一マイグレーションのロールバック
    fn rollback_migration(
        &self,
        conn: &Connection,
        migration: &Migration,
    ) -> Result<MigrationResult, MigrationError> {
        if migration.down_sql.trim().is_empty() {
            return Err(MigrationError::RollbackNotSupported(format!(
                "Migration {} does not support rollback",
                migration.version
            )));
        }

        let tx = conn
            .unchecked_transaction()
            .map_err(|e| MigrationError::DatabaseError(e.to_string()))?;

        // ロールバックSQLを実行
        match tx.execute_batch(&migration.down_sql) {
            Ok(_) => {
                // マイグレーション履歴から削除
                tx.execute(
                    "DELETE FROM schema_migrations WHERE version = ?1",
                    params![migration.version],
                )
                .map_err(|e| MigrationError::DatabaseError(e.to_string()))?;

                // トランザクションをコミット
                tx.commit()
                    .map_err(|e| MigrationError::DatabaseError(e.to_string()))?;

                Ok(MigrationResult {
                    success: true,
                    version: migration.version,
                    name: migration.name.clone(),
                    message: format!("Migration {} rolled back successfully", migration.version),
                    executed_at: chrono::Utc::now().to_rfc3339(),
                })
            }
            Err(e) => {
                // ロールバック（自動的に実行される）
                Err(MigrationError::DatabaseError(format!(
                    "Failed to rollback migration {}: {}",
                    migration.version, e
                )))
            }
        }
    }

    // データベース整合性チェック
    pub fn check_integrity(&self, conn: &Connection) -> SqliteResult<bool> {
        // 外部キー制約チェック
        let mut stmt = conn.prepare("PRAGMA foreign_key_check")?;
        let violations: Vec<String> = stmt
            .query_map([], |row| Ok(format!("{:?}", row)))?
            .collect::<SqliteResult<Vec<String>>>()?;

        if !violations.is_empty() {
            eprintln!("Foreign key violations found: {:?}", violations);
            return Ok(false);
        }

        // テーブル整合性チェック
        let mut stmt = conn.prepare("PRAGMA integrity_check")?;
        let result: String = stmt.query_row([], |row| row.get(0))?;

        Ok(result == "ok")
    }
}

impl Default for MigrationManager {
    fn default() -> Self {
        Self::new()
    }
}
