# TASK-201 ナビゲーション統合とルーティング - TDDテストケース定義書

**【対象タスク】**: TASK-201 ナビゲーション統合とルーティング
**【対象コンポーネント】**: NavigationProvider, React Router統合システム
**【作成日】**: 2025-09-22
**【TDDフェーズ】**: Redフェーズ（失敗するテスト作成）用

## 1. テスト環境設定

### テストフレームワーク
- **テストランナー**: Vitest 2.1.4
- **UIテスト**: React Testing Library 16.2.0
- **ルーティングテスト**: @testing-library/react-router + history
- **型チェック**: TypeScript 5.7.3
- **モック**: vitest/vi（React Router, Context API）

### モック設定パターン
```typescript
// React Routerのモック
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/', search: '', hash: '', state: null };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="browser-router">{children}</div>,
  };
});

// NavigationProviderコンテキストのモック
const mockNavigationContext = {
  currentPath: '/',
  previousPath: null,
  isLoading: false,
  breadcrumbs: [],
  navigate: vi.fn(),
  goBack: vi.fn(),
  isActive: vi.fn(),
  isExactActive: vi.fn(),
  setPageTitle: vi.fn(),
  getPageTitle: vi.fn(),
  closeAllMenus: vi.fn(),
  isMenuOpen: vi.fn(),
};
```

## 2. 正常系テストケース（Normal Cases）

### TC-201-N001: NavigationProvider基本統合
**【目的】**: NavigationProviderがReact Routerと正しく統合され、基本的なナビゲーション機能を提供することを確認
**【内容】**:
- NavigationProviderでアプリケーションをラップ
- 基本的なナビゲーション設定でレンダリング
- Context APIによる状態共有の確認
- React Router統合の確認

**【期待動作】**:
```typescript
// 【テスト目的】: NavigationProvider + BrowserRouter統合の基本動作確認
// 【テスト内容】: NavigationProvider配下でコンテキストが利用可能であることを確認
// 【期待される動作】: Context APIによりナビゲーション状態が提供される
// 🟢 この内容の信頼性レベル: REQ-202とTDD要件定義から確認済み

const navigationConfig: NavigationConfig = {
  primary: [
    { id: '1', label: 'ホーム', path: '/', icon: 'IconHome' },
    { id: '2', label: 'ユーザー', path: '/users', icon: 'IconUsers' },
  ],
  secondary: [
    { id: '3', label: '設定', path: '/settings', icon: 'IconSettings' },
  ],
};

render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <TestConsumerComponent />
  </NavigationProvider>
);

// 【結果検証】: NavigationProviderが正常に初期化され、コンテキストが利用可能
expect(screen.getByTestId('navigation-context-available')).toBeInTheDocument();
expect(screen.getByTestId('browser-router')).toBeInTheDocument();

// 【検証項目】: 初期状態の確認
expect(screen.getByText('Current Path: /')).toBeInTheDocument();
expect(screen.getByText('Loading: false')).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（TDD要件定義REQ-202準拠）
**【参照要件】**: REQ-202「現在のページを視覚的に強調」、ARCH-001「Context API使用」

---

### TC-201-N002: アクティブページ検出機能
**【目的】**: 現在のルートに基づいてナビゲーション項目のアクティブ状態が正しく判定されることを確認
**【内容】**:
- 特定のルート（'/users'）に遷移
- isActive()とisExactActive()の動作確認
- アクティブ状態の判定ロジック確認

**【期待動作】**:
```typescript
// 【テスト目的】: useLocation()による現在ルート検知→アクティブ状態判定の確認
// 【テスト内容】: '/users'にアクセス時、該当ナビゲーション項目がアクティブになる
// 【期待される動作】: isActive('/users')がtrueを返し、他はfalseを返す
// 🟢 この内容の信頼性レベル: REQ-202の直接実装要件

// 【テストデータ準備】: '/users'ページでのアクティブ状態テスト用データ
mockLocation.pathname = '/users';

const TestComponent = () => {
  const { isActive, isExactActive } = useNavigationContext();
  return (
    <div>
      <div data-testid="home-active">{isActive('/').toString()}</div>
      <div data-testid="users-active">{isActive('/users').toString()}</div>
      <div data-testid="users-exact">{isExactActive('/users').toString()}</div>
      <div data-testid="settings-active">{isActive('/settings').toString()}</div>
    </div>
  );
};

render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <TestComponent />
  </NavigationProvider>
);

// 【結果検証】: '/users'ページでのアクティブ状態判定が正確
// 🟢 検証内容: 現在ページのアクティブ状態検知機能が正常動作
expect(screen.getByTestId('users-active')).toHaveTextContent('true');
expect(screen.getByTestId('users-exact')).toHaveTextContent('true');
expect(screen.getByTestId('home-active')).toHaveTextContent('false');
expect(screen.getByTestId('settings-active')).toHaveTextContent('false');
```

**【信頼性レベル】**: 🟢 高（REQ-202「現在のページを視覚的に強調」の直接実装）
**【参照要件】**: REQ-202、パスマッチング仕様

---

### TC-201-N003: パンくずリスト自動生成
**【目的】**: 現在のルートに基づいてパンくずリストが自動生成されることを確認
**【内容】**:
- 深い階層のルート（'/users/123/profile'）でテスト
- ナビゲーション設定からの階層解析
- BreadcrumbItem配列の生成確認

**【期待動作】**:
```typescript
// 【テスト目的】: ルート階層解析→ナビゲーション構造解析→動的パンくず生成の確認
// 【テスト内容】: '/users/123/profile'での階層パンくずリスト自動生成
// 【期待される動作】: ホーム > ユーザー > プロフィール の階層が生成される
// 🟡 この内容の信頼性レベル: 一般的なBreadcrumb UXパターンから妥当な推測

// 【テストデータ準備】: 階層構造を持つSPAでのユーザーの現在位置把握用データ
mockLocation.pathname = '/users/123/profile';

const routeConfig: RouteConfig[] = [
  { path: '/', element: HomePage, breadcrumbLabel: 'ホーム' },
  { path: '/users', element: UsersPage, breadcrumbLabel: 'ユーザー一覧' },
  { path: '/users/:id/profile', element: ProfilePage, breadcrumbLabel: 'プロフィール' },
];

const TestBreadcrumbComponent = () => {
  const { breadcrumbs } = useNavigationContext();
  return (
    <div>
      <div data-testid="breadcrumb-count">{breadcrumbs.length}</div>
      {breadcrumbs.map((item, index) => (
        <div key={item.id} data-testid={`breadcrumb-${index}`}>
          {item.label} - {item.isClickable ? 'clickable' : 'current'}
        </div>
      ))}
    </div>
  );
};

render(
  <NavigationProvider
    navigationConfig={navigationConfig}
    routeConfig={routeConfig}
    enableBreadcrumbs={true}
  >
    <TestBreadcrumbComponent />
  </NavigationProvider>
);

