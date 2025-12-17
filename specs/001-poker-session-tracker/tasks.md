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

## Phase 5: User Story 1 - Record a Completed Session (Archive Recording) (Priority: P1) 🎯 MVP Core

**Goal**: Quick logging of completed sessions with store, game, buy-in, cashout, and all-in EV tracking

**Independent Test**: Create session with store/game/currency, add all-in records, verify profit/loss and EV calculations

### Tests for User Story 1 ⚠️

- [ ] T063 [P] [US1] Write unit test for PokerSession schema in tests/unit/server/db/schema/session.test.ts
- [ ] T064 [P] [US1] Write unit test for AllInRecord schema in tests/unit/server/db/schema/allIn.test.ts
- [ ] T065 [P] [US1] Write unit test for session router in tests/unit/server/api/routers/session.test.ts
- [ ] T066 [P] [US1] Write unit test for allIn router in tests/unit/server/api/routers/allIn.test.ts
- [ ] T067 [P] [US1] Write integration test for session with all-in EV calculation in tests/integration/session/allInEv.test.ts
- [ ] T068 [P] [US1] Write E2E test for archive session recording flow in tests/e2e/session-archive.spec.ts

### Implementation for User Story 1

- [ ] T069 [US1] Create PokerSession schema in src/server/db/schema/session.ts
- [ ] T070 [US1] Create AllInRecord schema with winProbability decimal(5,2) in src/server/db/schema/allInRecord.ts
- [ ] T071 [US1] Create Zod schemas for session validation in src/server/api/schemas/session.schema.ts
- [ ] T072 [US1] Create Zod schemas for allIn validation in src/server/api/schemas/allIn.schema.ts
- [ ] T073 [US1] Implement session router (list, getById, createArchive, update, delete) in src/server/api/routers/session.ts
- [ ] T074 [US1] Implement allIn router (listBySession, create, update, delete) in src/server/api/routers/allIn.ts
- [ ] T075 [US1] Add session and allIn routers to root router in src/server/api/root.ts
- [ ] T076 [P] [US1] Create SessionListPage with pagination in src/app/(auth)/sessions/page.tsx
- [ ] T077 [P] [US1] Create SessionDetailPage in src/app/(auth)/sessions/[id]/page.tsx
- [ ] T078 [P] [US1] Create ArchiveSessionForm component in src/components/forms/ArchiveSessionForm.tsx
- [ ] T079 [P] [US1] Create AllInRecordForm component in src/components/forms/AllInRecordForm.tsx
- [ ] T080 [US1] Create AllInSummary component (count, pot total, avg win rate, EV, actual result, EV差分) in src/components/session/AllInSummary.tsx
- [ ] T081 [US1] Add empty state handling in ArchiveSessionForm when no stores exist (prompt to create store first) in src/components/forms/ArchiveSessionForm.tsx

**Checkpoint**: Users can record archive sessions with full all-in EV tracking

---

## Phase 6: User Story 3 - Manage Stores and Games (Priority: P2)

**Goal**: Register poker venues with location and manage cash games/tournaments at each venue

**Independent Test**: Create store with location, add cash games and tournaments, view store details

### Tests for User Story 3 ⚠️

- [ ] T082 [P] [US3] Write unit test for Store schema in tests/unit/server/db/schema/store.test.ts
- [ ] T083 [P] [US3] Write unit test for CashGame schema in tests/unit/server/db/schema/cashGame.test.ts
- [ ] T084 [P] [US3] Write unit test for Tournament schema in tests/unit/server/db/schema/tournament.test.ts
- [ ] T085 [P] [US3] Write unit test for store router in tests/unit/server/api/routers/store.test.ts
- [ ] T086 [P] [US3] Write unit test for cashGame router in tests/unit/server/api/routers/cashGame.test.ts
- [ ] T087 [P] [US3] Write unit test for tournament router in tests/unit/server/api/routers/tournament.test.ts
- [ ] T088 [P] [US3] Write E2E test for store and game management flow in tests/e2e/store.spec.ts

### Implementation for User Story 3

