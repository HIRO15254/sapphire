/**
 * 【機能概要】: NavigationProvider状態管理ロジック
 * 【実装方針】: useReducerによる効率的状態更新とイミュータビリティ
 * 【品質向上】: Refactorフェーズで状態管理の分離と最適化
 * 🟢 信頼性レベル: React useReducer APIから確認済み
 */

import { useCallback, useReducer } from "react";
import type { NavigationAction, NavigationState } from "../../../types/navigation";
import { initialNavigationState, performanceThresholds } from "../constants/initialState";
import { logger } from "../utils/loggerUtils";
import { performanceUtils } from "../utils/performanceUtils";

/**
 * 【機能概要】: NavigationProvider状態更新ロジック
 * 【パフォーマンス】: イミュータブル更新と構造共有最適化
 * 【品質向上】: 型安全な状態遷移とロギング
 */
export const navigationReducer = (
  state: NavigationState,
  action: NavigationAction
): NavigationState => {
  return performanceUtils.measureExecutionTime(
    () => {
      logger.debug("Processing navigation action", {
        type: action.type,
        currentPath: state.currentRoute.path,
      });

      switch (action.type) {
        case "ROUTE_CHANGED":
          return handleRouteChanged(state, action);

        case "LOADING_STARTED":
          return handleLoadingStarted(state, action);

        case "LOADING_COMPLETED":
          return handleLoadingCompleted(state, action);

        case "MENU_TOGGLED":
          return handleMenuToggled(state, action);

        case "MENU_CLOSED":
          return handleMenuClosed(state, action);

        case "BREADCRUMBS_UPDATED":
          return handleBreadcrumbsUpdated(state, action);

        case "PAGE_TITLE_SET":
          return handlePageTitleSet(state, action);

        default:
          logger.warn("Unknown navigation action type", {
            type: (action as { type: unknown }).type,
          });
          return state;
      }
    },
    "navigation-state-update",
    performanceThresholds.stateUpdate
  );
};

/**
 * 【機能概要】: ルート変更処理
 * 【品質向上】: 前のルート情報保存と状態の適切な更新
 */
const handleRouteChanged = (
  state: NavigationState,
  action: Extract<NavigationAction, { type: "ROUTE_CHANGED" }>
): NavigationState => {
  const { path, params } = action.payload;
  const shouldUpdatePrevious = state.currentRoute.path !== path;

  return {
    ...state,
    currentRoute: {
      path,
      params,
      search: typeof window !== "undefined" ? window.location.search : "",
      hash: typeof window !== "undefined" ? window.location.hash : "",
    },
    previousRoute: shouldUpdatePrevious
      ? {
          path: state.currentRoute.path,
          timestamp: Date.now(),
        }
      : state.previousRoute,
  };
};

/**
 * 【機能概要】: ローディング開始処理
 * 【品質向上】: ローディング種別の適切な管理
 */
const handleLoadingStarted = (
  state: NavigationState,
  action: Extract<NavigationAction, { type: "LOADING_STARTED" }>
): NavigationState => {
  const loadingType = action.payload.type === "page" ? "pageTransition" : "dataLoading";

  return {
    ...state,
    loadingStates: {
      ...state.loadingStates,
      [loadingType]: true,
    },
  };
};

/**
 * 【機能概要】: ローディング完了処理
 * 【品質向上】: ローディング状態の確実なクリア
 */
const handleLoadingCompleted = (
  state: NavigationState,
  action: Extract<NavigationAction, { type: "LOADING_COMPLETED" }>
): NavigationState => {
  const loadingType = action.payload.type === "page" ? "pageTransition" : "dataLoading";

  return {
    ...state,
    loadingStates: {
      ...state.loadingStates,
      [loadingType]: false,
    },
  };
};

/**
 * 【機能概要】: メニュー状態切り替え処理
 * 【品質向上】: メニュー種別の型安全な管理
 */
const handleMenuToggled = (
  state: NavigationState,
  action: Extract<NavigationAction, { type: "MENU_TOGGLED" }>
): NavigationState => {
  const { type: menuType, isOpen } = action.payload;

  // サポートされていないメニュータイプの処理
  if (menuType !== "hamburger" && menuType !== "side") {
    logger.warn("Unsupported menu type in state update", { menuType });
    return state;
  }

  return {
    ...state,
    menuStates: {
      ...state.menuStates,
      [menuType]: isOpen,
    },
  };
};

