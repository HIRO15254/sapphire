# Tasks Document

## Phase 1: lib/ - 型定義・スキーマの作成

- [x] 1. 型定義ファイルの作成
  - File: src/features/currencies/lib/types.ts
  - Currency型を定義（id, name, currentBalance, isArchived）
  - Purpose: 全コンポーネントで共通使用する型を集約
  - _Leverage: src/app/(main)/currencies/CurrenciesContent.tsx（既存のCurrency型定義: RouterOutputs['currency']['list']['currencies'][number]）_
  - _Requirements: 1_
  - _Prompt: Implement the task for spec currency-page-rework, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer | Task: Create types.ts with Currency interface (id: string, name: string, currentBalance: number, isArchived: boolean). This is a simplified type for the feature module, not the full API response type. | Restrictions: Do not import from tRPC RouterOutputs. Define a standalone interface. Only create new file. | _Leverage: src/app/(main)/currencies/CurrenciesContent.tsx for reference on fields used. | Success: Currency type compiles without errors, covers all fields used in CurrencyList. Set task in progress in tasks.md before starting, use log-implementation tool after completion, mark as complete when done._

- [x] 2. Zodスキーマの作成
  - File: src/features/currencies/lib/schemas.ts
  - newCurrencyFormSchema, NewCurrencyFormInput型を定義
  - Purpose: フォームバリデーションスキーマを集約
  - _Leverage: src/app/(main)/currencies/new/NewCurrencyContent.tsx（既存のcreateCurrencySchema）_
  - _Requirements: 2_
  - _Prompt: Implement the task for spec currency-page-rework, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer | Task: Create schemas.ts with newCurrencyFormSchema (name: string min(1) max(255), initialBalance: number int min(0)). Export inferred type as NewCurrencyFormInput. Migrate from createCurrencySchema in NewCurrencyContent.tsx. | Restrictions: Schema must match existing validation rules exactly. Use Japanese error messages matching existing. | _Leverage: src/app/(main)/currencies/new/NewCurrencyContent.tsx for existing schema. | Success: Schema validates same inputs as existing implementation. Set task in progress in tasks.md before starting, use log-implementation tool after completion, mark as complete when done._

## Phase 2: components/ - UIコンポーネントの作成

- [x] 3. CurrencyFABコンポーネントの作成
  - File: src/features/currencies/components/CurrencyFAB.tsx
  - 独立したFABコンポーネントとして実装
  - Purpose: 再利用可能なFABコンポーネント（新規通貨作成ドロワーを開く）
  - _Leverage: src/features/sessions/components/SessionFAB.tsx（同一パターン）_
  - _Requirements: 3_
  - _Prompt: Implement the task for spec currency-page-rework, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Developer | Task: Create CurrencyFAB.tsx component following the same pattern as SessionFAB.tsx. Props: { onOpen: () => void }. Use Mantine Affix + ActionIcon with plus icon. | Restrictions: Keep styling identical to SessionFAB. Use 'use client' directive. | _Leverage: src/features/sessions/components/SessionFAB.tsx for exact pattern. | Success: FAB renders identically to SessionFAB pattern, positioned bottom-right. Set task in progress in tasks.md before starting, use log-implementation tool after completion, mark as complete when done._

- [x] 4. CurrencyListコンポーネントの作成
  - File: src/features/currencies/components/CurrencyList.tsx
  - リスト表示・空状態処理・アーカイブトグルを実装
  - Purpose: 通貨リストの純粋なUI表示
  - _Leverage: src/app/(main)/currencies/CurrenciesContent.tsx（既存のリスト表示UI）_
  - _Requirements: 1, 4_
  - _Prompt: Implement the task for spec currency-page-rework, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Developer | Task: Create CurrencyList.tsx component. Migrate list UI from CurrenciesContent.tsx. Props: { currencies: Currency[], includeArchived: boolean, onIncludeArchivedChange: (value: boolean) => void, onOpenNewCurrency: () => void }. Include archive toggle checkbox, empty state with create button, and currency cards with Link to detail page. Show balance in teal (>=0) or red (<0). Show archive badge for archived currencies. | Restrictions: Use types from ../lib/types.ts. Use 'use client' directive. Currency cards must link to /currencies/{id}. Do not include data fetching logic. | _Leverage: src/app/(main)/currencies/CurrenciesContent.tsx for existing UI, src/features/sessions/components/SessionList.tsx for pattern reference. | Success: List renders identically to existing, handles empty state, archive toggle works via callback. Set task in progress in tasks.md before starting, use log-implementation tool after completion, mark as complete when done._

