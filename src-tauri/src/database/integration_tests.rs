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

// ============================================
// プレイヤー-種別関連付けテスト
// ============================================

#[test]
fn test_player_category_one_to_one_assignment() {
    // 【テスト目的】: プレイヤーと種別の1対1関連付けの基本動作を確認
    // 【テスト内容】: プレイヤー作成時に種別を割り当て、正しく保存されることを検証
    // 【期待される動作】: プレイヤーのcategory_idが指定した種別IDと一致する
    // 🔵 信頼性レベル: REQ-104、schema.rs:15に基づく

    // 【テストデータ準備】: 実際のユーザーが種別を設定してプレイヤーを登録するシナリオを再現
    // 【初期条件設定】: テスト用データベースを初期化し、クリーンな状態を確保
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // 【前提条件確認】: 種別が正しく作成されていることを確認
    // 【実際の処理実行】: 種別「タイト」を作成
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["タイト", "#FF0000"],
    )
    .expect("Failed to insert category");

    // 【実際の処理実行】: プレイヤー作成SQLを実行
    // 【処理内容】: category_id = 1を指定してプレイヤー「山田太郎」を作成
    // 【実行タイミング】: 種別作成直後、外部キー制約を満たす状態で実行
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["山田太郎", 1],
    )
    .expect("Failed to insert player");

    // 【結果検証】: プレイヤー情報を取得し、category_idが正しく設定されているか確認
    // 【期待値確認】: category_id = Some(1)であることを検証
    // 【品質保証】: REQ-104（1プレイヤーに最大1つの種別）を満たすことを保証
    let (name, category_id): (String, Option<i64>) = conn
        .query_row(
            "SELECT name, category_id FROM players WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .expect("Failed to query player");

    // 【検証項目】: プレイヤー名が正しいことを確認
    // 🔵 信頼性レベル: テストデータに基づく
    assert_eq!(name, "山田太郎"); // 【確認内容】: 名前が正しく保存されている

    // 【検証項目】: 種別IDが正しく設定されていることを確認
    // 🔵 信頼性レベル: REQ-104に基づく
    assert_eq!(category_id, Some(1)); // 【確認内容】: category_idが種別IDと一致する
}

#[test]
fn test_player_category_reassignment() {
    // 【テスト目的】: 種別の再割り当て機能が正しく動作することを確認
    // 【テスト内容】: プレイヤーの種別を別の種別に変更し、正しく更新されることを検証
    // 【期待される動作】: UPDATE文で種別IDを変更した際、正しく反映される
    // 🔵 信頼性レベル: REQ-104、既存パターン（integration_tests.rs:66-97）に基づく

    // 【テストデータ準備】: ユーザーがプレイヤーの分類を変更するシナリオを再現
    // 【初期条件設定】: テスト用データベースを初期化
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // 【前提条件確認】: 種別A「タイト」を作成
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["タイト", "#FF0000"],
    )
    .expect("Failed to insert category A");

    // 【前提条件確認】: 種別B「ルース」を作成
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["ルース", "#00FF00"],
    )
    .expect("Failed to insert category B");

    // 【初期データ作成】: プレイヤー「田中一郎」を種別A（id=1）で作成
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["田中一郎", 1],
    )
    .expect("Failed to insert player");

    // 【実際の処理実行】: プレイヤーの種別を種別B（id=2）に変更
    // 【処理内容】: UPDATE文でcategory_idを1から2に変更
    // 【実行タイミング】: 両方の種別が存在する状態で実行
    conn.execute(
        "UPDATE players SET category_id = ?1 WHERE id = ?2",
        params![2, 1],
    )
    .expect("Failed to update player category");

    // 【結果検証】: プレイヤー情報を取得し、category_idが変更されているか確認
    // 【期待値確認】: category_id = Some(2)であることを検証
    let category_id: Option<i64> = conn
        .query_row("SELECT category_id FROM players WHERE id = 1", [], |row| {
            row.get(0)
        })
        .expect("Failed to query player category");

    // 【検証項目】: 種別IDが新しい種別IDに変更されていることを確認
    // 🔵 信頼性レベル: REQ-104に基づく
    assert_eq!(category_id, Some(2)); // 【確認内容】: category_idが種別Bに変更されている
}

#[test]
fn test_player_category_set_null() {
    // 【テスト目的】: 種別の解除機能（category_id = NULL）が正しく動作することを確認
    // 【テスト内容】: プレイヤーの種別をNULLに設定し、種別が解除されることを検証
    // 【期待される動作】: UPDATE文でcategory_id = NULLを設定した際、種別が解除される
    // 🔵 信頼性レベル: schema.rs:15（NULL許可）、REQ-104に基づく

    // 【テストデータ準備】: ユーザーがプレイヤーの種別を「なし」に戻すシナリオを再現
    // 【初期条件設定】: テスト用データベースを初期化
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // 【前提条件確認】: 種別「タイト」を作成
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["タイト", "#FF0000"],
    )
    .expect("Failed to insert category");

    // 【初期データ作成】: プレイヤー「佐藤花子」を種別あり（id=1）で作成
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["佐藤花子", 1],
    )
    .expect("Failed to insert player");

    // 【実際の処理実行】: プレイヤーの種別をNULLに設定
    // 【処理内容】: UPDATE文でcategory_idをNULLに変更
    // 【実行タイミング】: 種別が設定されている状態で解除
    conn.execute(
        "UPDATE players SET category_id = NULL WHERE id = ?1",
        params![1],
    )
    .expect("Failed to set category to NULL");

    // 【結果検証】: プレイヤー情報を取得し、category_idがNULLになっているか確認
    // 【期待値確認】: category_id = Noneであることを検証
    let category_id: Option<i64> = conn
        .query_row("SELECT category_id FROM players WHERE id = 1", [], |row| {
            row.get(0)
        })
        .expect("Failed to query player category");

    // 【検証項目】: 種別がNULLに設定されていることを確認
    // 🔵 信頼性レベル: schema.rs:15（NULL許可）に基づく
    assert_eq!(category_id, None); // 【確認内容】: category_idがNoneになっている
}

