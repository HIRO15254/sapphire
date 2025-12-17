# Research: Live Poker Session Tracker

**Date**: 2025-12-12 (Updated: 2025-12-15)
**Feature Branch**: `001-poker-session-tracker`

This document consolidates research findings to resolve technical decisions for the implementation plan.

---

## 1. Authentication: NextAuth.js + Drizzle ORM

### Decision
Use NextAuth.js v5 with `@auth/drizzle-adapter` and **JWT sessions**.

### Rationale
- **JWT required for Credentials provider**: NextAuth.js v5's Credentials provider is not compatible with database sessions
- Credentials provider does not trigger the adapter's `createSession` method, making database sessions impossible
- JWT sessions work seamlessly with all providers (OAuth + Credentials)
- User data changes (currency balances, session results) are fetched fresh from database on each request via tRPC

### Alternatives Considered
- **Database sessions**: Not compatible with Credentials provider in NextAuth.js v5
- **Custom auth**: Rejected due to complexity and security concerns

### Key Configuration
```typescript
// JWT session strategy (required for Credentials provider)
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60,   // Refresh every 24 hours
}

// JWT callback to include user.id in token
callbacks: {
  jwt: ({ token, user }) => {
    if (user) {
      token.id = user.id
    }
    return token
  },
  session: ({ session, token }) => ({
    ...session,
    user: {
      ...session.user,
      id: token.id as string,
    },
  }),
}

// Providers: Google, Discord, Credentials (email/password)
// Password hashing: bcrypt with 10 rounds
```

### Schema Requirements
- `users`: id, name, email, emailVerified, image, passwordHash
- `accounts`: userId, type, provider, providerAccountId, tokens
- `verificationTokens`: identifier, token, expires

**Note**: `sessions` table has been removed since JWT sessions are used exclusively. Database sessions are not compatible with Credentials provider.

### Notes
- Use `allowDangerousEmailAccountLinking: true` for OAuth (email verified by providers)
- JWT callbacks are required to include user.id in session for tRPC context
- DrizzleAdapter is still used for user/account management (OAuth account linking)
- All authentication (OAuth and Credentials) uses JWT sessions

---

## 2. PWA Implementation (Updated)

### Decision
Use **Next.js official approach** with manual service worker and built-in manifest support.

### Rationale
- Next.js provides native support for PWA building blocks
- No dependency on third-party packages that may become deprecated
- Official documentation: `/docs/app/building-your-application/guides/progressive-web-apps`
- Full control over caching strategies and update behavior

### Alternatives Considered
- **@ducanh2912/next-pwa**: Third-party, may have compatibility issues
- **next-pwa (original)**: Deprecated, not App Router compatible
- **Serwist**: Community solution, not official

### Web App Manifest Configuration
```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ポーカーセッショントラッカー',
    short_name: 'PokerTracker',
    description: 'ライブポーカーセッション・ハンド記録アプリ',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

### Service Worker Setup
```javascript
// public/sw.js
const CACHE_NAME = 'poker-tracker-v1';
const OFFLINE_URLS = ['/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first for API, Cache-first for assets
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  }
});
```

### Next.js Config for Service Worker Headers
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
}
```

### Service Worker Registration
```tsx
// app/components/ServiceWorkerRegistration.tsx
'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
    }
  }, [])
  return null
}
```

### Offline Handling
- **Offline fallback page** shown when network unavailable
- **Optimistic updates** with tRPC React Query for responsive UI
- **No offline queue** - app requires network connectivity for mutations

---

## 3. Mantine v8 UI Patterns

### Decision
Use Mantine v8 with `ColorSchemeScript`, Noto Sans JP font, and `@mantine/form` + Zod validation.

### Theme Setup
```typescript
// Root layout with ColorSchemeScript for SSR-safe color scheme
<html lang="ja">
  <head>
    <ColorSchemeScript defaultColorScheme="auto" />
  </head>
  <body>
    <MantineProvider defaultColorScheme="auto" theme={theme}>
      {children}
    </MantineProvider>
  </body>
</html>
```

### Dark Mode
- Built-in persistence via `localStorage` (`mantine-color-scheme-value`)
- Use `useMantineColorScheme` hook for toggle
- Theme switch under 100ms (meets SC-006)

