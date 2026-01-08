# Data Model: Live Poker Session Tracker

**Date**: 2025-12-12 (Updated: 2025-12-30)
**Feature Branch**: `001-poker-session-tracker`

This document defines the database schema for the poker session tracker application using Drizzle ORM with PostgreSQL.

---

## Entity Relationship Diagram

```
┌─────────────┐
│    User     │
└─────┬───────┘
      │ 1:N
      ├──────────────────┬──────────────────┬──────────────────┬──────────────────┐
      ▼                  ▼                  ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Currency   │    │    Store    │    │   Session   │    │   Player    │    │ ReviewFlag  │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘    └─────────────┘    └─────────────┘
      │ 1:N              │ 1:N              │ 1:N                                   │
      ├────────┐         ├────────┐         ├────────┐                             │
      ▼        ▼         ▼        ▼         ▼        ▼                             │
┌──────────┐ ┌──────────┐┌──────────┐ ┌──────────┐┌──────────┐ ┌──────────┐         │
│  Bonus   │ │ Purchase ││ CashGame │ │Tournament││ AllIn    │ │ Session  │         │
└──────────┘ └──────────┘└──────────┘ └────┬─────┘│ Record   │ │  Event   │         │
                                           │      └──────────┘ └──────────┘         │
                                           │ 1:N                                    │
                                     ┌─────┴─────┐                                  │
                                     ▼           ▼                                  │
                               ┌──────────┐ ┌──────────┐                            │
                               │PrizeLevel│ │BlindLevel│                            │
                               └──────────┘ └──────────┘                            │
                                                                                    │
┌──────────────────────────────────────────────────────────────────────────────────┐│
│                                     Hand                                          ││
├───────────────────────────────────────────────────────────────────────────────────┤│
│ handHistoryRaw (PHH format only)                                                  ││
└─────┬────────────┬────────────────────────────────────────────────────────────────┘│
      │ 1:N        │ N:M                                                             │
      ▼            ▼                                                                 │
┌──────────┐  ┌──────────┐                                                           │
│ HandSeat │  │FlagAssign│◄──────────────────────────────────────────────────────────┘
└──────────┘  └──────────┘
      │
      │ N:1
      ▼
┌──────────┐
│  Player  │
└──────────┘
```

---

## Base Patterns

### Timestamps Mixin
All entities include these timestamp columns:

```typescript
// Applied to all tables
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
deletedAt: timestamp('deleted_at', { withTimezone: true }), // Soft delete
```

### User Isolation
All user-owned entities include:

```typescript
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
```

---

## Entity Definitions

### 1. User (Authentication)

Managed by NextAuth.js. Extended with `passwordHash` for credentials provider.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| name | varchar(255) | nullable | Display name |
| email | varchar(255) | NOT NULL, unique | Email address |
| emailVerified | timestamptz | nullable | Email verification timestamp |
| image | varchar(255) | nullable | Avatar URL |
| passwordHash | varchar(255) | nullable | bcrypt hash for credentials auth |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |

**Indexes**: `email` (unique)

---

### 2. Account (OAuth - NextAuth)

Links OAuth providers to users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| userId | uuid | FK → users.id, cascade | Owner user |
| type | varchar(255) | NOT NULL | Account type |
| provider | varchar(255) | NOT NULL | OAuth provider name |
| providerAccountId | varchar(255) | NOT NULL | Provider's user ID |
| refresh_token | text | nullable | OAuth refresh token |
| access_token | text | nullable | OAuth access token |
| expires_at | integer | nullable | Token expiry (epoch) |
| token_type | varchar(255) | nullable | Token type |
| scope | varchar(255) | nullable | OAuth scopes |
| id_token | text | nullable | OIDC ID token |
| session_state | varchar(255) | nullable | Session state |

**Primary Key**: Composite (provider, providerAccountId)

---

### ~~3. AuthSession (NextAuth)~~ - REMOVED