#[test]
fn test_category_update_affects_all_players() {
    // 【テスト目的】: REQ-502（種別編集時の変更伝播）の実装確認
    // 【テスト内容】: 種別名を編集した際、全プレイヤーから参照される種別情報が更新されることを検証
    // 【期待される動作】: 種別テーブルのnameを更新すると、JOINで取得される種別名も更新される
    // 🔵 信頼性レベル: REQ-502、schema.rs:18（FOREIGN KEY定義）に基づく

    // 【テストデータ準備】: 複数のプレイヤーが同じ種別を使用している実運用シナリオを再現
    // 【初期条件設定】: テスト用データベースを初期化
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // 【前提条件確認】: 種別「タイト」を作成
    // 【初期値設定】: 後で「タイトパッシブ」に変更する前の状態
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["タイト", "#FF0000"],
    )
    .expect("Failed to insert category");

    // 【初期データ作成】: 3人のプレイヤーに同じ種別（id=1）を割り当て
    // 【テスト条件】: 複数プレイヤーが1つの種別を参照する多対1関係を構築
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["A", 1],
    )
    .expect("Failed to insert player A");

    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["B", 1],
    )
    .expect("Failed to insert player B");

    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["C", 1],
    )
    .expect("Failed to insert player C");

    // 【実際の処理実行】: 種別名を「タイト」から「タイトパッシブ」に変更
    // 【処理内容】: UPDATE文で種別テーブルのnameカラムを更新
    // 【実行タイミング】: 3人のプレイヤーが種別を参照している状態で実行
    conn.execute(
        "UPDATE player_categories SET name = ?1 WHERE id = ?2",
        params!["タイトパッシブ", 1],
    )
    .expect("Failed to update category name");

    // 【結果検証】: プレイヤーから種別情報を再取得（JOINで確認）
    // 【期待値確認】: すべてのプレイヤーで種別名が「タイトパッシブ」に更新されている
    // 【品質保証】: REQ-502（種別編集時の変更伝播）を満たすことを保証
    let category_names: Vec<String> = conn
        .prepare(
            "SELECT c.name FROM players p
             JOIN player_categories c ON p.category_id = c.id
             ORDER BY p.id",
        )
        .expect("Failed to prepare statement")
        .query_map([], |row| row.get(0))
        .expect("Failed to query category names")
        .collect::<Result<Vec<_>, _>>()
        .expect("Failed to collect results");

    // 【検証項目】: 3人すべてのプレイヤーが取得されることを確認
    assert_eq!(category_names.len(), 3); // 【確認内容】: 結果セットの件数が3件

    // 【検証項目】: すべてのプレイヤーで種別名が更新されていることを確認
    // 🔵 信頼性レベル: REQ-502に基づく
    assert!(category_names.iter().all(|name| name == "タイトパッシブ"));
    // 【確認内容】: 全プレイヤーに種別編集が反映されている
}

#[test]
fn test_category_delete_sets_players_to_null() {
    // 【テスト目的】: REQ-504, NFR-202（種別削除時の安全な解除）の実装確認
    // 【テスト内容】: 種別を削除した際、関連プレイヤーのcategory_idが自動的にNULLに設定されることを検証
    // 【期待される動作】: ON DELETE SET NULL制約により、種別削除時にcategory_idがNULLになる
    // 🔵 信頼性レベル: REQ-504, NFR-202、schema.rs:18（ON DELETE SET NULL）に基づく

    // 【テストデータ準備】: ユーザーが不要になった種別を削除するシナリオを再現
    // 【初期条件設定】: テスト用データベースを初期化
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // 【前提条件確認】: 種別「アグレッシブ」を作成
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["アグレッシブ", "#0000FF"],
    )
    .expect("Failed to insert category");

    // 【初期データ作成】: 2人のプレイヤーに種別（id=1）を割り当て
    // 【テスト条件】: 複数プレイヤーが削除対象の種別を参照している状態
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["X", 1],
    )
    .expect("Failed to insert player X");

    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["Y", 1],
    )
    .expect("Failed to insert player Y");

    // 【実際の処理実行】: 種別を削除
    // 【処理内容】: DELETE文で種別テーブルからレコードを削除
    // 【実行タイミング】: 2人のプレイヤーが種別を参照している状態で実行
    // 【期待される自動処理】: ON DELETE SET NULL制約により、プレイヤーのcategory_idが自動的にNULLになる
    conn.execute("DELETE FROM player_categories WHERE id = ?1", params![1])
        .expect("Failed to delete category");

    // 【結果検証】: プレイヤー情報を再取得し、category_idがNULLになっているか確認
    // 【期待値確認】: すべてのプレイヤーのcategory_id = Noneであることを検証
    // 【品質保証】: REQ-504, NFR-202を満たすことを保証
    let category_ids: Vec<Option<i64>> = conn
        .prepare("SELECT category_id FROM players ORDER BY id")
        .expect("Failed to prepare statement")
        .query_map([], |row| row.get(0))
        .expect("Failed to query category IDs")
        .collect::<Result<Vec<_>, _>>()
        .expect("Failed to collect results");

    // 【検証項目】: 2人のプレイヤーが取得されることを確認
    assert_eq!(category_ids.len(), 2); // 【確認内容】: 結果セットの件数が2件

    // 【検証項目】: すべてのプレイヤーのcategory_idがNULLになっていることを確認
    // 🔵 信頼性レベル: schema.rs:18（ON DELETE SET NULL）に基づく
    assert!(category_ids.iter().all(|id| id.is_none()));
    // 【確認内容】: ON DELETE SET NULL制約が正しく動作し、全プレイヤーのcategory_idがNoneになっている
}

