# tRPC API Contract: Sessions Router

**Feature Branch**: `003-session-enhancements`
**Date**: 2025-10-26
**Spec**: [spec.md](../spec.md)
**Data Model**: [data-model.md](../data-model.md)

## Overview

本ドキュメントは、セッション記録機能の改善に伴うtRPC APIの契約を定義する。既存の`sessions` routerを拡張し、場所とタグの管理機能を追加する。

## Router: `sessions`

### 1. `sessions.create`

セッションを新規作成する。場所とタグの自動作成をサポート。

#### Input Schema (Zod)

```typescript
const createSessionSchema = z.object({
  date: z.date(),
  // 場所: 既存のIDまたは新規名のいずれか
  locationId: z.number().int().positive().optional(),
  newLocationName: z.string().min(1).max(255).trim().optional(),
  buyIn: z.number().positive(),
  cashOut: z.number().nonnegative(),
  durationMinutes: z.number().int().positive(),
  notes: z.string().max(50000).optional(),
  // タグ: 既存のIDsと新規名の配列
  existingTagIds: z.array(z.number().int().positive()).max(20).optional(),
  newTagNames: z.array(z.string().min(1).max(50).trim()).max(20).optional(),
}).refine(
  (data) => data.locationId !== undefined || data.newLocationName !== undefined,
  {
    message: "locationId または newLocationName のいずれかが必要です",
  }
);
```

#### Output Schema

