/**
 * 【機能概要】: NavigationProviderとResponsiveLayoutの完全統合コンポーネント
 * 【実装方針】: TASK-201統合テスト（TC-201-I001-I004）対応
 * 【品質向上】: アクセシビリティ（WCAG 2.1 AA準拠）とResponsiveLayoutの連携
 * 🟢 信頼性レベル: TASK-201要件定義とResponsiveLayout仕様から確認済み
 */

import { useMantineColorScheme } from "@mantine/core";
import type React from "react";
import { memo, useCallback, useMemo } from "react";
import { NavigationProvider, useNavigationContext } from "../../providers/NavigationProvider";
import type { NavigationConfig, RouteConfig } from "../../types/navigation";
import ResponsiveLayout from "./ResponsiveLayout";
import type { NavigationItem } from "./ResponsiveLayout/types";

/**
 * 【型定義】: NavigationIntegratedLayoutのプロパティ
 * 【統合設計】: NavigationProviderとResponsiveLayoutの両方の設定を統合
 */
export interface NavigationIntegratedLayoutProps {
  /** 子コンポーネント（アプリケーションのメインコンテンツ） */
  children: React.ReactNode;
  /** NavigationProvider用の設定 */
  navigationConfig: NavigationConfig;
  /** ルート設定（オプション） */
  routeConfig?: RouteConfig[];
  /** パンくずリストを有効にするかどうか */
  enableBreadcrumbs?: boolean;
  /** ローディング状態を有効にするかどうか */
  enableLoadingStates?: boolean;
  /** 外部Routerを使用するかどうか（テスト用） */
  useExternalRouter?: boolean;
}

/**
 * 【内部コンポーネント】: ResponsiveLayoutとNavigationProviderの統合ロジック
 * 【アクセシビリティ】: ARIA属性とロール設定を強化
 * 【統合機能】: NavigationProviderの状態をResponsiveLayoutに反映
 */
