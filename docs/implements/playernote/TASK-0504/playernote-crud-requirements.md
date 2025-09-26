# TASK-0504: プレイヤーCRUD基本API実装 - 要件定義書

## 生成情報
- **生成日**: 2025-09-25
- **生成者**: TDD要件整理担当者
- **タスクID**: TASK-0504
- **機能名**: プレイヤーCRUD基本API実装

## 1. 機能の概要（EARS要件定義書・設計文書ベース）

### 機能の目的
🔵 **青信号**: REQ-001（プレイヤー管理）に基づく基本CRUD操作の完成

- **何をする機能か**: ライブポーカー対戦相手の基本情報（名前、プレイヤータイプ）を効率的に管理するためのCRUD（作成・読取・更新・削除）APIを提供する
- **解決する問題**: 現在部分的に実装されているプレイヤー管理APIを完成させ、フロントエンドから型安全で効率的なデータ操作を可能にする
- **想定ユーザー**: ライブポーカープレイヤー（対戦相手情報を記録・管理したいユーザー）
- **システム内位置づけ**: Player Note機能のコア部分として、タグシステム・メモ機能の基盤となるプレイヤーエンティティ管理を担当

**参照したEARS要件**: REQ-001（プレイヤー管理）, REQ-002（プレイヤータイプ）
**参照した設計文書**: architecture.md プレイヤー管理セクション

### 実装状況分析
🔵 **青信号**: 既存実装コード調査結果

**実装済み機能**:
- `create_player`: 完全実装・テスト済み
- `get_all_players`: 基本実装済み

**実装必要機能**:
- `get_players`: ページネーション対応版
- `update_player`: プレイヤー情報更新

## 2. 入力・出力の仕様（EARS機能要件・TypeScript型定義ベース）

### get_players コマンド（ページネーション対応）
🔵 **青信号**: api-endpoints.md の GetPlayersRequest 型定義に基づく

**入力パラメータ**:
```rust
#[derive(Debug, Serialize, Deserialize)]
struct GetPlayersRequest {
    pub limit: Option<i32>,        // デフォルト50, 範囲1-1000
    pub offset: Option<i32>,       // デフォルト0, 範囲0以上
    pub sort_by: Option<String>,   // "name", "created_at", "updated_at"
    pub sort_order: Option<String>, // "asc", "desc", デフォルト"asc"
}
```

**出力値**:
```rust
#[derive(Debug, Serialize, Deserialize)]
struct GetPlayersResponse {
    pub players: Vec<PlayerListResponse>,
    pub total_count: i32,
    pub has_more: bool,
}
```

**参照したEARS要件**: REQ-001（プレイヤー管理）, NFR-001（1秒以内表示）
**参照した設計文書**: api-endpoints.md の get_players セクション

### update_player コマンド
🔵 **青信号**: types.rs の UpdatePlayerRequest 型定義に基づく

**入力パラメータ**:
```rust
#[derive(Debug, Serialize, Deserialize)]
struct UpdatePlayerRequest {
    pub id: String,                               // 必須：更新対象ID
    pub name: Option<String>,                     // 任意：新しい名前
    pub player_type_id: Option<Option<String>>,   // None=変更なし, Some(None)=削除, Some(Some(id))=更新
}
```

**出力値**:
```rust
Result<Player, String> // 更新されたPlayerオブジェクトまたはエラーメッセージ
```

**参照したEARS要件**: REQ-001（プレイヤー管理）, REQ-002（プレイヤータイプ）
**参照した設計文書**: types.rs の UpdatePlayerRequest 定義

## 3. 制約条件（EARS非機能要件・アーキテクチャ設計ベース）

### パフォーマンス要件
🔵 **青信号**: NFR-001, NFR-002 に明記

- **プレイヤー一覧取得**: ≤ 1秒以内（NFR-001）
- **データベースクエリ**: ≤ 200ms以内（推測：NFR-002から算出）
- **大量データ対応**: 1000人以上のプレイヤーでも性能劣化なし

### データ整合性要件
🔵 **青信号**: REQ-001, EDGE-001 に明記

- **名前重複禁止**: 同名プレイヤーは作成・更新時にエラー
- **参照整合性**: 無効なplayer_type_idでの更新を禁止
- **存在確認**: 更新対象プレイヤーが存在しない場合はエラー

### 技術制約
🔵 **青信号**: 技術スタック定義書

- **フレームワーク**: Tauri Commands（async fn）
- **データベース**: SQLite + rusqlite
- **シリアライゼーション**: serde（Serialize, Deserialize）
- **エラーハンドリング**: Result<T, String>形式