#[test]
fn test_player_category_foreign_key_violation() {
    // 【テスト目的】: 外部キー制約が正しく機能することを確認
    // 【テスト内容】: 存在しない種別IDでプレイヤーを作成した際、エラーが発生することを検証
    // 【期待される動作】: FOREIGN KEY constraint failedエラーが発生する
    // 🔵 信頼性レベル: schema.rs:18（FOREIGN KEY制約）、SQLite仕様に基づく

    // 【テストデータ準備】: フロントエンドのバグや、種別削除後の古いデータ参照のシナリオを再現
    // 【初期条件設定】: テスト用データベースを初期化
    // 【エラー条件】: 種別テーブルにid=999のレコードが存在しない状態
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // 【実際の処理実行】: 存在しない種別ID（999）でプレイヤーを作成
    // 【処理内容】: INSERT文で不正なcategory_idを指定
    // 【期待される結果】: FOREIGN KEY constraint failedエラーが発生
    // 【システムの安全性】: データベースが不整合を防ぐため、INSERT/UPDATEを拒否
    let result = conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["無効プレイヤー", 999],
    );

    // 【結果検証】: エラーが発生することを確認
    // 【期待値確認】: Errが返されることを検証
    // 【品質保証】: 外部キー制約が正しく機能し、データの整合性を保つ
    assert!(result.is_err()); // 【確認内容】: FOREIGN KEY constraint failedエラーが発生

    // 【追加検証】: エラーメッセージにFOREIGN KEYが含まれることを確認
    // 🔵 信頼性レベル: SQLiteの標準エラーメッセージに基づく
    let error_msg = result.unwrap_err().to_string();
    assert!(error_msg.to_lowercase().contains("foreign key"));
    // 【確認内容】: エラーメッセージが外部キー制約違反を示している
}

