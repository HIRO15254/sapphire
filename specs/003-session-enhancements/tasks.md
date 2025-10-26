# Implementation Tasks: ポーカーセッション記録機能の改善

**Feature Branch**: `003-session-enhancements`
**Generated**: 2025-10-26
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Task Organization

タスクは以下のフェーズに分類されています:
- **Phase 0**: Setup & Dependencies（依存関係のインストール）
- **Phase 1**: Foundational（基盤となるデータモデルとAPI）
- **Phase 2**: P1 - モーダルでのセッション追加（MVP）
- **Phase 3**: P2 - 場所の管理と選択
- **Phase 4**: P3 - リッチテキストメモの記録
- **Phase 5**: P4 - タグによる分類とフィルタリング
- **Phase 6**: Polish & Optimization（最適化とリファクタリング）

各タスクは以下の形式で記述:
- `- [ ] [TaskID] [Priority] [Story] タスクの説明`

例: `- [ ] [T001] [P1] [US1] データベーススキーマを更新する`

---

## Phase 0: Setup & Dependencies

### 依存関係のインストール

- [X] [T001] [Setup] Tiptap関連の依存関係をインストールする ✓ DONE
  - `@tiptap/react@^2.10.4`
  - `@tiptap/starter-kit@^2.10.4`
  - `@tiptap/extension-link@^2.10.4`
  - `@mantine/tiptap@^8.3.5`
  - `dompurify@^3.2.5`
  - `@types/dompurify@^3.2.0`（dev依存関係）
  - `jsdom` + `@types/jsdom` (for server-side sanitization)
  - コマンド: `bun add @tiptap/react@^2.10.4 @tiptap/starter-kit@^2.10.4 @tiptap/extension-link@^2.10.4 @mantine/tiptap@^8.3.5 dompurify@^3.2.5`
  - コマンド: `bun add -d @types/dompurify@^3.2.0`

---

## Phase 1: Foundational（基盤）

### データベーススキーマとマイグレーション

- [X] [T002] [Foundational] `locations`テーブルのDrizzleスキーマを定義する ✓ DONE
  - ファイル: `src/server/db/schema.ts`
  - カラム: `id`, `userId`, `name`, `createdAt`, `updatedAt`
  - インデックス: `(user_id)`, `UNIQUE(user_id, LOWER(name))`
  - リレーション: `users`（多対一）、`pokerSessions`（一対多）

- [X] [T003] [Foundational] `tags`テーブルのDrizzleスキーマを定義する ✓ DONE
  - ファイル: `src/server/db/schema.ts`
  - カラム: `id`, `userId`, `name`, `createdAt`, `updatedAt`
  - インデックス: `(user_id)`, `UNIQUE(user_id, LOWER(name))`
  - リレーション: `users`（多対一）、`sessionTags`（一対多）

- [X] [T004] [Foundational] `session_tags`中間テーブルのDrizzleスキーマを定義する ✓ DONE
  - ファイル: `src/server/db/schema.ts`
  - カラム: `sessionId`, `tagId`
  - 主キー: `(sessionId, tagId)`
  - インデックス: `(tag_id)`
  - リレーション: `pokerSessions`（多対一）、`tags`（多対一）
  - ON DELETE CASCADE設定

- [X] [T005] [Foundational] `poker_sessions`テーブルを更新する ✓ DONE
  - ファイル: `src/server/db/schema.ts`
  - 変更: `location`（varchar）→ `locationId`（integer、外部キー）
  - `notes`フィールドはtext型を維持（HTML文字列を保存）
  - インデックス追加: `(user_id, location_id)`, `(user_id, date, location_id)`
  - リレーション追加: `location`（多対一）、`sessionTags`（一対多）

- [X] [T006] [Foundational] マイグレーションスクリプトを作成する ✓ DONE
  - Phase 1: 新規テーブル作成（`locations`, `tags`, `session_tags`）
  - Phase 2: 既存データ移行（`location`文字列 → `locations`テーブル + `location_id`）
  - Phase 3: インデックス再構築
  - デフォルト場所「削除された場所」を作成するスクリプトを含める（FR-020対応）
  - Migration applied successfully to database ✓

### tRPC Routers & API Contracts

#### Sessions Router（拡張）

