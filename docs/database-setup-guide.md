# データベースセットアップガイド

## 概要

本ドキュメントは、Sapphireアプリケーションのデータベースセットアップと管理について説明します。
PlayerNote機能に必要なテーブル構造、マイグレーション手順、およびデータベース管理のベストプラクティスを記載しています。

## データベース構成

### 使用技術
- **データベース**: SQLite 3.x
- **ORM/クエリビルダー**: SQLx（Rust）
- **マイグレーション**: SQLx Migrations
- **ファイル配置**: アプリケーションデータディレクトリ

### データベースファイルの場所

| OS | パス |
|----|----|
| Windows | `%APPDATA%\com.sapphire.app\sapphire.db` |
| macOS | `~/Library/Application Support/com.sapphire.app/sapphire.db` |
| Linux | `~/.local/share/com.sapphire.app/sapphire.db` |

## マイグレーション管理

### ディレクトリ構造

```
src-tauri/
├── migrations/
│   ├── 20240101000001_initial_setup.sql
│   ├── 20240115000001_create_playernote_tables.sql
│   └── 20240201000001_add_indexes.sql
├── src/
│   ├── database.rs
│   ├── migrations.rs
│   └── main.rs
└── Cargo.toml
```

### マイグレーションファイルの命名規則

```
YYYYMMDDHHMMSS_description.sql
```

例:
- `20240115143000_create_playernote_tables.sql`
- `20240116090000_add_player_indexes.sql`

## 初期セットアップ

### 1. 依存関係の追加

`src-tauri/Cargo.toml`:

```toml
[dependencies]
sqlx = { version = "0.7", features = [
    "runtime-tokio-rustls",
    "sqlite",
    "migrate",
    "chrono",
    "uuid"
] }
tokio = { version = "1.0", features = ["full"] }
chrono = { version = "0.4", features = ["serde"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### 2. データベース初期化コード

`src-tauri/src/database.rs`:

```rust
use sqlx::{sqlite::SqlitePool, Pool, Sqlite, migrate::MigrateDatabase};
use std::path::PathBuf;
use tauri::Manager;

pub type DbPool = Pool<Sqlite>;

pub async fn initialize_database(app_handle: &tauri::AppHandle) -> Result<DbPool, sqlx::Error> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .expect("failed to resolve app data directory");

    std::fs::create_dir_all(&app_dir).expect("failed to create app data directory");

    let database_path = app_dir.join("sapphire.db");
    let database_url = format!("sqlite:{}", database_path.display());

    // データベースが存在しない場合は作成
    if !Sqlite::database_exists(&database_url).await.unwrap_or(false) {
        println!("Creating database {}", database_url);
        Sqlite::create_database(&database_url).await?;
    }

    let pool = SqlitePool::connect(&database_url).await?;

    // マイグレーション実行
    println!("Running migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    println!("Migrations completed successfully");

    Ok(pool)
}

// データベースの健全性チェック
pub async fn health_check(pool: &DbPool) -> Result<bool, sqlx::Error> {
    let result: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
        .fetch_one(pool)
        .await?;

    Ok(result.0 > 0)
}
```

## PlayerNote機能のマイグレーション

### マイグレーションファイル: `migrations/20240115000001_create_playernote_tables.sql`

```sql
-- PlayerNote機能用テーブル作成

-- ラベルテーブル
CREATE TABLE IF NOT EXISTS labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL CHECK (color LIKE '#%' AND length(color) = 7),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- タグテーブル
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL CHECK (color LIKE '#%' AND length(color) = 7),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- プレイヤーテーブル
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    label_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE SET NULL
);

-- プレイヤー-タグ関連テーブル（多対多）
CREATE TABLE IF NOT EXISTS player_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(player_id, tag_id)
);

-- ノートテーブル
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- updated_atを自動更新するトリガー
CREATE TRIGGER IF NOT EXISTS update_labels_updated_at
    AFTER UPDATE ON labels
    FOR EACH ROW
    BEGIN
        UPDATE labels SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_tags_updated_at
    AFTER UPDATE ON tags
    FOR EACH ROW
    BEGIN
        UPDATE tags SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_players_updated_at
    AFTER UPDATE ON players
    FOR EACH ROW
    BEGIN
        UPDATE players SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_notes_updated_at
    AFTER UPDATE ON notes
    FOR EACH ROW
    BEGIN
        UPDATE notes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
```

### インデックス追加マイグレーション: `migrations/20240116000001_add_indexes.sql`

```sql
-- パフォーマンス向上のためのインデックス作成

-- プレイヤー名での検索を高速化
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name COLLATE NOCASE);

-- ラベルでのフィルタリングを高速化
CREATE INDEX IF NOT EXISTS idx_players_label_id ON players(label_id);