#[test]
fn test_player_category_null_on_creation() {
    // 【テスト目的】: 種別なしプレイヤーの作成が可能であることを確認
    // 【テスト内容】: プレイヤー作成時にcategory_id = NULLで作成できることを検証
    // 【期待される動作】: category_id = NULLが有効な状態として扱われる
    // 🔵 信頼性レベル: schema.rs:15（NULL許可）、REQ-104に基づく

    // 【テストデータ準備】: 種別未設定のままプレイヤーを登録するケースを再現
    // 【初期条件設定】: テスト用データベースを初期化
    // 【境界値の意味】: 種別設定が任意（必須ではない）であることの確認
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // 【実際の処理実行】: プレイヤー作成時にcategory_idを指定しない（NULLで作成）
    // 【処理内容】: INSERT文でcategory_idを省略
    // 【実行タイミング】: 種別を設定せずにプレイヤーを作成
    conn.execute(
        "INSERT INTO players (name) VALUES (?1)",
        params!["種別なしプレイヤー"],
    )
    .expect("Failed to insert player without category");

    // 【結果検証】: プレイヤー情報を取得し、category_idがNULLであることを確認
    // 【期待値確認】: category_id = Noneであることを検証
    // 【堅牢性の確認】: NULLを含むデータでもシステムが正常動作する
    let (name, category_id): (String, Option<i64>) = conn
        .query_row(
            "SELECT name, category_id FROM players WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .expect("Failed to query player");

    // 【検証項目】: プレイヤー名が正しいことを確認
    assert_eq!(name, "種別なしプレイヤー"); // 【確認内容】: 名前が正しく保存されている

    // 【検証項目】: category_idがNULLであることを確認
    // 🔵 信頼性レベル: schema.rs:15（NULL許可）に基づく
    assert_eq!(category_id, None); // 【確認内容】: category_idがNoneになっている
}

#[test]
fn test_multiple_players_same_category() {
    // 【テスト目的】: 多対1関係が正しく機能することを確認
    // 【テスト内容】: 同じ種別IDを複数のプレイヤーに割り当てられることを検証
    // 【期待される動作】: 同じcategory_idを持つプレイヤーが複数存在できる
    // 🔵 信頼性レベル: schema.rs:18（FOREIGN KEY定義）、データベース正規化理論に基づく

    // 【テストデータ準備】: 同じプレイスタイルのプレイヤーが複数いるケースを再現
    // 【初期条件設定】: テスト用データベースを初期化
    // 【境界値の意味】: 1つの種別が複数プレイヤーから参照される（多対1関係）
    let db = PlayerDatabase::new_test().expect("Failed to create test database");
    let conn = db.0.lock().unwrap();

    // 【前提条件確認】: 種別「タイト」を作成
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["タイト", "#FF0000"],
    )
    .expect("Failed to insert category");

    // 【初期データ作成】: 3人のプレイヤーに同じ種別（id=1）を割り当て
    // 【テスト条件】: 複数プレイヤーが同じ種別を参照する多対1関係を構築
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["プレイヤー1", 1],
    )
    .expect("Failed to insert player 1");

    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["プレイヤー2", 1],
    )
    .expect("Failed to insert player 2");

    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["プレイヤー3", 1],
    )
    .expect("Failed to insert player 3");

    // 【結果検証】: すべてのプレイヤーのcategory_idを取得
    // 【期待値確認】: 3人すべてのプレイヤーでcategory_id = Some(1)であることを検証
    // 【堅牢性の確認】: 複数プレイヤーからの参照でも問題ない
    let category_ids: Vec<Option<i64>> = conn
        .prepare("SELECT category_id FROM players ORDER BY id")
        .expect("Failed to prepare statement")
        .query_map([], |row| row.get(0))
        .expect("Failed to query category IDs")
        .collect::<Result<Vec<_>, _>>()
        .expect("Failed to collect results");

    // 【検証項目】: 3人のプレイヤーが取得されることを確認
    assert_eq!(category_ids.len(), 3); // 【確認内容】: 結果セットの件数が3件

    // 【検証項目】: すべてのプレイヤーで同じ種別IDが設定されていることを確認
    // 🔵 信頼性レベル: データベース正規化理論（多対1関係）に基づく
    assert!(category_ids.iter().all(|id| *id == Some(1)));
    // 【確認内容】: 全プレイヤーのcategory_idが同じ値（Some(1)）になっている
}

// ============================================
// 統合テスト補強（GitHub Issue #19 - TASK-0015）
// ============================================

/// テスト用のプレイヤーを作成（簡易版）
fn insert_test_player_simple(db: &PlayerDatabase, name: &str) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute("INSERT INTO players (name) VALUES (?1)", params![name])
        .expect("Failed to insert test player");
    conn.last_insert_rowid()
}

#[test]
fn test_cascade_delete_notes_and_summaries() {
    // 【テスト目的】: プレイヤー削除時に簡易メモと総合メモがCASCADE削除されることを確認
    // 【テスト内容】: プレイヤーと関連メモを作成後、プレイヤー削除で全関連データが削除されることを検証
    // 【期待される動作】: ON DELETE CASCADE制約により、親レコード削除時に子レコードも自動削除される
    // 🔵 信頼性レベル: 要件定義書とテストケース定義書に基づく

    // 【テストデータ準備】: プレイヤー、簡易メモ、総合メモを作成
    // 【初期条件設定】: 各テーブルにデータが存在する状態を構築
    let db = PlayerDatabase::new_test().expect("テストDBの作成に成功すること");
    let player_id = insert_test_player_simple(&db, "山田太郎");

    // 【簡易メモ作成】: player_notesテーブルに複数レコード追加
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, "<p>アグレッシブ</p>"],
    )
    .expect("メモ作成に成功すること");
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, "<p>タイト</p>"],
    )
    .expect("メモ作成に成功すること");

    // 【総合メモ作成】: player_summariesテーブルにレコード追加
    conn.execute(
        "INSERT INTO player_summaries (player_id, content) VALUES (?1, ?2)",
        params![player_id, "<p>総合評価テスト</p>"],
    )
    .expect("総合メモ作成に成功すること");
    drop(conn);

    // 【削除前確認】: メモと総合メモが存在することを確認
    let conn = db.0.lock().unwrap();
    let notes_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes WHERE player_id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .expect("メモ取得に成功すること");
    assert_eq!(notes_count, 2, "削除前に2件のメモが存在すること"); // 🔵

    let summary_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries WHERE player_id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .expect("総合メモ取得に成功すること");
    assert_eq!(summary_count, 1, "削除前に1件の総合メモが存在すること"); // 🔵
    drop(conn);

    // 【実際の処理実行】: プレイヤーを削除
    // 【処理内容】: DELETE文実行によりCASCADE削除がトリガーされる
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM players WHERE id = ?1", params![player_id])
        .expect("プレイヤー削除に成功すること");
    drop(conn);

    // 【結果検証】: 簡易メモが削除されていることを確認
    // 【期待値確認】: CASCADE削除により関連メモが0件になる
    let conn = db.0.lock().unwrap();
    let notes_after: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes WHERE player_id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .expect("カウントに成功すること");
    assert_eq!(
        notes_after, 0,
        "CASCADE削除により簡易メモが削除されていること"
    ); // 🔵

    // 【結果検証】: 総合メモが削除されていることを確認
    // 【期待値確認】: CASCADE削除により総合メモも削除される
    let summary_after: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries WHERE player_id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .expect("カウントに成功すること");
    assert_eq!(
        summary_after, 0,
        "CASCADE削除により総合メモが削除されていること"
    ); // 🔵
}

