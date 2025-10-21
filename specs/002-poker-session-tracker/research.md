# Technical Research: Poker Session Tracker

**Date**: 2025-10-21
**Feature**: 002-poker-session-tracker
**Purpose**: Document technical decisions and implementation patterns for multi-user poker session tracking

## 1. NextAuth.js v5 OAuth2 Provider Configuration

### Decision

Add Google and GitHub OAuth providers to the existing NextAuth.js v5 configuration alongside Discord.

### Rationale

- **NextAuth.js v5 built-in support**: Both Google and GitHub have official provider implementations
- **User convenience**: Most developers and users already have Google/GitHub accounts, reducing friction
- **Security**: OAuth2 delegates authentication to trusted providers, eliminating password storage risks
- **Existing infrastructure**: Project already uses NextAuth.js v5 with Discord provider - adding more providers is straightforward

### Implementation Pattern

**File**: `src/server/auth/config.ts`

```typescript
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import DiscordProvider from "next-auth/providers/discord";

export const authConfig = {
  providers: [
    GoogleProvider,
    GitHubProvider,
    DiscordProvider, // Existing
  ],
  // ... existing adapter and callbacks
} satisfies NextAuthConfig;
```

**Environment Variables** (`src/env.js`):

```typescript
server: {
  // Existing
  AUTH_SECRET: process.env.NODE_ENV === "production" ? z.string() : z.string().optional(),
  AUTH_DISCORD_ID: z.string(),
  AUTH_DISCORD_SECRET: z.string(),

  // New additions
  AUTH_GOOGLE_ID: z.string(),
  AUTH_GOOGLE_SECRET: z.string(),
  AUTH_GITHUB_ID: z.string(),
  AUTH_GITHUB_SECRET: z.string(),
}
```

### Alternatives Considered

1. **Email/Password authentication**
   - **Rejected**: Requires password hashing, reset flows, email verification - adds complexity
   - OAuth2 provides better security and UX with less code

2. **Single OAuth provider (e.g., Google only)**
   - **Rejected**: Limits user choice, some users may not have Google accounts
   - Multiple providers maximize accessibility

3. **Magic link authentication**
   - **Rejected**: Requires email infrastructure and has slower UX (email round-trip)
   - OAuth2 is faster and more familiar to users

### References

