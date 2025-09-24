// Player Note Database Connection Pool
// 🔵 青信号: 技術スタック要件に基づくRustバックエンド基盤

use rusqlite::{Connection, Result as SqliteResult};
use std::sync::{Arc, Mutex};
use std::collections::VecDeque;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};
use std::fs;
use serde::{Serialize, Deserialize};

/// データベース接続プール設定
#[derive(Debug, Clone)]
pub struct PoolConfig {
    pub max_connections: usize,
    pub connection_timeout: Duration,
    pub idle_timeout: Duration,
}

impl Default for PoolConfig {
    fn default() -> Self {
        Self {
            max_connections: 10,
            connection_timeout: Duration::from_secs(30),
            idle_timeout: Duration::from_secs(300), // 5分
        }
    }
}

/// 接続プールエントリ
#[derive(Debug)]
struct PooledConnection {
    connection: Connection,
    last_used: Instant,
}

/// データベース接続プール
pub struct DatabasePool {
    pool: Arc<Mutex<VecDeque<PooledConnection>>>,
    config: PoolConfig,
    db_path: String,
}

impl DatabasePool {
    /// 新しい接続プールを作成
    pub fn new(app_handle: &AppHandle, config: PoolConfig) -> Result<Self, Box<dyn std::error::Error>> {
        let db_path = Self::get_database_path(app_handle)?;

        let pool = DatabasePool {
            pool: Arc::new(Mutex::new(VecDeque::new())),
            config,
            db_path: db_path.clone(),
        };

        // 初期接続を作成してスキーマを初期化
        let initial_conn = Connection::open(&db_path)?;
        crate::Database::create_tables(&initial_conn)?;

        // 初期接続をプールに追加
        {
            let mut pool_guard = pool.pool.lock().unwrap();
            pool_guard.push_back(PooledConnection {
                connection: initial_conn,
                last_used: Instant::now(),
            });
        }

        Ok(pool)
    }

    /// テスト用接続プール
    pub fn new_test() -> Result<Self, Box<dyn std::error::Error>> {
        let config = PoolConfig {
            max_connections: 5,
            ..Default::default()
        };

        let pool = DatabasePool {
            pool: Arc::new(Mutex::new(VecDeque::new())),
            config,
            db_path: ":memory:".to_string(),
        };

        // 初期接続を作成してスキーマを初期化
        let initial_conn = Connection::open(":memory:")?;
        crate::Database::create_tables(&initial_conn)?;

        // 初期接続をプールに追加
        {
            let mut pool_guard = pool.pool.lock().unwrap();
            pool_guard.push_back(PooledConnection {
                connection: initial_conn,
                last_used: Instant::now(),
            });
        }

        Ok(pool)
    }

    /// データベースパスを取得
    fn get_database_path(app_handle: &AppHandle) -> Result<String, Box<dyn std::error::Error>> {
        // テストモードの確認
        if std::env::var("TAURI_TEST_MODE").is_ok() {
            let app_data_dir = app_handle
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data directory: {}", e))?;

            let test_db_dir = app_data_dir.join("test_databases");
            fs::create_dir_all(&test_db_dir)?;

            let test_id = std::env::var("TAURI_TEST_ID").unwrap_or_else(|_| {
                use std::time::{SystemTime, UNIX_EPOCH};
                let timestamp = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_millis();
                format!("test_{}", timestamp)
            });

            let db_path = test_db_dir.join(format!("sapphire_test_{}.db", test_id));
            return Ok(db_path.to_string_lossy().to_string());
        }

        // 本番環境のパス
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;

        fs::create_dir_all(&app_data_dir)?;
        let db_path = app_data_dir.join("sapphire.db");
        Ok(db_path.to_string_lossy().to_string())
    }

    /// 接続を取得
    pub fn get_connection(&self) -> Result<PooledConnection, Box<dyn std::error::Error>> {
        let start_time = Instant::now();

        loop {
            // タイムアウトチェック
            if start_time.elapsed() > self.config.connection_timeout {
                return Err("Connection timeout".into());
            }

            // プールから接続を取得試行
            if let Some(mut conn) = self.try_get_connection()? {
                conn.last_used = Instant::now();
                return Ok(conn);
            }

            // プールが空の場合は新しい接続を作成
            if self.can_create_new_connection()? {
                let new_conn = self.create_new_connection()?;
                return Ok(new_conn);
            }

            // 短時間待機してリトライ
            std::thread::sleep(Duration::from_millis(10));
        }
    }

