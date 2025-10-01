# SAP-47: プレイヤーCRUD API - TDD要件定義書

## 1. 機能の概要（Linear Issue・設計文書ベース）

- 🔵 **青信号**: LinearのSAP-47 Issue詳細仕様および既存設計文書を参照
- **機能名**: プレイヤーCRUD API
- **何をする機能か**: プレイヤーの基本的なCRUD（Create, Read, Update, Delete）操作を提供し、フロントエンドからプレイヤー情報の管理を可能にする
- **どのような問題を解決するか**:
  - プレイヤー情報の永続化と管理
  - 同一名プレイヤーの識別問題の解決
  - 安全なデータ削除（論理削除）
- **想定されるユーザー**: ポーカープレイヤーのメモを管理するユーザー
- **システム内での位置づけ**: TauriアプリケーションのバックエンドAPI層、プレイヤーノート機能の基盤
- **参照したLinear Issue**: SAP-47 プレイヤーCRUD API
- **参照した設計文書**: `src-tauri/src/database/player_note_schema.sql`, 既存実装ファイル群

## 2. 入力・出力の仕様（Linear要件・既存TypeScript型定義ベース）

- 🔵 **青信号**: Linear Issue詳細およびRustコード実装を参照

### データモデル（Rust/TypeScript共通）
```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Player {
    pub id: i64,
    pub name: String,
    pub identifier: Option<String>,
    pub player_type_id: Option<i64>,
    pub is_deleted: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlayerRequest {
    pub name: String,
    pub identifier: Option<String>,
    pub player_type_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePlayerRequest {
    pub name: Option<String>,
    pub identifier: Option<String>,
    pub player_type_id: Option<i64>,
}
```

### API仕様

#### 既存API（実装済み）
1. **get_players()** -> `Result<Vec<Player>, String>`
   - 入力: なし
   - 出力: 論理削除されていないプレイヤーのリスト

2. **create_player(name: String, identifier: Option<String>)** -> `Result<Player, String>`
   - 入力: プレイヤー名、識別子（オプション）
   - 出力: 作成されたプレイヤー情報

3. **update_player(id: i64, name: String, identifier: Option<String>)** -> `Result<Player, String>`
   - 入力: ID、プレイヤー名、識別子（オプション）
   - 出力: 更新されたプレイヤー情報

4. **delete_player(id: i64)** -> `Result<(), String>`
   - 入力: プレイヤーID
   - 出力: 成功/失敗

#### 追加必要API（Linear仕様）
5. **get_player_by_id(id: i64)** -> `Result<Option<Player>, String>`
   - 入力: プレイヤーID
   - 出力: 指定されたプレイヤー情報（存在しない場合はNone）

6. **check_duplicate_name(name: String, exclude_id: Option<i64>)** -> `Result<bool, String>`
   - 入力: プレイヤー名、除外ID（オプション）
   - 出力: 重複の有無（true: 重複あり, false: 重複なし）

- **参照したLinear要件**: SAP-47 実装詳細セクション
- **参照した設計文書**: `src-tauri/src/commands/players.rs`, `src-tauri/src/services/player_service.rs`

## 3. 制約条件（Linear非機能要件・アーキテクチャ設計ベース）

- 🔵 **青信号**: Linear Issue非機能要件およびtech-stack.mdを参照

### パフォーマンス要件
- **NFR-001**: 一覧表示性能（1000件以下で100ms以内）
- 大量データでの検索性能の維持
- メモリ使用量の最適化

### セキュリティ要件
- **NFR-201**: データ安全性
- SQLインジェクション対策（パラメータ化クエリ使用）
- 入力値の適切なバリデーション

### データ制約
- プレイヤー名: 必須、100文字以内
- 識別子: 空文字列禁止、50文字以内
- プレイヤー種別ID: player_typesテーブルに存在するID
- 論理削除フラグ: is_deleted = 0（アクティブ）/ 1（削除済み）

### アーキテクチャ制約
- Tauri 2.0+フレームワーク準拠
- Rust + rusqliteによるデータベース操作
- 非同期処理対応（tokio）
- サービス層パターンの維持

### 互換性要件
- 既存プレイヤーデータとの互換性維持
- 外部キー制約の遵守（player_type_id）

- **参照したLinear要件**: NFR-001, NFR-201, TECH-002-005
- **参照した設計文書**: `docs/tech-stack.md`, データベーススキーマ

## 4. 想定される使用例（Linear Edgeケース・データフローベース）

- 🔵 **青信号**: Linear Issue実装詳細およびバリデーション仕様を参照

### 基本的な使用パターン
1. **プレイヤー一覧表示**
   ```
   get_players() -> 論理削除されていないプレイヤー一覧を作成日時降順で取得
   ```

