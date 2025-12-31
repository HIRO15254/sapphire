# Tasks: Live Poker Session Tracker

**Input**: Design documents from `/specs/001-poker-session-tracker/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: TDD is MANDATORY per constitution. Tests MUST be written first and verified to fail before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per plan.md T3 Stack structure:

```
src/
├── app/                    # Next.js App Router (Presentation Layer)
├── components/             # Shared React components
├── server/                 # Server-side code (Application + Infrastructure)
│   ├── api/routers/        # tRPC routers
│   ├── api/schemas/        # Zod schemas
│   └── db/schema/          # Drizzle schemas
├── lib/                    # Shared utilities
└── trpc/                   # tRPC client setup

tests/
├── unit/                   # Vitest unit tests
├── integration/            # Vitest integration tests
└── e2e/                    # Playwright E2E tests
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and T3 Stack configuration

- [X] T001 Initialize T3 Stack project with Next.js 15, tRPC v11, Drizzle ORM, NextAuth.js v5, and Mantine v8 at repository root
- [X] T002 [P] Configure TypeScript strict mode in tsconfig.json
- [X] T003 [P] Configure Vitest in vitest.config.ts with test paths and coverage settings
- [X] T004 [P] Configure Playwright in playwright.config.ts for E2E tests
- [X] T005 [P] Configure Biome for linting and formatting (biome.json)
- [X] T006 [P] Create .env.example with required environment variables (DATABASE_URL, AUTH_SECRET, AUTH_URL, OAuth credentials)
- [X] T007 [P] Configure Mantine v8 with Japanese font (Noto Sans JP) and ColorSchemeScript in src/app/layout.tsx
- [X] T008 [P] Add package.json scripts for db:generate, db:migrate, db:push, db:studio, db:seed, db:reset

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema Foundation

- [X] T009 Write integration test for database connection in tests/integration/db/connection.test.ts
- [X] T010 Configure Drizzle ORM with PostgreSQL in src/server/db/index.ts
- [X] T011 [P] Create timestamps mixin (createdAt, updatedAt, deletedAt) pattern in src/server/db/schema/common.ts
- [X] T012 [P] Create soft delete helper function (isNotDeleted) in src/server/db/schema/common.ts

### Authentication Foundation (Required for all user stories)

- [X] T013 Write unit test for user schema validation in tests/unit/server/db/schema/user.test.ts
- [X] T014 Create User schema with passwordHash field in src/server/db/schema/user.ts
- [X] T015 [P] Create Account schema (OAuth) in src/server/db/schema/account.ts
- [X] ~~T016 [P] Create AuthSession schema in src/server/db/schema/session.ts~~ - REMOVED (JWT sessions used instead)
- [X] T017 [P] Create VerificationToken schema in src/server/db/schema/verificationToken.ts
- [X] T018 Export all auth schemas from src/server/db/schema/index.ts
- [X] T019 Run initial database migration with bun run db:generate && bun run db:migrate

### tRPC Foundation

- [X] T020 Write unit test for tRPC context creation in tests/unit/server/api/trpc.test.ts
- [X] T021 Configure tRPC v11 with context and procedures in src/server/api/trpc.ts
- [X] T022 Create protectedProcedure with auth enforcement in src/server/api/trpc.ts
- [X] T023 Create root router structure in src/server/api/root.ts
- [X] T024 Configure tRPC client with React Query in src/trpc/react.tsx
- [X] T025 Configure tRPC server caller in src/trpc/server.ts
- [X] T026 Create tRPC API route handler in src/app/api/trpc/[trpc]/route.ts

### NextAuth Foundation

- [X] T027 Write integration test for NextAuth configuration in tests/integration/auth/config.test.ts
- [X] T028 Configure NextAuth.js v5 with JWT sessions in src/server/auth.ts (JWT required for Credentials provider)
- [X] T029 [P] Configure Credentials provider (email/password) with bcrypt in src/server/auth.ts
- [X] T030 [P] Configure Google OAuth provider in src/server/auth.ts
- [X] T031 [P] Configure Discord OAuth provider in src/server/auth.ts
- [X] T032 Create auth API route handlers in src/app/api/auth/[...nextauth]/route.ts

