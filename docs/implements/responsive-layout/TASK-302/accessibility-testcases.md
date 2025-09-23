# TASK-302: アクセシビリティ対応強化 - テストケース

## 1. 自動テストケース

### 1.1 axe-core アクセシビリティテスト

```tsx
describe('Accessibility Tests with axe-core', () => {
  test('HeaderNavigation has no accessibility violations', async () => {
    const { container } = render(<HeaderNavigation />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('SideNavigation has no accessibility violations', async () => {
    const { container } = render(<SideNavigation />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('FooterNavigation has no accessibility violations', async () => {
    const { container } = render(<FooterNavigation />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('HamburgerMenu has no accessibility violations', async () => {
    const { container } = render(<HamburgerMenu isOpen={true} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('ResponsiveLayout has no accessibility violations', async () => {
    const { container } = render(
      <ResponsiveLayout>
        <div>Test content</div>
      </ResponsiveLayout>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 1.2 ARIA属性テスト

```typescript
describe('ARIA Attributes Tests', () => {
  test('Navigation components have proper ARIA labels', () => {
    render(<HeaderNavigation />);
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'メインナビゲーション');
  });

  test('SideNavigation has proper landmark roles', () => {
    render(<SideNavigation />);
    expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'サイドナビゲーション');
  });

  test('Menu items have proper ARIA states', () => {
    render(<HeaderNavigation />);
    const activeItem = screen.getByRole('menuitem', { current: 'page' });
    expect(activeItem).toHaveAttribute('aria-current', 'page');
  });

  test('Collapsible elements have proper ARIA expanded state', () => {
    render(<SideNavigation />);
    const toggleButton = screen.getByRole('button', { name: /サイドバー切り替え/ });
    expect(toggleButton).toHaveAttribute('aria-expanded');
  });

  test('Live regions announce navigation changes', async () => {
    render(<ResponsiveLayout />);
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });
});
```

### 1.3 フォーカス管理テスト

```typescript
describe('Focus Management Tests', () => {
  test('Skip link receives focus and moves to main content', async () => {
    render(<ResponsiveLayout><main id="main-content">Content</main></ResponsiveLayout>);

    const skipLink = screen.getByRole('link', { name: /メインコンテンツにスキップ/ });
    skipLink.focus();
    expect(skipLink).toHaveFocus();

    fireEvent.click(skipLink);
    await waitFor(() => {
      expect(screen.getByRole('main')).toHaveFocus();
    });
  });

  test('Focus trap works in hamburger menu', async () => {
    render(<HamburgerMenu isOpen={true} />);

    const menuItems = screen.getAllByRole('menuitem');
    const firstItem = menuItems[0];
    const lastItem = menuItems[menuItems.length - 1];

    // Test forward tab cycling
    firstItem.focus();
    fireEvent.keyDown(lastItem, { key: 'Tab' });
    expect(firstItem).toHaveFocus();

    // Test backward tab cycling
    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: 'Tab', shiftKey: true });
    expect(lastItem).toHaveFocus();
  });

  test('Focus is restored after modal close', async () => {
    const triggerButton = screen.getByRole('button', { name: /メニューを開く/ });
    triggerButton.focus();

    fireEvent.click(triggerButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(triggerButton).toHaveFocus();
    });
  });

  test('Focus indicator is visible', () => {
    render(<HeaderNavigation />);
    const navButton = screen.getByRole('button');
    navButton.focus();

    const computedStyle = window.getComputedStyle(navButton, ':focus');
    expect(computedStyle.outline).not.toBe('none');
    expect(computedStyle.outlineWidth).not.toBe('0px');
  });
});
```

### 1.4 キーボードナビゲーションテスト

```typescript
describe('Keyboard Navigation Tests', () => {
  test('Tab navigation follows logical order', async () => {
    render(<ResponsiveLayout />);

    const focusableElements = screen.getAllByRole(/(button|link|menuitem)/);

    // Simulate tab navigation
    for (let i = 0; i < focusableElements.length; i++) {
      if (i === 0) {
        focusableElements[i].focus();
      } else {
        fireEvent.keyDown(focusableElements[i - 1], { key: 'Tab' });
      }
      expect(focusableElements[i]).toHaveFocus();
    }
  });

  test('Arrow keys navigate within menus', () => {
    render(<SideNavigation />);
    const menuItems = screen.getAllByRole('menuitem');

    menuItems[0].focus();
    expect(menuItems[0]).toHaveFocus();

    fireEvent.keyDown(menuItems[0], { key: 'ArrowDown' });
    expect(menuItems[1]).toHaveFocus();

    fireEvent.keyDown(menuItems[1], { key: 'ArrowUp' });
    expect(menuItems[0]).toHaveFocus();
  });

  test('Enter and Space activate buttons', () => {
    const mockHandler = jest.fn();
    render(<button onClick={mockHandler}>Test Button</button>);

    const button = screen.getByRole('button');
    button.focus();

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(mockHandler).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: ' ' });
    expect(mockHandler).toHaveBeenCalledTimes(2);
  });

  test('Escape closes modals and drawers', async () => {
    render(<HamburgerMenu isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('Home and End keys navigate to first/last items', () => {
    render(<SideNavigation />);
    const menuItems = screen.getAllByRole('menuitem');

    menuItems[1].focus(); // Focus middle item

    fireEvent.keyDown(menuItems[1], { key: 'Home' });
    expect(menuItems[0]).toHaveFocus();

    fireEvent.keyDown(menuItems[0], { key: 'End' });
    expect(menuItems[menuItems.length - 1]).toHaveFocus();
  });
});
```

### 1.5 カラーコントラストテスト

```typescript
describe('Color Contrast Tests', () => {
  test('Text has sufficient contrast in light theme', () => {
    render(<div data-testid="light-theme">
      <ThemeProvider theme={lightTheme}>
        <HeaderNavigation />
      </ThemeProvider>
    </div>);

    const element = screen.getByTestId('light-theme');
    const styles = window.getComputedStyle(element);

    // Test would use a color contrast calculation library
    expect(calculateContrast(styles.color, styles.backgroundColor)).toBeGreaterThan(4.5);
  });

  test('Text has sufficient contrast in dark theme', () => {
    render(<div data-testid="dark-theme">
      <ThemeProvider theme={darkTheme}>
        <HeaderNavigation />
      </ThemeProvider>
    </div>);

    const element = screen.getByTestId('dark-theme');
    const styles = window.getComputedStyle(element);

    expect(calculateContrast(styles.color, styles.backgroundColor)).toBeGreaterThan(4.5);
  });

  test('Interactive elements have sufficient contrast', () => {
    render(<HeaderNavigation />);
    const button = screen.getByRole('button');
    const styles = window.getComputedStyle(button);

    expect(calculateContrast(styles.borderColor, styles.backgroundColor)).toBeGreaterThan(3);
  });
});
```

## 2. 手動テストケース

### 2.1 スクリーンリーダーテスト

#### TC-SR-001: ページ構造の読み上げ
**前提条件**: スクリーンリーダー（NVDA/JAWS/VoiceOver）が有効
**手順**:
1. ページを読み込む
2. スクリーンリーダーで全体構造を確認

**期待結果**:
- ランドマーク（navigation, main, aside, footer）が正しく読み上げられる
- 見出し構造（h1, h2, h3）が論理的順序で読み上げられる
- ナビゲーション項目が適切に読み上げられる

#### TC-SR-002: ナビゲーション操作の読み上げ
**前提条件**: スクリーンリーダーが有効
**手順**:
1. ナビゲーション項目を操作
2. サイドバーの折りたたみ/展開を実行
3. ページ遷移を実行

**期待結果**:
- 操作結果がlive regionで適切に通知される
- 状態変化（展開/折りたたみ）が音声で確認できる
- ページ遷移時に新しいページタイトルが読み上げられる

### 2.2 キーボード操作テスト

#### TC-KB-001: 基本キーボードナビゲーション
**前提条件**: マウスを使用せずキーボードのみ使用
**手順**:
1. Tabキーでナビゲーション
2. 全ての操作可能要素にアクセス
3. Enter/Spaceで機能実行

**期待結果**:
- 全機能がキーボードで操作可能
- フォーカス順序が論理的
- フォーカスインジケーターが明確に表示

#### TC-KB-002: フォーカストラップ
**前提条件**: キーボードのみ使用
**手順**:
1. ハンバーガーメニューを開く
2. Tabキーで最後の要素まで移動
3. さらにTabキーを押下

**期待結果**:
- フォーカスが最初の要素に戻る
- Shift+Tabで逆方向も正常動作
- Escapeでメニューが閉じる

### 2.3 ズーム・拡大表示テスト

#### TC-ZOOM-001: 200%拡大表示
**前提条件**: ブラウザ拡大機能使用
**手順**:
1. ブラウザを200%に拡大
2. レイアウトを確認
3. 操作性を確認

**期待結果**:
- レイアウトが崩れない
- 水平スクロールが発生しない（320px幅で）
- 全機能が正常動作

#### TC-ZOOM-002: ハイコントラストモード
**前提条件**: OSのハイコントラストモードを有効
**手順**:
1. ハイコントラストモードを有効化
2. アプリケーションの表示を確認
3. 操作性を確認

**期待結果**:
- システム設定が適切に反映される
- 視認性が向上する
- 機能に影響しない

## 3. パフォーマンステスト

### 3.1 フォーカス移動パフォーマンス

```typescript
describe('Focus Performance Tests', () => {
  test('Focus transition completes within 100ms', async () => {
    render(<SideNavigation />);
    const menuItems = screen.getAllByRole('menuitem');

    const startTime = performance.now();
    menuItems[0].focus();

    await waitFor(() => {
      expect(menuItems[0]).toHaveFocus();
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  test('Screen reader announcements are immediate', async () => {
    render(<NavigationProvider />);
    const toggleButton = screen.getByRole('button', { name: /サイドバー切り替え/ });

    const startTime = performance.now();
    fireEvent.click(toggleButton);

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/展開/);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});
```

## 4. 統合テスト

### 4.1 コンポーネント間連携テスト

```typescript
describe('Accessibility Integration Tests', () => {
  test('Navigation state synchronization with screen reader announcements', async () => {
    render(<ResponsiveLayout />);

    // SideNavigationの状態変更
    const sidebarToggle = screen.getByRole('button', { name: /サイドバー切り替え/ });
    fireEvent.click(sidebarToggle);

    // HeaderNavigationの状態も同期されることを確認
    await waitFor(() => {
      const headerButton = screen.getByRole('button', { name: /サイドバー切り替え/ });
      expect(headerButton).toHaveAttribute('aria-expanded', 'true');
    });

    // Live regionでの通知確認
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('サイドナビゲーションが展開されました');
  });

  test('Theme change preserves accessibility features', async () => {
    render(<ResponsiveLayout />);

    // テーマ変更前のアクセシビリティ機能確認
    const { container: lightContainer } = render(<HeaderNavigation />);
    const lightResults = await axe(lightContainer);
    expect(lightResults).toHaveNoViolations();

    // ダークテーマに変更
    const themeToggle = screen.getByRole('button', { name: /テーマ切り替え/ });
    fireEvent.click(themeToggle);

    // テーマ変更後のアクセシビリティ機能確認
    const { container: darkContainer } = render(<HeaderNavigation />);
    const darkResults = await axe(darkContainer);
    expect(darkResults).toHaveNoViolations();
  });
});
```

## 5. ブラウザ互換性テスト

### 5.1 クロスブラウザアクセシビリティテスト

#### TC-BROWSER-001: Chrome アクセシビリティ
**手順**: Chrome DevToolsのAccessibilityタブで確認
**期待結果**: アクセシビリティツリーが正常、Lighthouseスコア90+

#### TC-BROWSER-002: Firefox アクセシビリティ
**手順**: Firefoxアクセシビリティインスペクターで確認
**期待結果**: アクセシビリティ問題0件

#### TC-BROWSER-003: Safari アクセシビリティ
**手順**: SafariのVoiceOverで確認
**期待結果**: VoiceOver読み上げが適切

## 6. 受入テスト基準

### 6.1 自動テスト
- [ ] axe-coreテスト: 0エラー
- [ ] カラーコントラストテスト: 全要素AA基準クリア
- [ ] フォーカス管理テスト: 全テストパス
- [ ] キーボードナビゲーションテスト: 全テストパス

### 6.2 手動テスト
- [ ] スクリーンリーダーテスト: NVDA, JAWS, VoiceOverで確認
- [ ] キーボード操作テスト: マウスなしで全機能操作可能
- [ ] ズーム表示テスト: 200%拡大で問題なし

### 6.3 パフォーマンステスト
- [ ] フォーカス移動: 100ms以内
- [ ] 音声通知: 50ms以内
- [ ] Lighthouseアクセシビリティスコア: 90点以上

### 6.4 互換性テスト
- [ ] Chrome, Firefox, Safari, Edgeで問題なし
- [ ] Windows, macOS, iOSで問題なし
- [ ] 主要スクリーンリーダーで問題なし
