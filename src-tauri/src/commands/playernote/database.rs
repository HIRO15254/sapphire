// Player Note Database Helper Functions
// 🔵 青信号: 技術スタック要件に基づくRustバックエンド基盤
//
// アプリケーション全体で共有されるデータベース接続を使用するためのヘルパー関数群
// 独自の接続プールは作成せず、lib.rsのDatabase構造体を利用

use rusqlite::Connection;
use serde::{Serialize, Deserialize};
use crate::commands::playernote::error::{PlayerNoteError, PlayerNoteResult};

/// データベースヘルスチェック
/// 共有データベース接続が正常に動作しているか確認
pub fn health_check(conn: &Connection) -> PlayerNoteResult<bool> {
    let result: i32 = conn
        .prepare("SELECT 1")
        .map_err(|e| PlayerNoteError::from(e))?
        .query_row([], |row| row.get(0))
        .map_err(|e| PlayerNoteError::from(e))?;
    Ok(result == 1)
}

/// Player Note テーブルの存在確認
pub fn check_player_note_tables(conn: &Connection) -> PlayerNoteResult<bool> {
    let table_count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master
             WHERE type='table'
             AND name IN ('players', 'player_types', 'tags', 'player_tags', 'player_notes')",
            [],
            |row| row.get(0)
        )
        .map_err(|e| PlayerNoteError::from(e))?;

    Ok(table_count == 5)  // すべてのテーブルが存在する場合
}

/// データベース統計情報
#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseStats {
    pub player_count: usize,
    pub note_count: usize,
    pub tag_count: usize,
    pub database_size_kb: f64,
}

/// データベース統計を取得
pub fn get_database_stats(conn: &Connection) -> PlayerNoteResult<DatabaseStats> {
    // プレイヤー数
    let player_count: usize = conn
        .query_row("SELECT COUNT(*) FROM players", [], |row| row.get(0))
        .unwrap_or(0);

    // ノート数
    let note_count: usize = conn
        .query_row("SELECT COUNT(*) FROM player_notes", [], |row| row.get(0))
        .unwrap_or(0);

    // タグ数
    let tag_count: usize = conn
        .query_row("SELECT COUNT(*) FROM tags", [], |row| row.get(0))
        .unwrap_or(0);

    // データベースサイズ（KB）
    let page_count: i32 = conn
        .query_row("PRAGMA page_count", [], |row| row.get(0))
        .unwrap_or(0);
    let page_size: i32 = conn
        .query_row("PRAGMA page_size", [], |row| row.get(0))
        .unwrap_or(0);
    let database_size_kb = (page_count as f64 * page_size as f64) / 1024.0;

    Ok(DatabaseStats {
        player_count,
        note_count,
        tag_count,
        database_size_kb,
    })
}

/// SQLiteの最適化設定を適用
/// 既にlib.rsで設定されているが、必要に応じて追加の最適化を行う
pub fn optimize_connection(_conn: &Connection) -> PlayerNoteResult<()> {
    // Player Note特有の最適化設定があればここに記述
    // 現在はlib.rsの設定で十分なので特に追加なし
    Ok(())
}

/// トランザクションヘルパー
/// エラー時に自動的にロールバックを行う
pub fn with_transaction<T, F>(conn: &mut Connection, f: F) -> PlayerNoteResult<T>
where
    F: FnOnce(&Connection) -> PlayerNoteResult<T>,
{
    let tx = conn.transaction().map_err(|e| PlayerNoteError::from(e))?;

    match f(&tx) {
        Ok(result) => {
            tx.commit().map_err(|e| PlayerNoteError::from(e))?;
            Ok(result)
        }
        Err(e) => {
            // トランザクションは自動的にロールバックされる
            Err(e)
        }
    }
}

/// バッチ処理用のヘルパー
/// 複数のSQL文を一括実行
pub fn execute_batch(conn: &Connection, sql: &str) -> PlayerNoteResult<()> {
    conn.execute_batch(sql)
        .map_err(|e| PlayerNoteError::from(e))
}

/// テーブルのVACUUM実行
/// データベースの最適化とディスク容量の節約
pub fn vacuum_database(conn: &Connection) -> PlayerNoteResult<()> {
    conn.execute("VACUUM", [])
        .map_err(|e| PlayerNoteError::from(e))?;
    Ok(())
}

/// テーブルのANALYZE実行
/// クエリオプティマイザのための統計情報更新
pub fn analyze_database(conn: &Connection) -> PlayerNoteResult<()> {
    conn.execute("ANALYZE", [])
        .map_err(|e| PlayerNoteError::from(e))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::{Connection, params};

    #[test]
    fn test_health_check() {
        let conn = Connection::open_in_memory().unwrap();
        assert!(health_check(&conn).unwrap());
    }

    #[test]
    fn test_with_transaction_success() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute("CREATE TABLE test (id INTEGER PRIMARY KEY)", []).unwrap();

        let result = with_transaction(&mut conn, |tx| {
            tx.execute("INSERT INTO test (id) VALUES (?1)", params![1])?;
            Ok(true)
        });

        assert!(result.unwrap());

        let count: i32 = conn.query_row("SELECT COUNT(*) FROM test", [], |row| row.get(0)).unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_with_transaction_rollback() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute("CREATE TABLE test (id INTEGER PRIMARY KEY)", []).unwrap();

        let result = with_transaction(&mut conn, |tx| {
            tx.execute("INSERT INTO test (id) VALUES (?1)", params![1])?;
            Err(PlayerNoteError::Internal {
                message: "Test error".to_string(),
                source: None
            })
        });

        assert!(result.is_err());

        let count: i32 = conn.query_row("SELECT COUNT(*) FROM test", [], |row| row.get(0)).unwrap();
        assert_eq!(count, 0);  // ロールバックされているはず
    }
}