**参照したEARS要件**: NFR-001, NFR-002, REQ-401
**参照した設計文書**: architecture.md パフォーマンス最適化セクション

## 4. 想定される使用例（EARSEdgeケース・データフローベース）

### 基本的な使用パターン
🔵 **青信号**: dataflow.md のプレイヤー管理フローに基づく

1. **ページネーション取得**:
   ```typescript
   // フロントエンド使用例
   const result = await invoke<GetPlayersResponse>('get_players', {
     limit: 20,
     offset: 0,
     sort_by: 'name',
     sort_order: 'asc'
   });
   ```

2. **プレイヤー名更新**:
   ```typescript
   const result = await invoke<Player>('update_player', {
     id: 'player_id_123',
     name: '新しい名前',
     player_type_id: null  // 変更しない
   });
   ```

### エッジケース
🔵 **青信号**: EDGE-001, EDGE-101, EDGE-102 に明記

1. **名前重複エラー**:
   - 既存プレイヤーと同名に更新しようとした場合
   - エラーメッセージ: "同名のプレイヤーが既に存在します"

2. **境界値テスト**:
   - 1文字のプレイヤー名でも正常動作
   - 255文字の長い名前でも正常表示
   - limit=1000での大量取得

3. **無効データ処理**:
   - 存在しないプレイヤーID更新
   - 無効なplayer_type_id指定
   - 空文字の名前指定

**参照したEARS要件**: EDGE-001, EDGE-101, EDGE-102
**参照した設計文書**: dataflow.md エラーハンドリングフロー

## 5. EARS要件・設計文書との対応関係

### 参照したユーザストーリー
🔵 **青信号**: playernote-user-stories.md

- **US-001**: "ポーカープレイヤーとして、対戦相手を記録したい"
- **US-002**: "ポーカープレイヤーとして、記録した相手情報を素早く検索したい"
- **US-003**: "ポーカープレイヤーとして、相手の情報を更新したい"

### 参照した機能要件
🔵 **青信号**: playernote-requirements.md

- **REQ-001**: プレイヤー基本情報管理
- **REQ-002**: カスタマイズ可能なプレイヤータイプ設定
- **REQ-102**: 1プレイヤーに高々1つのタイプ割り当て

### 参照した非機能要件
🔵 **青信号**: playernote-requirements.md

- **NFR-001**: プレイヤー一覧表示1秒以内
- **NFR-002**: 検索結果表示500ms以内

### 参照したEdgeケース
🔵 **青信号**: playernote-requirements.md

- **EDGE-001**: プレイヤー名重複エラー処理
- **EDGE-101**: 1文字プレイヤー名対応
- **EDGE-102**: 255文字長名対応

### 参照した設計文書
🔵 **青信号**: 設計文書群

- **アーキテクチャ**: architecture.md - Component-Based Architecture
- **データフロー**: dataflow.md - プレイヤー作成・更新フロー
- **型定義**: types.rs - Player, UpdatePlayerRequest 等
- **API仕様**: api-endpoints.md - get_players, update_player 仕様

## 6. テスト要件（TDD開発要件）

### 単体テスト要件
🟡 **黄信号**: TDD開発手法から推測した必要テスト項目

1. **get_players テスト**:
   - デフォルトパラメータ動作確認
   - ページネーション動作確認
   - ソート機能確認
   - 境界値テスト（limit=1, limit=1000）

2. **update_player テスト**:
   - 名前更新成功
   - プレイヤータイプ更新・削除
   - 重複名エラー
   - 存在しないID エラー
   - 無効なタイプIDエラー

### パフォーマンステスト
🔵 **青信号**: NFR-001に基づく

- 1000件データでの1秒以内応答確認
- データベースクエリ実行時間測定

## 7. 実装完了条件

### 機能完了条件
🔵 **青信号**: TASK-0504要求仕様

1. **get_players コマンド実装**:
   - ページネーション対応
   - ソート機能
   - Tauriコマンド登録

2. **update_player コマンド実装**:
   - 名前・タイプ更新
   - バリデーション
   - Tauriコマンド登録

3. **テスト完了**:
   - 全テストケース合格
   - パフォーマンス要件達成

### 品質完了条件
🔵 **青信号**: tech-stack.md品質基準

- cargo test 全合格
- cargo clippy clean
- 型安全性確保（TypeScript strict mode対応）

**推定実装工数**: 16時間（2日間）
**優先度**: 高（フロントエンド開発のブロッカー）

---

**次のステップ**: テストケース洗い出しフェーズへ移行