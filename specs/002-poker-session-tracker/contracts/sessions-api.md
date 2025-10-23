# API Contract: Sessions Router

**Feature**: 002-poker-session-tracker
**Date**: 2025-10-21
**Router**: `sessions`
**Base Path**: `/api/trpc/sessions`

## Overview

The `sessions` tRPC router provides type-safe API endpoints for managing poker sessions. All procedures require authentication and automatically scope queries to the logged-in user (`ctx.session.user.id`). This ensures complete data isolation between users.

---

## Authentication

**All procedures**: Require authentication via `protectedProcedure`

**Headers**:
- `Cookie: next-auth.session-token=<token>` (set by NextAuth.js)

**Error Response** (if not authenticated):
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Not authenticated"
  }
}
```

---

## Procedures

### 1. `create` (Mutation)

**Purpose**: Create a new poker session for the authenticated user.

**Input Schema** (Zod):
```typescript
{
  date: z.date(),
  location: z.string().min(1).max(255).trim(),
  buyIn: z.number().nonnegative(),
  cashOut: z.number().nonnegative(),
  durationMinutes: z.number().int().positive(),
  notes: z.string().max(10000).optional(),
}
```

**Input Example**:
```typescript
{
  date: new Date("2025-10-21T18:00:00+09:00"),
  location: "ポーカースタジアム渋谷",
  buyIn: 10000,
  cashOut: 15000,
  durationMinutes: 180,
  notes: "良いセッションだった"
}
```

**Output Schema**:
```typescript
{
  id: number,
  userId: string,
  date: Date,
  location: string,
  buyIn: string, // NUMERIC from DB, returned as string
  cashOut: string,
  durationMinutes: number,
  notes: string | null,
  profit: number, // Computed: cashOut - buyIn
  createdAt: Date,
  updatedAt: Date,
}
```

**Output Example**:
```json
{
  "id": 123,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2025-10-21T09:00:00.000Z",
  "location": "ポーカースタジアム渋谷",
  "buyIn": "10000.00",
  "cashOut": "15000.00",
  "durationMinutes": 180,
  "notes": "良いセッションだった",
  "profit": 5000,
  "createdAt": "2025-10-21T10:00:00.000Z",
  "updatedAt": "2025-10-21T10:00:00.000Z"
}
```

**Error Cases**:
- `BAD_REQUEST`: Invalid input (e.g., negative buy-in, empty location)
- `UNAUTHORIZED`: Not authenticated

**Client Usage**:
```typescript
const { mutate: createSession } = api.sessions.create.useMutation({
  onSuccess: () => {
    void utils.sessions.getAll.invalidate();
    void utils.sessions.getStats.invalidate();
  },
});

createSession({
  date: new Date(),
  location: "渋谷",
  buyIn: 10000,
  cashOut: 15000,
  durationMinutes: 180,
});
```

---

### 2. `getAll` (Query)

**Purpose**: Retrieve all poker sessions for the authenticated user, ordered by date (most recent first).

**Input Schema**: None (user ID inferred from session)

**Output Schema**:
```typescript
Array<{
  id: number,
  userId: string,
  date: Date,
  location: string,
  buyIn: string,
  cashOut: string,
  durationMinutes: number,
  notes: string | null,
  profit: number,
  createdAt: Date,
  updatedAt: Date,
}>
```

**Output Example**:
```json
[
  {
    "id": 456,
    "date": "2025-10-21T09:00:00.000Z",
    "location": "ポーカースタジアム渋谷",
    "buyIn": "10000.00",
    "cashOut": "15000.00",
    "profit": 5000,
    "...": "..."
  },
  {
    "id": 123,
    "date": "2025-10-20T10:00:00.000Z",
    "location": "アキバポーカー",
    "buyIn": "20000.00",
    "cashOut": "18000.00",
    "profit": -2000,
    "...": "..."
  }
]
```

**Error Cases**:
- `UNAUTHORIZED`: Not authenticated

**Client Usage**:
```typescript
const { data: sessions, isLoading } = api.sessions.getAll.useQuery();
```

**Performance**: Index `session_user_date_idx` ensures <10ms response time for 1000 sessions.

---

### 3. `getFiltered` (Query)

**Purpose**: Retrieve poker sessions filtered by location and/or date range, scoped to authenticated user.

**Input Schema** (Zod):
```typescript
{
  location: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}