### Japanese Font Configuration
```typescript
// Use next/font/google for optimal loading
import { Noto_Sans_JP } from 'next/font/google';

const theme = createTheme({
  fontFamily: 'var(--font-noto-sans-jp), sans-serif',
  lineHeight: 1.75, // Better for Japanese text
});
```

### Form Validation
- Use `@mantine/form` with `zodResolver`
- Use `mode: 'uncontrolled'` for performance (v8 recommendation)
- Japanese error messages in Zod schemas

### Rich Text Editor
- Use `@mantine/tiptap` wrapper for Tiptap editor
- Store content as HTML
- For simple notes: use `<Textarea autosize />` instead

### Responsive Breakpoints
- `xs`: 576px, `sm`: 768px, `md`: 992px, `lg`: 1200px, `xl`: 1408px
- Use style props: `w={{ base: '100%', sm: '50%' }}`
- Use `visibleFrom`/`hiddenFrom` for conditional rendering

---

## 4. Drizzle ORM Patterns

### Decision
Use Drizzle ORM with PostgreSQL, application-level user isolation, soft delete pattern, and database views for calculated fields.

### Schema Design Patterns

**Relations**: Use `relations()` helper for type-safe joins
```typescript
export const currenciesRelations = relations(currencies, ({ one, many }) => ({
  user: one(users, { fields: [currencies.userId], references: [users.id] }),
  bonusTransactions: many(bonusTransactions),
}));
```

**Many-to-Many**: Junction tables with composite unique constraints
```typescript
export const handReviewFlagAssignments = pgTable('hand_review_flag_assignments', {
  handId: uuid('hand_id').references(() => hands.id, { onDelete: 'cascade' }),
  flagId: uuid('flag_id').references(() => handReviewFlags.id, { onDelete: 'cascade' }),
}, (t) => ({
  uniqueHandFlag: unique().on(t.handId, t.flagId),
}));
```

### Soft Delete Pattern
```typescript
// Add deletedAt to all entities
deletedAt: timestamp('deleted_at'), // NULL = active

// Query helper
export function isNotDeleted(column: PgColumn): SQL {
  return sql`${column} IS NULL`;
}

// Always filter in queries
where: and(eq(sessions.userId, userId), isNotDeleted(sessions.deletedAt))
```

### Calculated Fields (Currency Balance)
Use database VIEW for performance:
```sql
CREATE VIEW currency_balances AS
SELECT
  c.id AS currency_id,
  c.initial_balance
    + COALESCE(SUM(bt.amount), 0)       -- bonuses
    + COALESCE(SUM(pt.amount), 0)       -- purchases
    - COALESCE(SUM(s.buy_in), 0)        -- buy-ins
    + COALESCE(SUM(s.cash_out), 0)      -- cashouts
  AS current_balance
FROM currencies c
LEFT JOIN bonus_transactions bt ON ...
LEFT JOIN purchase_transactions pt ON ...
LEFT JOIN sessions s ON ...
WHERE c.deleted_at IS NULL
GROUP BY c.id;
```

### Timestamps Pattern
```typescript
// Use database trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';

// Apply to all tables
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### User Isolation Pattern
- **Always** filter by `userId` in WHERE clauses
- **Never** trust userId from client input - use `ctx.session.user.id`
- Verify ownership before updates/deletes
- No PostgreSQL RLS (Drizzle doesn't support it natively)

### Migration Strategy
- Use Drizzle Kit for SQL migration generation
- Test on staging (Neon branch) before production
- Make backwards-compatible changes: add nullable → backfill → make NOT NULL
- Create indexes for foreign keys and soft delete queries

---

## 5. tRPC Patterns

### Decision
Use tRPC v11 with domain-based routers, Zod schemas, and cursor-based pagination.

### Router Organization
```
src/server/api/
├── root.ts              # Merge all routers
├── trpc.ts              # Init, procedures, middleware
├── schemas/             # Shared Zod schemas
│   ├── session.schema.ts
│   └── common.schema.ts
└── routers/             # One router per entity
    ├── session.ts
    ├── currency.ts
    └── ...