const NavigationIntegratedLayoutInner = memo<{
  children: React.ReactNode;
  navigationConfig: NavigationConfig;
}>(({ children, navigationConfig }) => {
  const {
    currentPath,
    isActive,
    isExactActive,
    navigate,
    breadcrumbs,
    isMenuOpen,
    toggleMenu,
    closeAllMenus,
    currentPageTitle,
  } = useNavigationContext();

  const { colorScheme } = useMantineColorScheme();

  /**
   * 【機能変換】: NavigationConfigからResponsiveLayout用NavigationItemへの変換
   * 【アクセシビリティ強化】: WCAG 2.1 AA準拠のアクセシビリティ機能
   * 【統合機能】: NavigationProviderのアクティブ状態判定を活用
   */
  const convertToNavigationItems = useCallback(
    (
      items: Array<{
        id: string;
        label: string;
        path: string;
        icon?: string | React.ComponentType;
        external?: boolean;
        disabled?: boolean;
        children?: any[];
        group?: string;
        badge?: string | number;
        hasNotification?: boolean;
        description?: string;
      }>
    ): NavigationItem[] => {
      return items.map((item) => ({
        id: item.id,
        label: item.label,
        path: item.path,
        icon: typeof item.icon === "function" ? item.icon : undefined,
        group: item.group,
        badge: item.badge,
        hasNotification: item.hasNotification,
        description: item.description,
      }));
    },
    []
  );

  /**
   * 【統合ナビゲーションハンドラー】: ResponsiveLayoutのナビゲーションイベントを処理
   * 【アクセシビリティ】: フォーカス管理とスクリーンリーダー対応
   */
  const handleNavigationClick = useCallback(
    (path: string, event?: React.MouseEvent) => {
      if (event) {
        event.preventDefault();
      }

      // NavigationProviderのナビゲーション機能を使用
      navigate(path);

      // メニューを自動クローズ（モバイルUX向上）
      closeAllMenus();

      // メインコンテンツにフォーカス移動（アクセシビリティ）
      const mainContent = document.querySelector('[role="main"]') as HTMLElement;
      if (mainContent) {
        mainContent.focus();
      }
    },
    [navigate, closeAllMenus]
  );

  /**
   * 【アクセシビリティ強化】: ResponsiveLayout用のナビゲーション設定に統合機能を追加
   */
  const enhancedNavigationConfig = useMemo(() => {
    const enhanceItems = (items: any[]) =>
      convertToNavigationItems(items).map((item) => ({
        ...item,
        // ナビゲーションクリックハンドラーの統合
        onClick: (event: React.MouseEvent) => handleNavigationClick(item.path, event),
        // アクティブ状態の統合
        "aria-current": isExactActive(item.path) ? "page" : undefined,
        "data-testid": `nav-item-${item.id}`,
        // アクセシビリティ属性の追加
        "aria-describedby": item.description ? `${item.id}-description` : undefined,
        tabIndex: 0,
        role: "menuitem",
      }));

    return {
      primary: enhanceItems(navigationConfig.primary),
      secondary: enhanceItems(navigationConfig.secondary),
    };
  }, [navigationConfig, convertToNavigationItems, handleNavigationClick, isExactActive]);

  return (
    <div
      data-testid="navigation-integrated-layout"
      role="application"
      aria-label="ナビゲーション統合アプリケーション"
    >
      {/* 【アクセシビリティ】: スクリーンリーダー用の現在ページ情報 */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="page-announcement"
      >
        現在のページ: {currentPageTitle || currentPath}
      </div>

      {/* 【キーボードナビゲーション】: ショートカットキー対応 */}
      <div
        className="sr-only"
        onKeyDown={(event) => {
          // Alt + M でメインコンテンツにジャンプ
          if (event.altKey && event.key === "m") {
            event.preventDefault();
            const mainContent = document.querySelector('[role="main"]') as HTMLElement;
            if (mainContent) {
              mainContent.focus();
            }
          }
          // Alt + N でナビゲーションにジャンプ
          if (event.altKey && event.key === "n") {
            event.preventDefault();
            const navigation = document.querySelector('[role="navigation"]') as HTMLElement;
            if (navigation) {
              navigation.focus();
            }
          }
        }}
        aria-label="キーボードショートカット: Alt+M でメインコンテンツ、Alt+N でナビゲーション"
      >
        スキップリンク
      </div>

      {/* 【統合コンポーネント】: ResponsiveLayoutにNavigationProviderの状態を連携 */}
      <ResponsiveLayout navigationConfig={enhancedNavigationConfig}>
        <div style={{ position: "relative" }} data-testid="app-content">
          {/* 【パンくずリスト】: アクセシビリティ対応のナビゲーション補助 */}
          {breadcrumbs.length > 0 && (
            <nav
              aria-label="パンくずリスト"
              data-testid="breadcrumb-navigation"
              style={{ padding: "1rem 0" }}
            >
              <ol
                style={{
                  display: "flex",
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.id} data-testid={`breadcrumb-${index}`}>
                    {crumb.isClickable ? (
                      <button
                        onClick={() => handleNavigationClick(crumb.path)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "inherit",
                          textDecoration: "underline",
                          cursor: "pointer",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          minHeight: "44px", // WCAG 2.1 AAタップターゲット
                          minWidth: "44px",
                        }}
                        aria-current={crumb.isActive ? "page" : undefined}
                        tabIndex={0}
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span
                        aria-current="page"
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontWeight: "bold",
                        }}
                      >
                        {crumb.label}
                      </span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <span style={{ margin: "0 0.25rem" }} aria-hidden="true" role="separator">
                        /
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* 【メインコンテンツ】: ResponsiveLayoutのAppShell.Mainを使用 */}
          <div
            style={{
              outline: "none",
              minHeight: "200px", // スクリーンリーダー検出用の最小高さ
            }}
          >
            {children}
          </div>
        </div>

        {/* 【デバッグ情報】: 開発環境でのステータス表示 */}
        {process.env.NODE_ENV === "development" && (
          <div
            data-testid="debug-info"
            style={{
              position: "fixed",
              bottom: 0,
              right: 0,
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "0.5rem",
              fontSize: "0.75rem",
              zIndex: 9999,
              borderRadius: "0.25rem 0 0 0",
            }}
            aria-live="polite"
            aria-label="デバッグ情報"
          >
            Path: {currentPath} | Theme: {colorScheme} | Breadcrumbs: {breadcrumbs.length}
          </div>
        )}
      </ResponsiveLayout>
    </div>
  );
});

NavigationIntegratedLayoutInner.displayName = "NavigationIntegratedLayoutInner";

/**
 * 【メインコンポーネント】: NavigationProviderとResponsiveLayoutの完全統合
 * 【使用例】:
 * ```tsx
 * <NavigationIntegratedLayout navigationConfig={config}>
 *   <App />
 * </NavigationIntegratedLayout>
 * ```
 *
 * 【提供機能】:
 * - NavigationProviderによるルーティング統合
 * - ResponsiveLayoutによるレスポンシブデザイン
 * - アクセシビリティ対応（WCAG 2.1 AA準拠）
 * - パンくずリスト自動生成
 * - テーマシステム統合
 *
 * 【アクセシビリティ】:
 * - スクリーンリーダー対応
 * - キーボードナビゲーション
 * - ARIA属性完全対応
 * - フォーカス管理
 */
export const NavigationIntegratedLayout = memo<NavigationIntegratedLayoutProps>(
  ({
    children,
    navigationConfig,
    routeConfig,
    enableBreadcrumbs = true,
    enableLoadingStates = true,
    useExternalRouter = false,
  }) => {
    return (
      <NavigationProvider
        navigationConfig={navigationConfig}
        routeConfig={routeConfig}
        enableBreadcrumbs={enableBreadcrumbs}
        enableLoadingStates={enableLoadingStates}
        useExternalRouter={useExternalRouter}
      >
        <NavigationIntegratedLayoutInner navigationConfig={navigationConfig}>
          {children}
        </NavigationIntegratedLayoutInner>
      </NavigationProvider>
    );
  }
);

NavigationIntegratedLayout.displayName = "NavigationIntegratedLayout";

export default NavigationIntegratedLayout;
