# TASK-201 ナビゲーション統合とルーティング - TDD要件定義書

## 概要

**タスク**: TASK-201 ナビゲーション統合とルーティング
**タスクタイプ**: TDD
**要件リンク**: REQ-202 (Navigation system integration)
**依存タスク**: TASK-102, TASK-103, TASK-104, TASK-105 (全て完了済み)
**実装方針**: Test-Driven Development (TDD)

### 実装詳細
- React Router integration
- NavigationProvider implementation
- Active page detection logic
- Breadcrumb generation
- Navigation state management

### 依存コンポーネント実装状況
- ✅ ResponsiveLayoutコンポーネント（TASK-101完了）
- ✅ HeaderNavigation（TASK-102完了）
- ✅ FooterNavigation（TASK-103完了）
- ✅ SideNavigation（TASK-104完了）
- ✅ HamburgerMenu（TASK-105完了）

## 1. 機能概要（Feature Overview）

### 1.1 主要機能
レスポンシブレイアウトナビゲーション統合システムは、既存のHeaderNavigation、FooterNavigation、SideNavigation、HamburgerMenuコンポーネントをReact Routerと統合し、適切なルーティング機能を提供します。

### 1.2 解決する問題
- 現在のスタティックなナビゲーションコンポーネントを動的なルーティングシステムに変換
- 複数のナビゲーションコンポーネント間でのアクティブ状態の同期
- ページ遷移時の自動メニュークローズ（モバイル）
- パンくずリストの自動生成
- ナビゲーション状態の一元管理

### 1.3 ユーザー体験の向上
- **モバイルユーザー**: フッターメニューからの遷移時にハンバーガーメニューが自動的にクローズ
- **デスクトップユーザー**: ヘッダーとサイドメニューでのアクティブ状態が同期
- **全ユーザー**: 現在位置を示すパンくずリストの自動表示

## 2. 入力・出力仕様（Input/Output Specifications）

### 2.1 NavigationProvider TypeScript インターフェース

```typescript
interface NavigationProviderProps {
  children: React.ReactNode;
  navigationConfig: NavigationConfig;
  routeConfig?: RouteConfig[];
  enableBreadcrumbs?: boolean;
  enableLoadingStates?: boolean;
}

interface NavigationConfig {
  primary: NavigationItem[];
  secondary: NavigationItem[];
}

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string | React.ComponentType;
  external?: boolean;
  disabled?: boolean;
  children?: NavigationItem[];
}

interface RouteConfig {
  path: string;
  element: React.ComponentType;
  breadcrumbLabel?: string;
  requiresAuth?: boolean;
  preloadData?: () => Promise<any>;
}
```

### 2.2 ナビゲーションコンテキスト

```typescript
interface NavigationContextValue {
  // 現在の状態
  currentPath: string;
  previousPath: string | null;
  isLoading: boolean;

  // パンくずリスト
  breadcrumbs: BreadcrumbItem[];

  // ナビゲーション操作
  navigate: (path: string) => void;
  goBack: () => void;

  // 状態判定
  isActive: (path: string) => boolean;
  isExactActive: (path: string) => boolean;

  // ページ管理
  setPageTitle: (title: string) => void;
  getPageTitle: () => string;

  // メニュー制御
  closeAllMenus: () => void;
  isMenuOpen: (menuType: MenuType) => boolean;
}

interface BreadcrumbItem {
  id: string;
  label: string;
  path: string;
  isActive: boolean;
  isClickable: boolean;
}

type MenuType = 'hamburger' | 'side' | 'header' | 'footer';
```

### 2.3 ルーティングコンテキスト

```typescript
interface RoutingContextValue {
  // ルーティング状態
  location: Location;
  params: Record<string, string>;
  searchParams: URLSearchParams;

  // ナビゲーション履歴
  history: NavigationHistoryItem[];

  // ページデータ
  pageData: Record<string, any>;
  setPageData: (key: string, data: any) => void;
}

interface NavigationHistoryItem {
  path: string;
  timestamp: number;
  title?: string;
}
```

