# Data Model: Poker Session Tracker

**Feature**: 002-poker-session-tracker
**Date**: 2025-10-21
**Status**: Design Complete

## Overview

This document defines the database schema and entity relationships for the poker session tracking application. The data model supports multi-user session tracking with complete data isolation, OAuth2 authentication, and performance-optimized queries.

## Entity Relationship Diagram

```
┌─────────────────────┐
│       User          │
│  (NextAuth.js)      │
├─────────────────────┤
│ id (UUID) PK        │
│ email               │
│ name                │
│ image               │
│ emailVerified       │
└──────────┬──────────┘
           │
           │ 1:N (CASCADE DELETE)
           │
           ▼
┌─────────────────────┐
│   PokerSession      │
├─────────────────────┤
│ id (SERIAL) PK      │
│ userId (UUID) FK    │◄─── references User.id
│ date                │
│ location            │
│ buyIn               │
│ cashOut             │
│ durationMinutes     │
│ notes               │
│ createdAt           │
│ updatedAt           │
└─────────────────────┘
     │
     │ Computed Field:
     └─► profit = cashOut - buyIn
```

## Entities

### 1. User (Existing - NextAuth.js Schema)

**Purpose**: Represents a registered user account authenticated via OAuth2 providers (Google, GitHub, Discord).

**Table Name**: `user`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier (auto-generated) |
| email | VARCHAR(255) | UNIQUE | User's email address from OAuth provider |
| name | VARCHAR(255) | NULLABLE | Display name from OAuth provider |
| image | TEXT | NULLABLE | Profile picture URL from OAuth provider |
| emailVerified | TIMESTAMP WITH TIME ZONE | NULLABLE | Email verification timestamp |

**Relationships**:
- **1:N with PokerSession**: One user can have many poker sessions
- **1:N with Account**: OAuth provider accounts (managed by NextAuth.js)
- **1:N with Session**: Authentication sessions (managed by NextAuth.js)

**Notes**:
- This table is managed by NextAuth.js Drizzle adapter
- No manual schema changes required for this feature

---

### 2. PokerSession (New)

**Purpose**: Represents a single poker playing session with financial and temporal details. Each session belongs to exactly one user.