### Base UI Components

- [X] T033 [P] Create AppShell layout component with navigation in src/components/layouts/AppShell.tsx
- [X] T034 [P] Create ThemeToggle component using useMantineColorScheme in src/components/ui/ThemeToggle.tsx
- [X] T035 [P] Create LoadingOverlay wrapper component in src/components/ui/LoadingOverlay.tsx
- [X] T036 [P] Create ErrorBoundary component with Japanese error messages in src/components/ui/ErrorBoundary.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 7 - User Authentication and Data Privacy (Priority: P1) 🎯 MVP

**Goal**: Enable users to securely log in via email/password or OAuth (Google/Discord) with data isolation

**Independent Test**: Register, log in, verify data isolation between accounts

### Tests for User Story 7 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T037 [P] [US7] Write unit test for auth.register mutation in tests/unit/server/api/routers/auth.test.ts
- [X] T038 [P] [US7] Write integration test for user registration flow in tests/integration/auth/register.test.ts
- [X] T039 [P] [US7] Write integration test for OAuth login flow in tests/integration/auth/oauth.test.ts
- [X] T040 [P] [US7] Write E2E test for signup/signin/signout flow in tests/e2e/auth.spec.ts

### Implementation for User Story 7

- [X] T041 [US7] Create Zod schemas for auth input validation in src/server/api/schemas/auth.schema.ts
- [X] T042 [US7] Implement auth router with register mutation in src/server/api/routers/auth.ts
- [X] T043 [US7] Add auth router to root router in src/server/api/root.ts
- [X] T044 [P] [US7] Create SignInPage component in src/app/auth/signin/page.tsx
- [X] T045 [P] [US7] Create SignUpPage component in src/app/auth/signup/page.tsx
- [X] T046 [US7] Create auth middleware for protected routes in src/middleware.ts
- [X] T047 [US7] Implement session callback to include user.id in src/server/auth.ts

**Checkpoint**: Users can register and log in; data isolation enforced

---

## Phase 4: User Story 2 - Manage Virtual Currencies (Priority: P1)

**Goal**: Track virtual currency balances with bonuses, purchases, and session results

**Independent Test**: Create currency, record bonuses/purchases, verify calculated balance

### Tests for User Story 2 ⚠️

- [X] T048 [P] [US2] Write unit test for Currency schema in tests/unit/server/db/schema/currency.test.ts
- [X] T049 [P] [US2] Write unit test for currency router in tests/unit/server/api/routers/currency.test.ts
- [X] T050 [P] [US2] Write integration test for currency balance calculation in tests/integration/currency/balance.test.ts
- [X] T051 [P] [US2] Write E2E test for currency CRUD flow in tests/e2e/currency.spec.ts

### Implementation for User Story 2

- [X] T052 [US2] Create Currency schema in src/server/db/schema/currency.ts
- [X] T053 [P] [US2] Create BonusTransaction schema in src/server/db/schema/bonusTransaction.ts
- [X] T054 [P] [US2] Create PurchaseTransaction schema in src/server/db/schema/purchaseTransaction.ts
- [X] T055 [US2] Create currency_balances database VIEW migration in drizzle/migrations/ (Note: Implemented via calculateCurrencyBalance function instead of DB VIEW per pragmatic approach)
- [X] T056 [US2] Create Zod schemas for currency validation in src/server/api/schemas/currency.schema.ts
- [X] T057 [US2] Implement currency router (list, getById, create, update, archive, delete, addBonus, addPurchase) in src/server/api/routers/currency.ts
- [X] T058 [US2] Add currency router to root router in src/server/api/root.ts
- [X] T059 [P] [US2] Create CurrencyListPage in src/app/currencies/page.tsx (Note: Using /currencies/ instead of /(auth)/currencies/ per existing routing pattern)
- [X] T060 [P] [US2] Create CurrencyDetailPage in src/app/currencies/[id]/page.tsx
- [X] T061 [P] [US2] Create CurrencyForm component in src/app/currencies/new/page.tsx (Note: Integrated into new/edit pages)
- [X] T062 [US2] Create CurrencyBalanceBreakdown component in src/app/currencies/[id]/page.tsx (Note: Integrated into detail page)