### 2.4 状態管理インターフェース

```typescript
interface NavigationState {
  currentRoute: {
    path: string;
    params: Record<string, string>;
    search: string;
    hash: string;
  };

  previousRoute: {
    path: string;
    timestamp: number;
  } | null;

  breadcrumbs: BreadcrumbItem[];

  loadingStates: {
    pageTransition: boolean;
    dataLoading: boolean;
  };

  menuStates: {
    hamburger: boolean;
    side: boolean;
  };

  pageMetadata: {
    title: string;
    description?: string;
    keywords?: string[];
  };
}

type NavigationAction =
  | { type: 'ROUTE_CHANGED'; payload: { path: string; params: Record<string, string> } }
  | { type: 'LOADING_STARTED'; payload: { type: 'page' | 'data' } }
  | { type: 'LOADING_COMPLETED'; payload: { type: 'page' | 'data' } }
  | { type: 'MENU_TOGGLED'; payload: { type: MenuType; isOpen: boolean } }
  | { type: 'BREADCRUMBS_UPDATED'; payload: BreadcrumbItem[] }
  | { type: 'PAGE_TITLE_SET'; payload: string };
```

## 3. 制約条件（Constraints）

### 3.1 パフォーマンス制約
- **NFR-001**: レイアウト切り替えは200ms以内で完了すること
- **NFR-002**: メニューの開閉アニメーションは300ms以内で完了すること
- **NFR-003**: 初回ページロード時のレンダリングは1秒以内で完了すること
- **NFR-004**: ルート変更時のナビゲーション状態更新は50ms以内で完了すること
- **NFR-005**: パンくずリスト生成は100ms以内で完了すること

### 3.2 セキュリティ制約
- **SEC-001**: 外部URLへのナビゲーションは明示的な確認を必要とすること
- **SEC-002**: クロスサイトスクリプティング攻撃を防ぐため、動的ルートパラメータをサニタイズすること
- **SEC-003**: 認証が必要なルートは適切なガード機能を実装すること

### 3.3 互換性制約
- **COMPAT-001**: React Router v6.x 系との完全互換性を保つこと
- **COMPAT-002**: 既存のResponsiveLayoutアーキテクチャを破壊しないこと
- **COMPAT-003**: Mantine 7.x のナビゲーションコンポーネントと統合すること
- **COMPAT-004**: TypeScript 5.x との型安全性を保つこと

### 3.4 アーキテクチャ制約
- **ARCH-001**: Context APIを使用した状態管理パターンを採用すること
- **ARCH-002**: 単一責任原則に従い、コンポーネントの責務を明確に分離すること
- **ARCH-003**: テスタブルなアーキテクチャを維持すること
- **ARCH-004**: 依存性注入パターンを使用してテスト容易性を確保すること

### 3.5 アクセシビリティ制約
- **A11Y-001**: WCAG 2.1 AA準拠のアクセシビリティを実装すること
- **A11Y-002**: キーボードナビゲーションを完全にサポートすること
- **A11Y-003**: スクリーンリーダーでの適切な読み上げを保証すること
- **A11Y-004**: フォーカス管理を適切に実装すること
- **A11Y-005**: 色覚障害者にも理解可能な視覚的表現を提供すること

### 3.6 ユーザビリティ制約
- **UX-001**: ページ遷移時の視覚的フィードバックを提供すること
- **UX-002**: エラー状態の明確な表示と回復手段を提供すること
- **UX-003**: モバイルでのタッチ操作に適したインタラクションを実装すること
- **UX-004**: ロード時間が長い場合の適切な進行状況表示を行うこと

## 4. 使用例（Use Cases）

### 4.1 基本的な使用パターン

#### UC-001: デスクトップでのページ遷移
**説明**: デスクトップユーザーがヘッダーメニューからページ遷移を行う

**前提条件**:
- デスクトップサイズ（769px以上）での表示
- HeaderNavigationコンポーネントが表示されている