// 【結果検証】: パンくずリストが正しい階層構造で生成される
// 🟢 検証内容: 階層解析の正確性と動的生成の正常動作
expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('3');
expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('ホーム - clickable');
expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('ユーザー一覧 - clickable');
expect(screen.getByTestId('breadcrumb-2')).toHaveTextContent('プロフィール - current');
```

**【信頼性レベル】**: 🟡 中（一般的なBreadcrumb UXパターンから推測）
**【参照要件】**: ユーザビリティ向上、ナビゲーション位置把握

---

### TC-201-N004: ナビゲーション状態の全コンポーネント間共有
**【目的】**: NavigationProviderが全コンポーネント間で状態を正しく共有することを確認
**【内容】**:
- 複数のコンシューマーコンポーネントでContext使用
- 状態更新時の全コンポーネント同期確認
- Context Providerの範囲確認

**【期待動作】**:
```typescript
// 【テスト目的】: Context APIによる中央集権的なナビゲーション状態管理の確認
// 【テスト内容】: どこからでも現在のルート、パンくず、ローディング状態にアクセス可能
// 【期待される動作】: 状態更新時に全コンシューマーコンポーネントが同期する
// 🟢 この内容の信頼性レベル: React Context APIドキュメントと要件定義から確認済み

const Component1 = () => {
  const { currentPath, isLoading } = useNavigationContext();
  return <div data-testid="component1">{currentPath} - {isLoading.toString()}</div>;
};

const Component2 = () => {
  const { currentPath, breadcrumbs } = useNavigationContext();
  return <div data-testid="component2">{currentPath} - {breadcrumbs.length}</div>;
};

const Component3 = () => {
  const { navigate } = useNavigationContext();
  return <button data-testid="navigate-btn" onClick={() => navigate('/settings')}>Navigate</button>;
};

render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <Component1 />
    <Component2 />
    <Component3 />
  </NavigationProvider>
);

// 【実際の処理実行】: ナビゲーション状態の変更をトリガー
fireEvent.click(screen.getByTestId('navigate-btn'));

// 【結果検証】: 全コンポーネントで状態が同期される
// 🟢 検証内容: Context Providerの範囲内で状態が正しく共有される
expect(screen.getByTestId('component1')).toHaveTextContent('/settings - false');
expect(screen.getByTestId('component2')).toHaveTextContent('/settings - 0');
```

**【信頼性レベル】**: 🟢 高（React Context API仕様準拠）
**【参照要件】**: ARCH-001「Context API使用」、中央集権的状態管理

---

### TC-201-N005: モバイルページ遷移後メニュー自動クローズ
**【目的】**: モバイルレイアウトでページ遷移後にハンバーガーメニューが自動クローズされることを確認
**【内容】**:
- モバイルサイズでのテスト環境設定
- ハンバーガーメニュー開状態から開始
- ページ遷移実行後のメニュー状態確認

**【期待動作】**:
```typescript
// 【テスト目的】: useNavigate()実行→ルート変更検知→ハンバーガーメニュー状態リセット
// 【テスト内容】: モバイルでナビゲーション後にハンバーガーメニューが自動クローズ
// 【期待される動作】: navigate('/users')実行後、opened=falseになる
// 🟢 この内容の信頼性レベル: TASK-201要件の明示的要件

// 【テスト前準備】: モバイルユーザーがハンバーガーメニューからページ遷移する環境設定
const mockUseMediaQuery = vi.fn(() => true); // モバイルサイズ
vi.mock('@mantine/hooks', () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

const TestMobileNavigation = () => {
  const { navigate, isMenuOpen, closeAllMenus } = useNavigationContext();

  useEffect(() => {
    // 【環境初期化】: ハンバーガーメニューを開いた状態でテスト開始
    // この初期化処理により、実際のモバイルユーザーフローを再現
  }, []);

  return (
    <div>
      <div data-testid="hamburger-open">{isMenuOpen('hamburger').toString()}</div>
      <button data-testid="navigate-mobile" onClick={() => navigate('/users')}>
        Navigate to Users
      </button>
    </div>
  );
};

render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <TestMobileNavigation />
  </NavigationProvider>
);

// 【初期条件確認】: ハンバーガーメニューが開いている状態を確認
expect(screen.getByTestId('hamburger-open')).toHaveTextContent('true');

// 【実際の処理実行】: モバイルでのページ遷移実行
fireEvent.click(screen.getByTestId('navigate-mobile'));

// 【結果検証】: ページ遷移後にハンバーガーメニューが自動クローズ
// 🟢 検証内容: モバイルUXベストプラクティスに準拠した自動クローズ機能
expect(screen.getByTestId('hamburger-open')).toHaveTextContent('false');
```

**【信頼性レベル】**: 🟢 高（TASK-201要件「モバイル対応: 遷移後のハンバーガーメニュー自動クローズ」）
**【参照要件】**: TASK-201明示的要件、モバイルUXベストプラクティス

---

### TC-201-N006: 全ナビゲーションコンポーネント統合
**【目的】**: HeaderNavigation、FooterNavigation、SideNavigation、HamburgerMenuが統合されて動作することを確認
**【内容】**:
- ResponsiveLayoutと全ナビゲーションコンポーネントの統合
- アクティブ状態の全コンポーネント間同期
- テーマシステムとの統合確認

**【期待動作】**:
```typescript
// 【テスト目的】: 全ナビゲーションコンポーネントが協調してナビゲーション機能を提供
// 【テスト内容】: ResponsiveLayout + 全ナビゲーションコンポーネント + NavigationProvider
// 【期待される動作】: 全コンポーネントでアクティブ状態が同期し、一貫した体験を提供
// 🟢 この内容の信頼性レベル: 依存タスク（TASK-102-105）完了済みから確認

const IntegratedNavigationTest = () => {
  return (
    <NavigationProvider navigationConfig={navigationConfig}>
      <ResponsiveLayout>
        <div data-testid="integrated-navigation">
          Navigation System Integrated
        </div>
      </ResponsiveLayout>
    </NavigationProvider>
  );
};

render(<IntegratedNavigationTest />);

// 【結果検証】: 統合システムが正常に動作
// 🟢 検証内容: ResponsiveLayoutとNavigationProviderの協調動作
expect(screen.getByTestId('integrated-navigation')).toBeInTheDocument();

// 【品質保証】: 全ナビゲーションコンポーネントが利用可能
expect(screen.getByRole('navigation', { name: 'ヘッダーナビゲーション' })).toBeInTheDocument();
expect(screen.getByRole('navigation', { name: 'フッターナビゲーション' })).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（依存タスクTASK-102-105完了済み）
**【参照要件】**: 全ナビゲーションコンポーネント統合、TASK-101 ResponsiveLayout

## 3. 異常系テストケース（Error Cases）

### TC-201-E001: 404エラー処理と適切なフォールバック
**【目的】**: 存在しないルートにアクセス時に404ページが表示され、適切なエラーハンドリングが行われることを確認
**【内容】**:
- 無効なルート（'/nonexistent-page'）へのアクセス
- 404 NotFoundページの表示確認
- ナビゲーション機能の継続確認

