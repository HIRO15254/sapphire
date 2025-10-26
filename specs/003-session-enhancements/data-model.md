# Data Model: ポーカーセッション記録機能の改善

**Feature Branch**: `003-session-enhancements`
**Date**: 2025-10-26
**Spec**: [spec.md](./spec.md)
**Research**: [research.md](./research.md)

## Overview

本ドキュメントは、セッション記録機能の改善に必要なデータモデルの変更を定義する。既存の`poker_sessions`テーブルを拡張し、新たに`locations`、`tags`、`session_tags`テーブルを追加する。

## Entity Relationship Diagram

```
┌─────────────┐
│   users     │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴────────────┐
│ poker_sessions    │
└───────┬───────────┘
        │ N
        │
        │ 1
┌───────┴──────┐
│  locations   │
└──────────────┘

┌─────────────┐
│   users     │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴────────────┐
│ poker_sessions    │
└───────┬───────────┘
        │ N
        │
        │ N (via session_tags)
┌───────┴──────┐
│     tags     │
└──────────────┘
```

## Table Definitions

### 1. locations (新規テーブル)

**Purpose**: ポーカーをプレイする場所を管理する。ユーザーごとに場所を正規化し、重複を防止する。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | 場所の一意識別子 |
| user_id | VARCHAR(255) | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | 場所を所有するユーザー |
| name | VARCHAR(255) | NOT NULL | 場所名 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 更新日時 |

**Indexes**:
- `PRIMARY KEY (id)` - 主キーインデックス
- `UNIQUE (user_id, LOWER(name))` - ユーザーごとに大文字小文字を区別しない一意制約
- `INDEX (user_id)` - ユーザーごとの場所取得を高速化

**Validation Rules**:
- `name`: 1〜255文字、トリム済み
- 大文字小文字を区別しない一意性（例: "Casino A"と"casino a"は同一とみなす）

**Drizzle Schema**:
```typescript
export const locations = createTable(
  "location",
  (d) => ({
    id: d.serial().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 255 }).notNull(),
    createdAt: d.timestamp({ mode: "date", withTimezone: true }).notNull().defaultNow(),
    updatedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("location_user_id_idx").on(t.userId),
    // Case-insensitive unique constraint
    index("location_user_name_unique_idx").on(t.userId, sql`LOWER(${t.name})`).unique(),
  ]
);

export const locationsRelations = relations(locations, ({ one, many }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
  pokerSessions: many(pokerSessions),
}));

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
```

---

### 2. tags (新規テーブル)

**Purpose**: セッションを分類するためのタグを管理する。ユーザーごとにタグを正規化し、重複を防止する。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | タグの一意識別子 |
| user_id | VARCHAR(255) | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | タグを所有するユーザー |
| name | VARCHAR(50) | NOT NULL | タグ名 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 更新日時 |

**Indexes**:
- `PRIMARY KEY (id)` - 主キーインデックス
- `UNIQUE (user_id, LOWER(name))` - ユーザーごとに大文字小文字を区別しない一意制約
- `INDEX (user_id)` - ユーザーごとのタグ取得を高速化

**Validation Rules**:
- `name`: 1〜50文字、トリム済み
- 大文字小文字を区別しない一意性（例: "Tournament"と"tournament"は同一とみなす）

**Drizzle Schema**:
```typescript
export const tags = createTable(
  "tag",
  (d) => ({
    id: d.serial().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 50 }).notNull(),
    createdAt: d.timestamp({ mode: "date", withTimezone: true }).notNull().defaultNow(),
    updatedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("tag_user_id_idx").on(t.userId),
    // Case-insensitive unique constraint
    index("tag_user_name_unique_idx").on(t.userId, sql`LOWER(${t.name})`).unique(),
  ]
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  sessionTags: many(sessionTags),
}));

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
```

---

### 3. session_tags (新規中間テーブル)

**Purpose**: セッションとタグの多対多関係を管理する。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| session_id | INTEGER | NOT NULL, FOREIGN KEY → poker_sessions(id) ON DELETE CASCADE | セッションID |
| tag_id | INTEGER | NOT NULL, FOREIGN KEY → tags(id) ON DELETE CASCADE | タグID |

**Indexes**:
- `PRIMARY KEY (session_id, tag_id)` - 複合主キー
- `INDEX (tag_id)` - タグからセッション検索を高速化

**Validation Rules**:
- `session_id`と`tag_id`の組み合わせは一意（重複したタグ付けを防止）