**手順**:
1. ユーザーがヘッダーメニューの項目をクリック
2. NavigationProviderが遷移を検知
3. currentPathが更新される
4. HeaderNavigationとSideNavigationのアクティブ状態が同期
5. パンくずリストが自動更新
6. 新しいページが表示される

**期待結果**:
- ページ遷移が正常に完了
- アクティブ状態が適切に表示
- パンくずリストが現在位置を反映
- フォーカスが適切に管理される

#### UC-002: モバイルでのページ遷移とメニュークローズ
**説明**: モバイルユーザーがフッターメニューから遷移し、ハンバーガーメニューが自動クローズ

**前提条件**:
- モバイルサイズ（768px以下）での表示
- ハンバーガーメニューが開いている状態

**手順**:
1. ユーザーがフッターメニューの項目をタップ
2. NavigationProviderが遷移を検知
3. closeAllMenus()が自動実行される
4. ハンバーガーメニューがクローズアニメーションを開始
5. ページ遷移が実行される
6. 新しいページが表示される

**期待結果**:
- ページ遷移が正常に完了
- ハンバーガーメニューが自動的にクローズ
- フッターメニューのアクティブ状態が更新
- タッチ操作の応答性が良好

#### UC-003: 直接URL訪問時の状態同期
**説明**: ユーザーがブラウザのアドレスバーに直接URLを入力して訪問

**前提条件**:
- 有効なアプリケーションルートのURL

**手順**:
1. ユーザーがブラウザのアドレスバーにURLを入力
2. NavigationProviderが現在のパスを検知
3. ナビゲーション設定から対応する項目を特定
4. アクティブ状態が適切に設定される
5. パンくずリストが生成される
6. ページタイトルが設定される

**期待結果**:
- 直接訪問でも正常にページが表示
- ナビゲーション状態が適切に同期
- SEO関連の情報が正しく設定

### 4.2 データフロー使用例

#### UC-004: パンくずリスト自動生成
**説明**: 階層的なページ構造でのパンくずリスト自動生成

**前提条件**:
- 階層的なナビゲーション設定（例: /users/123/profile）
- enableBreadcrumbs: trueの設定

**手順**:
1. ユーザーが深い階層のページに遷移
2. NavigationProviderがパス解析を実行
3. ナビゲーション設定から階層構造を特定
4. BreadcrumbItemの配列を生成
5. パンくずコンポーネントに状態が渡される

**期待結果**:
- 正確な階層構造のパンくずリストが表示
- 各レベルがクリック可能（最終レベル除く）
- アクセシビリティ要件を満たした実装

#### UC-005: ページローディング状態管理
**説明**: ページ遷移時のローディング状態表示

**前提条件**:
- enableLoadingStates: trueの設定
- preloadData設定のあるルート

**手順**:
1. ユーザーがページ遷移を開始
2. NavigationProviderがローディング状態をtrueに設定
3. プリロードデータの取得を開始
4. ローディングUIが表示される
5. データ取得完了後、ローディング状態をfalseに設定
6. 新しいページが表示される

**期待結果**:
- ローディング中の適切な視覚的フィードバック
- データ取得エラー時の適切なエラーハンドリング
- 最小表示時間による画面フラッシュの防止

### 4.3 エッジケース

#### UC-006: 無効なルートへのアクセス
**説明**: 存在しないパスへのアクセス時の404エラーハンドリング

**前提条件**:
- アプリケーションに存在しないパス（例: /invalid-path）

**手順**:
1. ユーザーが無効なパスにアクセス
2. React Routerが該当ルートを見つけられない
3. 404 NotFoundPageコンポーネントが表示
4. エラー状態がNavigationProviderに記録
5. ホームページへの誘導リンクが表示

**期待結果**:
- 適切な404エラーページの表示
- ユーザーフレンドリーなエラーメッセージ
- ナビゲーションの復帰手段の提供

#### UC-007: 外部リンクの処理
**説明**: 外部サイトへのリンクの安全な処理

**前提条件**:
- external: trueが設定されたNavigationItem

**手順**:
1. ユーザーが外部リンクをクリック
2. NavigationProviderが外部リンクを検知
3. 確認ダイアログが表示される（必要に応じて）
4. ユーザーの確認後、新しいタブで外部サイトを開く

