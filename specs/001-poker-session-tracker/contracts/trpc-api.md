# tRPC API Contracts

**Date**: 2025-12-12 (Updated: 2025-12-15)
**Feature Branch**: `001-poker-session-tracker`

This document defines the tRPC router contracts for the poker session tracker.

---

## Router Structure

```
appRouter
├── auth           # Authentication (public + protected)
├── currency       # Currency management
├── store          # Store management
├── cashGame       # Cash game configuration
├── tournament     # Tournament configuration
├── session        # Poker session tracking
├── sessionEvent   # Active session events
├── allIn          # All-in records
├── player         # Player profiles
├── playerTag      # Player tags
├── hand           # Hand recording
├── handSeat       # Hand seat/player info
└── handReviewFlag # Custom review flags
```

---

## Authentication Router (`auth`)

### `auth.register` (mutation, public)

Register a new user with email/password.

**Input**:
```typescript
{
  email: string;      // Valid email format
  password: string;   // Min 8 characters
  name?: string;      // Optional display name
}
```

**Output**:
```typescript
{
  success: boolean;
  userId: string;
}
```

**Errors**:
- `CONFLICT`: User with email already exists

---

## Currency Router (`currency`)

### `currency.list` (query, protected)

Get all user's currencies with calculated balances.

**Input**:
```typescript
{
  includeArchived?: boolean;  // Default: false
}
```

**Output**:
```typescript
Array<{
  id: string;
  name: string;
  initialBalance: number;
  isArchived: boolean;
  totalBonuses: number;
  totalPurchases: number;
  totalBuyIns: number;
  totalCashOuts: number;
  currentBalance: number;
  createdAt: Date;
}>
```

### `currency.getById` (query, protected)

Get single currency with balance breakdown.

**Input**:
```typescript
{ id: string }
```

**Output**: Same as list item + `bonusTransactions[]` + `purchaseTransactions[]`

**Errors**:
- `NOT_FOUND`: Currency not found or not owned by user

### `currency.create` (mutation, protected)

Create a new currency.

**Input**:
```typescript
{
  name: string;           // 1-255 chars
  initialBalance: number; // >= 0
}
```

### `currency.update` (mutation, protected)

Update currency details.

**Input**:
```typescript
{
  id: string;
  name?: string;
  initialBalance?: number;
}
```

### `currency.archive` (mutation, protected)

Archive or unarchive a currency.

**Input**:
```typescript
{
  id: string;
  isArchived: boolean;
}
```

### `currency.delete` (mutation, protected)

Soft delete a currency.

**Input**:
```typescript
{ id: string }
```

### `currency.addBonus` (mutation, protected)

Record a bonus transaction.

**Input**:
```typescript
{
  currencyId: string;
  amount: number;         // > 0
  source?: string;        // Optional description
  transactionDate?: Date; // Defaults to now
}
```

### `currency.addPurchase` (mutation, protected)

Record a purchase transaction.

**Input**:
```typescript
{
  currencyId: string;
  amount: number;         // > 0
  note?: string;          // Optional note
  transactionDate?: Date;
}
```

---

## Store Router (`store`)

### `store.list` (query, protected)

Get all user's stores.

**Input**:
```typescript
{
  includeArchived?: boolean;  // Default: false
}
```

**Output**:
```typescript
Array<{
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  isArchived: boolean;
  cashGameCount: number;
  tournamentCount: number;
  createdAt: Date;
}>
```

### `store.getById` (query, protected)

Get store with associated games.

**Input**:
```typescript
{ id: string }
```

**Output**:
```typescript
{
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  notes?: string;
  isArchived: boolean;
  cashGames: Array<CashGame>;
  tournaments: Array<Tournament>;
  googleMapsUrl: string;    // Generated URL
  createdAt: Date;
}
```

### `store.create` (mutation, protected)

Create a new store.

**Input**:
```typescript
{
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  notes?: string;       // HTML
}
```

### `store.update` (mutation, protected)