#[test]
fn test_cascade_delete_fts_entries() {
    // 【テスト目的】: プレイヤー削除時にFTSテーブルからもエントリが削除されることを確認
    // 【テスト内容】: プレイヤーと関連メモ作成後、プレイヤー削除でFTSエントリも削除されることを検証
    // 【期待される動作】: DELETE トリガーによりFTSテーブルのエントリも自動削除される
    // 🔵 信頼性レベル: 要件定義書とテストケース定義書に基づく

    // 【テストデータ準備】: プレイヤーと検索可能なメモを作成
    // 【初期条件設定】: FTSテーブルに検索対象データが存在する状態
    let db = PlayerDatabase::new_test().expect("テストDBの作成に成功すること");
    let player_id = insert_test_player_simple(&db, "佐藤次郎");

    // 【簡易メモ作成】: FTSインデックスが作成されるメモを追加
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, "<p>ブラフ頻度高い</p>"],
    )
    .expect("メモ作成に成功すること");

    // 【総合メモ作成】: FTSインデックスが作成される総合メモを追加
    conn.execute(
        "INSERT INTO player_summaries (player_id, content) VALUES (?1, ?2)",
        params![player_id, "<p>総合的にアグレッシブ</p>"],
    )
    .expect("総合メモ作成に成功すること");
    drop(conn);

    // 【削除前確認】: FTS検索でメモが見つかることを確認
    let conn = db.0.lock().unwrap();
    let notes_fts_before: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH 'ブラフ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert!(notes_fts_before > 0, "削除前にFTS検索で結果が見つかること"); // 🔵

    let summaries_fts_before: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries_fts WHERE content MATCH 'アグレッシブ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert!(
        summaries_fts_before > 0,
        "削除前に総合メモFTS検索で結果が見つかること"
    ); // 🔵
    drop(conn);

    // 【実際の処理実行】: プレイヤーを削除
    // 【処理内容】: DELETE トリガーによりFTSエントリも削除される
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM players WHERE id = ?1", params![player_id])
        .expect("プレイヤー削除に成功すること");
    drop(conn);

    // 【結果検証】: FTS検索で結果が見つからないことを確認
    // 【期待値確認】: FTSエントリも削除されているため検索結果が0件
    let conn = db.0.lock().unwrap();
    let notes_fts_after: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH 'ブラフ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert_eq!(
        notes_fts_after, 0,
        "DELETE トリガーによりFTSエントリが削除されていること"
    ); // 🔵

    let summaries_fts_after: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries_fts WHERE content MATCH 'アグレッシブ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert_eq!(
        summaries_fts_after, 0,
        "DELETE トリガーにより総合メモFTSエントリが削除されていること"
    ); // 🔵
}

#[test]
fn test_cascade_delete_large_volume() {
    // 【テスト目的】: プレイヤー削除時に大量メモ（100件）が正常に削除されることを確認
    // 【テスト内容】: 100件の簡易メモを持つプレイヤーを削除し、全メモがCASCADE削除されることを検証
    // 【期待される動作】: 大量データでもCASCADE削除が正常に動作する
    // 🔵 信頼性レベル: 要件定義書とテストケース定義書に基づく

    // 【テストデータ準備】: プレイヤーと100件のメモを作成
    // 【初期条件設定】: 大量データが存在する状態を構築
    let db = PlayerDatabase::new_test().expect("テストDBの作成に成功すること");
    let player_id = insert_test_player_simple(&db, "大量メモテスト");

    // 【大量メモ作成】: 100件のメモを追加
    let conn = db.0.lock().unwrap();
    for i in 0..100 {
        let content = format!("<p>メモ{}</p>", i);
        conn.execute(
            "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
            params![player_id, content],
        )
        .expect("メモ作成に成功すること");
    }
    drop(conn);

    // 【削除前確認】: 100件のメモが存在することを確認
    let conn = db.0.lock().unwrap();
    let notes_before: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes WHERE player_id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .expect("メモ取得に成功すること");
    assert_eq!(notes_before, 100, "削除前に100件のメモが存在すること"); // 🔵
    drop(conn);

    // 【実際の処理実行】: プレイヤーを削除
    // 【処理内容】: CASCADE削除により100件全てが削除される
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM players WHERE id = ?1", params![player_id])
        .expect("プレイヤー削除に成功すること");
    drop(conn);

    // 【結果検証】: 全メモが削除されていることを確認
    // 【期待値確認】: 大量データでもCASCADE削除が正常に動作
    let conn = db.0.lock().unwrap();
    let notes_after: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes WHERE player_id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .expect("カウントに成功すること");
    assert_eq!(
        notes_after, 0,
        "CASCADE削除により100件全てのメモが削除されていること"
    ); // 🔵
}

