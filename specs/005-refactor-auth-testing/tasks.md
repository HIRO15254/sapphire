# Tasks: プロジェクト品質向上・リファクタリング

**Input**: Design documents from `/specs/005-refactor-auth-testing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: TDDアプローチが憲法で必須のため、テストタスクを含む

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Type**: Next.js App Router (Web フロントエンド+バックエンド統合型)
- **Source**: `src/` at repository root
- **Tests**: `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependencies setup

- [x] T001 Install bcryptjs dependency for password hashing via `bun add bcryptjs @types/bcryptjs`
- [x] T002 [P] Create Playwright configuration file in `playwright.config.ts`
- [x] T003 [P] Create tests/e2e/ directory structure with fixtures/ subdirectory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add password column to users table in src/server/db/schema.ts
- [x] T005 Run database migration to apply schema changes via `bun run db:push:all`
- [x] T006 [P] Create password hash utility in src/lib/utils/password.ts with hash() and compare() functions
- [x] T007 [P] Create Zod validation schemas for signup/signin in src/lib/validations/auth.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - メールアドレス/パスワード認証 (Priority: P1) 🎯 MVP

**Goal**: ユーザーはメールアドレスとパスワードでアカウントを作成し、ログインできる

**Independent Test**: 新規登録→ログアウト→再ログイン→セッション管理画面アクセスを確認

### Tests for User Story 1 (TDD: Write FIRST, ensure FAIL)

- [x] T008 [P] [US1] Contract test for auth.signup procedure in tests/contract/auth.test.ts
- [x] T009 [P] [US1] Contract test for credentials signin in tests/contract/auth.test.ts

### Implementation for User Story 1

#### Backend (API層)

- [x] T010 [US1] Add Credentials provider to NextAuth config in src/server/auth/config.ts
- [x] T011 [US1] Implement auth.signup tRPC procedure in src/server/api/routers/auth.ts
- [x] T012 [US1] Add auth router to root router in src/server/api/root.ts
- [x] T013 [US1] Implement account linking logic in authorize callback (same email = same user)

#### Frontend (Container層)

- [x] T014 [P] [US1] Create SignInFormContainer in src/features/auth/containers/SignInFormContainer.tsx
- [x] T015 [P] [US1] Create SignUpFormContainer in src/features/auth/containers/SignUpFormContainer.tsx

#### Frontend (Presentation層)

- [x] T016 [P] [US1] Create SignInForm component in src/features/auth/components/SignInForm.tsx
- [x] T017 [P] [US1] Create SignUpForm component in src/features/auth/components/SignUpForm.tsx

#### Pages

- [x] T018 [US1] Create signin page in src/app/auth/signin/page.tsx
- [x] T019 [US1] Create signup page in src/app/auth/signup/page.tsx
- [x] T020 [US1] Update home page to include credentials login option in src/app/page.tsx

#### Verification

- [x] T021 [US1] Run contract tests and verify all pass via `bun run test tests/contract/auth.test.ts`
- [ ] T022 [US1] Manual verification: signup → logout → signin flow works

**Checkpoint**: User Story 1 complete - メール/パスワード認証が動作する

---

## Phase 4: User Story 2 - E2Eテストによる主要機能の自動検証 (Priority: P2)

**Goal**: 開発者はE2Eテストを実行し、主要機能が正しく動作することを自動検証できる

**Independent Test**: `bun run test:e2e`を実行し、すべてのテストがパスする

### Tests for User Story 2 (E2Eテスト自体が成果物)

- [x] T023 [P] [US2] Create test user fixture in tests/e2e/fixtures/test-user.ts
- [x] T024 [P] [US2] Create global setup for test user creation in tests/e2e/global-setup.ts
- [x] T025 [P] [US2] Create global teardown for cleanup in tests/e2e/global-teardown.ts

### Implementation for User Story 2

