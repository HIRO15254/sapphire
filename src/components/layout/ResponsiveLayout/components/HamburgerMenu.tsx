import { Badge, Drawer, NavLink, rem, ScrollArea, Stack, Text } from "@mantine/core";
import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import type { NavigationItem } from "../types";

// 【定数定義】: レイアウトとスタイル定数
const HAMBURGER_MENU_CONSTANTS = {
  DRAWER_SIZE: "300px",
  MAX_WIDTH: rem(320),
  MAX_SCROLL_HEIGHT: "calc(100vh - 60px)",
  ICON_SIZE: 16,
  ICON_STROKE: 1.5,
  NAV_MIN_HEIGHT: "44px",
  NAV_PADDING: `${rem(12)} ${rem(16)}`,
} as const;

export interface HamburgerMenuProps {
  items: NavigationItem[];
  groupedItems: Record<string, NavigationItem[]>;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

// 【内部コンポーネント】: ナビゲーション項目の共通表示コンポーネント
interface NavigationItemComponentProps {
  item: NavigationItem;
  onClose: () => void;
}

const NavigationItemComponent = memo<NavigationItemComponentProps>(({ item, onClose }) => {
  const navLinkStyles = useMemo(
    () => ({
      root: {
        minHeight: HAMBURGER_MENU_CONSTANTS.NAV_MIN_HEIGHT,
        padding: HAMBURGER_MENU_CONSTANTS.NAV_PADDING,
      },
    }),
    []
  );

  return (
    <NavLink
      key={item.id}
      component={Link}
      to={item.path}
      label={item.label}
      leftSection={
        item.icon ? (
          <item.icon
            size={HAMBURGER_MENU_CONSTANTS.ICON_SIZE}
            stroke={HAMBURGER_MENU_CONSTANTS.ICON_STROKE}
          />
        ) : undefined
      }
      rightSection={item.badge ? <Badge>{item.badge}</Badge> : undefined}
      variant="subtle"
      onClick={onClose}
      styles={navLinkStyles}
    />
  );
});

NavigationItemComponent.displayName = "NavigationItemComponent";

/**
 * 【機能概要】: モバイル専用ハンバーガーメニューコンポーネント - TDD Refactor フェーズ
 * 【実装状況】: パフォーマンス最適化とコード品質向上を実施
 * 【対象画面】: 768px未満のモバイル環境
 * 【要件対応】: REQ-003, REQ-104, REQ-201, REQ-401, REQ-402, NFR-002
 * 🟢 テスト成功期待: 全18テストケースが成功することを確認
 * 🔄 Refactor改善: 定数化、コード重複解消、パフォーマンス最適化
 */
export const HamburgerMenu = memo<HamburgerMenuProps>(
  ({
    items: _items, // 将来的にitemsから直接groupedItemsを生成する可能性のため保持
    groupedItems,
    isOpen,
    onClose,
    onToggle: _onToggle, // 将来的なトグル機能拡張のため保持
  }: HamburgerMenuProps) => {
    // 【パフォーマンス最適化】: Drawerスタイルをメモ化
    const drawerStyles = useMemo(
      () => ({
        content: {
          maxWidth: HAMBURGER_MENU_CONSTANTS.MAX_WIDTH,
        },
      }),
      []
    );

    // 【パフォーマンス最適化】: ScrollAreaスタイルをメモ化
    // コンテンツに応じた高さで、最大値を制限
    const scrollAreaStyle = useMemo(
      () => ({
        maxHeight: HAMBURGER_MENU_CONSTANTS.MAX_SCROLL_HEIGHT,
      }),
      []
    );

    // 【パフォーマンス最適化】: グループ化項目の描画をメモ化
    const renderedGroups = useMemo(() => {
      if (!groupedItems || typeof groupedItems !== "object") {
        return [];
      }
      return Object.entries(groupedItems).map(([groupName, groupItems]) =>
        groupName === "default" ? (
          // デフォルトグループ: ラベルなし
          <div key={groupName}>
            {groupItems.map((item) => (
              <NavigationItemComponent key={item.id} item={item} onClose={onClose} />
            ))}
          </div>
        ) : (
          // ラベル付きグループ
          <div key={groupName}>
            <Text id={`group-${groupName}`} size="xs" fw={600} c="dimmed" px="md" py="xs">
              {groupName}
            </Text>
            {groupItems.map((item) => (
              <NavigationItemComponent key={item.id} item={item} onClose={onClose} />
            ))}
          </div>
        )
      );
    }, [groupedItems, onClose]);

    return (
      <Drawer
        opened={isOpen}
        onClose={onClose}
        position="left"
        size={HAMBURGER_MENU_CONSTANTS.DRAWER_SIZE}
        withOverlay
        trapFocus
        closeOnEscape
        closeOnClickOutside
        title="ナビゲーションメニュー"
        styles={drawerStyles}
      >
        <ScrollArea style={scrollAreaStyle} data-testid="scroll-area" type="auto">
          <Stack gap="md">{renderedGroups}</Stack>
        </ScrollArea>
      </Drawer>
    );
  }
);

HamburgerMenu.displayName = "HamburgerMenu";
