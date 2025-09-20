// Mantineベース レスポンシブレイアウト TypeScript型定義

import type { DrawerProps, MantineColorScheme, MantineTheme } from "@mantine/core";
import type { Icon } from "@tabler/icons-react";

// ===== デバイス情報 =====

export type DeviceType = "mobile" | "tablet" | "desktop";
export type Orientation = "portrait" | "landscape";
export type MantineBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";

export interface DeviceInfo {
  screenWidth: number;
  screenHeight: number;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: Orientation;
  breakpoint: MantineBreakpoint;
  pixelRatio: number;
  isTouch: boolean;
}

// Mantineブレークポイント設定（em単位）
export interface MantineBreakpointConfig {
  xs: string; // '36em' - 576px
  sm: string; // '48em' - 768px
  md: string; // '62em' - 992px
  lg: string; // '75em' - 1200px
  xl: string; // '88em' - 1408px
}

// ===== ナビゲーション =====

export type NavigationType = "header" | "footer" | "side" | "hamburger";
export type NavigationStyle = "primary" | "secondary" | "utility";

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: Icon;
  type: NavigationStyle;
  group?: string; // グループ名（サイドバー・ハンバーガーメニューで使用）
  description?: string; // ハンバーガーメニューでの説明文
  badge?: string | number; // 通知バッジ
  hasNotification?: boolean; // 通知ドット表示
  isActive?: boolean;
  isDisabled?: boolean;
  children?: NavigationItem[];
  order: number;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
  role?: "menuitem" | "menuitemcheckbox" | "menuitemradio";
  ariaLabel?: string;
}

export interface NavigationConfig {
  primary: NavigationItem[]; // 主要機能（ヘッダー・フッター）
  secondary: NavigationItem[]; // 補助機能（サイド・ハンバーガー）
  utility: NavigationItem[]; // ユーティリティ（設定・ヘルプ等）
}

export interface NavigationState {
  currentRoute: string;
  previousRoute?: string;
  isHamburgerMenuOpen: boolean;
  isSideMenuCollapsed: boolean;
  focusedItemId?: string;
  breadcrumbs: NavigationItem[];
  history: string[];
}

// ===== Mantineフック・プロバイダー =====

export interface ResponsiveHookReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: MantineBreakpoint;
  device: DeviceInfo;
}

export interface AppThemeHookReturn {
  colorScheme: MantineColorScheme;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: MantineColorScheme) => void;
}

export interface AppNavigationHookReturn {
  hamburgerOpened: boolean;
  toggleHamburger: () => void;
  closeHamburger: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

// ===== Mantineベースコンポーネントプロパティ =====

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  navigationConfig: NavigationConfig;
  theme?: MantineColorScheme;
  primaryColor?: string;
  customTheme?: Partial<MantineTheme>;
}

export interface HeaderNavigationProps {
  items: NavigationItem[];
  isMobile: boolean;
  hamburgerOpened: boolean;
  onHamburgerToggle: () => void;
  maxItems?: number;
  showThemeToggle?: boolean;
}

export interface FooterNavigationProps {
  items: NavigationItem[];
  maxItems?: number;
  variant?: "default" | "minimal";
}

export interface SideNavigationProps {
  items: NavigationItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  position?: "left" | "right";
  scrollable?: boolean;
}

export interface HamburgerMenuProps extends Partial<DrawerProps> {
  items: NavigationItem[];
  opened: boolean;
  onClose: () => void;
  title?: string;
}

// ===== Mantineデフォルト設定 =====

export const DEFAULT_MANTINE_BREAKPOINTS: MantineBreakpointConfig = {
  xs: "36em", // 576px
  sm: "48em", // 768px
  md: "62em", // 992px
  lg: "75em", // 1200px
  xl: "88em", // 1408px
};
