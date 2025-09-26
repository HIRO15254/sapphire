# TASK-0506 プレイヤー詳細取得API 要件定義書

## 🔵 青信号確定 - TDD要件定義完了

**生成日時**: 2025-09-25
**タスクID**: TASK-0506
**タスク名**: プレイヤー詳細取得API
**要件名**: playernote
**開発手法**: TDD (Test-Driven Development)

---

## 事前準備完了 ✅

### 読み込み済みコンテキスト情報
- **追加ルール**: common-rule.md, verify-complete-rule.md
- **技術スタック**: docs/tech-stack.md (Tauri 2.0+, React 18, TypeScript 5.0+, SQLite)
- **EARS要件定義**: playernote-requirements.md (106要件完全網羅)
- **受け入れ基準**: playernote-acceptance-criteria.md (詳細テスト基準)
- **ユーザストーリー**: playernote-user-stories.md (5エピック、ペルソナ定義)
- **タスク定義**: playernote-phase1.md (TASK-0506詳細仕様)
- **API仕様**: api-endpoints.md (get_player_detail完全定義)
- **型定義**: interfaces.ts (PlayerDetail, GetPlayerDetailResponse)
- **データベース**: database-schema.sql (v_player_detail ビュー確認)
- **既存実装**: commands.rs (delete_player実装パターン確認)

---

## 1. 機能の概要（EARS要件定義書・設計文書ベース）

🔵 **青信号**: EARS要件定義書REQ-001, REQ-003, REQ-004とapi-endpoints.mdに完全準拠

### 機能説明
**プレイヤー詳細取得API**は、指定されたプレイヤーIDに基づいて、プレイヤーの基本情報、関連するタグ情報（レベル付き）、プレイヤータイプ、メモデータを効率的に1回のクエリで取得するTauriコマンドです。

### 問題解決
- **課題**: フロントエンドから個別にプレイヤー情報、タグ、メモを取得すると複数回のAPI呼び出しが必要
- **解決**: 関連データを統合して一度に取得することで、パフォーマンスを向上（NFR-104: ≤200ms）
- **価値**: ライブポーカーでの対戦前情報確認が高速化

### 想定ユーザー（ペルソナベース）
- **プライマリ**: 真剣なアマチュアプレイヤー（田中さん）- 対戦前の情報確認
- **セカンダリ**: セミプロプレイヤー（佐藤さん）- 詳細分析データの効率的取得

### システム内位置づけ
- **アーキテクチャ層**: Tauriコマンド層（API層）
- **依存**: データベース層（SQLite、v_player_detailビュー）
- **連携**: フロントエンドPlayerDetailページ、プレイヤーカードコンポーネント

### 参照情報
- **参照したEARS要件**: REQ-001（プレイヤー管理）, REQ-003（多重タグ）, REQ-004（リッチテキストメモ）
- **参照した設計文書**: api-endpoints.md 415-455行目、interfaces.ts 65-71行目

---

## 2. 入力・出力の仕様（EARS機能要件・TypeScript型定義ベース）

🔵 **青信号**: api-endpoints.md、interfaces.tsの型定義に完全準拠

### 入力仕様（GetPlayerDetailRequest）
```rust
#[derive(Deserialize)]
struct GetPlayerDetailRequest {
    player_id: String,
}
```

**パラメータ詳細**:
- **player_id**: `String` (必須)
  - 形式: UUID形式文字列（lower(hex(randomblob(16)))）
  - 制約: データベースに存在するプレイヤーID
  - バリデーション: 空文字列不可、既存プレイヤー確認

### 出力仕様（GetPlayerDetailResponse）
```rust
#[derive(Serialize)]
struct GetPlayerDetailResponse {
    success: bool,
    data: Option<PlayerDetail>,
    error: Option<ApiError>,
}

#[derive(Serialize)]
struct PlayerDetail {
    player: Player,
    player_type: Option<PlayerType>,
    tags: Vec<TagWithLevel>,
    notes: Vec<PlayerNote>,
}
```

**レスポンス構造**:
- **player**: プレイヤー基本情報（名前、作成日時等）
- **player_type**: 割り当てられたプレイヤータイプ（色、名称）
- **tags**: タグ配列（レベル情報と計算済み色情報付き）
- **notes**: 関連するメモ配列（リッチテキストコンテンツ）

### 入出力関係性
**シンプルな1:1関係**: 1つのプレイヤーIDから1つの詳細情報オブジェクト

### データフロー
1. フロントエンド → Tauriコマンド: player_id
2. データベースクエリ: v_player_detail ビュー使用
3. タグレベル色計算: computed_colorフィールド生成
4. Tauriコマンド → フロントエンド: 統合済み詳細データ

### 参照情報
- **参照したEARS要件**: REQ-001（基本情報）, REQ-003（タグ）, REQ-004（メモ）
- **参照した設計文書**: interfaces.ts PlayerDetail型、api-endpoints.md 424-452行目

---

## 3. 制約条件（EARS非機能要件・アーキテクチャ設計ベース）

🔵 **青信号**: playernote-requirements.md NFR要件とタスク定義に完全準拠

### パフォーマンス要件
- **NFR-104準拠**: 応答時間 ≤200ms（TASK-0506完了条件）
- **データベース最適化**: v_player_detailビュー使用による効率的JOIN
- **メモリ効率**: 必要最小限のデータ転送

### アーキテクチャ制約
- **REQ-402**: Tauri Commands使用（Rust + TypeScript）
- **REQ-403**: SQLiteデータベース使用
- **技術スタック**: Tauri 2.0+, tokio, serde, rusqlite