2. **新規プレイヤー作成**
   ```
   create_player("田中太郎", None) -> 新規プレイヤー作成
   ```

3. **同名プレイヤー作成（識別子付き）**
   ```
   check_duplicate_name("田中太郎", None) -> true（重複検出）
   create_player("田中太郎", Some("東京店")) -> 識別子付きで作成
   ```

4. **プレイヤー情報更新**
   ```
   update_player(1, "田中太郎", Some("渋谷店")) -> 識別子を追加/変更
   ```

5. **プレイヤー削除**
   ```
   delete_player(1) -> is_deleted = 1に設定（論理削除）
   ```

### エッジケース
1. **特殊文字を含むプレイヤー名**
   - 絵文字、記号、外国語文字の処理
   - 100文字制限の境界値テスト

2. **同名プレイヤーの大量作成**
   - 複数の同名プレイヤーの管理
   - 識別子の一意性確保

3. **存在しないIDでの操作**
   - get_player_by_id(999999) -> None
   - update_player(999999, ...) -> エラー
   - delete_player(999999) -> エラー

4. **削除済みプレイヤーの操作**
   - 削除済みプレイヤーは一覧に表示されない
   - 削除済みプレイヤーの更新は失敗

### エラーケース
1. **バリデーションエラー**
   - 空のプレイヤー名 -> `AppError::Validation`
   - 100文字を超えるプレイヤー名 -> `AppError::Validation`
   - 空文字列の識別子 -> `AppError::Validation`

2. **データベースエラー**
   - 外部キー制約違反 -> `AppError::Database`
   - 接続エラー -> `AppError::Database`

3. **データ整合性エラー**
   - 存在しないプレイヤーの更新 -> `AppError::PlayerNotFound`

- **参照したLinear要件**: SAP-47 テスト要件セクション
- **参照した設計文書**: バリデーション実装、エラーハンドリング

## 5. Linear要件・設計文書との対応関係

### 参照したLinear Issue
- **SAP-47**: プレイヤーCRUD API メインタスク

### 参照した機能要件
- **REQ-001**: プレイヤー基本情報管理 ✅ 実装済み
- **REQ-002**: 同一名プレイヤー識別機能 🟡 部分実装（check_duplicate_name追加必要）
- **REQ-102**: 安全な削除機能 ✅ 論理削除実装済み

### 参照した技術要件
- **TECH-002**: Rustでのデータベース操作 ✅ 実装済み
- **TECH-003**: TauriでのIPC通信 ✅ 実装済み
- **TECH-004**: 非同期処理対応 ✅ 実装済み
- **TECH-005**: エラーハンドリング ✅ 実装済み

### 参照した非機能要件
- **NFR-001**: 一覧表示性能（1000件以下で100ms以内） ✅ 実装済み
- **NFR-201**: データ安全性 ✅ 論理削除実装済み

### 参照した設計文書
- **アーキテクチャ**: `docs/tech-stack.md` - Tauri 2.0+, Rust, SQLite構成
- **データベース**: `src-tauri/src/database/player_note_schema.sql` - playersテーブル設計
- **型定義**: 既存実装 - Player struct, サービス層設計
- **API仕様**: Linear Issue詳細 - 追加APIエンドポイント仕様

## 6. 実装ギャップ分析

### ✅ 実装済み（高品質）
- 基本CRUD操作 (get_players, create_player, update_player, delete_player)
- Player struct定義
- PlayerService実装（サービス層パターン）
- バリデーション（基本レベル）
- エラーハンドリング（AppError型）
- 論理削除機能
- データベーススキーマ

### ❌ 実装必要（Linear仕様準拠）
1. **get_player_by_id** APIの追加
2. **check_duplicate_name** APIの追加
3. **同名プレイヤーチェック機能**の強化
4. **CreatePlayerRequest/UpdatePlayerRequest**構造体の導入
5. **より厳密なバリデーション**（文字数制限等）
6. **包括的テストスイート**の作成

### 🎯 品質判定: ✅ 高品質基盤あり

- **要件の曖昧さ**: なし（Linear Issue詳細仕様で明確）
- **入出力定義**: 完全（既存実装 + Linear追加仕様）
- **制約条件**: 明確（パフォーマンス、セキュリティ、データ制約）
- **実装可能性**: 確実（既存高品質基盤を拡張）

## 次のステップ

✅ **要件定義完了** - Linear Issue仕様と既存実装の詳細分析により、明確で実装可能な要件定義が完成しました。

**次のお勧めステップ**: `/tdd-testcases SAP-47` でテストケースの洗い出しを行います。