**Table Name**: `poker_session`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique session identifier (auto-incrementing) |
| userId | UUID | NOT NULL, FOREIGN KEY → user.id (CASCADE DELETE) | Owner of this session |
| date | TIMESTAMP WITH TIME ZONE | NOT NULL | When the session occurred (user's local time converted to UTC) |
| location | VARCHAR(255) | NOT NULL | Venue name (e.g., "ポーカースタジアム渋谷") |
| buyIn | NUMERIC(10,2) | NOT NULL | Amount brought to the table (exact decimal, e.g., 10000.00) |
| cashOut | NUMERIC(10,2) | NOT NULL | Amount left the table with (exact decimal, e.g., 15000.00) |
| durationMinutes | INTEGER | NOT NULL | Session length in minutes (e.g., 180 for 3 hours) |
| notes | TEXT | NULLABLE | Optional user notes (memorable hands, table dynamics, lessons learned) |
| createdAt | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updatedAt | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Record last update timestamp (updated on edit) |

**Computed Fields** (Not Stored):
- `profit`: NUMERIC(10,2) = `cashOut - buyIn` (calculated in application layer)

**Indexes**:

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| session_user_date_idx | (userId, date DESC) | B-tree | Optimize session history queries (most recent first) |
| session_user_location_idx | (userId, location) | B-tree | Optimize location-based filtering and stats aggregation |
| session_user_date_location_idx | (userId, date, location) | B-tree | Optimize combined date+location filters |

**Relationships**:
- **N:1 with User**: Each session belongs to exactly one user
  - Foreign key: `userId` → `user.id`
  - Cascade delete: When user deleted, all their sessions deleted automatically

**Validation Rules** (Enforced at Application Layer):

| Field | Validation |
|-------|----------|
| buyIn | Must be >= 0 (non-negative) |
| cashOut | Must be >= 0 (non-negative) |
| durationMinutes | Must be > 0 (positive integer) |
| date | Cannot be in the future (checked at creation) |
| location | Must be non-empty string after trimming whitespace |
| notes | Optional, max length 10,000 characters (reasonable limit for UI) |

**Data Examples**:

```sql
-- Winning session
INSERT INTO poker_session (user_id, date, location, buy_in, cash_out, duration_minutes, notes)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '2025-10-20 18:00:00+09',
  'ポーカースタジアム渋谷',
  10000.00,
  15000.00,
  180,
  'アグレッシブなプレイヤーが多く、タイトなイメージで利益を得た'
);

-- Losing session
INSERT INTO poker_session (user_id, date, location, buy_in, cash_out, duration_minutes)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '2025-10-21 19:30:00+09',
  'アキバポーカー',
  20000.00,
  12000.00,
  240,
  NULL  -- No notes
);
```

---

## Drizzle ORM Schema Definition

**File**: `src/server/db/schema.ts`

```typescript
import { sql } from "drizzle-orm";
import { index, serial, text, timestamp, uuid, varchar, numeric, integer } from "drizzle-orm/pg-core";
import { createTable } from "@/server/db/schema"; // Existing helper

export const sessions = createTable(
  "poker_session",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date", withTimezone: true }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    buyIn: numeric("buy_in", { precision: 10, scale: 2 }).notNull(),
    cashOut: numeric("cash_out", { precision: 10, scale: 2 }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("session_user_date_idx").on(t.userId, t.date.desc()),
    index("session_user_location_idx").on(t.userId, t.location),
    index("session_user_date_location_idx").on(t.userId, t.date, t.location),
  ]
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
```

---

## TypeScript Types

**Inferred from Drizzle Schema**:

```typescript
// Database row type (raw from DB)
type PokerSession = typeof sessions.$inferSelect;

// Insert type (what you pass to .insert())
type NewPokerSession = typeof sessions.$inferInsert;

// Application domain type (with computed fields)
interface PokerSessionWithProfit extends PokerSession {
  profit: number; // Computed: cashOut - buyIn
}
```

**Example Usage**:

```typescript
// Creating a new session
const newSession: NewPokerSession = {
  userId: "550e8400-e29b-41d4-a716-446655440000",
  date: new Date("2025-10-21T18:00:00+09:00"),
  location: "ポーカースタジアム渋谷",
  buyIn: "10000.00",
  cashOut: "15000.00",
  durationMinutes: 180,
  notes: "良いセッションだった",
};

// Querying with computed profit
const session: PokerSessionWithProfit = {
  ...dbSession,
  profit: parseFloat(dbSession.cashOut) - parseFloat(dbSession.buyIn),
};
```

---

## Database Migration

**Command**:
```bash
bun run db:push        # Production database
bun run db:push:test   # Test database
```

**Generated SQL** (approximate):

```sql
CREATE TABLE poker_session (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255) NOT NULL,
  buy_in NUMERIC(10,2) NOT NULL,
  cash_out NUMERIC(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX session_user_date_idx ON poker_session (user_id, date DESC);
CREATE INDEX session_user_location_idx ON poker_session (user_id, location);
CREATE INDEX session_user_date_location_idx ON poker_session (user_id, date, location);
```

---

## Query Performance Expectations

**Assumptions**: 1,000 sessions per user, 100 concurrent users

| Query Type | Index Used | Expected Performance |
|------------|------------|---------------------|
| Get all sessions for user (ordered by date) | `session_user_date_idx` | <10ms (index scan) |
| Filter by location | `session_user_location_idx` | <20ms (index scan + filter) |
| Filter by date range | `session_user_date_idx` | <15ms (index range scan) |
| Filter by date + location | `session_user_date_location_idx` | <25ms (composite index scan) |
| Statistics aggregation (SUM, AVG, COUNT) | `session_user_date_idx` | <50ms (index scan + aggregation) |

**Optimization Notes**:
- All indexes include `userId` as first column (query isolation by user)
- Composite indexes support prefix queries (e.g., `(userId, date, location)` can optimize `(userId, date)`)
- `DESC` in date index supports `ORDER BY date DESC` without extra sort step

---

## Data Integrity Guarantees

1. **Referential Integrity**: `ON DELETE CASCADE` ensures orphaned sessions cannot exist
2. **Exact Decimal Arithmetic**: `NUMERIC(10,2)` prevents floating-point errors in profit calculations
3. **Timezone Awareness**: `TIMESTAMP WITH TIME ZONE` stores absolute time (immune to timezone changes)
4. **Non-Null Constraints**: Required fields (`userId`, `date`, `location`, `buyIn`, `cashOut`, `durationMinutes`) enforced at database level
5. **Application-Level Validation**: Additional business rules (e.g., non-negative amounts) enforced via Zod schemas in tRPC

---

## Future Considerations (Out of Scope for V1)

- **Session tags/categories**: e.g., "tournament" vs "cash game" (requires new column + index)
- **Multi-currency support**: Store currency code alongside amounts (requires schema change)
- **Session splits**: Record multiple buy-ins/cash-outs within one session (requires separate table)
- **Hand history integration**: Link to poker hand tracking tools (requires new table + relationships)
- **Soft deletes**: Add `deletedAt` column instead of hard deletes (requires query updates)

These enhancements would require schema migrations and are deferred to maintain V1 simplicity.