**Drizzle Schema**:
```typescript
export const sessionTags = createTable(
  "session_tag",
  (d) => ({
    sessionId: d
      .integer()
      .notNull()
      .references(() => pokerSessions.id, { onDelete: "cascade" }),
    tagId: d
      .integer()
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  }),
  (t) => [
    primaryKey({ columns: [t.sessionId, t.tagId] }),
    index("session_tag_tag_id_idx").on(t.tagId),
  ]
);

export const sessionTagsRelations = relations(sessionTags, ({ one }) => ({
  session: one(pokerSessions, {
    fields: [sessionTags.sessionId],
    references: [pokerSessions.id],
  }),
  tag: one(tags, {
    fields: [sessionTags.tagId],
    references: [tags.id],
  }),
}));
```

---

### 4. poker_sessions (既存テーブル - 変更)

**Purpose**: ポーカーセッションの記録。場所への参照とHTML形式のメモをサポートするよう拡張する。

#### 変更点:

| 変更 | Before | After | 理由 |
|------|--------|-------|------|
| location | VARCHAR(255) NOT NULL | INTEGER FOREIGN KEY → locations(id) | 場所を正規化し、重複を防止 |
| notes | TEXT (プレーンテキスト) | TEXT (HTML文字列) | リッチテキスト対応 |

#### 更新後のテーブル定義:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | セッションID |
| user_id | VARCHAR(255) | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | セッションを所有するユーザー |
| date | TIMESTAMP WITH TIME ZONE | NOT NULL | セッション開始日時 |
| location_id | INTEGER | NOT NULL, FOREIGN KEY → locations(id) | 場所への参照 |
| buy_in | NUMERIC(10,2) | NOT NULL | バイイン額 |
| cash_out | NUMERIC(10,2) | NOT NULL | キャッシュアウト額 |
| duration_minutes | INTEGER | NOT NULL | プレイ時間（分） |
| notes | TEXT | NULL | メモ（HTML形式） |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 更新日時 |

**Indexes**:
- `PRIMARY KEY (id)` - 主キーインデックス
- `INDEX (user_id, date DESC)` - ユーザーごとの日付降順検索
- `INDEX (user_id, location_id)` - ユーザーと場所での検索
- `INDEX (user_id, date, location_id)` - 複合条件検索

**Computed Fields**:
- `profit = cash_out - buy_in` (計算フィールド、DBには保存しない)

**Validation Rules**:
- `location_id`: locations.idへの有効な参照
- `notes`: 最大50,000文字、HTML形式、サニタイズ済み

**Drizzle Schema (変更後)**:
```typescript
export const pokerSessions = createTable(
  "poker_session",
  (d) => ({
    id: d.serial().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
    locationId: d  // 変更: location → locationId
      .integer()
      .notNull()
      .references(() => locations.id),
    buyIn: d.numeric({ precision: 10, scale: 2 }).notNull(),
    cashOut: d.numeric({ precision: 10, scale: 2 }).notNull(),
    durationMinutes: d.integer().notNull(),
    notes: d.text(),  // HTML文字列を保存
    createdAt: d.timestamp({ mode: "date", withTimezone: true }).notNull().defaultNow(),
    updatedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("session_user_date_idx").on(t.userId, t.date.desc()),
    index("session_user_location_idx").on(t.userId, t.locationId),
    index("session_user_date_location_idx").on(t.userId, t.date, t.locationId),
  ]
);

export const pokerSessionsRelations = relations(pokerSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [pokerSessions.userId],
    references: [users.id],
  }),
  location: one(locations, {  // 新規リレーション
    fields: [pokerSessions.locationId],
    references: [locations.id],
  }),
  sessionTags: many(sessionTags),  // 新規リレーション
}));

export type PokerSession = typeof pokerSessions.$inferSelect;
export type NewPokerSession = typeof pokerSessions.$inferInsert;
```

---

## Migration Strategy

### Phase 1: 新規テーブルの作成

```sql
-- 1. locationsテーブル作成
CREATE TABLE sapphire_location (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES sapphire_user(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX location_user_id_idx ON sapphire_location(user_id);
CREATE UNIQUE INDEX location_user_name_unique_idx ON sapphire_location(user_id, LOWER(name));

-- 2. tagsテーブル作成
CREATE TABLE sapphire_tag (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES sapphire_user(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX tag_user_id_idx ON sapphire_tag(user_id);
CREATE UNIQUE INDEX tag_user_name_unique_idx ON sapphire_tag(user_id, LOWER(name));

-- 3. session_tagsテーブル作成
CREATE TABLE sapphire_session_tag (
  session_id INTEGER NOT NULL REFERENCES sapphire_poker_session(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES sapphire_tag(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, tag_id)
);

CREATE INDEX session_tag_tag_id_idx ON sapphire_session_tag(tag_id);
```

