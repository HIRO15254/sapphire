# TASK-103 FooterNavigation TDDテストケース定義書

**【対象コンポーネント】**: FooterNavigation
**【対象ファイル】**: `src/components/layout/ResponsiveLayout/components/FooterNavigation.tsx`
**【作成日】**: 2025-09-22
**【TDDフェーズ】**: Redフェーズ（失敗するテスト作成）用

## 1. テスト環境設定

### テストフレームワーク
- **テストランナー**: Vitest 2.1.4
- **UIテスト**: React Testing Library 16.2.0
- **型チェック**: TypeScript 5.7.3
- **モック**: vitest/vi（NavigationItem、スタイル検証用）

### モック設定パターン
```typescript
// NavigationItemの標準モック
const mockNavigationItems: NavigationItem[] = [
  { id: "home", label: "ホーム", path: "/", icon: IconHome },
  { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
  { id: "settings", label: "設定", path: "/settings", icon: IconSettings },
];

// プロパティの標準設定
const defaultProps: FooterNavigationProps = {
  items: mockNavigationItems,
};
```

## 2. 正常系テストケース（Normal Cases）

### TC-103-N001: フッターナビゲーション基本表示
**【テスト名】**: フッターナビゲーション基本表示
- **何をテストするか**: FooterNavigationコンポーネントが正常にレンダリングされ、基本要素が表示される
- **期待される動作**: フッター領域にナビゲーション項目群が適切に配置される

**【入力値】**:
```typescript
items: [
  { id: "home", label: "ホーム", path: "/", icon: IconHome },
  { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
]
```
- **入力データの意味**: 標準的な2項目のナビゲーション設定

**【期待される結果】**:
```typescript
// フッターナビゲーション表示
expect(screen.getByRole("navigation")).toBeInTheDocument();

// ナビゲーション項目表示
expect(screen.getByText("ホーム")).toBeInTheDocument();
expect(screen.getByText("ユーザー")).toBeInTheDocument();

// space-around配置でのGroup表示
expect(screen.getByRole("navigation")).toHaveStyle({
  justifyContent: "space-around"
});
```
- **期待結果の理由**: REQ-002「スマートフォン表示時にフッターメニューを表示」の要件準拠

**【テストの目的】**: 基本的なフッターナビゲーション表示機能の確認
- **確認ポイント**: Mantineコンポーネントの適切な統合とlayout表示

🟢 **信頼性レベル**: 高（EARS要件REQ-002、既存実装確認済み）
**【参照要件】**: REQ-002「スマートフォン表示時にフッターメニューを表示」

---

### TC-103-N002: アイコン付きナビゲーション項目表示
**【テスト名】**: アイコン付きナビゲーション項目表示
- **何をテストするか**: アイコン付きNavigationItem配列で各項目のアイコンとラベルが正常表示される
- **期待される動作**: 各フッター項目でアイコンがラベル上部に、ラベルが下部に表示される

**【入力値】**:
```typescript
const iconItems: NavigationItem[] = [
  { id: "home", label: "ホーム", path: "/", icon: IconHome },
  { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
  { id: "settings", label: "設定", path: "/settings", icon: IconSettings },
];
```
- **入力データの意味**: アイコン付き3項目でのタブバー構成

**【期待される結果】**:
```typescript
// アイコンとラベルの組み合わせ表示
expect(screen.getByText("ホーム")).toBeInTheDocument();
expect(screen.getByText("ユーザー")).toBeInTheDocument();
expect(screen.getByText("設定")).toBeInTheDocument();

// アイコンサイズ検証（20px）
const iconElements = screen.getAllByRole("button");
iconElements.forEach(button => {
  const svg = button.querySelector("svg");
  expect(svg).toHaveAttribute("width", "20");
  expect(svg).toHaveAttribute("height", "20");
});
```
- **期待結果の理由**: タブバー形式のUI/UX要件とアイコンサイズ20px仕様準拠

**【テストの目的】**: アイコン付きタブバーナビゲーションの表示確認
- **確認ポイント**: アイコンサイズ20px、ラベル表示、vertical layout

🟢 **信頼性レベル**: 高（既存実装とIconサイズ仕様確認済み）
**【参照要件】**: REQ-103「主要画面への遷移をフッターメニューで提供」

---

### TC-103-N003: タップ領域サイズ確保（44px以上）
**【テスト名】**: タップ領域サイズ確保（44px以上）
- **何をテストするか**: 各フッターナビゲーション項目のタップ領域が44px以上確保されている
- **期待される動作**: NFR-201準拠の44px最小タップ領域がすべてのボタンで確保される