Update store details.

**Input**:
```typescript
{
  id: string;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  notes?: string;
}
```

### `store.archive` (mutation, protected)

Archive or unarchive a store.

**Input**:
```typescript
{
  id: string;
  isArchived: boolean;
}
```

### `store.delete` (mutation, protected)

Soft delete a store.

**Input**:
```typescript
{ id: string }
```

---

## Cash Game Router (`cashGame`)

### `cashGame.listByStore` (query, protected)

Get cash games for a specific store.

**Input**:
```typescript
{
  storeId: string;
  includeArchived?: boolean;  // Default: false
}
```

**Output**:
```typescript
Array<{
  id: string;
  currencyId?: string;
  currencyName?: string;
  smallBlind: number;
  bigBlind: number;
  straddle1?: number;
  straddle2?: number;
  ante?: number;
  anteType?: 'all_ante' | 'bb_ante';
  isArchived: boolean;
  displayName: string;    // Generated: "1/2" or "1/2 (Ante: 2 BB)"
}>
```

### `cashGame.getById` (query, protected)

Get cash game details.

**Input**:
```typescript
{ id: string }
```

**Output**:
```typescript
{
  id: string;
  storeId: string;
  storeName: string;
  currencyId?: string;
  smallBlind: number;
  bigBlind: number;
  straddle1?: number;
  straddle2?: number;
  ante?: number;
  anteType?: 'all_ante' | 'bb_ante';
  notes?: string;
  isArchived: boolean;
}
```

### `cashGame.create` (mutation, protected)

Create a cash game.

**Input**:
```typescript
{
  storeId: string;
  currencyId?: string;
  smallBlind: number;     // > 0
  bigBlind: number;       // > smallBlind
  straddle1?: number;     // > bigBlind
  straddle2?: number;     // > straddle1
  ante?: number;          // > 0
  anteType?: 'all_ante' | 'bb_ante';  // Required if ante is set
  notes?: string;
}
```

### `cashGame.update` (mutation, protected)

Update cash game.

**Input**:
```typescript
{
  id: string;
  currencyId?: string;
  smallBlind?: number;
  bigBlind?: number;
  straddle1?: number;
  straddle2?: number;
  ante?: number;
  anteType?: 'all_ante' | 'bb_ante';
  notes?: string;
}
```

### `cashGame.archive` (mutation, protected)

Archive or unarchive a cash game.

**Input**:
```typescript
{
  id: string;
  isArchived: boolean;
}
```

### `cashGame.delete` (mutation, protected)

Soft delete a cash game.

**Input**:
```typescript
{ id: string }
```

---

## Tournament Router (`tournament`)

### `tournament.listByStore` (query, protected)

Get tournaments for a specific store.

**Input**:
```typescript
{
  storeId: string;
  includeArchived?: boolean;  // Default: false
}
```

**Output**:
```typescript
Array<{
  id: string;
  name?: string;
  currencyId?: string;
  currencyName?: string;
  buyIn: number;
  startingStack?: number;
  isArchived: boolean;
}>
```

### `tournament.getById` (query, protected)

Get tournament details with structures.

**Input**:
```typescript
{ id: string }
```

**Output**:
```typescript
{
  id: string;
  storeId: string;
  storeName: string;
  name?: string;
  currencyId?: string;
  buyIn: number;
  startingStack?: number;
  prizeLevels: TournamentPrizeLevel[];
  blindLevels: TournamentBlindLevel[];
  notes?: string;
  isArchived: boolean;
}
```

### `tournament.create` (mutation, protected)

Create a tournament.

**Input**:
```typescript
{
  storeId: string;
  name?: string;
  currencyId?: string;
  buyIn: number;          // > 0
  startingStack?: number; // > 0
  prizeLevels?: Array<{
    position: number;     // >= 1
    percentage?: number;  // 0-100
    fixedAmount?: number; // > 0
  }>;
  blindLevels?: Array<{
    level: number;        // >= 1
    smallBlind: number;   // > 0
    bigBlind: number;     // > smallBlind
    ante?: number;
    durationMinutes: number; // > 0
  }>;
  notes?: string;
}
```

