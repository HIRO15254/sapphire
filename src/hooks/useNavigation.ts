import { useCallback } from "react";
import { useNavigationContext } from "../providers/NavigationProvider";
import type { MenuType } from "../types/navigation";

/**
 * ナビゲーション機能を提供するカスタムフック
 * 【機能概要】: NavigationProvider のコンテキストを便利に使用するためのフック
 * 【TDD対応】: TC-201-N004 全コンポーネント間状態共有テスト用
 * 【パフォーマンス】: useCallback による関数のメモ化
 *
 * @returns ナビゲーション機能のオブジェクト
 */
export const useNavigation = () => {
  const context = useNavigationContext();

  // 【ナビゲーション操作】: ページ遷移機能
  const navigate = useCallback(
    (path: string) => {
      context.navigate(path);
    },
    [context.navigate]
  );

  // 【ナビゲーション操作】: 戻る機能
  const goBack = useCallback(() => {
    context.goBack();
  }, [context.goBack]);

  // 【状態判定】: アクティブ状態判定（部分マッチ）
  const isActive = useCallback(
    (path: string): boolean => {
      return context.isActive(path);
    },
    [context.isActive]
  );

  // 【状態判定】: アクティブ状態判定（完全一致）
  const isExactActive = useCallback(
    (path: string): boolean => {
      return context.isExactActive(path);
    },
    [context.isExactActive]
  );

  // 【ページ管理】: タイトル設定
  const setPageTitle = useCallback(
    (title: string) => {
      context.setPageTitle(title);
    },
    [context.setPageTitle]
  );

  // 【ページ管理】: タイトル取得
  const getPageTitle = useCallback((): string => {
    return context.getPageTitle();
  }, [context.getPageTitle]);

  // 【メニュー制御】: 全メニュークローズ
  const closeAllMenus = useCallback(() => {
    context.closeAllMenus();
  }, [context.closeAllMenus]);

  // 【メニュー制御】: メニュー開閉状態判定
  const isMenuOpen = useCallback(
    (menuType: MenuType): boolean => {
      return context.isMenuOpen(menuType);
    },
    [context.isMenuOpen]
  );

  // 【状態取得】: 現在のパス
  const getCurrentPath = useCallback((): string => {
    return context.currentPath;
  }, [context.currentPath]);

  // 【状態取得】: 前のパス
  const getPreviousPath = useCallback((): string | null => {
    return context.previousPath;
  }, [context.previousPath]);

  // 【状態取得】: ローディング状態
  const getIsLoading = useCallback((): boolean => {
    return context.isLoading;
  }, [context.isLoading]);

  // 【状態取得】: パンくずリスト
  const getBreadcrumbs = useCallback(() => {
    return context.breadcrumbs;
  }, [context.breadcrumbs]);

  return {
    // ナビゲーション操作
    navigate,
    goBack,

    // 状態判定
    isActive,
    isExactActive,

    // ページ管理
    setPageTitle,
    getPageTitle,

    // メニュー制御
    closeAllMenus,
    isMenuOpen,

    // 状態取得
    getCurrentPath,
    getPreviousPath,
    getIsLoading,
    getBreadcrumbs,

    // 直接的なコンテキスト値アクセス
    currentPath: context.currentPath,
    previousPath: context.previousPath,
    isLoading: context.isLoading,
    breadcrumbs: context.breadcrumbs,
  };
};

/**
 * ナビゲーション状態のみを取得するフック
 * 【機能概要】: 読み取り専用のナビゲーション状態を提供
 * 【パフォーマンス】: 状態変更を引き起こさない軽量フック
 * 【TDD対応】: TC-201-P001 状態更新パフォーマンステスト用
 */
export const useNavigationState = () => {
  const context = useNavigationContext();

  return {
    currentPath: context.currentPath,
    previousPath: context.previousPath,
    isLoading: context.isLoading,
    breadcrumbs: context.breadcrumbs,
  };
};

/**
 * ナビゲーション操作のみを取得するフック
 * 【機能概要】: 操作関数のみを提供
 * 【パフォーマンス】: 状態値を参照しないため再レンダリングが少ない
 * 【TDD対応】: TC-201-N005 モバイルメニュー自動クローズテスト用
 */
export const useNavigationActions = () => {
  const context = useNavigationContext();

  return {
    navigate: context.navigate,
    goBack: context.goBack,
    setPageTitle: context.setPageTitle,
    closeAllMenus: context.closeAllMenus,
  };
};

/**
 * アクティブ状態判定のみを取得するフック
 * 【機能概要】: パスのアクティブ状態判定機能のみを提供
 * 【パフォーマンス】: 判定機能に特化した軽量フック
 * 【TDD対応】: TC-201-N002 アクティブページ検出機能テスト用
 */
export const useActiveState = () => {
  const context = useNavigationContext();

  return {
    isActive: context.isActive,
    isExactActive: context.isExactActive,
    currentPath: context.currentPath,
  };
};

export default useNavigation;
