# TDD Requirements - TASK-0510: プレイヤー検索API実装

## 概要

プレイヤー名での部分一致検索機能を提供するAPIを実装する。効率的な検索アルゴリズム、インデックス最適化、ページネーション、ソート機能を備えた高性能な検索システムを構築する。

## 要件ソース

- **要件定義**: REQ-005, NFR-102
- **依存タスク**: TASK-0509 ✅ 完了済み
- **推定工数**: 16時間（2日）

## 機能要件

### 🔵 青信号項目（要件準拠）

#### FS-01: 部分一致検索API
- **要件**: REQ-005
- **説明**: プレイヤー名での部分一致検索機能を提供
- **APIコマンド**: `search_players`
- **検索対象**: players.name フィールド
- **検索方式**: 部分一致（LIKE '%検索語%'）
- **大文字小文字**: 区別しない（COLLATE NOCASE）

#### FS-02: ページネーション対応
- **説明**: 大量の検索結果を効率的に分割表示
- **パラメータ**:
  - `page`: ページ番号（1から開始）
  - `limit`: 1ページあたりの件数（デフォルト: 20）
- **制限**: 最大100件/ページ
- **レスポンス**: 総件数、現在ページ、総ページ数を含む

#### FS-03: ソート機能
- **デフォルトソート**: 関連度順（完全一致 > 前方一致 > 部分一致）
- **サポートソート**:
  - `relevance`: 関連度順（デフォルト）
  - `name_asc`: 名前昇順
  - `name_desc`: 名前降順
  - `created_asc`: 作成日時昇順
  - `created_desc`: 作成日時降順
  - `updated_desc`: 更新日時降順

### 🟡 黄信号項目（妥当な推測）

#### FS-04: 空文字・短文字列ハンドリング
- **空文字列**: 全プレイヤー一覧を返す（ページネーション適用）
- **1文字検索**: 有効な検索として処理
- **スペース除去**: 検索語の前後スペースをトリム

#### FS-05: 特殊文字エスケープ
- **SQLインジェクション対策**: パラメータ化クエリ使用
- **特殊文字**: %、_、'、"等のエスケープ処理
- **Unicode対応**: 日本語・絵文字対応

## パフォーマンス要件

### 🔵 青信号項目（要件準拠）

#### NFR-01: レスポンス時間
- **要件**: NFR-102
- **目標**: ≤500ms（検索結果表示）
- **測定条件**: 1000件のプレイヤーデータ
- **最適化**: インデックス活用

#### NFR-02: インデックス最適化
- **対象カラム**: players.name
- **インデックス種類**: B-tree index
- **追加インデックス**: created_at, updated_at（ソート用）

### 🟡 黄信号項目（妥当な推測）

#### NFR-03: スループット要件
- **同時リクエスト**: 10req/sec以上
- **メモリ使用量**: ≤5MB（検索処理時）
- **キャッシュ戦略**: 頻繁検索のクエリキャッシュ

## API仕様

### 入力仕様

```typescript
interface SearchPlayersRequest {
  query: string;           // 検索語（必須、空文字可）
  page?: number;          // ページ番号（デフォルト: 1）
  limit?: number;         // 件数（デフォルト: 20、最大: 100）
  sort?: SortOption;      // ソート方式（デフォルト: 'relevance'）
}

type SortOption =
  | 'relevance'
  | 'name_asc'
  | 'name_desc'
  | 'created_asc'
  | 'created_desc'
  | 'updated_desc';
```

### 出力仕様

```typescript
interface SearchPlayersResponse {
  players: PlayerSearchResult[];
  pagination: {
    current_page: number;   // 現在ページ
    per_page: number;       // 1ページあたり件数
    total_items: number;    // 総件数
    total_pages: number;    // 総ページ数
    has_next: boolean;      // 次ページ有無
    has_prev: boolean;      // 前ページ有無
  };
  search_info: {
    query: string;          // 検索語
    sort: SortOption;       // ソート方式
    execution_time_ms: number; // 実行時間
  };
}

interface PlayerSearchResult {
  id: string;
  name: string;
  player_type_id?: string;
  player_type?: {
    id: string;
    name: string;
    color: string;
  };
  tag_count: number;       // 割り当てタグ数
  has_notes: boolean;      // メモ有無
  created_at: string;
  updated_at: string;
  relevance_score?: number; // 関連度スコア（relevanceソート時）
}
```

### エラー仕様

```typescript
interface SearchError {
  code: string;
  message: string;
  details?: {
    query?: string;
    page?: number;
    limit?: number;
    sort?: string;
  };
}

// エラーコード定義
const SEARCH_ERROR_CODES = {
  INVALID_PAGE: 'SEARCH_INVALID_PAGE',           // 無効ページ番号
  INVALID_LIMIT: 'SEARCH_INVALID_LIMIT',         // 無効件数
  INVALID_SORT: 'SEARCH_INVALID_SORT',           // 無効ソート方式
  QUERY_TOO_LONG: 'SEARCH_QUERY_TOO_LONG',       // 検索語過長
  DATABASE_ERROR: 'SEARCH_DATABASE_ERROR',        // DB接続エラー
  TIMEOUT_ERROR: 'SEARCH_TIMEOUT_ERROR',          // タイムアウト
} as const;
```

