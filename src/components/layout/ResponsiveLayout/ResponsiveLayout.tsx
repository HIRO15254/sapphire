import { AppShell } from "@mantine/core";
import { memo } from "react";
import { FooterNavigation, HamburgerMenu, HeaderNavigation, SideNavigation } from "./components";
import { useNavigationConfig, useResponsiveLayout } from "./hooks";
import type { ResponsiveLayoutProps } from "./types";

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
const ResponsiveLayout = memo<ResponsiveLayoutProps>(
  ({ children, navigationConfig }) => {
    // 【カスタムフック】: レスポンシブレイアウトロジックを分離管理 🟢
    const { isMobile, hamburgerOpened, toggleHamburger, closeHamburger } = useResponsiveLayout();

    // 【カスタムフック】: ナビゲーション設定の検証とグループ化 🟢
    const { safeNavigationConfig, groupedSecondaryItems } = useNavigationConfig(navigationConfig);

    return (
      <div data-testid="responsive-layout-container">
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
              <AppShell.Navbar>
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
            <AppShell.Main>{children}</AppShell.Main>

            {/* モバイルハンバーガーメニュー */}
            <HamburgerMenu
              items={safeNavigationConfig.secondary}
              opened={hamburgerOpened}
              onClose={closeHamburger}
            />
          </AppShell>
        </div>
    );
  }
);

ResponsiveLayout.displayName = "ResponsiveLayout";

export default ResponsiveLayout;
export type { ResponsiveLayoutProps } from "./types";