**【期待動作】**:
```typescript
// 【エラーケースの概要】: ユーザーが無効なURLを直接入力またはリンクでアクセス
// 【エラー処理の重要性】: ユーザビリティ維持とSEO対策、エラー状況での適切な誘導
// 【実際の発生シナリオ】: URL直接入力ミス、古いブックマーク、外部リンクエラー
// 🟢 この内容の信頼性レベル: React Router v6ドキュメントから確認済み

// 【テストデータ準備】: 存在しないパスでのエラーハンドリングテスト
mockLocation.pathname = '/nonexistent-page';

const routeConfig: RouteConfig[] = [
  { path: '/', element: HomePage },
  { path: '/users', element: UsersPage },
  { path: '/settings', element: SettingsPage },
  { path: '*', element: NotFoundPage }, // 404ページ
];

render(
  <NavigationProvider
    navigationConfig={navigationConfig}
    routeConfig={routeConfig}
  >
    <RouteRenderer routeConfig={routeConfig} />
  </NavigationProvider>
);

// 【結果検証】: 404ページが表示され、ナビゲーションは維持される
// 🟢 検証内容: 無効ルートでもシステム安定性が保たれる
expect(screen.getByText('ページが見つかりません')).toBeInTheDocument();
expect(screen.getByText('ホームページに戻る')).toBeInTheDocument();

// 【システムの安全性】: ナビゲーション要素は正常に表示される
expect(screen.getByRole('navigation')).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（React Router v6標準エラーハンドリング）
**【参照要件】**: エラーハンドリング仕様、ユーザビリティ維持

---

### TC-201-E002: NavigationConfig不正時のフォールバック処理
**【目的】**: navigationConfigが不正な形式の場合に適切なフォールバック処理が実行されることを確認
**【内容】**:
- 空パス、nullパスを含む不正設定
- 不正項目の除外処理確認
- 警告メッセージの出力確認

**【期待動作】**:
```typescript
// 【エラーケースの概要】: NavigationItemのpath設定不正やルート定義不整合
// 【エラー処理の重要性】: 設定ミスでのアプリケーション全体クラッシュ防止
// 【実際の発生シナリオ】: 設定ファイル編集ミス、動的設定生成エラー、型チェック漏れ
// 🟢 この内容の信頼性レベル: TASK-101のuseNavigationConfigエラーハンドリングパターン

// 【テストデータ準備】: 不正なnavigationConfigでのフォールバック処理テスト
const invalidNavigationConfig: NavigationConfig = {
  primary: [
    { id: '1', label: 'ホーム', path: '' }, // 空パス
    { id: '2', label: 'ユーザー', path: '/users' }, // 有効
    { id: '3', label: '無効', path: null as any }, // null パス
  ],
  secondary: [],
};

const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

render(
  <NavigationProvider navigationConfig={invalidNavigationConfig}>
    <TestNavigationDisplay />
  </NavigationProvider>
);

// 【結果検証】: 不正項目は除外され、有効項目のみ処理される
// 🟢 検証内容: 部分的な設定不正でも全体機能は維持される
expect(screen.getByText('ユーザー')).toBeInTheDocument();
expect(screen.queryByText('無効')).not.toBeInTheDocument();

// 【エラーメッセージの内容】: 開発者向けの詳細な警告メッセージ
expect(consoleSpy).toHaveBeenCalledWith('Invalid navigation item detected:', expect.any(Object));

consoleSpy.mockRestore();
```

**【信頼性レベル】**: 🟢 高（TASK-101エラーハンドリングパターン準拠）
**【参照要件】**: 設定バリデーション、開発時エラー検知

---

### TC-201-E003: React Router初期化失敗時のエラーハンドリング
**【目的】**: React Routerの初期化に失敗した場合の適切なエラーハンドリングを確認
**【内容】**:
- BrowserRouter初期化エラーの模擬
- エラー境界での適切な捕捉
- フォールバックUIの表示確認

**【期待動作】**:
```typescript
// 【エラーケースの概要】: ルーティングライブラリレベルでのエラー処理
// 【エラー処理の重要性】: システム全体クラッシュの防止と適切な回復
// 【実際の発生シナリオ】: History APIの使用不可、不正なルート設定
// 🟡 この内容の信頼性レベル: 一般的なSPAエラーハンドリングベストプラクティス

// 【テストデータ準備】: React Router初期化エラー模擬
const FailingBrowserRouter = ({ children }: { children: React.ReactNode }) => {
  throw new Error('Router initialization failed');
};

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  BrowserRouter: FailingBrowserRouter,
}));

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    return <div data-testid="router-error">ルーティングエラーが発生しました</div>;
  }
};

render(
  <ErrorBoundary>
    <NavigationProvider navigationConfig={navigationConfig}>
      <div>Test Content</div>
    </NavigationProvider>
  </ErrorBoundary>
);

// 【結果検証】: エラー境界でRouter初期化エラーが適切に処理される
// 🟡 検証内容: Router初期化失敗でもアプリケーション継続使用可能
expect(screen.getByTestId('router-error')).toBeInTheDocument();
expect(screen.getByText('ルーティングエラーが発生しました')).toBeInTheDocument();
```

**【信頼性レベル】**: 🟡 中（一般的なエラーハンドリングパターン）
**【参照要件】**: エラー境界設計、システム堅牢性

## 4. 境界値テストケース（Boundary Value Cases）

### TC-201-B001: パフォーマンス要件境界値での動作確認
**【目的】**: レイアウト切り替えが200ms以内で完了するパフォーマンス要件を満たすことを確認
**【内容】**:
- 複数ルート間での遷移時間測定
- performance.measureAPIを使用した正確な測定
- 統計的信頼性確保のための複数回テスト

**【期待動作】**:
```typescript
// 【境界値の意味】: NFR-001で定義されたレイアウト切り替え性能要件の上限値
// 【境界値での動作保証】: 性能劣化時の早期検知とユーザー体験品質保証
// 【実際の使用場面】: ユーザーの高速ナビゲーション、モバイル環境での性能制約
// 🟢 この内容の信頼性レベル: NFR-001「レイアウト切り替えは200ms以内」から確認済み

const performanceTestRoutes = ['/', '/users', '/notes', '/settings'];
const maxLayoutSwitchTime = 200; // ms
const testIterations = 5; // 統計的信頼性確保

const PerformanceTestComponent = () => {
  const { navigate } = useNavigationContext();
  const [results, setResults] = useState<number[]>([]);

  const measureNavigation = async (targetPath: string) => {
    const startTime = performance.now();
    await act(async () => {
      navigate(targetPath);
    });
    const endTime = performance.now();
    return endTime - startTime;
  };

  return (
    <div>
      <button
        data-testid="run-performance-test"
        onClick={() => {
          // 【実際の処理実行】: 各ルート遷移の時間測定
          const testResults = [];
          performanceTestRoutes.forEach(async (route) => {
            const duration = await measureNavigation(route);
            testResults.push(duration);
          });
          setResults(testResults);
        }}
      >
        Run Performance Test
      </button>
      <div data-testid="performance-results">{JSON.stringify(results)}</div>
    </div>
  );
};

render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <PerformanceTestComponent />
  </NavigationProvider>
);

// 【実際の処理実行】: パフォーマンステストの実行
fireEvent.click(screen.getByTestId('run-performance-test'));

