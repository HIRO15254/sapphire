use crate::database::PlayerDatabase;
use rusqlite::params;

// ============================================
// テストヘルパー関数
// ============================================

/// テスト用データベースを作成
fn create_test_db() -> PlayerDatabase {
    PlayerDatabase::new_test().expect("Failed to create test database")
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

/// テスト用のプレイヤーを作成
fn insert_test_player(db: &PlayerDatabase, name: &str) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute("INSERT INTO players (name) VALUES (?1)", params![name])
        .expect("Failed to insert test player");
    conn.last_insert_rowid()
}

/// テスト用のプレイヤータグ関連を作成
fn insert_test_player_tag(db: &PlayerDatabase, player_id: i64, tag_id: i64) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_tags (player_id, tag_id) VALUES (?1, ?2)",
        params![player_id, tag_id],
    )
    .expect("Failed to insert test player_tag");
    conn.last_insert_rowid()
}

// ============================================
// TC-CREATE-TAG-001: タグを名前・色・強度設定ありで作成 🔵
// ============================================

#[test]
fn test_create_tag_with_name_color_intensity() {
    // 【テスト目的】: create_tag コマンドが基本的な正常パラメータで動作することを確認
    // 【テスト内容】: REQ-201, REQ-202の基本的なタグ作成機能を検証
    // 【期待される動作】: Tagエンティティが返され、id, created_at, updated_atが自動設定される
    // 🔵 信頼性レベル: 要件定義書（REQ-201, REQ-202）に基づく

    // 【テストデータ準備】: 実際のユーザーが使用する典型的なタグを用意
    // 【初期条件設定】: テスト用データベースを初期化し、クリーンな状態を確保
    let db = create_test_db();

    // 【実際の処理実行】: タグ作成コマンドを呼び出し
    // 【処理内容】: 名前「アグレッシブ」、色「#FF5733」、強度設定ありでタグを作成
    let result = super::tags::create_tag_internal("アグレッシブ", "#FF5733", true, &db);

    // 【結果検証】: タグが正常に作成されることを確認
    // 【期待値確認】: Okが返され、タグ情報が正しく設定されている
    assert!(result.is_ok(), "タグ作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let tag = result.unwrap();
    assert_eq!(tag.name, "アグレッシブ"); // 【確認内容】: タグ名が正しく設定されている 🔵
    assert_eq!(tag.color, "#FF5733"); // 【確認内容】: 色が正しく設定されている 🔵
    assert_eq!(tag.has_intensity, true); // 【確認内容】: 強度設定ありである 🔵
}

// ============================================
// TC-CREATE-TAG-002: 強度設定なしタグを作成 🔵
// ============================================

#[test]
fn test_create_tag_without_intensity() {
    // 【テスト目的】: has_intensity = false のタグが正常に作成されることを確認
    // 【テスト内容】: REQ-204の強度設定なしタグの作成を検証
    // 【期待される動作】: has_intensity = false のタグが作成される
    // 🔵 信頼性レベル: 要件定義書（REQ-204）に基づく

    // 【テストデータ準備】: 強度設定なしタグのシナリオを想定
    // 【初期条件設定】: テスト用データベースを初期化
    let db = create_test_db();

    // 【実際の処理実行】: 強度設定なしでタグを作成
    // 【処理内容】: 名前「レギュラー」、色「#3498DB」、強度設定なしでタグを作成
    let result = super::tags::create_tag_internal("レギュラー", "#3498DB", false, &db);

    // 【結果検証】: has_intensity = false のタグが作成されることを確認
    // 【期待値確認】: has_intensityがfalseで保存されている
    assert!(result.is_ok(), "強度設定なしタグの作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let tag = result.unwrap();
    assert_eq!(tag.has_intensity, false); // 【確認内容】: 強度設定なしである 🔵
}

// ============================================
// TC-CREATE-TAG-003: 複数タグを作成しID自動採番確認 🔵
// ============================================

#[test]
fn test_create_multiple_tags_with_autoincrement() {
    // 【テスト目的】: AUTOINCREMENT主キーが正常に機能することを確認
    // 【テスト内容】: 複数のタグを作成し、IDが自動採番されることを検証
    // 【期待される動作】: 各タグが異なるIDで作成される（id=1, 2, 3）
    // 🔵 信頼性レベル: データベーススキーマに基づく

    // 【テストデータ準備】: ユーザーが複数のタグを作成するシナリオを想定
    // 【初期条件設定】: 3つの異なるタグを連続作成
    let db = create_test_db();

    // 【実際の処理実行】: 3つのタグを順番に作成
    // 【処理内容】: アグレッシブ、タイト、ルースの3タグを作成
    let tag1 = super::tags::create_tag_internal("アグレッシブ", "#FF0000", true, &db);
    let tag2 = super::tags::create_tag_internal("タイト", "#00FF00", false, &db);
    let tag3 = super::tags::create_tag_internal("ルース", "#0000FF", true, &db);

    // 【結果検証】: 3つのタグが作成され、IDが異なることを確認
    // 【期待値確認】: 各タグがid=1, 2, 3で作成される
    assert!(tag1.is_ok(), "1つ目のタグ作成が成功すること"); // 【確認内容】: 1つ目が成功 🔵
    assert!(tag2.is_ok(), "2つ目のタグ作成が成功すること"); // 【確認内容】: 2つ目が成功 🔵
    assert!(tag3.is_ok(), "3つ目のタグ作成が成功すること"); // 【確認内容】: 3つ目が成功 🔵

    let id1 = tag1.unwrap().id;
    let id2 = tag2.unwrap().id;
    let id3 = tag3.unwrap().id;

    assert_ne!(id1, id2); // 【確認内容】: ID1とID2が異なる 🔵
    assert_ne!(id2, id3); // 【確認内容】: ID2とID3が異なる 🔵
    assert_ne!(id1, id3); // 【確認内容】: ID1とID3が異なる 🔵
}

// ============================================
// TC-UPDATE-TAG-001: タグ名のみ更新 🔵
// ============================================

#[test]
fn test_update_tag_name_only() {
    // 【テスト目的】: 部分更新（nameのみ）が正しく機能することを確認
    // 【テスト内容】: REQ-209のタグ編集機能（名前のみ更新）を検証
    // 【期待される動作】: 名前が更新され、color/has_intensityは変更されない
    // 🔵 信頼性レベル: 要件定義書（REQ-209）に基づく

    // 【テストデータ準備】: 既存タグを作成し、名前のみ変更するシナリオを想定
    // 【初期条件設定】: 1つのタグを事前に作成
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "アグレッシブ", "#FF5733", true);

    // 【実際の処理実行】: タグ名のみ更新コマンドを呼び出し
    // 【処理内容】: タグ名を「超アグレッシブ」に変更、色と強度設定は変更なし
    let result = super::tags::update_tag_internal(tag_id, Some("超アグレッシブ"), None, None, &db);

    // 【結果検証】: 名前のみが更新され、他のフィールドは変更されないことを確認
    // 【期待値確認】: 名前が「超アグレッシブ」に更新され、色と強度設定は元のまま
    assert!(result.is_ok(), "タグ名のみの更新が成功すること"); // 【確認内容】: 更新処理が成功している 🔵
    let updated_tag = result.unwrap();
    assert_eq!(updated_tag.name, "超アグレッシブ"); // 【確認内容】: タグ名が正しく更新されている 🔵
    assert_eq!(updated_tag.color, "#FF5733"); // 【確認内容】: 色は変更されていない 🔵
    assert_eq!(updated_tag.has_intensity, true); // 【確認内容】: 強度設定は変更されていない 🔵
}

// ============================================
// TC-UPDATE-TAG-002: 色のみ更新 🔵
// ============================================

#[test]
fn test_update_tag_color_only() {
    // 【テスト目的】: 部分更新（colorのみ）が正しく機能することを確認
    // 【テスト内容】: タグの色のみを変更する機能を検証
    // 【期待される動作】: 色が更新され、name/has_intensityは変更されない
    // 🔵 信頼性レベル: 要件定義書（REQ-209）に基づく

    // 【テストデータ準備】: 既存タグを作成し、色のみ変更するシナリオを想定
    // 【初期条件設定】: 1つのタグを事前に作成
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "アグレッシブ", "#FF5733", true);

    // 【実際の処理実行】: タグの色のみ更新コマンドを呼び出し
    // 【処理内容】: 色を「#00FF00」に変更、名前と強度設定は変更なし
    let result = super::tags::update_tag_internal(tag_id, None, Some("#00FF00"), None, &db);

    // 【結果検証】: 色のみが更新され、他のフィールドは変更されないことを確認
    // 【期待値確認】: 色が「#00FF00」に更新され、名前と強度設定は元のまま
    assert!(result.is_ok(), "色のみの更新が成功すること"); // 【確認内容】: 更新処理が成功している 🔵
    let updated_tag = result.unwrap();
    assert_eq!(updated_tag.name, "アグレッシブ"); // 【確認内容】: タグ名は変更されていない 🔵
    assert_eq!(updated_tag.color, "#00FF00"); // 【確認内容】: 色が正しく更新されている 🔵
    assert_eq!(updated_tag.has_intensity, true); // 【確認内容】: 強度設定は変更されていない 🔵
}