- [X] [T007] [Foundational] `sessions.create`のZodスキーマを更新する ✓ DONE
  - ファイル: `src/server/api/routers/sessions.ts`
  - 追加フィールド: `locationId`, `newLocationName`, `existingTagIds`, `newTagNames`
  - バリデーション: `locationId`または`newLocationName`のいずれかが必須
  - タグ最大20個、メモ最大50,000文字

- [X] [T008] [Foundational] `sessions.create` procedureのロジックを更新する ✓ DONE
  - トランザクション内で実行
  - `newLocationName`が指定された場合、`locations`テーブルで検索または作成
  - `newTagNames`が指定された場合、`tags`テーブルで検索または作成
  - `notes`フィールドをDOMPurifyでサニタイズ
  - セッション作成後、`session_tags`に関連付けを作成
  - レスポンスに`location`オブジェクトと`tags`配列を含める

- [X] [T009] [Foundational] `sessions.update`のZodスキーマとロジックを更新する ✓ DONE
  - ファイル: `src/server/api/routers/sessions.ts`
  - `sessions.create`と同様のフィールドとロジック
  - 既存のタグ関連を削除してから新しいタグを設定
  - 所有者確認を実装

- [X] [T010] [Foundational] `sessions.getAll` procedureを更新する ✓ DONE
  - レスポンスに`location`オブジェクトと`tags`配列を含める
  - JOINまたは`json_agg`でタグを集約（N+1問題を回避）
  - ページネーション対応（デフォルト50件、最大100件）

- [X] [T011] [Foundational] `sessions.getById` procedureを更新する ✓ DONE
  - レスポンスに`location`オブジェクトと`tags`配列を含める
  - 所有者確認を実装

- [X] [T012] [Foundational] `sessions.getFiltered` procedureを更新する ✓ DONE
  - タグフィルター追加: `tagIds`パラメータ（AND条件）
  - SQL: `HAVING COUNT(DISTINCT tag_id) = ${tagIds.length}`
  - レスポンスに`location`オブジェクトと`tags`配列を含める

#### Locations Router（新規）

- [X] [T013] [Foundational] `locations` routerを新規作成する ✓ DONE
  - ファイル: `src/server/api/routers/locations.ts`
  - Procedures: `getAll`, `create`, `delete`

- [X] [T014] [Foundational] `locations.getAll` procedureを実装する ✓ DONE
  - 入力: `search`（オプショナル）
  - 出力: `{ id, name, sessionCount }`の配列
  - 部分一致検索（ILIKE）対応
  - 名前でソート

- [X] [T015] [Foundational] `locations.create` procedureを実装する ✓ DONE
  - 入力: `name`（1〜255文字）
  - 名前の正規化（トリム、小文字化）
  - 重複チェック（大文字小文字を区別しない）
  - 存在する場合: 既存の場所を返す
  - 存在しない場合: 新規作成

- [X] [T016] [Foundational] `locations.delete` procedureを実装する（FR-020対応） ✓ DONE
  - 入力: `id`
  - 所有者確認
  - デフォルト場所「削除された場所」を取得または作成
  - この場所を参照しているセッションの`location_id`をデフォルト場所に更新
  - 場所を削除
  - 影響を受けたセッション数を返す
  - デフォルト場所自体の削除を防ぐバリデーション

#### Tags Router（新規）

- [X] [T017] [Foundational] `tags` routerを新規作成する ✓ DONE
  - ファイル: `src/server/api/routers/tags.ts`
  - Procedures: `getAll`, `create`, `delete`

- [X] [T018] [Foundational] `tags.getAll` procedureを実装する ✓ DONE
  - 入力: `search`（オプショナル）
  - 出力: `{ id, name, sessionCount }`の配列
  - 部分一致検索（ILIKE）対応
  - 名前でソート

- [X] [T019] [Foundational] `tags.create` procedureを実装する ✓ DONE
  - 入力: `name`（1〜50文字）
  - 名前の正規化（トリム、小文字化）
  - 重複チェック（大文字小文字を区別しない）
  - 存在する場合: 既存のタグを返す
  - 存在しない場合: 新規作成

- [X] [T020] [Foundational] `tags.delete` procedureを実装する（FR-021対応） ✓ DONE
  - 入力: `id`
  - 所有者確認
  - タグを削除（ON DELETE CASCADEにより`session_tags`も自動削除）
  - 影響を受けたセッション数を返す

- [X] [T021] [Foundational] `locations`と`tags` routerを`src/server/api/root.ts`に追加する ✓ DONE

### ユーティリティ関数

