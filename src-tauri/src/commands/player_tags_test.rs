use super::player_tags::*;
use crate::database::PlayerDatabase;
use rusqlite::params;

// ============================================
// テストヘルパー関数
// ============================================

/// テスト用データベースを作成
fn create_test_db() -> PlayerDatabase {
    PlayerDatabase::new_test().expect("Failed to create test database")
}

/// テスト用のプレイヤーを作成
fn insert_test_player(db: &PlayerDatabase, name: &str) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute("INSERT INTO players (name) VALUES (?1)", params![name])
        .expect("Failed to insert test player");
    conn.last_insert_rowid()
}

/// テスト用のタグを作成
fn insert_test_tag(db: &PlayerDatabase, name: &str, color: &str, has_intensity: bool) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO tags (name, color, has_intensity) VALUES (?1, ?2, ?3)",
        params![name, color, has_intensity],
    )
    .expect("Failed to insert test tag");
    conn.last_insert_rowid()
}

// ============================================
// 正常系テスト（assign_tag_to_player）
// ============================================

// TC-ASSIGN-001: 強度なしタグの割り当て 🔵
#[test]
fn test_assign_tag_without_intensity() {
    // 【テスト目的】: has_intensity = false のタグを intensity = None で割り当てる
    // 【テスト内容】: 強度設定なしタグの基本的な割り当て機能を検証
    // 【期待される動作】: PlayerTagが作成され、intensity = NULL、display_order = 0
    // 🔵 信頼性レベル: 要件定義書（REQ-206）に基づく

    // 【テストデータ準備】: プレイヤーと強度なしタグを作成
    // 【初期条件設定】: クリーンなデータベース環境
    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "レギュラー", "#3498DB", false);

    // 【実際の処理実行】: 強度なしで割り当て
    // 【処理内容】: assign_tag_to_player_internal を呼び出し
    let result = assign_tag_to_player_internal(player_id, tag_id, None, &db);

    // 【結果検証】: 割り当てが成功することを確認
    // 【期待値確認】: intensity = None、display_order = 0
    assert!(result.is_ok(), "強度なしタグの割り当てが成功すること"); // 【確認内容】: 成功 🔵
    let player_tag = result.unwrap();
    assert_eq!(player_tag.player_id, player_id); // 【確認内容】: player_idが正しい 🔵
    assert_eq!(player_tag.tag_id, tag_id); // 【確認内容】: tag_idが正しい 🔵
    assert_eq!(player_tag.intensity, None); // 【確認内容】: intensityがNULL 🔵
    assert_eq!(player_tag.display_order, 0); // 【確認内容】: 初回はdisplay_order = 0 🔵
}

// TC-ASSIGN-002: 強度ありタグの割り当て（ブラフⅢ） 🔵
#[test]
fn test_assign_tag_with_intensity() {
    // 【テスト目的】: has_intensity = true のタグを intensity = 3 で割り当てる
    // 【テスト内容】: 強度設定ありタグの基本的な割り当て機能とローマ数字変換を検証
    // 【期待される動作】: PlayerTagが作成され、intensity = 3（ローマ数字Ⅲ）
    // 🔵 信頼性レベル: 要件定義書（REQ-205, REQ-207）に基づく

    // 【テストデータ準備】: プレイヤーと強度ありタグを作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

    // 【実際の処理実行】: 強度3で割り当て
    let result = assign_tag_to_player_internal(player_id, tag_id, Some(3), &db);

    // 【結果検証】: intensity = 3 で割り当てられることを確認
    assert!(result.is_ok(), "強度ありタグの割り当てが成功すること"); // 【確認内容】: 成功 🔵
    let player_tag = result.unwrap();
    assert_eq!(player_tag.intensity, Some(3)); // 【確認内容】: intensity = 3 🔵
}

// TC-ASSIGN-003: 同一プレイヤーに複数タグを割り当て 🔵
#[test]
fn test_assign_multiple_tags_to_player() {
    // 【テスト目的】: 1プレイヤーに複数の異なるタグを割り当てる（多対多関連）
    // 【テスト内容】: display_orderの自動採番を検証
    // 【期待される動作】: display_order = 0, 1, 2 と順番に採番
    // 🔵 信頼性レベル: 要件定義書（REQ-206）に基づく

    // 【テストデータ準備】: 1プレイヤーと3タグを作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag1 = insert_test_tag(&db, "レギュラー", "#3498DB", false);
    let tag2 = insert_test_tag(&db, "ブラフ", "#FF5733", true);
    let tag3 = insert_test_tag(&db, "アグレッシブ", "#E74C3C", true);

    // 【実際の処理実行】: 3つのタグを順次割り当て
    let result1 = assign_tag_to_player_internal(player_id, tag1, None, &db);
    let result2 = assign_tag_to_player_internal(player_id, tag2, Some(3), &db);
    let result3 = assign_tag_to_player_internal(player_id, tag3, Some(5), &db);

    // 【結果検証】: 3つとも成功し、display_orderが順番に採番
    assert!(result1.is_ok() && result2.is_ok() && result3.is_ok()); // 【確認内容】: 全て成功 🔵
    assert_eq!(result1.unwrap().display_order, 0); // 【確認内容】: 1つ目は0 🔵
    assert_eq!(result2.unwrap().display_order, 1); // 【確認内容】: 2つ目は1 🔵
    assert_eq!(result3.unwrap().display_order, 2); // 【確認内容】: 3つ目は2 🔵
}

// TC-ASSIGN-004: 同一タグの複数強度割り当て（REQ-207） 🔵
#[test]
fn test_assign_same_tag_with_different_intensities() {
    // 【テスト目的】: REQ-207の核心機能（ブラフⅢとブラフⅤの共存）
    // 【テスト内容】: UNIQUE(player_id, tag_id, intensity)により両方作成可能
    // 【期待される動作】: 同一タグ・異なる強度で2つのPlayerTagが作成される
    // 🔵 信頼性レベル: 要件定義書（REQ-207）およびIssue #13の説明に基づく

    // 【テストデータ準備】: プレイヤーと強度ありタグを作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

    // 【実際の処理実行】: 同一タグを強度3と5で割り当て
    let result1 = assign_tag_to_player_internal(player_id, tag_id, Some(3), &db);
    let result2 = assign_tag_to_player_internal(player_id, tag_id, Some(5), &db);

    // 【結果検証】: 両方とも成功することを確認（UNIQUE制約違反にならない）
    assert!(result1.is_ok(), "ブラフⅢの割り当てが成功すること"); // 【確認内容】: 強度3成功 🔵
    assert!(result2.is_ok(), "ブラフⅤの割り当てが成功すること"); // 【確認内容】: 強度5成功 🔵
}