-- プレイヤー-タグ関連の検索を高速化
CREATE INDEX IF NOT EXISTS idx_player_tags_player_id ON player_tags(player_id);
CREATE INDEX IF NOT EXISTS idx_player_tags_tag_id ON player_tags(tag_id);

-- ノート検索を高速化
CREATE INDEX IF NOT EXISTS idx_notes_player_id ON notes(player_id);

-- 作成日時・更新日時での並び替えを高速化
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at);
CREATE INDEX IF NOT EXISTS idx_players_updated_at ON players(updated_at);
```

### サンプルデータ挿入: `migrations/20240117000001_insert_sample_data.sql`

```sql
-- 開発用サンプルデータ（本番環境では実行しない）

-- サンプルラベル
INSERT OR IGNORE INTO labels (name, color, description) VALUES
('TAG', '#3498DB', 'タイトアグレッシブプレイヤー'),
('LAG', '#E74C3C', 'ルースアグレッシブプレイヤー'),
('NIT', '#95A5A6', '非常にタイトなプレイヤー'),
('FISH', '#F39C12', '初心者プレイヤー');

-- サンプルタグ
INSERT OR IGNORE INTO tags (name, color, description) VALUES
('アグレッシブ', '#E74C3C', '積極的なプレイスタイル'),
('パッシブ', '#3498DB', '受動的なプレイスタイル'),
('ブラフ多用', '#9B59B6', 'ブラフを頻繁に使用'),
('コール多用', '#2ECC71', 'コールを多用する傾向'),
('ポジション重視', '#F1C40F', 'ポジションを重視'),
('マニアック', '#E67E22', '予測困難な行動');
```

## データベース運用

### バックアップ手順

#### 自動バックアップスクリプト（Rust）

`src-tauri/src/backup.rs`:

```rust
use std::fs;
use std::path::PathBuf;
use chrono::Utc;
use tauri::Manager;

pub async fn create_backup(app_handle: &tauri::AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("failed to resolve app data directory")?;

    let db_path = app_dir.join("sapphire.db");
    let backup_dir = app_dir.join("backups");

    fs::create_dir_all(&backup_dir)?;

    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let backup_path = backup_dir.join(format!("sapphire_backup_{}.db", timestamp));

    fs::copy(&db_path, &backup_path)?;

    // 古いバックアップを削除（最新の10個を保持）
    cleanup_old_backups(&backup_dir)?;

    Ok(backup_path)
}

