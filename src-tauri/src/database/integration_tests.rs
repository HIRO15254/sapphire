#[cfg(test)]
mod integration_tests {
    use super::super::PlayerDatabase;
    use rusqlite::params;

    #[test]
    fn test_database_initialization() {
        // テスト用データベースを作成
        let db = PlayerDatabase::new_test().expect("Failed to create test database");
        let conn = db.0.lock().unwrap();

        // 7つのテーブルが作成されていることを確認
        let table_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN
                ('players', 'player_categories', 'tags', 'player_tags', 'player_notes', 'player_summaries', 'summary_templates')",
                [],
                |row| row.get(0),
            )
            .expect("Failed to count tables");

        assert_eq!(table_count, 7, "Expected 7 tables to be created");
    }

    #[test]
    fn test_template_default_value() {
        let db = PlayerDatabase::new_test().expect("Failed to create test database");
        let conn = db.0.lock().unwrap();

        // テンプレートのデフォルト値が挿入されていることを確認
        let template_exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM summary_templates WHERE id = 1",
                [],
                |row| row.get(0),
            )
            .expect("Failed to query template");

        assert_eq!(template_exists, 1, "Default template should exist");
    }

    #[test]
    fn test_player_category_crud() {
        let db = PlayerDatabase::new_test().expect("Failed to create test database");
        let conn = db.0.lock().unwrap();

        // カテゴリを挿入
        conn.execute(
            "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
            params!["テストカテゴリ", "#FF0000"],
        )
        .expect("Failed to insert category");

        // カテゴリを取得
        let (name, color): (String, String) = conn
            .query_row(
                "SELECT name, color FROM player_categories WHERE id = 1",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .expect("Failed to query category");

        assert_eq!(name, "テストカテゴリ");
        assert_eq!(color, "#FF0000");
    }

    #[test]
    fn test_player_with_foreign_key() {
        let db = PlayerDatabase::new_test().expect("Failed to create test database");
        let conn = db.0.lock().unwrap();

        // カテゴリを作成
        conn.execute(
            "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
            params!["カテゴリ1", "#00FF00"],
        )
        .expect("Failed to insert category");

        // プレイヤーを作成（外部キー参照）
        conn.execute(
            "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
            params!["テストプレイヤー", 1],
        )
        .expect("Failed to insert player");

        // プレイヤーとカテゴリをJOIN
        let (player_name, category_name): (String, String) = conn
            .query_row(
                "SELECT p.name, c.name FROM players p
                 JOIN player_categories c ON p.category_id = c.id
                 WHERE p.id = 1",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .expect("Failed to query player with category");

        assert_eq!(player_name, "テストプレイヤー");
        assert_eq!(category_name, "カテゴリ1");
    }

    #[test]
    fn test_cascade_delete() {
        let db = PlayerDatabase::new_test().expect("Failed to create test database");
        let conn = db.0.lock().unwrap();

        // プレイヤーを作成
        conn.execute(
            "INSERT INTO players (name) VALUES (?1)",
            params!["削除テストプレイヤー"],
        )
        .expect("Failed to insert player");

        // メモを作成
        conn.execute(
            "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
            params![1, "テストメモ"],
        )
        .expect("Failed to insert note");

        // プレイヤーを削除（CASCADE削除を確認）
        conn.execute("DELETE FROM players WHERE id = 1", [])
            .expect("Failed to delete player");

        // メモも削除されていることを確認
        let note_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM player_notes WHERE player_id = 1",
                [],
                |row| row.get(0),
            )
            .expect("Failed to count notes");

        assert_eq!(note_count, 0, "Notes should be cascade deleted");
    }
}