### `tournament.update` (mutation, protected)

Update tournament.

**Input**:
```typescript
{
  id: string;
  name?: string;
  currencyId?: string;
  buyIn?: number;
  startingStack?: number;
  notes?: string;
}
```

### `tournament.archive` (mutation, protected)

Archive or unarchive a tournament.

**Input**:
```typescript
{
  id: string;
  isArchived: boolean;
}
```

### `tournament.delete` (mutation, protected)

Soft delete a tournament.

**Input**:
```typescript
{ id: string }
```

### `tournament.setPrizeLevels` (mutation, protected)

Replace all prize levels for a tournament.

**Input**:
```typescript
{
  tournamentId: string;
  levels: Array<{
    position: number;
    percentage?: number;
    fixedAmount?: number;
  }>;
}
```

### `tournament.setBlindLevels` (mutation, protected)

Replace all blind levels for a tournament.

**Input**:
```typescript
{
  tournamentId: string;
  levels: Array<{
    level: number;
    smallBlind: number;
    bigBlind: number;
    ante?: number;
    durationMinutes: number;
  }>;
}
```

---

## Session Router (`session`)

### `session.list` (query, protected)

Get paginated session history.

**Input**:
```typescript
{
  limit?: number;       // 1-100, default 50
  cursor?: string;      // Pagination cursor
  storeId?: string;     // Filter by store
  currencyId?: string;  // Filter by currency
  gameType?: 'cash' | 'tournament';
  isActive?: boolean;   // Filter active/archived
  startDate?: Date;     // Filter by date range
  endDate?: Date;
}
```

**Output**:
```typescript
{
  items: Array<{
    id: string;
    storeName?: string;
    gameType?: string;
    gameName?: string;      // blinds or tournament name
    currencyName?: string;
    isActive: boolean;
    startTime: Date;
    endTime?: Date;
    buyIn: number;
    cashOut?: number;
    profitLoss?: number;
    allInCount: number;
    allInEV: number;
  }>;
  nextCursor?: string;
}
```

### `session.getStatistics` (query, protected)

Get session statistics for dashboard (FR-085, FR-086).

**Input**:
```typescript
{
  period: 'this_month' | 'last_month' | 'all_time' | 'custom';
  startDate?: Date;     // Required if period is 'custom'
  endDate?: Date;       // Required if period is 'custom'
  currencyId?: string;  // Filter by currency
}
```

**Output**:
```typescript
{
  totalSessions: number;
  totalBuyIn: number;
  totalCashOut: number;
  totalProfitLoss: number;
  winRate: number;              // % of profitable sessions
  averageSessionDuration: number; // minutes
  totalAllIns: number;
  totalAllInEV: number;
  totalActualResult: number;
  evDifference: number;
  periodStart: Date;
  periodEnd: Date;
}
```

### `session.getById` (query, protected)

Get full session details.

**Input**:
```typescript
{ id: string }
```

**Output**:
```typescript
{
  id: string;
  store?: Store;
  gameType?: string;
  cashGame?: CashGame;
  tournament?: Tournament;
  currency?: Currency;
  isActive: boolean;
  startTime: Date;
  endTime?: Date;
  buyIn: number;
  cashOut?: number;
  profitLoss?: number;
  notes?: string;
  allInRecords: AllInRecord[];
  allInSummary: {
    count: number;
    totalPotAmount: number;
    averageWinRate: number;
    ev: number;
    actualResultTotal: number;  // 実際に勝ったポット合計
    evDifference: number;       // EV差分（実際 - 期待値）
  };
  // For active sessions:
  events?: SessionEvent[];
  hands?: Hand[];
}
```

### `session.createArchive` (mutation, protected)

Create an archive (completed) session.