## データベース設計

### インデックス作成

```sql
-- プレイヤー名検索用インデックス
CREATE INDEX IF NOT EXISTS idx_players_name_search
ON players(name COLLATE NOCASE);

-- ソート用インデックス
CREATE INDEX IF NOT EXISTS idx_players_created_at
ON players(created_at);

CREATE INDEX IF NOT EXISTS idx_players_updated_at
ON players(updated_at);

-- 複合インデックス（名前+作成日時）
CREATE INDEX IF NOT EXISTS idx_players_name_created
ON players(name COLLATE NOCASE, created_at);
```

### 検索クエリ最適化

```sql
-- 基本検索クエリ（関連度順）
SELECT
  p.id,
  p.name,
  p.player_type_id,
  pt.name as player_type_name,
  pt.color as player_type_color,
  p.created_at,
  p.updated_at,
  -- 関連度スコア算出
  CASE
    WHEN p.name COLLATE NOCASE = ? THEN 100        -- 完全一致
    WHEN p.name COLLATE NOCASE LIKE ? || '%' THEN 90  -- 前方一致
    WHEN p.name COLLATE NOCASE LIKE '%' || ? THEN 80  -- 後方一致
    ELSE 70                                          -- 部分一致
  END as relevance_score,
  -- サブクエリでタグ数取得
  (SELECT COUNT(*) FROM player_tags pt WHERE pt.player_id = p.id) as tag_count,
  -- サブクエリでメモ有無確認
  EXISTS(SELECT 1 FROM player_notes pn WHERE pn.player_id = p.id) as has_notes
FROM players p
LEFT JOIN player_types pt ON p.player_type_id = pt.id
WHERE p.name COLLATE NOCASE LIKE '%' || ? || '%'
ORDER BY relevance_score DESC, p.name COLLATE NOCASE ASC
LIMIT ? OFFSET ?;
```

## Rustバックエンド実装

### コマンド実装

```rust
#[tauri::command]
pub async fn search_players(
    query: String,
    page: Option<u32>,
    limit: Option<u32>,
    sort: Option<String>,
) -> Result<SearchPlayersResponse, ApiError> {
    let start_time = std::time::Instant::now();

    // バリデーション
    let page = page.unwrap_or(1).max(1);
    let limit = limit.unwrap_or(20).min(100).max(1);
    let sort_option = validate_sort_option(sort)?;

    if query.len() > 255 {
        return Err(ApiError::validation("SEARCH_QUERY_TOO_LONG", "Query too long"));
    }

    // データベース検索実行
    let connection = get_database_connection()?;
    let (players, total_count) = execute_search_query(
        &connection,
        &query.trim(),
        page,
        limit,
        &sort_option
    ).await?;

    let execution_time = start_time.elapsed().as_millis() as u32;

    // レスポンス構築
    Ok(SearchPlayersResponse {
        players,
        pagination: build_pagination(page, limit, total_count),
        search_info: SearchInfo {
            query: query.trim().to_string(),
            sort: sort_option,
            execution_time_ms: execution_time,
        }
    })
}
```

### ヘルパー関数

```rust
fn validate_sort_option(sort: Option<String>) -> Result<SortOption, ApiError> {
    match sort.as_deref() {
        None | Some("relevance") => Ok(SortOption::Relevance),
        Some("name_asc") => Ok(SortOption::NameAsc),
        Some("name_desc") => Ok(SortOption::NameDesc),
        Some("created_asc") => Ok(SortOption::CreatedAsc),
        Some("created_desc") => Ok(SortOption::CreatedDesc),
        Some("updated_desc") => Ok(SortOption::UpdatedDesc),
        Some(invalid) => Err(ApiError::validation(
            "SEARCH_INVALID_SORT",
            &format!("Invalid sort option: {}", invalid)
        )),
    }
}

fn build_pagination(page: u32, limit: u32, total_count: u32) -> Pagination {
    let total_pages = (total_count + limit - 1) / limit;

    Pagination {
        current_page: page,
        per_page: limit,
        total_items: total_count,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
    }
}
```

## TypeScript型定義

### リクエスト・レスポンス型