- [x] T026 [US2] Create auth E2E tests (signup, signin, signout) in tests/e2e/auth.spec.ts
- [x] T027 [US2] Create session CRUD and filtering E2E tests in tests/e2e/sessions.spec.ts
- [x] T028 [US2] Add storage state caching for authenticated tests in playwright.config.ts
- [x] T029 [US2] Create helper for authenticated page fixture in tests/e2e/fixtures/auth.ts

#### Verification

- [ ] T030 [US2] Run E2E test suite and verify all pass via `bun run test:e2e`
- [ ] T031 [US2] Run E2E tests 10 times consecutively to verify stability per SC-006 (no flaky tests)

**Checkpoint**: User Story 2 complete - E2Eテストが安定して動作する

---

## Phase 5: User Story 3 - ドキュメントの整備と実装状況の同期 (Priority: P3)

**Goal**: ドキュメントが現在の実装状況を正確に反映する

**Independent Test**: README.mdの手順に従い開発環境をセットアップできる

### Implementation for User Story 3

- [x] T032 [P] [US3] Update README.md "主な機能" section to reflect implemented features
- [x] T033 [P] [US3] Update README.md with Credentials auth setup instructions
- [x] T034 [P] [US3] Update README.md with E2E test execution instructions
- [x] T035 [P] [US3] Update README.md "実装状況" to mark features as implemented (not planned)
- [x] T036 [US3] Review and update CLAUDE.md to reflect current feature state

#### Verification

- [ ] T037 [US3] Follow README.md setup from scratch and verify success
- [ ] T038 [US3] Verify all documented commands work as described

**Checkpoint**: User Story 3 complete - ドキュメントが実装と同期している

---

## Phase 6: User Story 4 - フロントエンドUIのリデザイン (Priority: P4)

**Goal**: UIが統一感のあるデザインで、全既存機能が維持される

**Independent Test**: 各画面を操作し、デザイン一貫性とレスポンシブ対応を確認

### Implementation for User Story 4

#### Home Page

- [x] T039 [US4] Redesign home page with consistent Mantine styling in src/app/page.tsx

#### Auth Pages

- [x] T040 [P] [US4] Apply consistent styling to SignInForm in src/features/auth/components/SignInForm.tsx
- [x] T041 [P] [US4] Apply consistent styling to SignUpForm in src/features/auth/components/SignUpForm.tsx

#### Session Pages

- [x] T042 [P] [US4] Redesign SessionStats component for visual consistency in src/features/poker-sessions/components/SessionStats.tsx
- [x] T043 [P] [US4] Redesign SessionCard component for visual consistency in src/features/poker-sessions/components/SessionCard.tsx
- [x] T044 [P] [US4] Redesign SessionFilters component for visual consistency in src/features/poker-sessions/components/SessionFilters.tsx
- [x] T045 [P] [US4] Redesign SessionList component for visual consistency in src/features/poker-sessions/components/SessionList.tsx
- [x] T046 [US4] Redesign SessionForm and SessionModal for visual consistency in src/features/poker-sessions/components/

#### Responsive & Accessibility

- [ ] T047 [US4] Verify responsive design on mobile (375px+) across all pages
- [ ] T048 [US4] Verify WCAG 2.1 AA color contrast compliance

#### Verification

- [ ] T049 [US4] Run existing E2E tests to verify all functionality preserved
- [ ] T050 [US4] Manual verification of design consistency across all screens

**Checkpoint**: User Story 4 complete - UIがリデザインされ機能が維持されている

---

## Phase 7: User Story 5 - コンポーネントテストの追加 (Priority: P5)

**Goal**: 主要Presentationコンポーネントの単体テストが存在し、80%以上のカバレッジ

**Independent Test**: `bun run test tests/components/`を実行し、すべてパスする

### Tests for User Story 5 (テスト自体が成果物)

#### Session Components

- [x] T051 [P] [US5] Create SessionCard component test in tests/components/SessionCard.test.tsx
- [ ] T052 [P] [US5] Create SessionForm component test in tests/components/SessionForm.test.tsx
- [x] T053 [P] [US5] Create SessionList component test in tests/components/SessionList.test.tsx
- [x] T054 [P] [US5] Create SessionStats component test in tests/components/SessionStats.test.tsx
- [ ] T055 [P] [US5] Create SessionFilters component test in tests/components/SessionFilters.test.tsx