```typescript
z.object({
  id: z.number().int().positive(),
  userId: z.string(),
  date: z.date(),
  locationId: z.number().int().positive(),
  location: z.object({
    id: z.number().int().positive(),
    name: z.string(),
  }),
  buyIn: z.string(), // NUMERIC型は文字列として返される
  cashOut: z.string(),
  profit: z.string(), // 計算フィールド
  durationMinutes: z.number().int(),
  notes: z.string().nullable(),
  tags: z.array(z.object({
    id: z.number().int().positive(),
    name: z.string(),
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

#### Behavior

1. `newLocationName`が指定された場合:
   - 既存の場所を検索（大文字小文字を区別しない）
   - 存在する場合: 既存のIDを使用
   - 存在しない場合: 新規作成

2. `newTagNames`が指定された場合:
   - 各タグについて既存を検索（大文字小文字を区別しない）
   - 存在する場合: 既存のIDを使用
   - 存在しない場合: 新規作成

3. `notes`が指定された場合:
   - DOMPurifyでHTMLサニタイズ
   - 保存

4. トランザクション内で実行:
   - 場所作成 → タグ作成 → セッション作成 → セッション-タグ関連作成

#### Error Responses

| Error Code | Condition | Message |
|------------|-----------|---------|
| BAD_REQUEST | locationId/newLocationNameが両方未指定 | "場所を指定してください" |
| BAD_REQUEST | タグ数が20を超える | "タグは最大20個まで設定できます" |
| BAD_REQUEST | notes が50,000文字を超える | "メモは50,000文字以内にしてください" |
| INTERNAL_SERVER_ERROR | データベースエラー | "セッションの作成に失敗しました" |

---

### 2. `sessions.update`

既存セッションを更新する。

#### Input Schema (Zod)

```typescript
const updateSessionSchema = z.object({
  id: z.number().int().positive(),
  date: z.date().optional(),
  locationId: z.number().int().positive().optional(),
  newLocationName: z.string().min(1).max(255).trim().optional(),
  buyIn: z.number().positive().optional(),
  cashOut: z.number().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(50000).optional().nullable(),
  existingTagIds: z.array(z.number().int().positive()).max(20).optional(),
  newTagNames: z.array(z.string().min(1).max(50).trim()).max(20).optional(),
});
```

#### Output Schema

`sessions.create`と同じ。

#### Behavior

1. セッションの所有者確認（`userId`が一致しない場合はエラー）
2. `newLocationName`が指定された場合: `sessions.create`と同様の処理
3. `newTagNames`が指定された場合: `sessions.create`と同様の処理
4. タグの更新:
   - 既存のセッション-タグ関連をすべて削除
   - 新しいタグ関連を作成
5. トランザクション内で実行

#### Error Responses

| Error Code | Condition | Message |
|------------|-----------|---------|
| NOT_FOUND | セッションが存在しない | "セッションが見つかりません" |
| FORBIDDEN | 他のユーザーのセッション | "このセッションを編集する権限がありません" |
| BAD_REQUEST | タグ数が20を超える | "タグは最大20個まで設定できます" |
| INTERNAL_SERVER_ERROR | データベースエラー | "セッションの更新に失敗しました" |

---

### 3. `sessions.getAll`

ユーザーのすべてのセッションを取得する（場所とタグを含む）。

#### Input Schema (Zod)

```typescript
const getAllSessionsSchema = z.object({
  // ページネーション（オプショナル）
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});
```

#### Output Schema

```typescript
z.object({
  sessions: z.array(/* sessions.createと同じセッションオブジェクト */),
  total: z.number().int().nonnegative(),
});
```

#### Behavior

1. ユーザーのセッションを日付降順で取得
2. 各セッションに場所とタグを含める（JOINまたはサブクエリ）
3. ページネーション適用

---

### 4. `sessions.getById`

特定のセッションを取得する（場所とタグを含む）。

#### Input Schema (Zod)

```typescript
const getByIdSchema = z.object({
  id: z.number().int().positive(),
});
```

#### Output Schema

`sessions.create`と同じセッションオブジェクト。

#### Behavior

1. セッションを取得
2. 所有者確認（`userId`が一致しない場合はエラー）
3. 場所とタグを含める

#### Error Responses

| Error Code | Condition | Message |
|------------|-----------|---------|
| NOT_FOUND | セッションが存在しない | "セッションが見つかりません" |
| FORBIDDEN | 他のユーザーのセッション | "このセッションを閲覧する権限がありません" |

---

### 5. `sessions.getFiltered`

フィルター条件に基づいてセッションを取得する（タグフィルタリング追加）。

#### Input Schema (Zod)

```typescript
const getFilteredSessionsSchema = z.object({
  // 日付範囲
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  // 場所フィルター
  locationIds: z.array(z.number().int().positive()).optional(),
  // タグフィルター（AND条件）
  tagIds: z.array(z.number().int().positive()).max(20).optional(),
  // ページネーション
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});
```

#### Output Schema

```typescript
z.object({
  sessions: z.array(/* sessions.createと同じセッションオブジェクト */),
  total: z.number().int().nonnegative(),
});
```

#### Behavior

1. フィルター条件を適用:
   - `startDate`, `endDate`: 日付範囲フィルタリング
   - `locationIds`: 場所フィルタリング（OR条件）
   - `tagIds`: タグフィルタリング（AND条件 - すべてのタグを持つセッションのみ）
2. ページネーション適用
3. 各セッションに場所とタグを含める

#### Tag Filtering Logic (AND Condition)

```sql
HAVING COUNT(DISTINCT session_tags.tag_id) = ${tagIds.length}
```

---

### 6. `sessions.delete`

セッションを削除する。

#### Input Schema (Zod)

```typescript
const deleteSessionSchema = z.object({
  id: z.number().int().positive(),
});
```

#### Output Schema

```typescript
z.object({
  success: z.boolean(),
});
```

#### Behavior

1. セッションの所有者確認
2. セッション削除（CASCADE により session_tags も自動削除）

#### Error Responses

| Error Code | Condition | Message |
|------------|-----------|---------|
| NOT_FOUND | セッションが存在しない | "セッションが見つかりません" |
| FORBIDDEN | 他のユーザーのセッション | "このセッションを削除する権限がありません" |

---

### 7. `sessions.getStats`

セッション統計を取得する（既存、変更なし）。

---

## Router: `locations` (新規)

### 1. `locations.getAll`

ユーザーのすべての場所を取得する（オートコンプリート用）。

#### Input Schema (Zod)

```typescript
const getAllLocationsSchema = z.object({
  search: z.string().optional(), // 部分一致検索
});
```

#### Output Schema

```typescript
z.array(z.object({
  id: z.number().int().positive(),
  name: z.string(),
  sessionCount: z.number().int().nonnegative(), // この場所でのセッション数
}));
```

#### Behavior

1. ユーザーの場所を取得
2. `search`が指定された場合: 名前で部分一致検索（ILIKE）
3. セッション数をカウント（LEFT JOIN）
4. 名前でソート

---

### 2. `locations.create`

新しい場所を作成する（内部使用またはUI用）。

#### Input Schema (Zod)

```typescript
const createLocationSchema = z.object({
  name: z.string().min(1).max(255).trim(),
});
```

#### Output Schema

```typescript
z.object({
  id: z.number().int().positive(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

#### Behavior

1. 名前の正規化（トリム、小文字化）
2. 重複チェック（大文字小文字を区別しない）
3. 存在する場合: 既存の場所を返す
4. 存在しない場合: 新規作成

#### Error Responses

| Error Code | Condition | Message |
|------------|-----------|---------|
| BAD_REQUEST | 名前が空または255文字超過 | "場所名は1〜255文字で入力してください" |

---

### 3. `locations.delete`

場所を削除する（FR-020に準拠）。

#### Input Schema (Zod)

```typescript
const deleteLocationSchema = z.object({
  id: z.number().int().positive(),
});
```

#### Output Schema

```typescript
z.object({
  success: z.boolean(),
  affectedSessions: z.number().int().nonnegative(), // 更新されたセッション数
});
```

#### Behavior

1. 場所の所有者確認（`userId`が一致しない場合はエラー）
2. 「削除された場所」のデフォルト場所を取得または作成
3. この場所を参照しているすべてのセッションの`location_id`をデフォルト場所のIDに更新
4. 場所を削除
5. 影響を受けたセッション数を返す

#### Error Responses

| Error Code | Condition | Message |
|------------|-----------|---------|
| NOT_FOUND | 場所が存在しない | "場所が見つかりません" |
| FORBIDDEN | 他のユーザーの場所 | "この場所を削除する権限がありません" |
| BAD_REQUEST | デフォルト場所の削除を試みた | "システムデフォルト場所は削除できません" |

---

## Router: `tags` (新規)

### 1. `tags.getAll`

ユーザーのすべてのタグを取得する（オートコンプリート用）。

#### Input Schema (Zod)

```typescript
const getAllTagsSchema = z.object({
  search: z.string().optional(), // 部分一致検索
});
```

#### Output Schema

```typescript
z.array(z.object({
  id: z.number().int().positive(),
  name: z.string(),
  sessionCount: z.number().int().nonnegative(), // このタグが付いたセッション数
}));
```

#### Behavior

1. ユーザーのタグを取得
2. `search`が指定された場合: 名前で部分一致検索（ILIKE）
3. セッション数をカウント（LEFT JOIN session_tags）
4. 名前でソート

---

### 2. `tags.create`

新しいタグを作成する（内部使用またはUI用）。

#### Input Schema (Zod)

```typescript
const createTagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
});
```

#### Output Schema

```typescript
z.object({
  id: z.number().int().positive(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

#### Behavior

1. 名前の正規化（トリム、小文字化）
2. 重複チェック（大文字小文字を区別しない）
3. 存在する場合: 既存のタグを返す
4. 存在しない場合: 新規作成

#### Error Responses

| Error Code | Condition | Message |
|------------|-----------|---------|
| BAD_REQUEST | 名前が空または50文字超過 | "タグ名は1〜50文字で入力してください" |

---

### 3. `tags.delete`

タグを削除する（FR-021に準拠）。

#### Input Schema (Zod)

```typescript
const deleteTagSchema = z.object({
  id: z.number().int().positive(),
});
```

#### Output Schema

```typescript
z.object({
  success: z.boolean(),
  affectedSessions: z.number().int().nonnegative(), // 関連付けが削除されたセッション数
});
```

#### Behavior

1. タグの所有者確認（`userId`が一致しない場合はエラー）
2. このタグを参照しているすべての`session_tags`エントリを削除（ON DELETE CASCADEにより自動）
3. タグを削除
4. 影響を受けたセッション数を返す

#### Error Responses

| Error Code | Condition | Message |
|------------|-----------|---------|
| NOT_FOUND | タグが存在しない | "タグが見つかりません" |
| FORBIDDEN | 他のユーザーのタグ | "このタグを削除する権限がありません" |

---

## Common Response Types

### Session Object

すべてのセッション取得エンドポイントで共通のレスポンス形式:

```typescript
{
  id: number;
  userId: string;
  date: Date;
  locationId: number;
  location: {
    id: number;
    name: string;
  };
  buyIn: string; // "1000.00" 形式
  cashOut: string; // "1500.00" 形式
  profit: string; // "500.00" 形式（計算フィールド）
  durationMinutes: number;
  notes: string | null; // HTML文字列
  tags: Array<{
    id: number;
    name: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## HTML Sanitization

### Backend Sanitization

すべての`notes`フィールドは保存前にDOMPurifyでサニタイズされる。

#### 許可タグ

```typescript
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'code', 'pre', 'blockquote'
];
```

#### 許可属性

```typescript
const ALLOWED_ATTR = {
  'a': ['href', 'rel', 'target']
};
```

#### Sanitization Function

```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

function sanitizeHtml(html: string | null | undefined): string | null {
  if (!html) return null;

  return purify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
```

---

## Performance Considerations

### Query Optimization

1. **N+1問題の回避**: セッション一覧取得時にタグをJOINまたは`json_agg`で集約
2. **インデックス活用**: 場所、タグ、日付でのフィルタリングにインデックスを使用
3. **ページネーション**: デフォルト50件、最大100件

### Caching Strategy

- TanStack Queryのキャッシュを活用
- `sessions.getAll`, `locations.getAll`, `tags.getAll`は5分間キャッシュ
- セッション作成/更新/削除時にキャッシュを無効化

---

## Example Usage (Client-side)

### セッション作成

```typescript
const { mutate: createSession } = api.sessions.create.useMutation({
  onSuccess: () => {
    void ctx.sessions.getAll.invalidate();
    void ctx.sessions.getStats.invalidate();
  },
});

createSession({
  date: new Date(),
  newLocationName: "Casino Tokyo",
  buyIn: 10000,
  cashOut: 15000,
  durationMinutes: 180,
  notes: "<p>Good session!</p>",
  newTagNames: ["Tournament", "Good Run"],
});
```

### タグフィルタリング

```typescript
const { data } = api.sessions.getFiltered.useQuery({
  tagIds: [1, 2, 3], // AND条件: すべてのタグを持つセッションのみ
  limit: 50,
  offset: 0,
});
```

### オートコンプリート

```typescript
const { data: locations } = api.locations.getAll.useQuery({
  search: "Casino",
});

const { data: tags } = api.tags.getAll.useQuery({
  search: "Tour",
});
```

---

**Version**: 1.0
**Last Updated**: 2025-10-26