**【入力値】**: 標準的なNavigationItem配列
- **入力データの意味**: 一般的なフッターナビゲーション項目設定

**【期待される結果】**:
```typescript
const navigationButtons = screen.getAllByRole("button");

navigationButtons.forEach(button => {
  // 44px以上のタップ領域確保
  expect(button).toHaveStyle({ minHeight: "44px" });
  expect(button).toHaveStyle({ height: "44px" });

  // box-sizing: border-boxで適切な領域計算
  expect(button).toHaveStyle({ boxSizing: "border-box" });
});
```
- **期待結果の理由**: NFR-201「フッターメニューのタップ領域は44px以上」準拠

**【テストの目的】**: アクセシビリティ準拠のタップ領域確保確認
- **確認ポイント**: iOS/Android HIG準拠44px、一貫したタップ領域

🟢 **信頼性レベル**: 高（NFR-201要件、既存実装確認済み）
**【参照要件】**: NFR-201「フッターメニューのタップ領域は44px以上」

---

### TC-103-N004: SafeArea対応（iOS下部領域）
**【テスト名】**: SafeArea対応（iOS下部領域）
- **何をテストするか**: iOSデバイスのホームインジケーター対応でsafe-area-inset-bottomが設定される
- **期待される動作**: paddingBottomにenv(safe-area-inset-bottom)が適用される

**【入力値】**: 標準的なNavigationItem配列
- **入力データの意味**: SafeArea適用確認用の基本設定

**【期待される結果】**:
```typescript
const footerGroup = screen.getByRole("navigation");

// SafeArea対応のpaddingBottom設定
expect(footerGroup).toHaveStyle({
  paddingBottom: "env(safe-area-inset-bottom)"
});

// borderTop設定の確認
expect(footerGroup).toHaveStyle({
  borderTop: "1px solid var(--mantine-color-gray-3)"
});
```
- **期待結果の理由**: iOSデバイス対応仕様、モバイルUX最適化

**【テストの目的】**: モバイルデバイス最適化のSafeArea対応確認
- **確認ポイント**: iOS safe-area、視覚的境界線

🟢 **信頼性レベル**: 高（既存実装、iOS対応仕様確認済み）
**【参照要件】**: REQ-403「タッチ操作とマウス操作の両方をサポート」

---

### TC-103-N005: 5項目制限表示
**【テスト名】**: 5項目制限表示
- **何をテストするか**: 6項目以上のNavigationItem配列で最初の5項目のみが表示される
- **期待される動作**: items.slice(0, 5)による制限で5項目までの表示

**【入力値】**:
```typescript
const manyItems: NavigationItem[] = Array.from({ length: 7 }, (_, i) => ({
  id: `item-${i}`,
  label: `項目${i + 1}`,
  path: `/item-${i}`,
  icon: IconHome,
}));
```
- **入力データの意味**: 7項目での5項目制限テスト用データ

**【期待される結果】**:
```typescript
// 5項目のみ表示確認
expect(screen.getByText("項目1")).toBeInTheDocument();
expect(screen.getByText("項目2")).toBeInTheDocument();
expect(screen.getByText("項目3")).toBeInTheDocument();
expect(screen.getByText("項目4")).toBeInTheDocument();
expect(screen.getByText("項目5")).toBeInTheDocument();

// 6項目目以降は表示されない
expect(screen.queryByText("項目6")).not.toBeInTheDocument();
expect(screen.queryByText("項目7")).not.toBeInTheDocument();

// ボタン数の確認
expect(screen.getAllByRole("button")).toHaveLength(5);
```
- **期待結果の理由**: UI/UX制約「最大表示項目: 5項目制限」準拠

**【テストの目的】**: タブバーUI制限の適切な実装確認
- **確認ポイント**: slice制限機能、表示項目数管理

🟢 **信頼性レベル**: 高（UI/UX制約、既存実装確認済み）
**【参照要件】**: UI/UX制約「最大表示項目: 5項目制限」

## 3. 異常系テストケース（Error Cases）

### TC-103-E001: 空ナビゲーション項目配列
**【テスト名】**: 空ナビゲーション項目配列
- **エラーケースの概要**: items=[]の場合でもFooterNavigationコンポーネントが安全に動作する
- **エラー処理の重要性**: ナビゲーション設定が空の場合の適切なフォールバック動作