### Phase 2: 既存データの移行

```sql
-- 既存のlocation文字列からlocationsテーブルにデータを移行
INSERT INTO sapphire_location (user_id, name, created_at, updated_at)
SELECT DISTINCT user_id, location, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM sapphire_poker_session;

-- location_idカラムを追加（NULL許可）
ALTER TABLE sapphire_poker_session ADD COLUMN location_id INTEGER;

-- 既存のlocationをlocation_idに変換
UPDATE sapphire_poker_session ps
SET location_id = l.id
FROM sapphire_location l
WHERE ps.user_id = l.user_id AND ps.location = l.name;

-- location_idにNOT NULL制約と外部キー制約を追加
ALTER TABLE sapphire_poker_session ALTER COLUMN location_id SET NOT NULL;
ALTER TABLE sapphire_poker_session ADD CONSTRAINT fk_location FOREIGN KEY (location_id) REFERENCES sapphire_location(id);

-- 古いlocationカラムを削除
ALTER TABLE sapphire_poker_session DROP COLUMN location;
```

### Phase 3: インデックスの再構築

```sql
-- location関連インデックスを更新
DROP INDEX IF EXISTS session_user_location_idx;
DROP INDEX IF EXISTS session_user_date_location_idx;

CREATE INDEX session_user_location_idx ON sapphire_poker_session(user_id, location_id);
CREATE INDEX session_user_date_location_idx ON sapphire_poker_session(user_id, date, location_id);
```

### Rollback Plan

```sql
-- location_idからlocation文字列に戻す
ALTER TABLE sapphire_poker_session ADD COLUMN location VARCHAR(255);

UPDATE sapphire_poker_session ps
SET location = l.name
FROM sapphire_location l
WHERE ps.location_id = l.id;

ALTER TABLE sapphire_poker_session ALTER COLUMN location SET NOT NULL;
ALTER TABLE sapphire_poker_session DROP CONSTRAINT fk_location;
ALTER TABLE sapphire_poker_session DROP COLUMN location_id;

-- 新規テーブルを削除
DROP TABLE sapphire_session_tag;
DROP TABLE sapphire_tag;
DROP TABLE sapphire_location;
```

---

## Query Patterns

### 1. セッション一覧取得（場所とタグを含む）

```typescript
const sessions = await db
  .select({
    session: pokerSessions,
    location: locations,
    tags: sql<Tag[]>`COALESCE(
      json_agg(
        json_build_object('id', ${tags.id}, 'name', ${tags.name})
      ) FILTER (WHERE ${tags.id} IS NOT NULL),
      '[]'
    )`,
  })
  .from(pokerSessions)
  .leftJoin(locations, eq(pokerSessions.locationId, locations.id))
  .leftJoin(sessionTags, eq(pokerSessions.id, sessionTags.sessionId))
  .leftJoin(tags, eq(sessionTags.tagId, tags.id))
  .where(eq(pokerSessions.userId, userId))
  .groupBy(pokerSessions.id, locations.id)
  .orderBy(desc(pokerSessions.date));
```

### 2. タグでフィルタリング（AND条件）

```typescript
// 選択されたタグIDsをすべて持つセッションのみ取得
const sessions = await db
  .select({ session: pokerSessions })
  .from(pokerSessions)
  .innerJoin(sessionTags, eq(pokerSessions.id, sessionTags.sessionId))
  .where(
    and(
      eq(pokerSessions.userId, userId),
      inArray(sessionTags.tagId, selectedTagIds)
    )
  )
  .groupBy(pokerSessions.id)
  .having(sql`COUNT(DISTINCT ${sessionTags.tagId}) = ${selectedTagIds.length}`);
```

### 3. 場所の取得（オートコンプリート用）

```typescript
const locations = await db
  .select()
  .from(locations)
  .where(
    and(
      eq(locations.userId, userId),
      ilike(locations.name, `%${searchTerm}%`)
    )
  )
  .orderBy(locations.name);
```

### 4. タグの取得（オートコンプリート用）

```typescript
const tags = await db
  .select()
  .from(tags)
  .where(
    and(
      eq(tags.userId, userId),
      ilike(tags.name, `%${searchTerm}%`)
    )
  )
  .orderBy(tags.name);
```

