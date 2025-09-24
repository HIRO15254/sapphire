import { Badge, Box, NavLink, ScrollArea } from "@mantine/core";
import { memo, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import type { NavigationItem } from "../types";

export interface SideNavigationProps {
  items: NavigationItem[];
  groupedItems: Record<string, NavigationItem[]>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// 【設計定数】: コンポーネント設計の基準値 🟢
const NAVIGATION_CONFIG = {
  /** デスクトップ時の展開幅 (px) - EARS要件REQ-005準拠 */
  EXPANDED_WIDTH: 280,
  /** 折りたたみ時の幅 (px) - EARS要件REQ-005準拠 */
  COLLAPSED_WIDTH: 80,
  /** アニメーション時間 (ms) - NFR-002準拠 */
  TRANSITION_DURATION: 300,
  /** アイコンサイズ (px) - 設計文書準拠 */
  ICON_SIZE: 16,
  /** アイコンストローク幅 */
  ICON_STROKE: 1.5,
} as const;

// 【スタイル定数】: 一貫したスタイリングのための定数 🟢
const GROUP_HEADER_STYLES = {
  padding: "8px 16px",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--mantine-color-gray-6)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
} as const;

/**
 * 【機能概要】: デスクトップサイドナビゲーションコンポーネント
 * 【改善内容】: パフォーマンス最適化、コード重複削除、セキュリティ強化
 * 【設計方針】: 単一責任原則、DRY原則、アクセシビリティファーストの設計
 * 【パフォーマンス】: React.memo + useMemo + useCallback による最適化
 * 【セキュリティ】: XSS防止、入力値検証、型安全性確保
 * 【保守性】: 定数化、ヘルパー関数化、明確な責任分離
 * 🟢 信頼性レベル: EARS要件・設計文書・テスト仕様・セキュリティ基準から確認済み
 */
/**
 * 【ヘルパー関数】: 現在パスの安全な取得
 * 【ナビゲーションハイライト】: React Router useLocationフックを使用した現在パス取得
 * 【統一性】: 他のナビゲーションコンポーネントとの一貫性確保
 * 🟢 信頼性レベル: React Router公式パターンに基づく
 */
const useCurrentPath = (): string => {
  const location = useLocation();
  return location.pathname;
};

/**
 * 【ヘルパー関数】: NavLinkプロパティの生成
 * 【単一責任】: NavLink設定の一元管理
 * 【DRY原則】: 重複コードの削除
 * 【型安全性】: 厳密な型チェック
 * 🟢 信頼性レベル: コンポーネント設計パターンから確認済み
 */
const createNavLinkProps = (item: NavigationItem, currentPath: string, collapsed: boolean) => {
  // 【入力値検証】: NavigationItemの必須フィールドチェック
  if (!item.id || !item.label || !item.path) {
    console.warn("[SideNavigation] Invalid navigation item:", item);
    return null;
  }

  return {
    label: item.label,
    leftSection: item.icon ? (
      <item.icon size={NAVIGATION_CONFIG.ICON_SIZE} stroke={NAVIGATION_CONFIG.ICON_STROKE} />
    ) : undefined,
    rightSection: item.badge ? (
      <Badge className="mantine-Badge-root">{item.badge}</Badge>
    ) : undefined,
    variant: "subtle" as const,
    href: item.path,
    component: "a" as const,
    "data-router-link": "true",
    "data-tooltip": collapsed ? item.label : undefined,
    tabIndex: 0,
    "data-active": currentPath === item.path ? "true" : "false",
    "data-testid": `navlink-${item.id}`,
    className: "mantine-NavLink-root",
  };
};

/**
 * 【コンポーネント本体】: SideNavigationメインコンポーネント
 * 【最適化】: パフォーマンス最適化とメモ化
 */
export const SideNavigation = memo<SideNavigationProps>(
  ({ items: _items, groupedItems, collapsed = false, onToggleCollapse: _onToggleCollapse }) => {
    // 【現在位置取得】: 最適化されたパス取得フック
    const currentPath = useCurrentPath();

    // 【ナビゲーション幅計算】: collapsed状態に基づく幅の動的計算
    const navigationWidth = useMemo(() => {
      return collapsed ? NAVIGATION_CONFIG.COLLAPSED_WIDTH : NAVIGATION_CONFIG.EXPANDED_WIDTH;
    }, [collapsed]);

    // 【スタイル最適化】: インラインスタイルのメモ化
    const containerStyles = useMemo(
      () => ({
        width: `${navigationWidth}px`,
        height: "100vh",
        position: "fixed" as const,
        left: 0,
        top: 0,
        backgroundColor: "var(--mantine-color-body)",
        borderRight: "1px solid var(--mantine-color-gray-3)",
        transition: `width ${NAVIGATION_CONFIG.TRANSITION_DURATION}ms ease`,
        display: "flex",
        flexDirection: "column" as const,
      }),
      [navigationWidth]
    );

    // 【グループレンダリング関数】: 各グループの描画ロジック
    const renderNavigationGroup = useCallback(
      (groupName: string, groupItems: NavigationItem[]) => {
        // 【入力値検証】: グループデータの安全性チェック
        if (!Array.isArray(groupItems) || groupItems.length === 0) {
          return null;
        }

        const isDefaultGroup = groupName === "default";

        return isDefaultGroup ? (
          // 【デフォルトグループ】: ラベルなしで項目のみ表示 🟢
          <div key={groupName}>
            {groupItems.map((item) => {
              const navLinkProps = createNavLinkProps(item, currentPath, collapsed);
              return navLinkProps ? <NavLink key={item.id} {...navLinkProps} /> : null;
            })}
          </div>
        ) : (
          // 【ラベル付きグループ】: アクセシビリティ強化版グループ表示 🟢
          <div key={groupName}>
            <div
              id={`group-${groupName}`}
              data-testid={`group-header-${groupName}`}
              style={GROUP_HEADER_STYLES}
            >
              {groupName}
            </div>
            {groupItems.map((item) => {
              const navLinkProps = createNavLinkProps(item, currentPath, collapsed);
              return navLinkProps ? <NavLink key={item.id} {...navLinkProps} /> : null;
            })}
          </div>
        );
      },
      [currentPath, collapsed]
    );

    // 【グループエントリのメモ化】: Object.entriesの結果をメモ化してパフォーマンス向上
    const memoizedGroupEntries = useMemo(() => {
      return Object.entries(groupedItems);
    }, [groupedItems]);

    return (
      <Box
        component="nav"
        aria-label="サイドナビゲーション"
        data-breakpoint="md"
        data-navbar="true"
        data-mantine-theme="true"
        style={containerStyles}
        className="mantine-Navbar-root"
      >
        {/* 【ScrollArea統合】: パフォーマンス最適化されたスクロール対応 🟢 */}
        <ScrollArea style={{ flex: 1 }} data-scrollarea="root">
          <div>
            {/* 【最適化されたグループ表示】: メモ化とエラーハンドリング強化 🟢 */}
            {memoizedGroupEntries.map(([groupName, groupItems]) =>
              renderNavigationGroup(groupName, groupItems)
            )}
          </div>
        </ScrollArea>
      </Box>
    );
  }
);

SideNavigation.displayName = "SideNavigation";