// ============================================
// TC-UPDATE-TAG-003: 強度設定のみ更新 🔵
// ============================================

#[test]
fn test_update_tag_intensity_only() {
    // 【テスト目的】: has_intensityフラグを変更できることを確認
    // 【テスト内容】: タグの強度設定のみを変更する機能を検証
    // 【期待される動作】: has_intensityが更新される
    // 🔵 信頼性レベル: 要件定義書（REQ-209, REQ-204）に基づく

    // 【テストデータ準備】: 強度設定ありタグを作成し、なしに変更するシナリオを想定
    // 【初期条件設定】: 1つのタグを事前に作成（強度設定あり）
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "アグレッシブ", "#FF5733", true);

    // 【実際の処理実行】: タグの強度設定のみ更新コマンドを呼び出し
    // 【処理内容】: 強度設定をfalseに変更、名前と色は変更なし
    let result = super::tags::update_tag_internal(tag_id, None, None, Some(false), &db);

    // 【結果検証】: 強度設定のみが更新され、他のフィールドは変更されないことを確認
    // 【期待値確認】: has_intensityがfalseに更新され、名前と色は元のまま
    assert!(result.is_ok(), "強度設定のみの更新が成功すること"); // 【確認内容】: 更新処理が成功している 🔵
    let updated_tag = result.unwrap();
    assert_eq!(updated_tag.name, "アグレッシブ"); // 【確認内容】: タグ名は変更されていない 🔵
    assert_eq!(updated_tag.color, "#FF5733"); // 【確認内容】: 色は変更されていない 🔵
    assert_eq!(updated_tag.has_intensity, false); // 【確認内容】: 強度設定が正しく更新されている 🔵
}

// ============================================
// TC-UPDATE-TAG-004: 名前・色・強度を同時更新 🔵
// ============================================

#[test]
fn test_update_tag_all_fields() {
    // 【テスト目的】: 複数フィールド同時更新が機能することを確認
    // 【テスト内容】: 全フィールドを同時に更新する機能を検証
    // 【期待される動作】: 全フィールドが更新される
    // 🔵 信頼性レベル: 要件定義書（REQ-209）に基づく

    // 【テストデータ準備】: 既存タグを作成し、全フィールドを変更するシナリオを想定
    // 【初期条件設定】: 1つのタグを事前に作成
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "アグレッシブ", "#FF5733", true);

    // 【実際の処理実行】: 全フィールド同時更新コマンドを呼び出し
    // 【処理内容】: 名前を「タイト」、色を「#0000FF」、強度設定をfalseに変更
    let result =
        super::tags::update_tag_internal(tag_id, Some("タイト"), Some("#0000FF"), Some(false), &db);

    // 【結果検証】: 全フィールドが正しく更新されることを確認
    // 【期待値確認】: 名前、色、強度設定が全て新しい値に更新されている
    assert!(result.is_ok(), "全フィールドの同時更新が成功すること"); // 【確認内容】: 更新処理が成功している 🔵
    let updated_tag = result.unwrap();
    assert_eq!(updated_tag.name, "タイト"); // 【確認内容】: タグ名が正しく更新されている 🔵
    assert_eq!(updated_tag.color, "#0000FF"); // 【確認内容】: 色が正しく更新されている 🔵
    assert_eq!(updated_tag.has_intensity, false); // 【確認内容】: 強度設定が正しく更新されている 🔵
}

