use crate::database::models::{PlayerCategory, NAME_MAX_LENGTH, NAME_MIN_LENGTH};
use crate::database::PlayerDatabase;
use rusqlite::params;

// ============================================
// テストヘルパー関数
// ============================================

/// テスト用データベースを作成
fn create_test_db() -> PlayerDatabase {
    PlayerDatabase::new_test().expect("Failed to create test database")
}

/// テスト用の種別を作成
fn insert_test_category(db: &PlayerDatabase, name: &str, color: &str) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params![name, color],
    )
    .expect("Failed to insert test category");
    conn.last_insert_rowid()
}

/// テスト用のプレイヤーを作成
fn insert_test_player(db: &PlayerDatabase, name: &str, category_id: Option<i64>) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params![name, category_id],
    )
    .expect("Failed to insert test player");
    conn.last_insert_rowid()
}

// ============================================
// TC-CREATE-CAT-001: 種別を名前と色で作成 🔵
// ============================================

#[test]
fn test_create_category_with_name_and_color() {
    // 【テスト目的】: プレイヤー種別を名前と色で正常に作成できることを確認
    // 【テスト内容】: REQ-101, REQ-102の基本的な種別作成機能を検証
    // 【期待される動作】: 種別がデータベースに保存され、PlayerCategoryエンティティが返される
    // 🔵 信頼性レベル: 要件定義書（REQ-101, REQ-102）に基づく

    // 【テストデータ準備】: 実際のユーザーが使用する典型的な種別名と色を用意
    // 【初期条件設定】: テスト用データベースを初期化し、クリーンな状態を確保
    let db = create_test_db();

    // 【実際の処理実行】: 種別作成コマンドを呼び出し
    // 【処理内容】: 名前「タイト」と色「#FF0000」で種別を作成
    let result = super::categories::create_category_internal("タイト", "#FF0000", &db);

    // 【結果検証】: 種別が正常に作成されることを確認
    // 【期待値確認】: Okが返され、種別情報が正しく設定されている
    assert!(result.is_ok(), "種別作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let category = result.unwrap();
    assert_eq!(category.name, "タイト"); // 【確認内容】: 種別名が正しく設定されている 🔵
    assert_eq!(category.color, "#FF0000"); // 【確認内容】: 色が正しく設定されている 🔵
}

// ============================================
// TC-CREATE-CAT-002: 複数の種別を作成 🔵
// ============================================

#[test]
fn test_create_multiple_categories() {
    // 【テスト目的】: 複数の種別を作成でき、IDが自動採番されることを確認
    // 【テスト内容】: AUTOINCREMENT主キーが正常に機能することを検証
    // 【期待される動作】: 各種別が異なるIDで保存される
    // 🔵 信頼性レベル: データベーススキーマに基づく

    // 【テストデータ準備】: ユーザーが複数の分類を作成するシナリオを想定
    // 【初期条件設定】: 3つの異なる種別を連続作成
    let db = create_test_db();

    // 【実際の処理実行】: 3つの種別を順番に作成
    // 【処理内容】: タイト、ルース、アグレッシブの3種別を作成
    let cat1 = super::categories::create_category_internal("タイト", "#FF0000", &db);
    let cat2 = super::categories::create_category_internal("ルース", "#00FF00", &db);
    let cat3 = super::categories::create_category_internal("アグレッシブ", "#0000FF", &db);

    // 【結果検証】: 3つの種別が作成され、IDが異なることを確認
    // 【期待値確認】: 各種別がid=1, 2, 3で作成される
    assert!(cat1.is_ok(), "1つ目の種別作成が成功すること"); // 【確認内容】: 1つ目が成功 🔵
    assert!(cat2.is_ok(), "2つ目の種別作成が成功すること"); // 【確認内容】: 2つ目が成功 🔵
    assert!(cat3.is_ok(), "3つ目の種別作成が成功すること"); // 【確認内容】: 3つ目が成功 🔵

    let id1 = cat1.unwrap().id;
    let id2 = cat2.unwrap().id;
    let id3 = cat3.unwrap().id;

    assert_ne!(id1, id2); // 【確認内容】: ID1とID2が異なる 🔵
    assert_ne!(id2, id3); // 【確認内容】: ID2とID3が異なる 🔵
    assert_ne!(id1, id3); // 【確認内容】: ID1とID3が異なる 🔵
}

// ============================================
// TC-UPDATE-CAT-001: 種別名のみ更新 🔵
// ============================================

#[test]
fn test_update_category_name_only() {
    // 【テスト目的】: 種別名のみを更新できることを確認
    // 【テスト内容】: 部分更新（nameのみ）が正しく機能することを検証
    // 【期待される動作】: 名前が更新され、色は変更されず、updated_atが自動更新される
    // 🔵 信頼性レベル: 要件定義書（REQ-105）に基づく

    // 【テストデータ準備】: 事前に種別を作成してから部分更新を実行
    // 【初期条件設定】: 種別「タイト」を作成
    let db = create_test_db();
    let category_id = insert_test_category(&db, "タイト", "#FF0000");

    // 【実際の処理実行】: 名前のみを更新
    // 【処理内容】: 色は指定せず、nameのみ「タイトパッシブ」に更新
    let result = super::categories::update_category_internal(
        category_id,
        Some("タイトパッシブ"),
        None,
        &db,
    );

    // 【結果検証】: 名前が更新され、色は元のままであることを確認
    // 【期待値確認】: 部分更新により、colorは変更されない
    assert!(result.is_ok(), "名前のみの更新が成功すること"); // 【確認内容】: 更新処理が成功している 🔵
    let updated = result.unwrap();
    assert_eq!(updated.name, "タイトパッシブ"); // 【確認内容】: 名前が更新されている 🔵
    assert_eq!(updated.color, "#FF0000"); // 【確認内容】: 色は変更されていない 🔵
}

// ============================================
// TC-DELETE-CAT-001: 種別を正常に削除 🔵
// ============================================

#[test]
fn test_delete_category_success() {
    // 【テスト目的】: 種別を削除できることを確認
    // 【テスト内容】: 基本的な削除機能が動作することを検証
    // 【期待される動作】: 種別が削除され、Ok(())が返される
    // 🔵 信頼性レベル: 要件定義書（REQ-106）に基づく

    // 【テストデータ準備】: 種別を事前に作成してから削除
    // 【初期条件設定】: 削除対象種別を用意
    let db = create_test_db();
    let category_id = insert_test_category(&db, "削除テスト", "#FF0000");

    // 【実際の処理実行】: 種別を削除
    // 【処理内容】: DELETEクエリが正常実行されることを確認
    let result = super::categories::delete_category_internal(category_id, &db);

    // 【結果検証】: 削除が成功することを確認
    // 【期待値確認】: Ok(())が返され、種別が削除されている
    assert!(result.is_ok(), "種別削除が成功すること"); // 【確認内容】: 削除処理が成功している 🔵

    // 【追加検証】: 種別が削除されていることを確認
    let conn = db.0.lock().unwrap();
    let category_exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_categories WHERE id = ?1",
            params![category_id],
            |row| row.get(0),
        )
        .expect("Failed to check category existence");
    assert_eq!(category_exists, 0); // 【確認内容】: 種別が削除されている 🔵
}

