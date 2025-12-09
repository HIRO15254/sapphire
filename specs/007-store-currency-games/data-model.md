# Data Model: 通貨・ゲーム登録機能

**Feature Branch**: `007-store-currency-games`
**Created**: 2025-12-05
**Status**: Planning

## Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
│  (users)        │
└────────┬────────┘
         │
    ┌────┴────┬─────────────────┐
    │         │                 │
    ▼         ▼                 ▼
┌────────┐ ┌────────┐      ┌──────────┐
│Location│ │Currency│      │PokerSession│
│(店舗)  │ │(通貨)  │      │(セッション)│
└────┬───┘ └────┬───┘      └─────┬────┘
     │          │                │
     │          │                │
     ▼          ▼                │
   ┌─────────────────┐           │
   │      Game       │◄──────────┘
   │   (ゲーム)      │   gameId (nullable)
   └─────────────────┘
```

**リレーション**:
- User → Currency: 1対多 (ユーザーは複数の通貨を持つ)
- User → Location: 1対多 (既存)
- Location → Game: 1対多 (店舗は複数のゲームを持つ)
- Currency → Game: 1対多 (通貨は複数のゲームで使用される)
- Game → PokerSession: 1対多 (ゲームは複数のセッションを持つ、nullable)

## Tables

### currencies テーブル (新規)

通貨を管理するテーブル。ユーザーに直接紐付き、店舗とは独立して管理される。

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | IDENTITY | 主キー (自動採番) |
| userId | VARCHAR(255) | NO | - | ユーザーID (外部キー → users.id) |
| name | VARCHAR(100) | NO | - | 通貨名 (例: "GGポイント", "JOPTポイント") |
| createdAt | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | 更新日時 |

**インデックス**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX (userId, name)` - ユーザー内で通貨名は一意
- `INDEX (userId)` - ユーザーの通貨一覧取得用

**制約**:
- `FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE`
  - ユーザー削除時、その通貨も削除される

### games テーブル (新規)

店舗ごとのゲーム（NLHEリングゲーム）を管理するテーブル。

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | IDENTITY | 主キー (自動採番) |
| locationId | INTEGER | NO | - | 店舗ID (外部キー → locations.id) |
| currencyId | INTEGER | NO | - | 通貨ID (外部キー → currencies.id) |
| name | VARCHAR(100) | NO | - | ゲーム名 (例: "1/2 NL", "2/5 NL") |
| smallBlind | INTEGER | NO | - | スモールブラインド (正の整数) |
| bigBlind | INTEGER | NO | - | ビッグブラインド (正の整数、SB以上) |
| ante | INTEGER | YES | 0 | アンティ (0以上の整数、0=なし) |
| minBuyIn | INTEGER | NO | - | 最小バイイン (BB単位、正の整数) |
| maxBuyIn | INTEGER | NO | - | 最大バイイン (BB単位、minBuyIn以上) |
| rules | TEXT | YES | NULL | その他のルール (HTML形式) |
| isArchived | BOOLEAN | NO | false | アーカイブ状態 |
| createdAt | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | TIMESTAMP WITH TIME ZONE | NO | CURRENT_TIMESTAMP | 更新日時 |

**インデックス**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX (locationId, name)` - 同一店舗内でゲーム名は一意
- `INDEX (locationId)` - 店舗のゲーム一覧取得用
- `INDEX (currencyId)` - 通貨使用状況確認用
- `INDEX (locationId, isArchived)` - アクティブゲーム一覧取得用

**制約**:
- `FOREIGN KEY (locationId) REFERENCES locations(id) ON DELETE CASCADE`
  - 店舗削除時、そのゲームも削除される
- `FOREIGN KEY (currencyId) REFERENCES currencies(id) ON DELETE RESTRICT`
  - ゲームが使用中の通貨は削除できない
- `CHECK (smallBlind > 0)` - SBは正の整数
- `CHECK (bigBlind >= smallBlind)` - BB >= SB
- `CHECK (ante >= 0)` - Anteは0以上
- `CHECK (minBuyIn > 0)` - min buy-inは正の整数
- `CHECK (maxBuyIn >= minBuyIn)` - max >= min

### poker_sessions テーブル (変更)

既存テーブルに `gameId` カラムを追加。

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| ... | ... | ... | ... | (既存カラム) |
| **gameId** | INTEGER | **YES** | **NULL** | ゲームID (外部キー → games.id) **(新規追加)** |

**新規インデックス**:
- `INDEX (gameId)` - ゲーム別セッション集計用

**新規制約**:
- `FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE SET NULL`
  - ゲーム削除時、セッションのgameIdはNULLになる
  - ※ただし、アプリケーション層で使用中ゲームの削除を防止

## Drizzle Schema Definition

```typescript
// src/server/db/schema.ts への追加

// Currency table (通貨)
export const currencies = createTable(
  "currency",
  (d) => ({
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 100 }).notNull(),
    createdAt: d.timestamp({ mode: "date", withTimezone: true }).notNull().defaultNow(),
    updatedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("currency_user_id_idx").on(t.userId),
    uniqueIndex("currency_user_name_unique").on(t.userId, t.name),
  ]
);

export const currenciesRelations = relations(currencies, ({ one, many }) => ({
  user: one(users, {
    fields: [currencies.userId],
    references: [users.id],
  }),
  games: many(games),
}));

export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;