- [X] [T022] [Foundational] HTMLサニタイゼーション関数を実装する ✓ DONE
  - ファイル: `src/lib/utils/sanitize.ts`
  - DOMPurifyを使用（バックエンド用にJSDOMを統合）
  - 許可タグ: `p`, `br`, `strong`, `em`, `u`, `s`, `h1-h6`, `ul`, `ol`, `li`, `a`, `code`, `pre`, `blockquote`
  - 許可属性: `href`, `rel`, `target`（リンク用）
  - `sanitizeHtml(html: string | null): string | null`関数をエクスポート

### 契約テスト（Test-First Development）

- [ ] [T023] [Foundational] [RED] `locations` routerの契約テストを作成する
  - ファイル: `tests/contract/locations.test.ts`
  - `locations.getAll`: 場所リスト取得、検索フィルター
  - `locations.create`: 新規作成、重複時の既存返却
  - `locations.delete`: 削除成功、デフォルト場所置換確認（FR-020）、所有者チェック
  - テストが失敗することを確認（Red）

- [ ] [T024] [Foundational] [RED] `tags` routerの契約テストを作成する
  - ファイル: `tests/contract/tags.test.ts`
  - `tags.getAll`: タグリスト取得、検索フィルター
  - `tags.create`: 新規作成、重複時の既存返却
  - `tags.delete`: 削除成功、関連削除確認（FR-021）、所有者チェック
  - テストが失敗することを確認（Red）

- [ ] [T025] [Foundational] [RED] `sessions` routerの契約テストを更新する
  - ファイル: `tests/contract/sessions.test.ts`
  - `sessions.create`: `locationId`, `tagIds`対応
  - `sessions.update`: タグ更新ロジック
  - `sessions.getAll`: `location`と`tags`を含む
  - `sessions.getFiltered`: タグフィルター（AND条件）
  - テストが失敗することを確認（Red）

- [ ] [T026] [Foundational] [GREEN] T023〜T025のテストが通るよう実装を完成させる
  - すべての契約テストが合格することを確認（Green）

---

## Phase 2: P1 - モーダルでのセッション追加（MVP）

**User Story 1**: ユーザーはセッション一覧画面から離れることなく、モーダルウィンドウで新しいセッションを素早く記録できる。

### Presentationコンポーネント

- [ ] [T027] [P1] [US1] `SessionModal`コンポーネントを作成する
  - ファイル: `src/features/poker-sessions/components/SessionModal.tsx`
  - Props: `opened`, `onClose`, `title`, `children`
  - Mantine `Modal`を使用
  - `closeOnClickOutside`, `closeOnEscape`を設定（FR-003）
  - レスポンシブ対応（デスクトップ・タブレット・モバイル）

- [ ] [T028] [P1] [US1] `SessionForm`コンポーネントを作成する
  - ファイル: `src/features/poker-sessions/components/SessionForm.tsx`
  - Props: `initialValues`, `onSubmit`, `onCancel`, `isLoading`
  - フォームフィールド: `date`, `location`, `buyIn`, `cashOut`, `durationMinutes`
  - Mantine `TextInput`, `NumberInput`, `DateTimePicker`, `Button`を使用
  - バリデーションエラーはフォーム内に表示（FR-019）
  - `notes`と`tags`フィールドは後のフェーズで追加

- [ ] [T029] [P1] [US1] `LocationSelect`コンポーネントを作成する（基本版）
  - ファイル: `src/features/poker-sessions/components/LocationSelect.tsx`
  - Props: `value`, `onChange`, `locations`, `onCreateNew`, `isLoading`
  - Mantine `Select`（searchable, creatable）を使用
  - オートコンプリート対応（FR-007）
  - 新規場所追加UI（FR-006）

### Containerコンポーネント

- [ ] [T030] [P1] [US1] `useSessionModal` hookを作成する
  - ファイル: `src/features/poker-sessions/hooks/useSessionModal.ts`
  - Mantine `useDisclosure` hookを使用
  - `opened`, `open`, `close`を返す

- [ ] [T031] [P1] [US1] `useSessionForm` hookを作成する
  - ファイル: `src/features/poker-sessions/hooks/useSessionForm.ts`
  - `@mantine/form`の`useForm` hookを使用
  - Zodスキーマでバリデーション
  - 初期値の設定（新規作成 vs 編集）