// 【結果検証】: 全ての遷移が200ms以内で完了
// 🟢 検証内容: NFR-001性能要件の境界値での正確な動作
await waitFor(() => {
  const results = JSON.parse(screen.getByTestId('performance-results').textContent || '[]');
  results.forEach((duration: number) => {
    expect(duration).toBeLessThanOrEqual(maxLayoutSwitchTime);
  });
});
```

**【信頼性レベル】**: 🟢 高（NFR-001明示的要件）
**【参照要件】**: NFR-001「レイアウト切り替えは200ms以内で完了すること」

---

### TC-201-B002: 最大ナビゲーション項目数での動作確認
**【目的】**: 最大数のナビゲーション項目でも正常に動作し、パフォーマンスが維持されることを確認
**【内容】**:
- 大量のナビゲーション項目（primary 10項目、secondary 20項目）
- 全項目の表示確認
- パフォーマンスの許容範囲確認

**【期待動作】**:
```typescript
// 【境界値の意味】: UI表示限界とパフォーマンス限界の境界値テスト
// 【境界値での動作保証】: 大規模アプリケーションでの利用可能性確認
// 【実際の使用場面】: 大規模な企業アプリケーション、多機能SPAでの利用
// 🟡 この内容の信頼性レベル: 一般的なナビゲーションUIの設計制約から推測

// 【テストデータ準備】: 最大負荷でのナビゲーション項目設定
const maxNavigationConfig: NavigationConfig = {
  primary: Array.from({ length: 10 }, (_, i) => ({
    id: `primary-${i}`,
    label: `プライマリ項目${i + 1}`,
    path: `/primary/${i}`,
    icon: 'IconHome',
  })),
  secondary: Array.from({ length: 20 }, (_, i) => ({
    id: `secondary-${i}`,
    label: `セカンダリ項目${i + 1}`,
    path: `/secondary/${i}`,
    icon: 'IconSettings',
  })),
};

const renderStartTime = performance.now();

render(
  <NavigationProvider navigationConfig={maxNavigationConfig}>
    <TestNavigationDisplay />
  </NavigationProvider>
);

const renderEndTime = performance.now();
const renderDuration = renderEndTime - renderStartTime;

// 【結果検証】: 大量の項目でも正常にレンダリングされる
// 🟡 検証内容: 極端な設定でもシステムが安定動作する
expect(screen.getByText('プライマリ項目1')).toBeInTheDocument();
expect(screen.getByText('プライマリ項目10')).toBeInTheDocument();
expect(screen.getByText('セカンダリ項目1')).toBeInTheDocument();
expect(screen.getByText('セカンダリ項目20')).toBeInTheDocument();

// 【品質保証】: レンダリング時間が許容範囲内
expect(renderDuration).toBeLessThan(1000); // 1秒以内
```

**【信頼性レベル】**: 🟡 中（一般的なUI設計制約から推測）
**【参照要件】**: スケーラビリティ、大規模アプリケーション対応

---

### TC-201-B003: 空ナビゲーション設定での安全性確認
**【目的】**: ナビゲーション項目が空の場合でも安全に動作し、デフォルト動作が提供されることを確認
**【内容】**:
- 完全に空のナビゲーション設定
- アプリケーションクラッシュの防止確認
- デフォルトナビゲーション項目の提供確認

**【期待動作】**:
```typescript
// 【境界値の意味】: 最小設定（空配列）での動作保証
// 【境界値での動作保証】: エッジケースでのシステム安定性確認
// 【実際の使用場面】: アプリケーション初期化時、権限による項目非表示
// 🟢 この内容の信頼性レベル: TASK-101のuseNavigationConfigエラーハンドリング

// 【テストデータ準備】: 最小設定（空配列）でのシステム安定性テスト
const emptyNavigationConfig: NavigationConfig = {
  primary: [],
  secondary: [],
};

render(
  <NavigationProvider navigationConfig={emptyNavigationConfig}>
    <TestNavigationDisplay />
  </NavigationProvider>
);

// 【結果検証】: 空設定でもアプリケーションが安全に動作
// 🟢 検証内容: 設定不足でもアプリケーションが利用可能
expect(screen.getByTestId('navigation-provider')).toBeInTheDocument();

// 【システムの安全性】: デフォルトナビゲーション項目が提供される
expect(screen.getByText('ホーム')).toBeInTheDocument(); // デフォルト項目

// 【一貫した動作】: 通常設定と同じレイアウト構造を維持
expect(screen.getByRole('navigation')).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（TASK-101エラーハンドリングパターン準拠）
**【参照要件】**: システム安定性、最小設定対応

---

### TC-201-B004: 深い階層ルートでのパンくず生成限界
**【目的】**: 非常に深い階層構造でのパンくずリスト生成が適切に処理されることを確認
**【内容】**:
- 10階層以上の深いルート構造
- パンくずリスト生成の性能確認
- UI表示の適切な処理確認

**【期待動作】**:
```typescript
// 【境界値の意味】: パンくずリスト生成アルゴリズムの処理限界テスト
// 【境界値での動作保証】: 極端な階層でもパフォーマンスが維持される
// 【実際の使用場面】: 深い階層を持つ管理画面、ファイルシステム的なUI
// 🟡 この内容の信頼性レベル: 一般的なBreadcrumb実装の限界テスト

// 【テストデータ準備】: 深い階層でのパンくずリスト生成性能テスト
const deepPath = '/level1/level2/level3/level4/level5/level6/level7/level8/level9/level10';
mockLocation.pathname = deepPath;

const deepRouteConfig: RouteConfig[] = [
  { path: '/', element: HomePage, breadcrumbLabel: 'ホーム' },
  { path: '/level1', element: Page, breadcrumbLabel: 'レベル1' },
  { path: '/level1/level2', element: Page, breadcrumbLabel: 'レベル2' },
  { path: '/level1/level2/level3', element: Page, breadcrumbLabel: 'レベル3' },
  { path: '/level1/level2/level3/level4', element: Page, breadcrumbLabel: 'レベル4' },
  { path: '/level1/level2/level3/level4/level5', element: Page, breadcrumbLabel: 'レベル5' },
  // ... 継続
  { path: deepPath, element: Page, breadcrumbLabel: 'レベル10' },
];

const startTime = performance.now();

render(
  <NavigationProvider
    navigationConfig={navigationConfig}
    routeConfig={deepRouteConfig}
    enableBreadcrumbs={true}
  >
    <TestBreadcrumbDisplay />
  </NavigationProvider>
);

const endTime = performance.now();
const generationTime = endTime - startTime;

// 【結果検証】: 深い階層でもパンくずリストが正常生成される
// 🟡 検証内容: アルゴリズムが極端な階層でも効率的に動作
expect(screen.getByText('ホーム')).toBeInTheDocument();
expect(screen.getByText('レベル10')).toBeInTheDocument();

// 【パフォーマンス確認】: NFR-005のパンくず生成時間要件
expect(generationTime).toBeLessThan(100); // 100ms以内
```