- [ ] T089 [US3] Create Store schema with Google Maps fields (latitude, longitude, placeId) in src/server/db/schema/store.ts
- [ ] T090 [US3] Create CashGame schema with explicit blind/ante fields in src/server/db/schema/cashGame.ts
- [ ] T091 [US3] Create Tournament schema in src/server/db/schema/tournament.ts
- [ ] T092 [P] [US3] Create TournamentPrizeLevel schema in src/server/db/schema/tournamentPrizeLevel.ts
- [ ] T093 [P] [US3] Create TournamentBlindLevel schema in src/server/db/schema/tournamentBlindLevel.ts
- [ ] T094 [US3] Create Google Maps URL generator utility in src/lib/google-maps.ts
- [ ] T095 [US3] Create Zod schemas for store, cashGame, tournament validation in src/server/api/schemas/store.schema.ts
- [ ] T096 [US3] Implement store router in src/server/api/routers/store.ts
- [ ] T097 [US3] Implement cashGame router in src/server/api/routers/cashGame.ts
- [ ] T098 [US3] Implement tournament router (including setPrizeLevels, setBlindLevels) in src/server/api/routers/tournament.ts
- [ ] T099 [US3] Add store, cashGame, tournament routers to root router in src/server/api/root.ts
- [ ] T100 [P] [US3] Create StoreListPage in src/app/(auth)/stores/page.tsx
- [ ] T101 [P] [US3] Create StoreDetailPage in src/app/(auth)/stores/[id]/page.tsx
- [ ] T102 [P] [US3] Create StoreForm component in src/components/forms/StoreForm.tsx
- [ ] T103 [P] [US3] Create CashGameForm component in src/components/forms/CashGameForm.tsx
- [ ] T104 [P] [US3] Create TournamentForm component (with prize/blind level editors) in src/components/forms/TournamentForm.tsx
- [ ] T105 [US3] Create GoogleMapsLink component in src/components/ui/GoogleMapsLink.tsx

**Checkpoint**: Users can manage stores with location and games

---

## Phase 7: User Story 8 - Responsive Design and Theme Support (Priority: P2)

**Goal**: Mobile-first responsive design with light/dark theme support

**Independent Test**: Access app on different screen sizes, toggle theme, verify preference persistence

### Tests for User Story 8 ⚠️

- [ ] T106 [P] [US8] Write E2E test for responsive layout on mobile viewport in tests/e2e/responsive.spec.ts
- [ ] T107 [P] [US8] Write E2E test for theme toggle and persistence in tests/e2e/theme.spec.ts

### Implementation for User Story 8

- [ ] T108 [US8] Implement responsive navigation (burger menu on mobile) in src/components/layouts/AppShell.tsx
- [ ] T109 [P] [US8] Add responsive breakpoints to all form components using Mantine style props
- [ ] T110 [P] [US8] Add responsive breakpoints to all list/detail pages using visibleFrom/hiddenFrom
- [ ] T111 [US8] Verify theme toggle under 100ms performance (SC-006) in src/components/ui/ThemeToggle.tsx

**Checkpoint**: App is fully responsive and supports light/dark themes

---

## Phase 8: User Story 4 - Active Session Recording (Priority: P2)

**Goal**: Real-time session recording with player tracking, hand recording, and stack progression

**Independent Test**: Start active session, record hands and stack changes, end session with cashout

### Tests for User Story 4 ⚠️

- [ ] T112 [P] [US4] Write unit test for SessionEvent schema in tests/unit/server/db/schema/sessionEvent.test.ts
- [ ] T113 [P] [US4] Write unit test for sessionEvent router in tests/unit/server/api/routers/sessionEvent.test.ts
- [ ] T114 [P] [US4] Write integration test for active session state transitions in tests/integration/session/active.test.ts
- [ ] T115 [P] [US4] Write E2E test for active session flow in tests/e2e/session-active.spec.ts

### Implementation for User Story 4

- [ ] T116 [US4] Create SessionEvent schema with JSONB eventData in src/server/db/schema/sessionEvent.ts
- [ ] T117 [US4] Create Zod schemas for each event type validation in src/server/api/schemas/sessionEvent.schema.ts
- [ ] T118 [US4] Implement sessionEvent router (startSession, pauseSession, resumeSession, endSession, seatPlayer, recordHand, recordHandsPassed, updateStack, recordRebuy, recordAddon) in src/server/api/routers/sessionEvent.ts
- [ ] T119 [US4] Add sessionEvent router to root router in src/server/api/root.ts
- [ ] T120 [US4] Update session.createArchive to validate only one active session per user in src/server/api/routers/session.ts
- [ ] T121 [P] [US4] Create ActiveSessionPage with real-time event display in src/app/(auth)/sessions/active/page.tsx
- [ ] T122 [P] [US4] Create StartSessionForm component in src/components/forms/StartSessionForm.tsx
- [ ] T123 [P] [US4] Create StackUpdateForm component in src/components/forms/StackUpdateForm.tsx
- [ ] T124 [P] [US4] Create RebuyAddonForm component in src/components/forms/RebuyAddonForm.tsx
- [ ] T125 [US4] Create SessionEventTimeline component in src/components/session/SessionEventTimeline.tsx