```

**Input Example**:
```typescript
{
  location: "ポーカースタジアム渋谷",
  startDate: new Date("2025-10-01"),
  endDate: new Date("2025-10-31"),
}
```

**Output Schema**: Same as `getAll` (array of sessions)

**Filtering Logic**:
- **location**: Exact match (case-sensitive)
- **startDate**: Include sessions where `date >= startDate`
- **endDate**: Include sessions where `date <= endDate`
- **All filters combined with AND**

**Error Cases**:
- `BAD_REQUEST`: Invalid date range (startDate > endDate)
- `UNAUTHORIZED`: Not authenticated

**Client Usage**:
```typescript
const { data: filtered } = api.sessions.getFiltered.useQuery({
  location: "渋谷",
  startDate: new Date("2025-10-01"),
  endDate: new Date("2025-10-31"),
});
```

**Performance**: Composite index `session_user_date_location_idx` optimizes combined filters.

---

### 4. `getStats` (Query)

**Purpose**: Calculate aggregated statistics for the authenticated user's sessions.

**Input Schema**: None

**Output Schema**:
```typescript
{
  totalProfit: number,        // Sum of all profits
  sessionCount: number,       // Total number of sessions
  avgProfit: number,          // Average profit per session
  totalBuyIn: number,         // Sum of all buy-ins
  totalCashOut: number,       // Sum of all cash-outs
  totalDuration: number,      // Sum of all durations (minutes)
  byLocation: Array<{
    location: string,
    profit: number,           // Total profit at this location
    sessionCount: number,     // Number of sessions at this location
    avgProfit: number,        // Average profit at this location
  }>,
}
```

**Output Example**:
```json
{
  "totalProfit": 3000,
  "sessionCount": 2,
  "avgProfit": 1500,
  "totalBuyIn": 30000,
  "totalCashOut": 33000,
  "totalDuration": 420,
  "byLocation": [
    {
      "location": "ポーカースタジアム渋谷",
      "profit": 5000,
      "sessionCount": 1,
      "avgProfit": 5000
    },
    {
      "location": "アキバポーカー",
      "profit": -2000,
      "sessionCount": 1,
      "avgProfit": -2000
    }
  ]
}
```

**Empty State** (no sessions):
```json
{
  "totalProfit": 0,
  "sessionCount": 0,
  "avgProfit": 0,
  "totalBuyIn": 0,
  "totalCashOut": 0,
  "totalDuration": 0,
  "byLocation": []
}
```

**Error Cases**:
- `UNAUTHORIZED`: Not authenticated

**Client Usage**:
```typescript
const { data: stats } = api.sessions.getStats.useQuery();
```

**Performance**: Aggregation query with `session_user_date_idx` index, <50ms for 1000 sessions.

---

### 5. `getById` (Query)

**Purpose**: Retrieve a single poker session by ID, verified to belong to authenticated user.

**Input Schema** (Zod):
```typescript
{
  id: z.number().int().positive(),
}
```

**Input Example**:
```typescript
{ id: 123 }
```

**Output Schema**: Single session object (same as `getAll` item) or `null` if not found/not owned by user

**Output Example**:
```json
{
  "id": 123,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2025-10-21T09:00:00.000Z",
  "location": "ポーカースタジアム渋谷",
  "...": "..."
}
```

**Error Cases**:
- `NOT_FOUND`: Session ID doesn't exist or doesn't belong to authenticated user (returns `null` instead of error for security - don't leak existence)
- `UNAUTHORIZED`: Not authenticated

**Client Usage**:
```typescript
const { data: session } = api.sessions.getById.useQuery({ id: 123 });

if (!session) {
  // Session not found or user doesn't own it
}
```

---

### 6. `update` (Mutation)

**Purpose**: Update an existing poker session. Only the owner can update their session.

**Input Schema** (Zod):
```typescript
{
  id: z.number().int().positive(),
  date: z.date().optional(),
  location: z.string().min(1).max(255).trim().optional(),
  buyIn: z.number().nonnegative().optional(),
  cashOut: z.number().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(10000).optional().nullable(), // Can set to null to clear
}
```

**Input Example**:
```typescript
{
  id: 123,
  cashOut: 16000, // Update only cashOut
  notes: "さらに良いセッションだった" // Update notes
}
```

**Output Schema**: Updated session object (same as `getById`)

**Error Cases**:
- `NOT_FOUND`: Session ID doesn't exist or user doesn't own it
- `BAD_REQUEST`: Invalid update data (e.g., negative amount)
- `UNAUTHORIZED`: Not authenticated

**Client Usage**:
```typescript
const { mutate: updateSession } = api.sessions.update.useMutation({
  onSuccess: (data) => {
    void utils.sessions.getAll.invalidate();
    void utils.sessions.getStats.invalidate();
    void utils.sessions.getById.invalidate({ id: data.id });
  },
});

updateSession({
  id: 123,
  cashOut: 16000,
});
```

**Side Effects**:
- `updatedAt` timestamp automatically updated to current time

---

### 7. `delete` (Mutation)

**Purpose**: Delete a poker session. Only the owner can delete their session.

**Input Schema** (Zod):
```typescript
{
  id: z.number().int().positive(),
}
```

**Input Example**:
```typescript
{ id: 123 }
```

**Output Schema**:
```typescript
{
  success: boolean,
}
```

**Output Example**:
```json
{
  "success": true
}
```

**Error Cases**:
- `NOT_FOUND`: Session ID doesn't exist or user doesn't own it (returns `{ success: false }`)
- `UNAUTHORIZED`: Not authenticated

**Client Usage**:
```typescript
const { mutate: deleteSession } = api.sessions.delete.useMutation({
  onSuccess: () => {
    void utils.sessions.getAll.invalidate();
    void utils.sessions.getStats.invalidate();
    router.push('/poker-sessions'); // Redirect after delete
  },
});

