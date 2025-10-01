// SAP-47: プレイヤーCRUD API - TDD Redフェーズテスト
// 失敗するテストを実装し、Linear Issue仕様の追加APIをテスト駆動開発

use sapphire_lib::database::Database;
use sapphire_lib::services::player_service::PlayerService;
use sapphire_lib::utils::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use tokio_test;

// ====================
// Linear Issue追加仕様: データ構造定義（実装前なので失敗する）
// ====================

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlayerRequest {
    pub name: String,
    pub identifier: Option<String>,
    pub player_type_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePlayerRequest {
    pub name: Option<String>,
    pub identifier: Option<String>,
    pub player_type_id: Option<i64>,
}

// ====================
// テストヘルパー関数
// ====================

fn create_test_database() -> Database {
    Database::new_test().expect("Failed to create test database")
}

// ====================
// 新規追加API - get_player_by_id のテスト（失敗するテスト）
// ====================

#[tokio::test]
async fn test_get_player_by_id_success() {
    // 【テスト目的】: ID指定でプレイヤーを正確に取得できることを確認
    // 【テスト内容】: 事前に作成したプレイヤーをIDで検索し、正しい情報が返されるかテスト
    // 【期待される動作】: 存在するIDで該当プレイヤーが Some(Player) で返される
    // 🟡 黄信号: Linear Issue追加API仕様から妥当な推測

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【初期条件設定】: 検索対象となるプレイヤーを事前に作成
    let result = service.create_player("田中太郎".to_string(), Some("東京店".to_string())).await;
    assert!(result.is_ok());
    let created_player = result.unwrap();

    // 【実際の処理実行】: get_player_by_id APIを呼び出してプレイヤーを取得
    // 【処理内容】: 作成されたプレイヤーのIDを使用して単体取得
    let result = service.get_player_by_id(created_player.id.unwrap()).await;

    // 【結果検証】: 取得処理が成功し、正確なプレイヤー情報が返されることを確認
    assert!(result.is_ok()); // 【確認内容】: エラーなく正常に取得が完了
    let retrieved_player = result.unwrap();
    assert!(retrieved_player.is_some()); // 【確認内容】: プレイヤーが見つかった

    let player = retrieved_player.unwrap();
    assert_eq!(player.name, "田中太郎"); // 【確認内容】: 名前が正確に一致
    assert_eq!(player.identifier, Some("東京店".to_string())); // 【確認内容】: 識別子が正確に一致
    assert!(!player.is_deleted); // 【確認内容】: 削除状態ではない
}

#[tokio::test]
async fn test_get_player_by_id_not_found() {
    // 【テスト目的】: 存在しないIDでプレイヤー取得時にNoneが返されることを確認
    // 【テスト内容】: データベースに存在しないIDで検索し、適切にNoneが返されるかテスト
    // 【期待される動作】: 存在しないIDで None が返される（エラーではない）
    // 🟡 黄信号: Linear Issue API仕様から妥当な推測

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【実際の処理実行】: 存在しないIDでプレイヤー取得を試行
    // 【処理内容】: 999999という存在しないIDでの取得処理
    let result = service.get_player_by_id(999999).await;

    // 【結果検証】: 処理は成功するがプレイヤーは見つからないことを確認
    assert!(result.is_ok()); // 【確認内容】: エラーではなく正常な応答
    let retrieved_player = result.unwrap();
    assert!(retrieved_player.is_none()); // 【確認内容】: 存在しないため None が返される
}

#[tokio::test]
async fn test_get_player_by_id_deleted_player() {
    // 【テスト目的】: 論理削除されたプレイヤーが取得されないことを確認
    // 【テスト内容】: プレイヤーを作成・削除後、IDで検索してNoneが返されるかテスト
    // 【期待される動作】: 削除済みプレイヤーは存在しないものとして扱われる
    // 🔵 青信号: 要件定義書のエッジケースを参照

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【初期条件設定】: テスト用プレイヤーを作成し、その後削除
    let result = service.create_player("削除予定プレイヤー".to_string(), None).await;
    assert!(result.is_ok());
    let created_player = result.unwrap();
    let player_id = created_player.id.unwrap();

    // プレイヤーを削除
    let delete_result = service.delete_player(player_id).await;
    assert!(delete_result.is_ok());

    // 【実際の処理実行】: 削除されたプレイヤーのIDで取得を試行
    // 【処理内容】: 論理削除されたプレイヤーが取得されないことを確認
    let result = service.get_player_by_id(player_id).await;

    // 【結果検証】: 削除済みプレイヤーは取得されないことを確認
    assert!(result.is_ok()); // 【確認内容】: エラーではなく正常な応答
    let retrieved_player = result.unwrap();
    assert!(retrieved_player.is_none()); // 【確認内容】: 削除済みのため None が返される
}

// ====================
// 新規追加API - check_duplicate_name のテスト（失敗するテスト）
// ====================

#[tokio::test]
async fn test_check_duplicate_name_no_duplicate() {
    // 【テスト目的】: 重複していない名前で false が返されることを確認
    // 【テスト内容】: データベースに存在しない新しい名前で重複チェックし、falseが返されるかテスト
    // 【期待される動作】: 存在しない名前を検索した場合に重複なし（false）と判定される
    // 🟡 黄信号: Linear Issue追加API仕様から妥当な推測

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【実際の処理実行】: 存在しない名前で重複チェックを実行
    // 【処理内容】: 新規プレイヤー名での重複確認処理
    let result = service.check_duplicate_name("新規プレイヤー".to_string(), None).await;

    // 【結果検証】: 重複なしの判定が正確に返されることを確認
    assert!(result.is_ok()); // 【確認内容】: エラーなく正常に処理が完了
    let is_duplicate = result.unwrap();
    assert!(!is_duplicate); // 【確認内容】: 重複なし（false）が返される
}

#[tokio::test]
async fn test_check_duplicate_name_with_duplicate() {
    // 【テスト目的】: 重複している名前で true が返されることを確認
    // 【テスト内容】: 既存プレイヤーと同じ名前で重複チェックし、trueが返されるかテスト
    // 【期待される動作】: 既存の名前を検索した場合に重複あり（true）と判定される
    // 🔵 青信号: REQ-002同一名プレイヤー識別機能要件を参照

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【初期条件設定】: 重複チェック対象となるプレイヤーを事前に作成
    let result = service.create_player("田中太郎".to_string(), None).await;
    assert!(result.is_ok());

    // 【実際の処理実行】: 既存プレイヤーと同じ名前で重複チェックを実行
    // 【処理内容】: 作成済みプレイヤー名での重複確認処理
    let result = service.check_duplicate_name("田中太郎".to_string(), None).await;

    // 【結果検証】: 重複ありの判定が正確に返されることを確認
    assert!(result.is_ok()); // 【確認内容】: エラーなく正常に処理が完了
    let is_duplicate = result.unwrap();
    assert!(is_duplicate); // 【確認内容】: 重複あり（true）が返される
}

#[tokio::test]
async fn test_check_duplicate_name_exclude_self() {
    // 【テスト目的】: 自分自身を除外した重複チェックが正常に動作することを確認
    // 【テスト内容】: 更新時に自分のIDを除外して同名チェックし、重複なしと判定されるかテスト
    // 【期待される動作】: exclude_idで自分を除外すると、同名でも重複なしと判定される
    // 🟡 黄信号: Linear Issue追加API仕様から妥当な推測

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【初期条件設定】: 更新対象となるプレイヤーを事前に作成
    let result = service.create_player("更新対象プレイヤー".to_string(), None).await;
    assert!(result.is_ok());
    let created_player = result.unwrap();
    let player_id = created_player.id.unwrap();

    // 【実際の処理実行】: 自分のIDを除外して同名での重複チェックを実行
    // 【処理内容】: exclude_idに自分のIDを指定した重複確認処理
    let result = service.check_duplicate_name("更新対象プレイヤー".to_string(), Some(player_id)).await;

    // 【結果検証】: 自分を除外した場合に重複なしと判定されることを確認
    assert!(result.is_ok()); // 【確認内容】: エラーなく正常に処理が完了
    let is_duplicate = result.unwrap();
    assert!(!is_duplicate); // 【確認内容】: 自分除外により重複なし（false）が返される
}

// ====================
// 強化されたバリデーション機能のテスト（失敗するテスト）
// ====================

#[tokio::test]
async fn test_create_player_with_request_structure() {
    // 【テスト目的】: CreatePlayerRequest構造体を使用した作成が正常に動作することを確認
    // 【テスト内容】: 新しいリクエスト構造体でプレイヤーを作成し、正しく保存されるかテスト
    // 【期待される動作】: CreatePlayerRequestによる作成で適切なバリデーションと保存が実行される
    // 🔵 青信号: Linear Issue詳細実装仕様を参照

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【初期条件設定】: 新しいリクエスト構造体でプレイヤー作成データを準備
    let request = CreatePlayerRequest {
        name: "新構造体テストプレイヤー".to_string(),
        identifier: Some("新店舗".to_string()),
        player_type_id: Some(1),
    };

    // 【実際の処理実行】: CreatePlayerRequestを使用したプレイヤー作成APIを呼び出し
    // 【処理内容】: 新しい構造体による作成処理とバリデーション
    let result = service.create_player_with_request(request).await;

    // 【結果検証】: 新構造体による作成が成功し、期待されるプレイヤー情報が返されることを確認
    assert!(result.is_ok()); // 【確認内容】: エラーなく正常に作成が完了
    let player = result.unwrap();
    assert_eq!(player.name, "新構造体テストプレイヤー"); // 【確認内容】: 名前が正確に保存
    assert_eq!(player.identifier, Some("新店舗".to_string())); // 【確認内容】: 識別子が正確に保存
    assert_eq!(player.player_type_id, Some(1)); // 【確認内容】: プレイヤー種別IDが正確に保存
}

#[tokio::test]
async fn test_create_player_name_100_chars_validation() {
    // 【テスト目的】: プレイヤー名の100文字制限バリデーションが正常に動作することを確認
    // 【テスト内容】: 100文字を超える名前でプレイヤー作成を試行し、バリデーションエラーが発生するかテスト
    // 【期待される動作】: 100文字超過でAppError::Validationが発生する
    // 🔵 青信号: 要件定義書のデータ制約を参照

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【初期条件設定】: 100文字を超える長すぎる名前でのプレイヤー作成データを準備
    let long_name = "あ".repeat(101); // 101文字の名前
    let request = CreatePlayerRequest {
        name: long_name,
        identifier: None,
        player_type_id: None,
    };

    // 【実際の処理実行】: 文字数制限超過でプレイヤー作成を試行
    // 【処理内容】: バリデーション処理により制限超過エラーが発生
    let result = service.create_player_with_request(request).await;

    // 【結果検証】: 文字数制限超過により適切なバリデーションエラーが発生することを確認
    assert!(result.is_err()); // 【確認内容】: バリデーションエラーが発生
    let error = result.unwrap_err();
    assert!(matches!(error, AppError::Validation { .. })); // 【確認内容】: バリデーションエラー種別
    let error_msg = error.to_string();
    assert!(error_msg.contains("100文字以内")); // 【確認内容】: 適切なエラーメッセージ
}

#[tokio::test]
async fn test_create_player_identifier_50_chars_validation() {
    // 【テスト目的】: 識別子の50文字制限バリデーションが正常に動作することを確認
    // 【テスト内容】: 50文字を超える識別子でプレイヤー作成を試行し、バリデーションエラーが発生するかテスト
    // 【期待される動作】: 50文字超過でAppError::Validationが発生する
    // 🔵 青信号: 要件定義書のバリデーション制約を参照

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【初期条件設定】: 50文字を超える長すぎる識別子でのプレイヤー作成データを準備
    let long_identifier = "A".repeat(51); // 51文字の識別子
    let request = CreatePlayerRequest {
        name: "テストプレイヤー".to_string(),
        identifier: Some(long_identifier),
        player_type_id: None,
    };

    // 【実際の処理実行】: 識別子文字数制限超過でプレイヤー作成を試行
    // 【処理内容】: バリデーション処理により制限超過エラーが発生
    let result = service.create_player_with_request(request).await;

    // 【結果検証】: 識別子文字数制限超過により適切なバリデーションエラーが発生することを確認
    assert!(result.is_err()); // 【確認内容】: バリデーションエラーが発生
    let error = result.unwrap_err();
    assert!(matches!(error, AppError::Validation { .. })); // 【確認内容】: バリデーションエラー種別
    let error_msg = error.to_string();
    assert!(error_msg.contains("50文字以内")); // 【確認内容】: 適切なエラーメッセージ
}

#[tokio::test]
async fn test_create_player_empty_identifier_validation() {
    // 【テスト目的】: 空文字列の識別子に対するバリデーションが正常に動作することを確認
    // 【テスト内容】: 空文字列の識別子でプレイヤー作成を試行し、バリデーションエラーが発生するかテスト
    // 【期待される動作】: 空文字列識別子でAppError::Validationが発生する
    // 🔵 青信号: 要件定義書のバリデーション制約を参照

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【初期条件設定】: 空文字列の識別子でのプレイヤー作成データを準備
    let request = CreatePlayerRequest {
        name: "田中太郎".to_string(),
        identifier: Some("".to_string()), // 空文字列の識別子
        player_type_id: None,
    };

    // 【実際の処理実行】: 空文字列識別子でプレイヤー作成を試行
    // 【処理内容】: バリデーション処理により空文字列エラーが発生
    let result = service.create_player_with_request(request).await;

    // 【結果検証】: 空文字列識別子により適切なバリデーションエラーが発生することを確認
    assert!(result.is_err()); // 【確認内容】: バリデーションエラーが発生
    let error = result.unwrap_err();
    assert!(matches!(error, AppError::Validation { .. })); // 【確認内容】: バリデーションエラー種別
    let error_msg = error.to_string();
    assert!(error_msg.contains("空文字列にできません")); // 【確認内容】: 適切なエラーメッセージ
}

// ====================
// UpdatePlayerRequest構造体のテスト（失敗するテスト）
// ====================

#[tokio::test]
async fn test_update_player_with_request_structure() {
    // 【テスト目的】: UpdatePlayerRequest構造体を使用した更新が正常に動作することを確認
    // 【テスト内容】: 新しいリクエスト構造体でプレイヤーを更新し、正しく保存されるかテスト
    // 【期待される動作】: UpdatePlayerRequestによる更新で適切なバリデーションと保存が実行される
    // 🔵 青信号: Linear Issue詳細実装仕様を参照

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【初期条件設定】: 更新対象となるプレイヤーを事前に作成
    let create_result = service.create_player("更新前プレイヤー".to_string(), None).await;
    assert!(create_result.is_ok());
    let created_player = create_result.unwrap();
    let player_id = created_player.id.unwrap();

    // 【更新データ準備】: 新しいリクエスト構造体で更新データを準備
    let update_request = UpdatePlayerRequest {
        name: Some("更新後プレイヤー".to_string()),
        identifier: Some("更新店舗".to_string()),
        player_type_id: Some(1),
    };

    // 【実際の処理実行】: UpdatePlayerRequestを使用したプレイヤー更新APIを呼び出し
    // 【処理内容】: 新しい構造体による更新処理とバリデーション
    let result = service.update_player_with_request(player_id, update_request).await;

    // 【結果検証】: 新構造体による更新が成功し、期待されるプレイヤー情報が返されることを確認
    assert!(result.is_ok()); // 【確認内容】: エラーなく正常に更新が完了
    let player = result.unwrap();
    assert_eq!(player.name, "更新後プレイヤー"); // 【確認内容】: 名前が正確に更新
    assert_eq!(player.identifier, Some("更新店舗".to_string())); // 【確認内容】: 識別子が正確に更新
    assert_eq!(player.player_type_id, Some(1)); // 【確認内容】: プレイヤー種別IDが正確に更新
}

// ====================
// 境界値テスト（失敗するテスト）
// ====================

#[tokio::test]
async fn test_create_player_name_exactly_100_chars() {
    // 【テスト目的】: プレイヤー名100文字ちょうどの境界値で正常に処理されることを確認
    // 【テスト内容】: 100文字ちょうどの名前でプレイヤー作成し、正常に保存されるかテスト
    // 【期待される動作】: 100文字ちょうどは有効な入力として正常に処理される
    // 🔵 青信号: 要件定義書のデータ制約（100文字以内）を参照

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【初期条件設定】: 100文字ちょうどの名前でのプレイヤー作成データを準備
    let name_100_chars = "あ".repeat(100); // ちょうど100文字
    let request = CreatePlayerRequest {
        name: name_100_chars.clone(),
        identifier: None,
        player_type_id: None,
    };

    // 【実際の処理実行】: 100文字ちょうどの名前でプレイヤー作成を実行
    // 【処理内容】: 境界値での正常な作成処理
    let result = service.create_player_with_request(request).await;

    // 【結果検証】: 100文字ちょうどで正常に作成されることを確認
    assert!(result.is_ok()); // 【確認内容】: エラーなく正常に作成が完了
    let player = result.unwrap();
    assert_eq!(player.name, name_100_chars); // 【確認内容】: 100文字の名前が正確に保存
    assert_eq!(player.name.chars().count(), 100); // 【確認内容】: 文字数が正確に100文字
}

#[tokio::test]
async fn test_create_player_identifier_exactly_50_chars() {
    // 【テスト目的】: 識別子50文字ちょうどの境界値で正常に処理されることを確認
    // 【テスト内容】: 50文字ちょうどの識別子でプレイヤー作成し、正常に保存されるかテスト
    // 【期待される動作】: 50文字ちょうどは有効な入力として正常に処理される
    // 🔵 青信号: 要件定義書のデータ制約（50文字以内）を参照

    // 【テストデータ準備】: インメモリデータベースで独立したテスト環境を構築
    let db = create_test_database();
    let service = PlayerService::new(&db);

    // 【初期条件設定】: 50文字ちょうどの識別子でのプレイヤー作成データを準備
    let identifier_50_chars = "A".repeat(50); // ちょうど50文字
    let request = CreatePlayerRequest {
        name: "境界値テストプレイヤー".to_string(),
        identifier: Some(identifier_50_chars.clone()),
        player_type_id: None,
    };

    // 【実際の処理実行】: 50文字ちょうどの識別子でプレイヤー作成を実行
    // 【処理内容】: 境界値での正常な作成処理
    let result = service.create_player_with_request(request).await;

    // 【結果検証】: 50文字ちょうどで正常に作成されることを確認
    assert!(result.is_ok()); // 【確認内容】: エラーなく正常に作成が完了
    let player = result.unwrap();
    assert_eq!(player.identifier, Some(identifier_50_chars.clone())); // 【確認内容】: 50文字の識別子が正確に保存
    assert_eq!(player.identifier.unwrap().chars().count(), 50); // 【確認内容】: 文字数が正確に50文字
}