**Input**:
```typescript
{
  storeId?: string;
  gameType?: 'cash' | 'tournament';
  cashGameId?: string;
  tournamentId?: string;
  currencyId?: string;
  startTime: Date;
  endTime: Date;
  buyIn: number;        // > 0
  cashOut: number;      // >= 0
  notes?: string;
}
```

### `session.update` (mutation, protected)

Update session details.

**Input**:
```typescript
{
  id: string;
  storeId?: string;
  gameType?: 'cash' | 'tournament';
  cashGameId?: string;
  tournamentId?: string;
  startTime?: Date;
  endTime?: Date;
  buyIn?: number;
  cashOut?: number;
  notes?: string;
}
```

### `session.delete` (mutation, protected)

Soft delete a session.

**Input**:
```typescript
{ id: string }
```

**Errors**:
- `CONFLICT`: Cannot delete active session (must end first)

---

## Session Event Router (`sessionEvent`)

### `sessionEvent.listBySession` (query, protected)

Get all events for a session in order.

**Input**:
```typescript
{ sessionId: string }
```

**Output**:
```typescript
Array<{
  id: string;
  eventType: string;
  eventData: object;
  sequence: number;
  recordedAt: Date;
}>
```

### `sessionEvent.startSession` (mutation, protected)

Start a new active session.

**Input**:
```typescript
{
  storeId?: string;
  gameType?: 'cash' | 'tournament';
  cashGameId?: string;
  tournamentId?: string;
  currencyId?: string;
  buyIn: number;
}
```

**Output**:
```typescript
{
  sessionId: string;
  eventId: string;
  startTime: Date;
}
```

### `sessionEvent.pauseSession` (mutation, protected)

Pause an active session.

**Input**:
```typescript
{ sessionId: string }
```

### `sessionEvent.resumeSession` (mutation, protected)

Resume a paused session.

**Input**:
```typescript
{ sessionId: string }
```

### `sessionEvent.endSession` (mutation, protected)

End an active session.

**Input**:
```typescript
{
  sessionId: string;
  cashOut: number;
}
```

### `sessionEvent.seatPlayer` (mutation, protected)

Record player sitting at a seat.

**Input**:
```typescript
{
  sessionId: string;
  seatNumber: number;   // 1-9
  playerId?: string;    // If known player
  playerName: string;
}
```

### `sessionEvent.recordHand` (mutation, protected)

Record that a hand was played (links to Hand).

**Input**:
```typescript
{
  sessionId: string;
  handId: string;
}
```

### `sessionEvent.recordHandsPassed` (mutation, protected)

Record hands that passed without detailed history.

**Input**:
```typescript
{
  sessionId: string;
  count: number;
}
```

### `sessionEvent.updateStack` (mutation, protected)

Record stack update.

**Input**:
```typescript
{
  sessionId: string;
  amount: number;
}
```

### `sessionEvent.recordRebuy` (mutation, protected)

Record rebuy.

**Input**:
```typescript
{
  sessionId: string;
  amount: number;
}
```

**Side effect**: Updates session `buyIn` total

### `sessionEvent.recordAddon` (mutation, protected)

Record add-on.

**Input**:
```typescript
{
  sessionId: string;
  amount: number;
}
```

**Side effect**: Updates session `buyIn` total

---

## All-In Router (`allIn`)

### `allIn.listBySession` (query, protected)

Get all-in records for a session.

**Input**:
```typescript
{ sessionId: string }
```

**Output**:
```typescript
Array<{
  id: string;
  potAmount: number;
  winProbability: number;   // Decimal 0.00-100.00
  actualResult: boolean;    // Won (true) or lost (false)
  expectedValue: number;    // potAmount * winProbability / 100
  recordedAt: Date;
}>
```

### `allIn.create` (mutation, protected)

Record an all-in.

**Input**:
```typescript
{
  sessionId: string;
  potAmount: number;        // > 0
  winProbability: number;   // 0.00-100.00 (decimal)
  actualResult: boolean;    // Won or lost
}
```

