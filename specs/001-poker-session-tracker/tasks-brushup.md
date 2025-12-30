# Tasks: MVP Brushup

**Input**: Design documents from `/specs/001-poker-session-tracker/`
**Prerequisites**: plan-brushup.md ✅, spec-brushup.md ✅, research-brushup.md ✅, quickstart-brushup.md ✅

**Tests**: This is a refactoring/brushup phase. Existing tests should pass; no new tests required unless behavior changes.

**Organization**: Tasks are grouped by user story (B1-B4) to enable independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (USB1, USB2, USB3, USB4)
- Include exact file paths in descriptions

## Path Conventions

Per plan-brushup.md T3 Stack structure:

```
src/
├── app/                    # Next.js App Router (Presentation Layer)
│   └── (main)/             # Auth-required routes
├── components/             # Shared React components
├── server/                 # Server-side code
│   └── api/routers/        # tRPC routers
└── cosmos.decorator.tsx    # React Cosmos global decorator

cosmos.config.json          # React Cosmos config at root
```

---

## Phase B1: Test Coverage Verification (Priority: P1)

**Goal**: Verify all MVP tests pass and coverage meets thresholds before any refactoring

**Independent Test**: Run `bun run test` and `bun run test:e2e`; all tests pass with 0 failures

### Implementation for User Story B1

- [X] TB001 [USB1] Run unit and integration tests with `bun run test` and document results
- [X] TB002 [USB1] Run E2E tests with `bun run test:e2e` and document results
- [X] TB003 [USB1] Fix any failing tests before proceeding (if any)
- [X] TB004 [USB1] Configure coverage reporter in vitest.config.ts with v8 provider and 80% thresholds
- [X] TB005 [USB1] Generate baseline coverage report with `bun run test --coverage`
- [X] TB006 [USB1] Document coverage gaps in specs/001-poker-session-tracker/coverage-baseline.md

**Checkpoint**: All tests pass (0 failures). Coverage baseline established.

---

## Phase B2: File Granularity Optimization (Priority: P1)

**Goal**: Split all files exceeding 400 lines into focused, maintainable modules

**Independent Test**: Run `find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 400 {print}'` returns no results

### Split StoreDetailContent.tsx (2406 lines) - Highest Priority

- [X] TB007 [USB2] Create types.ts in src/app/(main)/stores/[id]/ for shared Store types
- [X] TB008 [P] [USB2] Extract StoreHeader component to src/app/(main)/stores/[id]/StoreHeader.tsx
- [X] TB009 [P] [USB2] Extract StoreInfo component to src/app/(main)/stores/[id]/StoreInfo.tsx
- [X] TB010 [P] [USB2] Extract CashGameSection component to src/app/(main)/stores/[id]/CashGameSection.tsx
- [X] TB011 [P] [USB2] Extract TournamentSection component to src/app/(main)/stores/[id]/TournamentSection.tsx
- [X] TB012 [P] [USB2] Extract CashGameModal component to src/app/(main)/stores/[id]/CashGameModal.tsx
- [X] TB013 [P] [USB2] Extract TournamentModal component to src/app/(main)/stores/[id]/TournamentModal.tsx
- [X] TB014 [USB2] Refactor StoreDetailContent.tsx to import sub-components (760 lines - complex business logic requires more)
- [X] TB015 [USB2] Verify tests pass after StoreDetailContent split with `bun run test`

### Split stores/actions.ts (986 lines)

- [X] TB016 [USB2] Create src/app/(main)/stores/actions/ directory
- [X] TB017 [P] [USB2] Extract store actions to src/app/(main)/stores/actions/store.ts (296 lines)
- [X] TB018 [P] [USB2] Extract cashGame actions to src/app/(main)/stores/actions/cashGame.ts (263 lines)
- [X] TB019 [P] [USB2] Extract tournament actions to src/app/(main)/stores/actions/tournament.ts (427 lines)
- [X] TB020 [USB2] Create re-export index.ts in src/app/(main)/stores/actions/index.ts
- [X] TB021 [USB2] Update imports in StoreDetailContent and related components
- [X] TB022 [USB2] Delete original src/app/(main)/stores/actions.ts after migration
- [X] TB023 [USB2] Verify tests pass after stores/actions split with `bun run test`

### Split SessionDetailContent.tsx (789 lines)