fn cleanup_old_backups(backup_dir: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let mut entries: Vec<_> = fs::read_dir(backup_dir)?
        .filter_map(Result::ok)
        .filter(|entry| {
            entry.path().extension()
                .and_then(|ext| ext.to_str())
                .map_or(false, |ext| ext == "db")
        })
        .collect();

    // 作成日時でソート（新しい順）
    entries.sort_by_key(|entry| {
        entry.metadata()
            .and_then(|meta| meta.created())
            .unwrap_or(std::time::UNIX_EPOCH)
    });
    entries.reverse();

    // 最新の10個を残して削除
    for entry in entries.iter().skip(10) {
        fs::remove_file(entry.path())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn backup_database(app_handle: tauri::AppHandle) -> Result<String, String> {
    match create_backup(&app_handle).await {
        Ok(path) => Ok(path.to_string_lossy().to_string()),
        Err(e) => Err(e.to_string())
    }
}
```

### リストア手順

#### データベースリストア機能

`src-tauri/src/restore.rs`:

```rust
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[tauri::command]
pub async fn restore_database(
    app_handle: tauri::AppHandle,
    backup_path: String
) -> Result<(), String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("failed to resolve app data directory")?;

    let db_path = app_dir.join("sapphire.db");
    let backup_file = PathBuf::from(backup_path);

    if !backup_file.exists() {
        return Err("バックアップファイルが見つかりません".to_string());
    }

    // 現在のデータベースをバックアップ
    let current_backup = format!("sapphire_pre_restore_{}.db",
        chrono::Utc::now().format("%Y%m%d_%H%M%S"));
    let current_backup_path = app_dir.join("backups").join(current_backup);

    if db_path.exists() {
        fs::copy(&db_path, &current_backup_path)
            .map_err(|e| format!("現在のDBのバックアップに失敗: {}", e))?;
    }

    // バックアップからリストア
    fs::copy(&backup_file, &db_path)
        .map_err(|e| format!("リストアに失敗: {}", e))?;

    Ok(())
}
```

### データベースメンテナンス

#### VACUUM コマンド実行

`src-tauri/src/maintenance.rs`:

```rust
use crate::database::DbPool;

#[tauri::command]
pub async fn vacuum_database(pool: tauri::State<'_, DbPool>) -> Result<(), String> {
    sqlx::query("VACUUM")
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    println!("Database vacuum completed");
    Ok(())
}

#[tauri::command]
pub async fn analyze_database(pool: tauri::State<'_, DbPool>) -> Result<(), String> {
    sqlx::query("ANALYZE")
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    println!("Database analyze completed");
    Ok(())
}

// データベース統計情報取得
#[tauri::command]
pub async fn get_database_stats(pool: tauri::State<'_, DbPool>) -> Result<DatabaseStats, String> {
    let stats = sqlx::query_as::<_, DatabaseStats>(r#"
        SELECT
            (SELECT COUNT(*) FROM players) as player_count,
            (SELECT COUNT(*) FROM labels) as label_count,
            (SELECT COUNT(*) FROM tags) as tag_count,
            (SELECT COUNT(*) FROM notes WHERE content != '') as note_count,
            (SELECT page_count * page_size FROM pragma_page_count(), pragma_page_size()) as db_size
    "#)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(stats)
}

#[derive(serde::Serialize, sqlx::FromRow)]
pub struct DatabaseStats {
    pub player_count: i64,
    pub label_count: i64,
    pub tag_count: i64,
    pub note_count: i64,
    pub db_size: i64,
}
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. マイグレーションエラー

**エラー**: `migration failed: table already exists`

**解決方法**:
```sql
-- IF NOT EXISTSを使用
CREATE TABLE IF NOT EXISTS table_name (...);
```

#### 2. 外部キー制約エラー

**エラー**: `FOREIGN KEY constraint failed`

**解決方法**:
```rust
// 外部キー制約を有効にする
sqlx::query("PRAGMA foreign_keys = ON")
    .execute(&pool)
    .await?;
```

#### 3. データベースファイルの権限エラー

**エラー**: `permission denied`

**解決方法**:
- アプリケーションデータディレクトリの権限を確認
- ウイルス対策ソフトウェアの除外設定を確認

#### 4. 文字エンコーディングの問題

**解決方法**:
```rust
// UTF-8エンコーディングを明示的に設定
sqlx::query("PRAGMA encoding = 'UTF-8'")
    .execute(&pool)
    .await?;
```

### デバッグ用クエリ

#### テーブル情報の確認

```sql
-- テーブル一覧
SELECT name FROM sqlite_master WHERE type='table';

-- 特定テーブルの構造確認
PRAGMA table_info(players);

-- インデックス一覧
SELECT * FROM sqlite_master WHERE type='index';

-- 外部キー制約の確認
PRAGMA foreign_key_list(players);
```

#### データ整合性チェック

```sql
-- 孤立したプレイヤータグの確認
SELECT pt.* FROM player_tags pt
LEFT JOIN players p ON pt.player_id = p.id
WHERE p.id IS NULL;

-- 孤立したノートの確認
SELECT n.* FROM notes n
LEFT JOIN players p ON n.player_id = p.id
WHERE p.id IS NULL;
```

## セキュリティ考慮事項

### データベース暗号化

`src-tauri/Cargo.toml`に暗号化機能を追加:

```toml
[dependencies]
sqlcipher = "0.4"  # SQLite暗号化
```

### アクセス制御

```rust
// データベースファイルの権限設定
use std::os::unix::fs::PermissionsExt;

fn set_database_permissions(db_path: &PathBuf) -> std::io::Result<()> {
    let mut perms = fs::metadata(db_path)?.permissions();
    perms.set_mode(0o600);  // 所有者のみ読み書き可能
    fs::set_permissions(db_path, perms)?;
    Ok(())
}
```

## パフォーマンス最適化

### 推奨設定

```sql
-- WALモード（書き込み時も読み込み可能）
PRAGMA journal_mode = WAL;

-- 同期モード最適化
PRAGMA synchronous = NORMAL;

-- キャッシュサイズ増加（10MB）
PRAGMA cache_size = -10240;

-- 外部キー制約有効化
PRAGMA foreign_keys = ON;

-- 自動バキュームモード
PRAGMA auto_vacuum = INCREMENTAL;
```

### 定期メンテナンススクリプト

```rust
pub async fn perform_maintenance(pool: &DbPool) -> Result<(), sqlx::Error> {
    // WALファイルのチェックポイント
    sqlx::query("PRAGMA wal_checkpoint(TRUNCATE)")
        .execute(pool)
        .await?;

    // インクリメンタルバキューム
    sqlx::query("PRAGMA incremental_vacuum")
        .execute(pool)
        .await?;

    // 統計情報の更新
    sqlx::query("ANALYZE")
        .execute(pool)
        .await?;

    Ok(())
}
```

---

このガイドに従うことで、PlayerNote機能に必要なデータベース環境を適切にセットアップし、運用することができます。