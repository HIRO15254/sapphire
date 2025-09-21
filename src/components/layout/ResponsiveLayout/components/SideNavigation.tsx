import { NavLink, rem, Stack, Text } from "@mantine/core";
import { memo } from "react";
import type { NavigationItem } from "../types";

export interface SideNavigationProps {
  items: NavigationItem[];
  groupedItems: Record<string, NavigationItem[]>;
}

/**
 * 【機能概要】: サイドナビゲーションコンポーネント
 * 【実装方針】: デスクトップ時のみ表示する垂直ナビゲーション
 * 【テスト対応】: TC-002のサイドバー表示テストに対応
 * 【パフォーマンス】: React.memo による不要な再レンダリング防止
 * 🟢 信頼性レベル: 設計文書から確認済み
 */
export const SideNavigation = memo<SideNavigationProps>(({ groupedItems }) => {
  return (
    <Stack h="100%" gap={0} role="navigation" aria-label="サイドナビゲーション">
      <Stack gap="xs" p="md">
        {/* 【グループ別表示】: グループ化されたナビゲーション項目を表示 🟢 */}
        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
          <div key={groupName}>
            {/* 【グループタイトル】: TC-003のグループ化テスト対応 🟢 */}
            {groupName !== "default" && (
              <Text size="xs" tt="uppercase" fw={700} c="dimmed" pl="sm" pb="xs">
                {groupName}
              </Text>
            )}

            <Stack gap="xs">
              {groupItems.map((item) => (
                <NavLink
                  key={item.id}
                  label={item.label}
                  leftSection={item.icon && <item.icon size={rem(16)} stroke={1.5} />}
                  variant="subtle"
                />
              ))}
            </Stack>
          </div>
        ))}
      </Stack>
    </Stack>
  );
});

SideNavigation.displayName = "SideNavigation";
