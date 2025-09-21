# TASK-102 HeaderNavigation TDDテストケース定義書

**【対象コンポーネント】**: HeaderNavigation
**【対象ファイル】**: `src/components/layout/ResponsiveLayout/components/HeaderNavigation.tsx`
**【作成日】**: 2025-09-21
**【TDDフェーズ】**: Redフェーズ（失敗するテスト作成）用

## 1. テスト環境設定

### テストフレームワーク
- **テストランナー**: Vitest 2.1.4
- **UIテスト**: React Testing Library 16.2.0
- **型チェック**: TypeScript 5.7.3
- **モック**: vitest/vi（useMediaQuery, useMantineColorScheme）

### モック設定パターン
```typescript
// useMediaQueryのモック（ResponsiveLayoutとの統合用）
const mockUseMediaQuery = vi.fn();
vi.mock("@mantine/hooks", () => ({
  ...vi.importActual("@mantine/hooks"),
  useMediaQuery: () => mockUseMediaQuery(),
}));

// useMantineColorSchemeのモック（テーマ切り替え用）
const mockToggleColorScheme = vi.fn();
const mockUseMantineColorScheme = vi.fn();
vi.mock("@mantine/core", () => ({
  ...vi.importActual("@mantine/core"),
  useMantineColorScheme: () => mockUseMantineColorScheme(),
}));
```

## 2. 正常系テストケース（Normal Cases）

### TC-102-N001: デスクトップレイアウト基本表示
**【目的】**: デスクトップモード時にハンバーガーメニュー非表示、水平ナビゲーション表示を確認
**【内容】**:
- `isMobile: false`でHeaderNavigationをレンダリング
- ハンバーガーメニューボタンが表示されていないことを確認
- ナビゲーション項目が水平表示されていることを確認
- ブランドロゴ「アプリ名」の表示確認
- テーマ切り替えボタンの表示確認

**【期待動作】**:
```typescript
// ハンバーガーメニューボタンなし
expect(screen.queryByLabelText("ナビゲーションメニューを開く")).not.toBeInTheDocument();

// 水平ナビゲーション表示
expect(screen.getByRole("navigation", { name: "メインナビゲーション" })).toBeInTheDocument();

// ナビゲーション項目表示（例: ホーム、ユーザー）
expect(screen.getByText("ホーム")).toBeInTheDocument();
expect(screen.getByText("ユーザー")).toBeInTheDocument();

// ブランドロゴとテーマボタン
expect(screen.getByText("アプリ名")).toBeInTheDocument();
expect(screen.getByLabelText("テーマを切り替える")).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（EARS要件REQ-004、REQ-105準拠）
**【参照要件】**: REQ-004「デスクトップ表示時にヘッダーメニューを表示」

---

### TC-102-N002: モバイルレイアウト基本表示
**【目的】**: モバイルモード時に水平ナビゲーション非表示、ハンバーガーメニュー表示を確認
**【内容】**:
- `isMobile: true`でHeaderNavigationをレンダリング
- 水平ナビゲーション項目が表示されていないことを確認
- ハンバーガーメニューボタンが表示されていることを確認
- ブランドロゴとテーマボタンの表示確認

**【期待動作】**:
```typescript
// 水平ナビゲーション非表示
expect(screen.queryByRole("navigation", { name: "メインナビゲーション" })).not.toBeInTheDocument();

// ハンバーガーメニュー表示
expect(screen.getByLabelText("ナビゲーションメニューを開く")).toBeInTheDocument();

// ブランドロゴとテーマボタン維持
expect(screen.getByText("アプリ名")).toBeInTheDocument();
expect(screen.getByLabelText("テーマを切り替える")).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（モバイルファーストUI設計準拠）
**【参照要件】**: NFR-001「レイアウト切り替えは200ms以内」

---

### TC-102-N003: ナビゲーション項目表示（アイコン付き）
**【目的】**: アイコン付きナビゲーション項目の正常表示を確認
**【内容】**:
- アイコン付きNavigationItem配列を渡してレンダリング
- 各項目のラベルとアイコンが表示されることを確認

**【期待動作】**:
```typescript
const navigationItems: NavigationItem[] = [
  { id: "home", label: "ホーム", path: "/", icon: IconHome },
  { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
];

// アイコンとラベルの組み合わせ表示
expect(screen.getByText("ホーム")).toBeInTheDocument();
expect(screen.getByText("ユーザー")).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（NavigationItem型定義準拠）
**【参照要件】**: REQ-105「主要画面への遷移をヘッダーメニューで提供」

---

### TC-102-N004: テーマ切り替えボタン動作
**【目的】**: テーマ切り替えボタンのクリックで toggleColorScheme が呼ばれることを確認
**【内容】**:
- テーマ切り替えボタンをクリック
- `mockToggleColorScheme`が1回呼ばれることを確認

**【期待動作】**:
```typescript
const themeButton = screen.getByLabelText("テーマを切り替える");
fireEvent.click(themeButton);