- [ ] [T032] [P1] [US1] `useLocations` hookを作成する
  - ファイル: `src/features/poker-sessions/hooks/useLocations.ts`
  - `api.locations.getAll.useQuery()`を使用
  - 場所リストをフォーマット（`{ value, label }`形式）
  - 検索フィルター対応

- [ ] [T033] [P1] [US1] `SessionFormContainer`コンポーネントを作成する
  - ファイル: `src/features/poker-sessions/containers/SessionFormContainer.tsx`
  - `useSessionForm`と`useLocations` hooksを使用
  - `api.sessions.create.useMutation()`でセッション作成
  - 成功時: キャッシュ無効化、モーダルクローズ
  - エラー時: エラーメッセージ表示
  - `SessionForm`と`LocationSelect`をレンダリング

- [ ] [T034] [P1] [US1] `SessionModalContainer`コンポーネントを作成する
  - ファイル: `src/features/poker-sessions/containers/SessionModalContainer.tsx`
  - `useSessionModal` hookを使用
  - `SessionModal`と`SessionFormContainer`を統合

### 既存ページの更新

- [ ] [T035] [P1] [US1] セッション一覧ページにモーダル統合
  - ファイル: `src/app/poker-sessions/page.tsx`
  - 「新規追加」ボタンを追加
  - `SessionModalContainer`を統合
  - モーダル開閉状態を管理

- [ ] [T036] [P1] [US1] `/poker-sessions/new`ページを削除する
  - ファイル: `src/app/poker-sessions/new/page.tsx`
  - モーダルに移行したため不要

- [ ] [T037] [P1] [US1] `/poker-sessions/[id]/edit`ページを削除する（編集機能は後で追加）
  - ファイル: `src/app/poker-sessions/[id]/edit/page.tsx`
  - モーダルに移行したため不要

### 統合テスト（Test-First Development）

- [ ] [T038] [P1] [US1] [RED] モーダルでのセッション作成統合テストを作成する
  - ファイル: `tests/integration/create-session-modal.test.tsx`
  - シナリオ1: モーダル開閉
  - シナリオ2: セッション情報入力・保存
  - シナリオ3: キャンセル動作
  - シナリオ4: バリデーションエラー
  - テストが失敗することを確認（Red）

- [ ] [T039] [P1] [US1] [GREEN] T038のテストが通るよう実装を完成させる
  - すべての統合テストが合格することを確認（Green）

### E2Eテスト（Test-First Development）

- [ ] [T040] [P1] [US1] [RED] セッションモーダルのE2Eテストを作成する
  - ファイル: `tests/e2e/session-modal.spec.ts`
  - シナリオ: モーダルでセッションを作成し、一覧に表示される
  - パフォーマンス測定: モーダル開閉 < 200ms（SC-007）
  - テストが失敗することを確認（Red）

- [ ] [T041] [P1] [US1] [GREEN] T040のテストが通るよう実装を完成させる
  - E2Eテストが合格することを確認（Green）

---

## Phase 3: P2 - 場所の管理と選択

**User Story 2**: ユーザーは以前使用した場所を簡単に再選択でき、また新しい場所を追加できる。

### Presentationコンポーネント強化

- [ ] [T042] [P2] [US2] `LocationSelect`コンポーネントを強化する
  - オートコンプリート機能の最適化（SC-006: < 300ms）
  - 「新規追加: [場所名]」オプションの表示（AS2.2）
  - 場所リストのフィルタリング（AS2.4）

### Containerコンポーネント強化

- [ ] [T043] [P2] [US2] `LocationSelectContainer`コンポーネントを作成する
  - ファイル: `src/features/poker-sessions/containers/LocationSelectContainer.tsx`
  - `useLocations` hookを使用
  - `api.locations.create.useMutation()`で新規場所作成
  - 新規作成時のキャッシュ無効化
  - `LocationSelect`をレンダリング

- [ ] [T044] [P2] [US2] `SessionFormContainer`を更新して`LocationSelectContainer`を統合する

### 既存データ移行の検証

- [ ] [T045] [P2] [US2] 既存セッションデータの移行を検証する
  - マイグレーションスクリプトをテスト環境で実行
  - 既存の`location`文字列が正しく`locations`テーブルに移行されたか確認
  - `location_id`への変換が正しく行われたか確認

### 場所削除機能（FR-020対応）

- [ ] [T046] [P2] [US2] 場所管理UIコンポーネントを作成する（オプショナル）
  - ファイル: `src/features/poker-sessions/components/LocationManagement.tsx`
  - 場所リスト表示、削除ボタン
  - 削除確認ダイアログ（「この場所を使用している○件のセッションが『削除された場所』に変更されます」）

