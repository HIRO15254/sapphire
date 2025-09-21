import {
  ActionIcon,
  Burger,
  Group,
  NavLink,
  rem,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { memo } from "react";
import type { NavigationItem } from "../types";

export interface HeaderNavigationProps {
  items: NavigationItem[];
  isMobile: boolean;
  hamburgerOpened: boolean;
  onHamburgerToggle: () => void;
}

/**
 * 【機能概要】: ヘッダーナビゲーションコンポーネント
 * 【実装方針】: モバイル/デスクトップで表示内容を切り替える最小実装
 * 【テスト対応】: TC-001, TC-002のヘッダー表示テストに対応
 * 【パフォーマンス】: React.memo による不要な再レンダリング防止
 * 🟢 信頼性レベル: 設計文書から確認済み
 */
export const HeaderNavigation = memo<HeaderNavigationProps>(
  ({ items, isMobile, hamburgerOpened, onHamburgerToggle }) => {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();

    return (
      <Group h="100%" px="md" justify="space-between">
        {/* 左側: ロゴ + ハンバーガー(モバイル) */}
        <Group>
          {/* 【ハンバーガーメニュー】: モバイル時のみ表示、TC-001テスト対応 🟢 */}
          {isMobile && (
            <Burger
              opened={hamburgerOpened}
              onClick={onHamburgerToggle}
              size="sm"
              aria-label="ナビゲーションメニューを開く"
              style={{
                minHeight: "44px",
                height: "44px",
              }}
            />
          )}

          {/* 【ブランドロゴ】: アプリケーションロゴとタイトル表示 🟢 */}
          <Group gap="xs">
            <Text size="lg" fw={600}>
              アプリ名
            </Text>
          </Group>
        </Group>

        {/* 中央: デスクトップナビゲーション */}
        {/* 【水平ナビゲーション】: デスクトップ時のみ表示、TC-002テスト対応 🟢 */}
        {!isMobile && (
          <Group gap="xs" role="navigation" aria-label="メインナビゲーション">
            {items.map((item) => (
              <NavLink
                key={item.id}
                label={item.label}
                leftSection={item.icon && <item.icon size={rem(16)} />}
                variant="subtle"
                styles={{
                  root: {
                    borderRadius: "var(--mantine-radius-md)",
                    padding: `${rem(8)} ${rem(12)}`,
                  },
                }}
              />
            ))}
          </Group>
        )}

        {/* 右側: テーマ切り替え */}
        {/* 【テーマボタン】: TC-004のテーマ切り替えテスト対応 🟡 */}
        <ActionIcon
          variant="subtle"
          onClick={() => toggleColorScheme()}
          size="lg"
          aria-label="テーマを切り替える"
          style={{
            minHeight: "44px",
            height: "44px",
          }}
        >
          {colorScheme === "dark" ? <IconSun size={rem(18)} /> : <IconMoon size={rem(18)} />}
        </ActionIcon>
      </Group>
    );
  }
);

HeaderNavigation.displayName = "HeaderNavigation";