```

### Protected Procedure Pattern
```typescript
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { session: ctx.session } });
});
```

### Error Handling
- `NOT_FOUND`: Resource doesn't exist
- `FORBIDDEN`: User doesn't own resource
- `CONFLICT`: Business rule violation (e.g., delete active session)
- `BAD_REQUEST`: Invalid references

### Optimistic Updates Pattern
```typescript
const mutation = api.session.update.useMutation({
  onMutate: async (newData) => {
    await utils.session.getById.cancel();
    const previous = utils.session.getById.getData();
    utils.session.getById.setData((old) => ({ ...old, ...newData }));
    return { previous };
  },
  onError: (err, newData, context) => {
    utils.session.getById.setData(context?.previous);
  },
  onSettled: () => {
    utils.session.getById.invalidate();
  },
});
```

### Pagination Pattern
- **Cursor-based** with `useInfiniteQuery` (recommended)
- Fetch `limit + 1` items to detect if more pages exist
- Return `{ items, nextCursor }` from query

### Real-time Updates
- Use **polling** (3-5s interval) for active sessions
- Reserve WebSocket subscriptions for future needs
- Polling is simpler and sufficient for poker tracking

---

## 6. Poker Hand History Format (Updated)

### Decision
Use **PHH format only** for hand history storage. All hand data (positions, stacks, cards, actions) is stored in the raw PHH text.

### Rationale
- PHH format is comprehensive and self-contained
- Avoids data duplication between raw text and indexed fields
- Parsing can be done on-demand for filtering/statistics
- Simpler schema with less maintenance overhead

### PHH (Poker Hand History) Format
PHH is an open standard for poker hand histories:

```
# ハンド #42 - 2025-12-15 14:30:00 JST
# ゲーム: NLHE (1/2)
# テーブル: ABC Poker - Table 3

[席1] Hero (200) BTN
[席2] Player2 (150) SB
[席3] Player3 (300) BB

*** プリフロップ ***
Hero [Ah Ks]
Player2 posts 1
Player3 posts 2
Hero raises to 6
Player2 folds
Player3 calls 4

*** フロップ *** [Ad Kc 5h]
Player3 checks
Hero bets 10
Player3 calls 10

*** ターン *** [Ad Kc 5h 8s]
Player3 checks
Hero bets 25
Player3 raises to 75
Hero calls 50

*** リバー *** [Ad Kc 5h 8s 2c]
Player3 bets 100
Hero calls 100

*** ショーダウン ***
Player3 shows [8h 8d] (スリーカード)
Hero shows [Ah Ks] (ツーペア)
Player3 wins 387