**Checkpoint**: Users can manage currencies and track balances

---

## Phase 5: User Story 3 - Manage Stores and Games (Priority: P2)

**Goal**: Register poker venues with location and manage cash games/tournaments at each venue

**Independent Test**: Create store with location, add cash games and tournaments, view store details

**⚠️ NOTE**: This phase must complete BEFORE User Story 1 (Sessions) because sessions require both currencies (Phase 4) and stores/games (Phase 5)

### Tests for User Story 3 ⚠️

- [X] T063 [P] [US3] Write unit test for Store schema in tests/unit/server/db/schema/store.test.ts
- [X] T064 [P] [US3] Write unit test for CashGame schema in tests/unit/server/db/schema/cashGame.test.ts
- [X] T065 [P] [US3] Write unit test for Tournament schema in tests/unit/server/db/schema/tournament.test.ts
- [X] T066 [P] [US3] Write unit test for store router in tests/unit/server/api/routers/store.test.ts
- [X] T067 [P] [US3] Write unit test for cashGame router in tests/unit/server/api/routers/cashGame.test.ts
- [X] T068 [P] [US3] Write unit test for tournament router in tests/unit/server/api/routers/tournament.test.ts
- [X] T069 [P] [US3] Write E2E test for store and game management flow in tests/e2e/store.spec.ts

### Implementation for User Story 3

- [X] T070 [US3] Create Store schema with Google Maps fields (latitude, longitude, placeId) in src/server/db/schema/store.ts
- [X] T071 [US3] Create CashGame schema with explicit blind/ante fields in src/server/db/schema/cashGame.ts
- [X] T072 [US3] Create Tournament schema in src/server/db/schema/tournament.ts
- [X] T073 [P] [US3] Create TournamentPrizeLevel schema in src/server/db/schema/tournament.ts (Note: Combined with Tournament schema)
- [X] T074 [P] [US3] Create TournamentBlindLevel schema in src/server/db/schema/tournament.ts (Note: Combined with Tournament schema)
- [X] T075 [US3] Create Google Maps URL generator utility in src/lib/google-maps.ts
- [X] T076 [US3] Create Zod schemas for store, cashGame, tournament validation in src/server/api/schemas/{store,cashGame,tournament}.schema.ts
- [X] T077 [US3] Implement store router in src/server/api/routers/store.ts
- [X] T078 [US3] Implement cashGame router in src/server/api/routers/cashGame.ts
- [X] T079 [US3] Implement tournament router (including setPrizeLevels, setBlindLevels) in src/server/api/routers/tournament.ts
- [X] T080 [US3] Add store, cashGame, tournament routers to root router in src/server/api/root.ts
- [X] T081 [P] [US3] Create StoreListPage in src/app/(main)/stores/page.tsx
- [X] T082 [P] [US3] Create StoreDetailPage in src/app/(main)/stores/[id]/page.tsx
- [X] T083 [P] [US3] Create StoreForm component in src/app/(main)/stores/new/NewStoreContent.tsx (Note: Integrated into new page)
- [X] T084 [P] [US3] Create CashGameForm component in src/app/(main)/stores/[id]/StoreDetailContent.tsx (Note: Integrated into detail page modal)
- [X] T085 [P] [US3] Create TournamentForm component in src/app/(main)/stores/[id]/StoreDetailContent.tsx (Note: Integrated into detail page modal)
- [X] T086 [US3] Create GoogleMapsLink component in src/components/ui/GoogleMapsLink.tsx

**Checkpoint**: Users can manage stores with location and games

---

## Phase 6: User Story 1 - Record a Completed Session (Archive Recording) (Priority: P1) 🎯 MVP Core

**Goal**: Quick logging of completed sessions with store, game, buy-in, cashout, and all-in EV tracking

**Independent Test**: Create session with store/game/currency, add all-in records, verify profit/loss and EV calculations

**Dependencies**: Requires both User Story 2 (Currencies) and User Story 3 (Stores/Games) to be complete

### Tests for User Story 1 ⚠️