- [NextAuth.js v5 Google Provider](https://next-auth.js.org/providers/google)
- [NextAuth.js v5 GitHub Provider](https://next-auth.js.org/providers/github)
- [Setting up Google OAuth credentials](https://console.cloud.google.com/apis/credentials)
- [Setting up GitHub OAuth app](https://github.com/settings/developers)

---

## 2. Drizzle ORM Session Table Design

### Decision

Use PostgreSQL `NUMERIC(10,2)` for currency fields, `TIMESTAMP WITH TIME ZONE` for dates, and composite indexes for query optimization.

### Rationale

- **NUMERIC(10,2) for currency**:
  - Exact decimal arithmetic (no floating-point rounding errors)
  - Supports up to 99,999,999.99 (nearly 100 million yen/dollars)
  - Standard for financial data in PostgreSQL

- **TIMESTAMP WITH TIME ZONE**:
  - Stores absolute point in time (handles timezone conversions automatically)
  - Required for multi-timezone user base
  - Drizzle ORM's `timestamp({ mode: "date", withTimezone: true })` provides native JavaScript Date objects

- **Composite indexes**:
  - `(userId, date DESC)`: Optimizes session history queries (most recent first)
  - `(userId, location)`: Optimizes location-based filtering and stats aggregation
  - `(userId, date, location)`: Optimizes combined date+location filters

- **CASCADE DELETE on userId foreign key**:
  - Automatically removes sessions when user account deleted
  - Maintains referential integrity
  - Simplifies user data deletion (GDPR compliance)

### Implementation Pattern

**File**: `src/server/db/schema.ts`

```typescript
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
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("session_user_date_idx").on(t.userId, t.date.desc()),
    index("session_user_location_idx").on(t.userId, t.location),
    index("session_user_date_location_idx").on(t.userId, t.date, t.location),
  ]
);
```

### Alternatives Considered

1. **FLOAT/DOUBLE for currency**
   - **Rejected**: Floating-point arithmetic introduces rounding errors (e.g., 0.1 + 0.2 ≠ 0.3)
   - Financial calculations require exact precision

2. **Storing amounts in cents/smallest unit (INTEGER)**
   - **Rejected**: Adds complexity to UI layer (constant division/multiplication)
   - NUMERIC provides better readability and type safety

3. **TIMESTAMP WITHOUT TIME ZONE**
   - **Rejected**: Ambiguous for users in different timezones
   - WITH TIME ZONE ensures correct date/time handling globally

4. **Single-column indexes instead of composites**
   - **Rejected**: Less efficient for multi-column WHERE clauses
   - Composite indexes significantly improve query performance for common use cases

### References

- [PostgreSQL NUMERIC type documentation](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC-DECIMAL)
- [Drizzle ORM numeric column](https://orm.drizzle.team/docs/column-types/pg#numeric)
- [PostgreSQL timestamp with time zone](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [Drizzle ORM indexes](https://orm.drizzle.team/docs/indexes-constraints)

---

## 3. tRPC User-Scoped Queries Pattern

### Decision

Use `protectedProcedure` base procedure with `ctx.session.user.id` filtering in all queries and mutations.

### Rationale

- **Automatic authentication check**: `protectedProcedure` ensures user is logged in before executing
- **Type-safe user ID access**: `ctx.session.user.id` is guaranteed to exist (enforced by middleware)
- **Row-level security**: Every query/mutation filters by `userId = ctx.session.user.id`
- **Zero trust model**: Never trust client-provided user IDs - always use server-side session

### Implementation Pattern

**File**: `src/server/api/routers/sessions.ts`

```typescript
export const sessionsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const [session] = await ctx.db
        .insert(sessions)
        .values({
          ...input,
          userId: ctx.session.user.id, // Server-enforced user ID
        })
        .returning();
      return session;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.sessions.findMany({
      where: eq(sessions.userId, ctx.session.user.id), // User-scoped filter
      orderBy: [desc(sessions.date)],
    });
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(sessions)
        .where(
          and(
            eq(sessions.id, input.id),
            eq(sessions.userId, ctx.session.user.id) // Owner check
          )
        );
      return { success: result.rowCount > 0 };
    }),
});
```

### Security Guarantees

1. **Authentication**: `protectedProcedure` throws error if user not logged in
2. **Authorization**: All queries filter by `ctx.session.user.id` - users cannot access other users' data
3. **No parameter pollution**: Client cannot spoof `userId` - always set server-side
4. **Owner verification**: Update/delete operations verify ownership before execution

### Alternatives Considered

1. **Passing userId as input parameter**
   - **Rejected**: Allows client to potentially manipulate user ID
   - Server-side session is single source of truth

2. **Middleware-based row filtering**
   - **Rejected**: Drizzle ORM doesn't support global query filters
   - Explicit filtering in each query is clearer and safer

3. **Database-level row-level security (RLS)**
   - **Considered for future**: PostgreSQL RLS provides defense-in-depth
   - Current approach sufficient for application-level security

### References

- [tRPC protected procedures](https://trpc.io/docs/server/procedures#protected-procedures)
- [tRPC context](https://trpc.io/docs/server/context)
- [NextAuth.js session in tRPC](https://create.t3.gg/en/usage/trpc#-serverapitrpcts)

---

## 4. Mantine v8 Form Patterns

### Decision

Use Mantine's uncontrolled form components with Zod validation schemas shared between client and server.

### Rationale

- **Consistent UI**: Mantine v8 provides cohesive component library (matches existing project)
- **Built-in validation**: Components support `error` prop for inline validation messages
- **Responsive by default**: Mantine's Grid and Stack handle mobile/tablet/desktop layouts
- **Accessibility**: All inputs have proper ARIA labels and error announcements (WCAG 2.1 AA compliant)
- **Type safety**: Share Zod schemas between tRPC backend and frontend forms

### Component Selection

| Use Case | Component | Rationale |
|----------|-----------|-----------|
| Session date | `DateTimePicker` | Supports date+time input, calendar picker UI |
| Location | `TextInput` | Simple string input with validation |
| Buy-in / Cash-out | `NumberInput` | Enforces numeric input, supports decimal precision |
| Duration | `NumberInput` | Integer input with min=1 validation |
| Notes | `Textarea` | Multi-line text, optional field |

### Implementation Pattern

**File**: `src/features/poker-sessions/components/SessionForm.tsx`

```typescript
import { TextInput, NumberInput, Textarea, Button, Stack } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';

export function SessionForm({ onSubmit, initialData, errors }) {
  return (
    <Stack>
      <DateTimePicker
        label="セッション日時"
        required
        error={errors.date}
      />
      <TextInput
        label="場所"
        placeholder="例: ポーカースタジアム渋谷"
        required
        error={errors.location}
      />
      <NumberInput
        label="バイイン (円)"
        min={0}
        precision={2}
        required
        error={errors.buyIn}
      />
      <NumberInput
        label="キャッシュアウト (円)"
        min={0}
        precision={2}
        required
        error={errors.cashOut}
      />
      <NumberInput
        label="プレイ時間 (分)"
        min={1}
        required
        error={errors.durationMinutes}
      />
      <Textarea
        label="メモ (任意)"
        placeholder="重要な手やテーブルの状況など"
        error={errors.notes}
      />
      <Button type="submit">保存</Button>
    </Stack>
  );
}
```

### Responsive Layout

```typescript
<Grid>
  <Grid.Col span={{ base: 12, md: 6 }}>
    {/* Left column: Date, Location */}
  </Grid.Col>
  <Grid.Col span={{ base: 12, md: 6 }}>
    {/* Right column: Buy-in, Cash-out */}
  </Grid.Col>
</Grid>
```

### Alternatives Considered

1. **React Hook Form**
   - **Rejected**: Adds extra dependency, Mantine forms sufficient for this use case
   - Mantine's uncontrolled components work well with minimal state

2. **Custom input components**
   - **Rejected**: Reinvents the wheel, Mantine provides accessible components out-of-box
   - Focus development time on business logic, not UI primitives

### References

- [Mantine Forms](https://mantine.dev/form/use-form/)
- [Mantine DateTimePicker](https://mantine.dev/dates/date-time-picker/)
- [Mantine NumberInput](https://mantine.dev/core/number-input/)
- [Mantine Grid](https://mantine.dev/core/grid/)

---

## 5. TanStack Query Cache Invalidation Strategy

### Decision

Use `onSuccess` mutation callbacks to invalidate related queries (`getAll`, `getStats`, `getById`).

### Rationale

- **Automatic UI refresh**: Invalidated queries refetch, keeping UI in sync with server
- **Granular control**: Different mutations invalidate different query subsets
- **No manual cache updates**: TanStack Query handles refetching automatically
- **Type-safe**: tRPC utilities provide typed invalidation helpers

### Implementation Pattern

**File**: `src/features/poker-sessions/hooks/useSessions.ts`

```typescript
import { api } from "@/trpc/react";

export function useCreateSession() {
  const utils = api.useUtils();

  return api.sessions.create.useMutation({
    onSuccess: () => {
      // Invalidate list and stats queries
      void utils.sessions.getAll.invalidate();
      void utils.sessions.getStats.invalidate();
    },
  });
}

export function useUpdateSession() {
  const utils = api.useUtils();

  return api.sessions.update.useMutation({
    onSuccess: (data) => {
      // Invalidate list, stats, and specific session
      void utils.sessions.getAll.invalidate();
      void utils.sessions.getStats.invalidate();
      void utils.sessions.getById.invalidate({ id: data.id });
    },
  });
}

export function useDeleteSession() {
  const utils = api.useUtils();

  return api.sessions.delete.useMutation({
    onSuccess: () => {
      // Invalidate list and stats (detail page will redirect)
      void utils.sessions.getAll.invalidate();
      void utils.sessions.getStats.invalidate();
    },
  });
}
```

### Optimistic Updates (Optional Enhancement)

```typescript
export function useDeleteSession() {
  const utils = api.useUtils();

  return api.sessions.delete.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await utils.sessions.getAll.cancel();

      // Snapshot current data
      const previous = utils.sessions.getAll.getData();

      // Optimistically update UI
      utils.sessions.getAll.setData(undefined, (old) =>
        old?.filter(s => s.id !== variables.id)
      );

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        utils.sessions.getAll.setData(undefined, context.previous);
      }
    },
    onSettled: () => {
      void utils.sessions.getAll.invalidate();
    },
  });
}
```

### Alternatives Considered

1. **Manual cache updates everywhere**
   - **Rejected**: Error-prone, requires updating multiple cache entries manually
   - Invalidation is simpler and guarantees fresh data

2. **Polling/intervals for data freshness**
   - **Rejected**: Wasteful (refetches even when no changes), higher server load
   - Event-driven invalidation is more efficient

3. **No cache invalidation (manual refetch)**
   - **Rejected**: Poor UX (user sees stale data until manual refresh)
   - Automatic invalidation keeps UI synchronized

### References

- [TanStack Query Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
- [tRPC Query Invalidation](https://trpc.io/docs/client/react/useUtils#invalidate)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

---

## 6. Playwright E2E Testing with Japanese UI

### Decision

Use Japanese text for UI selectors in Playwright tests, matching production UI. Use test database isolation and NextAuth.js test providers.

### Rationale

- **Real-world testing**: Tests use actual UI text users will see (Japanese)
- **Internationalization validation**: Ensures Japanese text renders correctly
- **Database isolation**: Each test run uses `todoapp_test` database (separate from dev)
- **Deterministic auth**: Use test OAuth provider or session injection for reliable authentication

### Implementation Pattern

**File**: `tests/e2e/poker-sessions.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('ポーカーセッション管理', () => {
  test.beforeEach(async ({ page }) => {
    // Reset test database
    await resetTestDatabase();

    // Inject authenticated session (bypass OAuth for testing)
    await injectTestSession(page, { userId: 'test-user-1' });

    await page.goto('/poker-sessions');
  });

  test('新規セッションを作成できる', async ({ page }) => {
    // Navigate to create page
    await page.click('text=新規セッション');

    // Fill form (using Japanese labels)
    await page.fill('label:has-text("場所")', 'ポーカースタジアム渋谷');
    await page.fill('label:has-text("バイイン (円)")', '10000');
    await page.fill('label:has-text("キャッシュアウト (円)")', '15000');
    await page.fill('label:has-text("プレイ時間 (分)")', '180');

    // Submit
    await page.click('button:has-text("保存")');

    // Verify redirect to session list
    await expect(page).toHaveURL('/poker-sessions');

    // Verify session appears in list
    await expect(page.locator('text=ポーカースタジアム渋谷')).toBeVisible();
    await expect(page.locator('text=+¥5,000')).toBeVisible(); // profit display
  });

  test('統計が正しく表示される', async ({ page }) => {
    // Seed test data
    await seedSessions([
      { buyIn: 10000, cashOut: 15000, location: '渋谷' },
      { buyIn: 20000, cashOut: 18000, location: '新宿' },
    ]);

    await page.goto('/poker-sessions');

    // Verify aggregated stats
    await expect(page.locator('text=合計収支: +¥3,000')).toBeVisible();
    await expect(page.locator('text=セッション数: 2')).toBeVisible();
    await expect(page.locator('text=平均収支: +¥1,500')).toBeVisible();
  });
});
```

### Test Database Setup

**File**: `tests/helpers/db.ts`

```typescript
import { execSync } from 'child_process';

export async function resetTestDatabase() {
  execSync('bun run db:push:test', { stdio: 'inherit' });
  // Clear all tables
  await db.delete(sessions);
  await db.delete(users);
}

export async function seedSessions(data: Array<Partial<Session>>) {
  const testUser = await createTestUser();
  for (const session of data) {
    await db.insert(sessions).values({
      ...session,
      userId: testUser.id,
    });
  }
}
```

### Authentication Test Pattern

```typescript
async function injectTestSession(page, userData) {
  // Set NextAuth.js session cookie
  await page.context().addCookies([{
    name: 'next-auth.session-token',
    value: await createTestSessionToken(userData),
    domain: 'localhost',
    path: '/',
  }]);
}
```

### Alternatives Considered

1. **English UI text in tests**
   - **Rejected**: Doesn't match production, misses i18n bugs
   - Japanese selectors ensure actual user experience is tested

2. **CSS/XPath selectors instead of text**
   - **Rejected**: Brittle (breaks on styling changes), less readable
   - Text selectors are more resilient and self-documenting

3. **Shared database for dev and test**
   - **Rejected**: Test runs pollute dev data, non-deterministic tests
   - Isolated test database ensures clean slate

4. **Real OAuth flow in E2E tests**
   - **Rejected**: Slow, unreliable (network dependency), requires real credentials
   - Session injection is faster and more stable

### References

- [Playwright Locators](https://playwright.dev/docs/locators)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [NextAuth.js Testing](https://next-auth.js.org/tutorials/testing-with-cypress)
- [Drizzle ORM Test Setup](https://orm.drizzle.team/docs/get-started-postgresql#http-proxy)

---

## Summary

All technical decisions support the core requirements:

1. **Authentication**: Google/GitHub OAuth via NextAuth.js v5 (30s sign-in target)
2. **Data Model**: PostgreSQL with NUMERIC for currency, composite indexes for performance
3. **Security**: User-scoped queries via tRPC protectedProcedure (100% data isolation)
4. **UI**: Mantine v8 components with Japanese localization (consistent UX)
5. **State Management**: TanStack Query with automatic cache invalidation (<2s data freshness)
6. **Testing**: Playwright E2E with Japanese text selectors, isolated test database

These patterns form the foundation for implementing P0-P4 user stories with high quality, security, and maintainability.
