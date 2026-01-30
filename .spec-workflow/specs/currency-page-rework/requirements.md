# Requirements Document

## Introduction

通貨管理ページをセッションページと同様のUIパターンにリワークする。現在の通貨ページは単純なリスト表示で新規作成は別ページへ遷移するが、セッションページで採用されているFAB (Floating Action Button)、ボトムシートドロワー、コンポーネント分離のパターンを適用し、一貫性のあるUXを実現する。

なお、通貨はセッションと異なり高々10個程度の想定のため、フィルター機能は実装しない。アーカイブ表示のトグルは現状のチェックボックス形式を維持する。

## Target File Structure

### 採用: `src/features`での集約

セッションページと同様に、`src/features`での集約アプローチを採用する。

**理由:**
- AI利用性: `src/features/currencies`を指定すれば全コンテキストが取得可能
- 再利用性: 他のfeatureから容易にインポート可能
- 一貫性: セッションページと同じアーキテクチャパターン

### フォルダ構成

```
src/
├── app/(main)/currencies/
│   ├── page.tsx                    # Server Component (データフェッチ)
│   ├── CurrenciesContent.tsx       # 薄いClient Component (featuresからインポート)
│   ├── new/                        # 削除予定 (ドロワー移行後)
│   │   └── ...
│   └── [id]/                       # 詳細ページ (既存・変更なし)
│       └── ...
│
└── features/
    └── currencies/
        ├── index.ts                # Public exports
        │
        ├── components/             # UIコンポーネント
        │   ├── CurrencyList.tsx    # リスト表示・空状態
        │   ├── CurrencyFAB.tsx     # FAB (新規作成)
        │   └── NewCurrencyForm.tsx # 新規通貨作成フォーム
        │
        └── lib/                    # ロジック・ユーティリティ
            ├── types.ts            # 型定義 (Currency等)
            └── schemas.ts          # Zodスキーマ (newCurrencyFormSchema)
```

**インポートパス例:**
```typescript
// src/app/(main)/currencies/CurrenciesContent.tsx
import { CurrencyList, CurrencyFAB, NewCurrencyForm } from '~/features/currencies'
import type { Currency } from '~/features/currencies'
```

## Alignment with Product Vision

- **シンプルさ優先**: FABとボトムシートにより素早く操作できるUIを維持
- **マルチ通貨管理**: product.mdに記載の「異なる通貨やチップ体系を店舗ごとに管理」を支援するUIの改善

## Requirements

### Requirement 1: コンポーネント分離

**User Story:** As a 開発者, I want コンポーネントを機能ごとに分離したい, so that コードの保守性と再利用性が向上する

#### Acceptance Criteria

1. WHEN 通貨ページが表示される THEN システム SHALL `CurrenciesContent`と`~/features/currencies`のコンポーネントで構成される
2. IF `CurrencyList`コンポーネントが存在する THEN システム SHALL 通貨リストの表示と空状態の表示を担当する
3. IF `CurrenciesContent`コンポーネントが存在する THEN システム SHALL 状態管理とドロワー制御を担当する
4. IF 型定義が必要になる THEN システム SHALL `~/features/currencies`からインポートする

### Requirement 2: ボトムシートドロワーによる新規通貨作成

**User Story:** As a ポーカープレイヤー, I want 通貨一覧画面から直接新規通貨を追加したい, so that ページ遷移なしで素早く通貨を登録できる

#### Acceptance Criteria

1. WHEN ユーザーがFABまたは新規作成ボタンをタップする THEN システム SHALL ボトムシートドロワーで新規通貨作成フォームを表示する
2. WHEN フォームが送信される AND バリデーションが成功する THEN システム SHALL 通貨を作成しドロワーを閉じ、リストを更新する
3. WHEN ユーザーがドロワーを閉じる THEN システム SHALL フォーム入力をリセットする

### Requirement 3: FAB (Floating Action Button)

**User Story:** As a ポーカープレイヤー, I want 画面のどこにいても新規通貨を追加できるボタンが欲しい, so that スクロール位置に関係なく素早く追加できる

#### Acceptance Criteria

1. WHEN 通貨ページが表示される THEN システム SHALL 画面右下に固定されたFABを表示する
2. IF 通貨が0件 THEN システム SHALL 空状態のカード内とFABの両方で新規作成ボタンを表示する
3. WHEN FABがタップされる THEN システム SHALL 新規通貨作成ドロワーを開く

### Requirement 4: 通貨リストUI改善

**User Story:** As a ポーカープレイヤー, I want 通貨リストで必要な情報を一目で確認したい, so that 効率的に通貨を管理できる

#### Acceptance Criteria

1. WHEN 通貨リストが表示される THEN システム SHALL 各通貨カードに通貨名、現在残高、アーカイブ状態を表示する
2. IF 残高が0以上 THEN システム SHALL 残高を緑色（teal）で表示する
3. IF 残高が0未満 THEN システム SHALL 残高を赤色（red）で表示する
4. IF 通貨がアーカイブ済み THEN システム SHALL アーカイブ状態を示すバッジを表示する
5. WHEN 通貨が0件 THEN システム SHALL 「通貨が登録されていません」メッセージと新規作成ボタンを表示する

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: `CurrencyList`、`NewCurrencyForm`、`CurrencyFAB`は各々単一の責務を持つ
- **Modular Design**: セッションページと同様の`src/features`構成パターンを適用
- **Dependency Management**: 親コンポーネント（`CurrenciesContent`）が状態を管理し、子コンポーネントにpropsで渡す
- **Clear Interfaces**: 各コンポーネントは明確なprops interfaceを定義
- **Public API**: `index.ts`でpublic exportsを定義

### Performance
- 通貨数は高々10個程度のため、アーカイブ済み含め全件を初回フェッチで取得

### Security
- 既存のマルチテナント分離を維持
- サーバーからのデータはユーザー所有のもののみ

### Reliability
- エラー状態の適切な表示を維持

### Usability
- セッションページと一貫したUIパターンにより学習コストを削減
- ボトムシートドロワーによりモバイルでの操作性を向上

### Testability
- コンポーネントはpropsのみに依存する設計
