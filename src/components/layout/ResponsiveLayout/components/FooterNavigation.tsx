import { Box, Center, Group, rem, Text, UnstyledButton } from "@mantine/core";
import { memo } from "react";
import type { NavigationItem } from "../types";

export interface FooterNavigationProps {
  items: NavigationItem[];
}

/**
 * 【機能概要】: フッターナビゲーションコンポーネント
 * 【実装方針】: モバイル時のみ表示するタブバー形式ナビゲーション
 * 【テスト対応】: TC-001のフッター表示テストに対応
 * 【パフォーマンス】: React.memo による不要な再レンダリング防止
 * 🟢 信頼性レベル: 設計文書から確認済み
 */
export const FooterNavigation = memo<FooterNavigationProps>(({ items }) => {
  return (
    <Group
      justify="space-around"
      h="100%"
      px="sm"
      style={{
        borderTop: "1px solid var(--mantine-color-gray-3)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* 【フッターナビゲーション】: モバイル時のタブバー表示、TC-001テスト対応 🟢 */}
      {items.slice(0, 5).map((item) => (
        <UnstyledButton
          key={item.id}
          style={{
            flex: 1,
            padding: rem(8),
            borderRadius: "var(--mantine-radius-md)",
            transition: "all 150ms ease",
            minHeight: "44px", // タップ領域確保（NFR-201準拠）
            height: "44px", // 高さも明示的に指定
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
          aria-label={item.label}
        >
          <Center>
            <Box>
              {item.icon && (
                <Center mb="xs">
                  <item.icon size={rem(20)} stroke={1.5} />
                </Center>
              )}
              <Text size="xs" ta="center" fw={400}>
                {item.label}
              </Text>
            </Box>
          </Center>
        </UnstyledButton>
      ))}
    </Group>
  );
});

FooterNavigation.displayName = "FooterNavigation";