    /// プールから接続を取得を試行
    fn try_get_connection(&self) -> SqliteResult<Option<PooledConnection>> {
        let mut pool_guard = self.pool.lock().unwrap();

        // 古い接続をクリーンアップ
        let now = Instant::now();
        pool_guard.retain(|conn| {
            now.duration_since(conn.last_used) < self.config.idle_timeout
        });

        // 利用可能な接続を返却
        Ok(pool_guard.pop_front())
    }

    /// 新しい接続を作成可能かチェック
    fn can_create_new_connection(&self) -> SqliteResult<bool> {
        let pool_guard = self.pool.lock().unwrap();
        Ok(pool_guard.len() < self.config.max_connections)
    }

    /// 新しい接続を作成
    fn create_new_connection(&self) -> Result<PooledConnection, Box<dyn std::error::Error>> {
        let conn = Connection::open(&self.db_path)?;

        // SQLiteの最適化設定
        conn.execute_batch(r#"
            PRAGMA foreign_keys = ON;
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA cache_size = -64000;
            PRAGMA temp_store = MEMORY;
        "#)?;

        Ok(PooledConnection {
            connection: conn,
            last_used: Instant::now(),
        })
    }

    /// 接続を返却
    pub fn return_connection(&self, conn: PooledConnection) {
        let mut pool_guard = self.pool.lock().unwrap();

        // プールが満杯でない場合のみ返却
        if pool_guard.len() < self.config.max_connections {
            pool_guard.push_back(conn);
        }
        // 満杯の場合は接続を破棄（デストラクタが自動実行）
    }

    /// プール統計を取得
    pub fn get_stats(&self) -> PoolStats {
        let pool_guard = self.pool.lock().unwrap();
        let now = Instant::now();

        let active_connections = pool_guard.len();
        let idle_connections = pool_guard.iter()
            .filter(|conn| now.duration_since(conn.last_used) < self.config.idle_timeout)
            .count();

        PoolStats {
            total_connections: active_connections,
            idle_connections,
            max_connections: self.config.max_connections,
        }
    }
}

/// プール統計情報
#[derive(Debug, Serialize, Deserialize)]
pub struct PoolStats {
    pub total_connections: usize,
    pub idle_connections: usize,
    pub max_connections: usize,
}

/// 接続ラッパー（RAII pattern）
pub struct DatabaseConnection {
    connection: Option<PooledConnection>,
    pool: Arc<Mutex<VecDeque<PooledConnection>>>,
}

impl DatabaseConnection {
    pub fn new(conn: PooledConnection, pool: Arc<Mutex<VecDeque<PooledConnection>>>) -> Self {
        Self {
            connection: Some(conn),
            pool,
        }
    }

    /// 内部接続への参照を取得
    pub fn as_ref(&self) -> &Connection {
        &self.connection.as_ref().unwrap().connection
    }

    /// 内部接続への可変参照を取得
    pub fn as_mut(&mut self) -> &mut Connection {
        &mut self.connection.as_mut().unwrap().connection
    }
}

impl Drop for DatabaseConnection {
    fn drop(&mut self) {
        if let Some(conn) = self.connection.take() {
            let mut pool_guard = self.pool.lock().unwrap();
            pool_guard.push_back(conn);
        }
    }
}

/// データベースマネージャー（接続プールラッパー）
pub struct DatabaseManager {
    pool: DatabasePool,
}

impl DatabaseManager {
    /// 新しいデータベースマネージャーを作成
    pub fn new(app_handle: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let config = PoolConfig::default();
        let pool = DatabasePool::new(app_handle, config)?;

        Ok(DatabaseManager { pool })
    }

    /// テスト用マネージャー
    pub fn new_test() -> Result<Self, Box<dyn std::error::Error>> {
        let pool = DatabasePool::new_test()?;
        Ok(DatabaseManager { pool })
    }

    /// データベース接続を取得
    pub fn get_connection(&self) -> Result<DatabaseConnection, Box<dyn std::error::Error>> {
        let conn = self.pool.get_connection()?;
        Ok(DatabaseConnection::new(conn, self.pool.pool.clone()))
    }

    /// プール統計を取得
    pub fn get_pool_stats(&self) -> PoolStats {
        self.pool.get_stats()
    }

    /// ヘルスチェック
    pub fn health_check(&self) -> Result<bool, Box<dyn std::error::Error>> {
        let mut conn = self.get_connection()?;
        let result: i32 = conn.as_mut().prepare("SELECT 1")?.query_row([], |row| row.get(0))?;
        Ok(result == 1)
    }
}