**This table has been removed.** JWT sessions are used exclusively because NextAuth.js v5's Credentials provider is not compatible with database sessions. All authentication (OAuth and Credentials) now uses JWT sessions.

---

### 3. VerificationToken (NextAuth)

Email verification tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| identifier | varchar(255) | NOT NULL | Email or identifier |
| token | varchar(255) | NOT NULL | Verification token |
| expires | timestamptz | NOT NULL | Token expiry |

**Primary Key**: Composite (identifier, token)

---

### 5. Currency

Virtual currency at amusement poker venues.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| userId | uuid | FK → users.id, cascade | Owner user |
| name | varchar(255) | NOT NULL | Currency name (e.g., "ABC Poker Chips") |
| initialBalance | integer | NOT NULL, default 0 | Starting balance |
| isArchived | boolean | NOT NULL, default false | Archived (hidden from active lists) |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `userId`, `isArchived`, `deletedAt` (partial where NULL)

**Balance Calculation** (via VIEW):
```
currentBalance = initialBalance + Σ(bonuses) + Σ(purchases) - Σ(buyIns) + Σ(cashOuts)
```

---

### 6. BonusTransaction

Record of bonus currency received.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| currencyId | uuid | FK → currencies.id, cascade | Associated currency |
| userId | uuid | FK → users.id, cascade | Owner user |
| amount | integer | NOT NULL | Bonus amount |
| source | varchar(255) | nullable | Source description (e.g., "友達紹介") |
| transactionDate | timestamptz | NOT NULL, default now | When received |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `currencyId`, `userId`, `transactionDate`

---

### 7. PurchaseTransaction

Record of currency purchase.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| currencyId | uuid | FK → currencies.id, cascade | Associated currency |
| userId | uuid | FK → users.id, cascade | Owner user |
| amount | integer | NOT NULL | Purchase amount |
| note | text | nullable | Optional note |
| transactionDate | timestamptz | NOT NULL, default now | When purchased |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `currencyId`, `userId`, `transactionDate`

---

### 8. Store

Poker venue / amusement establishment with Google Maps integration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| userId | uuid | FK → users.id, cascade | Owner user |
| name | varchar(255) | NOT NULL | Store name |
| address | text | nullable | Free-text address |
| latitude | decimal(10,8) | nullable | Latitude coordinate |
| longitude | decimal(11,8) | nullable | Longitude coordinate |
| placeId | varchar(255) | nullable | Google Place ID for stable reference |
| customMapUrl | text | nullable | Custom Google Maps URL (takes precedence over generated URL) |
| notes | text | nullable | Rich text notes (HTML) |
| isArchived | boolean | NOT NULL, default false | Archived (hidden from active lists) |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `userId`, `isArchived`, `deletedAt` (partial)

**Google Maps URL Generation**:
```typescript
// Priority: customMapUrl > placeId > coordinates > name+address
if (customMapUrl) return customMapUrl;
if (placeId) return `https://www.google.com/maps/search/?api=1&query_place_id=${placeId}`;
if (latitude && longitude) return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`;
```

---

### 9. CashGame (Updated - Explicit Blind/Ante Fields)

Cash game configuration at a store (NLHE only for initial release).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| storeId | uuid | FK → stores.id, cascade | Associated store |
| userId | uuid | FK → users.id, cascade | Owner user |
| currencyId | uuid | FK → currencies.id, set null | Currency used |
| smallBlind | integer | NOT NULL | Small blind amount |
| bigBlind | integer | NOT NULL | Big blind amount |
| straddle1 | integer | nullable | Straddle 1 (UTG straddle) |
| straddle2 | integer | nullable | Straddle 2 (UTG+1 straddle) |
| ante | integer | nullable | Ante amount (if any) |
| anteType | varchar(20) | nullable | 'all_ante' or 'bb_ante' |
| notes | text | nullable | Rich text notes (HTML) |
| isArchived | boolean | NOT NULL, default false | Archived (hidden from active lists) |
| sortOrder | integer | NOT NULL, default 0 | Display order for drag-and-drop sorting |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `storeId`, `userId`, `isArchived`, `sortOrder`

