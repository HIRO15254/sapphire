# Tasks: ページ構造リファクタリング

**Input**: Design documents from `/specs/006-page-structure-refactor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: テストタスクはE2Eテストとコンポーネントテストを含む（憲法のテスト駆動開発原則に基づく）

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Type**: Next.js App Router (フロントエンド+バックエンド統合)
- **Source**: `src/` at repository root
- **Tests**: `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: プロジェクト構造の準備とディレクトリ作成

- [x] T001 [P] Create layout feature directory structure at src/features/layout/components/ and src/features/layout/containers/
- [x] T002 [P] Create dashboard feature directory structure at src/features/dashboard/components/ and src/features/dashboard/containers/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ユーザーストーリーの基盤となるAppShellレイアウトの実装

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Create Navbar presentation component in src/features/layout/components/Navbar.tsx
- [x] T004 [P] Create AppLayout presentation component using Mantine AppShell in src/features/layout/components/AppLayout.tsx
- [x] T005 Create AppLayoutContainer with authentication state and navigation state management in src/features/layout/containers/AppLayoutContainer.tsx
- [x] T006 Integrate AppLayoutContainer into root layout at src/app/layout.tsx with conditional rendering based on auth state

**Checkpoint**: Foundation ready - AppShellレイアウトが動作し、認証状態に応じてサイドバーの表示/非表示が切り替わる

---

## Phase 3: User Story 1 - サイドバーナビゲーションによるページ移動 (Priority: P1) 🎯 MVP

**Goal**: ユーザーがどのページからでもサイドバーを使って主要機能へ1クリックで移動できる

**Independent Test**: ログイン後、任意のページからサイドバーを使って別のページへ移動し、元のページに戻れることで検証

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] E2E test for sidebar navigation in tests/e2e/navigation.spec.ts (test cases: navigate between dashboard/sessions/new)
- [x] T008 [P] [US1] Component test for Navbar active state highlighting in tests/components/Navbar.test.tsx

### Implementation for User Story 1

- [x] T009 [US1] Add usePathname hook to Navbar for active link highlighting in src/features/layout/components/Navbar.tsx
- [x] T010 [US1] Implement mobile hamburger menu toggle using Mantine Burger in src/features/layout/components/AppLayout.tsx
- [x] T011 [US1] ~~Implement desktop sidebar collapse toggle~~ **REMOVED**: Desktop sidebar is now always expanded (no collapse toggle)
- [x] T012 [US1] Add auto-close sidebar on mobile navigation in src/features/layout/containers/AppLayoutContainer.tsx

**Checkpoint**: サイドバーナビゲーションが完全に機能し、モバイル/デスクトップの両方で正常動作

---

## Phase 4: User Story 2 - ダッシュボードでの概要確認 (Priority: P2)

**Goal**: ログイン後にダッシュボードで統計情報と最近のセッションを確認できる

**Independent Test**: ログイン後にダッシュボードが表示され、統計情報と最近のセッションが正しく表示されることで検証

### Tests for User Story 2 ⚠️

- [x] T013 [P] [US2] Component test for DashboardStats displaying statistics in tests/components/DashboardStats.test.tsx
- [x] T014 [P] [US2] Component test for RecentSessions displaying session list in tests/components/RecentSessions.test.tsx
- [x] T015 [P] [US2] Component test for empty state message in tests/components/DashboardStats.test.tsx

### Implementation for User Story 2

- [x] T016 [P] [US2] Create DashboardStats presentation component in src/features/dashboard/components/DashboardStats.tsx
- [x] T017 [P] [US2] Create RecentSessions presentation component in src/features/dashboard/components/RecentSessions.tsx
- [x] T018 [P] [US2] Create QuickActions presentation component in src/features/dashboard/components/QuickActions.tsx
- [x] T019 [US2] Create DashboardContainer with tRPC data fetching in src/features/dashboard/containers/DashboardContainer.tsx
- [x] T020 [US2] Update home page to render Dashboard in src/app/page.tsx (replace current landing page for authenticated users)
- [x] T021 [US2] Implement empty state UI when no sessions exist in src/features/dashboard/components/DashboardStats.tsx

**Checkpoint**: ダッシュボードが統計情報、最近のセッション、クイックアクションを表示

---

## Phase 5: User Story 3 - 専用ページでのセッション操作 (Priority: P3)

**Goal**: セッションの作成・詳細表示・編集・削除を専用ページで行える

**Independent Test**: 新規作成、詳細表示、編集のそれぞれがブックマーク可能なURLを持ち、ブラウザ履歴が正常動作することで検証

### Tests for User Story 3 ⚠️

- [x] T022 [P] [US3] E2E test for session CRUD via dedicated pages in tests/e2e/sessions.detail.spec.ts
- [x] T023 [P] [US3] Component test for SessionDetail displaying session info in tests/components/SessionDetail.test.tsx

### Implementation for User Story 3

- [x] T024 [P] [US3] Create SessionDetail presentation component in src/features/poker-sessions/components/SessionDetail.tsx
- [x] T025 [US3] Create SessionDetailContainer with tRPC data fetching in src/features/poker-sessions/containers/SessionDetailContainer.tsx
- [x] T026 [US3] Create session detail page at src/app/poker-sessions/[id]/page.tsx
- [x] T027 [US3] Update new session page to work as standalone page at src/app/poker-sessions/new/page.tsx
- [x] T028 [US3] Fix edit page redirect to go to detail page instead of non-existent route in src/app/poker-sessions/[id]/edit/page.tsx
- [x] T029 [US3] Remove modal-based session creation from sessions list page at src/app/poker-sessions/page.tsx
- [x] T030 [US3] Update sessions list page to navigate to dedicated pages instead of opening modals in src/app/poker-sessions/page.tsx
- [x] T031 [US3] Handle 404 for non-existent session IDs in src/app/poker-sessions/[id]/page.tsx

