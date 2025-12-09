# Tasks: 通貨・ゲーム登録機能

**Input**: Design documents from `/specs/007-store-currency-games/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDDアプローチに基づき、各ユーザーストーリーに契約テストとE2Eテストを含める

**Organization**: タスクはユーザーストーリーごとにグループ化され、各ストーリーの独立した実装・テストを可能にする

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: このタスクが属するユーザーストーリー (US1, US2, US3, US4)
- 説明には正確なファイルパスを含める

---

## Phase 1: Setup (共有インフラストラクチャ)

**Purpose**: 既存プロジェクトへの新機能追加準備

- [x] T001 currencies, games テーブルスキーマを追加 in `src/server/db/schema.ts`
- [x] T002 pokerSessions テーブルに gameId カラムを追加 in `src/server/db/schema.ts`
- [x] T003 usersRelations, locationsRelations にリレーション追加 in `src/server/db/schema.ts`
- [x] T004 データベースマイグレーション実行 `bun run db:push:all`
- [x] T005 [P] ゲーム表示フォーマットヘルパー作成 in `src/lib/utils/game.ts`

---

## Phase 2: Foundational (基盤タスク)

**Purpose**: すべてのユーザーストーリーで共有されるAPI基盤

**⚠️ CRITICAL**: このフェーズが完了するまでユーザーストーリーの実装は開始不可

- [x] T006 currencies ルーター作成（基本構造のみ）in `src/server/api/routers/currencies.ts`
- [x] T007 games ルーター作成（基本構造のみ）in `src/server/api/routers/games.ts`
- [x] T008 root.ts にルーター登録 in `src/server/api/root.ts`

**Checkpoint**: Foundation ready - ユーザーストーリー実装開始可能

---

## Phase 3: User Story 1 - 通貨の登録 (Priority: P1) 🎯 MVP

**Goal**: ユーザーがアミューズメントポーカーで使用する通貨を登録・管理できる

**Independent Test**: 通貨管理画面で新しい通貨を追加できること。追加した通貨が一覧に表示され、編集・削除が可能

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T009 [P] [US1] 契約テスト: currencies.create, getAll, update, delete in `tests/contract/currencies.test.ts`
- [ ] T010 [P] [US1] E2Eテスト: 通貨CRUD操作 in `tests/e2e/currencies.spec.ts`

### Implementation for User Story 1

- [x] T011 [US1] currencies.create プロシージャ実装（重複チェック含む）in `src/server/api/routers/currencies.ts`
- [x] T012 [US1] currencies.getAll プロシージャ実装（ゲーム数カウント含む）in `src/server/api/routers/currencies.ts`
- [x] T013 [US1] currencies.getById プロシージャ実装 in `src/server/api/routers/currencies.ts`
- [x] T014 [US1] currencies.update プロシージャ実装 in `src/server/api/routers/currencies.ts`
- [x] T015 [US1] currencies.delete プロシージャ実装（使用中チェック含む）in `src/server/api/routers/currencies.ts`
- [x] T016 [US1] currencies.checkUsage プロシージャ実装 in `src/server/api/routers/currencies.ts`
- [x] T017 [P] [US1] useCurrencies カスタムフック作成 in `src/features/currencies/hooks/useCurrencies.ts`
- [x] T018 [P] [US1] CurrencyCard Presentationコンポーネント作成 in `src/features/currencies/components/CurrencyCard.tsx`
- [x] T019 [P] [US1] CurrencyForm Presentationコンポーネント作成 in `src/features/currencies/components/CurrencyForm.tsx`
- [x] T020 [P] [US1] CurrencyList Presentationコンポーネント作成 in `src/features/currencies/components/CurrencyList.tsx`
- [x] T021 [US1] CurrencyFormContainer 作成 in `src/features/currencies/containers/CurrencyFormContainer.tsx`
- [x] T022 [US1] CurrencyListContainer 作成 in `src/features/currencies/containers/CurrencyListContainer.tsx`
- [x] T023 [US1] 通貨管理ページ作成 in `src/app/settings/currencies/page.tsx`
- [x] T024 [US1] ナビゲーションに通貨管理リンク追加

**Checkpoint**: User Story 1 完了 - 通貨のCRUD操作が独立してテスト可能

---

## Phase 4: User Story 2 - ゲームの登録 (Priority: P2)

**Goal**: ユーザーが各店舗でのNLHEリングゲームを詳細情報とともに登録できる

**Independent Test**: 店舗詳細画面でゲーム情報を入力して登録できること。アーカイブ/解除が機能すること

### Tests for User Story 2

- [ ] T025 [P] [US2] 契約テスト: games CRUD, archive/unarchive in `tests/contract/games.test.ts`
- [ ] T026 [P] [US2] E2Eテスト: ゲーム登録・編集・アーカイブ in `tests/e2e/games.spec.ts`

### Implementation for User Story 2

- [ ] T027 [US2] games.create プロシージャ実装（所有権・重複チェック含む）in `src/server/api/routers/games.ts`
- [ ] T028 [US2] games.getAll プロシージャ実装 in `src/server/api/routers/games.ts`
- [ ] T029 [US2] games.getByLocation プロシージャ実装 in `src/server/api/routers/games.ts`
- [ ] T030 [US2] games.getActiveByLocation プロシージャ実装 in `src/server/api/routers/games.ts`
- [ ] T031 [US2] games.getById プロシージャ実装 in `src/server/api/routers/games.ts`
- [ ] T032 [US2] games.update プロシージャ実装 in `src/server/api/routers/games.ts`
- [ ] T033 [US2] games.archive, games.unarchive プロシージャ実装 in `src/server/api/routers/games.ts`
- [ ] T034 [US2] games.delete プロシージャ実装（使用中チェック含む）in `src/server/api/routers/games.ts`
- [ ] T035 [US2] games.checkUsage プロシージャ実装 in `src/server/api/routers/games.ts`
- [ ] T036 [P] [US2] useGames カスタムフック作成 in `src/features/games/hooks/useGames.ts`
- [ ] T037 [P] [US2] GameCard Presentationコンポーネント作成 in `src/features/games/components/GameCard.tsx`
- [ ] T038 [P] [US2] GameForm Presentationコンポーネント作成 in `src/features/games/components/GameForm.tsx`
- [ ] T039 [P] [US2] GameList Presentationコンポーネント作成 in `src/features/games/components/GameList.tsx`
- [ ] T040 [US2] GameFormContainer 作成 in `src/features/games/containers/GameFormContainer.tsx`
- [ ] T041 [US2] GameListContainer 作成 in `src/features/games/containers/GameListContainer.tsx`
- [ ] T042 [US2] 店舗詳細画面にゲームタブ追加 in `src/app/locations/[id]/page.tsx`

**Checkpoint**: User Story 2 完了 - ゲームのCRUD・アーカイブが独立してテスト可能

---

## Phase 5: User Story 3 - セッション記録時のゲーム選択 (Priority: P3)

**Goal**: セッション記録時に店舗のゲームから選択でき、セッション詳細にゲーム情報が表示される

**Independent Test**: セッション作成時に店舗を選択するとゲーム一覧がドロップダウンに表示され、保存後にゲーム情報が表示される

### Tests for User Story 3

- [ ] T043 [P] [US3] 契約テスト: sessions.create/update with gameId in `tests/contract/sessions.test.ts`
- [ ] T044 [P] [US3] E2Eテスト: セッション作成時ゲーム選択 in `tests/e2e/sessions.spec.ts`

### Implementation for User Story 3

- [ ] T045 [US3] sessions.create に gameId パラメータ追加（バリデーション含む）in `src/server/api/routers/sessions.ts`
- [ ] T046 [US3] sessions.update に gameId パラメータ追加 in `src/server/api/routers/sessions.ts`
- [ ] T047 [US3] sessions.getAll, getById, getFiltered のレスポンスに game 追加 in `src/server/api/routers/sessions.ts`
- [ ] T048 [US3] SessionForm にゲーム選択ドロップダウン追加 in `src/features/poker-sessions/components/SessionForm.tsx`
- [ ] T049 [US3] SessionFormContainer に店舗変更時のゲーム取得ロジック追加 in `src/features/poker-sessions/containers/SessionFormContainer.tsx`
- [ ] T050 [US3] セッション詳細画面にゲーム情報表示追加 in `src/features/poker-sessions/components/SessionCard.tsx`
- [ ] T051 [US3] セッション一覧でゲーム情報表示 in `src/features/poker-sessions/components/SessionList.tsx`

**Checkpoint**: User Story 3 完了 - セッションとゲームの紐付けが独立してテスト可能

---

## Phase 6: User Story 4 - 統計のゲーム別表示 (Priority: P4)

**Goal**: ゲーム別・通貨別の収支統計を確認できる

**Independent Test**: 統計画面でゲーム別フィルターを適用すると、選択したゲームのみの収支が表示される

### Tests for User Story 4

- [ ] T052 [P] [US4] 契約テスト: sessions.getStats with gameIds/currencyIds filter in `tests/contract/sessions.test.ts`
- [ ] T053 [P] [US4] E2Eテスト: 統計画面ゲーム別フィルター in `tests/e2e/stats.spec.ts`

### Implementation for User Story 4

- [ ] T054 [US4] sessions.getStats に gameIds, currencyIds フィルター追加 in `src/server/api/routers/sessions.ts`
- [ ] T055 [US4] sessions.getStats レスポンスに byGame, byCurrency 追加 in `src/server/api/routers/sessions.ts`
- [ ] T056 [US4] sessions.getFiltered に gameIds, currencyIds フィルター追加 in `src/server/api/routers/sessions.ts`
- [ ] T057 [US4] 統計画面にゲーム別表示コンポーネント追加 in `src/features/poker-sessions/components/StatsByGame.tsx`
- [ ] T058 [US4] 統計画面に通貨別表示コンポーネント追加 in `src/features/poker-sessions/components/StatsByCurrency.tsx`
- [ ] T059 [US4] StatsContainer にゲーム・通貨フィルターロジック追加 in `src/features/poker-sessions/containers/StatsContainer.tsx`
- [ ] T060 [US4] 統計ページUIにタブ/フィルター追加 in `src/app/stats/page.tsx`

**Checkpoint**: User Story 4 完了 - 統計機能のゲーム別・通貨別フィルターが独立してテスト可能

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 全ユーザーストーリーに影響する改善

- [ ] T061 [P] 全テスト実行・パス確認 `bun run test && bun run test:e2e`
- [ ] T062 [P] Biomeチェック・修正 `bun run check:write`
- [ ] T063 [P] quickstart.md の操作手順を実際のUIで検証
- [ ] T064 型安全性の最終確認（tsc --noEmit）
- [ ] T065 エッジケースの動作確認（通貨未登録時、削除制約、バリデーション）
- [ ] T066 パフォーマンス確認（100通貨×100店舗×50ゲーム規模）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - 即座に開始可能
- **Foundational (Phase 2)**: Setup 完了後 - すべてのユーザーストーリーをブロック
- **User Stories (Phase 3-6)**: Foundational 完了後に開始可能
  - US1 (通貨) とUS2 (ゲーム) は **US2がUS1に依存** (ゲームは通貨を参照)
  - US3 (セッション拡張) は **US2完了後**
  - US4 (統計) は **US3完了後**
- **Polish (Phase 7)**: すべてのユーザーストーリー完了後

### User Story Dependencies

```
Phase 1 (Setup)
     ↓
