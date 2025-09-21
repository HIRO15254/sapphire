import { Drawer, NavLink, rem, Stack, Text } from "@mantine/core";
import { memo } from "react";
import type { NavigationItem } from "../types";

export interface HamburgerMenuProps {
  items: NavigationItem[];
  opened: boolean;
  onClose: () => void;
}

/**
 * 【機能概要】: ハンバーガーメニュー（Drawer）コンポーネント
 * 【実装方針】: モバイル時のスライドメニュー表示
 * 【テスト対応】: TC-001のモバイルメニューテストに対応
 * 【パフォーマンス】: React.memo による不要な再レンダリング防止
 * 🟡 信頼性レベル: 設計文書から推測
 */
export const HamburgerMenu = memo<HamburgerMenuProps>(({ items, opened, onClose }) => {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="left"
      size="85%"
      styles={{
        content: {
          maxWidth: rem(320),
        },
      }}
      title={
        <Text size="lg" fw={600}>
          メニュー
        </Text>
      }
      closeButtonProps={{
        "aria-label": "メニューを閉じる",
      }}
    >
      {/* 【ドロワーナビゲーション】: モバイル時のスライドメニュー内容 🟡 */}
      <Stack gap="md">
        {items.map((item) => (
          <NavLink
            key={item.id}
            label={item.label}
            leftSection={item.icon && <item.icon size={rem(20)} stroke={1.5} />}
            variant="subtle"
            styles={{
              root: {
                borderRadius: "var(--mantine-radius-md)",
                padding: `${rem(12)} ${rem(16)}`,
                minHeight: "44px", // タップ領域確保 - px指定
                height: "44px", // 高さも明示的に指定
              },
            }}
          />
        ))}
      </Stack>
    </Drawer>
  );
});

HamburgerMenu.displayName = "HamburgerMenu";