**【入力値】**:
```typescript
items: []
```
- **不正な理由**: ナビゲーション項目が存在しないため表示すべき内容がない
- **実際の発生シナリオ**: 初期化エラー、設定読み込み失敗、権限によるアクセス制限

**【期待される結果】**:
```typescript
// フッター領域は表示されるが項目は表示されない
const footerGroup = screen.getByRole("navigation");
expect(footerGroup).toBeInTheDocument();

// ナビゲーション項目は表示されない
expect(screen.queryAllByRole("button")).toHaveLength(0);

// 空の場合でもスタイル設定は維持
expect(footerGroup).toHaveStyle({
  justifyContent: "space-around",
  paddingBottom: "env(safe-area-inset-bottom)"
});
```
- **エラーメッセージの内容**: エラーは発生せず、空のフッター領域を表示
- **システムの安全性**: アプリケーションクラッシュを回避し、安全な状態を維持

**【テストの目的】**: 空配列でのエラーハンドリング確認
- **品質保証の観点**: 実行時エラー防止、フォールバック動作の信頼性

🟡 **信頼性レベル**: 中（エッジケース対応、推測含む）
**【参照要件】**: エラーハンドリング仕様

---

### TC-103-E002: アイコンなしNavigationItem
**【テスト名】**: アイコンなしNavigationItem
- **エラーケースの概要**: NavigationItemのiconプロパティが未定義の場合の適切な表示処理
- **エラー処理の重要性**: 不完全なナビゲーション設定でのUI破綻防止

**【入力値】**:
```typescript
const itemsWithoutIcon: NavigationItem[] = [
  { id: "no-icon", label: "アイコンなし", path: "/no-icon" }, // icon未定義
  { id: "with-icon", label: "アイコンあり", path: "/with-icon", icon: IconHome },
];
```
- **不正な理由**: タブバーナビゲーションではアイコンが視覚的識別に重要
- **実際の発生シナリオ**: 設定ミス、動的ナビゲーション生成時のアイコン欠落

**【期待される結果】**:
```typescript
// アイコンありの項目は正常表示
expect(screen.getByText("アイコンあり")).toBeInTheDocument();

// アイコンなしの項目もラベルは表示
expect(screen.getByText("アイコンなし")).toBeInTheDocument();

// アイコンなし項目ではアイコン部分がスキップされる
const buttons = screen.getAllByRole("button");
expect(buttons).toHaveLength(2);

// エラーは発生しない
expect(() => screen.getByText("アイコンなし")).not.toThrow();
```
- **エラーメッセージの内容**: エラーは発生せず、ラベルのみ表示でグレースフルな処理
- **システムの安全性**: 部分的な設定でもアプリケーションは動作し続ける

**【テストの目的】**: 不完全なNavigationItemでの安全動作確認
- **品質保証の観点**: 設定エラー耐性、UI一貫性の維持

🟡 **信頼性レベル**: 中（エッジケース対応、実装挙動の推測）
**【参照要件】**: エラーハンドリング仕様

---

### TC-103-E003: 不正NavigationItem（label空文字列）
**【テスト名】**: 不正NavigationItem（label空文字列）
- **エラーケースの概要**: NavigationItemのlabelが空文字列の場合の表示スキップ処理
- **エラー処理の重要性**: 無意味なナビゲーション項目の表示防止

**【入力値】**:
```typescript
const itemsWithEmptyLabel: NavigationItem[] = [
  { id: "valid", label: "有効項目", path: "/valid", icon: IconHome },
  { id: "invalid", label: "", path: "/invalid", icon: IconUsers }, // 空文字列
];
```
- **不正な理由**: 空ラベルはユーザーにとって意味がない
- **実際の発生シナリオ**: 国際化エラー、設定値の未定義、データベースの不正データ

**【期待される結果】**:
```typescript
// 有効項目のみ表示
expect(screen.getByText("有効項目")).toBeInTheDocument();

// 無効項目は表示されない
expect(screen.queryByText("")).not.toBeInTheDocument();

// 有効項目のボタンのみ存在
const buttons = screen.getAllByRole("button");
expect(buttons.length).toBeGreaterThanOrEqual(1);

// エラーは発生しない
expect(() => render(<FooterNavigation items={itemsWithEmptyLabel} />)).not.toThrow();
```
- **エラーメッセージの内容**: エラーは発生せず、有効項目のみ表示
- **システムの安全性**: 不正データをフィルタリングして安全な状態を維持