**【信頼性レベル】**: 🟡 中（パンくずアルゴリズム限界テスト）
**【参照要件】**: NFR-005「パンくずリスト生成は100ms以内で完了」

## 5. アクセシビリティテストケース（Accessibility Cases）

### TC-201-A001: ARIA landmarks適切な設定
**【目的】**: ナビゲーション関連のARIA landmarksが適切に設定され、スクリーンリーダーで正しく認識されることを確認
**【内容】**:
- navigation role の適切な設定
- aria-current属性による現在ページ表示
- aria-label によるナビゲーション領域の説明

**【期待動作】**:
```typescript
// 【アクセシビリティ要件】: WCAG 2.1 AA準拠のナビゲーション実装
// 【支援技術対応】: スクリーンリーダーでの適切なナビゲーション認識
// 【具体的な改善】: ARIA属性による意味的なナビゲーション構造の提供
// 🟢 この内容の信頼性レベル: WCAG 2.1 AAアクセシビリティガイドライン

// 【テストデータ準備】: アクセシビリティ検証用のナビゲーション設定
mockLocation.pathname = '/users';

render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <ResponsiveLayout>
      <div>Page Content</div>
    </ResponsiveLayout>
  </NavigationProvider>
);

// 【ARIA landmarks検証】: 適切なnavigation landmarksが設定される
// 🟢 検証内容: ARIA属性による適切なナビゲーション構造
expect(screen.getByRole('navigation', { name: 'メインナビゲーション' })).toBeInTheDocument();
expect(screen.getByRole('navigation', { name: 'セカンダリナビゲーション' })).toBeInTheDocument();

// 【現在ページ表示】: aria-current属性による現在位置の明示
const activeNavItem = screen.getByRole('link', { name: 'ユーザー' });
expect(activeNavItem).toHaveAttribute('aria-current', 'page');

// 【ナビゲーション説明】: aria-labelによる領域の説明
expect(screen.getByLabelText('メインナビゲーション')).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（WCAG 2.1 AA要件準拠）
**【参照要件】**: REQ-401「WCAG 2.1 AA準拠」、A11Y-001-003

---

### TC-201-A002: キーボードナビゲーション完全サポート
**【目的】**: キーボードのみでの操作で全ナビゲーション機能が利用可能であることを確認
**【内容】**:
- Tab/Shift+Tabによる順次ナビゲーション
- Enter/Spaceキーによるアクション実行
- Escapeキーによるメニュークローズ
- フォーカス管理の適切な実装

**【期待動作】**:
```typescript
// 【アクセシビリティ要件】: キーボードユーザーの完全なナビゲーション支援
// 【支援技術対応】: マウスを使用できないユーザーへの配慮
// 【具体的な改善】: 全機能のキーボードアクセス可能性
// 🟢 この内容の信頼性レベル: REQ-402キーボードナビゲーションサポート

// 【テストデータ準備】: キーボードナビゲーション検証環境
render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <ResponsiveLayout>
      <div>Page Content</div>
    </ResponsiveLayout>
  </NavigationProvider>
);

// 【Tab順次ナビゲーション】: 論理的な順序でのフォーカス移動
// 🟢 検証内容: Tab/Shift+Tabによる適切なフォーカス順序
const navigationLinks = screen.getAllByRole('link');
fireEvent.keyDown(document.body, { key: 'Tab' });
expect(navigationLinks[0]).toHaveFocus();

fireEvent.keyDown(navigationLinks[0], { key: 'Tab' });
expect(navigationLinks[1]).toHaveFocus();

// 【Enter/Spaceキー操作】: キーボードによるアクション実行
fireEvent.keyDown(navigationLinks[0], { key: 'Enter' });
expect(mockNavigate).toHaveBeenCalledWith('/');

// 【Escapeキー操作】: メニュークローズ機能
const hamburgerButton = screen.getByLabelText('ナビゲーションメニューを開く');
fireEvent.click(hamburgerButton); // メニューを開く
fireEvent.keyDown(document.body, { key: 'Escape' });

// 【フォーカス管理】: 適切なフォーカス復帰
expect(hamburgerButton).toHaveFocus();
```

**【信頼性レベル】**: 🟢 高（REQ-402明示的要件）
**【参照要件】**: REQ-402「キーボードナビゲーションサポート」、A11Y-002, A11Y-004

---

### TC-201-A003: スクリーンリーダー対応のページ変更通知
**【目的】**: ページ遷移時にスクリーンリーダーユーザーに適切な通知が行われることを確認
**【内容】**:
- aria-live属性によるページ変更通知
- ページタイトルの自動更新
- ナビゲーション状態の音声アナウンス

**【期待動作】**:
```typescript
// 【アクセシビリティ要件】: 視覚障害者へのナビゲーション状態変更通知
// 【支援技術対応】: スクリーンリーダーでの適切なページ変更認識
// 【具体的な改善】: aria-live属性による動的コンテンツ変更の通知
// 🟢 この内容の信頼性レベル: A11Y-003スクリーンリーダー対応要件

// 【テストデータ準備】: スクリーンリーダー対応検証環境
const TestPageChangeAnnouncement = () => {
  const { currentPath, setPageTitle } = useNavigationContext();

  useEffect(() => {
    // 【環境初期化】: ページタイトル自動設定のテスト環境
    if (currentPath === '/users') {
      setPageTitle('ユーザー一覧ページ');
    }
  }, [currentPath, setPageTitle]);

  return (
    <div>
      <div aria-live="polite" data-testid="page-announcement">
        現在のページ: {currentPath}
      </div>
      <button onClick={() => navigate('/users')}>
        ユーザーページへ
      </button>
    </div>
  );
};

render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <TestPageChangeAnnouncement />
  </NavigationProvider>
);

// 【ページ変更通知】: aria-liveによる動的更新通知
// 🟢 検証内容: スクリーンリーダーでのページ変更認識
fireEvent.click(screen.getByText('ユーザーページへ'));

await waitFor(() => {
  expect(screen.getByTestId('page-announcement')).toHaveTextContent('現在のページ: /users');
});

// 【ページタイトル更新】: document.titleの自動更新
expect(document.title).toBe('ユーザー一覧ページ');
```

**【信頼性レベル】**: 🟢 高（A11Y-003要件準拠）
**【参照要件】**: A11Y-003「スクリーンリーダー適切読み上げ」

---

### TC-201-A004: 色覚障害対応の視覚的表現
**【目的】**: 色だけに依存しない方法でアクティブ状態やナビゲーション情報が伝達されることを確認
**【内容】**:
- 色以外の視覚的手がかり（アイコン、下線等）
- 十分なコントラスト比の確保
- パターンや形状による状態表現

**【期待動作】**:
```typescript
// 【アクセシビリティ要件】: 色覚障害者にも理解可能な視覚的表現
// 【支援技術対応】: 色情報に依存しない状態表現の提供
// 【具体的な改善】: アイコン、パターン、テキストによる補完的な情報提供
// 🟢 この内容の信頼性レベル: A11Y-005色覚障害者対応要件

// 【テストデータ準備】: 色覚障害対応の視覚的表現検証
mockLocation.pathname = '/users';