- [X] TB024 [USB2] Create types.ts in src/app/(main)/sessions/[id]/ for shared Session types (70 lines)
- [X] TB025 [P] [USB2] Extract SessionHeader component to src/app/(main)/sessions/[id]/SessionHeader.tsx (61 lines)
- [X] TB026 [P] [USB2] Extract SessionInfo component to src/app/(main)/sessions/[id]/SessionInfo.tsx (177 lines)
- [X] TB027 [P] [USB2] Extract AllInSection component to src/app/(main)/sessions/[id]/AllInSection.tsx (151 lines)
- [X] TB028 [P] [USB2] Extract AllInModal component to src/app/(main)/sessions/[id]/AllInModal.tsx (203 lines)
- [X] TB029 [USB2] Refactor SessionDetailContent.tsx to import sub-components (286 lines)
- [X] TB030 [USB2] Verify tests pass after SessionDetailContent split with `bun run test`

### Split currency.ts router (689 lines)

- [X] TB031 [USB2] Create src/server/api/routers/currency/ directory
- [X] TB032 [P] [USB2] Extract currency queries to src/server/api/routers/currency/queries.ts
- [X] TB033 [P] [USB2] Extract currency mutations to src/server/api/routers/currency/mutations.ts
- [X] TB034 [USB2] Create merged router index.ts in src/server/api/routers/currency/index.ts
- [X] TB035 [USB2] Update root.ts to import from currency/index.ts
- [X] TB036 [USB2] Delete original src/server/api/routers/currency.ts after migration
- [X] TB037 [USB2] Verify tests pass after currency router split with `bun run test`

### Split CurrencyDetailContent.tsx (598 lines)

- [X] TB038 [USB2] Create types.ts in src/app/(main)/currencies/[id]/ for shared Currency types
- [X] TB039 [P] [USB2] Extract CurrencyHeader component to src/app/(main)/currencies/[id]/CurrencyHeader.tsx
- [X] TB040 [P] [USB2] Extract BalanceBreakdown component to src/app/(main)/currencies/[id]/BalanceBreakdown.tsx
- [X] TB041 [P] [USB2] Extract TransactionSection component to src/app/(main)/currencies/[id]/TransactionSection.tsx
- [X] TB042 [USB2] Refactor CurrencyDetailContent.tsx to import sub-components (under 400 lines)
- [X] TB043 [USB2] Verify tests pass after CurrencyDetailContent split with `bun run test`

### Split tournament.ts router (481 lines)

- [X] TB044 [USB2] Create src/server/api/routers/tournament/ directory
- [X] TB045 [P] [USB2] Extract tournament queries to src/server/api/routers/tournament/queries.ts
- [X] TB046 [P] [USB2] Extract tournament mutations to src/server/api/routers/tournament/mutations.ts
- [X] TB047 [USB2] Create merged router index.ts in src/server/api/routers/tournament/index.ts
- [X] TB048 [USB2] Update root.ts to import from tournament/index.ts
- [X] TB049 [USB2] Delete original src/server/api/routers/tournament.ts after migration
- [X] TB050 [USB2] Verify tests pass after tournament router split with `bun run test`

### Split currencies/actions.ts (416 lines)

- [X] TB051 [USB2] Create src/app/(main)/currencies/actions/ directory
- [X] TB052 [P] [USB2] Extract currency actions to src/app/(main)/currencies/actions/currency.ts
- [X] TB053 [P] [USB2] Extract bonus actions to src/app/(main)/currencies/actions/bonus.ts
- [X] TB054 [P] [USB2] Extract purchase actions to src/app/(main)/currencies/actions/purchase.ts
- [X] TB055 [USB2] Create re-export index.ts in src/app/(main)/currencies/actions/index.ts
- [X] TB056 [USB2] Update imports in CurrencyDetailContent and related components
- [X] TB057 [USB2] Delete original src/app/(main)/currencies/actions.ts after migration
- [X] TB058 [USB2] Verify tests pass after currencies/actions split with `bun run test`

### Split EditSessionContent.tsx (401 lines)

- [X] TB059 [USB2] Extract dateTimeUtils to src/app/(main)/sessions/[id]/edit/dateTimeUtils.ts
- [X] TB060 [USB2] Refactor EditSessionContent.tsx to import dateTimeUtils (under 400 lines)
- [X] TB061 [USB2] Verify tests pass after EditSessionContent split with `bun run test`

