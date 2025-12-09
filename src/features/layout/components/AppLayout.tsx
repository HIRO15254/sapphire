"use client";

import { AppShell, Burger, Group, Text } from "@mantine/core";
import { IconCards } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface AppLayoutProps {
  /** メインコンテンツ */
  children: ReactNode;
  /** サイドバーの内容 */
  navbar: ReactNode;
  /** モバイル用サイドバーが開いているかどうか */
  mobileOpened: boolean;
  /** モバイル用サイドバーのトグル */
  onMobileToggle: () => void;
}

/**
 * Mantine AppShellを使用したアプリケーションレイアウト
 *
 * FR-001: デスクトップでは常に展開されたサイドバー、モバイルではハンバーガーメニュー
 * FR-004: モバイルデバイスではハンバーガーメニューとして動作
 */
export function AppLayout({ children, navbar, mobileOpened, onMobileToggle }: AppLayoutProps) {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
    >
      {/* ヘッダー */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {/* モバイル用ハンバーガーメニュー */}
            <Burger
              opened={mobileOpened}
              onClick={onMobileToggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="ナビゲーションメニューを開く"
            />
            {/* アプリロゴ */}
            <Group gap="xs">
              <IconCards size={28} stroke={1.5} />
              <Text size="lg" fw={600} visibleFrom="xs">
                Sapphire
              </Text>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      {/* サイドバー */}
      <AppShell.Navbar>{navbar}</AppShell.Navbar>

      {/* メインコンテンツ */}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
