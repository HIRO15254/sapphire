import type React from "react";
import type { NavigationItem } from "../components/layout/ResponsiveLayout/types/NavigationTypes";

/**
 * ナビゲーション設定の型定義
 * 【機能概要】: NavigationProvider用の設定インターフェース
 * 【TDD対応】: TASK-201テストケース準拠の型定義
 * 🟢 信頼性レベル: TDD要件定義から確認済み
 */
export interface NavigationConfig {
  /** プライマリナビゲーション項目（ヘッダー/フッター表示） */
  primary: NavigationItem[];
  /** セカンダリナビゲーション項目（サイドバー/ドロワー表示） */
  secondary: NavigationItem[];
}

/**
 * ルート設定の型定義
 * 【機能概要】: React Router統合用のルート設定
 * 【パンくず対応】: breadcrumbLabelによるパンくずリスト生成
 */
export interface RouteConfig {
  /** ルートパス */
  path: string;
  /** レンダリングするコンポーネント */
  element: React.ComponentType;
  /** パンくずリスト用ラベル */
  breadcrumbLabel?: string;
  /** 認証が必要かどうか */
  requiresAuth?: boolean;
  /** データのプリロード関数 */
  preloadData?: () => Promise<unknown>;
}

/**
 * パンくずリスト項目の型定義
 * 【機能概要】: パンくずリストの各項目を表現
 * 【アクセシビリティ】: isActive, isClickableによる状態管理
 */
export interface BreadcrumbItem {
  /** 項目の一意識別子 */
  id: string;
  /** 表示ラベル */
  label: string;
  /** リンク先パス */
  path: string;
  /** アクティブ状態（現在のページかどうか） */
  isActive: boolean;
  /** クリック可能かどうか */
  isClickable: boolean;
}

/**
 * メニュータイプの型定義
 * 【機能概要】: 各種メニューの識別子
 */
export type MenuType = "hamburger" | "side" | "header" | "footer";

/**
 * ナビゲーションコンテキストの値の型定義
 * 【機能概要】: NavigationProvider が提供するコンテキスト値
 * 【テスト対応】: 全テストケースで使用される主要インターフェース
 */
export interface NavigationContextValue {
  // 現在の状態
  /** 現在のパス */
  currentPath: string;
  /** 前のパス */
  previousPath: string | null;
  /** ローディング状態（boolean値） */
  isLoading: boolean;
  /** ページローディング状態 */
  isPageLoading: boolean;
  /** データローディング状態 */
  isDataLoading: boolean;
  /** ローディング状態チェック関数（オプション） */
  checkLoading?: (type?: "page" | "data") => boolean;

  // パンくずリスト
  /** パンくずリスト項目配列 */
  breadcrumbs: BreadcrumbItem[];

  // ナビゲーション操作
  /** ページ遷移関数 */
  navigate: (path: string, options?: { state?: unknown }) => void;
  /** 戻る関数 */
  goBack: () => void;

  // 状態判定
  /** パスがアクティブかどうかを判定（部分マッチ） */
  isActive: (path: string) => boolean;
  /** パスが完全一致でアクティブかどうかを判定 */
  isExactActive: (path: string) => boolean;

  // ページ管理
  /** ページタイトルを設定 */
  setPageTitle: (title: string) => void;
  /** 現在のページタイトルを取得 */
  getPageTitle: () => string;
  /** 現在のページタイトル */
  currentPageTitle: string;

  // メニュー制御
  /** 全メニューを閉じる */
  closeAllMenus: () => void;
  /** 指定メニューが開いているかどうかを判定 */
  isMenuOpen: (menuType: MenuType) => boolean;
  /** メニューの開閉切り替え */
  toggleMenu: (menuType: MenuType) => void;

  // ローディング制御
  /** ローディングを開始 */
  startLoading: (type: "page" | "data") => void;
  /** ローディングを完了 */
  completeLoading: (type: "page" | "data") => void;
}

/**
 * NavigationProvider のプロパティ型定義
 * 【機能概要】: NavigationProvider コンポーネントの props
 * 【TDD対応】: テストケースで使用される設定オプション
 */
export interface NavigationProviderProps {
  /** 子コンポーネント */
  children: React.ReactNode;
  /** ナビゲーション設定 */
  navigationConfig: NavigationConfig;
  /** ルート設定（オプション） */
  routeConfig?: RouteConfig[];
  /** パンくずリストを有効にするかどうか */
  enableBreadcrumbs?: boolean;
  /** ローディング状態を有効にするかどうか */
  enableLoadingStates?: boolean;
  /** Routerを有効にするかどうか（テスト用） */
  enableRouter?: boolean;
}

/**
 * ナビゲーション状態の型定義
 * 【機能概要】: NavigationProvider の内部状態管理
 * 【パフォーマンス】: useReducer による効率的な状態更新
 */
export interface NavigationState {
  /** 現在のルート情報 */
  currentRoute: {
    path: string;
    params: Record<string, string>;
    search: string;
    hash: string;
  };

  /** 前のルート情報 */
  previousRoute: {
    path: string;
    timestamp: number;
  } | null;

  /** パンくずリスト */
  breadcrumbs: BreadcrumbItem[];

  /** ローディング状態 */
  loadingStates: {
    pageTransition: boolean;
    dataLoading: boolean;
  };

  /** メニュー状態 */
  menuStates: {
    hamburger: boolean;
    side: boolean;
  };

  /** ページメタデータ */
  pageMetadata: {
    title: string;
    description?: string;
    keywords?: string[];
  };
}

/**
 * ナビゲーションアクションの型定義
 * 【機能概要】: NavigationProvider の状態更新アクション
 * 【型安全性】: discriminated union による厳密なアクション管理
 */
export type NavigationAction =
  | { type: "ROUTE_CHANGED"; payload: { path: string; params: Record<string, string> } }
  | { type: "LOADING_STARTED"; payload: { type: "page" | "data" } }
  | { type: "LOADING_COMPLETED"; payload: { type: "page" | "data" } }
  | { type: "MENU_TOGGLED"; payload: { type: MenuType; isOpen: boolean } }
  | { type: "MENU_CLOSED"; payload: { menuType: MenuType } }
  | { type: "BREADCRUMBS_UPDATED"; payload: BreadcrumbItem[] }
  | { type: "PAGE_TITLE_SET"; payload: string };

/**
 * ナビゲーション履歴項目の型定義
 * 【機能概要】: ナビゲーション履歴の管理
 */
export interface NavigationHistoryItem {
  /** パス */
  path: string;
  /** タイムスタンプ */
  timestamp: number;
  /** タイトル（オプション） */
  title?: string;
}

/**
 * ルーティングコンテキスト値の型定義
 * 【機能概要】: React Router 統合用のコンテキスト
 */
export interface RoutingContextValue {
  /** 現在のロケーション */
  location: Location;
  /** パラメータ */
  params: Record<string, string>;
  /** 検索パラメータ */
  searchParams: URLSearchParams;
  /** ナビゲーション履歴 */
  history: NavigationHistoryItem[];
  /** ページデータ */
  pageData: Record<string, unknown>;
  /** ページデータ設定関数 */
  setPageData: (key: string, data: unknown) => void;
}