- [ ] [T047] [P2] [US2] 場所削除時のデフォルト値置換を実装する
  - `locations.delete` procedureの実装（T016）を完成させる
  - デフォルト場所の自動作成と保護
  - セッション更新のトランザクション処理

### 統合テスト（Test-First Development）

- [ ] [T048] [P2] [US2] [RED] 場所選択の統合テストを作成する
  - ファイル: `tests/integration/location-select.test.tsx`
  - シナリオ1: 既存場所の選択（AS2.1）
  - シナリオ2: 新規場所の追加（AS2.2, AS2.3）
  - シナリオ3: 場所リストのフィルタリング（AS2.4）
  - テストが失敗することを確認（Red）

- [ ] [T049] [P2] [US2] [RED] 場所削除の統合テストを作成する
  - ファイル: `tests/integration/delete-location-tag.test.tsx`
  - シナリオ: 場所削除後、セッションが「削除された場所」を表示
  - テストが失敗することを確認（Red）

- [ ] [T050] [P2] [US2] [GREEN] T048〜T049のテストが通るよう実装を完成させる
  - すべての統合テストが合格することを確認（Green）

### E2Eテスト（Test-First Development）

- [ ] [T051] [P2] [US2] [RED] 場所管理のE2Eテストを作成する
  - ファイル: `tests/e2e/locations.spec.ts`
  - シナリオ1: 場所選択とセッション作成
  - シナリオ2: 新規場所追加
  - シナリオ3: 場所削除とデフォルト値表示
  - パフォーマンス測定: 場所入力時間80%削減（SC-002）
  - テストが失敗することを確認（Red）

- [ ] [T052] [P2] [US2] [GREEN] T051のテストが通るよう実装を完成させる
  - E2Eテストが合格することを確認（Green）

---

## Phase 4: P3 - リッチテキストメモの記録

**User Story 3**: ユーザーはセッション中の重要な出来事や戦略を、太字・リスト・見出しなどの書式を使って詳細に記録できる。

### Presentationコンポーネント

- [ ] [T053] [P3] [US3] `RichTextEditor`コンポーネントを作成する
  - ファイル: `src/features/poker-sessions/components/RichTextEditor.tsx`
  - Props: `value`, `onChange`, `placeholder`
  - Tiptap v2 + `@mantine/tiptap`を使用
  - 拡張: StarterKit, Link
  - ツールバー: Bold, Italic, Underline, Strike, Heading, BulletList, OrderedList, Link
  - 最低5種類の書式設定対応（SC-003）

- [ ] [T054] [P3] [US3] `SessionForm`コンポーネントにメモフィールドを追加する
  - `RichTextEditor`コンポーネントを統合
  - メモの最大長バリデーション（50,000文字）

### HTMLサニタイゼーション

- [ ] [T055] [P3] [US3] フロントエンド用HTMLサニタイゼーション関数を作成する
  - ファイル: `src/lib/utils/sanitize.ts`（クライアント用）
  - DOMPurifyを使用（ブラウザ版）
  - `sanitizeHtml`関数をエクスポート
  - 許可タグと属性のホワイトリスト

- [ ] [T056] [P3] [US3] バックエンドのサニタイゼーションを強化する
  - T022で作成した関数を使用
  - `sessions.create`と`sessions.update`でサニタイズを適用

### セッション詳細表示の更新

- [ ] [T057] [P3] [US3] セッション詳細ページでHTML形式のメモを表示する
  - ファイル: `src/app/poker-sessions/[id]/page.tsx`
  - サニタイズされたHTMLを`dangerouslySetInnerHTML`で表示
  - 書式が保持されていることを確認（SC-004）

### 既存プレーンテキストメモの互換性確認

- [ ] [T058] [P3] [US3] 既存プレーンテキストメモの表示を確認する
  - 既存のプレーンテキストメモがHTML対応エディタでも正しく表示されるか検証
  - 必要に応じて表示ロジックを調整

### 統合テスト（Test-First Development）

- [ ] [T059] [P3] [US3] [RED] リッチテキストエディタの統合テストを作成する
  - ファイル: `tests/integration/rich-text-editor.test.tsx`
  - シナリオ1: エディタの表示とツールバー（AS3.1）
  - シナリオ2: テキストの書式設定（AS3.2）
  - シナリオ3: HTML形式での保存（AS3.3）
  - シナリオ4: 書式を保持した表示（AS3.4）
  - テストが失敗することを確認（Red）