**【テストの目的】**: 不正データのフィルタリング機能確認
- **品質保証の観点**: データ検証、ユーザー体験の品質維持

🟡 **信頼性レベル**: 中（エッジケース対応、フィルタリング機能の推測）
**【参照要件】**: データバリデーション仕様

## 4. 境界値テストケース（Boundary Value Cases）

### TC-103-B001: 最大表示項目数（5項目）
**【テスト名】**: 最大表示項目数（5項目）
- **境界値の意味**: UI/UX制約での5項目制限の境界値テスト
- **境界値での動作保証**: 5項目でのレイアウト安定性確認

**【入力値】**:
```typescript
const exactlyFiveItems: NavigationItem[] = Array.from({ length: 5 }, (_, i) => ({
  id: `item-${i}`,
  label: `項目${i + 1}`,
  path: `/item-${i}`,
  icon: IconHome,
}));
```
- **境界値選択の根拠**: items.slice(0, 5)制限の上限値
- **実際の使用場面**: 主要機能5つでのタブバー構成

**【期待される結果】**:
```typescript
// 5項目すべて表示
for (let i = 1; i <= 5; i++) {
  expect(screen.getByText(`項目${i}`)).toBeInTheDocument();
}

// ボタン数確認
expect(screen.getAllByRole("button")).toHaveLength(5);

// space-around配置での適切なレイアウト
const footerGroup = screen.getByRole("navigation");
expect(footerGroup).toHaveStyle({ justifyContent: "space-around" });

// flex: 1による均等分散
const buttons = screen.getAllByRole("button");
buttons.forEach(button => {
  expect(button).toHaveStyle({ flex: 1 });
});
```
- **境界での正確性**: 5項目での表示・レイアウトが正常に機能
- **一貫した動作**: 項目数に関係なく一貫したスタイリング

**【テストの目的】**: UI制限境界での安定動作確認
- **堅牢性の確認**: 最大項目数でのレイアウト破綻なし

🟢 **信頼性レベル**: 高（UI/UX制約、既存実装確認済み）
**【参照要件】**: UI/UX制約「最大表示項目: 5項目制限」

---

### TC-103-B002: 長いラベル名（20文字）
**【テスト名】**: 長いラベル名（20文字）
- **境界値の意味**: フッタータブでの表示可能ラベル長の境界値
- **境界値での動作保証**: 長いラベルでもレイアウト破綻しない

**【入力値】**:
```typescript
const longLabelItems: NavigationItem[] = [
  { id: "short", label: "短い", path: "/short", icon: IconHome },
  { id: "long", label: "非常に長いナビゲーション項目ラベル名", path: "/long", icon: IconUsers },
];
```
- **境界値選択の根拠**: モバイル画面幅での表示限界
- **実際の使用場面**: 多言語対応、詳細な機能名表示

**【期待される結果】**:
```typescript
// 長いラベルも表示される
expect(screen.getByText("非常に長いナビゲーション項目ラベル名")).toBeInTheDocument();

// テキストサイズ設定確認
const longLabelElement = screen.getByText("非常に長いナビゲーション項目ラベル名");
expect(longLabelElement).toHaveClass(/mantine-Text-root/);

// text-align: center設定確認
expect(longLabelElement).toHaveStyle({ textAlign: "center" });

// レイアウト破綻なし
const buttons = screen.getAllByRole("button");
buttons.forEach(button => {
  expect(button).toHaveStyle({ flex: 1 });
});
```
- **境界での正確性**: 長いラベルでも適切にテキスト処理される
- **一貫した動作**: レイアウト一貫性の維持

**【テストの目的】**: 長いコンテンツでのUI安定性確認
- **堅牢性の確認**: テキストオーバーフロー対応

🟡 **信頼性レベル**: 中（UI境界値テスト、実装挙動の推測）
**【参照要件】**: レスポンシブデザイン仕様

---

### TC-103-B003: 単一項目表示
**【テスト名】**: 単一項目表示
- **境界値の意味**: 最小項目数（1項目）での表示動作確認
- **境界値での動作保証**: 1項目でもspace-around配置が適切に機能

**【入力値】**:
```typescript
const singleItem: NavigationItem[] = [
  { id: "only", label: "唯一の項目", path: "/only", icon: IconHome },
];
```
- **境界値選択の根拠**: 配列要素数の最小値（0を除く）
- **実際の使用場面**: 権限制限、最小構成アプリ