deleteSession({ id: 123 });
```

---

## Zod Schemas (Shared)

**File**: `src/server/api/routers/sessions.ts`

```typescript
import { z } from "zod";

export const createSessionSchema = z.object({
  date: z.date(),
  location: z.string().min(1).max(255).trim(),
  buyIn: z.number().nonnegative(),
  cashOut: z.number().nonnegative(),
  durationMinutes: z.number().int().positive(),
  notes: z.string().max(10000).optional(),
});

export const updateSessionSchema = z.object({
  id: z.number().int().positive(),
  date: z.date().optional(),
  location: z.string().min(1).max(255).trim().optional(),
  buyIn: z.number().nonnegative().optional(),
  cashOut: z.number().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(10000).optional().nullable(),
});

export const getByIdSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteSessionSchema = z.object({
  id: z.number().int().positive(),
});

export const filterSessionsSchema = z.object({
  location: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine(
  (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  { message: "startDate must be before or equal to endDate" }
);
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated (no valid session token) |
| `BAD_REQUEST` | 400 | Invalid input data (Zod validation failed) |
| `NOT_FOUND` | 404 | Resource not found or user doesn't own it |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error (database failure, etc.) |

---

## Security Guarantees

1. **Authentication**: All procedures require valid NextAuth.js session
2. **Authorization**: All queries automatically filter by `userId = ctx.session.user.id`
3. **Owner Verification**: Update/delete operations verify ownership before execution
4. **No Parameter Pollution**: User ID always derived from server-side session, never from client input
5. **Input Validation**: All inputs validated via Zod schemas before processing

**Example Security Check** (in `delete` procedure):
```typescript
const result = await ctx.db.delete(sessions).where(
  and(
    eq(sessions.id, input.id),
    eq(sessions.userId, ctx.session.user.id) // Ownership check
  )
);
```

---

## Contract Testing

**File**: `tests/contract/sessions.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { appRouter } from '@/server/api/root';
import { createInnerTRPCContext } from '@/server/api/trpc';

describe('sessions router', () => {
  it('create: validates input schema', async () => {
    const ctx = createInnerTRPCContext({ session: mockSession });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.sessions.create({
        buyIn: -1000, // Invalid: negative
        cashOut: 15000,
        // ... missing required fields
      })
    ).rejects.toThrow(); // Zod validation error
  });

  it('getAll: returns user-scoped sessions only', async () => {
    // Seed DB with sessions for user1 and user2
    const user1Sessions = await caller1.sessions.getAll();
    const user2Sessions = await caller2.sessions.getAll();

    expect(user1Sessions.every(s => s.userId === user1.id)).toBe(true);
    expect(user2Sessions.every(s => s.userId === user2.id)).toBe(true);
    expect(user1Sessions).not.toEqual(user2Sessions);
  });

  it('delete: prevents deleting other user\'s session', async () => {
    const session = await caller1.sessions.create({ ... });
    const result = await caller2.sessions.delete({ id: session.id });

    expect(result.success).toBe(false); // User2 cannot delete User1's session
  });
});
```

---

## Performance Benchmarks

**Target Response Times** (with 1000 sessions per user):

| Procedure | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| `create` | 5ms | 15ms | 30ms |
| `getAll` | 8ms | 20ms | 40ms |
| `getFiltered` | 10ms | 25ms | 50ms |
| `getStats` | 15ms | 50ms | 100ms |
| `getById` | 3ms | 10ms | 20ms |
| `update` | 6ms | 18ms | 35ms |
| `delete` | 4ms | 12ms | 25ms |

**Monitoring**: Track via tRPC middleware logging (future enhancement).

---

## Frontend Integration

**Type Safety**: tRPC provides full end-to-end type safety

```typescript
// ✅ TypeScript knows exact input/output types
const { data } = api.sessions.getAll.useQuery();
//    ^? data: Array<{ id: number, date: Date, ... }> | undefined

const { mutate } = api.sessions.create.useMutation();
mutate({
  date: new Date(),
  location: "渋谷",
  buyIn: 10000, // ✅ Type: number
  cashOut: "invalid", // ❌ Type error: Expected number
});
```

**Cache Invalidation Patterns**: See `research.md` Section 5 for detailed strategies.

---

## Future Enhancements (Out of Scope for V1)

- **Pagination**: Add `limit`/`offset` to `getAll` for large datasets
- **Sorting**: Allow custom sort fields (currently hard-coded to `date DESC`)
- **Bulk Operations**: `createMany`, `deleteMany` for batch imports
- **Advanced Filtering**: Full-text search on notes, profit range filters
- **Export**: `exportToCSV`, `exportToJSON` procedures

These features would require contract updates and are deferred to maintain V1 simplicity.