- [ ] [T060] [P3] [US3] [GREEN] T059のテストが通るよう実装を完成させる
  - すべての統合テストが合格することを確認（Green）

### XSS攻撃テスト

- [ ] [T061] [P3] [US3] [RED] XSS攻撃防御のセキュリティテストを作成する
  - ファイル: `tests/integration/xss-prevention.test.tsx`
  - 危険なHTMLタグ（`<script>`, `<iframe>`, `onerror`属性等）の挿入試行
  - サニタイズ後に危険な要素が削除されていることを確認
  - XSS攻撃成功率0%（SC-009）
  - テストが失敗することを確認（Red）

- [ ] [T062] [P3] [US3] [GREEN] T061のテストが通るよう実装を完成させる
  - セキュリティテストが合格することを確認（Green）

### E2Eテスト（Test-First Development）

- [ ] [T063] [P3] [US3] [RED] リッチテキストメモのE2Eテストを作成する
  - ファイル: `tests/e2e/rich-text.spec.ts`
  - シナリオ: セッションにリッチテキストメモを記録し、詳細ページで確認
  - 書式崩れがないことを確認（SC-004）
  - テストが失敗することを確認（Red）

- [ ] [T064] [P3] [US3] [GREEN] T063のテストが通るよう実装を完成させる
  - E2Eテストが合格することを確認（Green）

---

## Phase 5: P4 - タグによる分類とフィルタリング

**User Story 4**: ユーザーはセッションに複数のタグを設定し、後でタグでフィルタリングして特定の条件のセッションを分析できる。

### Presentationコンポーネント

- [ ] [T065] [P4] [US4] `TagMultiSelect`コンポーネントを作成する
  - ファイル: `src/features/poker-sessions/components/TagMultiSelect.tsx`
  - Props: `value`, `onChange`, `tags`, `onCreateNew`, `isLoading`
  - Mantine `MultiSelect`（searchable, creatable）を使用
  - オートコンプリート候補表示（AS4.5）
  - タグ削除アイコン（AS4.2）
  - 最大20タグのバリデーション

- [ ] [T066] [P4] [US4] `SessionForm`コンポーネントにタグフィールドを追加する
  - `TagMultiSelect`コンポーネントを統合

- [ ] [T067] [P4] [US4] `SessionCard`コンポーネントを更新してタグを表示する
  - ファイル: `src/features/poker-sessions/components/SessionCard.tsx`
  - タグをバッジで表示（Mantine `Badge`）

- [ ] [T068] [P4] [US4] `SessionList`コンポーネントにタグフィルターUIを追加する
  - ファイル: `src/features/poker-sessions/components/SessionList.tsx`
  - タグフィルター選択UI
  - フィルター適用ボタン

### Containerコンポーネント

- [ ] [T069] [P4] [US4] `useTags` hookを作成する
  - ファイル: `src/features/poker-sessions/hooks/useTags.ts`
  - `api.tags.getAll.useQuery()`を使用
  - タグリストをフォーマット（`{ value, label }`形式）
  - 検索フィルター対応

- [ ] [T070] [P4] [US4] `TagMultiSelectContainer`コンポーネントを作成する
  - ファイル: `src/features/poker-sessions/containers/TagMultiSelectContainer.tsx`
  - `useTags` hookを使用
  - `api.tags.create.useMutation()`で新規タグ作成
  - 新規作成時のキャッシュ無効化
  - `TagMultiSelect`をレンダリング

- [ ] [T071] [P4] [US4] `SessionFormContainer`を更新して`TagMultiSelectContainer`を統合する

- [ ] [T072] [P4] [US4] `SessionListContainer`を更新してタグフィルター機能を追加する
  - ファイル: `src/features/poker-sessions/containers/SessionListContainer.tsx`
  - タグフィルター状態管理
  - `api.sessions.getFiltered.useQuery({ tagIds })`を使用
  - AND条件フィルタリング（AS4.4）

### タグ削除機能（FR-021対応）

- [ ] [T073] [P4] [US4] タグ管理UIコンポーネントを作成する（オプショナル）
  - ファイル: `src/features/poker-sessions/components/TagManagement.tsx`
  - タグリスト表示、削除ボタン
  - 削除確認ダイアログ（「このタグが設定されている○件のセッションから削除されます」）