### データベース制約
- **外部キー制約**: 既存プレイヤーIDの存在確認
- **トランザクション**: 読み取り専用操作（SELECT）
- **インデックス活用**: プレイヤーIDでの高速検索

### API制約
- **型安全性**: serde使用による自動シリアライゼーション
- **エラーハンドリング**: 統一されたApiError形式
- **一意性**: 同時に複数の詳細取得でもデータ整合性保証

### セキュリティ制約
- **入力検証**: プレイヤーIDのバリデーション
- **データ整合性**: 存在しないIDに対する適切なエラー処理
- **権限**: 読み取り専用操作のため追加認証不要

### 参照情報
- **参照したEARS要件**: NFR-104（200ms以内）, REQ-402（Tauri）, REQ-403（SQLite）
- **参照した設計文書**: architecture.md Tauriコマンド設計、database-schema.sql制約定義

---

## 4. 想定される使用例（EARSEdgeケース・データフローベース）

🔵 **青信号**: ユーザストーリーとacceptance-criteriaに基づく実用的シナリオ

### 基本使用パターン（通常要件）

#### パターン1: プレイヤー詳細ページ表示
**シナリオ**: ポーカープレイヤーがプレイヤー一覧から特定の相手をクリック
```typescript
const result = await invoke<GetPlayerDetailResponse>('get_player_detail', {
  player_id: 'selected_player_id'
});
// プレイヤー詳細ページに全情報を一度に表示
```

#### パターン2: 対戦前情報確認
**シナリオ**: 対戦開始前の相手情報チェック
- **前提**: プレイヤー検索で相手を特定済み
- **処理**: 詳細情報取得→戦略決定
- **期待**: 200ms以内で完全な情報表示

#### パターン3: プレイヤーカードコンポーネント
**シナリオ**: UI上でのプレイヤー情報カード表示
- タグ（レベル付き色表示）
- プレイヤータイプ（色分け）
- 最新メモ情報

### Edgeケース（EARS Edge要件）

#### EDGE-001: 存在しないプレイヤーID
```rust
// 想定エラーレスポンス
ApiError {
    code: "PLAYER_NOT_FOUND",
    message: "指定されたプレイヤーが見つかりません",
    details: Some(json!({"player_id": "invalid_id"}))
}
```

#### EDGE-002: 関連データが部分的に欠損
**シナリオ**: プレイヤーは存在するが、タグやメモが空の場合
- **tags**: 空配列`[]`を返却
- **player_type**: `None`を返却
- **notes**: 空配列`[]`を返却
- **エラーではない**: 正常なレスポンス

#### EDGE-003: 大量タグ・メモデータ
**シナリオ**: プレイヤーに50個以上のタグと長文メモが存在
- **パフォーマンス**: NFR-104（200ms）内で取得
- **メモリ効率**: 必要最小限のデータ構造
- **UI対応**: 仮想化リストで表示

### エラーケース
- **データベース接続エラー**: `DB_CONNECTION_ERROR`
- **不正なプレイヤーID**: `INVALID_INPUT`
- **システムエラー**: `INTERNAL_ERROR`

### 参照情報
- **参照したEARS要件**: EDGE-202（データ整合性）, NFR-104（パフォーマンス）
- **参照した設計文書**: dataflow.md プレイヤー詳細取得フロー

---

## 5. EARS要件・設計文書との対応関係

### 参照したユーザストーリー
- **エピック1: プレイヤー基本管理** - ストーリー1.2（プレイヤー情報編集）
- **エピック4: リッチテキストメモ機能** - ストーリー4.1（詳細メモの作成）

### 参照した機能要件
- **REQ-001**: システムはプレイヤーの基本情報を管理しなければならない
- **REQ-003**: システムはプレイヤーに複数のタグを割り当てることができなければならない
- **REQ-004**: システムはプレイヤーごとにリッチテキスト形式のメモを作成・編集できなければならない

### 参照した非機能要件
- **NFR-104**: プレイヤー詳細取得の応答時間は200ms以内であること（TASK-0506完了条件）
- **NFR-101**: 色による視覚的な区別が可能であること（タグレベル色計算）

### 参照したEdgeケース
- **EDGE-201**: プレイヤー削除時に孤立したデータが残らないこと（関連データ整合性）
- **EDGE-203**: アプリケーション強制終了時にデータの不整合が発生しないこと

### 参照した設計文書
- **アーキテクチャ**: api-endpoints.md 「Tauriコマンド設計概要」
- **データフロー**: database-schema.sql v_player_detail ビュー定義
- **型定義**: interfaces.ts PlayerDetail, TagWithLevel インターフェース
- **API仕様**: api-endpoints.md 415-455行目 get_player_detail仕様

---

## 品質判定結果

### ✅ 高品質認定

- **要件の曖昧さ**: なし（EARS要件定義書完全準拠）
- **入出力定義**: 完全（api-endpoints.md、interfaces.ts準拠）
- **制約条件**: 明確（NFR-104、技術スタック制約明示）
- **実装可能性**: 確実（既存delete_player実装パターン、データベーススキーマ確認済み）

### 実装準備度
🔵 **青信号**: 即座に実装開始可能
- データベーススキーマ: 準備完了（v_player_detail ビュー存在）
- API仕様: 完全定義済み
- 型定義: TypeScript/Rust両方準備済み
- 参考実装: 既存delete_player実装パターン活用可能

---

## 次のステップ

**次のお勧めステップ**: `/tdd-testcases` でテストケースの洗い出しを行います。

要件定義が高品質で完成しており、即座にRed-Green-Refactorサイクルに進むことができます。NFR-104（≤200ms）を含むすべての要件が明確に定義されています。