#[test]
fn test_fts_lifecycle_notes() {
    // 【テスト目的】: メモのライフサイクル全体（作成→更新→削除）でFTS同期が正常に動作することを確認
    // 【テスト内容】: メモの作成、更新、削除の各段階でFTSインデックスが正しく同期されることを検証
    // 【期待される動作】: INSERT/UPDATE/DELETE トリガーが全て正常に動作する
    // 🔵 信頼性レベル: 要件定義書とテストケース定義書に基づく

    // 【テストデータ準備】: プレイヤーを作成
    // 【初期条件設定】: メモ作成前の状態
    let db = PlayerDatabase::new_test().expect("テストDBの作成に成功すること");
    let player_id = insert_test_player_simple(&db, "ライフサイクルテスト");

    // 【フェーズ1: メモ作成】: INSERT トリガーの動作確認
    // 【処理内容】: メモ作成時にFTSインデックスが作成される
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, "<p>初期コンテンツ</p>"],
    )
    .expect("メモ作成に成功すること");
    let note_id = conn.last_insert_rowid();
    drop(conn);

    // 【FTS検索確認】: 作成直後に検索できることを確認
    let conn = db.0.lock().unwrap();
    let search_after_create: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH '初期コンテンツ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert_eq!(
        search_after_create, 1,
        "INSERT トリガーによりFTSインデックスが作成されること"
    ); // 🔵
    drop(conn);

    // 【フェーズ2: メモ更新】: UPDATE トリガーの動作確認
    // 【処理内容】: メモ更新時にFTSインデックスが更新される
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE player_notes SET content = ?1 WHERE id = ?2",
        params!["<p>更新後コンテンツ</p>", note_id],
    )
    .expect("メモ更新に成功すること");
    drop(conn);

    // 【FTS検索確認】: 更新後の内容で検索できることを確認
    let conn = db.0.lock().unwrap();
    let search_after_update: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH '更新後コンテンツ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert_eq!(
        search_after_update, 1,
        "UPDATE トリガーによりFTSインデックスが更新されること"
    ); // 🔵

    // 【旧コンテンツ検索確認】: 更新前の内容では検索できないことを確認
    let search_old: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH '初期コンテンツ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert_eq!(
        search_old, 0,
        "UPDATE トリガーにより古いFTSインデックスが削除されること"
    ); // 🔵
    drop(conn);

    // 【フェーズ3: メモ削除】: DELETE トリガーの動作確認
    // 【処理内容】: メモ削除時にFTSインデックスも削除される
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM player_notes WHERE id = ?1", params![note_id])
        .expect("メモ削除に成功すること");
    drop(conn);

    // 【FTS検索確認】: 削除後は検索できないことを確認
    let conn = db.0.lock().unwrap();
    let search_after_delete: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH '更新後コンテンツ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert_eq!(
        search_after_delete, 0,
        "DELETE トリガーによりFTSインデックスが削除されること"
    ); // 🔵
}

#[test]
fn test_fts_lifecycle_summaries() {
    // 【テスト目的】: 総合メモのライフサイクル全体（作成→更新→削除）でFTS同期が正常に動作することを確認
    // 【テスト内容】: 総合メモの作成、更新、削除の各段階でFTSインデックスが正しく同期されることを検証
    // 【期待される動作】: INSERT/UPDATE/DELETE トリガーが全て正常に動作する
    // 🔵 信頼性レベル: 要件定義書とテストケース定義書に基づく

    // 【テストデータ準備】: プレイヤーを作成
    // 【初期条件設定】: 総合メモ作成前の状態
    let db = PlayerDatabase::new_test().expect("テストDBの作成に成功すること");
    let player_id = insert_test_player_simple(&db, "総合メモライフサイクル");

    // 【フェーズ1: 総合メモ作成】: INSERT トリガーの動作確認
    // 【処理内容】: 総合メモ作成時にFTSインデックスが作成される
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_summaries (player_id, content) VALUES (?1, ?2)",
        params![player_id, "<p>初期総合評価</p>"],
    )
    .expect("総合メモ作成に成功すること");
    drop(conn);

    // 【FTS検索確認】: 作成直後に検索できることを確認
    let conn = db.0.lock().unwrap();
    let search_after_create: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries_fts WHERE content MATCH '初期総合評価'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert_eq!(
        search_after_create, 1,
        "INSERT トリガーによりFTSインデックスが作成されること"
    ); // 🔵
    drop(conn);

    // 【フェーズ2: 総合メモ更新】: UPDATE トリガーの動作確認
    // 【処理内容】: 総合メモ更新時にFTSインデックスが更新される
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE player_summaries SET content = ?1 WHERE player_id = ?2",
        params!["<p>更新後総合評価</p>", player_id],
    )
    .expect("総合メモ更新に成功すること");
    drop(conn);

    // 【FTS検索確認】: 更新後の内容で検索できることを確認
    let conn = db.0.lock().unwrap();
    let search_after_update: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries_fts WHERE content MATCH '更新後総合評価'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert_eq!(
        search_after_update, 1,
        "UPDATE トリガーによりFTSインデックスが更新されること"
    ); // 🔵

    // 【旧コンテンツ検索確認】: 更新前の内容では検索できないことを確認
    let search_old: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries_fts WHERE content MATCH '初期総合評価'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert_eq!(
        search_old, 0,
        "UPDATE トリガーにより古いFTSインデックスが削除されること"
    ); // 🔵
    drop(conn);

    // 【フェーズ3: 総合メモ削除】: DELETE トリガーの動作確認（プレイヤー削除経由）
    // 【処理内容】: プレイヤー削除により総合メモとFTSインデックスも削除される
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM players WHERE id = ?1", params![player_id])
        .expect("プレイヤー削除に成功すること");
    drop(conn);

    // 【FTS検索確認】: 削除後は検索できないことを確認
    let conn = db.0.lock().unwrap();
    let search_after_delete: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries_fts WHERE content MATCH '更新後総合評価'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    assert_eq!(
        search_after_delete, 0,
        "DELETE トリガーによりFTSインデックスが削除されること"
    ); // 🔵
}