### `allIn.update` (mutation, protected)

Update all-in record.

**Input**:
```typescript
{
  id: string;
  potAmount?: number;
  winProbability?: number;
  actualResult?: boolean;
}
```

### `allIn.delete` (mutation, protected)

Soft delete all-in record.

**Input**:
```typescript
{ id: string }
```

---

## Player Router (`player`)

### `player.list` (query, protected)

Get all player profiles.

**Input**:
```typescript
{
  limit?: number;
  cursor?: string;
  search?: string;      // Search by name
  tagIds?: string[];    // Filter by tags
}
```

**Output**:
```typescript
{
  items: Array<{
    id: string;
    name: string;
    tags: PlayerTag[];
    handCount: number;      // Hands linked via HandSeat
    lastSeen?: Date;
  }>;
  nextCursor?: string;
}
```

### `player.getById` (query, protected)

Get player profile with history.

**Input**:
```typescript
{ id: string }
```

**Output**:
```typescript
{
  id: string;
  name: string;
  tags: PlayerTag[];
  generalNotes?: string;
  dateNotes: PlayerNote[];
  hands: HandSummary[];     // Linked via HandSeat
  storesEncountered: Store[];
}
```

### `player.create` (mutation, protected)

Create player profile.

**Input**:
```typescript
{
  name: string;
  generalNotes?: string;
  tagIds?: string[];
}
```

### `player.update` (mutation, protected)

Update player profile.

**Input**:
```typescript
{
  id: string;
  name?: string;
  generalNotes?: string;
}
```

### `player.delete` (mutation, protected)

Soft delete player.

**Input**:
```typescript
{ id: string }
```

### `player.addNote` (mutation, protected)

Add date-specific note.

**Input**:
```typescript
{
  playerId: string;
  noteDate: Date;
  content: string;
}
```

### `player.assignTags` (mutation, protected)

Set player's tags.

**Input**:
```typescript
{
  playerId: string;
  tagIds: string[];
}
```

---

## Player Tag Router (`playerTag`)

### `playerTag.list` (query, protected)

Get all tags.

**Input**: None

**Output**:
```typescript
Array<{
  id: string;
  name: string;
  color?: string;
  playerCount: number;
}>
```

### `playerTag.create` (mutation, protected)

Create a tag.

**Input**:
```typescript
{
  name: string;
  color?: string;       // Hex color
}
```

### `playerTag.update` (mutation, protected)

Update tag.

**Input**:
```typescript
{
  id: string;
  name?: string;
  color?: string;
}
```

### `playerTag.delete` (mutation, protected)

Soft delete tag.

**Input**:
```typescript
{ id: string }
```

---

## Hand Router (`hand`)

### `hand.listBySession` (query, protected)

Get hands for a session.

**Input**:
```typescript
{
  sessionId: string;
  limit?: number;
  cursor?: string;
  flagIds?: string[];       // Filter by review flags
  includeDrafts?: boolean;  // Include draft hands (default: false)
}
```

**Output**:
```typescript
{
  items: Array<{
    id: string;
    handNumber?: number;
    isDraft: boolean;
    reviewFlags: HandReviewFlag[];
    recordedAt: Date;
  }>;
  nextCursor?: string;
}
```

### `hand.getById` (query, protected)

Get full hand details with PHH data.

**Input**:
```typescript
{ id: string }
```

**Output**:
```typescript
{
  id: string;
  sessionId: string;
  handNumber?: number;
  handHistoryRaw?: string;  // PHH format
  notes?: string;
  isDraft: boolean;
  seats: HandSeat[];
  reviewFlags: HandReviewFlag[];
  recordedAt: Date;
}
```

### `hand.create` (mutation, protected)

Record a new hand.

**Input**:
```typescript
{
  sessionId: string;
  handNumber?: number;
  handHistoryRaw?: string;  // PHH format
  notes?: string;
  isDraft?: boolean;        // Save as draft (incomplete hand)
  seats?: Array<{
    seatNumber: number;
    position: string;
    playerId?: string;
    playerName?: string;
  }>;
  flagIds?: string[];
}
```