```typescript
// src/types/playerSearch.ts

export interface SearchPlayersRequest {
  query: string;
  page?: number;
  limit?: number;
  sort?: SortOption;
}

export type SortOption =
  | 'relevance'
  | 'name_asc'
  | 'name_desc'
  | 'created_asc'
  | 'created_desc'
  | 'updated_desc';

export interface SearchPlayersResponse {
  players: PlayerSearchResult[];
  pagination: Pagination;
  search_info: SearchInfo;
}

export interface PlayerSearchResult {
  id: string;
  name: string;
  player_type_id?: string;
  player_type?: {
    id: string;
    name: string;
    color: string;
  };
  tag_count: number;
  has_notes: boolean;
  created_at: string;
  updated_at: string;
  relevance_score?: number;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SearchInfo {
  query: string;
  sort: SortOption;
  execution_time_ms: number;
}

// エラー型定義
export const SEARCH_ERROR_CODES = {
  INVALID_PAGE: 'SEARCH_INVALID_PAGE',
  INVALID_LIMIT: 'SEARCH_INVALID_LIMIT',
  INVALID_SORT: 'SEARCH_INVALID_SORT',
  QUERY_TOO_LONG: 'SEARCH_QUERY_TOO_LONG',
  DATABASE_ERROR: 'SEARCH_DATABASE_ERROR',
  TIMEOUT_ERROR: 'SEARCH_TIMEOUT_ERROR',
} as const;

export type SearchErrorCode = typeof SEARCH_ERROR_CODES[keyof typeof SEARCH_ERROR_CODES];
```

## テスト要件

### 📊 単体テスト（Unit Tests）

#### UT-01: 基本検索機能テスト
- 正常な検索語での検索
- 空文字列検索（全件取得）
- 日本語検索
- 大文字小文字混合検索

#### UT-02: ページネーション テスト
- 有効なページ・limit指定
- 境界値テスト（page=1, 最大ページ）
- 無効値テスト（page=0, limit=0, limit>100）

#### UT-03: ソート機能テスト
- 各ソートオプションの動作確認
- 関連度スコア算出テスト
- 同一スコア時の副次ソート

#### UT-04: バリデーション テスト
- 過長検索語（>255文字）
- 特殊文字エスケープ
- SQLインジェクション対策

### 🔄 統合テスト（Integration Tests）

#### IT-01: データベース統合テスト
- インデックス活用確認
- クエリ実行計画検証
- トランザクション処理

#### IT-02: パフォーマンステスト
- 500ms以内レスポンス確認
- 大量データ（1000件）での性能
- 同時リクエスト処理

#### IT-03: エラーハンドリングテスト
- データベース接続エラー
- タイムアウト処理
- 不正パラメータ処理

## 受け入れ基準

### ✅ 機能的受け入れ基準

1. **AC-01**: プレイヤー名"田中"で検索すると、"田中太郎"、"田中花子"等が結果に含まれる
2. **AC-02**: 検索語"tag"で検索すると、"Player with tags"等が結果に含まれる
3. **AC-03**: 空文字列検索で全プレイヤーが20件ずつページ分割される
4. **AC-04**: page=2, limit=10指定で11-20件目が返される
5. **AC-05**: sort=name_ascで名前昇順にソートされる
6. **AC-06**: 関連度順で完全一致が部分一致より上位に表示される

### ⚡ 非機能的受け入れ基準

1. **AC-NFR-01**: 1000件データでの検索が500ms以内で完了する
2. **AC-NFR-02**: インデックスが適切に使用されクエリが最適化される
3. **AC-NFR-03**: SQLインジェクション攻撃が無効化される
4. **AC-NFR-04**: 日本語・絵文字での検索が正常動作する

### 🧪 品質受け入れ基準

1. **AC-QA-01**: 全単体テストが成功する
2. **AC-QA-02**: 全統合テストが成功する
3. **AC-QA-03**: コードカバレッジ90%以上を達成する
4. **AC-QA-04**: Rustコンパイル・TypeScriptビルドエラーなし

## 実装優先度

### 🚀 Phase 1: 基本機能（必須）
1. search_players コマンド基本実装
2. 部分一致検索機能
3. ページネーション機能
4. 基本バリデーション

### 🔧 Phase 2: 最適化（重要）
1. インデックス作成・クエリ最適化
2. 関連度スコア算出
3. ソート機能実装
4. エラーハンドリング強化

### ⭐ Phase 3: 高度機能（推奨）
1. パフォーマンス監視
2. キャッシュ戦略
3. 統合テスト充実
4. ドキュメント整備

## 注意事項・制約

### 🔒 セキュリティ制約
- SQLインジェクション対策必須
- パラメータ化クエリ使用
- 入力値サニタイゼーション

### 📊 パフォーマンス制約
- NFR-102（≤500ms）準拠必須
- インデックス活用必須
- メモリ使用量監視

### 🔗 依存関係制約
- TASK-0509完了に依存
- 既存API（TASK-0507/0508/0509）との整合性
- SQLiteスキーマとの互換性

### 🧪 テスト制約
- `bun run test`コマンド使用必須
- モックベーステスト戦略
- 既存124テストとの回帰防止

---

**📝 作成者**: Claude Code
**📅 作成日時**: 2025-09-27
**🎯 実装目標**: 高性能・高品質な検索API
**⏱️ 推定工数**: 16時間（2日間）