**期待結果**:
- セキュリティリスクの軽減
- ユーザーの意図しない離脱の防止
- 適切なrel="noopener noreferrer"の設定

### 4.4 エラーケース

#### UC-008: ナビゲーション設定エラー
**説明**: 不正なナビゲーション設定でのエラーハンドリング

**エラー条件**:
- 重複するID
- 無効なパス形式
- 循環参照のある階層構造

**期待動作**:
- 開発時の明確なエラーメッセージ
- プロダクション時のフォールバック動作
- エラー境界による適切な回復

#### UC-009: React Router エラー
**説明**: ルーティングライブラリレベルでのエラー処理

**エラー条件**:
- History APIの使用不可
- 不正なルート設定
- ナビゲーション中の予期しないエラー

**期待動作**:
- エラー境界による適切なキャッチ
- ユーザーに分かりやすいエラーメッセージ
- アプリケーションの継続使用可能性の確保

## 5. EARS要件マッピング（EARS Requirements Mapping）

### 5.1 REQ-202への対応
**要件**: メニューが選択されている状態では、システムは現在のページを視覚的に強調しなければならない

**実装対応**:
- `isActive()` および `isExactActive()` 関数による状態判定
- 全ナビゲーションコンポーネントでの統一されたアクティブ状態表示
- CSS クラスやARIA属性による視覚的・意味的な強調

**テスト要件**:
- 各ナビゲーションコンポーネントでのアクティブ状態テスト
- 複数コンポーネント間での状態同期テスト
- アクセシビリティ準拠のアクティブ状態表示テスト

### 5.2 関連要件への対応

#### REQ-401: アクセシビリティガイドライン準拠
**実装対応**:
- ARIA属性の適切な設定（aria-current, aria-expanded等）
- キーボードナビゲーションの完全サポート
- スクリーンリーダー対応のページ変更通知

#### REQ-402: キーボードナビゲーションサポート
**実装対応**:
- Tab/Shift+Tabによる順次ナビゲーション
- Enter/Spaceキーによる選択実行
- Escapeキーによるメニュークローズ

#### NFR-001, NFR-002: パフォーマンス要件
**実装対応**:
- React.memo、useMemo、useCallbackによる最適化
- 不要な再レンダリングの防止
- アニメーション処理の最適化

## 6. 実装仕様（Implementation Specifications）

### 6.1 React Router統合仕様

#### 6.1.1 BrowserRouter設定
```typescript
// NavigationProvider.tsx
import { BrowserRouter } from 'react-router-dom';

const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  navigationConfig,
  routeConfig = [],
  enableBreadcrumbs = true,
  enableLoadingStates = true
}) => {
  return (
    <BrowserRouter>
      <NavigationContextProvider value={contextValue}>
        <RoutingContextProvider value={routingValue}>
          {children}
        </RoutingContextProvider>
      </NavigationContextProvider>
    </BrowserRouter>
  );
};
```

#### 6.1.2 Routes設定
```typescript
// RouteRenderer.tsx
import { Routes, Route } from 'react-router-dom';

const RouteRenderer: React.FC<{ routeConfig: RouteConfig[] }> = ({ routeConfig }) => {
  return (
    <Routes>
      {routeConfig.map(route => (
        <Route
          key={route.path}
          path={route.path}
          element={<RouteWrapper route={route} />}
        />
      ))}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
```

### 6.2 NavigationProvider実装仕様

#### 6.2.1 状態管理
```typescript
// useNavigationState.ts
const useNavigationState = (): [NavigationState, React.Dispatch<NavigationAction>] => {
  const [state, dispatch] = useReducer(navigationReducer, initialState);

  return [state, dispatch];
};

const navigationReducer = (state: NavigationState, action: NavigationAction): NavigationState => {
  switch (action.type) {
    case 'ROUTE_CHANGED':
      return {
        ...state,
        currentRoute: {
          path: action.payload.path,
          params: action.payload.params,
          search: window.location.search,
          hash: window.location.hash
        },
        previousRoute: state.currentRoute ? {
          path: state.currentRoute.path,
          timestamp: Date.now()
        } : null
      };

    case 'BREADCRUMBS_UPDATED':
      return {
        ...state,
        breadcrumbs: action.payload
      };

    // その他のケース...
    default:
      return state;
  }
};
```