### `hand.update` (mutation, protected)

Update hand details.

**Input**:
```typescript
{
  id: string;
  handNumber?: number;
  handHistoryRaw?: string;
  notes?: string;
  isDraft?: boolean;        // Mark as complete or keep as draft
}
```

### `hand.delete` (mutation, protected)

Soft delete hand.

**Input**:
```typescript
{ id: string }
```

### `hand.assignFlags` (mutation, protected)

Set hand's review flags.

**Input**:
```typescript
{
  handId: string;
  flagIds: string[];
}
```

---

## Hand Seat Router (`handSeat`)

### `handSeat.listByHand` (query, protected)

Get seats/players for a hand.

**Input**:
```typescript
{ handId: string }
```

**Output**:
```typescript
Array<{
  id: string;
  seatNumber: number;
  position: string;
  playerId?: string;
  playerName?: string;
}>
```

### `handSeat.listByPlayer` (query, protected)

Get hands where a player was seated.

**Input**:
```typescript
{
  playerId: string;
  limit?: number;
  cursor?: string;
}
```

**Output**:
```typescript
{
  items: Array<{
    handSeat: HandSeat;
    hand: HandSummary;
  }>;
  nextCursor?: string;
}
```

### `handSeat.upsert` (mutation, protected)

Add or update a seat for a hand.

**Input**:
```typescript
{
  handId: string;
  seatNumber: number;
  position: string;
  playerId?: string;
  playerName?: string;
}
```

### `handSeat.delete` (mutation, protected)

Remove a seat from a hand.

**Input**:
```typescript
{
  handId: string;
  seatNumber: number;
}
```

---

## Hand Review Flag Router (`handReviewFlag`)

### `handReviewFlag.list` (query, protected)

Get all user's review flags.

**Input**: None

**Output**:
```typescript
Array<{
  id: string;
  name: string;
  color?: string;
  handCount: number;    // Hands with this flag
}>
```

### `handReviewFlag.create` (mutation, protected)

Create a review flag.

**Input**:
```typescript
{
  name: string;         // e.g., "要復習", "ミスプレイ"
  color?: string;       // Hex color
}
```

### `handReviewFlag.update` (mutation, protected)

Update a review flag.

**Input**:
```typescript
{
  id: string;
  name?: string;
  color?: string;
}
```

### `handReviewFlag.delete` (mutation, protected)

Soft delete a review flag.

**Input**:
```typescript
{ id: string }
```

---

## Common Types

```typescript
// Pagination response wrapper
type PaginatedResponse<T> = {
  items: T[];
  nextCursor?: string;
}

// Error codes used
type ErrorCode =
  | 'UNAUTHORIZED'      // Not authenticated
  | 'FORBIDDEN'         // Not authorized
  | 'NOT_FOUND'         // Resource not found
  | 'CONFLICT'          // Business rule violation
  | 'BAD_REQUEST'       // Invalid input
  | 'INTERNAL_SERVER_ERROR'

// Position enum
type Position = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'MP' | 'MP+1' | 'HJ' | 'CO'

// Game type enum
type GameType = 'cash' | 'tournament'

// Ante type enum
type AnteType = 'all_ante' | 'bb_ante'

// Session event types
type SessionEventType =
  | 'session_start'
  | 'session_resume'
  | 'session_pause'
  | 'session_end'
  | 'player_seated'
  | 'hand_recorded'
  | 'hands_passed'
  | 'stack_update'
  | 'rebuy'
  | 'addon'

// Tournament prize level
type TournamentPrizeLevel = {
  id: string;
  position: number;
  percentage?: number;
  fixedAmount?: number;
}

// Tournament blind level
type TournamentBlindLevel = {
  id: string;
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante?: number;
  durationMinutes: number;
}
```