**Ante Types**:
- `all_ante`: All players post ante each hand
- `bb_ante`: Only big blind posts ante (combined with big blind)

**Display Format Example**: "1/2 (Ante: 2 BB Ante)" or "100/200/400/800 (Ante: 100 All)"

---

### 10. Tournament (Updated - Separate Structure Tables)

Tournament configuration at a store (NLHE only for initial release).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| storeId | uuid | FK → stores.id, cascade | Associated store |
| userId | uuid | FK → users.id, cascade | Owner user |
| currencyId | uuid | FK → currencies.id, set null | Currency used |
| name | varchar(255) | nullable | Tournament name |
| buyIn | integer | NOT NULL | Tournament buy-in amount (total) |
| rake | integer | nullable | Rake amount included in buy-in |
| startingStack | integer | nullable | Starting chip stack |
| notes | text | nullable | Rich text notes (HTML) |
| isArchived | boolean | NOT NULL, default false | Archived (hidden from active lists) |
| sortOrder | integer | NOT NULL, default 0 | Display order for drag-and-drop sorting |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `storeId`, `userId`, `isArchived`, `sortOrder`

**Note**: `buyIn` is the total amount paid. `rake` is the portion that goes to the house (optional). Prize pool contribution = buyIn - rake.

---

### 11. TournamentPrizeLevel (New)

Prize structure levels for a tournament.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| tournamentId | uuid | FK → tournaments.id, cascade | Parent tournament |
| position | integer | NOT NULL | Position (1st, 2nd, 3rd, etc.) |
| percentage | decimal(5,2) | nullable | Percentage of prize pool |
| fixedAmount | integer | nullable | Fixed prize amount |
| createdAt | timestamptz | NOT NULL, default now | |

**Unique**: (tournamentId, position)
**Indexes**: `tournamentId`

**Note**: Either `percentage` or `fixedAmount` should be set, not both.

---

### 12. TournamentBlindLevel (New)

Blind structure levels for a tournament.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| tournamentId | uuid | FK → tournaments.id, cascade | Parent tournament |
| level | integer | NOT NULL | Level number (1, 2, 3, etc.) |
| smallBlind | integer | NOT NULL | Small blind |
| bigBlind | integer | NOT NULL | Big blind |
| ante | integer | nullable | Ante (if any) |
| durationMinutes | integer | NOT NULL | Duration of this level in minutes |
| createdAt | timestamptz | NOT NULL, default now | |

**Unique**: (tournamentId, level)
**Indexes**: `tournamentId`

---

### 13. PokerSession

Playing session record (archive or active).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| userId | uuid | FK → users.id, cascade | Owner user |
| storeId | uuid | FK → stores.id, set null | Associated store |
| gameType | varchar(20) | nullable | 'cash' or 'tournament' |
| cashGameId | uuid | FK → cash_games.id, set null | Associated cash game |
| tournamentId | uuid | FK → tournaments.id, set null | Associated tournament |
| currencyId | uuid | FK → currencies.id, set null | Currency used |
| isActive | boolean | NOT NULL, default false | True = active session |
| startTime | timestamptz | NOT NULL | Session start |
| endTime | timestamptz | nullable | Session end (null if active) |
| buyIn | integer | NOT NULL | Total buy-in amount |
| cashOut | integer | nullable | Final cashout (null if active) |
| notes | text | nullable | Rich text notes (HTML) |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `userId`, `storeId`, `startTime DESC`, `isActive`, `deletedAt` (partial)

**Calculated Fields** (in application):
```typescript
profitLoss = cashOut - buyIn
```

---