Phase 2 (Foundational)
     ↓
Phase 3 (US1: 通貨) ←── MVP
     ↓
Phase 4 (US2: ゲーム)
     ↓
Phase 5 (US3: セッション拡張)
     ↓
Phase 6 (US4: 統計)
     ↓
Phase 7 (Polish)
```

### Within Each User Story

1. テストを先に作成し、FAILすることを確認
2. API実装（ルーター）
3. カスタムフック
4. Presentationコンポーネント（並列可）
5. Containerコンポーネント
6. ページ統合
7. ストーリー完了後に次の優先度へ

### Parallel Opportunities

- **Phase 1**: T005 (ヘルパー) は他と並列可能
- **Phase 2**: T006, T007 は並列可能
- **US1**: テスト (T009, T010)、Presentation (T018-T020)、Hook (T017) は並列可能
- **US2**: テスト (T025, T026)、Presentation (T037-T039)、Hook (T036) は並列可能
- **US3**: テスト (T043, T044) は並列可能
- **US4**: テスト (T052, T053) は並列可能
- **Phase 7**: T061, T062, T063 は並列可能

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "T009 契約テスト: currencies.create, getAll, update, delete"
Task: "T010 E2Eテスト: 通貨CRUD操作"

# Launch all Presentation components together:
Task: "T018 CurrencyCard Presentationコンポーネント作成"
Task: "T019 CurrencyForm Presentationコンポーネント作成"
Task: "T020 CurrencyList Presentationコンポーネント作成"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T008)
3. Complete Phase 3: User Story 1 (T009-T024)
4. **STOP and VALIDATE**: 通貨機能を独立してテスト
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 基盤完成
2. Add User Story 1 → Test → Deploy (MVP!)
3. Add User Story 2 → Test → Deploy
4. Add User Story 3 → Test → Deploy
5. Add User Story 4 → Test → Deploy
6. 各ストーリーが前のストーリーを壊さずに価値を追加

---

## Summary

| Phase | Task Count | Description |
|-------|------------|-------------|
| Phase 1 (Setup) | 5 | スキーマ追加・マイグレーション |
| Phase 2 (Foundational) | 3 | ルーター基盤 |
| Phase 3 (US1: 通貨) | 16 | 通貨CRUD + UI |
| Phase 4 (US2: ゲーム) | 18 | ゲームCRUD + アーカイブ + UI |
| Phase 5 (US3: セッション) | 9 | セッション拡張 |
| Phase 6 (US4: 統計) | 9 | 統計フィルター |
| Phase 7 (Polish) | 6 | 品質保証 |
| **Total** | **66** | |

**MVP Scope**: Phase 1 + 2 + 3 = 24 tasks (通貨管理機能のみ)

---

## Phase 8: User Story 5 - 店舗管理ページ (Priority: P5)

**Goal**: ユーザーが店舗一覧を管理し、各店舗でゲームを追加・編集できる

**Independent Test**: 店舗一覧ページから店舗の追加・編集・削除ができ、店舗詳細ページでゲーム管理が行える

### Tests for User Story 5

- [ ] T067 [P] [US5] 契約テスト: locations.getAll (ゲーム数・セッション数含む), update, delete in `tests/contract/locations.test.ts`
- [ ] T068 [P] [US5] E2Eテスト: 店舗管理ページ CRUD + ゲーム管理 in `tests/e2e/locations.spec.ts`

### Implementation for User Story 5

- [ ] T069 [US5] locations.getAll 拡張（ゲーム数・セッション数追加）in `src/server/api/routers/locations.ts`
- [ ] T070 [US5] locations.update プロシージャ追加 in `src/server/api/routers/locations.ts`
- [ ] T071 [US5] locations.delete プロシージャ追加（使用中チェック含む）in `src/server/api/routers/locations.ts`
- [ ] T072 [US5] locations.checkUsage プロシージャ追加 in `src/server/api/routers/locations.ts`
- [ ] T073 [P] [US5] useLocations フック拡張 in `src/features/locations/hooks/useLocations.ts`
- [ ] T074 [P] [US5] LocationCard Presentationコンポーネント作成 in `src/features/locations/components/LocationCard.tsx`
- [ ] T075 [P] [US5] LocationForm Presentationコンポーネント作成 in `src/features/locations/components/LocationForm.tsx`
- [ ] T076 [P] [US5] LocationList Presentationコンポーネント作成 in `src/features/locations/components/LocationList.tsx`
- [ ] T077 [P] [US5] LocationDetail Presentationコンポーネント作成 in `src/features/locations/components/LocationDetail.tsx`
- [ ] T078 [US5] LocationFormContainer 作成 in `src/features/locations/containers/LocationFormContainer.tsx`
- [ ] T079 [US5] LocationListContainer 作成 in `src/features/locations/containers/LocationListContainer.tsx`
- [ ] T080 [US5] LocationDetailContainer 作成 in `src/features/locations/containers/LocationDetailContainer.tsx`
- [ ] T081 [US5] 店舗一覧ページ作成 in `src/app/locations/page.tsx`
- [ ] T082 [US5] 店舗詳細ページ作成 in `src/app/locations/[id]/page.tsx`
- [ ] T083 [US5] ナビゲーションに店舗管理リンク追加

**Checkpoint**: User Story 5 完了 - 店舗管理ページから店舗とゲームを管理できる

---

## Phase 9: User Story 6 - 通貨保有量の管理 (Priority: P6)

**Goal**: ユーザーが各通貨の保有量を記録・管理できる

**Independent Test**: 通貨管理画面で保有量を入力・更新でき、一覧に表示される

### Tests for User Story 6

- [ ] T084 [P] [US6] 契約テスト: currencies.updateBalance in `tests/contract/currencies.test.ts`
- [ ] T085 [P] [US6] E2Eテスト: 通貨保有量の更新 in `tests/e2e/currencies.spec.ts`

### Implementation for User Story 6

- [ ] T086 [US6] currencies テーブルに balance カラム追加 in `src/server/db/schema.ts`
- [ ] T087 [US6] データベースマイグレーション実行 `bun run db:push:all`
- [ ] T088 [US6] currencies.updateBalance プロシージャ追加 in `src/server/api/routers/currencies.ts`
- [ ] T089 [US6] currencies.getAll レスポンスに balance 追加 in `src/server/api/routers/currencies.ts`
- [ ] T090 [US6] CurrencyCard に保有量表示・編集機能追加 in `src/features/currencies/components/CurrencyCard.tsx`
- [ ] T091 [US6] CurrencyList に保有量カラム追加 in `src/features/currencies/components/CurrencyList.tsx`

**Checkpoint**: User Story 6 完了 - 通貨の保有量を管理できる

---

## Phase 10: User Story 7 - ダッシュボードUIのコンパクト化 (Priority: P7)

**Goal**: ダッシュボードをよりコンパクトに表示し、視認性を向上

**Independent Test**: 統計カードにアイコンがタイトル前に表示され、1行でコンパクトに表示される

### Tests for User Story 7

- [ ] T092 [P] [US7] E2Eテスト: ダッシュボードUIの検証 in `tests/e2e/dashboard.spec.ts`

### Implementation for User Story 7

- [ ] T093 [US7] DashboardStats コンパクト化（アイコン+タイトル1行、段数削減）in `src/features/dashboard/components/DashboardStats.tsx`
- [ ] T094 [US7] QuickActions コンパクト化 in `src/features/dashboard/components/QuickActions.tsx`
- [ ] T095 [US7] DashboardContainer レイアウト調整 in `src/features/dashboard/containers/DashboardContainer.tsx`

**Checkpoint**: User Story 7 完了 - ダッシュボードがコンパクトに表示される

---

## Phase 11: Final Polish (追加タスク後の品質保証)

**Purpose**: Phase 8-10 の実装後の品質確認

- [ ] T096 [P] 全テスト実行・パス確認 `bun run test && bun run test:e2e`
- [ ] T097 [P] Biomeチェック・修正 `bun run check:write`
- [ ] T098 型安全性の最終確認（tsc --noEmit）
- [ ] T099 追加機能の動作確認（店舗管理、通貨保有量、ダッシュボード）

---

## Updated Dependencies & Execution Order

### Phase Dependencies (Updated)

```
Phase 1-7 (既存タスク - 完了済み or 進行中)
     ↓
