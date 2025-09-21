# TDD Redフェーズ（失敗するテスト作成）- ResponsiveLayout

## 実行日時
2025-09-21 04:33

## 対象テストケース
TASK-101: ResponsiveLayout（最上位）コンポーネントの全テストケース

## 作成したテストコード

### テストファイル
`src/components/layout/ResponsiveLayout/ResponsiveLayout.test.tsx`

### テスト実行コマンド
```bash
bun run test src/components/layout/ResponsiveLayout/ResponsiveLayout.test.tsx
```

### 期待される失敗メッセージ
```
Error: ResponsiveLayout component not implemented yet
```

**実際の失敗結果**: ✅ 期待通り
- 全10テストケースが「ResponsiveLayout component not implemented yet」エラーで失敗
- Test Files: 1 failed (1)
- Tests: 10 failed (10)

## 作成したテストケース一覧

### 正常系テストケース（4件）
1. **TC-001**: 768px以下でモバイルレイアウトが正しく表示される
2. **TC-002**: 769px以上でデスクトップレイアウトが正しく表示される
3. **TC-003**: navigationConfigに基づいてメニュー項目が正しく表示される
4. **TC-004**: themeプロパティに基づいてMantineProviderのテーマが適用される

### 異常系テストケース（3件）
1. **TC-101**: navigationConfigが不正な形式の場合適切にフォールバックされる
2. **TC-102**: useMediaQueryが利用できない環境での処理
3. **TC-103**: childrenが渡されない場合の安全な表示

### 境界値テストケース（3件）
1. **TC-201**: 768px境界値でのレイアウト切り替え
2. **TC-202**: 極小画面(320px)での表示
3. **TC-204**: navigationConfig空配列での動作

## 技術スタック

### 使用言語/フレームワーク
- **TypeScript + React 19.1.0**: 型安全性とMantine 8.3.0型サポート活用
- **Vitest + React Testing Library**: 高速実行とReact 19対応
- **Jest DOM**: Mantine互換性とアクセシビリティテスト

### モック設定
```typescript
// useMediaQueryモック（レスポンシブテスト用）
const mockUseMediaQuery = vi.fn();
vi.mock("@mantine/hooks", () => ({
  ...vi.importActual("@mantine/hooks"),
  useMediaQuery: () => mockUseMediaQuery(),
}));
```

## 日本語コメント詳細

### コメント設計方針
各テストケースに以下の構造化コメントを配置：

1. **テスト開始時**: 目的・内容・期待動作・信頼性レベル
2. **データ準備**: 準備理由・初期条件
3. **処理実行**: 実行内容・処理詳細
4. **結果検証**: 検証項目・期待結果・確認内容

### 信頼性レベル記録
- 🟢 **青信号**: EARS要件から直接確認（6件）
- 🟡 **黄信号**: 設計文書から妥当推測（4件）

## 作成ファイル構造

```
src/components/layout/ResponsiveLayout/
├── ResponsiveLayout.tsx          # メインコンポーネント（プレースホルダー）
├── ResponsiveLayout.test.tsx     # テストファイル（失敗テスト）
├── types.ts                      # TypeScript型定義
└── index.ts                      # エクスポート定義
```

### 型定義
```typescript
interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType<TablerIconsProps>;
  group?: string;
  badge?: string | number;
  hasNotification?: boolean;
  description?: string;
}

interface NavigationConfig {
  primary: NavigationItem[];
  secondary: NavigationItem[];
}

interface ResponsiveLayoutProps {
  children?: React.ReactNode;
  navigationConfig: NavigationConfig;
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
}
```

## プレースホルダー実装

```typescript
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = (props) => {
  // This is a placeholder implementation that will fail all tests
  // The actual implementation will be created in the Green phase
  throw new Error('ResponsiveLayout component not implemented yet');
};
```

## Greenフェーズへの要求事項

### 必須実装項目

#### 1. レスポンシブ機能
- `useMediaQuery('(max-width: 48em)')` による画面サイズ検知
- 768px境界でのモバイル/デスクトップレイアウト切り替え
- リアルタイムレスポンシブ対応

#### 2. レイアウト構成（Mantine AppShell）
- **モバイル**: Header + Footer + Drawer
- **デスクトップ**: Header + Navbar + Main

#### 3. ナビゲーション統合
- NavigationProvider統合
- primary/secondaryナビゲーション配置
- グループ化とアイコン表示

#### 4. テーマシステム
- MantineProvider統合
- light/dark/autoテーマ切り替え
- カスタムプライマリカラー対応

#### 5. エラーハンドリング
- 不正navigationConfig処理
- useMediaQuery失敗時フォールバック
- children未指定時の安全表示

#### 6. アクセシビリティ
- 適切なrole属性
- aria-label設定
- 44px以上タップ領域確保

### パフォーマンス要件
- レイアウト切り替え200ms以内
- メニュー開閉300ms以内
- 初回レンダリング1秒以内

## 品質判定

### ✅ 高品質達成
- **テスト実行**: 成功（全テストが期待通り失敗）
- **期待値**: 明確で具体的（role属性、要素存在確認等）
- **アサーション**: 適切（toBeInTheDocument, toHaveAttribute等）
- **実装方針**: 明確（Mantine AppShell + useMediaQuery）

### 特徴
- **包括的カバレッジ**: 正常系・異常系・境界値を網羅
- **実用的テストデータ**: 実際のアプリケーション使用場面を想定
- **TypeScript型安全性**: 厳密な型定義による開発効率向上
- **アクセシビリティ重視**: WCAG 2.1 AA準拠の検証項目

## 次のステップ

**推奨コマンド**: `/tdd-green` でGreenフェーズ（最小実装）を開始

### Greenフェーズで実装予定
1. Mantine AppShell基本構造
2. useMediaQueryフック統合
3. 条件分岐レイアウト（モバイル/デスクトップ）
4. 基本ナビゲーション表示
5. テーマプロバイダー統合
6. エラーハンドリング機能

全テストが成功するまでの最小限の実装を段階的に進行予定。