#[test]
fn test_japanese_keyword_search_3chars() {
    // 【テスト目的】: 3文字以上の日本語キーワードでFTS検索が正常に動作することを確認
    // 【テスト内容】: trigramトークナイザーの最小文字数（3文字）で検索できることを検証
    // 【期待される動作】: 3文字の日本語キーワードで正確に検索できる
    // 🔵 信頼性レベル: 要件定義書とテストケース定義書に基づく

    // 【テストデータ準備】: 複数のプレイヤーと日本語メモを作成
    // 【初期条件設定】: 様々な日本語キーワードを含むメモを準備
    let db = PlayerDatabase::new_test().expect("テストDBの作成に成功すること");
    let player1_id = insert_test_player_simple(&db, "プレイヤー1");
    let player2_id = insert_test_player_simple(&db, "プレイヤー2");

    // 【メモ作成】: 異なる3文字キーワードを含むメモを追加
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player1_id, "<p>アグレッシブなプレイスタイル</p>"],
    )
    .expect("メモ作成に成功すること");
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player2_id, "<p>タイトなプレイヤー</p>"],
    )
    .expect("メモ作成に成功すること");
    drop(conn);

    // 【実際の処理実行】: 3文字キーワードで検索
    // 【処理内容】: trigramトークナイザーで日本語検索を実行
    let conn = db.0.lock().unwrap();
    let search_aggressive: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH 'アグレッシブ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    let search_tight: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH 'タイト'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    drop(conn);

    // 【結果検証】: 各キーワードで正確に1件ずつ検索できることを確認
    // 【期待値確認】: trigramトークナイザーで3文字の日本語が検索可能
    assert_eq!(
        search_aggressive, 1,
        "3文字の日本語キーワード「アグレッシブ」で検索できること"
    ); // 🔵

    assert_eq!(
        search_tight, 1,
        "3文字の日本語キーワード「タイト」で検索できること"
    ); // 🔵
}

#[test]
fn test_japanese_search_notes_and_summaries() {
    // 【テスト目的】: 簡易メモと総合メモの両方で日本語検索が正常に動作することを確認
    // 【テスト内容】: 同じキーワードが簡易メモと総合メモに含まれる場合、両方で検索できることを検証
    // 【期待される動作】: 簡易メモと総合メモで独立したFTS検索が可能
    // 🔵 信頼性レベル: 要件定義書とテストケース定義書に基づく

    // 【テストデータ準備】: プレイヤー、簡易メモ、総合メモを作成
    // 【初期条件設定】: 同じキーワードを含む簡易メモと総合メモを準備
    let db = PlayerDatabase::new_test().expect("テストDBの作成に成功すること");
    let player_id = insert_test_player_simple(&db, "両方検索テスト");

    // 【簡易メモ作成】: 「ブラフ」キーワードを含むメモ
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, "<p>ブラフ頻度が高い</p>"],
    )
    .expect("メモ作成に成功すること");

    // 【総合メモ作成】: 「ブラフ」キーワードを含む総合メモ
    conn.execute(
        "INSERT INTO player_summaries (player_id, content) VALUES (?1, ?2)",
        params![player_id, "<p>ブラフを多用する傾向</p>"],
    )
    .expect("総合メモ作成に成功すること");
    drop(conn);

    // 【実際の処理実行】: 簡易メモと総合メモで同じキーワードを検索
    // 【処理内容】: 両方のFTSテーブルで検索を実行
    let conn = db.0.lock().unwrap();
    let notes_search: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH 'ブラフ'",
            [],
            |row| row.get(0),
        )
        .expect("メモ検索に成功すること");
    let summaries_search: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries_fts WHERE content MATCH 'ブラフ'",
            [],
            |row| row.get(0),
        )
        .expect("総合メモ検索に成功すること");
    drop(conn);

    // 【結果検証】: 簡易メモで検索できることを確認
    // 【期待値確認】: 簡易メモFTSテーブルで正常に検索可能
    assert_eq!(
        notes_search, 1,
        "簡易メモで「ブラフ」キーワードが検索できること"
    ); // 🔵

    // 【結果検証】: 総合メモで検索できることを確認
    // 【期待値確認】: 総合メモFTSテーブルで正常に検索可能
    assert_eq!(
        summaries_search, 1,
        "総合メモで「ブラフ」キーワードが検索できること"
    ); // 🔵
}