- [X] T087 [P] [US1] Write unit test for PokerSession schema in tests/unit/server/db/schema/session.test.ts
- [X] T088 [P] [US1] Write unit test for AllInRecord schema in tests/unit/server/db/schema/allIn.test.ts
- [X] T089 [P] [US1] Write unit test for session router in tests/unit/server/api/routers/session.test.ts
- [X] T090 [P] [US1] Write unit test for allIn router in tests/unit/server/api/routers/allIn.test.ts
- [X] T091 [P] [US1] Write integration test for session with all-in EV calculation in tests/integration/session/allInEv.test.ts
- [X] T092 [P] [US1] Write E2E test for archive session recording flow in tests/e2e/session-archive.spec.ts

### Implementation for User Story 1

- [X] T093 [US1] Create PokerSession schema in src/server/db/schema/session.ts
- [X] T094 [US1] Create AllInRecord schema with winProbability decimal(5,2), runItTimes, winsInRunout in src/server/db/schema/allInRecord.ts
- [X] T095 [US1] Create Zod schemas for session validation in src/server/api/schemas/session.schema.ts
- [X] T096 [US1] Create Zod schemas for allIn validation (including Run it X times) in src/server/api/schemas/allIn.schema.ts
- [X] T097 [US1] Implement session router (list, getById, createArchive, update, delete) with EV calculations in src/server/api/routers/session.ts
- [X] T098 [US1] Implement allIn router (listBySession, create, update, delete) in src/server/api/routers/allIn.ts
- [X] T099 [US1] Add session and allIn routers to root router in src/server/api/root.ts
- [X] T100 [P] [US1] Create SessionListPage with pagination and EV-adjusted profit display in src/app/(main)/sessions/page.tsx
- [X] T101 [P] [US1] Create SessionDetailPage with profit/EV-adjusted profit and all-in records table in src/app/(main)/sessions/[id]/page.tsx
- [X] T102 [P] [US1] Create ArchiveSessionForm component with separate date/start time/end time inputs in src/app/(main)/sessions/new/NewSessionContent.tsx
- [X] T103 [P] [US1] Create AllInRecordForm component with Run it X times support (integrated in SessionDetailContent.tsx)
- [X] T104 [US1] Implement EV-adjusted profit display (profitLoss - evDifference) next to main profit on session detail and list pages
- [X] T105 [US1] Add empty state handling in ArchiveSessionForm when no stores exist (prompt to create store first)
- [X] T105a [P] [US1] Create EditSessionPage at src/app/(main)/sessions/[id]/edit/page.tsx (FR-040a)
- [X] T105b [P] [US1] Create EditSessionContent component at src/app/(main)/sessions/[id]/edit/EditSessionContent.tsx (FR-040a)

**Checkpoint**: Users can record archive sessions with full all-in EV tracking (including Run it X times and EV-adjusted profit display)

**Implementation Notes** (Phase 6 completed 2025-12):
- Session time input: Separate date, start time, end time fields (end time before start time = next day)
- AllInRecord: Added `runItTimes` and `winsInRunout` columns for "Run it X times" support
- EV calculation: actualResultTotal = Σ(potAmount × winsInRunout / runItTimes) for multiple runouts
- EV-adjusted profit: Displayed as "(EV: +X,XXX)" next to main profit, calculated as profitLoss - evDifference
- All-in table: Combined "実収支" column shows actual result with EV diff below in small text
- Terminology: "買入"/"精算" → "Buy-in"/"Cash-out"
- Session edit: Edit page at /sessions/[id]/edit with full form to modify session details (FR-040a)

---

## Phase 7: User Story 4 - Active Session Recording (Priority: P2)

**Goal**: Real-time session recording with player tracking, hand recording, and stack progression

**Independent Test**: Start active session, record hands and stack changes, end session with cashout

### Tests for User Story 4 ⚠️

- [X] T106 [P] [US4] Write unit test for SessionEvent schema in tests/unit/server/db/schema/sessionEvent.test.ts
- [X] T107 [P] [US4] Write unit test for sessionEvent router in tests/unit/server/api/routers/sessionEvent.test.ts
- [X] T108 [P] [US4] Write integration test for active session state transitions in tests/integration/session/active.test.ts
- [X] T109 [P] [US4] Write E2E test for active session flow in tests/e2e/session-active.spec.ts

### Implementation for User Story 4

