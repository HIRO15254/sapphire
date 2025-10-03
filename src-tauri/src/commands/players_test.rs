use super::players::*;
use crate::database::models::{PLAYER_NAME_MAX_LENGTH, PLAYER_NAME_MIN_LENGTH};
use crate::database::PlayerDatabase;
use rusqlite::params;

// ============================================
// テストヘルパー関数
// ============================================

/// テスト用データベースを作成
fn create_test_db() -> PlayerDatabase {
    PlayerDatabase::new_test().expect("Failed to create test database")
}

/// テスト用のState型は作成できないため、内部関数を直接テストする
/// Greenフェーズでは、players.rsに内部関数（State不要）を実装予定

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
// TC-CREATE-001: プレイヤー名のみで作成 🔵
// ============================================

#[test]
fn test_create_player_with_name_only() {
    // 【テスト目的】: プレイヤーを名前のみで正常に作成できることを確認
    // 【テスト内容】: category_idなし（NULL）でプレイヤーが作成され、総合メモが自動生成される
    // 【期待される動作】: プレイヤーが作成され、player_summariesに総合メモレコードが追加される
    // 🔵 信頼性レベル: 要件定義書（REQ-001, REQ-303）に基づく

    // 【テストデータ準備】: 最もシンプルなプレイヤー作成を検証するため、種別なしで作成
    // 【初期条件設定】: テスト用データベースを初期化し、クリーンな状態を確保
    let db = create_test_db();

    // 【実際の処理実行】: プレイヤー作成コマンドを呼び出し
    // 【処理内容】: 名前のみを指定してプレイヤーを作成する
    let result = create_player_internal("山田太郎", None, &db);

    // 【結果検証】: プレイヤーが正常に作成されることを確認
    // 【期待値確認】: Okが返され、プレイヤー情報が正しく設定されている
    assert!(result.is_ok(), "プレイヤー作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let player = result.unwrap();
    assert_eq!(player.name, "山田太郎"); // 【確認内容】: プレイヤー名が正しく設定されている 🔵
    assert_eq!(player.category_id, None); // 【確認内容】: 種別IDがNULLである 🔵

    // 【追加検証】: 総合メモが自動作成されることを確認
    let conn = db.0.lock().unwrap();
    let summary_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries WHERE player_id = ?1",
            params![player.id],
            |row| row.get(0),
        )
        .expect("Failed to count summaries");
    assert_eq!(summary_count, 1); // 【確認内容】: 総合メモが1件作成されている 🔵
}

// ============================================
// TC-CREATE-002: プレイヤーを種別付きで作成 🔵
// ============================================