**Checkpoint**: Users can record sessions in real-time with full event tracking

---

## Phase 9: User Story 5 - Track Players at the Table (Priority: P3)

**Goal**: Record opponent information with tags and date-specific notes

**Independent Test**: Create player profiles, add tags and notes, view player history

### Tests for User Story 5 ⚠️

- [ ] T126 [P] [US5] Write unit test for Player schema in tests/unit/server/db/schema/player.test.ts
- [ ] T127 [P] [US5] Write unit test for PlayerTag schema in tests/unit/server/db/schema/playerTag.test.ts
- [ ] T128 [P] [US5] Write unit test for player router in tests/unit/server/api/routers/player.test.ts
- [ ] T129 [P] [US5] Write unit test for playerTag router in tests/unit/server/api/routers/playerTag.test.ts
- [ ] T130 [P] [US5] Write E2E test for player management flow in tests/e2e/player.spec.ts

### Implementation for User Story 5

- [ ] T131 [US5] Create Player schema in src/server/db/schema/player.ts
- [ ] T132 [P] [US5] Create PlayerTag schema in src/server/db/schema/playerTag.ts
- [ ] T133 [P] [US5] Create PlayerTagAssignment junction schema in src/server/db/schema/playerTagAssignment.ts
- [ ] T134 [P] [US5] Create PlayerNote schema in src/server/db/schema/playerNote.ts
- [ ] T135 [US5] Create Zod schemas for player/tag validation in src/server/api/schemas/player.schema.ts
- [ ] T136 [US5] Implement player router in src/server/api/routers/player.ts
- [ ] T137 [US5] Implement playerTag router in src/server/api/routers/playerTag.ts
- [ ] T138 [US5] Add player, playerTag routers to root router in src/server/api/root.ts
- [ ] T139 [P] [US5] Create PlayerListPage with search and tag filter in src/app/(auth)/players/page.tsx
- [ ] T140 [P] [US5] Create PlayerDetailPage in src/app/(auth)/players/[id]/page.tsx
- [ ] T141 [P] [US5] Create PlayerForm component in src/components/forms/PlayerForm.tsx
- [ ] T142 [P] [US5] Create PlayerTagManager component in src/components/player/PlayerTagManager.tsx
- [ ] T143 [US5] Create PlayerNoteForm component in src/components/forms/PlayerNoteForm.tsx

**Checkpoint**: Users can track opponents with tags and notes

---

## Phase 10: User Story 6 - Record Hand Details (Priority: P3)

**Goal**: Detailed hand recording in PHH format with player linking and review flags

**Independent Test**: Record hand with cards, actions, and players; flag for review; view hand history

### Tests for User Story 6 ⚠️

- [ ] T144 [P] [US6] Write unit test for Hand schema in tests/unit/server/db/schema/hand.test.ts
- [ ] T145 [P] [US6] Write unit test for HandSeat schema in tests/unit/server/db/schema/handSeat.test.ts
- [ ] T146 [P] [US6] Write unit test for HandReviewFlag schema in tests/unit/server/db/schema/handReviewFlag.test.ts
- [ ] T147 [P] [US6] Write unit test for hand router in tests/unit/server/api/routers/hand.test.ts
- [ ] T148 [P] [US6] Write unit test for handSeat router in tests/unit/server/api/routers/handSeat.test.ts
- [ ] T149 [P] [US6] Write unit test for handReviewFlag router in tests/unit/server/api/routers/handReviewFlag.test.ts
- [ ] T150 [P] [US6] Write E2E test for hand recording flow in tests/e2e/hand.spec.ts

### Implementation for User Story 6

- [ ] T151 [US6] Create Hand schema (PHH format only, with isDraft field) in src/server/db/schema/hand.ts
- [ ] T152 [P] [US6] Create HandSeat schema in src/server/db/schema/handSeat.ts
- [ ] T153 [P] [US6] Create HandReviewFlag schema in src/server/db/schema/handReviewFlag.ts
- [ ] T154 [P] [US6] Create HandReviewFlagAssignment junction schema in src/server/db/schema/handReviewFlagAssignment.ts
- [ ] T155 [US6] Create Zod schemas for hand/seat/flag validation in src/server/api/schemas/hand.schema.ts
- [ ] T156 [US6] Implement hand router in src/server/api/routers/hand.ts
- [ ] T157 [US6] Implement handSeat router in src/server/api/routers/handSeat.ts
- [ ] T158 [US6] Implement handReviewFlag router in src/server/api/routers/handReviewFlag.ts
- [ ] T159 [US6] Add hand, handSeat, handReviewFlag routers to root router in src/server/api/root.ts
- [ ] T160 [P] [US6] Create HandListPage with flag filter in src/app/(auth)/sessions/[id]/hands/page.tsx
- [ ] T161 [P] [US6] Create HandDetailPage with PHH display in src/app/(auth)/hands/[id]/page.tsx
- [ ] T162 [P] [US6] Create HandForm component for PHH input in src/components/forms/HandForm.tsx
- [ ] T163 [P] [US6] Create HandSeatEditor component in src/components/hand/HandSeatEditor.tsx
- [ ] T164 [US6] Create HandReviewFlagManager component in src/components/hand/HandReviewFlagManager.tsx
- [ ] T165 [US6] Create PHHViewer component for formatted hand history display in src/components/hand/PHHViewer.tsx