// Game table (ゲーム)
export const games = createTable(
  "game",
  (d) => ({
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    locationId: d
      .integer()
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    currencyId: d
      .integer()
      .notNull()
      .references(() => currencies.id, { onDelete: "restrict" }),
    name: d.varchar({ length: 100 }).notNull(),
    smallBlind: d.integer().notNull(),
    bigBlind: d.integer().notNull(),
    ante: d.integer().notNull().default(0),
    minBuyIn: d.integer().notNull(),
    maxBuyIn: d.integer().notNull(),
    rules: d.text(),
    isArchived: d.boolean().notNull().default(false),
    createdAt: d.timestamp({ mode: "date", withTimezone: true }).notNull().defaultNow(),
    updatedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("game_location_id_idx").on(t.locationId),
    index("game_currency_id_idx").on(t.currencyId),
    index("game_location_archived_idx").on(t.locationId, t.isArchived),
    uniqueIndex("game_location_name_unique").on(t.locationId, t.name),
  ]
);

export const gamesRelations = relations(games, ({ one, many }) => ({
  location: one(locations, {
    fields: [games.locationId],
    references: [locations.id],
  }),
  currency: one(currencies, {
    fields: [games.currencyId],
    references: [currencies.id],
  }),
  pokerSessions: many(pokerSessions),
}));

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
```

### poker_sessions テーブル変更

```typescript
// pokerSessions テーブル定義への追加
export const pokerSessions = createTable(
  "poker_session",
  (d) => ({
    // ... 既存カラム ...
    gameId: d
      .integer()
      .references(() => games.id, { onDelete: "set null" }),
    // ... 既存カラム ...
  }),
  (t) => [
    // ... 既存インデックス ...
    index("session_game_id_idx").on(t.gameId),
  ]
);

// pokerSessionsRelations への追加
export const pokerSessionsRelations = relations(pokerSessions, ({ one, many }) => ({
  // ... 既存リレーション ...
  game: one(games, {
    fields: [pokerSessions.gameId],
    references: [games.id],
  }),
}));
```

### users リレーション更新

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  pokerSessions: many(pokerSessions),
  locations: many(locations),
  tags: many(tags),
  currencies: many(currencies), // 追加
}));
```

### locations リレーション更新

```typescript
export const locationsRelations = relations(locations, ({ one, many }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
  pokerSessions: many(pokerSessions),
  games: many(games), // 追加
}));
```

## Migration Strategy

### Step 1: currencies テーブル作成

```sql
CREATE TABLE sapphire_currency (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id VARCHAR(255) NOT NULL REFERENCES sapphire_user(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX currency_user_id_idx ON sapphire_currency(user_id);
CREATE UNIQUE INDEX currency_user_name_unique ON sapphire_currency(user_id, name);
```

### Step 2: games テーブル作成

```sql
CREATE TABLE sapphire_game (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  location_id INTEGER NOT NULL REFERENCES sapphire_location(id) ON DELETE CASCADE,
  currency_id INTEGER NOT NULL REFERENCES sapphire_currency(id) ON DELETE RESTRICT,
  name VARCHAR(100) NOT NULL,
  small_blind INTEGER NOT NULL CHECK (small_blind > 0),
  big_blind INTEGER NOT NULL CHECK (big_blind >= small_blind),
  ante INTEGER NOT NULL DEFAULT 0 CHECK (ante >= 0),
  min_buy_in INTEGER NOT NULL CHECK (min_buy_in > 0),
  max_buy_in INTEGER NOT NULL CHECK (max_buy_in >= min_buy_in),
  rules TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX game_location_id_idx ON sapphire_game(location_id);
CREATE INDEX game_currency_id_idx ON sapphire_game(currency_id);
CREATE INDEX game_location_archived_idx ON sapphire_game(location_id, is_archived);
CREATE UNIQUE INDEX game_location_name_unique ON sapphire_game(location_id, name);
```

### Step 3: poker_sessions テーブル変更

```sql
ALTER TABLE sapphire_poker_session
ADD COLUMN game_id INTEGER REFERENCES sapphire_game(id) ON DELETE SET NULL;

CREATE INDEX session_game_id_idx ON sapphire_poker_session(game_id);
```

## Validation Rules (Zod)

```typescript
// 通貨バリデーション
export const currencySchema = z.object({
  name: z.string().min(1, "通貨名は必須です").max(100, "通貨名は100文字以内です"),
});

// ゲームバリデーション
export const gameSchema = z.object({
  locationId: z.number().int().positive("店舗を選択してください"),
  currencyId: z.number().int().positive("通貨を選択してください"),
  name: z.string().min(1, "ゲーム名は必須です").max(100, "ゲーム名は100文字以内です"),
  smallBlind: z.number().int().positive("SBは1以上の整数です"),
  bigBlind: z.number().int().positive("BBは1以上の整数です"),
  ante: z.number().int().min(0, "Anteは0以上の整数です").default(0),
  minBuyIn: z.number().int().positive("最小バイインは1以上の整数です"),
  maxBuyIn: z.number().int().positive("最大バイインは1以上の整数です"),
  rules: z.string().optional(),
}).refine(
  (data) => data.bigBlind >= data.smallBlind,
  { message: "BBはSB以上でなければなりません", path: ["bigBlind"] }
).refine(
  (data) => data.maxBuyIn >= data.minBuyIn,
  { message: "最大バイインは最小バイイン以上でなければなりません", path: ["maxBuyIn"] }
);
```

## Performance Considerations

### クエリパターンと対応インデックス

| クエリ | 使用インデックス |
|--------|-----------------|
| ユーザーの通貨一覧 | `currency_user_id_idx` |
| 店舗のゲーム一覧 | `game_location_id_idx` |
| 店舗のアクティブゲーム一覧 | `game_location_archived_idx` |
| 通貨使用状況確認 | `game_currency_id_idx` |
| ゲーム別セッション統計 | `session_game_id_idx` |

### 想定データ規模

- 100通貨 × 100店舗 × 50ゲーム = 5,000ゲーム (最大想定)
- インデックスにより全クエリでO(log n)の性能を維持