- [X] T110 [US4] Create SessionEvent schema with JSONB eventData in src/server/db/schema/sessionEvent.ts
- [X] T111 [US4] Create Zod schemas for each event type validation in src/server/api/schemas/sessionEvent.schema.ts
- [X] T112 [US4] Implement sessionEvent router (startSession, pauseSession, resumeSession, endSession, seatPlayer, recordHand, recordHandsPassed, updateStack, recordRebuy, recordAddon) in src/server/api/routers/sessionEvent.ts
- [X] T113 [US4] Add sessionEvent router to root router in src/server/api/root.ts
- [X] T114 [US4] Update session.createArchive to validate only one active session per user in src/server/api/routers/session.ts
- [X] T115 [P] [US4] Create ActiveSessionPage with real-time event display in src/app/(auth)/sessions/active/page.tsx
- [X] T116 [P] [US4] Create StartSessionForm component in src/components/forms/StartSessionForm.tsx
- [X] T117 [P] [US4] Create StackUpdateForm component in src/components/forms/StackUpdateForm.tsx
- [X] T118 [P] [US4] Create RebuyAddonForm component in src/components/forms/RebuyAddonForm.tsx
- [X] T119 [US4] Create SessionEventTimeline component in src/components/session/SessionEventTimeline.tsx

**Checkpoint**: Users can record sessions in real-time with full event tracking

**Implementation Notes** (Phase 7 completed 2025-12):
- SessionEvent schema: Event sourcing pattern with JSONB eventData, sequence ordering
- Event types: session_start, session_resume, session_pause, session_end, player_seated, hand_recorded, hands_passed, stack_update, rebuy, addon
- Single active session constraint: Only one active session per user allowed
- Current stack calculation: Derived from events (buyIn + rebuys + addons, updated by stack_update)
- Elapsed time: Calculated from startTime
- File locations (actual):
  - Schema: src/server/db/schema/sessionEvent.ts
  - Router: src/server/api/routers/sessionEvent.ts
  - Zod schemas: src/server/api/schemas/sessionEvent.schema.ts
  - Active page: src/app/(main)/sessions/active/page.tsx
  - Components: src/app/(main)/sessions/active/ActiveSessionContent.tsx, StartSessionForm.tsx, SessionEventTimeline.tsx

---

## Phase 8: User Story 5 - Track Players at the Table (Priority: P3)

**Goal**: Record opponent information with tags and date-specific notes

**Independent Test**: Create player profiles, add tags and notes, view player history

### Tests for User Story 5 ⚠️

- [ ] T120 [P] [US5] Write unit test for Player schema in tests/unit/server/db/schema/player.test.ts
- [ ] T121 [P] [US5] Write unit test for PlayerTag schema in tests/unit/server/db/schema/playerTag.test.ts
- [ ] T122 [P] [US5] Write unit test for player router in tests/unit/server/api/routers/player.test.ts
- [ ] T123 [P] [US5] Write unit test for playerTag router in tests/unit/server/api/routers/playerTag.test.ts
- [ ] T124 [P] [US5] Write E2E test for player management flow in tests/e2e/player.spec.ts

### Implementation for User Story 5

- [ ] T125 [US5] Create Player schema in src/server/db/schema/player.ts
- [ ] T126 [P] [US5] Create PlayerTag schema in src/server/db/schema/playerTag.ts
- [ ] T127 [P] [US5] Create PlayerTagAssignment junction schema in src/server/db/schema/playerTagAssignment.ts
- [ ] T128 [P] [US5] Create PlayerNote schema in src/server/db/schema/playerNote.ts
- [ ] T129 [US5] Create Zod schemas for player/tag validation in src/server/api/schemas/player.schema.ts
- [ ] T130 [US5] Implement player router in src/server/api/routers/player.ts
- [ ] T131 [US5] Implement playerTag router in src/server/api/routers/playerTag.ts
- [ ] T132 [US5] Add player, playerTag routers to root router in src/server/api/root.ts
- [ ] T133 [P] [US5] Create PlayerListPage with search and tag filter in src/app/(auth)/players/page.tsx
- [ ] T134 [P] [US5] Create PlayerDetailPage in src/app/(auth)/players/[id]/page.tsx
- [ ] T135 [P] [US5] Create PlayerForm component in src/components/forms/PlayerForm.tsx
- [ ] T136 [P] [US5] Create PlayerTagManager component in src/components/player/PlayerTagManager.tsx
- [ ] T137 [US5] Create PlayerNoteForm component in src/components/forms/PlayerNoteForm.tsx