# 結果: -117
```

### Essential Data (All in PHH)
- Game variant and betting structure
- Blinds/antes structure
- Player seats and stack sizes
- Hole cards (for known players)
- Action sequence by street
- Board cards
- Showdown results
- Hand outcome and chip movements

### Storage Schema (Simplified)
```typescript
// hands table - PHH only, no indexed fields
handHistoryRaw: text('hand_history_raw'),  // Full PHH format (only format supported)
notes: text('notes'),                       // Additional notes (HTML)
```

### Hand Seats Table (Simplified)
Link players to seats only - stack/card data is in PHH:
```typescript
handSeats: {
  handId, seatNumber, position,
  playerId (nullable - for known players),
  playerName (fallback)
  // No startingStack, endingStack, holeCards - these are in PHH
}
```

---

## 7. Google Maps Integration (New)

### Decision
Store **coordinates + Place ID** and generate Google Maps links dynamically. No API key required for basic linking.

### Rationale
- No API key needed for simple "View on Google Maps" links
- Place ID provides stable reference even if name/address changes
- Coordinates are most reliable for programmatic map display
- Can enhance to embedded maps later if needed

### Data Storage
```typescript
stores: {
  name: varchar('name', { length: 255 }),
  address: text('address'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  placeId: varchar('place_id', { length: 255 }), // Google Place ID (optional)
}
```

### Google Maps URL Generation
```typescript
function getGoogleMapsUrl(store: Store): string {
  // Prefer Place ID if available
  if (store.placeId) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${store.placeId}`;
  }

  // Fall back to coordinates
  if (store.latitude && store.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
  }

  // Last resort: search by name and address
  const query = encodeURIComponent(`${store.name} ${store.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
```

### Future Enhancement Options
- **Phase 1 (MVP)**: Link out to Google Maps (no API key)
- **Phase 2**: Add Place ID for stable references
- **Phase 3**: Embed maps with API key if needed

---

## 8. Session Events System (New)

### Decision
Use an **extensible event-based architecture** for active session recording. All events are stored in a single table with a discriminated union pattern.

### Rationale
- Events can be added without schema changes
- Complete audit trail of session activity
- Enables accurate session reconstruction
- Time-ordered events for replay functionality

### Event Types
| Event Type | Description | Data |
|------------|-------------|------|
| `session_start` | Session begins/resumes | - |
| `session_pause` | Session paused | - |
| `session_end` | Session completed | cashOut |
| `player_seated` | Player sits at seat | playerId, seatNumber |
| `hand_recorded` | Hand with full history | handId |
| `hands_passed` | Hands without full history | count |
| `stack_update` | Stack amount changed | amount |
| `rebuy` | Rebuy performed | amount |
| `addon` | Add-on performed | amount |

### Storage Schema
```typescript
sessionEvents: {
  id: uuid,
  sessionId: uuid,
  userId: uuid,
  eventType: varchar,     // Discriminator
  eventData: jsonb,       // Type-specific payload
  recordedAt: timestamp,
  sequence: integer,      // Order within session
}
```

### Event Data Examples
```typescript
// player_seated
{ playerId: "uuid", seatNumber: 3, playerName: "John" }

// hand_recorded
{ handId: "uuid" }

// hands_passed
{ count: 5 }

// stack_update
{ amount: 15000 }

// rebuy / addon
{ amount: 5000 }
```

---

## 9. Additional Decisions

### All-in EV Calculation
```typescript
// Use decimal for win probability (0.00 - 100.00)
winProbability: decimal('win_probability', { precision: 5, scale: 2 })

// FR-043: sum of (pot amount × win probability / 100)
const allInEV = allInRecords.reduce((sum, record) => {
  return sum + (record.potAmount * Number(record.winProbability) / 100);
}, 0);
```

### Game Type Separation (Updated)
Split into separate tables with explicit fields:

**CashGame**: Explicit blind/ante fields
```typescript
cashGames: {
  smallBlind: integer,      // SB amount
  bigBlind: integer,        // BB amount
  straddle1: integer,       // UTG straddle (optional)
  straddle2: integer,       // UTG+1 straddle (optional)
  ante: integer,            // Ante amount (optional)
  anteType: varchar,        // 'all_ante' or 'bb_ante'
  currencyId: uuid,
  notes: text,              // Rich text notes
  isArchived: boolean,
}
```

**Tournament**: Separate structure tables
```typescript
tournaments: {
  name: varchar,
  buyIn: integer,
  startingStack: integer,
  currencyId: uuid,
  notes: text,
  isArchived: boolean,
}

tournamentPrizeLevels: {
  tournamentId, position, percentage?, fixedAmount?
}

tournamentBlindLevels: {
  tournamentId, level, smallBlind, bigBlind, ante?, durationMinutes
}
```

### Archive vs Soft Delete
- **isArchived**: Hides item from active lists, data fully accessible
- **deletedAt**: Soft delete, effectively removed but recoverable
- Applied to: Currency, Store, CashGame, Tournament

### Hand Review Flags (Multiple)
```typescript
handReviewFlags: {
  id: uuid,
  userId: uuid,
  name: varchar,         // e.g., "要復習", "ミスプレイ", "良いプレイ"
  color: varchar,        // Hex color
}

handReviewFlagAssignments: {
  handId: uuid,
  flagId: uuid,
}
```

### Date/Time Handling
- Store all timestamps in UTC with timezone (`timestamptz`)
- Display in user's local timezone on client
- Use `date-fns` or `dayjs` for formatting with Japanese locale

---

## 10. Linting & Formatting: Biome

### Decision
Use **Biome** as the single tool for linting and formatting (replaces ESLint + Prettier).

### Rationale
- Single tool for both linting and formatting = simpler configuration
- Faster execution (Rust-based, 10-20x faster than ESLint + Prettier)
- Built-in TypeScript support without additional plugins
- Active development and growing ecosystem
- Configuration in a single `biome.json` file

### Alternatives Considered
- **ESLint + Prettier**: Rejected due to complexity of dual configuration and slower performance
- **deno lint**: Rejected because not focused on web framework projects

### Key Configuration
```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded"
    }
  }
}
```

### Scripts
```json
{
  "lint": "biome lint .",
  "format": "biome format --write .",
  "check": "biome check --write ."
}
```

---

## 11. Testing Standards

### Test Database Setup

For database integration tests, use a **separate test database** with fresh seeding for each test run.

**Database Configuration**:
```typescript
// tests/helpers/db.ts
export function getTestDatabaseUrl(): string {
  // Use TEST_DATABASE_URL if set, otherwise append '_test' to DATABASE_URL
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL
  }
  // Automatically create test DB name: sapphire_test
  const url = new URL(process.env.DATABASE_URL)
  const dbName = url.pathname.split('/').pop()
  if (!dbName.endsWith('_test')) {
    url.pathname = url.pathname.replace(dbName, `${dbName}_test`)
  }
  return url.toString()
}