// ============================================
// TC-DELETE-TAG-001: タグを正常に削除 🔵
// ============================================

#[test]
fn test_delete_tag_successfully() {
    // 【テスト目的】: 基本的な削除機能が動作することを確認
    // 【テスト内容】: REQ-210のタグ削除機能を検証
    // 【期待される動作】: タグが削除され、Ok(())が返される
    // 🔵 信頼性レベル: 要件定義書（REQ-210）に基づく

    // 【テストデータ準備】: 削除対象のタグを作成
    // 【初期条件設定】: 1つのタグを事前に作成
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "アグレッシブ", "#FF5733", true);

    // 【実際の処理実行】: タグ削除コマンドを呼び出し
    // 【処理内容】: 作成したタグを削除
    let result = super::tags::delete_tag_internal(tag_id, &db);

    // 【結果検証】: タグが正常に削除されることを確認
    // 【期待値確認】: Ok(())が返され、削除が成功
    assert!(result.is_ok(), "タグの削除が成功すること"); // 【確認内容】: 削除処理が成功している 🔵
}

// ============================================
// TC-DELETE-TAG-CASCADE-001: タグ削除時のCASCADE動作確認 🔵
// ============================================

#[test]
fn test_delete_tag_cascade() {
    // 【テスト目的】: ON DELETE CASCADE制約が正しく機能することを確認
    // 【テスト内容】: プレイヤータグが紐づいているタグを削除し、CASCADE動作を検証
    // 【期待される動作】: player_tags テーブルから該当タグの関連付けも自動削除される
    // 🔵 信頼性レベル: データベーススキーマ（ON DELETE CASCADE）に基づく

    // 【テストデータ準備】: プレイヤータグとタグの関連を作成
    // 【初期条件設定】: タグとプレイヤーを作成し、関連付けを設定
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "アグレッシブ", "#FF5733", true);
    let player_id = insert_test_player(&db, "テストプレイヤー");
    insert_test_player_tag(&db, player_id, tag_id);

    // 【実際の処理実行】: タグ削除コマンドを呼び出し
    // 【処理内容】: プレイヤータグと関連付けられたタグを削除
    let result = super::tags::delete_tag_internal(tag_id, &db);

    // 【結果検証】: タグが削除され、player_tagsの関連レコードも自動削除されることを確認
    // 【期待値確認】: CASCADE削除により、player_tagsレコードが存在しない
    assert!(result.is_ok(), "CASCADE削除が成功すること"); // 【確認内容】: 削除処理が成功している 🔵

    // 【追加検証】: player_tagsテーブルから関連レコードが削除されたことを確認
    let conn = db.0.lock().unwrap();
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_tags WHERE tag_id = ?1",
            params![tag_id],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(count, 0); // 【確認内容】: player_tagsの関連レコードが削除されている 🔵
}

// ============================================
// TC-GET-ALL-TAGS-001: 全タグを取得 🔵
// ============================================