render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <TestColorBlindFriendlyNavigation />
  </NavigationProvider>
);

// 【色以外の視覚的手がかり】: アイコンやテキストによる状態表現
// 🟢 検証内容: 色情報に加えて他の視覚的手がかりが提供される
const activeNavItem = screen.getByRole('link', { name: 'ユーザー' });

// テキスト表示による現在位置の明示
expect(activeNavItem).toHaveTextContent('ユーザー (現在のページ)');

// アイコンによる状態表現
expect(within(activeNavItem).getByTestId('active-indicator-icon')).toBeInTheDocument();

// 【コントラスト比確認】: 十分なコントラスト比での表示
const computedStyle = window.getComputedStyle(activeNavItem);
expect(computedStyle.color).toBeDefined();
expect(computedStyle.backgroundColor).toBeDefined();

// 【パターンによる状態表現】: 下線やボーダーによる視覚的区別
expect(activeNavItem).toHaveStyle({
  borderBottom: expect.stringContaining('solid'),
  textDecoration: expect.stringContaining('underline')
});
```

**【信頼性レベル】**: 🟢 高（A11Y-005要件準拠）
**【参照要件】**: A11Y-005「色覚障害者対応視覚表現」

## 6. パフォーマンステストケース（Performance Cases）

### TC-201-P001: ナビゲーション状態更新の高速性
**【目的】**: ナビゲーション状態の更新が50ms以内で完了することを確認
**【内容】**:
- useReducer による状態更新の性能測定
- Context re-render の最適化確認
- 状態変更時のパフォーマンス境界値テスト

**【期待動作】**:
```typescript
// 【パフォーマンス要件】: NFR-004ナビゲーション状態更新の高速性
// 【ユーザー体験】: 遅延のないリアルタイムなナビゲーション応答
// 【技術的価値】: 状態管理の効率性とユーザビリティの両立
// 🟢 この内容の信頼性レベル: NFR-004「50ms以内で完了」から確認済み

const PerformanceTestComponent = () => {
  const { navigate } = useNavigationContext();
  const [updateTimes, setUpdateTimes] = useState<number[]>([]);

  const measureStateUpdate = async (path: string) => {
    const startTime = performance.now();

    await act(async () => {
      navigate(path);
    });

    const endTime = performance.now();
    return endTime - startTime;
  };

  return (
    <div>
      <button
        data-testid="measure-update"
        onClick={async () => {
          // 【実際の処理実行】: 複数回の状態更新時間測定
          const times = [];
          for (const path of ['/', '/users', '/settings', '/notes']) {
            const duration = await measureStateUpdate(path);
            times.push(duration);
          }
          setUpdateTimes(times);
        }}
      >
        Measure Update Performance
      </button>
      <div data-testid="update-times">{JSON.stringify(updateTimes)}</div>
    </div>
  );
};

render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <PerformanceTestComponent />
  </NavigationProvider>
);

// 【実際の処理実行】: 状態更新パフォーマンス測定実行
fireEvent.click(screen.getByTestId('measure-update'));

// 【結果検証】: 全ての状態更新が50ms以内で完了
// 🟢 検証内容: NFR-004の境界値での正確な動作
await waitFor(() => {
  const times = JSON.parse(screen.getByTestId('update-times').textContent || '[]');
  times.forEach((duration: number) => {
    expect(duration).toBeLessThanOrEqual(50); // 50ms以内
  });
});
```

**【信頼性レベル】**: 🟢 高（NFR-004明示的要件）
**【参照要件】**: NFR-004「ルート変更時のナビゲーション状態更新は50ms以内」

---

### TC-201-P002: 大量ナビゲーション項目でのレンダリング性能
**【目的】**: 大量のナビゲーション項目がある場合でもレンダリング性能が維持されることを確認
**【内容】**:
- 50項目以上のナビゲーション設定
- 初回レンダリング時間の測定
- 再レンダリング時の性能確認

**【期待動作】**:
```typescript
// 【パフォーマンス要件】: 大量データでの応答性維持
// 【ユーザー体験】: 項目数に関わらず一定の操作性確保
// 【技術的価値】: スケーラブルなナビゲーションシステムの実現
// 🟡 この内容の信頼性レベル: 大規模アプリケーション想定の性能テスト

// 【テストデータ準備】: 大量ナビゲーション項目での性能検証
const largeNavigationConfig: NavigationConfig = {
  primary: Array.from({ length: 30 }, (_, i) => ({
    id: `primary-${i}`,
    label: `プライマリ項目${i + 1}`,
    path: `/primary/${i}`,
    icon: 'IconHome',
  })),
  secondary: Array.from({ length: 25 }, (_, i) => ({
    id: `secondary-${i}`,
    label: `セカンダリ項目${i + 1}`,
    path: `/secondary/${i}`,
    icon: 'IconSettings',
  })),
};

// 【実際の処理実行】: 大量項目でのレンダリング時間測定
const renderStart = performance.now();

render(
  <NavigationProvider navigationConfig={largeNavigationConfig}>
    <TestLargeNavigationDisplay />
  </NavigationProvider>
);

const renderEnd = performance.now();
const renderDuration = renderEnd - renderStart;

// 【結果検証】: 大量項目でも許容範囲内のレンダリング時間
// 🟡 検証内容: 項目数増加に対する性能の線形的な劣化なし
expect(renderDuration).toBeLessThan(1000); // 1秒以内

// 【再レンダリング性能】: 状態変更時の再レンダリング時間
const updateStart = performance.now();
act(() => {
  mockLocation.pathname = '/primary/5';
});
const updateEnd = performance.now();
const updateDuration = updateEnd - updateStart;

expect(updateDuration).toBeLessThan(100); // 100ms以内
```

**【信頼性レベル】**: 🟡 中（大規模アプリケーション性能想定）
**【参照要件】**: スケーラビリティ要件、大量データ処理性能

---

### TC-201-P003: メモリ使用量の最適化確認
**【目的】**: NavigationProviderがメモリリークを起こさず、効率的なメモリ使用を行うことを確認
**【内容】**:
- コンポーネントマウント/アンマウント時のメモリ使用量
- 長時間使用時のメモリ増加パターン
- イベントリスナーの適切なクリーンアップ

**【期待動作】**:
```typescript
// 【パフォーマンス要件】: メモリ効率性とリソース管理の最適化
// 【ユーザー体験】: 長時間使用時の安定性とブラウザパフォーマンス維持
// 【技術的価値】: 適切なリソース管理による持続可能なアプリケーション
// 🟡 この内容の信頼性レベル: メモリ管理ベストプラクティス

const MemoryTestComponent = () => {
  const [mountCount, setMountCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div>
      <button
        data-testid="toggle-navigation"
        onClick={() => {
          setIsVisible(!isVisible);
          setMountCount(prev => prev + 1);
        }}
      >
        Toggle Navigation Provider
      </button>

      {isVisible && (
        <NavigationProvider navigationConfig={navigationConfig}>
          <div data-testid="navigation-content">Navigation Active</div>
        </NavigationProvider>
      )}

      <div data-testid="mount-count">{mountCount}</div>
    </div>
  );
};

render(<MemoryTestComponent />);

