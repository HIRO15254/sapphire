import { AppShell } from "@mantine/core";
import { memo, useEffect, useMemo } from "react";
import { useLiveAnnouncer } from "../../../hooks/accessibility/useLiveAnnouncer";
import { LiveRegion } from "../../accessibility/LiveRegion";
import { SkipLink } from "../../accessibility/SkipLink";
import { FooterNavigation, HamburgerMenu, HeaderNavigation, SideNavigation } from "./components";
import { useNavigationConfig, useResponsiveLayout } from "./hooks";
import type { NavigationItem, ResponsiveLayoutProps, UseResponsiveLayoutReturn } from "./types";

// 【ユーティリティ関数】: NavigationItem配列をgroupedItems形式に変換
const groupNavigationItems = (items: NavigationItem[]): Record<string, NavigationItem[]> => {
  if (!items || !Array.isArray(items)) {
    return { default: [] };
  }

  const grouped: Record<string, NavigationItem[]> = {};

  items.forEach((item) => {
    const groupName = item.group || "default";
    if (!grouped[groupName]) {
      grouped[groupName] = [];
    }
    grouped[groupName].push(item);
  });

  return grouped;
};

// 【エラーハンドリング】: useResponsiveLayoutの安全な実行ラッパー
const useSafeResponsiveLayout = (): UseResponsiveLayoutReturn => {
  try {
    // biome-ignore lint/correctness/useHookAtTopLevel: TC-102テスト要件のため必要なエラーハンドリング
    return useResponsiveLayout();
  } catch (_error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`MediaQuery API not supported`);
    }
    // フォールバック: デスクトップレイアウトとデフォルト状態
    return {
      isMobile: false,
      hamburgerOpened: false,
      toggleHamburger: () => {},
      closeHamburger: () => {},
      isMediaQuerySupported: false,
    };
  }
};

/**
 * 【機能概要】: デバイス画面サイズに基づいてレスポンシブレイアウトを提供するコンポーネント
 * 【実装方針】: レイアウト責任に特化、テーマ管理は外部Provider依存
 * 【テスト対応】: TC-001, TC-002, TC-003の基本レイアウト表示テストに対応
 * 【パフォーマンス】: React.memo による最適化とカスタムフックによる状態管理
 * 🟢 信頼性レベル: EARS要件REQ-101, REQ-102から直接確認済み
 * @param children - メインコンテンツエリアに表示する子コンポーネント
 * @param navigationConfig - ナビゲーション項目の設定オブジェクト
 * @returns レスポンシブレイアウトJSX要素
 */
const ResponsiveLayout = memo<ResponsiveLayoutProps>(({ children, navigationConfig }) => {
  // 【カスタムフック】: レスポンシブレイアウトロジックを分離管理 🟢
  const { isMobile, hamburgerOpened, toggleHamburger, closeHamburger } = useSafeResponsiveLayout();

  // 【カスタムフック】: ナビゲーション設定の検証とグループ化 🟢
  const { safeNavigationConfig, groupedSecondaryItems } = useNavigationConfig(navigationConfig);

  // 【アクセシビリティ】: Live Announcer フック
  const { announce, LiveRegion: LiveAnnouncementRegion } = useLiveAnnouncer();

  // 【パフォーマンス最適化】: HamburgerMenu用のgroupedItemsをメモ化
  const hamburgerGroupedItems = useMemo(
    () => groupNavigationItems(safeNavigationConfig.secondary || []),
    [safeNavigationConfig.secondary]
  );

  // 【アクセシビリティ】: デバイス切り替え時の音声通知
  useEffect(() => {
    if (isMobile) {
      announce("モバイルレイアウトに切り替わりました", "polite");
    } else {
      announce("デスクトップレイアウトに切り替わりました", "polite");
    }
  }, [isMobile, announce]);

  return (
    <div data-testid="responsive-layout-container">
      {/* Skip Links */}
      <SkipLink href="#main-content">メインコンテンツにスキップ</SkipLink>

      {/* Live Region for screen reader announcements */}
      <LiveRegion />
      <LiveAnnouncementRegion />

      <AppShell
        header={{ height: { base: 56, md: 64 } }}
        navbar={{
          width: { base: 0, md: 280 },
          breakpoint: "md",
          collapsed: { mobile: true, desktop: false },
        }}
        footer={{
          height: { base: 80, md: 0 },
        }}
        padding={{ base: "sm", md: "md" }}
      >
        {/* ヘッダー部分 */}
        <AppShell.Header>
          <HeaderNavigation
            items={safeNavigationConfig.primary}
            isMobile={isMobile}
            hamburgerOpened={hamburgerOpened}
            onHamburgerToggle={toggleHamburger}
          />
        </AppShell.Header>

        {/* デスクトップサイドバー */}
        {!isMobile && (
          <AppShell.Navbar aria-label="サイドバーエリア">
            <SideNavigation
              items={safeNavigationConfig.secondary}
              groupedItems={groupedSecondaryItems}
            />
          </AppShell.Navbar>
        )}

        {/* モバイルフッター */}
        {isMobile && (
          <AppShell.Footer>
            <FooterNavigation items={safeNavigationConfig.primary} />
          </AppShell.Footer>
        )}

        {/* メインコンテンツ */}
        <AppShell.Main id="main-content" tabIndex={-1} role="main" aria-label="メインコンテンツ">
          {children}
        </AppShell.Main>

        {/* モバイルハンバーガーメニュー */}
        <HamburgerMenu
          items={safeNavigationConfig.secondary || []}
          groupedItems={hamburgerGroupedItems}
          isOpen={hamburgerOpened}
          onClose={closeHamburger}
          onToggle={toggleHamburger}
        />
      </AppShell>
    </div>
  );
});

ResponsiveLayout.displayName = "ResponsiveLayout";

export { ResponsiveLayout };
export default ResponsiveLayout;
export type { ResponsiveLayoutProps } from "./types";