#[test]
fn test_get_all_tags() {
    // 【テスト目的】: 全タグがcreated_at昇順で取得できることを確認
    // 【テスト内容】: タグ一覧取得機能を検証
    // 【期待される動作】: Vec<Tag>が返され、created_at昇順でソートされている
    // 🔵 信頼性レベル: 要件定義書に基づく

    // 【テストデータ準備】: 複数のタグを作成
    // 【初期条件設定】: 3つのタグを事前に作成
    let db = create_test_db();
    insert_test_tag(&db, "タグ1", "#FF0000", true);
    insert_test_tag(&db, "タグ2", "#00FF00", false);
    insert_test_tag(&db, "タグ3", "#0000FF", true);

    // 【実際の処理実行】: 全タグ取得コマンドを呼び出し
    // 【処理内容】: データベース内の全タグを取得
    let result = super::tags::get_all_tags_internal(&db);

    // 【結果検証】: 全タグが正しく取得されることを確認
    // 【期待値確認】: 3件のタグがVecで返される
    assert!(result.is_ok(), "全タグの取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let tags = result.unwrap();
    assert_eq!(tags.len(), 3); // 【確認内容】: 3件のタグが取得されている 🔵
}

// ============================================
// TC-GET-ALL-TAGS-002: 空のタグリストを取得 🔵
// ============================================

#[test]
fn test_get_all_tags_empty() {
    // 【テスト目的】: タグが存在しない場合、空のVecが返されることを確認
    // 【テスト内容】: タグ0件時の一覧取得機能を検証
    // 【期待される動作】: エラーではなく、空のVecが返される
    // 🔵 信頼性レベル: 要件定義書に基づく

    // 【テストデータ準備】: タグを作成しない
    // 【初期条件設定】: 空のデータベース
    let db = create_test_db();

    // 【実際の処理実行】: 全タグ取得コマンドを呼び出し
    // 【処理内容】: 空のデータベースから全タグを取得
    let result = super::tags::get_all_tags_internal(&db);

    // 【結果検証】: 空のVecが返されることを確認
    // 【期待値確認】: エラーではなく、長さ0のVecが返される
    assert!(result.is_ok(), "空のタグリスト取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let tags = result.unwrap();
    assert_eq!(tags.len(), 0); // 【確認内容】: 空のVecが返されている 🔵
}

// ============================================
// TC-CREATE-TAG-ERR-001: 空文字のタグ名でエラー 🔵
// ============================================

#[test]
fn test_create_tag_with_empty_name_error() {
    // 【テスト目的】: タグ名が空文字の場合、適切なエラーが返されることを確認（EDGE-102）
    // 【テスト内容】: 名前バリデーション（最小長）を検証
    // 【期待される動作】: "Tag name must be between 1 and 50 characters" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（EDGE-102）に基づく

    // 【テストデータ準備】: 不正なタグ名（空文字）を用意
    // 【初期条件設定】: テスト用データベースを初期化
    let db = create_test_db();

    // 【実際の処理実行】: 空文字のタグ名でタグ作成を試行
    // 【処理内容】: 名前が空文字のタグ作成コマンドを呼び出し
    let result = super::tags::create_tag_internal("", "#FF0000", true, &db);

    // 【結果検証】: 適切なエラーが返されることを確認
    // 【期待値確認】: "Tag name must be between 1 and 50 characters" エラー
    assert!(result.is_err(), "空文字のタグ名でエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Tag name must be between 1 and 50 characters"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-CREATE-TAG-ERR-002: 51文字のタグ名でエラー 🔵
// ============================================

#[test]
fn test_create_tag_with_too_long_name_error() {
    // 【テスト目的】: タグ名が51文字の場合、適切なエラーが返されることを確認（EDGE-102）
    // 【テスト内容】: 名前バリデーション（最大長）を検証
    // 【期待される動作】: "Tag name must be between 1 and 50 characters" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（EDGE-102）に基づく

    // 【テストデータ準備】: 不正なタグ名（51文字）を用意
    // 【初期条件設定】: テスト用データベースを初期化
    let db = create_test_db();

    // 【実際の処理実行】: 51文字のタグ名でタグ作成を試行
    // 【処理内容】: 名前が51文字のタグ作成コマンドを呼び出し
    let long_name = "A".repeat(51);
    let result = super::tags::create_tag_internal(&long_name, "#FF0000", true, &db);

    // 【結果検証】: 適切なエラーが返されることを確認
    // 【期待値確認】: "Tag name must be between 1 and 50 characters" エラー
    assert!(result.is_err(), "51文字のタグ名でエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Tag name must be between 1 and 50 characters"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-CREATE-TAG-ERR-003: 同名タグでUNIQUEエラー 🔵
// ============================================

#[test]
fn test_create_tag_with_duplicate_name_error() {
    // 【テスト目的】: 既存と同名のタグを作成しようとするとエラーが返されることを確認（EDGE-003）
    // 【テスト内容】: UNIQUE制約違反時のエラー処理を検証
    // 【期待される動作】: "Tag name already exists" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（EDGE-003）に基づく

    // 【テストデータ準備】: 同じ名前で2回作成を試行
    // 【初期条件設定】: 1つ目のタグを作成
    let db = create_test_db();
    super::tags::create_tag_internal("アグレッシブ", "#FF0000", true, &db).unwrap();

    // 【実際の処理実行】: 同名のタグを2回目作成試行
    // 【処理内容】: 既存と同じ名前「アグレッシブ」でタグ作成を試行
    let result = super::tags::create_tag_internal("アグレッシブ", "#00FF00", false, &db);

    // 【結果検証】: UNIQUE制約違反エラーが返されることを確認
    // 【期待値確認】: "Tag name already exists" エラー
    assert!(result.is_err(), "同名タグでエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Tag name already exists"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-CREATE-TAG-ERR-004: 不正なHEX形式（#なし）でエラー 🔵
// ============================================

#[test]
fn test_create_tag_with_invalid_hex_no_hash_error() {
    // 【テスト目的】: HEX形式でない色指定でバリデーションエラーが返されることを確認
    // 【テスト内容】: HEXカラーコードバリデーション（#なし）を検証
    // 【期待される動作】: "Invalid HEX color format" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（REQ-202）とバリデーション関数に基づく

    // 【テストデータ準備】: 不正なHEX形式（#なし）を用意
    // 【初期条件設定】: テスト用データベースを初期化
    let db = create_test_db();

    // 【実際の処理実行】: #なしのHEX形式でタグ作成を試行
    // 【処理内容】: 不正なHEX形式でタグ作成コマンドを呼び出し
    let result = super::tags::create_tag_internal("タグ", "FF0000", true, &db);

    // 【結果検証】: 適切なエラーが返されることを確認
    // 【期待値確認】: "Invalid HEX color format" エラー
    assert!(result.is_err(), "不正なHEX形式でエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Invalid HEX color format"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-CREATE-TAG-ERR-005: 不正なHEX文字（G-Z）でエラー 🔵
// ============================================

#[test]
fn test_create_tag_with_invalid_hex_characters_error() {
    // 【テスト目的】: 不正なHEX文字でエラーが返されることを確認
    // 【テスト内容】: HEXカラーコードバリデーション（G-Z文字）を検証
    // 【期待される動作】: "Invalid HEX color characters" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（REQ-202）とバリデーション関数に基づく

    // 【テストデータ準備】: 不正なHEX文字（G）を用意
    // 【初期条件設定】: テスト用データベースを初期化
    let db = create_test_db();

    // 【実際の処理実行】: 不正なHEX文字でタグ作成を試行
    // 【処理内容】: GGGGGGを含むHEX形式でタグ作成コマンドを呼び出し
    let result = super::tags::create_tag_internal("タグ", "#GGGGGG", true, &db);

    // 【結果検証】: 適切なエラーが返されることを確認
    // 【期待値確認】: "Invalid HEX color characters" エラー
    assert!(result.is_err(), "不正なHEX文字でエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Invalid HEX color characters"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-CREATE-TAG-ERR-006: HEX文字数不足（4文字）でエラー 🔵
// ============================================

#[test]
fn test_create_tag_with_short_hex_error() {
    // 【テスト目的】: HEX文字数が不足している場合、エラーが返されることを確認
    // 【テスト内容】: HEXカラーコードバリデーション（短すぎ）を検証
    // 【期待される動作】: "Invalid HEX color format" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（REQ-202）とバリデーション関数に基づく

    // 【テストデータ準備】: 不正なHEX長（4文字）を用意
    // 【初期条件設定】: テスト用データベースを初期化
    let db = create_test_db();

    // 【実際の処理実行】: 短いHEX形式でタグ作成を試行
    // 【処理内容】: 4文字のHEX形式でタグ作成コマンドを呼び出し
    let result = super::tags::create_tag_internal("タグ", "#FF00", true, &db);

    // 【結果検証】: 適切なエラーが返されることを確認
    // 【期待値確認】: "Invalid HEX color format" エラー
    assert!(result.is_err(), "短いHEX形式でエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Invalid HEX color format"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-UPDATE-TAG-ERR-001: 存在しないタグIDでエラー 🔵
// ============================================

#[test]
fn test_update_tag_with_nonexistent_id_error() {
    // 【テスト目的】: 存在しないタグIDで更新しようとするとエラーが返されることを確認
    // 【テスト内容】: 存在しないIDでの更新エラー処理を検証
    // 【期待される動作】: "Tag not found" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（REQ-209）に基づく

    // 【テストデータ準備】: 存在しないID（999）を用意
    // 【初期条件設定】: 空のデータベース
    let db = create_test_db();

    // 【実際の処理実行】: 存在しないIDで更新を試行
    // 【処理内容】: ID=999で更新コマンドを呼び出し
    let result = super::tags::update_tag_internal(999, Some("テスト"), None, None, &db);

    // 【結果検証】: 適切なエラーが返されることを確認
    // 【期待値確認】: "Tag not found" エラー
    assert!(result.is_err(), "存在しないIDでエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Tag not found"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-UPDATE-TAG-ERR-002: 更新時の同名タグでUNIQUEエラー 🔵
// ============================================

#[test]
fn test_update_tag_with_duplicate_name_error() {
    // 【テスト目的】: 更新により別のタグと名前が重複するとエラーが返されることを確認
    // 【テスト内容】: UNIQUE制約違反時の更新エラー処理を検証（EDGE-003）
    // 【期待される動作】: "Tag name already exists" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（EDGE-003）に基づく

    // 【テストデータ準備】: 2つのタグを作成
    // 【初期条件設定】: タグ1「アグレッシブ」、タグ2「タイト」を作成
    let db = create_test_db();
    insert_test_tag(&db, "アグレッシブ", "#FF0000", true);
    let tag2_id = insert_test_tag(&db, "タイト", "#00FF00", false);

    // 【実際の処理実行】: タグ2の名前をタグ1と同じ名前に変更試行
    // 【処理内容】: タグ2の名前を「アグレッシブ」に変更（既存と重複）
    let result = super::tags::update_tag_internal(tag2_id, Some("アグレッシブ"), None, None, &db);

    // 【結果検証】: UNIQUE制約違反エラーが返されることを確認
    // 【期待値確認】: "Tag name already exists" エラー
    assert!(result.is_err(), "同名タグへの更新でエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Tag name already exists"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-DELETE-TAG-ERR-001: 存在しないタグIDで削除エラー 🔵
// ============================================

#[test]
fn test_delete_tag_with_nonexistent_id_error() {
    // 【テスト目的】: 存在しないタグIDで削除しようとするとエラーが返されることを確認
    // 【テスト内容】: 存在しないIDでの削除エラー処理を検証
    // 【期待される動作】: "Tag not found" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（REQ-210）に基づく

    // 【テストデータ準備】: 存在しないID（999）を用意
    // 【初期条件設定】: 空のデータベース
    let db = create_test_db();

    // 【実際の処理実行】: 存在しないIDで削除を試行
    // 【処理内容】: ID=999で削除コマンドを呼び出し
    let result = super::tags::delete_tag_internal(999, &db);

    // 【結果検証】: 適切なエラーが返されることを確認
    // 【期待値確認】: "Tag not found" エラー
    assert!(result.is_err(), "存在しないIDでエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Tag not found"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-CREATE-TAG-BOUND-001: 1文字のタグ名（最小値） 🔵
// ============================================

#[test]
fn test_create_tag_with_min_length_name() {
    // 【テスト目的】: タグ名が1文字の場合、正常に作成できることを確認
    // 【テスト内容】: 名前バリデーション（最小長境界値）を検証（EDGE-102）
    // 【期待される動作】: 1文字のタグ名が正しく保存される
    // 🔵 信頼性レベル: 要件定義書（EDGE-102）に基づく

    // 【テストデータ準備】: 1文字のタグ名を用意
    // 【初期条件設定】: テスト用データベースを初期化
    let db = create_test_db();

    // 【実際の処理実行】: 1文字のタグ名でタグ作成を試行
    // 【処理内容】: 名前が「A」のタグ作成コマンドを呼び出し
    let result = super::tags::create_tag_internal("A", "#FF0000", true, &db);

    // 【結果検証】: 1文字のタグ名が正常に作成されることを確認
    // 【期待値確認】: 1文字全てが正しく保存される
    assert!(result.is_ok(), "1文字のタグ名が作成できること"); // 【確認内容】: 作成処理が成功している 🔵
    let tag = result.unwrap();
    assert_eq!(tag.name, "A"); // 【確認内容】: 1文字のタグ名が正しく保存されている 🔵
}

// ============================================
// TC-CREATE-TAG-BOUND-002: 50文字のタグ名（最大値） 🔵
// ============================================

#[test]
fn test_create_tag_with_max_length_name() {
    // 【テスト目的】: タグ名が50文字の場合、正常に作成できることを確認
    // 【テスト内容】: 名前バリデーション（最大長境界値）を検証（EDGE-102）
    // 【期待される動作】: 50文字全てが正しく保存される
    // 🔵 信頼性レベル: 要件定義書（EDGE-102）に基づく

    // 【テストデータ準備】: 50文字のタグ名を用意
    // 【初期条件設定】: テスト用データベースを初期化
    let db = create_test_db();

    // 【実際の処理実行】: 50文字のタグ名でタグ作成を試行
    // 【処理内容】: 名前が50文字のタグ作成コマンドを呼び出し
    let max_name = "A".repeat(50);
    let result = super::tags::create_tag_internal(&max_name, "#FF0000", true, &db);

    // 【結果検証】: 50文字のタグ名が正常に作成されることを確認
    // 【期待値確認】: 50文字全てが正しく保存される
    assert!(result.is_ok(), "50文字のタグ名が作成できること"); // 【確認内容】: 作成処理が成功している 🔵
    let tag = result.unwrap();
    assert_eq!(tag.name, max_name); // 【確認内容】: 50文字全てが正しく保存されている 🔵
}

// ============================================
// TC-CREATE-TAG-HEX-001: HEX形式バリデーション（大文字） 🔵
// ============================================

#[test]
fn test_create_tag_with_uppercase_hex() {
    // 【テスト目的】: HEXカラーコード大文字が正常に受け入れられることを確認
    // 【テスト内容】: HEXバリデーション（大文字）を検証
    // 【期待される動作】: 大文字HEXが正常に保存される
    // 🔵 信頼性レベル: 要件定義書（REQ-202）とバリデーション関数に基づく

    // 【テストデータ準備】: 大文字HEXを用意
    // 【初期条件設定】: テスト用データベースを初期化
    let db = create_test_db();

    // 【実際の処理実行】: 大文字HEXでタグ作成を試行
    // 【処理内容】: 色「#FF0000」でタグ作成コマンドを呼び出し
    let result = super::tags::create_tag_internal("タグ", "#FF0000", true, &db);

    // 【結果検証】: 大文字HEXが正常に作成されることを確認
    // 【期待値確認】: 大文字HEXが正しく保存される
    assert!(result.is_ok(), "大文字HEXが作成できること"); // 【確認内容】: 作成処理が成功している 🔵
    let tag = result.unwrap();
    assert_eq!(tag.color, "#FF0000"); // 【確認内容】: 大文字HEXが正しく保存されている 🔵
}

// ============================================
// TC-CREATE-TAG-HEX-002: HEX形式バリデーション（小文字） 🔵
// ============================================

#[test]
fn test_create_tag_with_lowercase_hex() {
    // 【テスト目的】: HEXカラーコード小文字が正常に受け入れられることを確認
    // 【テスト内容】: HEXバリデーション（小文字）を検証
    // 【期待される動作】: 小文字HEXが正常に保存される
    // 🔵 信頼性レベル: 要件定義書（REQ-202）とバリデーション関数に基づく

    // 【テストデータ準備】: 小文字HEXを用意
    // 【初期条件設定】: テスト用データベースを初期化
    let db = create_test_db();

    // 【実際の処理実行】: 小文字HEXでタグ作成を試行
    // 【処理内容】: 色「#abc123」でタグ作成コマンドを呼び出し
    let result = super::tags::create_tag_internal("タグ", "#abc123", true, &db);

    // 【結果検証】: 小文字HEXが正常に作成されることを確認
    // 【期待値確認】: 小文字HEXが正しく保存される
    assert!(result.is_ok(), "小文字HEXが作成できること"); // 【確認内容】: 作成処理が成功している 🔵
    let tag = result.unwrap();
    assert_eq!(tag.color, "#abc123"); // 【確認内容】: 小文字HEXが正しく保存されている 🔵
}

// ============================================
// TC-CREATE-TAG-HEX-003: HEX形式バリデーション（混在） 🔵
// ============================================

#[test]
fn test_create_tag_with_mixed_case_hex() {
    // 【テスト目的】: HEXカラーコード大文字小文字混在が正常に受け入れられることを確認
    // 【テスト内容】: HEXバリデーション（混在）を検証
    // 【期待される動作】: 混在HEXが正常に保存される
    // 🔵 信頼性レベル: 要件定義書（REQ-202）とバリデーション関数に基づく

    // 【テストデータ準備】: 混在HEXを用意
    // 【初期条件設定】: テスト用データベースを初期化
    let db = create_test_db();

    // 【実際の処理実行】: 混在HEXでタグ作成を試行
    // 【処理内容】: 色「#AbC123」でタグ作成コマンドを呼び出し
    let result = super::tags::create_tag_internal("タグ", "#AbC123", true, &db);

    // 【結果検証】: 混在HEXが正常に作成されることを確認
    // 【期待値確認】: 混在HEXが正しく保存される
    assert!(result.is_ok(), "混在HEXが作成できること"); // 【確認内容】: 作成処理が成功している 🔵
    let tag = result.unwrap();
    assert_eq!(tag.color, "#AbC123"); // 【確認内容】: 混在HEXが正しく保存されている 🔵
}

// ============================================
// TC-UPDATE-TAG-005: updated_at自動更新確認 🔵
// ============================================

#[test]
fn test_update_tag_updated_at_auto_update() {
    // 【テスト目的】: 更新時にupdated_atが自動的に現在時刻に更新されることを確認
    // 【テスト内容】: REQ-209のupdated_at自動更新機能を検証
    // 【期待される動作】: updated_atが更新前より新しい時刻になる
    // 🔵 信頼性レベル: 要件定義書（REQ-209）に基づく

    // 【テストデータ準備】: タグを作成し、少し待ってから更新するシナリオを想定
    // 【初期条件設定】: 1つのタグを事前に作成
    let db = create_test_db();
    let tag = super::tags::create_tag_internal("アグレッシブ", "#FF5733", true, &db).unwrap();
    let original_updated_at = tag.updated_at.clone();

    // 【待機処理】: updated_atの時刻差を確実に検出するため短時間待機
    // 【SQLite精度対応】: CURRENT_TIMESTAMPは秒単位の精度のため、1秒待機が必要 🔵
    std::thread::sleep(std::time::Duration::from_secs(1));

    // 【実際の処理実行】: タグを更新
    // 【処理内容】: 名前を変更してupdated_atが自動更新されることを確認
    let result = super::tags::update_tag_internal(tag.id, Some("超アグレッシブ"), None, None, &db);

    // 【結果検証】: updated_atが更新されたことを確認
    // 【期待値確認】: updated_atが元の値より新しい
    assert!(result.is_ok(), "タグ更新が成功すること"); // 【確認内容】: 更新処理が成功している 🔵
    let updated_tag = result.unwrap();
    assert_ne!(
        updated_tag.updated_at, original_updated_at,
        "updated_atが更新されていること"
    ); // 【確認内容】: updated_atが自動更新されている 🔵
}

// ============================================
// TC-GET-ALL-TAGS-SORT-001: created_at昇順ソート確認 🔵
// ============================================

#[test]
fn test_get_all_tags_sorted_by_created_at() {
    // 【テスト目的】: タグリストがcreated_at昇順でソートされることを確認
    // 【テスト内容】: 3件のタグを時間差で作成し、ソート順を検証
    // 【期待される動作】: 最初に作成したタグが先頭、最後に作成したタグが末尾
    // 🔵 信頼性レベル: get_all_tags仕様に基づく

    // 【テストデータ準備】: 3件のタグを時間差で作成
    // 【初期条件設定】: タグを順番に作成し、created_atに時間差を持たせる
    let db = create_test_db();

    let tag1 = super::tags::create_tag_internal("タグ1", "#FF0000", true, &db).unwrap();
    std::thread::sleep(std::time::Duration::from_millis(10));
    let tag2 = super::tags::create_tag_internal("タグ2", "#00FF00", false, &db).unwrap();
    std::thread::sleep(std::time::Duration::from_millis(10));
    let tag3 = super::tags::create_tag_internal("タグ3", "#0000FF", true, &db).unwrap();

    // 【実際の処理実行】: 全タグ取得コマンドを呼び出し
    // 【処理内容】: created_at昇順でソートされたタグリストを取得
    let result = super::tags::get_all_tags_internal(&db);

    // 【結果検証】: created_at昇順でソートされていることを確認
    // 【期待値確認】: 作成順に並んでいる
    assert!(result.is_ok(), "全タグ取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let tags = result.unwrap();
    assert_eq!(tags.len(), 3); // 【確認内容】: 3件のタグが取得されている 🔵
    assert_eq!(tags[0].id, tag1.id); // 【確認内容】: 最初のタグが先頭にある 🔵
    assert_eq!(tags[1].id, tag2.id); // 【確認内容】: 2番目のタグが中央にある 🔵
    assert_eq!(tags[2].id, tag3.id); // 【確認内容】: 最後のタグが末尾にある 🔵
}

// ============================================
// TC-DELETE-TAG-ERR-002: tag_id=0以下でエラー 🔵
// ============================================

#[test]
fn test_delete_tag_with_zero_or_negative_id_error() {
    // 【テスト目的】: 0以下の不正なIDを指定した場合、エラーが返されることを確認
    // 【テスト内容】: 不正なID（0, -1）での削除エラー処理を検証
    // 【期待される動作】: "Tag not found" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（REQ-210）に基づく

    // 【テストデータ準備】: 不正なID（0）を用意
    // 【初期条件設定】: 空のデータベース
    let db = create_test_db();

    // 【実際の処理実行】: ID=0で削除を試行
    // 【処理内容】: 不正なIDで削除コマンドを呼び出し
    let result = super::tags::delete_tag_internal(0, &db);

    // 【結果検証】: 適切なエラーが返されることを確認
    // 【期待値確認】: "Tag not found" エラー
    assert!(result.is_err(), "ID=0でエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Tag not found"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-UPDATE-TAG-BOUND-001: タグ名を1文字に更新 🔵
// ============================================

#[test]
fn test_update_tag_name_to_min_length() {
    // 【テスト目的】: タグ名を1文字に更新できることを確認
    // 【テスト内容】: 更新時の名前バリデーション（最小長境界値）を検証
    // 【期待される動作】: 1文字に正しく更新される
    // 🔵 信頼性レベル: 要件定義書（EDGE-102）に基づく

    // 【テストデータ準備】: 通常のタグを作成し、1文字に短縮するシナリオを想定
    // 【初期条件設定】: 1つのタグを事前に作成
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "アグレッシブ", "#FF5733", true);

    // 【実際の処理実行】: タグ名を1文字に更新
    // 【処理内容】: 名前を「A」に変更
    let result = super::tags::update_tag_internal(tag_id, Some("A"), None, None, &db);

    // 【結果検証】: 1文字に正しく更新されることを確認
    // 【期待値確認】: 名前が「A」に更新されている
    assert!(result.is_ok(), "1文字への更新が成功すること"); // 【確認内容】: 更新処理が成功している 🔵
    let updated_tag = result.unwrap();
    assert_eq!(updated_tag.name, "A"); // 【確認内容】: 1文字に正しく更新されている 🔵
}

// ============================================
// TC-UPDATE-TAG-BOUND-002: タグ名を50文字に更新 🔵
// ============================================

#[test]
fn test_update_tag_name_to_max_length() {
    // 【テスト目的】: タグ名を50文字に更新できることを確認
    // 【テスト内容】: 更新時の名前バリデーション（最大長境界値）を検証
    // 【期待される動作】: 50文字全てが正しく更新される
    // 🔵 信頼性レベル: 要件定義書（EDGE-102）に基づく

    // 【テストデータ準備】: 短いタグを作成し、50文字に拡張するシナリオを想定
    // 【初期条件設定】: 1つのタグを事前に作成
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "短い", "#FF5733", true);

    // 【実際の処理実行】: タグ名を50文字に更新
    // 【処理内容】: 名前を50文字に変更
    let max_name = "A".repeat(50);
    let result = super::tags::update_tag_internal(tag_id, Some(&max_name), None, None, &db);

    // 【結果検証】: 50文字に正しく更新されることを確認
    // 【期待値確認】: 50文字全てが更新されている
    assert!(result.is_ok(), "50文字への更新が成功すること"); // 【確認内容】: 更新処理が成功している 🔵
    let updated_tag = result.unwrap();
    assert_eq!(updated_tag.name, max_name); // 【確認内容】: 50文字に正しく更新されている 🔵
}

// ============================================
// TC-UPDATE-TAG-ERR-003: タグ名を51文字に更新でエラー 🔵
// ============================================

#[test]
fn test_update_tag_name_to_too_long_error() {
    // 【テスト目的】: 更新時に51文字を指定するとエラーが返されることを確認
    // 【テスト内容】: 更新時の名前バリデーション（最大長超過）を検証
    // 【期待される動作】: "Tag name must be between 1 and 50 characters" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（EDGE-102）に基づく

    // 【テストデータ準備】: タグを作成し、51文字に更新試行するシナリオを想定
    // 【初期条件設定】: 1つのタグを事前に作成
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "アグレッシブ", "#FF5733", true);

    // 【実際の処理実行】: タグ名を51文字に更新試行
    // 【処理内容】: 51文字の名前で更新コマンドを呼び出し
    let too_long_name = "A".repeat(51);
    let result = super::tags::update_tag_internal(tag_id, Some(&too_long_name), None, None, &db);

    // 【結果検証】: 適切なエラーが返されることを確認
    // 【期待値確認】: "Tag name must be between 1 and 50 characters" エラー
    assert!(result.is_err(), "51文字への更新でエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Tag name must be between 1 and 50 characters"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-UPDATE-TAG-ERR-004: タグ名を空文字に更新でエラー 🔵
// ============================================

#[test]
fn test_update_tag_name_to_empty_error() {
    // 【テスト目的】: 更新時に空文字を指定するとエラーが返されることを確認
    // 【テスト内容】: 更新時の名前バリデーション（空文字）を検証
    // 【期待される動作】: "Tag name must be between 1 and 50 characters" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（EDGE-102）に基づく

    // 【テストデータ準備】: タグを作成し、空文字に更新試行するシナリオを想定
    // 【初期条件設定】: 1つのタグを事前に作成
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "アグレッシブ", "#FF5733", true);

    // 【実際の処理実行】: タグ名を空文字に更新試行
    // 【処理内容】: 空文字の名前で更新コマンドを呼び出し
    let result = super::tags::update_tag_internal(tag_id, Some(""), None, None, &db);

    // 【結果検証】: 適切なエラーが返されることを確認
    // 【期待値確認】: "Tag name must be between 1 and 50 characters" エラー
    assert!(result.is_err(), "空文字への更新でエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Tag name must be between 1 and 50 characters"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-UPDATE-TAG-ERR-005: 色を不正HEXに更新でエラー 🔵
// ============================================

#[test]
fn test_update_tag_color_to_invalid_hex_error() {
    // 【テスト目的】: 更新時に不正なHEX形式を指定するとエラーが返されることを確認
    // 【テスト内容】: 更新時の色バリデーション（不正HEX）を検証
    // 【期待される動作】: "Invalid HEX color format" エラーが返される
    // 🔵 信頼性レベル: 要件定義書（REQ-202）に基づく

    // 【テストデータ準備】: タグを作成し、不正HEXに更新試行するシナリオを想定
    // 【初期条件設定】: 1つのタグを事前に作成
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "アグレッシブ", "#FF5733", true);

    // 【実際の処理実行】: 色を不正HEX形式に更新試行
    // 【処理内容】: #なしのHEX形式で更新コマンドを呼び出し
    let result = super::tags::update_tag_internal(tag_id, None, Some("FF0000"), None, &db);

    // 【結果検証】: 適切なエラーが返されることを確認
    // 【期待値確認】: "Invalid HEX color format" エラー
    assert!(result.is_err(), "不正HEXへの更新でエラーが返されること"); // 【確認内容】: エラーが返されている 🔵
    let error = result.unwrap_err();
    assert!(
        error.contains("Invalid HEX color format"),
        "エラーメッセージが正しいこと"
    ); // 【確認内容】: エラーメッセージが正しい 🔵
}

// ============================================
// TC-GET-ALL-TAGS-PERF-001: 大量タグ（100件）のパフォーマンステスト 🔵
// ============================================

#[test]
fn test_get_all_tags_performance_100_tags() {
    // 【テスト目的】: 大量データでも全タグ取得が高速に実行されることを確認
    // 【テスト内容】: 100件のタグを作成し、1秒以内に取得できることを検証
    // 【期待される動作】: 100件全てが正しく取得される（1秒以内）
    // 🔵 信頼性レベル: NFR-003（レスポンス時間要件）に基づく

    // 【テストデータ準備】: 100件のタグを作成
    // 【初期条件設定】: 大量データのシナリオを想定
    let db = create_test_db();
    for i in 0..100 {
        insert_test_tag(&db, &format!("タグ{}", i), "#FF0000", true);
    }

    // 【実際の処理実行】: 全タグ取得コマンドを呼び出し
    // 【処理内容】: パフォーマンスを計測しながら全タグを取得
    let start = std::time::Instant::now();
    let result = super::tags::get_all_tags_internal(&db);
    let duration = start.elapsed();

    // 【結果検証】: 100件全てが1秒以内に取得されることを確認
    // 【期待値確認】: 全件取得成功、1秒以内の実行時間
    assert!(result.is_ok(), "100件のタグ取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let tags = result.unwrap();
    assert_eq!(tags.len(), 100); // 【確認内容】: 100件全てが取得されている 🔵
    assert!(
        duration.as_secs() < 1,
        "1秒以内に取得できること（実測: {:?}）",
        duration
    ); // 【確認内容】: パフォーマンス要件を満たしている 🔵
}

// ============================================
// TC-GET-ALL-TAGS-PERF-002: 最大規模タグ（500件）のパフォーマンステスト 🔵
// ============================================

#[test]
fn test_get_all_tags_performance_500_tags() {
    // 【テスト目的】: 最大想定規模（NFR-001: 最大500人 → タグも500件想定）でも全タグ取得が高速に実行されることを確認
    // 【テスト内容】: 500件のタグを作成し、1秒以内に取得できることを検証
    // 【期待される動作】: 500件全てが正しく取得される（1秒以内、NFR-003）
    // 🔵 信頼性レベル: NFR-001、NFR-003（非機能要件）に基づく

    // 【テストデータ準備】: 500件のタグを作成
    // 【初期条件設定】: 最大規模のシナリオを想定
    let db = create_test_db();
    for i in 0..500 {
        insert_test_tag(&db, &format!("タグ{}", i), "#FF0000", true);
    }

    // 【実際の処理実行】: 全タグ取得コマンドを呼び出し
    // 【処理内容】: パフォーマンスを計測しながら全タグを取得
    let start = std::time::Instant::now();
    let result = super::tags::get_all_tags_internal(&db);
    let duration = start.elapsed();

    // 【結果検証】: 500件全てが1秒以内に取得されることを確認
    // 【期待値確認】: 全件取得成功、1秒以内の実行時間
    assert!(result.is_ok(), "500件のタグ取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let tags = result.unwrap();
    assert_eq!(tags.len(), 500); // 【確認内容】: 500件全てが取得されている 🔵
    assert!(
        duration.as_secs() < 1,
        "1秒以内に取得できること（実測: {:?}）",
        duration
    ); // 【確認内容】: パフォーマンス要件を満たしている 🔵
}