**【期待される結果】**:
```typescript
// 単一項目表示
expect(screen.getByText("唯一の項目")).toBeInTheDocument();

// ボタン数確認
expect(screen.getAllByRole("button")).toHaveLength(1);

// space-around配置での中央寄せ
const footerGroup = screen.getByRole("navigation");
expect(footerGroup).toHaveStyle({ justifyContent: "space-around" });

// flex: 1での適切な幅調整
const button = screen.getByRole("button");
expect(button).toHaveStyle({ flex: 1 });

// タップ領域確保
expect(button).toHaveStyle({ minHeight: "44px", height: "44px" });
```
- **境界での正確性**: 1項目でも適切なスタイリング
- **一貫した動作**: 項目数に関係ない一貫した配置

**【テストの目的】**: 最小構成でのUI一貫性確認
- **堅牢性の確認**: 極端に少ない項目でのレイアウト安定性

🟡 **信頼性レベル**: 中（境界値テスト、レイアウト挙動の推測）
**【参照要件】**: レイアウト仕様

## 5. アクセシビリティテストケース（Accessibility Cases）

### TC-103-A001: ARIA属性設定確認
**【テスト名】**: ARIA属性設定確認
- **何をテストするか**: 適切なARIA属性が設定されることを確認
- **期待される動作**: ナビゲーション領域のrole、aria-labelが適切に設定される

**【入力値】**: 標準的なNavigationItem配列
- **入力データの意味**: ARIA属性検証用の基本設定

**【期待される結果】**:
```typescript
// ナビゲーション領域のrole設定
expect(screen.getByRole("navigation")).toBeInTheDocument();

// 各ボタンのaria-label設定
const buttons = screen.getAllByRole("button");
buttons.forEach((button, index) => {
  const item = mockNavigationItems[index];
  expect(button).toHaveAttribute("aria-label", item.label);
});

// ナビゲーション領域にaria-label追加（将来拡張）
const navigation = screen.getByRole("navigation");
// 将来実装時の確認用
// expect(navigation).toHaveAttribute("aria-label", "フッターナビゲーション");
```
- **期待結果の理由**: WCAG 2.1 AA準拠、支援技術対応

**【テストの目的】**: 支援技術対応のARIA属性確認
- **確認ポイント**: role="navigation"、適切なaria-label

🟢 **信頼性レベル**: 高（WCAG 2.1 AA準拠、既存実装確認済み）
**【参照要件】**: REQ-401「WCAG 2.1 AA準拠」

---

### TC-103-A002: キーボードナビゲーション対応
**【テスト名】**: キーボードナビゲーション対応
- **何をテストするか**: キーボードでのフォーカス移動とアクション実行
- **期待される動作**: Tab/Shift+Tab、Enter/Spaceでの操作が可能

**【入力值】**: 標準的なNavigationItem配列
- **入力データの意味**: キーボード操作検証用の複数項目設定

**【期待される結果】**:
```typescript
const buttons = screen.getAllByRole("button");

// 各ボタンがフォーカス可能
buttons.forEach(button => {
  expect(button).toHaveAttribute("tabIndex", "0");

  // フォーカス設定
  button.focus();
  expect(button).toHaveFocus();
});

// キーボードイベント対応（将来のクリックハンドラ追加時）
// const firstButton = buttons[0];
// fireEvent.keyDown(firstButton, { key: "Enter" });
// fireEvent.keyDown(firstButton, { key: " " });
```
- **期待結果の理由**: REQ-402「キーボードナビゲーションをサポート」準拠

**【テストの目的】**: キーボードアクセシビリティ確認
- **確認ポイント**: フォーカス移動、キーボードアクション

🟡 **信頼性レベル**: 中（キーボード対応、一部将来実装含む）
**【参照要件】**: REQ-402「キーボードナビゲーションをサポート」

## 6. パフォーマンステストケース（Performance Cases）

### TC-103-P001: React.memo再レンダリング防止
**【テスト名】**: React.memo再レンダリング防止
- **何をテストするか**: プロパティが変更されない場合に再レンダリングされないことを確認
- **期待される動作**: 同じpropsでの再レンダリング時にコンポーネントが再実行されない

**【入力値】**: 同一のNavigationItem配列を複数回
- **入力データの意味**: React.memo最適化効果測定用の同一データ