**Checkpoint**: Users can track opponents with tags and notes

---

## Phase 9: User Story 6 - Record Hand Details (Priority: P3)

**Goal**: Detailed hand recording in PHH format with player linking and review flags

**Independent Test**: Record hand with cards, actions, and players; flag for review; view hand history

### Tests for User Story 6 ⚠️

- [ ] T138 [P] [US6] Write unit test for Hand schema in tests/unit/server/db/schema/hand.test.ts
- [ ] T139 [P] [US6] Write unit test for HandSeat schema in tests/unit/server/db/schema/handSeat.test.ts
- [ ] T140 [P] [US6] Write unit test for HandReviewFlag schema in tests/unit/server/db/schema/handReviewFlag.test.ts
- [ ] T141 [P] [US6] Write unit test for hand router in tests/unit/server/api/routers/hand.test.ts
- [ ] T142 [P] [US6] Write unit test for handSeat router in tests/unit/server/api/routers/handSeat.test.ts
- [ ] T143 [P] [US6] Write unit test for handReviewFlag router in tests/unit/server/api/routers/handReviewFlag.test.ts
- [ ] T144 [P] [US6] Write E2E test for hand recording flow in tests/e2e/hand.spec.ts

### Implementation for User Story 6

- [ ] T145 [US6] Create Hand schema (PHH format only, with isDraft field) in src/server/db/schema/hand.ts
- [ ] T146 [P] [US6] Create HandSeat schema in src/server/db/schema/handSeat.ts
- [ ] T147 [P] [US6] Create HandReviewFlag schema in src/server/db/schema/handReviewFlag.ts
- [ ] T148 [P] [US6] Create HandReviewFlagAssignment junction schema in src/server/db/schema/handReviewFlagAssignment.ts
- [ ] T149 [US6] Create Zod schemas for hand/seat/flag validation in src/server/api/schemas/hand.schema.ts
- [ ] T150 [US6] Implement hand router in src/server/api/routers/hand.ts
- [ ] T151 [US6] Implement handSeat router in src/server/api/routers/handSeat.ts
- [ ] T152 [US6] Implement handReviewFlag router in src/server/api/routers/handReviewFlag.ts
- [ ] T153 [US6] Add hand, handSeat, handReviewFlag routers to root router in src/server/api/root.ts
- [ ] T154 [P] [US6] Create HandListPage with flag filter in src/app/(auth)/sessions/[id]/hands/page.tsx
- [ ] T155 [P] [US6] Create HandDetailPage with PHH display in src/app/(auth)/hands/[id]/page.tsx
- [ ] T156 [P] [US6] Create HandForm component for PHH input in src/components/forms/HandForm.tsx
- [ ] T157 [P] [US6] Create HandSeatEditor component in src/components/hand/HandSeatEditor.tsx
- [ ] T158 [US6] Create HandReviewFlagManager component in src/components/hand/HandReviewFlagManager.tsx
- [ ] T159 [US6] Create PHHViewer component for formatted hand history display in src/components/hand/PHHViewer.tsx

**Checkpoint**: Users can record detailed hands with full PHH support

---

## Phase 10: User Story 8 - Responsive Design and Theme Support (Priority: P2)

**Goal**: Mobile-first responsive design with light/dark theme support

**Independent Test**: Access app on different screen sizes, toggle theme, verify preference persistence

### Tests for User Story 8 ⚠️

- [ ] T160 [P] [US8] Write E2E test for responsive layout on mobile viewport in tests/e2e/responsive.spec.ts
- [ ] T161 [P] [US8] Write E2E test for theme toggle and persistence in tests/e2e/theme.spec.ts

### Implementation for User Story 8