- [ ] [T074] [P4] [US4] タグ削除時の関連削除を実装する
  - `tags.delete` procedureの実装（T020）を完成させる
  - `session_tags`の自動削除（ON DELETE CASCADE）
  - セッション自体は保持

### 統合テスト（Test-First Development）

- [ ] [T075] [P4] [US4] [RED] タグ選択の統合テストを作成する
  - ファイル: `tests/integration/tag-multi-select.test.tsx`
  - シナリオ1: タグの追加（AS4.1）
  - シナリオ2: タグの削除（AS4.2）
  - シナリオ3: オートコンプリート候補表示（AS4.5）
  - テストが失敗することを確認（Red）

- [ ] [T076] [P4] [US4] [RED] タグフィルタリングの統合テストを作成する
  - ファイル: `tests/integration/filter-by-tags.test.tsx`
  - シナリオ1: 単一タグフィルター（AS4.3）
  - シナリオ2: 複数タグフィルター（AND条件、AS4.4）
  - シナリオ3: 該当セッション0件時のメッセージ
  - テストが失敗することを確認（Red）

- [ ] [T077] [P4] [US4] [RED] タグ削除の統合テストを作成する
  - ファイル: `tests/integration/delete-location-tag.test.tsx`（既存ファイルに追加）
  - シナリオ: タグ削除後、セッションからタグが削除される
  - テストが失敗することを確認（Red）

- [ ] [T078] [P4] [US4] [GREEN] T075〜T077のテストが通るよう実装を完成させる
  - すべての統合テストが合格することを確認（Green）

### パフォーマンステスト

- [ ] [T079] [P4] [US4] タグフィルタリングのパフォーマンステストを作成する
  - 1000セッション、100タグのテストデータを作成
  - タグフィルタリング < 1秒（SC-005）
  - オートコンプリート < 300ms（SC-006）
  - クエリ最適化が必要な場合は実装

### E2Eテスト（Test-First Development）

- [ ] [T080] [P4] [US4] [RED] タグ管理のE2Eテストを作成する
  - ファイル: `tests/e2e/tags.spec.ts`
  - シナリオ1: タグ追加とセッション作成
  - シナリオ2: タグフィルタリング
  - シナリオ3: タグ削除と関連削除確認
  - テストが失敗することを確認（Red）

- [ ] [T081] [P4] [US4] [GREEN] T080のテストが通るよう実装を完成させる
  - E2Eテストが合格することを確認（Green）

---

## Phase 6: Polish & Optimization（最適化とリファクタリング）

### セッション編集機能の追加

- [ ] [T082] [Polish] セッション編集モーダル機能を実装する
  - `SessionModalContainer`を更新して編集モードをサポート
  - 既存セッションデータを初期値として読み込む
  - `sessions.update` mutationを使用

- [ ] [T083] [Polish] セッション詳細ページに編集ボタンを追加する
  - ファイル: `src/app/poker-sessions/[id]/page.tsx`
  - 編集ボタンクリックでモーダルを開く

### アクセシビリティ検証

- [ ] [T084] [Polish] WCAG 2.1 AA準拠を検証する
  - すべてのフォーム入力にlabel（既存対応の確認）
  - エラーメッセージにaria-live属性
  - カラーコントラスト比 >= 4.5:1
  - キーボードナビゲーション（Tab, Enter, Escape）
  - スクリーンリーダーテスト

### レスポンシブデザイン検証

- [ ] [T085] [Polish] レスポンシブデザインを検証する
  - デスクトップ（1920x1080）
  - タブレット（768x1024）
  - モバイル（375x667）
  - モーダルとフォームの表示を確認

### パフォーマンス最適化

- [ ] [T086] [Polish] クエリパフォーマンスを最適化する
  - インデックスが正しく使用されているか確認（EXPLAIN ANALYZE）
  - N+1問題の有無を確認
  - 必要に応じてクエリを最適化

- [ ] [T087] [Polish] フロントエンドのバンドルサイズを最適化する
  - 不要なインポートを削除
  - コード分割（dynamic import）を検討
  - Tiptap拡張を最小限に抑える

### エラーハンドリング強化

- [ ] [T088] [Polish] エラーハンドリングを強化する
  - ネットワークエラー時の入力内容保持（Edge Case）
  - データベースエラーの適切なユーザーメッセージ（日本語、解決策付き）
  - トースト通知でエラーを表示（Mantine `notifications`）