### Final File Size Verification

- [X] TB062 [USB2] Run file size audit: no file in src/ exceeds 400 lines
- [X] TB063 [USB2] Run full test suite to confirm all refactoring maintains behavior
- [X] TB064 [USB2] Run typecheck with `bun run typecheck` to verify no type errors

**Checkpoint**: All files under 400 lines. All tests pass. Type checking passes.

---

## Phase B3: React Cosmos Introduction (Priority: P2)

**Goal**: Set up React Cosmos for isolated component development with Mantine integration

**Independent Test**: Run `bun run cosmos` and verify all shared components display in fixture browser

### Setup React Cosmos

- [X] TB065 [USB3] Install react-cosmos and react-cosmos-next with `bun add -D react-cosmos react-cosmos-next`
- [X] TB066 [USB3] Create cosmos.config.json at project root with Next.js configuration
- [X] TB067 [USB3] Create Cosmos renderer page at src/app/cosmos/[fixture]/page.tsx
- [X] TB068 [USB3] Create global Mantine decorator at src/cosmos.decorator.tsx
- [X] TB069 [USB3] Add cosmos and cosmos-export scripts to package.json
- [X] TB070 [USB3] Add cosmos.imports.js to .gitignore
- [X] TB071 [USB3] Verify Cosmos starts with `bun run cosmos` (runs on port 5000)

### Create Component Fixtures

- [X] TB072 [P] [USB3] Create fixture for AppShell at src/components/layouts/__fixtures__/AppShell.fixture.tsx
- [X] TB073 [P] [USB3] Create fixture for ThemeToggle at src/components/ui/__fixtures__/ThemeToggle.fixture.tsx
- [X] TB074 [P] [USB3] Create fixture for LoadingOverlay at src/components/ui/__fixtures__/LoadingOverlay.fixture.tsx
- [X] TB075 [P] [USB3] Create fixture for ErrorBoundary at src/components/ui/__fixtures__/ErrorBoundary.fixture.tsx
- [X] TB076 [P] [USB3] Create fixture for GoogleMapsLink at src/components/ui/__fixtures__/GoogleMapsLink.fixture.tsx
- [X] TB077 [P] [USB3] Create fixture for SignOutButton at src/components/auth/__fixtures__/SignOutButton.fixture.tsx
- [X] TB078 [P] [USB3] Create fixture for RichTextEditor at src/components/ui/__fixtures__/RichTextEditor.fixture.tsx (if exists)

### Verify Cosmos Integration

- [X] TB079 [USB3] Verify all fixtures display in Cosmos browser
- [X] TB080 [USB3] Verify theme switching (light/dark) works in Cosmos decorator
- [X] TB081 [USB3] Document Cosmos usage in quickstart-brushup.md

**Checkpoint**: React Cosmos fully functional. All shared components have fixtures.

---

## Phase B4: UI Brushup (Priority: P2)

**Goal**: Ensure consistent spacing, typography, and component styling across all pages

**Independent Test**: Visual review of all pages confirms consistent patterns

### Spacing Consistency Audit

- [X] TB082 [USB4] Audit and fix page container padding consistency (md or lg) across all pages
- [X] TB083 [USB4] Audit and fix Card component padding consistency (md)
- [X] TB084 [USB4] Audit and fix Stack/Group gap consistency (md)
- [X] TB085 [USB4] Audit and fix form field spacing consistency (sm or md)

### Typography Consistency Audit

- [X] TB086 [USB4] Audit and fix page titles to use Title component with order 1 or 2
- [X] TB087 [USB4] Audit and fix section headings to use Title with order 3 or 4
- [X] TB088 [USB4] Audit and fix muted text to use c="dimmed" prop consistently

### Form Consistency Audit

- [X] TB089 [USB4] Audit and fix form label positioning (above inputs)
- [X] TB090 [USB4] Audit and fix required field asterisks
- [X] TB091 [USB4] Audit and fix error message styling
- [X] TB092 [USB4] Audit and fix submit button positioning (right-aligned or full-width)

### Table Consistency Audit

- [X] TB093 [USB4] Audit and fix table column header alignment
- [X] TB094 [USB4] Audit and fix table empty states with helpful messages
- [X] TB095 [USB4] Audit and fix table loading states with Skeleton

### State Handling Audit