export async function cleanTestDatabase(db): Promise<void> {
  // Truncate all sapphire_ prefixed tables
  const tables = await db.execute(sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'sapphire_%'
  `)
  for (const { tablename } of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE "${tablename}" CASCADE`))
  }
}
```

**Test Setup**:
```typescript
import { setupTestDatabase, cleanTestDatabase } from '../helpers/db'

describe('Database Integration', () => {
  let db: ReturnType<typeof createTestDb>

  beforeAll(async () => {
    db = await setupTestDatabase()
  })

  beforeEach(async () => {
    await cleanTestDatabase(db)
  })
})
```

### Mantine Form Validation

**IMPORTANT**: Use `withAsterisk` instead of `required` to prevent browser native validation.

```typescript
// ✅ Correct - Mantine validation only
<TextInput
  label="メールアドレス"
  placeholder="you@example.com"
  withAsterisk  // Visual indicator only
  {...form.getInputProps('email')}
/>

// ❌ Wrong - Triggers browser native validation popup
<TextInput
  label="メールアドレス"
  required  // This triggers browser validation before Mantine
  {...form.getInputProps('email')}
/>
```

This ensures:
- Validation messages are displayed in Japanese (via Zod)
- Consistent styling with Mantine's error display
- No browser-specific popup messages

### Playwright Selectors

Use specific selectors to avoid matching multiple elements:

```typescript
// ✅ Correct - Use role-based selectors for specificity
await page.getByRole('button', { name: 'ログイン', exact: true }).click()
await page.getByRole('link', { name: '新規登録' }).click()
await page.getByLabel('メールアドレス').fill('test@example.com')
await page.getByRole('heading', { level: 1, name: 'ログイン' })

// ❌ Avoid - May match multiple elements
await page.click('text=ログイン')  // Matches buttons AND links
await page.locator('text=新規登録')  // Matches heading AND link
```

**Selector Priority**:
1. `getByRole` - Most reliable for buttons, links, headings
2. `getByLabel` - For form inputs with labels
3. `getByTestId` - For complex scenarios (add `data-testid` if needed)
4. `getByText` - Last resort, use `{ exact: true }` when possible

---

## Dependencies Summary

```json
{
  "dependencies": {
    "@auth/drizzle-adapter": "^1.x",
    "@mantine/core": "^8.x",
    "@mantine/form": "^8.x",
    "@mantine/hooks": "^8.x",
    "@mantine/tiptap": "^8.x",
    "@tabler/icons-react": "^3.x",
    "@tanstack/react-query": "^5.x",
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@trpc/client": "^11.x",
    "@trpc/react-query": "^11.x",
    "@trpc/server": "^11.x",
    "bcrypt": "^5.x",
    "drizzle-orm": "^0.x",
    "next": "^15.x",
    "next-auth": "^5.x",
    "postgres": "^3.x",
    "superjson": "^2.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.x",
    "@types/bcrypt": "^5.x",
    "drizzle-kit": "^0.x",
    "playwright": "^1.x",
    "vitest": "^2.x"
  }
}
```

**Note**: Package manager is **bun** (not pnpm or npm).