- [ ] T162 [US8] Implement responsive navigation (burger menu on mobile) in src/components/layouts/AppShell.tsx
- [ ] T163 [P] [US8] Add responsive breakpoints to all form components using Mantine style props
- [ ] T164 [P] [US8] Add responsive breakpoints to all list/detail pages using visibleFrom/hiddenFrom
- [ ] T165 [US8] Verify theme toggle under 100ms performance (SC-006) in src/components/ui/ThemeToggle.tsx

**Checkpoint**: App is fully responsive and supports light/dark themes

---

## Phase 11: User Story 9 - PWA and Offline Capability (Priority: P3)

**Goal**: Installable PWA with basic offline support

**Independent Test**: Install PWA, verify launch without browser chrome

### Tests for User Story 9 ⚠️

- [ ] T166 [P] [US9] Write E2E test for PWA installation in tests/e2e/pwa.spec.ts
- [ ] T167 [P] [US9] Write E2E test for service worker registration in tests/e2e/pwa.spec.ts

### Implementation for User Story 9

- [ ] T168 [US9] Create web app manifest in src/app/manifest.ts with Japanese app name
- [ ] T169 [US9] Create service worker with cache strategy in public/sw.js
- [ ] T170 [US9] Configure service worker headers in next.config.js
- [ ] T171 [US9] Create ServiceWorkerRegistration component in src/components/ServiceWorkerRegistration.tsx
- [ ] T172 [US9] Add ServiceWorkerRegistration to root layout in src/app/layout.tsx
- [ ] T173 [P] [US9] Create app icons (192x192, 512x512) in public/icons/
- [ ] T174 [US9] Create offline fallback page in src/app/offline/page.tsx

**Checkpoint**: App is installable as PWA with basic offline fallback

---

## Phase 12: Home Dashboard & Statistics

**Purpose**: Home screen with navigation and statistics summary (FR-085, FR-086)

**Dependencies**: Requires US1 (Sessions) and US2 (Currencies) for statistics

- [ ] T175 Write E2E test for dashboard with statistics in tests/e2e/dashboard.spec.ts
- [ ] T176 Create dashboard statistics query (session.getStatistics) in src/server/api/routers/session.ts
- [ ] T177 Create DashboardPage with active session link and statistics in src/app/(auth)/dashboard/page.tsx
- [ ] T178 [P] Create StatsSummary component in src/components/dashboard/StatsSummary.tsx
- [ ] T179 [P] Create PeriodFilter component (今月/先月/全期間/カスタム) in src/components/dashboard/PeriodFilter.tsx
- [ ] T180 [P] Create RecentSessionsList component in src/components/dashboard/RecentSessionsList.tsx

---

## Phase 13: Help Guide & Polish

**Purpose**: User guide pages and cross-cutting concerns (FR-091)

**Dependencies**: All user stories should be complete

- [ ] T181 Create help/guide pages with feature documentation in src/app/(auth)/help/page.tsx
- [ ] T182 [P] Create HelpNavigation component with sections in src/components/help/HelpNavigation.tsx
- [ ] T183 [P] Create individual help content pages for each feature in src/app/(auth)/help/[section]/page.tsx
- [ ] T184 Add rich text editor (@mantine/tiptap) for notes fields in src/components/ui/RichTextEditor.tsx
- [ ] T185 Implement optimistic updates pattern for all mutations in tRPC client
- [ ] T186 Add Japanese error messages to all Zod schemas
- [ ] T187 Implement logging for important operations in src/lib/logger.ts
- [ ] T188 Run full E2E test suite and fix any failures
- [ ] T189 Verify all success criteria (SC-001 through SC-010)
- [ ] T190 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - **US7 (Auth - Phase 3)** MUST complete before other user stories can test data isolation
  - **US2 (Currency - Phase 4)** depends on US7 - required by US1 and US3
  - **US3 (Store/Game - Phase 5)** depends on US2 - required by US1 (sessions need BOTH currencies AND stores/games)
  - **US1 (Session - Phase 6)** depends on US2 AND US3 - provides foundation for US4
  - **US4 (Active Session - Phase 7)** depends on US1 - provides context for US6
  - **US5 (Player - Phase 8)** can proceed independently after Foundation - required by US6
  - **US6 (Hand Recording - Phase 9)** depends on US4 AND US5
  - **US8 (Responsive/Theme - Phase 10)** can proceed after any core features are implemented
  - **US9 (PWA - Phase 11)** can proceed after core features are implemented