/**
 * 【機能概要】: パンくずリスト更新処理
 * 【品質向上】: パンくずリストの検証と安全な更新
 */
const handleBreadcrumbsUpdated = (
  state: NavigationState,
  action: Extract<NavigationAction, { type: "BREADCRUMBS_UPDATED" }>
): NavigationState => {
  const breadcrumbs = action.payload;

  // パンくずリストの基本検証
  if (!Array.isArray(breadcrumbs)) {
    logger.warn("Invalid breadcrumbs payload: not an array", { breadcrumbs });
    return state;
  }

  return {
    ...state,
    breadcrumbs,
  };
};

/**
 * 【機能概要】: メニュークローズ処理
 * 【品質向上】: 指定メニューのクローズと状態更新
 * 【TC-201-N005対応】: ナビゲーション後のメニュー自動クローズ
 */
const handleMenuClosed = (
  state: NavigationState,
  action: Extract<NavigationAction, { type: "MENU_CLOSED" }>
): NavigationState => {
  const { menuType } = action.payload;

  if (menuType !== "hamburger" && menuType !== "side") {
    logger.warn("Invalid menu type for MENU_CLOSED action", { menuType });
    return state;
  }

  return {
    ...state,
    menuStates: {
      ...state.menuStates,
      [menuType]: false,
    },
  };
};

/**
 * 【機能概要】: ページタイトル設定処理
 * 【品質向上】: タイトルの検証と安全な更新
 */
const handlePageTitleSet = (
  state: NavigationState,
  action: Extract<NavigationAction, { type: "PAGE_TITLE_SET" }>
): NavigationState => {
  const title = action.payload;

  // タイトルの基本検証
  if (typeof title !== "string") {
    logger.warn("Invalid page title: not a string", { title });
    return state;
  }

  return {
    ...state,
    pageMetadata: {
      ...state.pageMetadata,
      title: title.trim(),
    },
  };
};

/**
 * 【機能概要】: NavigationProvider用カスタムReducerフック
 * 【品質向上】: 型安全なdispatch関数とパフォーマンス最適化
 */
export const useNavigationReducer = (customInitialState?: Partial<NavigationState>) => {
  const mergedInitialState: NavigationState = {
    ...initialNavigationState,
    ...customInitialState,
  };

  const [state, dispatch] = useReducer(navigationReducer, mergedInitialState);

  // 【最適化】: dispatchのメモ化
  const memoizedDispatch = useCallback(dispatch, []);

  // 【開発支援】: 状態変更の詳細ログ
  if (process.env.NODE_ENV === "development") {
    logger.debug("Navigation state updated", {
      currentPath: state.currentRoute.path,
      loadingStates: state.loadingStates,
      menuStates: state.menuStates,
      breadcrumbCount: state.breadcrumbs.length,
    });
  }

  return [state, memoizedDispatch] as const;
};

/**
 * 【機能概要】: アクション作成ヘルパー関数
 * 【品質向上】: 型安全なアクション生成と再利用性
 */
export const createNavigationActions = () => {
  return {
    changeRoute: (path: string, params: Record<string, string> = {}): NavigationAction => ({
      type: "ROUTE_CHANGED",
      payload: { path, params },
    }),

    startLoading: (type: "page" | "data"): NavigationAction => ({
      type: "LOADING_STARTED",
      payload: { type },
    }),

    completeLoading: (type: "page" | "data"): NavigationAction => ({
      type: "LOADING_COMPLETED",
      payload: { type },
    }),

    toggleMenu: (type: "hamburger" | "side", isOpen: boolean): NavigationAction => ({
      type: "MENU_TOGGLED",
      payload: { type, isOpen },
    }),

    updateBreadcrumbs: (
      breadcrumbs: import("../../../types/navigation").BreadcrumbItem[]
    ): NavigationAction => ({
      type: "BREADCRUMBS_UPDATED",
      payload: breadcrumbs,
    }),

    setPageTitle: (title: string): NavigationAction => ({
      type: "PAGE_TITLE_SET",
      payload: title,
    }),
  };
};

export default {
  navigationReducer,
  useNavigationReducer,
  createNavigationActions,
};