#### Auth Components

- [x] T056 [P] [US5] Create SignInForm component test in tests/components/SignInForm.test.tsx
- [x] T057 [P] [US5] Create SignUpForm component test in tests/components/SignUpForm.test.tsx

#### Verification

- [x] T058 [US5] Run component test suite via `bun run test tests/components/`
- [ ] T059 [US5] Verify test coverage >= 80% for target components

**Checkpoint**: User Story 5 complete - コンポーネントテストが完備

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [ ] T060 [P] Run full test suite (contract + component + E2E) and verify all pass
- [ ] T061 [P] Run linting and formatting check via `bun run check`
- [ ] T062 [P] Run type check via `bun run typecheck`
- [ ] T063 Review and update quickstart.md with any changes
- [ ] T064 Final code review and cleanup

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational - **MVP, must complete first**
- **US2 (Phase 4)**: Depends on US1 (needs credentials auth for test login)
- **US3 (Phase 5)**: Can start after US1, benefits from US2 completion
- **US4 (Phase 6)**: Can start after US1
- **US5 (Phase 7)**: Can start after US4 (tests redesigned components)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational
    ↓
Phase 3: US1 (Authentication) 🎯 MVP
    ↓
    ├──→ Phase 4: US2 (E2E Tests) - requires auth
    │
    ├──→ Phase 5: US3 (Documentation) - can parallel with US2
    │
    └──→ Phase 6: US4 (UI Redesign) - can parallel with US2/US3
              ↓
         Phase 7: US5 (Component Tests) - tests redesigned UI
              ↓
         Phase 8: Polish
```

### Parallel Opportunities

**Within Phase 1 (Setup)**:
- T002, T003 can run in parallel

**Within Phase 2 (Foundational)**:
- T006, T007 can run in parallel (after T004, T005)

**Within US1 (Phase 3)**:
- T008, T009 can run in parallel (tests)
- T014, T015 can run in parallel (containers)
- T016, T017 can run in parallel (components)

**Within US2 (Phase 4)**:
- T023, T024, T025 can run in parallel (fixtures)

**Within US3 (Phase 5)**:
- T032, T033, T034, T035 can run in parallel (different doc sections)

**Within US4 (Phase 6)**:
- T040, T041 can run in parallel (auth components)
- T042, T043, T044, T045 can run in parallel (session components)

**Within US5 (Phase 7)**:
- All T051-T057 can run in parallel (different test files)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for US1 together:
Task: "T008 Contract test for auth.signup procedure"
Task: "T009 Contract test for credentials signin"

# After backend complete, launch containers in parallel:
Task: "T014 Create SignInFormContainer"
Task: "T015 Create SignUpFormContainer"

# Launch presentation components in parallel:
Task: "T016 Create SignInForm component"
Task: "T017 Create SignUpForm component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: メール/パスワード認証でログインできることを確認
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Auth) → Test → **MVP!**
3. Add US2 (E2E) → Run tests → Quality assurance
4. Add US3 (Docs) → Verify setup → Documentation complete
5. Add US4 (UI) → Visual review → Design complete
6. Add US5 (Tests) → Run tests → Test coverage complete
7. Polish → Final review → **Release ready**

---

## Summary

| Phase | User Story | Task Count | Parallel Tasks |
|-------|-----------|------------|----------------|
| 1 | Setup | 3 | 2 |
| 2 | Foundational | 4 | 2 |
| 3 | US1: Authentication | 15 | 8 |
| 4 | US2: E2E Tests | 9 | 4 |
| 5 | US3: Documentation | 7 | 5 |
| 6 | US4: UI Redesign | 12 | 7 |
| 7 | US5: Component Tests | 9 | 7 |
| 8 | Polish | 5 | 3 |
| **Total** | | **64** | **38** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- TDD approach: Write tests first (T008, T009) → Verify they fail → Implement → Verify they pass
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