**Checkpoint**: Users can record detailed hands with full PHH support

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

- [ ] T175 Write E2E test for dashboard with statistics in tests/e2e/dashboard.spec.ts
- [ ] T176 Create dashboard statistics query (session.getStatistics) in src/server/api/routers/session.ts
- [ ] T177 Create DashboardPage with active session link and statistics in src/app/(auth)/dashboard/page.tsx
- [ ] T178 [P] Create StatsSummary component in src/components/dashboard/StatsSummary.tsx
- [ ] T179 [P] Create PeriodFilter component (今月/先月/全期間/カスタム) in src/components/dashboard/PeriodFilter.tsx
- [ ] T180 [P] Create RecentSessionsList component in src/components/dashboard/RecentSessionsList.tsx

---

## Phase 13: Help Guide & Polish

**Purpose**: User guide pages and cross-cutting concerns (FR-091)

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
  - US7 (Auth) MUST complete before other user stories can test data isolation
  - US2 (Currency) and US3 (Store/Game) should complete before US1 (Session)
  - US1 (Session) provides foundation for US4 (Active Session)
  - US4 (Active Session) provides context for US6 (Hand Recording)
  - US5 (Player) can proceed independently after Foundation
- **Dashboard (Phase 12)**: Depends on US1 (Session) for statistics
- **Polish (Phase 13)**: Depends on all user stories being complete

### User Story Dependencies

```
[Foundation]
     │
     ├── [US7: Auth] ──────────────────────────────────────┐
     │        │                                            │
     │        ├── [US2: Currency] ─┐                       │
     │        │                    │                       │
     │        ├── [US3: Store/Game]├── [US1: Session] ─────┤
     │        │                    │        │              │
     │        └────────────────────┘        │              │
     │                                      ▼              │
     │                              [US4: Active Session]  │
     │                                      │              │
     │                                      ▼              │
     ├── [US5: Player] ────────────► [US6: Hand Recording] │
     │                                                     │
     ├── [US8: Responsive/Theme] ◄─────────────────────────┤
     │                                                     │
     └── [US9: PWA] ◄──────────────────────────────────────┘
```

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

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit test for PokerSession schema in tests/unit/server/db/schema/session.test.ts"
Task: "Write unit test for AllInRecord schema in tests/unit/server/db/schema/allIn.test.ts"
Task: "Write unit test for session router in tests/unit/server/api/routers/session.test.ts"
Task: "Write unit test for allIn router in tests/unit/server/api/routers/allIn.test.ts"
Task: "Write integration test for session with all-in EV calculation in tests/integration/session/allInEv.test.ts"
Task: "Write E2E test for archive session recording flow in tests/e2e/session-archive.spec.ts"

# Launch all UI components together (after router implementation):
Task: "Create SessionListPage with pagination in src/app/(auth)/sessions/page.tsx"
Task: "Create SessionDetailPage in src/app/(auth)/sessions/[id]/page.tsx"
Task: "Create ArchiveSessionForm component in src/components/forms/ArchiveSessionForm.tsx"
Task: "Create AllInRecordForm component in src/components/forms/AllInRecordForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 7, 2, 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 7 (Authentication)
4. Complete Phase 4: User Story 2 (Currency)
5. Complete Phase 5: User Story 1 (Archive Session)
6. **STOP and VALIDATE**: Test MVP independently - users can log in, manage currencies, record sessions

### Incremental Delivery

1. MVP (Auth + Currency + Archive Session) → Deploy/Demo
2. Add User Story 3 (Stores/Games) → Deploy/Demo
3. Add User Story 8 (Responsive/Theme) → Deploy/Demo
4. Add User Story 4 (Active Session) → Deploy/Demo
5. Add User Story 5 (Players) → Deploy/Demo
6. Add User Story 6 (Hand Recording) → Deploy/Demo
7. Add User Story 9 (PWA) → Deploy/Demo
8. Add Dashboard and Help pages → Final Deploy

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
