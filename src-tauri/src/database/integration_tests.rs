use super::PlayerDatabase;
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

#[test]
fn test_fts5_tables_created() {
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // FTS5仮想テーブルが作成されていることを確認
    let fts_table_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN
            ('player_notes_fts', 'player_summaries_fts')",
            [],
            |row| row.get(0),
        )
        .expect("Failed to count FTS tables");

    assert_eq!(fts_table_count, 2, "Expected 2 FTS5 tables to be created");
}

#[test]
fn test_fts5_japanese_search() {
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // プレイヤーを作成
    conn.execute(
        "INSERT INTO players (name) VALUES (?1)",
        params!["テストプレイヤー"],
    )
    .expect("Failed to insert player");

    // 日本語メモを作成（トリガーで自動的にFTSテーブルに追加される）
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![
            1,
            "これは日本語のテストメモです。キーワード検索ができます。"
        ],
    )
    .expect("Failed to insert note");

    // 日本語キーワードで検索
    let search_result: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH '日本語'",
            [],
            |row| row.get(0),
        )
        .expect("Failed to search Japanese text");

    assert_eq!(
        search_result, 1,
        "Japanese keyword search should return 1 result"
    );

    // 別のキーワードで検索
    let search_result2: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH 'キーワード'",
            [],
            |row| row.get(0),
        )
        .expect("Failed to search Japanese text");

    assert_eq!(
        search_result2, 1,
        "Japanese keyword search should return 1 result"
    );

    // 存在しないキーワードで検索
    let search_result3: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH '存在しない'",
            [],
            |row| row.get(0),
        )
        .expect("Failed to search Japanese text");

    assert_eq!(
        search_result3, 0,
        "Non-existent keyword should return 0 results"
    );
}

#[test]
fn test_fts5_trigger_insert() {
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // プレイヤーを作成
    conn.execute(
        "INSERT INTO players (name) VALUES (?1)",
        params!["トリガーテストプレイヤー"],
    )
    .expect("Failed to insert player");

    // メモを挿入（トリガーでFTSテーブルに自動追加される）
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![1, "トリガーによる自動追加テスト"],
    )
    .expect("Failed to insert note");

    // FTSテーブルにエントリが追加されていることを確認
    let fts_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE note_id = 1",
            [],
            |row| row.get(0),
        )
        .expect("Failed to count FTS entries");

    assert_eq!(fts_count, 1, "Trigger should insert entry into FTS table");
}

#[test]
fn test_fts5_trigger_update() {
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // プレイヤーとメモを作成
    conn.execute(
        "INSERT INTO players (name) VALUES (?1)",
        params!["更新テストプレイヤー"],
    )
    .expect("Failed to insert player");

    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![1, "元のメモ内容"],
    )
    .expect("Failed to insert note");

    // メモを更新
    conn.execute(
        "UPDATE player_notes SET content = ?1 WHERE id = 1",
        params!["更新されたメモ内容"],
    )
    .expect("Failed to update note");

    // FTSテーブルも更新されていることを確認
    let updated_content: String = conn
        .query_row(
            "SELECT content FROM player_notes_fts WHERE note_id = 1",
            [],
            |row| row.get(0),
        )
        .expect("Failed to query FTS content");

    assert_eq!(
        updated_content, "更新されたメモ内容",
        "Trigger should update FTS entry"
    );

    // 検索が新しい内容で動作することを確認
    let search_result: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH '更新された'",
            [],
            |row| row.get(0),
        )
        .expect("Failed to search updated content");

    assert_eq!(search_result, 1, "Search should find updated content");
}

#[test]
fn test_fts5_trigger_delete() {
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // プレイヤーとメモを作成
    conn.execute(
        "INSERT INTO players (name) VALUES (?1)",
        params!["削除テストプレイヤー"],
    )
    .expect("Failed to insert player");

    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![1, "削除されるメモ"],
    )
    .expect("Failed to insert note");

    // メモを削除
    conn.execute("DELETE FROM player_notes WHERE id = 1", [])
        .expect("Failed to delete note");

    // FTSテーブルからもエントリが削除されていることを確認
    let fts_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE note_id = 1",
            [],
            |row| row.get(0),
        )
        .expect("Failed to count FTS entries");

    assert_eq!(fts_count, 0, "Trigger should delete entry from FTS table");
}

#[test]
fn test_fts5_summaries_trigger() {
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // プレイヤーを作成
    conn.execute(
        "INSERT INTO players (name) VALUES (?1)",
        params!["総合メモテストプレイヤー"],
    )
    .expect("Failed to insert player");

    // 総合メモを挿入
    conn.execute(
        "INSERT INTO player_summaries (player_id, content) VALUES (?1, ?2)",
        params![1, "総合メモの内容です。全文検索が可能です。"],
    )
    .expect("Failed to insert summary");

    // FTSテーブルに追加されていることを確認
    let fts_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries_fts WHERE summary_id = 1",
            [],
            |row| row.get(0),
        )
        .expect("Failed to count FTS entries");

    assert_eq!(
        fts_count, 1,
        "Trigger should insert entry into summaries FTS table"
    );

    // 日本語検索が動作することを確認
    let search_result: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries_fts WHERE content MATCH '全文検索'",
            [],
            |row| row.get(0),
        )
        .expect("Failed to search summary");

    assert_eq!(search_result, 1, "Japanese search should work on summaries");

    // 更新テスト
    conn.execute(
        "UPDATE player_summaries SET content = ?1 WHERE id = 1",
        params!["更新された総合メモ"],
    )
    .expect("Failed to update summary");

    let search_updated: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries_fts WHERE content MATCH '更新された'",
            [],
            |row| row.get(0),
        )
        .expect("Failed to search updated summary");

    assert_eq!(search_updated, 1, "Updated summary should be searchable");

    // 削除テスト
    conn.execute("DELETE FROM player_summaries WHERE id = 1", [])
        .expect("Failed to delete summary");

    let fts_after_delete: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries_fts WHERE summary_id = 1",
            [],
            |row| row.get(0),
        )
        .expect("Failed to count FTS entries after delete");

    assert_eq!(
        fts_after_delete, 0,
        "Trigger should delete entry from summaries FTS table"
    );
}