### 5. セッション作成（トランザクション）

```typescript
await db.transaction(async (tx) => {
  // 1. 新規場所を作成（存在しない場合）
  let locationId = input.locationId;
  if (input.newLocationName) {
    const [location] = await tx
      .insert(locations)
      .values({
        userId,
        name: input.newLocationName.trim(),
      })
      .onConflictDoUpdate({
        target: [locations.userId, sql`LOWER(${locations.name})`],
        set: { updatedAt: new Date() },
      })
      .returning();
    locationId = location.id;
  }

  // 2. 新規タグを作成（存在しない場合）
  const tagIds = [];
  for (const tagName of input.newTagNames || []) {
    const [tag] = await tx
      .insert(tags)
      .values({
        userId,
        name: tagName.trim(),
      })
      .onConflictDoUpdate({
        target: [tags.userId, sql`LOWER(${tags.name})`],
        set: { updatedAt: new Date() },
      })
      .returning();
    tagIds.push(tag.id);
  }

  // 3. セッションを作成
  const [session] = await tx
    .insert(pokerSessions)
    .values({
      userId,
      date: input.date,
      locationId,
      buyIn: input.buyIn,
      cashOut: input.cashOut,
      durationMinutes: input.durationMinutes,
      notes: sanitizeHtml(input.notes),
    })
    .returning();

  // 4. セッション-タグ関連を作成
  if (tagIds.length > 0 || input.existingTagIds?.length > 0) {
    const allTagIds = [...tagIds, ...(input.existingTagIds || [])];
    await tx.insert(sessionTags).values(
      allTagIds.map((tagId) => ({
        sessionId: session.id,
        tagId,
      }))
    );
  }

  return session;
});
```

---

## Performance Considerations

### Index Strategy

| Table | Index | Purpose | Estimated Impact |
|-------|-------|---------|------------------|
| locations | (user_id, LOWER(name)) | 一意性チェック、検索 | O(log n) |
| tags | (user_id, LOWER(name)) | 一意性チェック、検索 | O(log n) |
| session_tags | (session_id, tag_id) | 主キー、セッション→タグ | O(1) |
| session_tags | (tag_id) | タグ→セッション検索 | O(log n) |
| poker_sessions | (user_id, location_id) | 場所フィルタリング | O(log n) |

### Query Optimization

- **タグフィルタリング**: `HAVING COUNT(DISTINCT tag_id) = N`でAND条件を効率的に実装
- **オートコンプリート**: `ILIKE`はインデックスを使えないが、データ量が少ない（10〜500件）ため問題なし
- **セッション一覧**: `json_agg`でタグを集約し、N+1問題を回避

### Expected Data Volume

| Entity | Estimated Count (per user) | Total System |
|--------|---------------------------|--------------|
| Sessions | 100〜1000 | 100k〜1M |
| Locations | 10〜50 | 10k〜50k |
| Tags | 10〜100 | 10k〜100k |
| Session-Tags | 300〜5000 | 300k〜5M |

すべてのクエリは100ms以内に完了すると予想される。

---

## Data Integrity

### Referential Integrity

- **ON DELETE CASCADE**: ユーザー削除時に関連データをすべて削除
- **Foreign Key Constraints**: locations、tagsへの参照の整合性を保証

### Deletion Behavior (FR-020, FR-021)

**場所の削除**:
- 場所を削除する場合、その場所を参照しているセッションは削除されない
- 代わりに、セッションの`location_id`を特別なデフォルト場所（「削除された場所」）のIDに更新する
- このデフォルト場所はシステムで事前に作成され、削除できないように保護される
- セッションのデータ整合性とhistorical recordは保持される

**タグの削除**:
- タグを削除する場合、そのタグとセッションの関連付け（`session_tags`エントリ）を削除する
- セッション自体は影響を受けず、他のタグとの関連は維持される
- ON DELETE CASCADEを`session_tags.tag_id`外部キーに設定し、自動的に関連付けを削除

### Data Validation

- **バックエンド**: Zodスキーマでバリデーション
- **データベース**: NOT NULL、UNIQUE、CHECK制約
- **アプリケーション**: トリム、大文字小文字正規化

### HTML Sanitization

- **保存前**: DOMPurifyでサニタイズ（バックエンド）
- **表示前**: DOMPurifyでサニタイズ（フロントエンド、二重防御）

---

**Version**: 1.0
**Last Updated**: 2025-10-26