**【期待される結果】**:
```typescript
let renderCount = 0;
const TestWrapper = (props: FooterNavigationProps) => {
  renderCount++;
  return <FooterNavigation {...props} />;
};

const props = { items: mockNavigationItems };

// 初回レンダリング
const { rerender } = render(<TestWrapper {...props} />);
expect(renderCount).toBe(1);

// 同じpropsで再レンダリング -> カウント増加なし（React.memoにより）
rerender(<TestWrapper {...props} />);
expect(renderCount).toBe(1);

// 異なるpropsで再レンダリング -> カウント増加
const newProps = { items: [...mockNavigationItems, { id: "new", label: "新規", path: "/new", icon: IconHome }] };
rerender(<TestWrapper {...newProps} />);
expect(renderCount).toBe(2);
```
- **期待結果の理由**: React.memo最適化による性能向上

**【テストの目的】**: パフォーマンス最適化の効果確認
- **確認ポイント**: memo化効果、不要な再レンダリング防止

🟢 **信頼性レベル**: 高（React.memo実装確認済み）
**【参照要件】**: パフォーマンス最適化仕様

## 7. 統合テストケース（Integration Cases）

### TC-103-I001: ResponsiveLayoutとの統合
**【テスト名】**: ResponsiveLayoutとの統合
- **何をテストするか**: ResponsiveLayoutコンポーネントとの統合が正常に動作することを確認
- **期待される動作**: ResponsiveLayoutのFooter部分にFooterNavigationが適切に配置される

**【入力値】**: ResponsiveLayout統合環境でのNavigationItem配列
- **入力データの意味**: 実際の使用環境での統合テスト設定

**【期待される結果】**:
```typescript
// ResponsiveLayout統合時の動作確認
// AppShell.Footer内でのFooterNavigation配置
const footerNavigation = screen.getByRole("navigation");
expect(footerNavigation).toBeInTheDocument();

// isMobile条件での表示制御（ResponsiveLayoutが管理）
// モバイル時のみFooterNavigationが表示される
// デスクトップ時は非表示（ResponsiveLayoutで制御）

// ナビゲーション項目の適切な表示
expect(screen.getByText("ホーム")).toBeInTheDocument();
expect(screen.getByText("ユーザー")).toBeInTheDocument();
```
- **期待結果の理由**: TASK-101 ResponsiveLayout統合仕様準拠

**【テストの目的】**: 上位コンポーネントとの統合動作確認
- **確認ポイント**: AppShell.Footer統合、条件表示制御

🟢 **信頼性レベル**: 高（TASK-101統合確認済み）
**【参照要件】**: TASK-101 ResponsiveLayout統合仕様

## 8. 開発言語・フレームワーク

### プログラミング言語
- **言語**: TypeScript 5.7.3
- **言語選択の理由**: 型安全性によるバグ防止、Mantineとの親和性、既存プロジェクト統一
- **テストに適した機能**: 型推論によるテストケース検証、インターフェース活用

### テストフレームワーク
- **フレームワーク**: Vitest 2.1.4 + React Testing Library 16.2.0
- **フレームワーク選択の理由**: React特化、Mantineテストユーティリティ対応、高速実行
- **テスト実行環境**: jsdom環境、MantineProvider統合、renderWithProviders活用

🟢 **信頼性レベル**: 高（既存プロジェクト技術スタック確認済み）

## 9. TDD実装フェーズ指針

### Redフェーズ（失敗テスト作成）
1. **全テストケースを実装**（上記TC-103-N001〜TC-103-I001）
2. **期待されるエラーメッセージ**: `"FooterNavigation test implementation incomplete"`
3. **テスト実行**: `bun run test FooterNavigation.test.tsx`
4. **期待結果**: 全17テストケースが失敗

### Greenフェーズ（最小実装）
1. **実装対象**: 既存FooterNavigationコンポーネントのテスト対応
2. **実装方針**: 既存実装を活用しつつテストケース通過に最適化
3. **成功基準**: 全17テストケースが成功

### Refactorフェーズ（品質改善）
1. **最適化**: React.memo効果確認、パフォーマンス計測
2. **アクセシビリティ**: WCAG 2.1 AA準拠レベル確認
3. **SafeArea対応**: iOS対応の詳細実装確認

## 10. 参照ドキュメント

- **要件定義**: `docs/implements/TASK-103/requirements.md`
- **設計仕様**: `docs/tasks/responsive-layout-tasks.md`
- **EARS要件**: REQ-002, REQ-103, REQ-401, REQ-403, NFR-001, NFR-002, NFR-201
- **型定義**: `src/components/layout/ResponsiveLayout/types/NavigationTypes.ts`
- **親コンポーネント**: `src/components/layout/ResponsiveLayout/ResponsiveLayout.tsx`