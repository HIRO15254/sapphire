# Player Note API エンドポイント仕様

## Tauriコマンド設計概要

Player Note機能のAPIは、Tauri Commandsとして実装されます。フロントエンド（React/TypeScript）からRustバックエンドへの型安全な通信を提供します。

🔵 **青信号**: 技術スタック定義書に基づくTauri Commands設計

## プレイヤー管理 API

### create_player

プレイヤーを作成します（REQ-001）

**コマンド名**: `create_player`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct CreatePlayerRequest {
    name: String,
    player_type_id: Option<String>,
}
```

**レスポンス**:
```rust
#[derive(Serialize)]
struct CreatePlayerResponse {
    success: bool,
    data: Option<Player>,
    error: Option<ApiError>,
}

#[derive(Serialize)]
struct Player {
    id: String,
    name: String,
    player_type_id: Option<String>,
    created_at: String, // ISO 8601 format
    updated_at: String,
}
```

**TypeScript使用例**:
```typescript
const result = await invoke<CreatePlayerResponse>('create_player', {
  name: '田中太郎',
  player_type_id: 'aggressive_type_id'
});
```

**エラーケース**:
- 同名プレイヤーが存在する場合: `DUPLICATE_PLAYER_NAME`
- 無効なplayer_type_id: `INVALID_PLAYER_TYPE`

🔵 **青信号**: REQ-001（プレイヤー管理）要件に基づく

---

### get_players

プレイヤー一覧を取得します（NFR-101: 1秒以内表示）

**コマンド名**: `get_players`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct GetPlayersRequest {
    limit: Option<i32>,    // デフォルト50
    offset: Option<i32>,   // デフォルト0
    sort_by: Option<String>, // "name", "created_at", "updated_at"
    sort_order: Option<String>, // "asc", "desc"
}
```

**レスポンス**:
```rust
#[derive(Serialize)]
struct GetPlayersResponse {
    success: bool,
    data: Option<PlayersData>,
    error: Option<ApiError>,
}

#[derive(Serialize)]
struct PlayersData {
    players: Vec<PlayerListItem>,
    total_count: i32,
    has_more: bool,
}

#[derive(Serialize)]
struct PlayerListItem {
    player: Player,
    player_type: Option<PlayerType>,
    tag_count: i32,
    last_note_updated: Option<String>,
}
```

🟡 **黄信号**: NFR-101パフォーマンス要件を満たすためのページネーション設計

---

### update_player

プレイヤー情報を更新します

**コマンド名**: `update_player`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct UpdatePlayerRequest {
    id: String,
    name: Option<String>,
    player_type_id: Option<Option<String>>, // None=変更なし, Some(None)=削除, Some(Some(id))=更新
}
```

**レスポンス**: `CreatePlayerResponse`と同形式

🔵 **青信号**: REQ-001基本CRUD操作

---

### delete_player

プレイヤーを削除します（REQ-401: カスケード削除）

**コマンド名**: `delete_player`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct DeletePlayerRequest {
    id: String,
}
```

**レスポンス**:
```rust
#[derive(Serialize)]
struct DeletePlayerResponse {
    success: bool,
    deleted_relations: Option<DeletedRelations>,
    error: Option<ApiError>,
}

#[derive(Serialize)]
struct DeletedRelations {
    notes_count: i32,
    tags_count: i32,
}
```

🔵 **青信号**: REQ-401（カスケード削除）要件に基づく

## プレイヤータイプ管理 API

### create_player_type

プレイヤータイプを作成します（REQ-101, REQ-102）

**コマンド名**: `create_player_type`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct CreatePlayerTypeRequest {
    name: String,
    color: String, // HEX color code
}
```

**レスポンス**:
```rust
#[derive(Serialize)]
struct CreatePlayerTypeResponse {
    success: bool,
    data: Option<PlayerType>,
    error: Option<ApiError>,
}

#[derive(Serialize)]
struct PlayerType {
    id: String,
    name: String,
    color: String,
    created_at: String,
    updated_at: String,
}
```

**バリデーション**:
- `color`: 有効なHEX色コード形式 (#RRGGBB)
- `name`: 1-50文字、重複不可

🔵 **青信号**: REQ-101, REQ-102（カスタマイズ可能なプレイヤータイプ）

---

### get_player_types

プレイヤータイプ一覧を取得します

**コマンド名**: `get_player_types`

**リクエスト**: なし

**レスポンス**:
```rust
#[derive(Serialize)]
struct GetPlayerTypesResponse {
    success: bool,
    data: Option<Vec<PlayerType>>,
    error: Option<ApiError>,
}
```

## タグ管理 API

### create_tag

タグを作成します（REQ-104）

**コマンド名**: `create_tag`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct CreateTagRequest {
    name: String,
    color: String, // Base HEX color
}
```

**レスポンス**: `PlayerType`と同様の構造

🔵 **青信号**: REQ-104（カスタマイズ可能なタグ）

---

### get_tags

タグ一覧を取得します

**コマンド名**: `get_tags`

**リクエスト**: なし

**レスポンス**: タグ一覧

---

### assign_tags

プレイヤーに複数のタグをレベル付きで割り当てます（REQ-003, REQ-105）

**コマンド名**: `assign_tags`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct AssignTagsRequest {
    player_id: String,
    tag_assignments: Vec<TagAssignment>,
}

#[derive(Deserialize)]
struct TagAssignment {
    tag_id: String,
    level: i32, // 1-10
}
```

**レスポンス**:
```rust
#[derive(Serialize)]
struct AssignTagsResponse {
    success: bool,
    data: Option<Vec<PlayerTag>>,
    error: Option<ApiError>,
}