expect(mockToggleColorScheme).toHaveBeenCalledTimes(1);
```

**【信頼性レベル】**: 🟢 高（useMantineColorScheme統合確認済み）
**【参照要件】**: NFR-002「UI操作のレスポンスは300ms以内」

---

### TC-102-N005: ハンバーガーメニュートグル動作
**【目的】**: ハンバーガーメニューボタンクリックで onHamburgerToggle が呼ばれることを確認
**【内容】**:
- モバイルモードでハンバーガーメニューボタンをクリック
- `mockOnHamburgerToggle`が1回呼ばれることを確認

**【期待動作】**:
```typescript
const hamburgerButton = screen.getByLabelText("ナビゲーションメニューを開く");
fireEvent.click(hamburgerButton);

expect(mockOnHamburgerToggle).toHaveBeenCalledTimes(1);
```

**【信頼性レベル】**: 🟢 高（親コンポーネント統合確認済み）
**【参照要件】**: REQ-105「主要画面への遷移をヘッダーメニューで提供」

## 3. 異常系テストケース（Error Cases）

### TC-102-E001: 空ナビゲーション項目配列
**【目的】**: items=[]の場合でも安全に動作することを確認
**【内容】**:
- 空配列をitemsとして渡してレンダリング
- エラーが発生せず、ブランドロゴとテーマボタンのみ表示されることを確認

**【期待動作】**:
```typescript
const items: NavigationItem[] = [];

// エラーなく表示
expect(screen.getByText("アプリ名")).toBeInTheDocument();
expect(screen.getByLabelText("テーマを切り替える")).toBeInTheDocument();

// ナビゲーション項目は表示されない（デスクトップモード）
expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
```

**【信頼性レベル】**: 🟡 中（エッジケース対応）
**【参照要件】**: EDGE-201「空ナビゲーション設定での安全な動作」

---

### TC-102-E002: 不正NavigationItem（label不正）
**【目的】**: NavigationItemのlabelが空文字列の場合の表示スキップを確認
**【内容】**:
- labelが空文字列のNavigationItemを含む配列でレンダリング
- 不正項目が表示されず、有効項目のみ表示されることを確認

**【期待動作】**:
```typescript
const items: NavigationItem[] = [
  { id: "valid", label: "有効項目", path: "/valid" },
  { id: "invalid", label: "", path: "/invalid" }, // 不正
];

// 有効項目のみ表示
expect(screen.getByText("有効項目")).toBeInTheDocument();
expect(screen.queryByText("")).not.toBeInTheDocument();
```

**【信頼性レベル】**: 🟡 中（フィルタリング機能）
**【参照要件】**: EDGE-202「不正NavigationItem設定時のフォールバック処理」

---

### TC-102-E003: onHamburgerToggle未定義
**【目的】**: onHamburgerToggleがundefinedの場合のエラーハンドリング確認
**【内容】**:
- onHamburgerToggleにundefinedを渡してレンダリング
- ハンバーガーボタンクリック時にエラーが発生しないことを確認

**【期待動作】**:
```typescript
// onHamburgerToggle undefined でもエラーなし
expect(() => {
  const hamburgerButton = screen.getByLabelText("ナビゲーションメニューを開く");
  fireEvent.click(hamburgerButton);
}).not.toThrow();
```

**【信頼性レベル】**: 🟡 中（Props バリデーション）
**【参照要件】**: エラーハンドリング仕様

## 4. 境界値テストケース（Boundary Value Cases）

### TC-102-B001: 最大数ナビゲーション項目（10項目）
**【目的】**: 多数のナビゲーション項目でも正常表示されることを確認
**【内容】**:
- 10個のNavigationItem配列でレンダリング
- 全項目が表示され、レイアウトが崩れないことを確認

**【期待動作】**:
```typescript
const items: NavigationItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `item-${i}`,
  label: `項目${i + 1}`,
  path: `/item-${i}`,
}));

// 全項目表示確認
items.forEach((item) => {
  expect(screen.getByText(item.label)).toBeInTheDocument();
});
```

**【信頼性レベル】**: 🟡 中（レイアウト限界値テスト）
**【参照要件】**: NFR-001「レイアウト切り替えは200ms以内」

---

### TC-102-B002: 長いラベル名（50文字）
**【目的】**: 長いラベル名でもレイアウトが崩れないことを確認
**【内容】**:
- 50文字の長いラベルを持つNavigationItemでレンダリング
- テキストが適切に処理されることを確認

**【期待動作】**:
```typescript
const longLabel = "非常に長いナビゲーション項目のラベル名でレイアウトテストを実行します";
const items: NavigationItem[] = [
  { id: "long", label: longLabel, path: "/long" },
];

expect(screen.getByText(longLabel)).toBeInTheDocument();
```

**【信頼性レベル】**: 🟡 中（UI境界値テスト）
**【参照要件】**: レスポンシブデザイン仕様

---

### TC-102-B003: ハンバーガー開閉状態切り替え
**【目的】**: hamburgerOpenedの true/false 切り替えが正常に動作することを確認
**【内容】**:
- hamburgerOpened プロパティを true/false で切り替え
- Burger コンポーネントの opened 状態が同期することを確認

**【期待動作】**:
```typescript
// opened=false 状態
expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");