Phase 8 (US5: 店舗管理) ← ゲーム管理機能が前提
     ↓
Phase 9 (US6: 通貨保有量) ← 通貨機能が前提
     ↓
Phase 10 (US7: ダッシュボードUI) ← 独立して実装可能
     ↓
Phase 11 (Final Polish)
```

### Parallel Opportunities (Additional)

- **Phase 8**: テスト (T067, T068)、Presentation (T074-T077) は並列可能
- **Phase 9**: テスト (T084, T085) は並列可能
- **Phase 10**: T093, T094, T095 は相互に影響するため順次実行推奨

---

## Updated Summary

| Phase | Task Count | Description |
|-------|------------|-------------|
| Phase 1-7 | 66 | 既存タスク（通貨・ゲーム管理基盤） |
| Phase 8 (US5: 店舗管理) | 17 | 店舗CRUD + ゲーム管理UI |
| Phase 9 (US6: 通貨保有量) | 8 | 通貨保有量管理 |
| Phase 10 (US7: ダッシュボード) | 4 | UIコンパクト化 |
| Phase 11 (Final Polish) | 4 | 品質保証 |
| **Total** | **99** | |

**追加タスクスコープ**: Phase 8 + 9 + 10 + 11 = 33 tasks

---

## Phase 12: Additional User Stories 8-11 (追加タスク Phase 2)

**Goal**: ゲーム管理の店舗統合、BB単位統計、UIクリーンアップ、セッション一覧コンパクト化

### User Story 8 - ゲーム管理の店舗統合

- [x] T100 [US8] ナビゲーションからゲーム管理リンクを削除 in `src/features/layout/components/Navbar.tsx`
- [x] T101 [US8] `/settings/games` ページを削除 in `src/app/settings/games/`
- [x] T102 [US8] ゲームカードから店舗名表示を削除（常にlocation非表示）in `src/features/games/components/GameCard.tsx`

### User Story 9 - セッション統計のBB単位表示

- [x] T103 [US9] 統計計算でBB換算ロジック追加 in `src/server/api/routers/sessions.ts` (getStatsプロシージャに統合)
- [x] T104 [US9] セッション一覧統計カードでBB単位表示 in `src/features/poker-sessions/components/SessionStats.tsx`
- [x] T105 [US9] ダッシュボード統計でBB単位表示 in `src/features/dashboard/components/DashboardStats.tsx`

### User Story 10 - UIクリーンアップ

- [x] T106 [US10] 店舗詳細ページから「セッションが紐付いているため…」警告削除 in `src/features/locations/containers/LocationDetailContainer.tsx`
- [x] T107 [US10] 通貨カードから「ゲームで使用中のため…」警告削除 in `src/features/currencies/components/CurrencyCard.tsx`
- [x] T108 [US10] セッションフォームからバイイン/キャッシュアウト円表示削除 in `src/features/poker-sessions/components/SessionForm.tsx`

### User Story 11 - セッション一覧UIコンパクト化

- [x] T109 [US11] セッション一覧統計カードをダッシュボード同様にコンパクト化 in `src/features/poker-sessions/components/SessionStats.tsx`

**Checkpoint**: Phase 12 完了 - ゲーム管理統合、BB統計、UIクリーンアップ完了

---

## Phase 13: Bug Fixes (バグ修正)

**Goal**: セッション作成・更新時のゲーム紐づけバグを修正

### Bug Fix - セッション-ゲーム紐づけ

- [x] T110 [BF] NewSessionPageでgameIdとlocationIdをAPIに渡すよう修正 in `src/features/poker-sessions/pages/NewSessionPage.tsx`
- [x] T111 [BF] EditSessionPageのprops型定義にgameを追加 in `src/features/poker-sessions/pages/EditSessionPage.tsx`
- [x] T112 [BF] EditSessionPageでgameIdとlocationIdをAPIに渡すよう修正 in `src/features/poker-sessions/pages/EditSessionPage.tsx`
- [x] T113 [BF] EditSessionPageのinitialValuesにlocationIdとgameIdを設定 in `src/features/poker-sessions/pages/EditSessionPage.tsx`

**Checkpoint**: Phase 13 完了 - セッション作成・編集でゲームが正しく紐づくようになった

---

## Updated Summary (Final)

| Phase | Task Count | Description |
|-------|------------|-------------|
| Phase 1-7 | 66 | 既存タスク（通貨・ゲーム管理基盤） |
| Phase 8 (US5: 店舗管理) | 17 | 店舗CRUD + ゲーム管理UI |
| Phase 9 (US6: 通貨保有量) | 8 | 通貨保有量管理 |
| Phase 10 (US7: ダッシュボード) | 4 | UIコンパクト化 |
| Phase 11 (Final Polish) | 4 | 品質保証 |
| Phase 12 (US8-11: 追加タスク2) | 10 | ゲーム統合、BB統計、UIクリーンアップ |
| Phase 13 (Bug Fixes) | 4 | セッション-ゲーム紐づけ修正 |
| **Total** | **113** | |

---

## Phase 14: Enhancements (UI/UX改善)

**Goal**: ゲーム必須化、通貨プレフィックス、場所/ゲーム別統計、収支の通貨表示

### User Story 12 - ゲーム必須化とUI改善

- [x] T114 [US12] セッションにゲーム紐づけ必須化（Zodバリデーション追加）in `src/features/poker-sessions/components/SessionForm.tsx`
- [x] T115 [US12] GameSelect に withAsterisk と必須表示追加 in `src/features/poker-sessions/components/GameSelect.tsx`

### User Story 13 - 通貨プレフィックス機能

- [x] T116 [US13] currencies テーブルに prefix カラム追加 in `src/server/db/schema.ts`
- [x] T117 [US13] データベースマイグレーション実行 `bun run db:push:all`
- [x] T118 [US13] currencies.create/update に prefix パラメータ追加 in `src/server/api/routers/currencies.ts`
- [x] T119 [US13] currencies.getAll レスポンスに prefix 追加 in `src/server/api/routers/currencies.ts`
- [x] T120 [US13] CurrencyForm にプレフィックス入力フィールド追加 in `src/features/currencies/components/CurrencyForm.tsx`
- [x] T121 [US13] CurrencyCard にプレフィックス表示追加 in `src/features/currencies/components/CurrencyCard.tsx`

### User Story 14 - 場所/ゲーム別統計

- [x] T122 [US14] sessions.getStats に byLocationGame 集計追加（通貨prefix、プレイ時間、時給）in `src/server/api/routers/sessions.ts`
- [x] T123 [US14] LocationStats コンポーネントを場所/ゲーム別表示に変更 in `src/features/poker-sessions/components/LocationStats.tsx`
- [x] T124 [US14] SessionsPage から SessionStats カード削除 in `src/features/poker-sessions/pages/SessionsPage.tsx`

### User Story 15 - 収支の通貨単位表示

- [x] T125 [US15] sessions.getAll/getById/getFiltered のゲーム取得に通貨JOIN追加 in `src/server/api/routers/sessions.ts`
- [x] T126 [US15] SessionCard の収支表示を通貨プレフィックス付きに変更 in `src/features/poker-sessions/components/SessionCard.tsx`
- [x] T127 [US15] RecentSessions の収支表示を通貨プレフィックス付きに変更 in `src/features/dashboard/components/RecentSessions.tsx`
- [x] T128 [US15] SessionsPage props に game 型定義追加 in `src/features/poker-sessions/pages/SessionsPage.tsx`

### User Story 16 - ゲーム表示のクリーンアップ

- [x] T129 [US16] GameSelect からブラインド表示（smallBlind/bigBlind）を削除 in `src/features/poker-sessions/components/GameSelect.tsx`
- [x] T130 [US16] SessionCard からブラインド表示を削除 in `src/features/poker-sessions/components/SessionCard.tsx`

**Checkpoint**: Phase 14 完了 - ゲーム必須化、通貨プレフィックス、場所/ゲーム別統計、収支の通貨表示完了

---

## Updated Summary (Final)

| Phase | Task Count | Description |
|-------|------------|-------------|
| Phase 1-7 | 66 | 既存タスク（通貨・ゲーム管理基盤） |
| Phase 8 (US5: 店舗管理) | 17 | 店舗CRUD + ゲーム管理UI |
| Phase 9 (US6: 通貨保有量) | 8 | 通貨保有量管理 |
| Phase 10 (US7: ダッシュボード) | 4 | UIコンパクト化 |
| Phase 11 (Final Polish) | 4 | 品質保証 |
| Phase 12 (US8-11: 追加タスク2) | 10 | ゲーム統合、BB統計、UIクリーンアップ |
| Phase 13 (Bug Fixes) | 4 | セッション-ゲーム紐づけ修正 |
| Phase 14 (US12-16: UI/UX改善) | 17 | ゲーム必須化、通貨プレフィックス、統計改善 |
| **Total** | **130** | |

---

## Notes

- [P] = 異なるファイル、依存関係なし
- [Story] = 特定のユーザーストーリーへのトレーサビリティ
- 各ユーザーストーリーは独立して完了・テスト可能
- テストがFAILすることを確認してから実装開始
- 各タスクまたは論理グループ完了後にコミット
- 任意のチェックポイントで停止してストーリーを独立検証可能
- 回避すべき: 曖昧なタスク、同一ファイル競合、独立性を壊すストーリー間依存