// ============================================
// TC-GET-ALL-CAT-001: 全種別を取得 🔵
// ============================================

#[test]
fn test_get_all_categories() {
    // 【テスト目的】: 全種別が正しく取得できることを確認
    // 【テスト内容】: データベース内の全種別がVecで返されることを検証
    // 【期待される動作】: created_at昇順でソートされた全種別が返される
    // 🔵 信頼性レベル: 基本的なCRUD操作

    // 【テストデータ準備】: 3つの種別を作成
    // 【初期条件設定】: 種別マスタに3件データを登録
    let db = create_test_db();
    insert_test_category(&db, "タイト", "#FF0000");
    insert_test_category(&db, "ルース", "#00FF00");
    insert_test_category(&db, "アグレッシブ", "#0000FF");

    // 【実際の処理実行】: 全種別を取得
    // 【処理内容】: get_all_categoriesコマンドを呼び出し
    let result = super::categories::get_all_categories_internal(&db);

    // 【結果検証】: 3件の種別が取得されることを確認
    // 【期待値確認】: Vec<PlayerCategory>が3件含まれる
    assert!(result.is_ok(), "全種別取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let categories = result.unwrap();
    assert_eq!(categories.len(), 3); // 【確認内容】: 3件取得されている 🔵
}

// ============================================
// TC-CREATE-CAT-ERR-001: 空文字の種別名でエラー 🔵
// ============================================

#[test]
fn test_create_category_empty_name_error() {
    // 【テスト目的】: 種別名が空文字の場合、適切なエラーが返されることを確認
    // 【テスト内容】: バリデーションエラーが正しく処理され、種別が作成されないことを検証
    // 【期待される動作】: エラーメッセージが返され、データベースにレコードが追加されない
    // 🔵 信頼性レベル: 要件定義書（EDGE-102: 1～50文字制限）とスキーマCHECK制約に基づく

    // 【テストデータ準備】: 空文字を使用して、バリデーションエラーを発生させる
    // 【初期条件設定】: クリーンなデータベース状態でエラーハンドリングを検証
    let db = create_test_db();

    // 【実際の処理実行】: 空文字で種別作成を試みる
    // 【処理内容】: バリデーションチェックが機能することを確認
    let result = super::categories::create_category_internal("", "#FF0000", &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: 明確なエラーメッセージが含まれている
    assert!(result.is_err(), "空文字ではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("1")
            && error_message.contains("50")
            && error_message.contains("character"),
        "エラーメッセージに文字数制限が含まれること"
    ); // 【確認内容】: 文字数制限のエラーメッセージが返される 🔵
}

// ============================================
// TC-CREATE-CAT-ERR-002: 51文字の種別名でエラー 🔵
// ============================================

#[test]
fn test_create_category_too_long_name_error() {
    // 【テスト目的】: 種別名が51文字の場合、適切なエラーが返されることを確認
    // 【テスト内容】: 最大文字数超過のバリデーションが機能することを検証
    // 【期待される動作】: エラーメッセージが返され、データベース制約が保護される
    // 🔵 信頼性レベル: 要件定義書（EDGE-102: 最大50文字）に基づく

    // 【テストデータ準備】: 51文字の名前を生成してバリデーションエラーを発生させる
    // 【初期条件設定】: 境界値超過のケースを明確に検証
    let db = create_test_db();
    let long_name = "A".repeat(51); // 51文字

    // 【実際の処理実行】: 51文字の名前で種別作成を試みる
    // 【処理内容】: 最大文字数制限のバリデーションが機能することを確認
    let result = super::categories::create_category_internal(&long_name, "#FF0000", &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: 文字数制限のエラーメッセージが返される
    assert!(result.is_err(), "51文字ではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("50") && error_message.contains("character"),
        "エラーメッセージに最大文字数が含まれること"
    ); // 【確認内容】: 最大文字数のエラーメッセージが返される 🔵
}

// ============================================
// TC-CREATE-CAT-ERR-003: 同名種別でUNIQUEエラー 🔵
// ============================================

#[test]
fn test_create_category_duplicate_name_error() {
    // 【テスト目的】: 既存と同名の種別を作成しようとするとエラーが返されることを確認
    // 【テスト内容】: UNIQUE制約違反が正しく検出されることを検証
    // 【期待される動作】: "Category name already exists" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（EDGE-002: 同名種別の重複防止）に基づく

    // 【テストデータ準備】: 同じ名前で2回作成を試みる
    // 【初期条件設定】: 1つ目の種別を作成してから、同名で2つ目を作成試行
    let db = create_test_db();
    super::categories::create_category_internal("タイト", "#FF0000", &db)
        .expect("First category creation should succeed");

    // 【実際の処理実行】: 同じ名前で2つ目の種別作成を試みる（色は異なる）
    // 【処理内容】: UNIQUE制約違反が検出されることを確認
    let result = super::categories::create_category_internal("タイト", "#00FF00", &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: "Category name already exists" エラーメッセージが含まれている
    assert!(result.is_err(), "同名種別ではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("already exists"),
        "エラーメッセージに重複エラーが含まれること"
    ); // 【確認内容】: 重複エラーメッセージが返される 🔵
}

// ============================================
// TC-CREATE-CAT-ERR-004: 不正なHEX形式でエラー 🔵
// ============================================

#[test]
fn test_create_category_invalid_hex_format_error() {
    // 【テスト目的】: HEX形式でない色指定でバリデーションエラーが返されることを確認
    // 【テスト内容】: HEXカラーコードバリデーションが機能することを検証
    // 【期待される動作】: "Invalid HEX color format" エラーが返される
    // 🔵 信頼性レベル: models.rs validate_hex_color関数に基づく

    // 【テストデータ準備】: #なしの色コードを使用してバリデーションエラーを発生させる
    // 【初期条件設定】: 不正なHEX形式でエラーハンドリングを検証
    let db = create_test_db();

    // 【実際の処理実行】: #なしの色コードで種別作成を試みる
    // 【処理内容】: 色形式バリデーションが機能することを確認
    let result = super::categories::create_category_internal("タイト", "FF0000", &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: HEX形式エラーメッセージが含まれている
    assert!(result.is_err(), "#なしではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("HEX") && error_message.contains("format"),
        "エラーメッセージにHEX形式エラーが含まれること"
    ); // 【確認内容】: HEX形式エラーメッセージが返される 🔵
}

// ============================================
// TC-UPDATE-CAT-ERR-001: 存在しない種別IDでエラー 🔵
// ============================================

#[test]
fn test_update_category_not_found_error() {
    // 【テスト目的】: 存在しない種別IDで更新しようとするとエラーが返されることを確認
    // 【テスト内容】: リソース未検出エラーが正しく処理されることを検証
    // 【期待される動作】: "Category not found" エラーが返される
    // 🔵 信頼性レベル: エラーハンドリング仕様に基づく

    // 【テストデータ準備】: 存在しないID（999）を使用してエラーを発生させる
    // 【初期条件設定】: 種別が存在しない状態でエラーハンドリングを検証
    let db = create_test_db();

    // 【実際の処理実行】: 存在しないIDで更新を試みる
    // 【処理内容】: 存在確認チェックが機能することを確認
    let result = super::categories::update_category_internal(999, Some("テスト"), None, &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: "Category not found" エラーメッセージが含まれている
    assert!(result.is_err(), "存在しないIDではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("Category") && error_message.contains("not found"),
        "エラーメッセージに種別未検出が含まれること"
    ); // 【確認内容】: 種別未検出のエラーメッセージが返される 🔵
}

// ============================================
// TC-CREATE-CAT-BOUND-001: 1文字の種別名（最小値） 🔵
// ============================================

#[test]
fn test_create_category_min_length_name() {
    // 【テスト目的】: 種別名が1文字の場合、正常に作成できることを確認
    // 【テスト内容】: CHECK制約の最小許容値でも正常動作することを検証
    // 【期待される動作】: 1文字の種別名でもデータベースに保存される
    // 🔵 信頼性レベル: 要件定義書（EDGE-102: 最小1文字）に基づく

    // 【テストデータ準備】: 1文字の名前を使用して、最小境界値を検証
    // 【初期条件設定】: 極端に短い名前でも正常動作することを確認
    let db = create_test_db();

    // 【実際の処理実行】: 1文字の名前で種別を作成
    // 【処理内容】: 最小境界値での作成処理を実行
    let result = super::categories::create_category_internal("A", "#FF0000", &db);

    // 【結果検証】: 正常に作成されることを確認
    // 【期待値確認】: 1文字の名前が正しく保存される
    assert!(result.is_ok(), "1文字の名前でも作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let category = result.unwrap();
    assert_eq!(category.name, "A"); // 【確認内容】: 1文字の名前が正しく設定されている 🔵
}

// ============================================
// TC-CREATE-CAT-BOUND-002: 50文字の種別名（最大値） 🔵
// ============================================

#[test]
fn test_create_category_max_length_name() {
    // 【テスト目的】: 種別名が50文字の場合、正常に作成できることを確認
    // 【テスト内容】: CHECK制約の最大許容値でも正常動作することを検証
    // 【期待される動作】: 50文字全てがデータベースに保存され、文字欠損がない
    // 🔵 信頼性レベル: 要件定義書（EDGE-102: 最大50文字）に基づく

    // 【テストデータ準備】: 50文字の名前を生成して、最大境界値を検証
    // 【初期条件設定】: 極端に長い名前でも正常動作することを確認
    let db = create_test_db();
    let max_name = "あ".repeat(50); // 50文字

    // 【実際の処理実行】: 50文字の名前で種別を作成
    // 【処理内容】: 最大境界値での作成処理を実行
    let result = super::categories::create_category_internal(&max_name, "#FF0000", &db);

    // 【結果検証】: 正常に作成されることを確認
    // 【期待値確認】: 50文字全てが正しく保存される
    assert!(result.is_ok(), "50文字の名前でも作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let category = result.unwrap();
    assert_eq!(category.name, max_name); // 【確認内容】: 50文字の名前が正しく設定されている 🔵
    assert_eq!(category.name.chars().count(), 50); // 【確認内容】: 文字数が50であること 🔵
}

// ============================================
// TC-DELETE-CAT-CASCADE-001: 種別削除時のON DELETE SET NULL確認 🔵
// ============================================

#[test]
fn test_delete_category_cascade_set_null() {
    // 【テスト目的】: 種別削除時、プレイヤーのcategory_idがNULLになることを確認
    // 【テスト内容】: ON DELETE SET NULL制約が正しく機能することを検証
    // 【期待される動作】: 種別削除後、該当プレイヤーのcategory_idがNULLに設定される
    // 🔵 信頼性レベル: schema.rs ON DELETE SET NULL制約とNFR-202に基づく

    // 【テストデータ準備】: 種別とプレイヤーを作成してからCASCADE動作を検証
    // 【初期条件設定】: 種別付きプレイヤーを用意
    let db = create_test_db();
    let category_id = insert_test_category(&db, "タイト", "#FF0000");
    let player_id = insert_test_player(&db, "山田太郎", Some(category_id));

    // プレイヤーが種別を持っていることを確認
    let conn = db.0.lock().unwrap();
    let player_category_id: Option<i64> = conn
        .query_row(
            "SELECT category_id FROM players WHERE id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .expect("Failed to get player category_id");
    assert_eq!(player_category_id, Some(category_id)); // 【確認内容】: 種別が設定されている 🔵
    drop(conn);

    // 【実際の処理実行】: 種別を削除
    // 【処理内容】: ON DELETE SET NULLが自動的に実行されることを確認
    let result = super::categories::delete_category_internal(category_id, &db);

    // 【結果検証】: 削除が成功し、プレイヤーのcategory_idがNULLになることを確認
    // 【期待値確認】: ON DELETE SET NULL制約により自動設定
    assert!(result.is_ok(), "種別削除が成功すること"); // 【確認内容】: 削除処理が成功している 🔵

    // プレイヤーのcategory_idがNULLになったことを確認
    let conn = db.0.lock().unwrap();
    let player_category_id_after: Option<i64> = conn
        .query_row(
            "SELECT category_id FROM players WHERE id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .expect("Failed to get player category_id after delete");
    assert_eq!(player_category_id_after, None); // 【確認内容】: category_idがNULLになっている 🔵
}

// ============================================
// TC-GET-ALL-CAT-SORT-001: created_at昇順ソート確認 🔵
// ============================================

#[test]
fn test_get_all_categories_sorted_by_created_at() {
    // 【テスト目的】: 種別リストがcreated_at昇順でソートされることを確認
    // 【テスト内容】: ORDER BY created_at ASCが正しく機能することを検証
    // 【期待される動作】: 最初に作成した種別が先頭
    // 🔵 信頼性レベル: 要件定義（created_at昇順）に基づく

    // 【テストデータ準備】: 種別を時間差で3件作成
    // 【初期条件設定】: 作成順序の確認
    let db = create_test_db();
    let cat1_id = insert_test_category(&db, "種別A", "#FF0000");
    std::thread::sleep(std::time::Duration::from_millis(1100));
    let cat2_id = insert_test_category(&db, "種別B", "#00FF00");
    std::thread::sleep(std::time::Duration::from_millis(1100));
    let cat3_id = insert_test_category(&db, "種別C", "#0000FF");

    // 【実際の処理実行】: 全種別を取得
    // 【処理内容】: created_at昇順でソートされた一覧を取得
    let result = super::categories::get_all_categories_internal(&db);

    // 【結果検証】: created_at昇順でソートされることを確認
    // 【期待値確認】: 作成順序通り「A, B, C」の順で返される
    assert!(result.is_ok(), "全種別取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let categories = result.unwrap();
    assert_eq!(categories.len(), 3); // 【確認内容】: 3件取得されている 🔵

    // ソート順確認
    assert_eq!(categories[0].id, cat1_id); // 【確認内容】: 1番目が最初に作成された種別 🔵
    assert_eq!(categories[1].id, cat2_id); // 【確認内容】: 2番目が2番目に作成された種別 🔵
    assert_eq!(categories[2].id, cat3_id); // 【確認内容】: 3番目が最後に作成された種別 🔵
}