### 14. SessionEvent (Event Sourcing for Active Sessions)

Extensible event log for active session recording. Uses JSONB for event data following the [recommended PostgreSQL event sourcing pattern](https://softwaremill.com/implementing-event-sourcing-using-a-relational-database/).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| sessionId | uuid | FK → poker_sessions.id, cascade | Parent session |
| userId | uuid | FK → users.id, cascade | Owner user |
| eventType | varchar(50) | NOT NULL | Event type discriminator |
| eventData | jsonb | nullable | Type-specific payload |
| sequence | integer | NOT NULL | Order within session |
| recordedAt | timestamptz | NOT NULL, default now | When event occurred |
| createdAt | timestamptz | NOT NULL, default now | |

**Indexes**: `sessionId`, `eventType`, `sequence`, `recordedAt`

**Why JSONB?** (Based on research)
- Standard pattern for event sourcing in PostgreSQL
- Flexibility for different event types without schema changes
- Efficient querying with JSONB indexes
- Type safety enforced at application layer via Zod schemas

**Event Types**:
| Event Type | Description | eventData | Time Customizable | Show in Timeline |
|------------|-------------|-----------|-------------------|------------------|
| `session_start` | Session begins | `{}` | No | Yes |
| `session_resume` | Session resumes after pause | `{}` | No | Yes |
| `session_pause` | Session paused | `{}` | No | Yes |
| `session_end` | Session completed | `{ cashOut: number }` | Yes | Yes |
| `player_seated` | Player sits at seat | `{ playerId?: string, seatNumber: number, playerName: string }` | No | Yes |
| `hand_recorded` | Hand with full history | `{ handId: string }` | No | Yes |
| `hands_passed` | Hands without full history | `{ count: number }` | No | Yes |
| `hand_complete` | Single hand completed (for counting) | `{}` | No | No (count only) |
| `stack_update` | Stack amount changed | `{ amount: number }` | No (always current time) | Yes |
| `rebuy` | Rebuy performed | `{ amount: number }` | Yes (after last event) | Yes |
| `addon` | Add-on performed | `{ amount: number }` | Yes (after last event) | Yes |

**Note on hand_complete**: This event is used for simple hand counting during live sessions. It is NOT displayed in the event timeline (to avoid clutter), but is counted and displayed in the hand counter UI. The chart X-axis can optionally use hand count instead of elapsed time.

**Time Specification Rules**:
- `stack_update` always records with current time (no time input UI)
- `rebuy`, `addon`, `session_end` support custom time (default: current time)
- Custom time must be after the last event's `recordedAt`

**Profit Chart Calculation**:
- Only `stack_update` events are plotted as data points
- Profit at each point = `eventData.amount` - total buy-in up to that time
- All-in adjusted profit = profit - all-in luck factor up to that time (actual result - EV)
- X-axis options:
  - Elapsed time (default): excludes pause duration (`session_pause` to `session_resume`)
  - Hand count: number of `hand_complete` events up to each stack_update

---

### 15. AllInRecord

Individual all-in situation within a session. Supports "Run it X times" for split pot outcomes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| sessionId | uuid | FK → poker_sessions.id, cascade | Parent session |
| userId | uuid | FK → users.id, cascade | Owner user |
| potAmount | integer | NOT NULL | Pot size |
| winProbability | decimal(5,2) | NOT NULL, check 0-100 | Win probability (%, up to 2 decimal places) |
| actualResult | boolean | NOT NULL | Won (true) or lost (false) - for single runout |
| runItTimes | integer | nullable, check 1-10 | Number of runouts (null or 1 = single runout) |
| winsInRunout | integer | nullable, check 0-runItTimes | Number of winning runouts (for Run it X times) |
| recordedAt | timestamptz | NOT NULL, default now | When recorded |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Run it X Times**:
- When `runItTimes` is null or 1: Standard single runout, use `actualResult` (won/lost)
- When `runItTimes` > 1: Multiple runouts, use `winsInRunout` to calculate partial pot win
- Example: Run it 3 times, win 2 → receive 2/3 of pot

**Indexes**: `sessionId`, `userId`

**Calculated Fields** (per session):
```typescript
allInEV = Σ(potAmount × winProbability / 100)
allInCount = count(allInRecords)
totalPotAmount = Σ(potAmount)
averageWinRate = avg(winProbability)

// Actual result calculation (handles Run it X times)
actualResultTotal = Σ(
  runItTimes > 1 && winsInRunout != null
    ? potAmount × (winsInRunout / runItTimes)  // Partial pot for multiple runouts
    : actualResult ? potAmount : 0              // Full pot or nothing for single runout
)

evDifference = actualResultTotal - allInEV  // 実収支 - EV（正=上振れ、負=下振れ）

// EV-adjusted profit (displayed next to main profit)
evAdjustedProfit = sessionProfitLoss - evDifference  // 運要素を除いた"実力"収支
```

**Display Notes**:
- Main profit/loss: Show actual session result (cashOut - buyIn)
- EV-adjusted profit: Show `profitLoss - evDifference` in smaller text as "(EV: +X,XXX)"
- This represents "skill-based" profit excluding luck variance from all-ins

---

### 16. Player

Opponent profile for tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| userId | uuid | FK → users.id, cascade | Owner user |
| name | varchar(255) | NOT NULL | Player name/nickname |
| isTemporary | boolean | NOT NULL, default false | Temporary player flag (see below) |
| generalNotes | text | nullable | Rich text general notes (HTML) |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `userId`, `name`

**Temporary Players**:
- When a tablemate is added during a session, a temporary player (`isTemporary=true`) is created
- Temporary players can be:
  - **Converted** to permanent players by setting `isTemporary=false`
  - **Linked** to an existing permanent player (merge tags/notes, then delete temp player)
  - **Deleted** when the tablemate leaves the session
- Temporary players are excluded from the player list by default
- Tags and notes added to temporary players are preserved when converting or linking

---

### 17. PlayerTag

User-defined tag for categorizing players.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| userId | uuid | FK → users.id, cascade | Owner user |
| name | varchar(100) | NOT NULL | Tag name |
| color | varchar(7) | nullable | Hex color code |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `userId`
**Unique**: (userId, name) where deletedAt IS NULL

---

### 18. PlayerTagAssignment (Junction)

Many-to-many relationship between players and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| playerId | uuid | FK → players.id, cascade | Player |
| tagId | uuid | FK → player_tags.id, cascade | Tag |
| createdAt | timestamptz | NOT NULL, default now | |

**Unique**: (playerId, tagId)
**Indexes**: `playerId`, `tagId`

---

### 19. PlayerNote

Date-specific note for a player.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| playerId | uuid | FK → players.id, cascade | Associated player |
| userId | uuid | FK → users.id, cascade | Owner user |
| noteDate | date | NOT NULL | Date of observation |
| content | text | NOT NULL | Note content |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `playerId`, `noteDate DESC`

---

### 20. Hand (Simplified - PHH Raw Only)

Individual hand record. All hand data stored in PHH format.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| sessionId | uuid | FK → poker_sessions.id, cascade | Parent session |
| userId | uuid | FK → users.id, cascade | Owner user |
| handNumber | integer | nullable | Hand number in session |
| handHistoryRaw | text | nullable | Full hand history (PHH format) |
| notes | text | nullable | Rich text notes (HTML) |
| isDraft | boolean | NOT NULL, default false | True if hand record is incomplete |
| recordedAt | timestamptz | NOT NULL, default now | When recorded |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `sessionId`, `userId`, `recordedAt DESC`, `isDraft`

**Note**: All indexed fields (position, holeCards, boardCards, result, potSize, wentToShowdown) removed. These can be parsed from `handHistoryRaw` as needed. PHH format is the only supported format. Draft hands (isDraft=true) can be saved with incomplete data and completed later.

---

### 21. HandSeat (Simplified - Link to Players Only)

Links players at the table to a hand. Stack/card data is in PHH.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| handId | uuid | FK → hands.id, cascade | Parent hand |
| seatNumber | integer | NOT NULL | Seat number (1-9) |
| position | varchar(10) | NOT NULL | Position (BTN, SB, BB, etc.) |
| playerId | uuid | FK → players.id, set null | Known player (if linked) |
| playerName | varchar(255) | nullable | Player name (fallback if not linked) |
| createdAt | timestamptz | NOT NULL, default now | |

**Unique**: (handId, seatNumber)
**Indexes**: `handId`, `playerId`

**Note**: `startingStack`, `endingStack`, `holeCards` removed as they are included in PHH format.

---

### 22. HandReviewFlag

User-defined flags for categorizing/marking hands.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| userId | uuid | FK → users.id, cascade | Owner user |
| name | varchar(100) | NOT NULL | Flag name (e.g., "要復習", "ミスプレイ") |
| color | varchar(7) | nullable | Hex color code |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | Soft delete |

**Indexes**: `userId`
**Unique**: (userId, name) where deletedAt IS NULL

---

### 23. HandReviewFlagAssignment (Junction)

Many-to-many relationship between hands and review flags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| handId | uuid | FK → hands.id, cascade | Hand |
| flagId | uuid | FK → hand_review_flags.id, cascade | Flag |
| createdAt | timestamptz | NOT NULL, default now | |

**Unique**: (handId, flagId)
**Indexes**: `handId`, `flagId`

---

## Session Tablemate Management

### 24. SessionTablemate

Tracks tablemates (opponents) during a poker session. Each tablemate is backed by a Player record.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | Unique identifier |
| userId | uuid | FK → users.id, cascade | Owner user |
| sessionId | uuid | FK → poker_sessions.id, cascade | Parent session |
| nickname | varchar(100) | NOT NULL | Display name (e.g., "Seat 3", "眼鏡") |
| seatNumber | integer | nullable | Seat number (1-9) |
| sessionNotes | text | nullable | Session-specific notes |
| playerId | uuid | FK → players.id, set null | Linked player record |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |

**Indexes**: `userId`, `sessionId`, `playerId`

**Workflow**:
1. **Add Tablemate**: Creates a temporary player + sessionTablemate record
2. **Edit Tablemate**: Can edit player name (if temp), tags, and general notes
3. **Link to Player**: Merges temp player data into existing player, updates playerId
4. **Convert to Player**: Sets `isTemporary=false` on the player record
5. **Remove Tablemate**: Deletes sessionTablemate and associated temp player (if any)

**UI Display**:
- Tablemates with permanent players (non-temporary) show a visual indicator (left border)
- Player tags are displayed inline
- General notes are shown below the tablemate row

---

## Removed Tables

### ~~SessionPlayer~~ (Removed)

Replaced by SessionTablemate entity (see Section 24).

### ~~GameNote~~ (Removed)

Deemed unnecessary. Game notes can be stored directly in CashGame/Tournament `notes` field.

---

## Database Views

### currency_balances

Calculated currency balance view for efficient queries.

```sql
CREATE OR REPLACE VIEW currency_balances AS
SELECT
  c.id AS currency_id,
  c.user_id,
  c.name,
  c.initial_balance,
  c.is_archived,
  COALESCE(SUM(bt.amount), 0)::integer AS total_bonuses,
  COALESCE(SUM(pt.amount), 0)::integer AS total_purchases,
  COALESCE(SUM(CASE WHEN s.deleted_at IS NULL THEN s.buy_in ELSE 0 END), 0)::integer AS total_buy_ins,
  COALESCE(SUM(CASE WHEN s.deleted_at IS NULL THEN s.cash_out ELSE 0 END), 0)::integer AS total_cash_outs,
  (
    c.initial_balance
    + COALESCE(SUM(bt.amount), 0)
    + COALESCE(SUM(pt.amount), 0)
    - COALESCE(SUM(CASE WHEN s.deleted_at IS NULL THEN s.buy_in ELSE 0 END), 0)
    + COALESCE(SUM(CASE WHEN s.deleted_at IS NULL THEN s.cash_out ELSE 0 END), 0)
  )::integer AS current_balance
FROM currencies c
LEFT JOIN bonus_transactions bt
  ON bt.currency_id = c.id AND bt.deleted_at IS NULL
LEFT JOIN purchase_transactions pt
  ON pt.currency_id = c.id AND pt.deleted_at IS NULL
LEFT JOIN poker_sessions s
  ON s.currency_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.user_id, c.name, c.initial_balance, c.is_archived;
```

---

## Validation Rules

### Currency
- `name`: Required, 1-255 characters
- `initialBalance`: Required, >= 0

### Store
- `name`: Required, 1-255 characters
- Location: Either (latitude AND longitude) OR address, or none
- `placeId`: Optional, valid Google Place ID format

### CashGame
- `smallBlind`: Required, > 0
- `bigBlind`: Required, > smallBlind
- `straddle1`: Optional, > bigBlind when set
- `straddle2`: Optional, > straddle1 when set
- `ante`: Optional, > 0 when set
- `anteType`: Required when ante is set ('all_ante' or 'bb_ante')

### Tournament
- `buyIn`: Required, > 0
- `startingStack`: Optional, > 0 when set

### TournamentPrizeLevel
- `position`: Required, >= 1
- Either `percentage` (0-100) or `fixedAmount` (> 0) should be set

### TournamentBlindLevel
- `level`: Required, >= 1
- `smallBlind`: Required, > 0
- `bigBlind`: Required, > smallBlind
- `durationMinutes`: Required, > 0

### Session
- `startTime`: Required
- `endTime`: Must be > startTime when provided
- `buyIn`: Required, > 0
- `cashOut`: Must be >= 0 when provided

### AllInRecord
- `potAmount`: Required, > 0
- `winProbability`: Required, 0.00-100.00 inclusive (decimal)

### Hand
- `handHistoryRaw`: Should be valid PHH format when provided

### SessionEvent
- `eventType`: Required, must be valid event type
- `eventData`: Must match schema for event type (validated via Zod)
- `sequence`: Required, unique within session

---

## State Transitions

### Session States
```
[New] → isActive=true, endTime=null → [Active]
         ↓ (session_start event)
[Active] ←→ [Paused] (session_pause / session_resume events)
         ↓ (session_end event)
[Active] → set endTime, cashOut → isActive=false → [Completed]
[Completed] → deletedAt=now → [Soft Deleted]
```

### Archive vs Soft Delete
- **isArchived**: Hides item from active lists, but data is fully accessible
- **deletedAt**: Soft delete, item is effectively removed but recoverable

### Event Sequence Example
```
1. session_start     {}
2. player_seated     { seatNumber: 3, playerName: "田中" }
3. player_seated     { seatNumber: 7, playerName: "鈴木", playerId: "uuid" }
4. hand_complete     {}  (not shown in timeline, counted: 1)
5. hand_complete     {}  (not shown in timeline, counted: 2)
6. stack_update      { amount: 10000 }
7. hand_recorded     { handId: "uuid" }
8. hand_complete     {}  (counted: 3)
9. hands_passed      { count: 5 }  (adds 5 to count: 8)
10. rebuy            { amount: 5000 }
11. hand_complete    {}  (counted: 9)
12. stack_update     { amount: 8000 }
13. session_pause    {}
14. session_resume   {}
15. hand_recorded    { handId: "uuid" }
16. session_end      { cashOut: 12000 }
```