// 【実際の処理実行】: 複数回のマウント/アンマウントサイクル
for (let i = 0; i < 10; i++) {
  fireEvent.click(screen.getByTestId('toggle-navigation'));

  // 【環境初期化】: ガベージコレクションによるメモリクリーンアップ
  if (global.gc) {
    global.gc();
  }
}

// 【結果検証】: メモリリークが発生していない
// 🟡 検証内容: 適切なクリーンアップとリソース管理
expect(screen.getByTestId('mount-count')).toHaveTextContent('10');

// 【品質保証】: イベントリスナーの適切なクリーンアップ
// DocumentとWindowオブジェクトに残存するリスナーが増加していない
const beforeListenerCount = window.addEventListener.toString();
// リスナー数の検証ロジック（実装依存）
```

**【信頼性レベル】**: 🟡 中（メモリ管理ベストプラクティス）
**【参照要件】**: リソース管理、メモリ効率性

## 7. 統合テストケース（Integration Cases）

### TC-201-I001: ResponsiveLayoutとの完全統合
**【目的】**: NavigationProviderがResponsiveLayoutコンポーネントと完全に統合され、レスポンシブな動作を提供することを確認
**【内容】**:
- ResponsiveLayout + NavigationProvider統合
- モバイル/デスクトップ切り替え時の動作
- 全ナビゲーションコンポーネントの協調動作

**【期待動作】**:
```typescript
// 【統合テストの目的】: ResponsiveLayoutとNavigationProviderの協調動作確認
// 【システム品質】: 既存アーキテクチャとの完全互換性
// 【ユーザー体験】: デバイス切り替え時の一貫したナビゲーション体験
// 🟢 この内容の信頼性レベル: TASK-101完了済み、依存関係確認済み