#[test]
fn test_create_player_with_category() {
    // 【テスト目的】: プレイヤーを種別IDを指定して正常に作成できることを確認
    // 【テスト内容】: 外部キー参照（category_id）が正常に機能することを検証
    // 【期待される動作】: 種別と紐づいたプレイヤーが作成され、JOINで取得可能
    // 🔵 信頼性レベル: 要件定義書（REQ-104: 1プレイヤー最大1種別）に基づく

    // 【テストデータ準備】: 事前に種別を作成し、そのIDを使用
    // 【初期条件設定】: 種別「タイト」を作成してから、それを参照するプレイヤーを作成
    let db = create_test_db();
    let category_id = insert_test_category(&db, "タイト", "#FF0000");

    // 【実際の処理実行】: 種別ID付きでプレイヤーを作成
    // 【処理内容】: 外部キー制約を満たすプレイヤー作成を実行
    let result = create_player_internal("田中花子", Some(category_id), &db);

    // 【結果検証】: プレイヤーが種別付きで作成されることを確認
    // 【期待値確認】: category_idが正しく設定され、JOINで種別名を取得可能
    assert!(result.is_ok(), "種別付きプレイヤー作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let player = result.unwrap();
    assert_eq!(player.category_id, Some(category_id)); // 【確認内容】: 種別IDが正しく設定されている 🔵

    // 【追加検証】: JOINで種別名を取得できることを確認
    let conn = db.0.lock().unwrap();
    let (player_name, category_name): (String, String) = conn
        .query_row(
            "SELECT p.name, c.name FROM players p
             JOIN player_categories c ON p.category_id = c.id
             WHERE p.id = ?1",
            params![player.id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .expect("Failed to query player with category");
    assert_eq!(player_name, "田中花子"); // 【確認内容】: プレイヤー名が正しい 🔵
    assert_eq!(category_name, "タイト"); // 【確認内容】: 種別名が正しく取得できる 🔵
}

// ============================================
// TC-CREATE-003: テンプレート内容が総合メモに適用される 🔵
// ============================================

#[test]
fn test_create_player_applies_template() {
    // 【テスト目的】: 総合メモ作成時にテンプレート内容が正しく適用されることを確認
    // 【テスト内容】: summary_templates（id=1）の内容がplayer_summariesに反映される
    // 【期待される動作】: テンプレート内容が総合メモのcontentフィールドにコピーされる
    // 🔵 信頼性レベル: 要件定義書（REQ-303, REQ-311: テンプレート設定）に基づく

    // 【テストデータ準備】: テンプレートを事前に設定してから、プレイヤーを作成
    // 【初期条件設定】: テンプレートにHTML内容を設定し、それが適用されることを検証
    let db = create_test_db();
    let template_content = "<h2>プレイスタイル</h2><h2>特徴</h2>";

    // テンプレート更新
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE summary_templates SET content = ?1 WHERE id = 1",
        params![template_content],
    )
    .expect("Failed to update template");
    drop(conn);

    // 【実際の処理実行】: プレイヤーを作成し、総合メモが自動生成される
    // 【処理内容】: テンプレート適用を含むプレイヤー作成処理を実行
    let result = create_player_internal("佐藤次郎", None, &db);

    // 【結果検証】: 総合メモにテンプレート内容が適用されていることを確認
    // 【期待値確認】: player_summaries.content にテンプレート内容がコピーされている
    assert!(result.is_ok(), "プレイヤー作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let player = result.unwrap();

    // テンプレート適用確認
    let conn = db.0.lock().unwrap();
    let summary_content: String = conn
        .query_row(
            "SELECT content FROM player_summaries WHERE player_id = ?1",
            params![player.id],
            |row| row.get(0),
        )
        .expect("Failed to query summary content");
    assert_eq!(summary_content, template_content); // 【確認内容】: テンプレート内容が正しく適用されている 🔵
}

// ============================================
// TC-CREATE-ERR-001: 空文字のプレイヤー名でエラー 🔵
// ============================================

#[test]
fn test_create_player_empty_name_error() {
    // 【テスト目的】: プレイヤー名が空文字の場合、適切なエラーが返されることを確認
    // 【テスト内容】: バリデーションエラーが正しく処理され、プレイヤーが作成されないことを検証
    // 【期待される動作】: エラーメッセージが返され、データベースにレコードが追加されない
    // 🔵 信頼性レベル: 要件定義書（EDGE-101: 1～100文字制限）とスキーマCHECK制約に基づく

    // 【テストデータ準備】: 空文字を使用して、バリデーションエラーを発生させる
    // 【初期条件設定】: クリーンなデータベース状態でエラーハンドリングを検証
    let db = create_test_db();

    // 【実際の処理実行】: 空文字でプレイヤー作成を試みる
    // 【処理内容】: バリデーションチェックが機能することを確認
    let result = create_player_internal("", None, &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: 明確なエラーメッセージが含まれている
    assert!(result.is_err(), "空文字ではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("1")
            && error_message.contains("100")
            && error_message.contains("character"),
        "エラーメッセージに文字数制限が含まれること"
    ); // 【確認内容】: 文字数制限のエラーメッセージが返される 🔵

    // 【追加検証】: プレイヤーが作成されていないことを確認
    let conn = db.0.lock().unwrap();
    let player_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM players", [], |row| row.get(0))
        .expect("Failed to count players");
    assert_eq!(player_count, 0); // 【確認内容】: プレイヤーが作成されていない 🔵
}

// ============================================
// TC-CREATE-ERR-002: 101文字のプレイヤー名でエラー 🔵
// ============================================

#[test]
fn test_create_player_too_long_name_error() {
    // 【テスト目的】: プレイヤー名が101文字の場合、適切なエラーが返されることを確認
    // 【テスト内容】: 最大文字数超過のバリデーションが機能することを検証
    // 【期待される動作】: エラーメッセージが返され、データベース制約が保護される
    // 🔵 信頼性レベル: 要件定義書（EDGE-101: 最大100文字）に基づく

    // 【テストデータ準備】: 101文字の名前を生成してバリデーションエラーを発生させる
    // 【初期条件設定】: 境界値超過のケースを明確に検証
    let db = create_test_db();
    let long_name = "A".repeat(101); // 101文字

    // 【実際の処理実行】: 101文字の名前でプレイヤー作成を試みる
    // 【処理内容】: 最大文字数制限のバリデーションが機能することを確認
    let result = create_player_internal(&long_name, None, &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: 文字数制限のエラーメッセージが返される
    assert!(result.is_err(), "101文字ではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("100") && error_message.contains("character"),
        "エラーメッセージに最大文字数が含まれること"
    ); // 【確認内容】: 最大文字数のエラーメッセージが返される 🔵
}

// ============================================
// TC-CREATE-ERR-003: 存在しない種別IDでエラー 🔵
// ============================================

#[test]
fn test_create_player_invalid_category_error() {
    // 【テスト目的】: 存在しない種別IDを指定した場合、適切なエラーが返されることを確認
    // 【テスト内容】: 外部キー制約違反が正しく検出され、エラーメッセージが返されることを検証
    // 【期待される動作】: "Category not found" エラーが返され、トランザクションがロールバックされる
    // 🔵 信頼性レベル: データベーススキーマ（外部キー制約）に基づく

    // 【テストデータ準備】: 存在しない種別ID（999）を使用して、外部キーエラーを発生させる
    // 【初期条件設定】: 種別テーブルにレコードがない状態で検証
    let db = create_test_db();

    // 【実際の処理実行】: 存在しない種別IDでプレイヤー作成を試みる
    // 【処理内容】: 外部キー参照チェックが機能することを確認
    let result = create_player_internal("鈴木一郎", Some(999), &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: "Category not found" エラーメッセージが含まれている
    assert!(result.is_err(), "存在しない種別IDではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("Category") && error_message.contains("not found"),
        "エラーメッセージに種別未検出が含まれること"
    ); // 【確認内容】: 種別未検出のエラーメッセージが返される 🔵
}

// ============================================
// TC-CREATE-BOUND-001: 1文字のプレイヤー名（最小値） 🔵
// ============================================

#[test]
fn test_create_player_min_length_name() {
    // 【テスト目的】: プレイヤー名が1文字の場合、正常に作成できることを確認
    // 【テスト内容】: CHECK制約の最小許容値でも正常動作することを検証
    // 【期待される動作】: 1文字のプレイヤー名でもデータベースに保存される
    // 🔵 信頼性レベル: 要件定義書（EDGE-101: 最小1文字）に基づく

    // 【テストデータ準備】: 1文字の名前を使用して、最小境界値を検証
    // 【初期条件設定】: 極端に短い名前でも正常動作することを確認
    let db = create_test_db();

    // 【実際の処理実行】: 1文字の名前でプレイヤーを作成
    // 【処理内容】: 最小境界値での作成処理を実行
    let result = create_player_internal("A", None, &db);

    // 【結果検証】: 正常に作成されることを確認
    // 【期待値確認】: 1文字の名前が正しく保存される
    assert!(result.is_ok(), "1文字の名前でも作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let player = result.unwrap();
    assert_eq!(player.name, "A"); // 【確認内容】: 1文字の名前が正しく設定されている 🔵
}

// ============================================
// TC-CREATE-BOUND-002: 100文字のプレイヤー名（最大値） 🔵
// ============================================

#[test]
fn test_create_player_max_length_name() {
    // 【テスト目的】: プレイヤー名が100文字の場合、正常に作成できることを確認
    // 【テスト内容】: CHECK制約の最大許容値でも正常動作することを検証
    // 【期待される動作】: 100文字全てがデータベースに保存され、文字欠損がない
    // 🔵 信頼性レベル: 要件定義書（EDGE-101: 最大100文字）に基づく

    // 【テストデータ準備】: 100文字の名前を生成して、最大境界値を検証
    // 【初期条件設定】: 極端に長い名前でも正常動作することを確認
    let db = create_test_db();
    let max_name = "あ".repeat(100); // 100文字

    // 【実際の処理実行】: 100文字の名前でプレイヤーを作成
    // 【処理内容】: 最大境界値での作成処理を実行
    let result = create_player_internal(&max_name, None, &db);

    // 【結果検証】: 正常に作成されることを確認
    // 【期待値確認】: 100文字全てが正しく保存される
    assert!(result.is_ok(), "100文字の名前でも作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let player = result.unwrap();
    assert_eq!(player.name, max_name); // 【確認内容】: 100文字の名前が正しく設定されている 🔵
    assert_eq!(player.name.len(), 300); // 【確認内容】: UTF-8バイト数が正しい（日本語3バイト×100文字） 🔵
}

// ============================================
// TC-GET-001: デフォルトページネーション（20件） 🔵
// ============================================

#[test]
fn test_get_players_default_pagination() {
    // 【テスト目的】: ページ指定なしでデフォルト20件取得できることを確認
    // 【テスト内容】: ページネーションのデフォルト動作（page=1, per_page=20）を検証
    // 【期待される動作】: 最新20件がupdated_at降順で取得される
    // 🔵 信頼性レベル: 要件定義書（REQ-404, REQ-509）に基づく

    // 【テストデータ準備】: 50人のプレイヤーを作成してページネーションを検証
    // 【初期条件設定】: 大量データでの一覧表示動作を確認
    let db = create_test_db();
    for i in 1..=50 {
        insert_test_player(&db, &format!("Player{}", i), None);
    }

    // 【実際の処理実行】: ページ指定なしでプレイヤー一覧を取得
    // 【処理内容】: デフォルトページネーションパラメータで取得
    let result = get_players_internal(None, None, &db);

    // 【結果検証】: デフォルト20件が取得されることを確認
    // 【期待値確認】: ページネーション情報が正しく設定されている
    assert!(result.is_ok(), "プレイヤー一覧取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 20); // 【確認内容】: 20件取得されている 🔵
    assert_eq!(response.total, 50); // 【確認内容】: 総件数が50件 🔵
    assert_eq!(response.page, 1); // 【確認内容】: 現在ページが1 🔵
    assert_eq!(response.per_page, 20); // 【確認内容】: 1ページ件数が20 🔵
    assert_eq!(response.total_pages, 3); // 【確認内容】: 総ページ数が3（ceil(50/20)） 🔵
}

// ============================================
// TC-GET-002: カスタムページネーション（50件） 🔵
// ============================================

#[test]
fn test_get_players_custom_pagination() {
    // 【テスト目的】: per_page=50でカスタムページネーションできることを確認
    // 【テスト内容】: ページサイズのカスタマイズが機能することを検証
    // 【期待される動作】: 指定した50件が取得される
    // 🔵 信頼性レベル: 要件定義書（REQ-704: 20/50/100件選択肢）に基づく

    // 【テストデータ準備】: 150人のプレイヤーを作成してカスタムページサイズを検証
    // 【初期条件設定】: ユーザー設定のページサイズでの動作を確認
    let db = create_test_db();
    for i in 1..=150 {
        insert_test_player(&db, &format!("Player{}", i), None);
    }

    // 【実際の処理実行】: per_page=50で一覧を取得
    // 【処理内容】: カスタムページサイズでの取得処理を実行
    let result = get_players_internal(Some(1), Some(50), &db);

    // 【結果検証】: 50件が取得されることを確認
    // 【期待値確認】: ページネーション情報がカスタム設定に従っている
    assert!(result.is_ok(), "カスタムページネーションが成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 50); // 【確認内容】: 50件取得されている 🔵
    assert_eq!(response.total, 150); // 【確認内容】: 総件数が150件 🔵
    assert_eq!(response.per_page, 50); // 【確認内容】: 1ページ件数が50 🔵
    assert_eq!(response.total_pages, 3); // 【確認内容】: 総ページ数が3（ceil(150/50)） 🔵
}

// ============================================
// TC-GET-003: 2ページ目の取得 🔵
// ============================================

#[test]
fn test_get_players_page_two() {
    // 【テスト目的】: 2ページ目のデータを正しく取得できることを確認
    // 【テスト内容】: OFFSET計算の正確性を検証
    // 【期待される動作】: 21～40件目が取得される
    // 🔵 信頼性レベル: ページネーション仕様（OFFSET計算）に基づく

    // 【テストデータ準備】: 100人のプレイヤーを作成してページング動作を検証
    // 【初期条件設定】: ページング計算の正確性を確認
    let db = create_test_db();
    for i in 1..=100 {
        insert_test_player(&db, &format!("Player{:03}", i), None);
    }

    // 【実際の処理実行】: 2ページ目を取得
    // 【処理内容】: OFFSET計算が正しく機能することを確認
    let result = get_players_internal(Some(2), Some(20), &db);

    // 【結果検証】: 2ページ目のデータが取得されることを確認
    // 【期待値確認】: OFFSET=20で21～40件目が取得される
    assert!(result.is_ok(), "2ページ目取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 20); // 【確認内容】: 20件取得されている 🔵
    assert_eq!(response.page, 2); // 【確認内容】: 現在ページが2 🔵
}

// ============================================
// TC-UPDATE-001: 名前のみ更新 🔵
// ============================================

#[test]
fn test_update_player_name_only() {
    // 【テスト目的】: プレイヤー名のみを更新できることを確認
    // 【テスト内容】: 部分更新（nameのみ）が機能し、updated_atが自動更新されることを検証
    // 【期待される動作】: 名前が更新され、category_idは変更されず、updated_atが更新される
    // 🔵 信頼性レベル: 要件定義書（REQ-003: プレイヤー情報編集）に基づく

    // 【テストデータ準備】: プレイヤーを事前に作成してから更新
    // 【初期条件設定】: 部分更新の動作を検証
    let db = create_test_db();
    let player_id = insert_test_player(&db, "山田太郎", None);

    // 【実際の処理実行】: 名前のみを更新
    // 【処理内容】: category_idは指定せず、nameのみ更新
    let result = update_player_internal(player_id, Some("山田花子"), None, &db);

    // 【結果検証】: 名前が更新されることを確認
    // 【期待値確認】: 名前のみが変更され、category_idは変更なし
    assert!(result.is_ok(), "名前更新が成功すること"); // 【確認内容】: 更新処理が成功している 🔵
    let player = result.unwrap();
    assert_eq!(player.name, "山田花子"); // 【確認内容】: 名前が更新されている 🔵
    assert_eq!(player.category_id, None); // 【確認内容】: category_idは変更されていない 🔵
}

// ============================================
// TC-UPDATE-ERR-001: 存在しないプレイヤーでエラー 🔵
// ============================================

#[test]
fn test_update_player_not_found_error() {
    // 【テスト目的】: 存在しないプレイヤーIDでエラーが返されることを確認
    // 【テスト内容】: リソース未検出エラーが正しく処理されることを検証
    // 【期待される動作】: "Player not found" エラーが返される
    // 🔵 信頼性レベル: エラーハンドリング仕様に基づく

    // 【テストデータ準備】: 存在しないID（999）を使用してエラーを発生させる
    // 【初期条件設定】: プレイヤーが存在しない状態でエラーハンドリングを検証
    let db = create_test_db();

    // 【実際の処理実行】: 存在しないIDで更新を試みる
    // 【処理内容】: 存在確認チェックが機能することを確認
    let result = update_player_internal(999, Some("テスト"), None, &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: "Player not found" エラーメッセージが含まれている
    assert!(result.is_err(), "存在しないIDではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("Player") && error_message.contains("not found"),
        "エラーメッセージにプレイヤー未検出が含まれること"
    ); // 【確認内容】: プレイヤー未検出のエラーメッセージが返される 🔵
}

// ============================================
// TC-DELETE-001: プレイヤーを正常に削除 🔵
// ============================================

#[test]
fn test_delete_player_success() {
    // 【テスト目的】: プレイヤーを削除できることを確認
    // 【テスト内容】: 基本的な削除機能が動作することを検証
    // 【期待される動作】: プレイヤーが削除され、Ok(())が返される
    // 🔵 信頼性レベル: 要件定義書（REQ-004: プレイヤー削除）に基づく

    // 【テストデータ準備】: プレイヤーを事前に作成してから削除
    // 【初期条件設定】: 削除対象プレイヤーを用意
    let db = create_test_db();
    let player_id = insert_test_player(&db, "削除テスト", None);

    // 【実際の処理実行】: プレイヤーを削除
    // 【処理内容】: DELETEクエリが正常実行されることを確認
    let result = delete_player_internal(player_id, &db);

    // 【結果検証】: 削除が成功することを確認
    // 【期待値確認】: Ok(())が返され、プレイヤーが削除されている
    assert!(result.is_ok(), "プレイヤー削除が成功すること"); // 【確認内容】: 削除処理が成功している 🔵

    // 【追加検証】: プレイヤーが削除されていることを確認
    let conn = db.0.lock().unwrap();
    let player_exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM players WHERE id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .expect("Failed to check player existence");
    assert_eq!(player_exists, 0); // 【確認内容】: プレイヤーが削除されている 🔵
}

// ============================================
// TC-DELETE-CASCADE-001: 関連データのCASCADE削除 🔵
// ============================================

#[test]
fn test_delete_player_cascade() {
    // 【テスト目的】: プレイヤー削除時、関連データも削除されることを確認
    // 【テスト内容】: ON DELETE CASCADE制約が機能することを検証
    // 【期待される動作】: プレイヤー削除後、player_notes, player_summariesも削除される
    // 🔵 信頼性レベル: データベーススキーマ（ON DELETE CASCADE）とNFR-201に基づく

    // 【テストデータ準備】: プレイヤーと関連データを作成してからCASCADE削除を検証
    // 【初期条件設定】: メモと総合メモを持つプレイヤーを用意
    let db = create_test_db();
    let player_id = insert_test_player(&db, "CASCADE削除テスト", None);

    // 関連データ作成
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, "テストメモ1"],
    )
    .expect("Failed to insert note 1");
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, "テストメモ2"],
    )
    .expect("Failed to insert note 2");
    conn.execute(
        "INSERT INTO player_summaries (player_id, content) VALUES (?1, ?2)",
        params![player_id, "総合メモ"],
    )
    .expect("Failed to insert summary");
    drop(conn);

    // 【実際の処理実行】: プレイヤーを削除
    // 【処理内容】: CASCADE削除が自動的に実行されることを確認
    let result = delete_player_internal(player_id, &db);

    // 【結果検証】: 削除が成功し、関連データも削除されることを確認
    // 【期待値確認】: player_notes, player_summariesも削除されている
    assert!(result.is_ok(), "CASCADE削除が成功すること"); // 【確認内容】: 削除処理が成功している 🔵

    // 関連データ削除確認
    let conn = db.0.lock().unwrap();
    let note_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes WHERE player_id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .expect("Failed to count notes");
    let summary_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_summaries WHERE player_id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .expect("Failed to count summaries");

    assert_eq!(note_count, 0); // 【確認内容】: メモが削除されている 🔵
    assert_eq!(summary_count, 0); // 【確認内容】: 総合メモが削除されている 🔵
}

// ============================================
// TC-DETAIL-001: 全データ取得（種別あり） 🔵
// ============================================

#[test]
fn test_get_player_detail_with_category() {
    // 【テスト目的】: プレイヤー詳細を全て取得できることを確認（種別あり）
    // 【テスト内容】: 複数テーブルのJOIN取得が正しく機能することを検証
    // 【期待される動作】: プレイヤー、種別、メモ、総合メモが一度に取得される
    // 🔵 信頼性レベル: 要件定義書とデータベース設計に基づく

    // 【テストデータ準備】: 完全な情報を持つプレイヤーを作成
    // 【初期条件設定】: 種別、メモ、総合メモを持つプレイヤーを用意
    let db = create_test_db();
    let category_id = insert_test_category(&db, "タイト", "#FF0000");
    let player_id = insert_test_player(&db, "詳細テスト", Some(category_id));

    // 関連データ作成
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, "メモ1"],
    )
    .expect("Failed to insert note");
    conn.execute(
        "INSERT INTO player_summaries (player_id, content) VALUES (?1, ?2)",
        params![player_id, "総合メモ"],
    )
    .expect("Failed to insert summary");
    drop(conn);

    // 【実際の処理実行】: プレイヤー詳細を取得
    // 【処理内容】: JOINクエリで全関連データを取得
    let result = get_player_detail_internal(player_id, &db);

    // 【結果検証】: 全データが取得されることを確認
    // 【期待値確認】: プレイヤー、種別、メモ、総合メモが全て含まれている
    assert!(result.is_ok(), "プレイヤー詳細取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    // 注: 詳細な検証はGreenフェーズでPlayerDetail型実装後に追加
}