- **Dashboard (Phase 12)**: Depends on US1 (Session) and US2 (Currency) for statistics
- **Polish (Phase 13)**: Depends on all user stories being complete

### User Story Dependencies (Updated - Correct Order)

```
[Foundation - Phase 2]
     │
     ├── [US7: Auth - Phase 3] ─────────────────────────────────┐
     │        │                                                 │
     │        │                                                 │
     │        ▼                                                 │
     │   [US2: Currency - Phase 4] ──────────┐                 │
     │        │                               │                 │
     │        ▼                               │                 │
     │   [US3: Store/Game - Phase 5]         │                 │
     │        │                               │                 │
     │        └──────┬────────────────────────┘                 │
     │               │                                          │
     │               ▼                                          │
     │        [US1: Archive Session - Phase 6] 🎯               │
     │               │                                          │
     │               ▼                                          │
     │        [US4: Active Session - Phase 7]                   │
     │               │                                          │
     │               │         ┌────────────────────────────────┤
     │               │         │                                │
     │               │    [US5: Player - Phase 8]               │
     │               │         │                                │
     │               └────┬────┘                                │
     │                    │                                     │
     │                    ▼                                     │
     │             [US6: Hand Recording - Phase 9]              │
     │                                                          │
     ├── [US8: Responsive/Theme - Phase 10] ◄──────────────────┤
     │                                                          │
     └── [US9: PWA - Phase 11] ◄───────────────────────────────┘

[Dashboard - Phase 12] depends on US1 + US2
[Polish - Phase 13] depends on ALL user stories
```

**Key Insight**: Sessions (US1) are always tied to both currencies (US2) AND stores/games (US3), so US3 MUST complete before US1 can start.

### Within Each User Story

1. Tests MUST be written and FAIL before implementation
2. Schema before router
3. Router before UI components
4. Core implementation before integration
5. Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Tests for a user story marked [P] can run in parallel
- UI components for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (respecting dependencies)

---

## Parallel Example: User Story 1 ✅ COMPLETED

```bash
# All tests for User Story 1 have been completed:
# - tests/unit/server/db/schema/session.test.ts ✅
# - tests/unit/server/db/schema/allIn.test.ts ✅
# - tests/unit/server/api/routers/session.test.ts ✅
# - tests/unit/server/api/routers/allIn.test.ts ✅
# - tests/integration/session/allInEv.test.ts ✅
# - tests/e2e/session-archive.spec.ts ✅

# All UI components have been completed:
# - src/app/(main)/sessions/page.tsx ✅
# - src/app/(main)/sessions/[id]/page.tsx ✅
# - src/app/(main)/sessions/new/NewSessionContent.tsx ✅
# - AllInRecordForm integrated in SessionDetailContent.tsx ✅
```

---

## Implementation Strategy

### MVP First (Corrected Order: User Stories 7, 2, 3, 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 7 (Authentication)
4. Complete Phase 4: User Story 2 (Currency Management)
5. Complete Phase 5: User Story 3 (Stores and Games)
6. Complete Phase 6: User Story 1 (Archive Session Recording)
7. **STOP and VALIDATE**: Test MVP independently - users can log in, manage currencies, register venues with games, and record completed sessions with all-in EV tracking

**MVP Delivers**: Full poker session tracking with venue/game management, currency tracking, and session profit/loss analysis.

### Incremental Delivery

1. **MVP** (Auth + Currency + Stores/Games + Archive Session) → Deploy/Demo
2. Add User Story 4 (Active Session Recording) → Deploy/Demo
3. Add User Story 5 (Player Tracking) → Deploy/Demo
4. Add User Story 6 (Hand Recording) → Deploy/Demo
5. Add User Story 8 (Responsive/Theme) → Deploy/Demo
6. Add User Story 9 (PWA) → Deploy/Demo
7. Add Dashboard and Help pages → Final Deploy

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD is MANDATORY**: Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All UI text MUST be in Japanese per constitution
- Use Mantine v8 defaults, no custom design tokens
- Use Bun as package manager (not npm/pnpm)