#### 6.2.2 ロケーション監視
```typescript
// useLocationSync.ts
import { useLocation } from 'react-router-dom';

const useLocationSync = (dispatch: React.Dispatch<NavigationAction>) => {
  const location = useLocation();

  useEffect(() => {
    const params = extractParams(location.pathname);

    dispatch({
      type: 'ROUTE_CHANGED',
      payload: {
        path: location.pathname,
        params
      }
    });
  }, [location.pathname, dispatch]);
};
```

### 6.3 アクティブページ検出ロジック

#### 6.3.1 パスマッチング実装
```typescript
// pathMatching.ts
export const isPathActive = (currentPath: string, targetPath: string, exact: boolean = false): boolean => {
  // 正規化処理
  const normalizedCurrent = normalizePath(currentPath);
  const normalizedTarget = normalizePath(targetPath);

  if (exact) {
    return normalizedCurrent === normalizedTarget;
  }

  // 部分マッチング
  return normalizedCurrent.startsWith(normalizedTarget);
};

export const normalizePath = (path: string): string => {
  // クエリパラメータとハッシュを除去
  const cleanPath = path.split('?')[0].split('#')[0];

  // 末尾のスラッシュを除去（ルート以外）
  return cleanPath === '/' ? cleanPath : cleanPath.replace(/\/$/, '');
};

export const extractParams = (path: string): Record<string, string> => {
  // 動的セグメントのパラメータ抽出
  const params: Record<string, string> = {};

  // 実装詳細...

  return params;
};
```

#### 6.3.2 アクティブ状態判定フック
```typescript
// useActiveState.ts
export const useActiveState = () => {
  const { currentPath } = useNavigationContext();

  const isActive = useCallback((path: string): boolean => {
    return isPathActive(currentPath, path, false);
  }, [currentPath]);

  const isExactActive = useCallback((path: string): boolean => {
    return isPathActive(currentPath, path, true);
  }, [currentPath]);

  return { isActive, isExactActive };
};
```

### 6.4 パンくずリスト生成実装

#### 6.4.1 階層解析
```typescript
// breadcrumbGenerator.ts
export const generateBreadcrumbs = (
  currentPath: string,
  navigationConfig: NavigationConfig
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];
  const pathSegments = currentPath.split('/').filter(Boolean);

  let accumulatedPath = '';

  pathSegments.forEach((segment, index) => {
    accumulatedPath += `/${segment}`;

    const navigationItem = findNavigationItem(accumulatedPath, navigationConfig);

    if (navigationItem) {
      breadcrumbs.push({
        id: navigationItem.id,
        label: navigationItem.label,
        path: accumulatedPath,
        isActive: index === pathSegments.length - 1,
        isClickable: index < pathSegments.length - 1
      });
    }
  });

  return breadcrumbs;
};

const findNavigationItem = (path: string, config: NavigationConfig): NavigationItem | null => {
  const allItems = [...config.primary, ...config.secondary];

  for (const item of allItems) {
    if (item.path === path) {
      return item;
    }

    if (item.children) {
      const found = findInChildren(path, item.children);
      if (found) return found;
    }
  }

  return null;
};
```

#### 6.4.2 パンくず更新フック
```typescript
// useBreadcrumbSync.ts
export const useBreadcrumbSync = (
  currentPath: string,
  navigationConfig: NavigationConfig,
  dispatch: React.Dispatch<NavigationAction>
) => {
  useEffect(() => {
    const breadcrumbs = generateBreadcrumbs(currentPath, navigationConfig);

    dispatch({
      type: 'BREADCRUMBS_UPDATED',
      payload: breadcrumbs
    });
  }, [currentPath, navigationConfig, dispatch]);
};
```