- [x] 5. NewCurrencyFormコンポーネントの作成
  - File: src/features/currencies/components/NewCurrencyForm.tsx
  - フォームUI実装（Server Action呼び出しは外部注入）
  - Purpose: 再利用可能なフォームUI
  - _Leverage: src/app/(main)/currencies/new/NewCurrencyContent.tsx（既存のフォーム実装）_
  - _Requirements: 2_
  - _Prompt: Implement the task for spec currency-page-rework, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Developer | Task: Create NewCurrencyForm.tsx component. Migrate form UI from NewCurrencyContent.tsx. Props: { onSubmit: (data: NewCurrencyFormData) => void | Promise<void>, isSubmitting?: boolean, onCancel: () => void }. Export NewCurrencyFormData type. Use useForm with zodResolver and newCurrencyFormSchema from schemas.ts. Fields: name (TextInput), initialBalance (NumberInput). | Restrictions: Remove server action import and direct call. Remove router navigation (parent responsibility). Remove error state management (parent handles). Form should call props.onSubmit with form data only. Use mode: 'uncontrolled'. Use 'use client' directive. | _Leverage: src/app/(main)/currencies/new/NewCurrencyContent.tsx for existing form, src/features/sessions/components/NewSessionForm.tsx for pattern. | Success: Form renders with validation, delegates submission to parent via onSubmit callback. Set task in progress in tasks.md before starting, use log-implementation tool after completion, mark as complete when done._

## Phase 3: Public API・統合

- [x] 6. index.tsの作成
  - File: src/features/currencies/index.ts
  - 全コンポーネント・型・スキーマのエクスポート
  - Purpose: Public APIの定義
  - _Requirements: All_
  - _Prompt: Implement the task for spec currency-page-rework, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer | Task: Create index.ts with all public exports as defined in design.md. Export CurrencyList, CurrencyFAB, NewCurrencyForm components. Export Currency type. Export NewCurrencyFormData type. Export newCurrencyFormSchema and NewCurrencyFormInput. | Restrictions: Only export public API, do not expose internal implementation details. | Success: All exports work correctly, can import from '~/features/currencies'. Set task in progress in tasks.md before starting, use log-implementation tool after completion, mark as complete when done._

- [x] 7. CurrenciesContent.tsxの更新
  - File: src/app/(main)/currencies/CurrenciesContent.tsx
  - featuresからインポートするよう変更、ドロワー追加
  - Purpose: 薄いラッパーとして機能させる
  - _Leverage: src/features/currencies/index.ts, src/app/(main)/currencies/actions/currency.ts_
  - _Requirements: All_
  - _Prompt: Implement the task for spec currency-page-rework, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Developer | Task: Update CurrenciesContent.tsx to import CurrencyList, CurrencyFAB, NewCurrencyForm from ~/features/currencies. Add Drawer (Mantine) with position="bottom" for NewCurrencyForm. Add useDisclosure for drawer state. Add useTransition for form submission. Handle createCurrency server action call, success notification, and redirect to detail page. | Restrictions: Maintain existing data fetching logic (initialCurrencies + lazy archived fetch). Keep usePageTitle call. Remove inline list rendering (delegate to CurrencyList). Remove inline empty state (delegate to CurrencyList). | _Leverage: src/app/(main)/sessions/SessionsContent.tsx for pattern reference. | Success: Page works identically to before plus new FAB and drawer for creation. Set task in progress in tasks.md before starting, use log-implementation tool after completion, mark as complete when done._

- [x] 8. 旧新規作成ページの削除
  - Files: src/app/(main)/currencies/new/page.tsx, src/app/(main)/currencies/new/NewCurrencyContent.tsx
  - ドロワー移行後に旧新規作成ページを削除
  - Purpose: 不要になったページを削除、コード重複を解消
  - _Requirements: All_
  - _Prompt: Implement the task for spec currency-page-rework, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Developer | Task: Delete src/app/(main)/currencies/new/ directory (page.tsx and NewCurrencyContent.tsx). These are replaced by the drawer in CurrenciesContent.tsx. | Restrictions: Only delete after confirming all functionality works with new drawer approach. Verify no other files import from these deleted files. | Success: Old files deleted, no broken imports, new currency creation works via drawer. Set task in progress in tasks.md before starting, use log-implementation tool after completion, mark as complete when done._
