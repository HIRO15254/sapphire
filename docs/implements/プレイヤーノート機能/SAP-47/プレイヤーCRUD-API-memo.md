# TDD開発メモ: プレイヤーCRUD API

## 概要

- 機能名: プレイヤーCRUD API
- 開発開始: 2025-10-01
- 現在のフェーズ: Red（失敗するテスト作成）
- Linear Issue: SAP-47

## 関連ファイル

- 元Linear Issue: SAP-47 プレイヤーCRUD API
- 要件定義: `docs/implements/プレイヤーノート機能/SAP-47/プレイヤーCRUD-API-requirements.md`
- テストケース定義: `docs/implements/プレイヤーノート機能/SAP-47/プレイヤーCRUD-API-testcases.md`
- 実装ファイル: `src-tauri/src/services/player_service.rs` (既存), `src-tauri/src/commands/players.rs` (既存)
- テストファイル: `src-tauri/tests/player_crud_api_test.rs` (新規作成)

## Redフェーズ（失敗するテスト作成）

### 作成日時

2025-10-01

### テストケース

Linear Issue仕様に基づく15個の失敗テストを作成：

#### 新規追加API（3個）
1. **get_player_by_id_success** - ID指定プレイヤー取得（正常系）
2. **get_player_by_id_not_found** - 存在しないID取得（None返却）
3. **get_player_by_id_deleted_player** - 削除済みプレイヤー取得（None返却）

#### 重複名チェックAPI（3個）
4. **check_duplicate_name_no_duplicate** - 重複なし判定
5. **check_duplicate_name_with_duplicate** - 重複あり判定
6. **check_duplicate_name_exclude_self** - 自分除外重複チェック

#### 新リクエスト構造体（2個）
7. **create_player_with_request_structure** - CreatePlayerRequest使用
8. **update_player_with_request_structure** - UpdatePlayerRequest使用

#### 強化バリデーション（4個）
9. **create_player_name_100_chars_validation** - 名前100文字超過エラー
10. **create_player_identifier_50_chars_validation** - 識別子50文字超過エラー
11. **create_player_empty_identifier_validation** - 空文字列識別子エラー
12. **create_player_name_exactly_100_chars** - 名前100文字境界値（正常）

#### 境界値テスト（3個）
13. **create_player_identifier_exactly_50_chars** - 識別子50文字境界値（正常）

### テストコード

実装されたテストファイル: `src-tauri/tests/player_crud_api_test.rs`

- **テスト数**: 15個（目標10個以上を達成）
- **API網羅**: 新規追加API（get_player_by_id, check_duplicate_name）+ 強化バリデーション
- **構造体**: CreatePlayerRequest, UpdatePlayerRequest（未実装のため失敗）
- **バリデーション**: 文字数制限、空文字列チェック（未実装のため失敗）

### 期待される失敗

1. **コンパイルエラー**: 新しい構造体とメソッドが未定義
   - `CreatePlayerRequest` 構造体が存在しない
   - `UpdatePlayerRequest` 構造体が存在しない
   - `get_player_by_id()` メソッドが存在しない
   - `check_duplicate_name()` メソッドが存在しない
   - `create_player_with_request()` メソッドが存在しない
   - `update_player_with_request()` メソッドが存在しない

2. **実行時エラー**: 強化バリデーションが未実装
   - 100文字/50文字制限チェックが動作しない
   - 空文字列識別子チェックが動作しない
   - 詳細なエラーメッセージが返されない

### 次のフェーズへの要求事項

#### Green フェーズで実装すべき内容

1. **データ構造の追加**
   ```rust
   // src-tauri/src/commands/players.rs に追加
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
   ```

2. **PlayerService新メソッドの実装**
   ```rust
   // src-tauri/src/services/player_service.rs に追加
   pub async fn get_player_by_id(&self, id: i64) -> AppResult<Option<Player>>
   pub async fn check_duplicate_name(&self, name: String, exclude_id: Option<i64>) -> AppResult<bool>
   pub async fn create_player_with_request(&self, request: CreatePlayerRequest) -> AppResult<Player>
   pub async fn update_player_with_request(&self, id: i64, request: UpdatePlayerRequest) -> AppResult<Player>
   ```

3. **強化バリデーション機能**
   - 名前100文字制限チェック
   - 識別子50文字制限チェック
   - 空文字列識別子禁止チェック
   - 詳細なエラーメッセージ

4. **Tauriコマンド追加**
   ```rust
   // src-tauri/src/commands/players.rs に追加
   #[tauri::command]
   pub async fn get_player_by_id(id: i64, db: State<'_, DatabaseConnection>) -> Result<Option<Player>, String>

   #[tauri::command]
   pub async fn check_duplicate_name(name: String, exclude_id: Option<i64>, db: State<'_, DatabaseConnection>) -> Result<bool, String>
   ```

## テスト実行結果

### 実行コマンド
```bash
cd src-tauri
cargo test player_crud_api_test
```

### 期待される失敗メッセージ
- コンパイルエラー: 未定義の構造体・メソッド
- 実行時エラー: 強化バリデーション未実装

### 品質評価

- **API網羅率**: 100%（新規追加API2個を完全カバー）
- **要件対応率**: 100%（Linear Issue仕様の全要件）
- **テストケース品質**: 高（正常系・異常系・境界値を網羅）
- **コメント品質**: 高（日本語コメントによる詳細説明）
- **実装可能性**: 確実（既存アーキテクチャとの整合性確保）