**Checkpoint**: すべてのセッション操作が専用ページで機能し、URLベースのナビゲーションが正常動作

---

## Phase 6: User Story 4 - 認証ページの独立表示 (Priority: P4)

**Goal**: 未認証ユーザーはサイドバーなしのシンプルなレイアウトでログイン・登録ページにアクセスできる

**Independent Test**: 未認証状態でログインページにアクセスし、サイドバーなしの画面が表示されることで検証

### Tests for User Story 4 ⚠️

- [x] T032 [P] [US4] E2E test for auth pages without sidebar in tests/e2e/auth.spec.ts
- [x] T033 [P] [US4] E2E test for redirect to dashboard after login in tests/e2e/auth.spec.ts

### Implementation for User Story 4

- [x] T034 [US4] Ensure auth pages (/auth/signin, /auth/signup) bypass AppShell layout in src/features/layout/containers/LayoutClientWrapper.tsx
- [x] T035 [US4] Update auth success redirect to go to dashboard (/) instead of previous behavior in src/server/auth/config.ts
- [x] T036 [US4] Update logout to redirect to /auth/signin in src/features/layout/components/Navbar.tsx

**Checkpoint**: 認証フローがサイドバーなしで動作し、認証後は正しくダッシュボードにリダイレクト

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 全ユーザーストーリーに影響する改善

- [ ] T037 [P] Remove unused modal components (SessionFormModal, etc.) from src/features/poker-sessions/
- [ ] T038 [P] Update quickstart.md documentation to reflect new navigation structure in specs/006-page-structure-refactor/quickstart.md
- [ ] T039 [P] Update README.md with new page structure information
- [x] T040 Run Biome lint and format check with bun run check:write
- [ ] T041 Run all E2E tests to verify navigation works end-to-end with bun run test:e2e
- [ ] T042 Verify responsive design on mobile viewport (375px) for all new pages

### Additional Tasks

- [x] T043 Remove social login buttons (Google/GitHub) from landing page in src/app/page.tsx
- [x] T044 Remove "新規作成" link from sidebar navigation in src/features/layout/components/Navbar.tsx
- [x] T045 Update E2E tests to reflect navigation changes (remove tests for removed elements)

### Sidebar Simplification Tasks (New)

- [x] T046 Remove desktop sidebar collapse toggle button from Navbar in src/features/layout/components/Navbar.tsx
- [x] T047 Simplify AppLayoutContainer to remove desktop collapsed state in src/features/layout/containers/AppLayoutContainer.tsx
- [x] T048 Update AppLayout to always show full-width sidebar on desktop in src/features/layout/components/AppLayout.tsx
- [x] T049 Remove collapsed prop and related logic from Navbar component in src/features/layout/components/Navbar.tsx
- [x] T050 Update component tests to remove sidebar collapse toggle tests in tests/components/Navbar.test.tsx

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (サイドバー) should complete first as it provides navigation infrastructure
  - US2 (ダッシュボード) can proceed after Foundational but benefits from US1 navigation
  - US3 (専用ページ) can proceed in parallel with US2
  - US4 (認証ページ) can proceed in parallel with US2/US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Provides navigation infrastructure for all other stories
- **User Story 2 (P2)**: Can start after Foundational - Minimal dependency on US1 (sidebar exists)
- **User Story 3 (P3)**: Can start after Foundational - Uses sidebar navigation from US1
- **User Story 4 (P4)**: Can start after Foundational - Independent of other user stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Presentation components before containers
- Containers before page integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T002) can run in parallel
- All Foundational presentation components (T003-T004) can run in parallel
- Tests within each user story can run in parallel
- Presentation components within each user story can run in parallel
- US2, US3, US4 can be worked on in parallel after US1 navigation is stable

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Component test for DashboardStats in tests/components/DashboardStats.test.tsx"
Task: "Component test for RecentSessions in tests/components/RecentSessions.test.tsx"
Task: "Component test for empty state in tests/components/DashboardStats.test.tsx"

# Launch all presentation components together:
Task: "Create DashboardStats in src/features/dashboard/components/DashboardStats.tsx"
Task: "Create RecentSessions in src/features/dashboard/components/RecentSessions.tsx"
Task: "Create QuickActions in src/features/dashboard/components/QuickActions.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (サイドバーナビゲーション)
4. **STOP and VALIDATE**: Test sidebar navigation independently
5. Deploy/demo if ready - users can now navigate between pages

### Incremental Delivery

1. Complete Setup + Foundational → AppShellレイアウト ready
2. Add User Story 1 → Test navigation → Deploy (MVP!)
3. Add User Story 2 → Test dashboard → Deploy (ダッシュボード追加)
4. Add User Story 3 → Test dedicated pages → Deploy (モーダル廃止完了)
5. Add User Story 4 → Test auth flow → Deploy (認証フロー最適化)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (サイドバー) - priority
   - Developer B: User Story 2 (ダッシュボード) - can start test writing
3. After US1 navigation stable:
   - Developer A: User Story 3 (専用ページ)
   - Developer B: User Story 4 (認証ページ)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