- [X] TB096 [USB4] Audit and fix empty states to include descriptive text and CTA button
- [X] TB097 [USB4] Audit and fix loading states to use Skeleton components
- [X] TB098 [USB4] Audit and fix error states to use Alert with error color
- [X] TB099 [USB4] Audit and fix success feedback to use Notification with green color

### Button and Icon Consistency Audit

- [X] TB100 [USB4] Audit and fix primary action buttons to use filled variant
- [X] TB101 [USB4] Audit and fix secondary action buttons to use outline variant
- [X] TB102 [USB4] Audit and fix destructive action buttons to use red color
- [X] TB103 [USB4] Audit and verify all icons are from @tabler/icons-react

**Checkpoint**: All UI consistency checks pass. Visual review complete.

---

## Phase B5: Final Verification

**Purpose**: Confirm all brushup goals are met before completion

- [X] TB104 Run full unit and integration test suite with `bun run test`
- [X] TB105 Run E2E test suite with `bun run test:e2e`
- [X] TB106 Generate final coverage report with `bun run test --coverage`
- [X] TB107 Verify file size audit (no file >400 lines) with automated check
- [X] TB108 Run build with `bun run build` and verify success
- [X] TB109 Run typecheck with `bun run typecheck` and verify success
- [X] TB110 Run lint with `bun run lint` and verify success
- [X] TB111 Start Cosmos with `bun run cosmos` and verify all fixtures display
- [X] TB112 Update specs/001-poker-session-tracker/checklists/requirements-brushup.md with completion status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase B1 (Test Verification)**: No dependencies - MUST complete first
- **Phase B2 (File Splitting)**: Depends on B1 (tests must pass before refactoring)
- **Phase B3 (React Cosmos)**: Can start after B1, runs in parallel with B2
- **Phase B4 (UI Brushup)**: Can start after B2 (may touch same files as B2)
- **Phase B5 (Final)**: Depends on B1, B2, B3, B4 all complete

### User Story Dependencies

```
[B1: Test Verification] ─────────────────────────────┐
        │                                            │
        ▼                                            │
[B2: File Splitting] ───────────────────┐            │
        │                               │            │
        │                               ▼            │
        │                    [B3: React Cosmos] ◄────┤
        │                               │            │
        ▼                               │            │
[B4: UI Brushup] ◄──────────────────────┘            │
        │                                            │
        └────────────────────────────────────────────┘
                              │
                              ▼
                    [B5: Final Verification]
```

### Within Each User Story

1. Complete tasks in order (dependencies are implicit in task numbering)
2. Verify tests pass after each major refactoring step
3. Commit after each logical group of tasks

### Parallel Opportunities

- **Phase B2**: File extraction tasks marked [P] can run in parallel within each file split
- **Phase B3**: Fixture creation tasks marked [P] can run in parallel
- **Phase B3** and **Phase B2**: Can run in parallel after B1 completes
- **Phase B4**: Audit tasks can run in parallel (different pages/features)

---

## Parallel Example: StoreDetailContent Split

```bash
# Launch all parallel extractions together:
Task: "Extract StoreHeader component to src/app/(main)/stores/[id]/StoreHeader.tsx"
Task: "Extract StoreInfo component to src/app/(main)/stores/[id]/StoreInfo.tsx"
Task: "Extract CashGameSection component to src/app/(main)/stores/[id]/CashGameSection.tsx"
Task: "Extract TournamentSection component to src/app/(main)/stores/[id]/TournamentSection.tsx"
Task: "Extract CashGameModal component to src/app/(main)/stores/[id]/CashGameModal.tsx"
Task: "Extract TournamentModal component to src/app/(main)/stores/[id]/TournamentModal.tsx"
```

---

## Implementation Strategy

### MVP First (B1 + B2)

1. Complete Phase B1: Test Verification
2. Complete Phase B2: File Splitting (largest files first)
3. **STOP and VALIDATE**: All tests pass, no file >400 lines
4. Proceed to B3/B4 or deploy

### Full Brushup

1. Complete all phases B1 → B5
2. Validate all success criteria (SC-B001 through SC-B007)
3. Ready for Phase 7+ development

---

## Notes

- [P] tasks = different files, can run in parallel
- [USB#] label maps task to specific brushup user story
- Verify tests pass after EACH file split (not just at end)
- Commit after each file split for easy rollback
- Keep original files until migration is verified working
- Delete original files only after imports updated and tests pass