### 6.5 ナビゲーション状態管理

#### 6.5.1 Context実装
```typescript
// NavigationContext.tsx
const NavigationContext = createContext<NavigationContextValue | null>(null);

export const useNavigationContext = (): NavigationContextValue => {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }

  return context;
};

export const NavigationContextProvider: React.FC<{
  children: React.ReactNode;
  value: NavigationContextValue;
}> = ({ children, value }) => {
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
```

#### 6.5.2 ナビゲーション操作
```typescript
// navigationActions.ts
export const createNavigationActions = (
  navigate: NavigateFunction,
  dispatch: React.Dispatch<NavigationAction>
) => {
  const goToPath = (path: string) => {
    dispatch({ type: 'LOADING_STARTED', payload: { type: 'page' } });

    navigate(path);

    // ページ遷移後の処理
    setTimeout(() => {
      dispatch({ type: 'LOADING_COMPLETED', payload: { type: 'page' } });
    }, 100);
  };

  const goBack = () => {
    navigate(-1);
  };

  const closeAllMenus = () => {
    dispatch({ type: 'MENU_TOGGLED', payload: { type: 'hamburger', isOpen: false } });
    dispatch({ type: 'MENU_TOGGLED', payload: { type: 'side', isOpen: false } });
  };

  return { goToPath, goBack, closeAllMenus };
};
```

## 7. 完了基準（Completion Criteria）

### 7.1 機能完了基準
- ✅ React Router v6統合完了
- ✅ NavigationProvider実装完了
- ✅ アクティブページ検出機能実装完了
- ✅ パンくずリスト自動生成機能実装完了
- ✅ ナビゲーション状態管理機能実装完了
- ✅ 既存ナビゲーションコンポーネントとの統合完了
- ✅ モバイルメニュー自動クローズ機能実装完了
- ✅ 404エラーページ実装完了

### 7.2 品質基準
- ✅ 単体テストカバレッジ95%以上
- ✅ 統合テスト全項目通過
- ✅ E2Eテスト全シナリオ通過
- ✅ アクセシビリティテスト全項目通過
- ✅ TypeScriptエラー0件
- ✅ ESLintエラー0件
- ✅ パフォーマンス要件全項目達成

### 7.3 パフォーマンス基準
- ✅ ページ遷移時間200ms以内
- ✅ ナビゲーション状態更新50ms以内
- ✅ パンくずリスト生成100ms以内
- ✅ メニューアニメーション300ms以内
- ✅ バンドルサイズ増加10%以内

### 7.4 ドキュメンテーション基準
- ✅ API仕様ドキュメント完成
- ✅ 実装ガイド完成
- ✅ テストガイド完成
- ✅ トラブルシューティングガイド完成
- ✅ CHANGELOG.md更新

## 8. 実装フェーズ（Implementation Phases）

### Phase 1: 基盤実装（Foundation）
1. NavigationProvider基本構造実装
2. React Router統合
3. 基本的なContext提供
4. TypeScript型定義

### Phase 2: 状態管理（State Management）
1. NavigationState実装
2. ActionとReducer実装
3. useNavigationContextフック実装
4. 状態の永続化（必要に応じて）

### Phase 3: アクティブ状態検出（Active State Detection）
1. パスマッチングロジック実装
2. isActive/isExactActive関数実装
3. 既存コンポーネントとの統合
4. 状態同期機能実装

### Phase 4: パンくずリスト（Breadcrumb Generation）
1. パンくず生成アルゴリム実装
2. 階層解析機能実装
3. 動的更新機能実装
4. UI コンポーネント統合

### Phase 5: 高度な機能（Advanced Features）
1. ローディング状態管理
2. エラーハンドリング
3. 外部リンク処理
4. メニュー制御機能

### Phase 6: 最適化とテスト（Optimization & Testing）
1. パフォーマンス最適化
2. アクセシビリティ改善
3. 包括的テスト実装
4. ドキュメンテーション完成

このTDD要件定義書に基づいて、段階的にテスト駆動開発を進行し、高品質なナビゲーション統合システムを構築します。