#[derive(Serialize)]
struct PlayerTag {
    id: String,
    player_id: String,
    tag_id: String,
    level: i32,
    created_at: String,
    updated_at: String,
}
```

**バリデーション**:
- `level`: 1-10の範囲内
- 同じプレイヤーに同じタグは既存の場合は更新

🔵 **青信号**: REQ-003（多重タグシステム）, REQ-105（レベル設定）

---

### remove_tag

プレイヤーからタグを削除します

**コマンド名**: `remove_tag`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct RemoveTagRequest {
    player_id: String,
    tag_id: String,
}
```

**レスポンス**: 基本的な成功/失敗レスポンス

## 検索 API

### search_players

プレイヤーを部分一致で検索します（REQ-005, NFR-102: 500ms応答）

**コマンド名**: `search_players`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct SearchPlayersRequest {
    query: String,
    limit: Option<i32>,  // デフォルト50
    offset: Option<i32>, // デフォルト0
}
```

**レスポンス**: `GetPlayersResponse`と同形式

**パフォーマンス要件**:
- レスポンス時間: ≤500ms
- SQLiteインデックス活用による高速検索
- フロントエンドでデバウンス適用（500ms）

🔵 **青信号**: REQ-005（検索機能）, NFR-102（500ms応答時間）

## メモ管理 API

### get_player_note

プレイヤーのメモを取得します（REQ-004）

**コマンド名**: `get_player_note`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct GetPlayerNoteRequest {
    player_id: String,
}
```

**レスポンス**:
```rust
#[derive(Serialize)]
struct GetPlayerNoteResponse {
    success: bool,
    data: Option<PlayerNote>,
    error: Option<ApiError>,
}

#[derive(Serialize)]
struct PlayerNote {
    id: String,
    player_id: String,
    content: String, // TipTap rich text content
    created_at: String,
    updated_at: String,
}
```

🔵 **青信号**: REQ-004（リッチテキストメモ）

---

### save_player_note

プレイヤーのメモを保存します（REQ-106: TipTap対応）

**コマンド名**: `save_player_note`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct SavePlayerNoteRequest {
    player_id: String,
    content: String, // TipTap rich text JSON/HTML
}
```

**レスポンス**: `GetPlayerNoteResponse`と同形式

**特記事項**:
- 既存メモがある場合は更新、ない場合は新規作成（UPSERT）
- TipTapエディタからのJSONまたはHTML形式コンテンツ対応

🔵 **青信号**: REQ-106（TipTap統合）

## 集計・詳細取得 API

### get_player_detail

プレイヤーの詳細情報（タグ、メモ含む）を取得します

**コマンド名**: `get_player_detail`

**リクエスト**:
```rust
#[derive(Deserialize)]
struct GetPlayerDetailRequest {
    player_id: String,
}
```

**レスポンス**:
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

#[derive(Serialize)]
struct TagWithLevel {
    tag: Tag,
    level: i32,
    computed_color: String, // Level-based color intensity
}
```

🟡 **黄信号**: UI表示効率化のための複合データ取得設計

## エラーハンドリング

### 共通エラー形式

```rust
#[derive(Serialize)]
struct ApiError {
    code: String,
    message: String,
    details: Option<serde_json::Value>,
}
```

### エラーコード一覧

**データベースエラー**:
- `DB_CONNECTION_ERROR`: データベース接続エラー
- `DB_CONSTRAINT_VIOLATION`: 制約違反
- `DB_TRANSACTION_FAILED`: トランザクション失敗

**バリデーションエラー**:
- `INVALID_INPUT`: 無効な入力
- `DUPLICATE_PLAYER_NAME`: 同名プレイヤー重複
- `INVALID_PLAYER_TYPE`: 無効なプレイヤータイプID
- `INVALID_TAG_LEVEL`: 無効なタグレベル（1-10外）
- `INVALID_COLOR_FORMAT`: 無効な色コード形式

**リソースエラー**:
- `PLAYER_NOT_FOUND`: プレイヤーが見つからない
- `TAG_NOT_FOUND`: タグが見つからない
- `PLAYER_TYPE_NOT_FOUND`: プレイヤータイプが見つからない

🟡 **黄信号**: 一般的なエラーハンドリングパターンに基づく設計

## パフォーマンス最適化

### データベースクエリ最適化

**検索クエリ（NFR-102: 500ms応答）**:
```sql
-- インデックス活用による高速検索
SELECT * FROM v_player_list
WHERE name LIKE ?
ORDER BY name
LIMIT ? OFFSET ?;
```

**プレイヤー一覧取得（NFR-101: 1秒表示）**:
```sql
-- ビューを活用した効率的な一覧取得
SELECT * FROM v_player_list
ORDER BY updated_at DESC
LIMIT 50;
```

### メモリ効率化

- 大量データ処理時のストリーミング対応
- 必要最小限のデータ転送
- フロントエンドでの仮想化リスト対応

🔵 **青信号**: NFR-101, NFR-102パフォーマンス要件対応

## 将来拡張 API (Phase 2, 3)

### Phase 2: HTMLテンプレート

```rust
// create_player_template, get_player_templates
// apply_template_to_player
```

### Phase 2: 複合検索

```rust
#[derive(Deserialize)]
struct AdvancedSearchRequest {
    name_query: Option<String>,
    player_type_ids: Option<Vec<String>>,
    tag_filters: Option<Vec<TagFilter>>,
    date_range: Option<DateRange>,
}
```

### Phase 3: 統計機能

```rust
// get_player_statistics
// get_tag_history
```

🔵 **青信号**: 要件定義書Phase 2, 3要件に基づく将来拡張性