#[test]
fn test_japanese_keyword_search_2chars_no_result() {
    // 【テスト目的】: 2文字以下の日本語キーワードでは検索結果が返らないことを確認
    // 【テスト内容】: trigramトークナイザーの最小文字数制限（3文字）により2文字では検索できないことを検証
    // 【期待される動作】: 2文字のキーワードでは検索結果が0件となる
    // 🔵 信頼性レベル: 要件定義書とテストケース定義書に基づく

    // 【テストデータ準備】: 3文字キーワードを含むメモを作成
    // 【初期条件設定】: 実際には「タイト」というキーワードが含まれている状態
    let db = PlayerDatabase::new_test().expect("テストDBの作成に成功すること");
    let player_id = insert_test_player_simple(&db, "2文字検索テスト");

    // 【メモ作成】: 「タイト」を含むメモ（実際は3文字以上のキーワード）
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, "<p>タイトなプレイヤー</p>"],
    )
    .expect("メモ作成に成功すること");
    drop(conn);

    // 【実際の処理実行】: 2文字キーワードで検索
    // 【処理内容】: trigramトークナイザーの最小文字数制限をテスト
    let conn = db.0.lock().unwrap();
    let search_result: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH 'タイ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    drop(conn);

    // 【結果検証】: 2文字キーワードでは検索結果が0件であることを確認
    // 【期待値確認】: trigramトークナイザーは3文字未満を検索対象外とする
    assert_eq!(
        search_result, 0,
        "2文字のキーワード「タイ」では検索結果が返らないこと"
    ); // 🔵
}

#[test]
fn test_japanese_keyword_search_nonexistent() {
    // 【テスト目的】: 存在しない日本語キーワードで検索結果が0件となることを確認
    // 【テスト内容】: データベースに存在しないキーワードで検索し、結果が空であることを検証
    // 【期待される動作】: 存在しないキーワードでは検索結果が0件となる
    // 🔵 信頼性レベル: 要件定義書とテストケース定義書に基づく

    // 【テストデータ準備】: 特定のキーワードを含むメモを作成
    // 【初期条件設定】: 「アグレッシブ」というキーワードのみ存在する状態
    let db = PlayerDatabase::new_test().expect("テストDBの作成に成功すること");
    let player_id = insert_test_player_simple(&db, "存在しないキーワード検索");

    // 【メモ作成】: 「アグレッシブ」を含むメモ
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, "<p>アグレッシブなプレイスタイル</p>"],
    )
    .expect("メモ作成に成功すること");
    drop(conn);

    // 【実際の処理実行】: 存在しないキーワードで検索
    // 【処理内容】: データベースに存在しない日本語キーワードを検索
    let conn = db.0.lock().unwrap();
    let search_result: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH 'パッシブ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    drop(conn);

    // 【結果検証】: 存在しないキーワードでは検索結果が0件であることを確認
    // 【期待値確認】: FTSインデックスに存在しないキーワードは検索結果なし
    assert_eq!(
        search_result, 0,
        "存在しないキーワード「パッシブ」では検索結果が0件となること"
    ); // 🔵
}

#[test]
fn test_japanese_multiple_keywords_search() {
    // 【テスト目的】: 複数の日本語キーワードを含むメモの検索が正常に動作することを確認
    // 【テスト内容】: 異なるキーワードを持つ複数メモから、特定のキーワードで正確に検索できることを検証
    // 【期待される動作】: 複数メモ環境で各キーワードが正確に検索できる
    // 🔵 信頼性レベル: 要件定義書とテストケース定義書に基づく

    // 【テストデータ準備】: 複数のプレイヤーと異なるキーワードのメモを作成
    // 【初期条件設定】: 様々な日本語キーワードを含む複数メモが存在する状態
    let db = PlayerDatabase::new_test().expect("テストDBの作成に成功すること");
    let player1_id = insert_test_player_simple(&db, "プレイヤーA");
    let player2_id = insert_test_player_simple(&db, "プレイヤーB");
    let player3_id = insert_test_player_simple(&db, "プレイヤーC");

    // 【メモ作成】: 異なる日本語キーワードを含む複数メモ
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player1_id, "<p>アグレッシブで攻撃的</p>"],
    )
    .expect("メモ作成に成功すること");
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player2_id, "<p>タイトで堅実</p>"],
    )
    .expect("メモ作成に成功すること");
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player3_id, "<p>ブラフを多用</p>"],
    )
    .expect("メモ作成に成功すること");
    drop(conn);

    // 【実際の処理実行】: 各キーワードで個別に検索
    // 【処理内容】: 複数メモ環境で特定キーワードのみを検索
    let conn = db.0.lock().unwrap();
    let search_aggressive: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH 'アグレッシブ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    let search_tight: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH 'タイト'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    let search_bluff: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE content MATCH 'ブラフ'",
            [],
            |row| row.get(0),
        )
        .expect("検索に成功すること");
    drop(conn);

    // 【結果検証】: 各キーワードで正確に1件ずつ検索できることを確認
    // 【期待値確認】: 複数メモ環境でも各キーワードが正確に検索可能
    assert_eq!(
        search_aggressive, 1,
        "「アグレッシブ」で1件のメモが検索されること"
    ); // 🔵

    assert_eq!(search_tight, 1, "「タイト」で1件のメモが検索されること"); // 🔵

    assert_eq!(search_bluff, 1, "「ブラフ」で1件のメモが検索されること"); // 🔵
}
