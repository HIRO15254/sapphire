# Quickstart: MVP Brushup

このガイドは、MVP ブラッシュアップフェーズの実行手順を説明します。

## 前提条件

- MVP（Phase 1-6）が完了していること
- Node.js 20+ / Bun がインストールされていること
- PostgreSQL データベースが稼働していること

## Phase B1: テスト検証

### 1.1 テストスイートの実行

```bash
# 全テストを実行
bun run test

# E2Eテストを実行
bun run test:e2e

# カバレッジレポート生成
bun run test --coverage
```

### 1.2 失敗テストの確認

失敗したテストがあれば、リファクタリング前に修正してください。

### 1.3 ベースラインカバレッジの記録

```bash
# カバレッジHTMLレポートを確認
open coverage/index.html
```

現在のカバレッジを記録し、ブラッシュアップ後に改善されていることを確認します。

---

## Phase B2: ファイル分割

### 2.1 優先順位

| 優先度 | ファイル | 行数 | 分割方針 |
|--------|----------|------|----------|
| 1 | StoreDetailContent.tsx | 2406 | セクション・モーダル分離 |
| 2 | stores/actions.ts | 986 | エンティティ別分離 |
| 3 | SessionDetailContent.tsx | 789 | セクション・フォーム分離 |
| 4 | currency.ts (router) | 689 | queries/mutations分離 |
| 5 | CurrencyDetailContent.tsx | 598 | セクション分離 |
| 6 | tournament.ts (router) | 481 | queries/mutations分離 |
| 7 | currencies/actions.ts | 416 | アクション種別分離 |
| 8 | EditSessionContent.tsx | 401 | フォーム抽出 |

### 2.2 分割手順

各ファイルに対して以下を実行:

1. **現状把握**: ファイルを読み込み、論理的なセクションを特定
2. **型定義抽出**: 共有型を `types.ts` に抽出
3. **サブコンポーネント作成**: 各セクションを独立ファイルに
4. **インポート更新**: 既存のインポートを新構造に更新
5. **テスト実行**: 分割後にテストが通ることを確認

### 2.3 分割パターン

#### コンポーネント分割
```
XxxContent.tsx (2000行)
  ↓ 分割
XxxContent.tsx (200行) - オーケストレーター
XxxHeader.tsx (100行)
XxxSection.tsx (150行)
XxxForm.tsx (200行)
XxxModal.tsx (150行)
XxxTable.tsx (200行)
types.ts (50行)
```

#### ルーター分割
```
xxx.ts (600行)
  ↓ 分割
xxx/
├── index.ts (30行) - マージルーター
├── queries.ts (300行)
└── mutations.ts (300行)
```

#### アクション分割
```
actions.ts (800行)
  ↓ 分割
actions/
├── index.ts (10行) - re-export
├── entity1.ts (300行)
├── entity2.ts (250行)
└── entity3.ts (250行)
```

### 2.4 分割後の確認

```bash
# ファイルサイズ監査
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -n | tail -20

# 400行以上のファイルがないことを確認
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 400 {print}'
```

---

## Phase B3: React Cosmos 導入

### 3.1 インストール

```bash
bun add -D react-cosmos react-cosmos-next
```

### 3.2 設定ファイル作成

#### `cosmos.config.json`
```json
{
  "$schema": "http://json.schemastore.org/cosmos-config",
  "rendererUrl": {
    "dev": "http://localhost:3000/cosmos/<fixture>",
    "export": "/cosmos/<fixture>.html"
  },
  "staticPath": "public",
  "watchDirs": ["src"],
  "port": 5000
}
```

#### `src/app/cosmos/[fixture]/page.tsx`
```typescript
import { nextCosmosPage, nextCosmosStaticParams } from 'react-cosmos-next';
import * as cosmosImports from '../../../../cosmos.imports';

export const generateStaticParams = nextCosmosStaticParams(cosmosImports);
export default nextCosmosPage(cosmosImports);
```

#### `src/cosmos.decorator.tsx`
```typescript
'use client'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/tiptap/styles.css'
import '~/styles/globals.css'

import { createTheme, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import type React from 'react'

const theme = createTheme({
  fontFamily: 'sans-serif',
  lineHeights: {
    xs: '1.5',
    sm: '1.6',
    md: '1.75',
    lg: '1.8',
    xl: '1.9',
  },
})

export default function CosmosDecorator({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MantineProvider defaultColorScheme="auto" theme={theme}>
      <Notifications position="top-right" />
      {children}
    </MantineProvider>
  )
}
```

### 3.3 package.json スクリプト追加

```json
{
  "scripts": {
    "cosmos": "cosmos --expose-imports",
    "cosmos-export": "cosmos-export --expose-imports"
  }
}
```

### 3.4 .gitignore 追加

```gitignore
# React Cosmos
cosmos.imports.js
```

### 3.5 型定義ファイル作成

TypeScript で cosmos.imports の型を認識させるため、`cosmos.imports.d.ts` を作成:

```typescript
// cosmos.imports.d.ts
import type { RendererConfig, UserModuleWrappers } from 'react-cosmos-core'

declare const cosmosImports: {
  rendererConfig: RendererConfig
  moduleWrappers: UserModuleWrappers
}

export = cosmosImports
```

`tsconfig.json` のパスに追加:

```json
{
  "compilerOptions": {
    "paths": {
      "../../../../cosmos.imports": ["./cosmos.imports.d.ts"]
    }
  }
}
```

### 3.6 フィクスチャ作成

各 `src/components/` コンポーネントにフィクスチャを作成:

```
src/components/
├── layouts/
│   ├── AppShell.tsx
│   └── __fixtures__/
│       └── AppShell.fixture.tsx
├── auth/
│   ├── SignOutButton.tsx
│   └── __fixtures__/
│       └── SignOutButton.fixture.tsx
└── ui/
    ├── ThemeToggle.tsx
    ├── LoadingOverlay.tsx
    ├── ErrorBoundary.tsx
    ├── GoogleMapsLink.tsx
    ├── RichTextEditor.tsx
    └── __fixtures__/
        ├── ThemeToggle.fixture.tsx
        ├── LoadingOverlay.fixture.tsx
        ├── ErrorBoundary.fixture.tsx
        ├── GoogleMapsLink.fixture.tsx
        └── RichTextEditor.fixture.tsx
```

#### フィクスチャ例（単一バリアント）
```typescript
'use client'

import { Stack, Text } from '@mantine/core'
import { ThemeToggle } from '../ThemeToggle'

export default function ThemeToggleFixture() {
  return (
    <Stack align="center" gap="md" p="xl">
      <Text c="dimmed" size="sm">
        ライト/ダークモードを切り替えるボタン
      </Text>
      <ThemeToggle />
    </Stack>
  )
}
```

#### フィクスチャ例（複数バリアント）
```typescript
'use client'

import { Stack, Text } from '@mantine/core'
import { GoogleMapsLink } from '../GoogleMapsLink'

export default {
  Default: (
    <Stack p="md">
      <GoogleMapsLink url="https://maps.google.com/?q=Tokyo" />
    </Stack>
  ),

  SizeVariants: (
    <Stack p="md">
      <GoogleMapsLink size="xs" url="https://maps.google.com/?q=Tokyo" />
      <GoogleMapsLink size="md" url="https://maps.google.com/?q=Tokyo" />
      <GoogleMapsLink size="lg" url="https://maps.google.com/?q=Tokyo" />
    </Stack>
  ),
}
```

### 3.7 Cosmos 起動

```bash
# ターミナル1: Next.js 開発サーバー
bun run dev

# ターミナル2: Cosmos
bun run cosmos
```

ブラウザで http://localhost:5000 を開いてフィクスチャを確認。

---

## Phase B4: UI ブラッシュアップ

### 4.1 スペーシング監査

全ページを確認し、以下を統一:
- ページコンテナ: `p="md"` または `p="lg"`
- カード: `p="md"`
- Stack/Group: `gap="md"`
- フォーム要素間: `gap="sm"`

### 4.2 フォームレイアウト監査

- ラベルは入力フィールドの上
- 必須フィールドにはアスタリスク
- エラーメッセージは Mantine 標準スタイル
- 送信ボタンは右寄せまたは全幅

### 4.3 テーブル監査

- Mantine Table コンポーネント使用
- カラムヘッダー整列統一
- 空状態メッセージ表示
- ローディング時は Skeleton 使用

### 4.4 ステート監査

- 空状態: 説明テキスト + CTAボタン
- ローディング: Skeleton コンポーネント
- エラー: Alert コンポーネント（赤色）
- 成功: Notification（緑色）

### 4.5 ボタン/アイコン監査

- プライマリアクション: filled バリアント
- セカンダリアクション: outline または subtle
- 破壊的アクション: red カラー
- アイコン: @tabler/icons-react のみ使用

---

## Phase B5: 最終検証

### 5.1 テスト再実行

```bash
# 全テスト
bun run test

# E2Eテスト
bun run test:e2e
```

### 5.2 カバレッジ確認

```bash
bun run test --coverage
# ベースラインと比較し、低下していないことを確認
```

### 5.3 ファイルサイズ最終確認

```bash
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 400 {print}'
# 出力がないことを確認
```

### 5.4 ビルド・型チェック・リント

```bash
bun run build
bun run typecheck
bun run lint
```

### 5.5 Cosmos 動作確認

```bash
bun run cosmos
# 全コンポーネントが表示され、テーマ切り替えが動作することを確認
```

---

## 完了チェックリスト

- [ ] 全テストが通過
- [ ] src/ 内のファイルが400行以下
- [ ] React Cosmos が起動し全コンポーネント表示
- [ ] UI一貫性チェック完了
- [ ] ビルド成功
- [ ] 型チェック成功
- [ ] リント成功

## 次のステップ

ブラッシュアップ完了後:
1. Phase 7（Active Session Recording）の実装開始
2. または `/speckit.tasks` で tasks-brushup.md を生成