// opened=true に再レンダリング
rerender(<HeaderNavigation {...props} hamburgerOpened={true} />);
expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
```

**【信頼性レベル】**: 🟢 高（状態同期確認）
**【参照要件】**: REQ-105「主要画面への遷移をヘッダーメニューで提供」

## 5. アクセシビリティテストケース（Accessibility Cases）

### TC-102-A001: ARIA属性設定確認
**【目的】**: 適切なARIA属性が設定されることを確認
**【内容】**:
- ハンバーガーメニューの aria-label 確認
- ナビゲーション領域の role="navigation" 確認
- テーマボタンの aria-label 確認

**【期待動作】**:
```typescript
// ハンバーガーメニュー ARIA
expect(screen.getByLabelText("ナビゲーションメニューを開く")).toBeInTheDocument();

// ナビゲーション領域 ARIA
expect(screen.getByRole("navigation", { name: "メインナビゲーション" })).toBeInTheDocument();

// テーマボタン ARIA
expect(screen.getByLabelText("テーマを切り替える")).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（WCAG 2.1 AA準拠）
**【参照要件】**: REQ-401「WCAG 2.1 AA準拠」

---

### TC-102-A002: タップ領域サイズ確認（44px以上）
**【目的】**: ハンバーガーメニューとテーマボタンのタップ領域が44px以上であることを確認
**【内容】**:
- ハンバーガーボタンとテーマボタンのスタイル確認
- minHeight: "44px", height: "44px" の設定確認

**【期待動作】**:
```typescript
const hamburgerButton = screen.getByLabelText("ナビゲーションメニューを開く");
const themeButton = screen.getByLabelText("テーマを切り替える");

// 44px以上のタップ領域
expect(hamburgerButton).toHaveStyle({ height: "44px" });
expect(themeButton).toHaveStyle({ height: "44px" });
```

**【信頼性レベル】**: 🟢 高（iOS/Android HIG準拠）
**【参照要件】**: REQ-402「44px以上のミニマムタップ領域確保」

## 6. パフォーマンステストケース（Performance Cases）

### TC-102-P001: React.memo再レンダリング防止
**【目的】**: プロパティが変更されない場合に再レンダリングされないことを確認
**【内容】**:
- 同じpropsで複数回レンダリング
- 再レンダリング回数をモニタリング

**【期待動作】**:
```typescript
let renderCount = 0;
const TestWrapper = () => {
  renderCount++;
  return <HeaderNavigation {...props} />;
};

// 初回レンダリング
render(<TestWrapper />);
expect(renderCount).toBe(1);

// 同じpropsで再レンダリング -> カウント増加なし（React.memoにより）
rerender(<TestWrapper />);
expect(renderCount).toBe(1);
```

**【信頼性レベル】**: 🟡 中（パフォーマンス最適化）
**【参照要件】**: NFR-001「不要な再レンダリング防止」

## 7. 統合テストケース（Integration Cases）

### TC-102-I001: ResponsiveLayoutとの統合
**【目的】**: ResponsiveLayoutコンポーネントとの統合が正常に動作することを確認
**【内容】**:
- ResponsiveLayoutのHeader部分にHeaderNavigationを配置
- useResponsiveLayoutのisMobileと連動することを確認

**【期待動作】**:
```typescript
// ResponsiveLayout統合時の動作確認
// useMediaQuery() -> false (デスクトップ) の場合
mockUseMediaQuery.mockReturnValue(false);
expect(screen.getByRole("navigation")).toBeInTheDocument();

// useMediaQuery() -> true (モバイル) の場合
mockUseMediaQuery.mockReturnValue(true);
expect(screen.getByLabelText("ナビゲーションメニューを開く")).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（TASK-101統合確認済み）
**【参照要件】**: TASK-101 ResponsiveLayout統合仕様

## 8. TDD実装フェーズ指針

### Redフェーズ（失敗テスト作成）
1. **全テストケースを実装**（上記TC-102-N001〜TC-102-I001）
2. **期待されるエラーメッセージ**: `"HeaderNavigation test implementation incomplete"`
3. **テスト実行**: `bun test HeaderNavigation.test.tsx`
4. **期待結果**: 全15テストケースが失敗

### Greenフェーズ（最小実装）
1. **実装対象**: 既存HeaderNavigationコンポーネントのテスト対応
2. **実装方針**: 既存実装を活用しつつテストケース通過に最適化
3. **成功基準**: 全15テストケースが成功

### Refactorフェーズ（品質改善）
1. **最適化**: React.memo効果確認、パフォーマンス計測
2. **アクセシビリティ**: WCAG 2.1 AA準拠レベル確認
3. **型安全性**: TypeScript strict モード対応確認

## 9. 参照ドキュメント

- **要件定義**: `docs/implements/TASK-102/requirements.md`
- **設計仕様**: `docs/tasks/responsive-layout-tasks.md`
- **EARS要件**: REQ-004, REQ-105, REQ-401, REQ-402, NFR-001, NFR-002
- **型定義**: `src/components/layout/ResponsiveLayout/types/NavigationTypes.ts`
- **親コンポーネント**: `src/components/layout/ResponsiveLayout/ResponsiveLayout.tsx`