### ドキュメンテーション

- [ ] [T089] [Polish] ユーザーガイド（quickstart.md）を検証・更新する
  - 実装内容との整合性を確認
  - スクリーンショット追加（オプショナル）

- [ ] [T090] [Polish] コードコメントとJSDocを追加する
  - すべての公開API（tRPC procedures）にJSDoc
  - 複雑なロジックにコメント

### Success Criteria検証

- [ ] [T091] [Polish] Success Criteriaをすべて検証する
  - SC-001: セッション記録 < 60秒（E2Eテスト）
  - SC-002: 場所入力時間80%削減（ユーザーテストまたは推定）
  - SC-003: 5種類以上の書式設定対応（統合テスト）
  - SC-004: 書式崩れ0%（E2Eテスト）
  - SC-005: タグフィルタリング < 1秒（パフォーマンステスト）
  - SC-006: オートコンプリート < 300ms（パフォーマンステスト）
  - SC-007: モーダル開閉 < 200ms（E2Eテスト）
  - SC-008: 重複率0%（統合テスト）
  - SC-009: XSS攻撃成功率0%（セキュリティテスト）
  - SC-010: ユーザー満足度90%以上（ユーザーフィードバック、オプショナル）

### コードレビューとコミット

- [ ] [T092] [Polish] P1実装のコードレビューを依頼する
  - テストがすべて合格していることを確認
  - 憲法原則の遵守を確認
  - レビュー承認後にGitコミット

- [ ] [T093] [Polish] P2実装のコードレビューを依頼する
  - レビュー承認後にGitコミット

- [ ] [T094] [Polish] P3実装のコードレビューを依頼する
  - レビュー承認後にGitコミット

- [ ] [T095] [Polish] P4実装のコードレビューを依頼する
  - レビュー承認後にGitコミット

---

## Task Dependencies & Parallel Execution

### 依存関係グラフ

```
T001 (Setup)
  ↓
T002-T006 (DB Schema) → T007-T021 (API Routers) → T023-T026 (Contract Tests)
  ↓                           ↓
T022 (Sanitize)               ↓
  ↓                           ↓
T027-T037 (P1 Components & Pages) → T038-T041 (P1 Tests)
  ↓
T042-T052 (P2 Location Management)
  ↓
T053-T064 (P3 Rich Text)
  ↓
T065-T081 (P4 Tagging)
  ↓
T082-T095 (Polish)
```

### 並列実行可能なタスク

**Phase 1: Foundational**
- T002, T003, T004（DBスキーマ定義）は並列実行可能
- T007-T012（sessions router）と T013-T016（locations router）と T017-T020（tags router）は並列実行可能
- T023, T024, T025（契約テスト作成）は並列実行可能

**Phase 2: P1**
- T027, T028, T029（Presentationコンポーネント）は並列実行可能
- T030, T031, T032（hooks）は並列実行可能
- T035, T036, T037（ページ更新）は並列実行可能

**Phase 3: P2**
- T042（LocationSelect強化）と T043（LocationSelectContainer）は並列実行可能

**Phase 4: P3**
- T053, T054, T055（リッチテキスト関連）は並列実行可能

**Phase 5: P4**
- T065, T066, T067, T068（タグ関連コンポーネント）は並列実行可能
- T069, T070（タグ関連Container）は並列実行可能

---

## Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 0: Setup | T001 | 10分 |
| Phase 1: Foundational | T002-T026 | 2〜3日 |
| Phase 2: P1 | T027-T041 | 2〜3日 |
| Phase 3: P2 | T042-T052 | 1〜2日 |
| Phase 4: P3 | T053-T064 | 1〜2日 |
| Phase 5: P4 | T065-T081 | 2〜3日 |
| Phase 6: Polish | T082-T095 | 1〜2日 |
| **Total** | **95 tasks** | **9〜15日** |

---

## Notes

- すべてのフェーズでTDD（Red-Green-Refactor）サイクルを遵守
- 各優先度（P1→P2→P3→P4）完了時にレビュー依頼
- 憲法原則（テスト駆動、日本語ファースト、レイヤー分離、こまめなレビュー、UX一貫性、ドキュメンテーション）を遵守
- 削除動作（FR-020, FR-021）を確実にテスト
- Success Criteriaを常に意識して実装

---

**Version**: 1.0
**Status**: Ready for Implementation
**Last Updated**: 2025-10-26