// ============================================
// 正常系テスト（get_player_tags）
// ============================================

// TC-GET-001: プレイヤーのタグ一覧を取得 🔵
#[test]
fn test_get_player_tags() {
    // 【テスト目的】: JOINクエリとORDER BY display_orderが正しく機能
    // 【テスト内容】: 複数タグを持つプレイヤーの一覧をdisplay_order順で取得
    // 【期待される動作】: Vec<PlayerTagWithTag>がdisplay_order昇順で返される
    // 🔵 信頼性レベル: 要件定義書およびスキーマ定義に基づく

    // 【テストデータ準備】: 3つのタグを持つプレイヤーを作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag1 = insert_test_tag(&db, "レギュラー", "#3498DB", false);
    let tag2 = insert_test_tag(&db, "ブラフ", "#FF5733", true);

    assign_tag_to_player_internal(player_id, tag1, None, &db).unwrap();
    assign_tag_to_player_internal(player_id, tag2, Some(3), &db).unwrap();

    // 【実際の処理実行】: タグ一覧を取得
    let result = get_player_tags_internal(player_id, &db);

    // 【結果検証】: 2件取得され、display_order順であることを確認
    assert!(result.is_ok(), "タグ一覧取得が成功すること"); // 【確認内容】: 成功 🔵
    let tags = result.unwrap();
    assert_eq!(tags.len(), 2); // 【確認内容】: 2件取得 🔵
    assert_eq!(tags[0].display_order, 0); // 【確認内容】: 1つ目はdisplay_order = 0 🔵
    assert_eq!(tags[1].display_order, 1); // 【確認内容】: 2つ目はdisplay_order = 1 🔵
}

// TC-GET-002: タグ未割り当てプレイヤーの取得 🔵
#[test]
fn test_get_player_tags_empty() {
    // 【テスト目的】: 空のVecが返されることを確認
    // 【テスト内容】: タグが1つも割り当てられていないプレイヤーの取得
    // 【期待される動作】: Ok(Vec::new()) が返される
    // 🔵 信頼性レベル: 一般的なCRUD操作のベストプラクティス

    // 【テストデータ準備】: タグ未割り当てのプレイヤーを作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "タグなしプレイヤー");

    // 【実際の処理実行】: タグ一覧を取得
    let result = get_player_tags_internal(player_id, &db);

    // 【結果検証】: 空配列が返されることを確認
    assert!(result.is_ok(), "空配列取得が成功すること"); // 【確認内容】: 成功 🔵
    assert_eq!(result.unwrap().len(), 0); // 【確認内容】: 空配列 🔵
}

// ============================================
// 正常系テスト（remove_tag_from_player）
// ============================================

// TC-REMOVE-001: タグ割り当てを解除 🔵
#[test]
fn test_remove_tag_from_player() {
    // 【テスト目的】: player_tagsテーブルからレコード削除
    // 【テスト内容】: 割り当て済みタグの削除処理
    // 【期待される動作】: Ok(()) が返され、レコードが削除される
    // 🔵 信頼性レベル: 一般的なCRUD操作

    // 【テストデータ準備】: タグ割り当て済みプレイヤーを作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "レギュラー", "#3498DB", false);
    let player_tag = assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();

    // 【実際の処理実行】: タグ割り当てを解除
    let result = remove_tag_from_player_internal(player_tag.id, &db);

    // 【結果検証】: 削除が成功することを確認
    assert!(result.is_ok(), "タグ解除が成功すること"); // 【確認内容】: 成功 🔵

    // 【追加検証】: レコードが削除されていることを確認
    let conn = db.0.lock().unwrap();
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_tags WHERE id = ?1",
            params![player_tag.id],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(count, 0); // 【確認内容】: レコードが削除されている 🔵
}

// ============================================
// 異常系テスト（assign_tag_to_player）
// ============================================

// TC-ASSIGN-ERR-001: 存在しないplayer_id 🔵
#[test]
fn test_assign_tag_nonexistent_player() {
    // 【テスト目的】: FOREIGN KEY制約違反のバリデーション
    // 【テスト内容】: 存在しないプレイヤーIDでタグ割り当てを試行
    // 【期待される動作】: Err("Player not found")
    // 🔵 信頼性レベル: schema.rsのFOREIGN KEY定義に基づく

    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "レギュラー", "#3498DB", false);

    let result = assign_tag_to_player_internal(999, tag_id, None, &db);

    assert!(result.is_err(), "存在しないプレイヤーでエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("Player not found")); // 【確認内容】: エラーメッセージ 🔵
}