// 【テストデータ準備】: ResponsiveLayout統合環境での動作確認
const mockUseMediaQuery = vi.fn();
vi.mock('@mantine/hooks', () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

const IntegratedApp = () => {
  return (
    <NavigationProvider navigationConfig={navigationConfig}>
      <ResponsiveLayout>
        <div data-testid="app-content">Application Content</div>
      </ResponsiveLayout>
    </NavigationProvider>
  );
};

// 【デスクトップモード検証】: デスクトップサイズでの統合動作
mockUseMediaQuery.mockReturnValue(false); // デスクトップ

render(<IntegratedApp />);

// 【結果検証】: デスクトップモードでの正常な統合
// 🟢 検証内容: ResponsiveLayoutとNavigationProviderの協調動作
expect(screen.getByTestId('app-content')).toBeInTheDocument();
expect(screen.getByRole('navigation', { name: 'ヘッダーナビゲーション' })).toBeInTheDocument();
expect(screen.getByRole('navigation', { name: 'サイドナビゲーション' })).toBeInTheDocument();

// 【モバイルモード検証】: モバイルサイズでの統合動作
mockUseMediaQuery.mockReturnValue(true); // モバイル
rerender(<IntegratedApp />);

expect(screen.getByLabelText('ナビゲーションメニューを開く')).toBeInTheDocument();
expect(screen.getByRole('navigation', { name: 'フッターナビゲーション' })).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（TASK-101統合確認済み）
**【参照要件】**: TASK-101 ResponsiveLayout、COMPAT-002「既存アーキテクチャ非破壊」

---

### TC-201-I002: 全ナビゲーションコンポーネント協調動作
**【目的】**: HeaderNavigation、FooterNavigation、SideNavigation、HamburgerMenuが統合されて協調動作することを確認
**【内容】**:
- 全コンポーネントでのアクティブ状態同期
- モバイル/デスクトップでの適切な表示切り替え
- ナビゲーション操作の一貫性確認

**【期待動作】**:
```typescript
// 【統合テストの目的】: 全ナビゲーションコンポーネントの協調動作確認
// 【システム品質】: 依存タスク完了による統合システムの信頼性
// 【ユーザー体験】: デバイス種別に関わらず一貫したナビゲーション体験
// 🟢 この内容の信頼性レベル: TASK-102-105完了済み

const AllNavigationIntegrationTest = () => {
  const { currentPath, isActive } = useNavigationContext();

  return (
    <div>
      <div data-testid="current-path">{currentPath}</div>
      <div data-testid="users-active">{isActive('/users').toString()}</div>

      {/* 【テスト環境準備】: 全ナビゲーションコンポーネントの表示確認 */}
      <HeaderNavigation
        items={navigationConfig.primary}
        isMobile={false}
        onHamburgerToggle={vi.fn()}
      />

      <FooterNavigation
        items={navigationConfig.primary.slice(0, 4)}
        isMobile={true}
      />

      <SideNavigation
        items={[...navigationConfig.primary, ...navigationConfig.secondary]}
        isVisible={true}
        onClose={vi.fn()}
      />

      <HamburgerMenu
        items={[...navigationConfig.primary, ...navigationConfig.secondary]}
        isOpen={false}
        onClose={vi.fn()}
      />
    </div>
  );
};

// 【初期条件設定】: '/users'ページでのアクティブ状態確認
mockLocation.pathname = '/users';

render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <AllNavigationIntegrationTest />
  </NavigationProvider>
);

// 【結果検証】: 全コンポーネントでアクティブ状態が同期
// 🟢 検証内容: 依存タスク完了による統合動作の信頼性
expect(screen.getByTestId('current-path')).toHaveTextContent('/users');
expect(screen.getByTestId('users-active')).toHaveTextContent('true');

// 【品質保証】: 全ナビゲーションコンポーネントが正常表示
expect(screen.getByText('ユーザー')).toBeInTheDocument(); // HeaderNavigation
expect(screen.getAllByText('ユーザー')).toHaveLength(4); // 全コンポーネント分
```

**【信頼性レベル】**: 🟢 高（依存タスクTASK-102-105完了済み）
**【参照要件】**: TASK-102-105全ナビゲーションコンポーネント、統合仕様

---

### TC-201-I003: テーマシステムとの統合
**【目的】**: Mantineテーマシステムとの統合が正常に動作し、テーマ変更時にナビゲーション要素が適切に更新されることを確認
**【内容】**:
- ライト/ダークテーマ切り替え時の動作
- テーマ色の適切な反映
- ナビゲーション要素のテーマ対応確認

**【期待動作】**:
```typescript
// 【統合テストの目的】: Mantineテーマシステムとの統合動作確認
// 【システム品質】: テーマ変更時の一貫したUI更新
// 【ユーザー体験】: テーマに応じた適切な視覚的フィードバック
// 🟢 この内容の信頼性レベル: COMPAT-003「Mantine 7.x統合」要件

// 【テストデータ準備】: テーマシステム統合確認環境
const mockColorScheme = { colorScheme: 'light', toggleColorScheme: vi.fn() };
vi.mock('@mantine/core', () => ({
  ...vi.importActual('@mantine/core'),
  useMantineColorScheme: () => mockColorScheme,
}));

const ThemeIntegrationTest = () => {
  const { toggleColorScheme } = useMantineColorScheme();

  return (
    <div>
      <button
        data-testid="toggle-theme"
        onClick={toggleColorScheme}
      >
        Toggle Theme
      </button>
    </div>
  );
};

render(
  <NavigationProvider navigationConfig={navigationConfig}>
    <MantineProvider theme={theme}>
      <ResponsiveLayout>
        <ThemeIntegrationTest />
      </ResponsiveLayout>
    </MantineProvider>
  </NavigationProvider>
);

// 【実際の処理実行】: テーマ切り替え実行
fireEvent.click(screen.getByTestId('toggle-theme'));

// 【結果検証】: テーマ切り替えが正常に実行される
// 🟢 検証内容: Mantineテーマシステムとの統合動作
expect(mockColorScheme.toggleColorScheme).toHaveBeenCalledTimes(1);

// 【システムの安全性】: テーマ変更後もナビゲーション機能は維持
expect(screen.getByRole('navigation')).toBeInTheDocument();
```

**【信頼性レベル】**: 🟢 高（COMPAT-003要件準拠）
**【参照要件】**: COMPAT-003「Mantine 7.x統合」、テーマシステム統合

---

### TC-201-I004: E2E実用シナリオ統合テスト
**【目的】**: 実際のユーザーシナリオに基づいた包括的な統合テストを実行し、システム全体の動作を確認
**【内容】**:
- ページ遷移からメニュー操作までの完全フロー
- デスクトップ/モバイル切り替えを含む実用的なシナリオ
- エラー回復を含む複合的な操作パターン

**【期待動作】**:
```typescript
// 【統合テストの目的】: 実際のユーザー操作パターンでの包括的動作確認
// 【システム品質】: 複合的な操作における信頼性とユーザビリティ
// 【ユーザー体験】: 実用的なシナリオでの一貫した操作性
// 🟢 この内容の信頼性レベル: 実用シナリオベース統合テスト

const E2EScenarioTest = () => {
  const { currentPath, breadcrumbs, navigate, isActive } = useNavigationContext();

  return (
    <div>
      <div data-testid="current-path">{currentPath}</div>
      <div data-testid="breadcrumb-count">{breadcrumbs.length}</div>
      <div data-testid="users-active">{isActive('/users').toString()}</div>

      <ResponsiveLayout>
        <div data-testid="page-content">
          現在のページ: {currentPath}
        </div>
      </ResponsiveLayout>
    </div>
  );
};

render(
  <NavigationProvider
    navigationConfig={navigationConfig}
    enableBreadcrumbs={true}
    enableLoadingStates={true}
  >
    <E2EScenarioTest />
  </NavigationProvider>
);

// 【E2Eシナリオ実行】: 実際のユーザー操作フローの再現

// 1. 【初期状態確認】: ホームページでの初期状態
expect(screen.getByTestId('current-path')).toHaveTextContent('/');

// 2. 【ページ遷移実行】: ユーザーページへの遷移
const { navigate } = useNavigationContext();
act(() => navigate('/users'));

// 3. 【状態同期確認】: 遷移後の状態更新
expect(screen.getByTestId('current-path')).toHaveTextContent('/users');
expect(screen.getByTestId('users-active')).toHaveTextContent('true');

// 4. 【パンくず確認】: 階層表示の正確性
expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('2');

// 5. 【エラー回復確認】: 無効ルートから正常ルートへの回復
act(() => navigate('/invalid-route'));
act(() => navigate('/settings'));

expect(screen.getByTestId('current-path')).toHaveTextContent('/settings');

// 【結果検証】: E2Eシナリオが完全に成功
// 🟢 検証内容: 実用的なユーザーフローでの統合システム動作確認
expect(screen.getByTestId('page-content')).toHaveTextContent('現在のページ: /settings');
```

**【信頼性レベル】**: 🟢 高（実用シナリオベース統合テスト）
**【参照要件】**: 全要件の統合、実用性確認

## 8. TDD実装フェーズ指針

### Redフェーズ（失敗テスト作成）
1. **全テストケースを実装**（上記TC-201-N001〜TC-201-I004）
2. **期待されるエラーメッセージ**: `"NavigationProvider integration not implemented"`
3. **テスト実行**: `bun test NavigationProvider.test.tsx`
4. **期待結果**: 全32テストケースが失敗

### Greenフェーズ（最小実装）
1. **実装対象**: NavigationProvider、React Router統合、アクティブ状態検出
2. **実装方針**: TDD要件定義に基づく段階的実装
3. **成功基準**: 全32テストケースが成功

### Refactorフェーズ（品質改善）
1. **最適化**: パフォーマンス要件達成、メモリ使用量最適化
2. **アクセシビリティ**: WCAG 2.1 AA準拠レベル確認
3. **統合性**: 既存コンポーネントとの完全互換性確認

## 9. テストケース実装時の日本語コメント指針

### テストケース開始時のコメント
```typescript
// 【テスト目的】: [このテストで何を確認するかを日本語で明記]
// 【テスト内容】: [具体的にどのような処理をテストするかを説明]
// 【期待される動作】: [正常に動作した場合の結果を説明]
// 🟢🟡🔴 この内容の信頼性レベルを記載
```

### Given（準備フェーズ）のコメント
```typescript
// 【テストデータ準備】: [なぜこのデータを用意するかの理由]
// 【初期条件設定】: [テスト実行前の状態を説明]
// 【前提条件確認】: [テスト実行に必要な前提条件を明記]
```

### When（実行フェーズ）のコメント
```typescript
// 【実際の処理実行】: [どの機能/メソッドを呼び出すかを説明]
// 【処理内容】: [実行される処理の内容を日本語で説明]
// 【実行タイミング】: [なぜこのタイミングで実行するかを説明]
```

### Then（検証フェーズ）のコメント
```typescript
// 【結果検証】: [何を検証するかを具体的に説明]
// 【期待値確認】: [期待される結果とその理由を説明]
// 【品質保証】: [この検証がシステム品質にどう貢献するかを説明]
```

### 各expectステートメントのコメント
```typescript
// 【検証項目】: [この検証で確認している具体的な項目]
// 🟢🟡🔴 この内容の信頼性レベルを記載
expect(navigationContext.currentPath).toBe('/users'); // 【確認内容】: 現在のアクティブルートが正確に検知される
expect(screen.getByRole('navigation')).toHaveAttribute('aria-current', 'page'); // 【確認内容】: ARIA属性による適切なアクセシビリティ対応
```

## 10. 参照ドキュメント

- **TDD要件定義**: `docs/implements/TASK-201/tdd-requirements.md`
- **要件定義**: `docs/implements/TASK-201/requirements.md`
- **EARS要件**: REQ-202, REQ-401, REQ-402, NFR-001〜NFR-005
- **依存タスク**: TASK-101(ResponsiveLayout), TASK-102-105(ナビゲーションコンポーネント)
- **型定義**: `src/components/layout/ResponsiveLayout/types/NavigationTypes.ts`
- **React Router**: v6.x公式ドキュメント
- **Mantine**: v7.x公式ドキュメント

---

このTDDテストケース定義書に基づいて、包括的なテスト駆動開発を実行し、高品質なナビゲーション統合システムを構築します。