// TC-ASSIGN-ERR-002: 存在しないtag_id 🔵
#[test]
fn test_assign_tag_nonexistent_tag() {
    // 【テスト目的】: FOREIGN KEY制約違反のバリデーション
    // 【テスト内容】: 存在しないタグIDで割り当てを試行
    // 【期待される動作】: Err("Tag not found")
    // 🔵 信頼性レベル: schema.rsのFOREIGN KEY定義に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");

    let result = assign_tag_to_player_internal(player_id, 999, None, &db);

    assert!(result.is_err(), "存在しないタグでエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("Tag not found")); // 【確認内容】: エラーメッセージ 🔵
}

// TC-ASSIGN-ERR-003: 強度設定なしタグに強度を指定 🔵
#[test]
fn test_assign_intensity_to_non_intensity_tag() {
    // 【テスト目的】: has_intensityとintensityの整合性バリデーション
    // 【テスト内容】: has_intensity = false のタグに intensity を指定
    // 【期待される動作】: Err("Tag does not support intensity")
    // 🔵 信頼性レベル: 要件定義書（REQ-204, REQ-205）に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "レギュラー", "#3498DB", false);

    let result = assign_tag_to_player_internal(player_id, tag_id, Some(3), &db);

    assert!(result.is_err(), "強度設定なしタグに強度指定でエラー"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("does not support intensity")); // 【確認内容】: エラーメッセージ 🔵
}

// TC-ASSIGN-ERR-004: 強度設定ありタグに強度なしで指定 🔵
#[test]
fn test_assign_intensity_tag_without_intensity() {
    // 【テスト目的】: has_intensityとintensityの整合性バリデーション
    // 【テスト内容】: has_intensity = true のタグに intensity = None を指定
    // 【期待される動作】: Err("Tag requires intensity value (1-5)")
    // 🔵 信頼性レベル: 要件定義書（REQ-205, REQ-207）に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

    let result = assign_tag_to_player_internal(player_id, tag_id, None, &db);

    assert!(result.is_err(), "強度ありタグに強度なしでエラー"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("requires intensity")); // 【確認内容】: エラーメッセージ 🔵
}

// TC-ASSIGN-ERR-005: 強度範囲外（0） 🔵
#[test]
fn test_assign_tag_intensity_zero() {
    // 【テスト目的】: intensity範囲バリデーション（下限）
    // 【テスト内容】: intensity = 0 を指定
    // 【期待される動作】: Err("Tag intensity must be between 1 and 5, got: 0")
    // 🔵 信頼性レベル: models.rs:250-258 (validate_tag_intensity) に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

    let result = assign_tag_to_player_internal(player_id, tag_id, Some(0), &db);

    assert!(result.is_err(), "強度0でエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("between 1 and 5")); // 【確認内容】: エラーメッセージ 🔵
}

// TC-ASSIGN-ERR-006: 強度範囲外（6） 🔵
#[test]
fn test_assign_tag_intensity_six() {
    // 【テスト目的】: intensity範囲バリデーション（上限）
    // 【テスト内容】: intensity = 6 を指定
    // 【期待される動作】: Err("Tag intensity must be between 1 and 5, got: 6")
    // 🔵 信頼性レベル: models.rs:250-258、schema.rs:45に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

    let result = assign_tag_to_player_internal(player_id, tag_id, Some(6), &db);

    assert!(result.is_err(), "強度6でエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("between 1 and 5")); // 【確認内容】: エラーメッセージ 🔵
}

// TC-ASSIGN-ERR-007: UNIQUE制約違反 🔵
#[test]
fn test_assign_duplicate_tag_with_same_intensity() {
    // 【テスト目的】: UNIQUE(player_id, tag_id, intensity)の動作確認
    // 【テスト内容】: 既に割り当て済みのタグ・強度の組み合わせを再度割り当て
    // 【期待される動作】: 2回目でErr("Tag already assigned...")
    // 🔵 信頼性レベル: schema.rs:50（UNIQUE制約定義）に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

    let result1 = assign_tag_to_player_internal(player_id, tag_id, Some(3), &db);
    let result2 = assign_tag_to_player_internal(player_id, tag_id, Some(3), &db);

    assert!(result1.is_ok(), "1回目は成功すること"); // 【確認内容】: 1回目成功 🔵
    assert!(result2.is_err(), "2回目はエラーになること"); // 【確認内容】: 2回目エラー 🔵
    assert!(result2.unwrap_err().contains("already assigned")); // 【確認内容】: エラーメッセージ 🔵
}

// ============================================
// 異常系テスト（get_player_tags）
// ============================================

// TC-GET-ERR-001: 存在しないplayer_id 🔵
#[test]
fn test_get_player_tags_nonexistent_player() {
    // 【テスト目的】: player_id存在確認
    // 【テスト内容】: 存在しないプレイヤーIDでタグ一覧を取得
    // 【期待される動作】: Err("Player not found")
    // 🔵 信頼性レベル: 一般的なCRUD操作のバリデーション

    let db = create_test_db();

    let result = get_player_tags_internal(999, &db);

    assert!(result.is_err(), "存在しないプレイヤーでエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("Player not found")); // 【確認内容】: エラーメッセージ 🔵
}

// ============================================
// 異常系テスト（remove_tag_from_player）
// ============================================

// TC-REMOVE-ERR-001: 存在しないplayer_tag_id 🔵
#[test]
fn test_remove_nonexistent_player_tag() {
    // 【テスト目的】: player_tag_id存在確認
    // 【テスト内容】: 存在しないPlayerTag IDで削除を試行
    // 【期待される動作】: Err("Player tag not found")
    // 🔵 信頼性レベル: 一般的なCRUD操作のバリデーション

    let db = create_test_db();

    let result = remove_tag_from_player_internal(999, &db);

    assert!(result.is_err(), "存在しないplayer_tag_idでエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("Player tag not found")); // 【確認内容】: エラーメッセージ 🔵
}

// ============================================
// 境界値テスト
// ============================================

// TC-ASSIGN-EDGE-001: 強度最小値（1） 🔵
#[test]
fn test_assign_tag_intensity_min() {
    // 【テスト目的】: 最小値境界の動作確認
    // 【テスト内容】: intensity = 1 で割り当て（ローマ数字Ⅰ）
    // 【期待される動作】: Ok(PlayerTag { intensity: Some(1), ... })
    // 🔵 信頼性レベル: REQ-205、models.rs:250-258に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

    let result = assign_tag_to_player_internal(player_id, tag_id, Some(1), &db);

    assert!(result.is_ok(), "強度1で成功すること"); // 【確認内容】: 成功 🔵
    assert_eq!(result.unwrap().intensity, Some(1)); // 【確認内容】: intensity = 1 🔵
}

// TC-ASSIGN-EDGE-002: 強度最大値（5） 🔵
#[test]
fn test_assign_tag_intensity_max() {
    // 【テスト目的】: 最大値境界の動作確認
    // 【テスト内容】: intensity = 5 で割り当て（ローマ数字Ⅴ）
    // 【期待される動作】: Ok(PlayerTag { intensity: Some(5), ... })
    // 🔵 信頼性レベル: REQ-205、models.rs:250-258に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

    let result = assign_tag_to_player_internal(player_id, tag_id, Some(5), &db);

    assert!(result.is_ok(), "強度5で成功すること"); // 【確認内容】: 成功 🔵
    assert_eq!(result.unwrap().intensity, Some(5)); // 【確認内容】: intensity = 5 🔵
}

// TC-ASSIGN-EDGE-003: display_order初期値（0） 🔵
#[test]
fn test_display_order_initial_value() {
    // 【テスト目的】: display_order自動採番の初期値確認
    // 【テスト内容】: タグ未割り当てプレイヤーへの初回タグ割り当て
    // 【期待される動作】: display_order = 0
    // 🟡 信頼性レベル: Issue #13の「display_orderは現在の最大値+1」から妥当な推測

    let db = create_test_db();
    let player_id = insert_test_player(&db, "新規プレイヤー");
    let tag_id = insert_test_tag(&db, "レギュラー", "#3498DB", false);

    let result = assign_tag_to_player_internal(player_id, tag_id, None, &db);

    assert!(result.is_ok(), "初回割り当てが成功すること"); // 【確認内容】: 成功 🔵
    assert_eq!(result.unwrap().display_order, 0); // 【確認内容】: 初期値は0 🟡
}

// ============================================
// 正常系テスト（reorder_player_tags）
// ============================================

// TC-REORDER-001: 基本的な並び替え（3タグを逆順に） 🔵
#[test]
fn test_reorder_player_tags_basic() {
    // 【テスト目的】: 複数タグの表示順序を一括更新する基本機能
    // 【テスト内容】: 3つのタグ（display_order: 0,1,2）を逆順（2,1,0）に並び替え
    // 【期待される動作】: すべてのdisplay_orderが正しく更新され、取得時に新順序で返る
    // 🔵 信頼性レベル: 要件定義書（REQ-208）に基づく

    // 【テストデータ準備】: 3つのタグを持つプレイヤーを作成
    // 【初期条件設定】: display_order = 0,1,2 の順序でタグを割り当て
    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag1 = insert_test_tag(&db, "タグA", "#FF0000", false);
    let tag2 = insert_test_tag(&db, "タグB", "#00FF00", false);
    let tag3 = insert_test_tag(&db, "タグC", "#0000FF", false);

    let pt1 = assign_tag_to_player_internal(player_id, tag1, None, &db).unwrap();
    let pt2 = assign_tag_to_player_internal(player_id, tag2, None, &db).unwrap();
    let pt3 = assign_tag_to_player_internal(player_id, tag3, None, &db).unwrap();

    // 【実際の処理実行】: 逆順に並び替え（C, B, A）
    // 【処理内容】: reorder_player_tags_internal を呼び出し
    let tag_orders = vec![
        (pt3.id, 0), // タグC を先頭に
        (pt2.id, 1), // タグB を2番目に
        (pt1.id, 2), // タグA を3番目に
    ];
    let result = reorder_player_tags_internal(player_id, tag_orders, &db);

    // 【結果検証】: 並び替えが成功することを確認
    // 【期待値確認】: Ok(()) が返される
    assert!(result.is_ok(), "並び替えが成功すること"); // 【確認内容】: 成功 🔵

    // 【追加検証】: get_player_tagsで新しい順序を確認
    // 【確認ポイント】: display_order順でソートされ、C, B, A の順で返る
    let tags = get_player_tags_internal(player_id, &db).unwrap();
    assert_eq!(tags.len(), 3); // 【確認内容】: 3件取得 🔵
    assert_eq!(tags[0].tag_name, "タグC"); // 【確認内容】: 1番目はタグC 🔵
    assert_eq!(tags[1].tag_name, "タグB"); // 【確認内容】: 2番目はタグB 🔵
    assert_eq!(tags[2].tag_name, "タグA"); // 【確認内容】: 3番目はタグA 🔵
}

// TC-REORDER-002: 1件だけの並び替え 🔵
#[test]
fn test_reorder_player_tags_single() {
    // 【テスト目的】: 最小ケース（1件のみ）での並び替え動作
    // 【テスト内容】: 1つのタグのdisplay_orderだけを更新
    // 【期待される動作】: 1件でも正常に処理されること
    // 🔵 信頼性レベル: 境界値テスト（最小ケース）

    // 【テストデータ準備】: 1つのタグを持つプレイヤーを作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "タグA", "#FF0000", false);
    let pt = assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();

    // 【実際の処理実行】: 1件のdisplay_orderを更新
    let tag_orders = vec![(pt.id, 0)];
    let result = reorder_player_tags_internal(player_id, tag_orders, &db);

    // 【結果検証】: 1件でも成功すること
    assert!(result.is_ok(), "1件の並び替えが成功すること"); // 【確認内容】: 成功 🔵
}

// TC-REORDER-003: 並び替え後の取得で順序確認 🔵
#[test]
fn test_reorder_player_tags_then_get() {
    // 【テスト目的】: 並び替え後、get_player_tagsで正しい順序で取得できるか
    // 【テスト内容】: reorder後にget_player_tagsを呼び出し、新しい順序で取得
    // 【期待される動作】: display_order順でソートされること（既存実装との統合確認）
    // 🔵 信頼性レベル: 設計書（schema.rs:92インデックス）に基づく統合テスト

    // 【テストデータ準備】: 2つのタグを持つプレイヤーを作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag1 = insert_test_tag(&db, "先", "#FF0000", false);
    let tag2 = insert_test_tag(&db, "後", "#00FF00", false);

    let pt1 = assign_tag_to_player_internal(player_id, tag1, None, &db).unwrap();
    let pt2 = assign_tag_to_player_internal(player_id, tag2, None, &db).unwrap();

    // 【実際の処理実行】: 順序を入れ替え（後, 先）
    let tag_orders = vec![(pt2.id, 0), (pt1.id, 1)];
    reorder_player_tags_internal(player_id, tag_orders, &db).unwrap();

    // 【結果検証】: get_player_tagsで新順序を確認
    // 【確認ポイント】: idx_player_tags_display_orderインデックスが機能すること
    let tags = get_player_tags_internal(player_id, &db).unwrap();
    assert_eq!(tags[0].tag_name, "後"); // 【確認内容】: 1番目は「後」🔵
    assert_eq!(tags[1].tag_name, "先"); // 【確認内容】: 2番目は「先」🔵
}

// ============================================
// 異常系テスト（reorder_player_tags）
// ============================================

// TC-REORDER-ERR-001: 存在しないplayer_id 🔵
#[test]
fn test_reorder_player_tags_nonexistent_player() {
    // 【テスト目的】: 不正なプレイヤーIDでの操作を防止
    // 【テスト内容】: 存在しないプレイヤーIDで並び替えを試行
    // 【期待される動作】: Err("Player not found")
    // 🔵 信頼性レベル: 既存パターン（check_player_exists）に基づく

    let db = create_test_db();

    // 【実際の処理実行】: 存在しないplayer_idで並び替え
    let tag_orders = vec![(1, 0)];
    let result = reorder_player_tags_internal(999, tag_orders, &db);

    // 【結果検証】: エラーになることを確認
    assert!(result.is_err(), "存在しないplayer_idでエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("Player not found")); // 【確認内容】: エラーメッセージ 🔵
}

// TC-REORDER-ERR-002: 存在しないplayer_tag_id 🔵
#[test]
fn test_reorder_player_tags_nonexistent_tag() {
    // 【テスト目的】: 不正なplayer_tag_idでの更新を防止
    // 【テスト内容】: 存在しないplayer_tag_idを含むtag_ordersで並び替え
    // 【期待される動作】: Err("Player tag not found")
    // 🔵 信頼性レベル: 要件定義書のバリデーション仕様に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");

    // 【実際の処理実行】: 存在しないplayer_tag_idで並び替え
    let tag_orders = vec![(999, 0)];
    let result = reorder_player_tags_internal(player_id, tag_orders, &db);

    // 【結果検証】: エラーになることを確認
    assert!(result.is_err(), "存在しないplayer_tag_idでエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("Player tag not found")); // 【確認内容】: エラーメッセージ 🔵
}

// TC-REORDER-ERR-003: 異なるplayer_idに属するタグが混在 🔵
#[test]
fn test_reorder_player_tags_mixed_players() {
    // 【テスト目的】: プレイヤー間のデータ混在を防止
    // 【テスト内容】: 複数プレイヤーのタグを同時に並び替え試行
    // 【期待される動作】: Err("All player tags must belong to the same player")
    // 🔵 信頼性レベル: 要件定義書の制約条件に基づく

    let db = create_test_db();
    let player1 = insert_test_player(&db, "プレイヤー1");
    let player2 = insert_test_player(&db, "プレイヤー2");
    let tag_id = insert_test_tag(&db, "タグA", "#FF0000", false);

    let pt1 = assign_tag_to_player_internal(player1, tag_id, None, &db).unwrap();
    let pt2 = assign_tag_to_player_internal(player2, tag_id, None, &db).unwrap();

    // 【実際の処理実行】: 異なるplayer_idのタグを混在させて並び替え
    let tag_orders = vec![(pt1.id, 0), (pt2.id, 1)];
    let result = reorder_player_tags_internal(player1, tag_orders, &db);

    // 【結果検証】: エラーになることを確認
    assert!(
        result.is_err(),
        "異なるplayer_idのタグ混在でエラーになること"
    ); // 【確認内容】: エラー 🔵
    assert!(result
        .unwrap_err()
        .contains("must belong to the same player")); // 【確認内容】: エラーメッセージ 🔵
}

// TC-REORDER-ERR-004: display_orderに重複 🔵
#[test]
fn test_reorder_player_tags_duplicate_order() {
    // 【テスト目的】: 表示順序の一意性を保証
    // 【テスト内容】: 同じdisplay_order値を複数のタグに割り当て
    // 【期待される動作】: Err("Duplicate display_order values")
    // 🔵 信頼性レベル: 要件定義書のバリデーション仕様に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag1 = insert_test_tag(&db, "タグA", "#FF0000", false);
    let tag2 = insert_test_tag(&db, "タグB", "#00FF00", false);

    let pt1 = assign_tag_to_player_internal(player_id, tag1, None, &db).unwrap();
    let pt2 = assign_tag_to_player_internal(player_id, tag2, None, &db).unwrap();

    // 【実際の処理実行】: 重複するdisplay_orderで並び替え
    let tag_orders = vec![(pt1.id, 0), (pt2.id, 0)]; // 両方とも0
    let result = reorder_player_tags_internal(player_id, tag_orders, &db);

    // 【結果検証】: エラーになることを確認
    assert!(result.is_err(), "重複するdisplay_orderでエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result
        .unwrap_err()
        .contains("Duplicate display_order values")); // 【確認内容】: エラーメッセージ 🔵
}

// TC-REORDER-ERR-005: 空のtag_orders 🔵
#[test]
fn test_reorder_player_tags_empty() {
    // 【テスト目的】: 無意味な操作を防止
    // 【テスト内容】: tag_ordersが空の配列
    // 【期待される動作】: Err("Tag orders cannot be empty")
    // 🔵 信頼性レベル: 要件定義書のバリデーション仕様に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");

    // 【実際の処理実行】: 空のtag_ordersで並び替え
    let tag_orders = vec![];
    let result = reorder_player_tags_internal(player_id, tag_orders, &db);

    // 【結果検証】: エラーになることを確認
    assert!(result.is_err(), "空のtag_ordersでエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("cannot be empty")); // 【確認内容】: エラーメッセージ 🔵
}

// TC-REORDER-ERR-006: 負のdisplay_order 🟡
#[test]
fn test_reorder_player_tags_negative_order() {
    // 【テスト目的】: 表示順序の範囲制約を保証
    // 【テスト内容】: display_orderに負の値を指定
    // 【期待される動作】: Err("Display order must be non-negative")
    // 🟡 信頼性レベル: 要件定義から妥当な推測（非負整数制約）

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "タグA", "#FF0000", false);
    let pt = assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();

    // 【実際の処理実行】: 負のdisplay_orderで並び替え
    let tag_orders = vec![(pt.id, -1)];
    let result = reorder_player_tags_internal(player_id, tag_orders, &db);

    // 【結果検証】: エラーになることを確認
    assert!(result.is_err(), "負のdisplay_orderでエラーになること"); // 【確認内容】: エラー 🟡
    assert!(result.unwrap_err().contains("non-negative")); // 【確認内容】: エラーメッセージ 🟡
}

// ============================================
// 境界値テスト（reorder_player_tags）
// ============================================

// TC-REORDER-EDGE-001: display_order = 0（最小値） 🔵
#[test]
fn test_reorder_player_tags_order_zero() {
    // 【テスト目的】: 表示順序の最小値（先頭）での動作確認
    // 【テスト内容】: display_order = 0 で並び替え
    // 【期待される動作】: 0でも正常に動作すること
    // 🔵 信頼性レベル: 既存実装（assign時にdisplay_order=0）に基づく

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "タグA", "#FF0000", false);
    let pt = assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();

    // 【実際の処理実行】: display_order = 0 で並び替え
    let tag_orders = vec![(pt.id, 0)];
    let result = reorder_player_tags_internal(player_id, tag_orders, &db);

    // 【結果検証】: 0でも成功することを確認
    assert!(result.is_ok(), "display_order = 0 で成功すること"); // 【確認内容】: 成功 🔵
}

// TC-REORDER-EDGE-002: 大きなdisplay_order値 🟡
#[test]
fn test_reorder_player_tags_large_order() {
    // 【テスト目的】: 表示順序の実用的な最大値での動作確認
    // 【テスト内容】: display_order = 999 で並び替え
    // 【期待される動作】: 大きな値でも正常に動作すること
    // 🟡 信頼性レベル: i32型から妥当な推測

    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "タグA", "#FF0000", false);
    let pt = assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();

    // 【実際の処理実行】: 大きなdisplay_orderで並び替え
    let tag_orders = vec![(pt.id, 999)];
    let result = reorder_player_tags_internal(player_id, tag_orders, &db);

    // 【結果検証】: 大きな値でも成功することを確認
    assert!(result.is_ok(), "display_order = 999 で成功すること"); // 【確認内容】: 成功 🟡
}

// ============================================
// トランザクションテスト（reorder_player_tags）
// ============================================

// TC-REORDER-TXN-001: トランザクション途中でエラー（全ロールバック） 🔵
#[test]
fn test_reorder_player_tags_transaction_rollback() {
    // 【テスト目的】: ACID保証（原子性）の確認
    // 【テスト内容】: 存在しないplayer_tag_idを含むtag_ordersで並び替え試行
    // 【期待される動作】: トランザクション内で1つでもエラーがあれば全て失敗
    // 🔵 信頼性レベル: 要件定義書（ACID保証）に基づく

    // 【テストデータ準備】: 2つのタグを持つプレイヤーを作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "タグA", "#FF0000", false);
    let pt = assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();

    // 【元のdisplay_orderを記録】: ロールバック確認用
    let original_order = pt.display_order;

    // 【実際の処理実行】: 1つ目は有効、2つ目は存在しないID
    let tag_orders = vec![(pt.id, 5), (999, 6)]; // 999は存在しない
    let result = reorder_player_tags_internal(player_id, tag_orders, &db);

    // 【結果検証】: エラーになることを確認
    assert!(result.is_err(), "存在しないIDでエラーになること"); // 【確認内容】: エラー 🔵

    // 【追加検証】: 全ロールバックされていることを確認
    // 【確認ポイント】: display_orderが元の値のまま変更されていない
    let conn = db.0.lock().unwrap();
    let current_order: i32 = conn
        .query_row(
            "SELECT display_order FROM player_tags WHERE id = ?1",
            params![pt.id],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(current_order, original_order); // 【確認内容】: ロールバックされている 🔵
}

// ============================================
// 正常系テスト（get_affected_players_count_by_tag）
// ============================================

// TC-COUNT-001: タグに紐づくプレイヤーが0人の場合 🔵
#[test]
fn test_get_affected_players_count_zero() {
    // 【テスト目的】: タグが存在するが、どのプレイヤーにも割り当てられていない場合の動作確認
    // 【テスト内容】: player_tagsに該当tag_idのレコードが0件の状態でカウント取得
    // 【期待される動作】: Ok(0) が返される
    // 🔵 信頼性レベル: 要件定義書（REQ-505）に基づく

    // 【テストデータ準備】: タグを作成するがプレイヤーには割り当てない
    // 【初期条件設定】: player_tagsテーブルにはレコードが存在しない状態
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "未割り当てタグ", "#3498DB", false);

    // 【実際の処理実行】: タグに紐づくプレイヤー数を取得
    // 【処理内容】: get_affected_players_count_by_tag_internal を呼び出し
    let result = get_affected_players_count_by_tag_internal(tag_id, &db);

    // 【結果検証】: 成功してカウントが0であることを確認
    // 【期待値確認】: 割り当てがない場合は0人
    assert!(result.is_ok(), "タグ存在時は成功すること"); // 【確認内容】: 成功 🔵
    assert_eq!(result.unwrap(), 0); // 【確認内容】: 割り当てなしの場合は0 🔵
}

// TC-COUNT-002: タグに紐づくプレイヤーが1人の場合 🔵
#[test]
fn test_get_affected_players_count_one() {
    // 【テスト目的】: 基本的なカウント機能（1件）の動作確認
    // 【テスト内容】: 1プレイヤーにタグを割り当ててカウント取得
    // 【期待される動作】: Ok(1) が返される
    // 🔵 信頼性レベル: 要件定義書（REQ-505）に基づく

    // 【テストデータ準備】: 1プレイヤーとタグを作成し、割り当て
    // 【初期条件設定】: player_tagsテーブルに1件レコードが存在する状態
    let db = create_test_db();
    let player_id = insert_test_player(&db, "プレイヤー1");
    let tag_id = insert_test_tag(&db, "レギュラー", "#3498DB", false);
    assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();

    // 【実際の処理実行】: タグに紐づくプレイヤー数を取得
    // 【処理内容】: get_affected_players_count_by_tag_internal を呼び出し
    let result = get_affected_players_count_by_tag_internal(tag_id, &db);

    // 【結果検証】: 成功してカウントが1であることを確認
    // 【期待値確認】: 1人のプレイヤーに割り当て済みなので1を返す
    assert!(result.is_ok(), "正常にカウント取得できること"); // 【確認内容】: 成功 🔵
    assert_eq!(result.unwrap(), 1); // 【確認内容】: 1人のプレイヤーに割り当て済み 🔵
}

// TC-COUNT-003: タグに紐づくプレイヤーが複数人の場合 🔵
#[test]
fn test_get_affected_players_count_multiple() {
    // 【テスト目的】: 複数プレイヤーへのタグ割り当て時のカウント機能確認
    // 【テスト内容】: 3プレイヤーに同一タグを割り当ててカウント取得
    // 【期待される動作】: Ok(3) が返される
    // 🔵 信頼性レベル: 要件定義書（REQ-505）に基づく

    // 【テストデータ準備】: 3プレイヤーと強度ありタグを作成し、全員に割り当て
    // 【初期条件設定】: player_tagsテーブルに3件レコードが存在する状態
    let db = create_test_db();
    let p1 = insert_test_player(&db, "プレイヤー1");
    let p2 = insert_test_player(&db, "プレイヤー2");
    let p3 = insert_test_player(&db, "プレイヤー3");
    let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

    assign_tag_to_player_internal(p1, tag_id, Some(3), &db).unwrap();
    assign_tag_to_player_internal(p2, tag_id, Some(5), &db).unwrap();
    assign_tag_to_player_internal(p3, tag_id, Some(1), &db).unwrap();

    // 【実際の処理実行】: タグに紐づくプレイヤー数を取得
    // 【処理内容】: get_affected_players_count_by_tag_internal を呼び出し
    let result = get_affected_players_count_by_tag_internal(tag_id, &db);

    // 【結果検証】: 成功してカウントが3であることを確認
    // 【期待値確認】: 3人のプレイヤーに割り当て済みなので3を返す
    assert!(result.is_ok(), "正常にカウント取得できること"); // 【確認内容】: 成功 🔵
    assert_eq!(result.unwrap(), 3); // 【確認内容】: 3人のプレイヤーに割り当て済み 🔵
}

// TC-COUNT-004: DISTINCT動作確認（同一プレイヤー・異なる強度） 🔵
#[test]
fn test_get_affected_players_count_distinct() {
    // 【テスト目的】: REQ-507の核心機能（同一プレイヤー・異なる強度でも1人としてカウント）
    // 【テスト内容】: 1プレイヤーに同一タグを強度Ⅲと強度Ⅴで割り当て、DISTINCT player_idでカウント
    // 【期待される動作】: Ok(1) が返される（2ではなく1）
    // 🔵 信頼性レベル: 要件定義書（REQ-507, REQ-207）およびIssue #15の説明に基づく

    // 【テストデータ準備】: 1プレイヤーと強度ありタグを作成し、異なる強度で2回割り当て
    // 【初期条件設定】: player_tagsテーブルには2件レコードが存在するが、player_idは同一
    let db = create_test_db();
    let player_id = insert_test_player(&db, "テストプレイヤー");
    let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

    // 同一プレイヤーに異なる強度で2回割り当て（REQ-207により可能）
    assign_tag_to_player_internal(player_id, tag_id, Some(3), &db).unwrap();
    assign_tag_to_player_internal(player_id, tag_id, Some(5), &db).unwrap();

    // 【実際の処理実行】: タグに紐づくプレイヤー数を取得（DISTINCT動作）
    // 【処理内容】: SELECT COUNT(DISTINCT player_id) により重複を除外したカウント
    let result = get_affected_players_count_by_tag_internal(tag_id, &db);

    // 【結果検証】: 成功してカウントが1であることを確認
    // 【期待値確認】: 同一プレイヤーは1人としてカウント（DISTINCT動作）
    assert!(result.is_ok(), "正常にカウント取得できること"); // 【確認内容】: 成功 🔵
    assert_eq!(result.unwrap(), 1); // 【確認内容】: 同一プレイヤーは1人としてカウント（DISTINCT動作）🔵

    // 【追加検証】: player_tagsには2件存在することを確認（DISTINCTなしなら2になるはず）
    // 【確認ポイント】: レコード数は2件だが、DISTINCT player_idでは1件になること
    let conn = db.0.lock().unwrap();
    let row_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_tags WHERE tag_id = ?1",
            params![tag_id],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(row_count, 2); // 【確認内容】: player_tagsには2件レコードが存在 🔵
}

// ============================================
// 異常系テスト（get_affected_players_count_by_tag）
// ============================================

// TC-COUNT-ERR-001: 存在しないtag_id 🔵
#[test]
fn test_get_affected_players_count_nonexistent_tag() {
    // 【テスト目的】: 不正なタグIDでの操作を防止
    // 【テスト内容】: 存在しないtag_idでカウント取得を試行
    // 【期待される動作】: Err("Tag not found")
    // 🔵 信頼性レベル: 既存パターン（tags.rs:check_tag_exists）に基づく

    // 【テストデータ準備】: タグを作成しない
    // 【初期条件設定】: tagsテーブルにレコードが存在しない状態
    let db = create_test_db();

    // 【実際の処理実行】: 存在しないtag_idでカウント取得を試行
    // 【処理内容】: check_tag_existsヘルパー関数によるバリデーションでエラー
    let result = get_affected_players_count_by_tag_internal(999, &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: "Tag not found"エラーメッセージ
    assert!(result.is_err(), "存在しないtag_idでエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("Tag not found")); // 【確認内容】: エラーメッセージが正しいこと 🔵
}

// ============================================
// 境界値テスト（get_affected_players_count_by_tag）
// ============================================

// TC-COUNT-EDGE-001: CASCADE削除後のカウント 🔵
#[test]
fn test_get_affected_players_count_after_cascade_delete() {
    // 【テスト目的】: ON DELETE CASCADEによる自動削除後の動作確認
    // 【テスト内容】: タグ削除後、該当player_tagsレコードが自動削除されることを確認
    // 【期待される動作】: タグ削除後は Err("Tag not found") が返される
    // 🔵 信頼性レベル: schema.rs:48-49（ON DELETE CASCADE定義）に基づく

    // 【テストデータ準備】: プレイヤーとタグを作成し、タグ割り当て
    // 【初期条件設定】: player_tagsテーブルにレコードが存在する状態
    let db = create_test_db();
    let player_id = insert_test_player(&db, "プレイヤー1");
    let tag_id = insert_test_tag(&db, "削除予定タグ", "#E74C3C", false);
    assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();

    // 【タグ削除実行】: CASCADE削除でplayer_tagsも削除される
    // 【CASCADE動作確認】: ON DELETE CASCADEにより関連player_tagsも自動削除
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM tags WHERE id = ?1", params![tag_id])
        .unwrap();
    drop(conn);

    // 【実際の処理実行】: 削除済みタグでカウント取得を試行
    // 【処理内容】: check_tag_existsヘルパー関数によるバリデーションでエラー
    let result = get_affected_players_count_by_tag_internal(tag_id, &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: タグ削除後は"Tag not found"エラーが発生
    assert!(result.is_err(), "削除済みタグでエラーになること"); // 【確認内容】: エラー 🔵
    assert!(result.unwrap_err().contains("Tag not found")); // 【確認内容】: エラーメッセージが正しいこと 🔵
}

// TC-COUNT-EDGE-002: 大量のプレイヤー（パフォーマンステスト） 🟡
#[test]
fn test_get_affected_players_count_performance() {
    // 【テスト目的】: 大量データでの性能確認（インデックス効果の検証）
    // 【テスト内容】: 100プレイヤーに同一タグを割り当ててカウント取得
    // 【期待される動作】: Ok(100) が返される（idx_player_tags_tag_idが機能すること）
    // 🟡 信頼性レベル: NFR-203（パフォーマンス要件）から妥当な推測

    // 【テストデータ準備】: 100プレイヤーとタグを作成し、全員に割り当て
    // 【初期条件設定】: player_tagsテーブルに100件レコードが存在する状態
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "人気タグ", "#2ECC71", false);

    // 100人のプレイヤーに割り当て
    for i in 0..100 {
        let player_id = insert_test_player(&db, &format!("プレイヤー{}", i));
        assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();
    }

    // 【実際の処理実行】: パフォーマンス測定しながらカウント取得
    // 【処理内容】: idx_player_tags_tag_idインデックスを使用した高速カウント
    let start = std::time::Instant::now();
    let result = get_affected_players_count_by_tag_internal(tag_id, &db);
    let elapsed = start.elapsed();

    // 【結果検証】: 成功してカウントが100であることを確認
    // 【期待値確認】: 100人全員がカウントされる
    assert!(result.is_ok(), "大量データでも正常に動作すること"); // 【確認内容】: 成功 🔵
    assert_eq!(result.unwrap(), 100); // 【確認内容】: 100人全員がカウントされること 🔵

    // 【パフォーマンス検証】: インデックスにより高速に動作すること
    // 【期待値確認】: インデックスあり: 50ms以内を目安
    assert!(elapsed.as_millis() < 50); // 【確認内容】: インデックスにより高速に動作すること 🟡
}

// ============================================
// 統合テスト（get_affected_players_count_by_tag）
// ============================================

// TC-COUNT-INT-001: タグ割り当て・カウント・解除・カウントの一連の流れ 🔵
#[test]
fn test_get_affected_players_count_integration() {
    // 【テスト目的】: 既存機能との統合動作確認
    // 【テスト内容】: assign → count(1) → assign → count(2) → remove → count(1) → remove → count(0)
    // 【期待される動作】: 各操作後のカウントが正しく更新されること
    // 🔵 信頼性レベル: 設計書の統合テストとして

    // 【テストデータ準備】: 2プレイヤーとタグを作成
    // 【初期条件設定】: タグは作成済みだが未割り当ての状態
    let db = create_test_db();
    let p1 = insert_test_player(&db, "プレイヤー1");
    let p2 = insert_test_player(&db, "プレイヤー2");
    let tag_id = insert_test_tag(&db, "テストタグ", "#9B59B6", false);

    // 【実際の処理実行】: 割り当てとカウントを繰り返す統合テスト

    // 【初期状態確認】: 0人
    // 【期待値確認】: タグ未割り当て状態では0人
    let count0 = get_affected_players_count_by_tag_internal(tag_id, &db).unwrap();
    assert_eq!(count0, 0); // 【確認内容】: 初期状態は0人 🔵

    // 【プレイヤー1に割り当て】: 1人になる
    // 【期待値確認】: 1人に割り当て後は1人
    let pt1 = assign_tag_to_player_internal(p1, tag_id, None, &db).unwrap();
    let count1 = get_affected_players_count_by_tag_internal(tag_id, &db).unwrap();
    assert_eq!(count1, 1); // 【確認内容】: 1人に割り当て後は1人 🔵

    // 【プレイヤー2に割り当て】: 2人になる
    // 【期待値確認】: 2人に割り当て後は2人
    let pt2 = assign_tag_to_player_internal(p2, tag_id, None, &db).unwrap();
    let count2 = get_affected_players_count_by_tag_internal(tag_id, &db).unwrap();
    assert_eq!(count2, 2); // 【確認内容】: 2人に割り当て後は2人 🔵

    // 【プレイヤー1のタグを解除】: 1人に戻る
    // 【期待値確認】: 1人解除後は1人
    remove_tag_from_player_internal(pt1.id, &db).unwrap();
    let count3 = get_affected_players_count_by_tag_internal(tag_id, &db).unwrap();
    assert_eq!(count3, 1); // 【確認内容】: 1人解除後は1人 🔵

    // 【プレイヤー2のタグを解除】: 0人に戻る
    // 【期待値確認】: 全解除後は0人
    remove_tag_from_player_internal(pt2.id, &db).unwrap();
    let count4 = get_affected_players_count_by_tag_internal(tag_id, &db).unwrap();
    assert_eq!(count4, 0); // 【確認内容】: 全解除後は0人 🔵
}
