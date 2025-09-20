// Mantineベース レスポンシブレイアウト TypeScript型定義

import type {
  MantineTheme,
  MantineColorScheme,
  DrawerProps,
} from '@mantine/core';
import type { TablerIconsProps } from '@tabler/icons-react';

// ===== デバイス情報 =====

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';
export type MantineBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

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

export type NavigationType = 'header' | 'footer' | 'side' | 'hamburger';
export type NavigationStyle = 'primary' | 'secondary' | 'utility';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType<TablerIconsProps>;
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
  role?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
  ariaLabel?: string;
}

export interface NavigationConfig {
  primary: NavigationItem[];    // 主要機能（ヘッダー・フッター）
  secondary: NavigationItem[];  // 補助機能（サイド・ハンバーガー）
  utility: NavigationItem[];    // ユーティリティ（設定・ヘルプ等）
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

// ===== レイアウト状態 =====

export interface LayoutState {
  layoutMode: 'mobile' | 'desktop';
  isTransitioning: boolean;
  previousLayoutMode?: 'mobile' | 'desktop';
  lastResizeTime: number;
  isMenuAnimating: boolean;
}

export interface UIState {
  isLoading: boolean;
  theme: 'light' | 'dark' | 'auto';
  reducedMotion: boolean;
  highContrast: boolean;
  isKeyboardNavigation: boolean;
  lastInteractionType: 'mouse' | 'keyboard' | 'touch';
}

// ===== アプリケーション全体の状態 =====

export interface AppState {
  device: DeviceInfo;
  navigation: NavigationState;
  layout: LayoutState;
  ui: UIState;
}

export type AppAction =
  | { type: 'DEVICE_CHANGE'; payload: Partial<DeviceInfo> }
  | { type: 'NAVIGATION_CHANGE'; payload: { route: string } }
  | { type: 'TOGGLE_HAMBURGER_MENU' }
  | { type: 'CLOSE_HAMBURGER_MENU' }
  | { type: 'TOGGLE_SIDE_MENU' }
  | { type: 'SET_LAYOUT_MODE'; payload: { mode: 'mobile' | 'desktop' } }
  | { type: 'SET_MENU_ANIMATING'; payload: { isAnimating: boolean } }
  | { type: 'SET_FOCUS'; payload: { itemId?: string } }
  | { type: 'SET_THEME'; payload: { theme: 'light' | 'dark' | 'auto' } }
  | { type: 'SET_INTERACTION_TYPE'; payload: { type: 'mouse' | 'keyboard' | 'touch' } };

// ===== Mantineベースコンポーネントプロパティ =====

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  navigationConfig: NavigationConfig;
  theme?: MantineColorScheme;
  primaryColor?: string;
  customTheme?: Partial<MantineTheme>;
}

export interface MobileLayoutProps {
  children: React.ReactNode;
  navigationConfig: NavigationConfig;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
}

export interface DesktopLayoutProps {
  children: React.ReactNode;
  navigationConfig: NavigationConfig;
  isSideMenuCollapsed: boolean;
  onSideMenuToggle: () => void;
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
  variant?: 'default' | 'minimal';
}

export interface SideNavigationProps {
  items: NavigationItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  position?: 'left' | 'right';
  scrollable?: boolean;
}

export interface HamburgerMenuProps extends Partial<DrawerProps> {
  items: NavigationItem[];
  opened: boolean;
  onClose: () => void;
  title?: string;
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

// ===== ナビゲーションプロバイダー =====

export interface NavigationProviderProps {
  children: React.ReactNode;
  config: NavigationConfig;
  initialRoute?: string;
}

export interface NavigationContextValue {
  state: NavigationState;
  navigate: (path: string) => void;
  goBack: () => void;
  goForward: () => void;
  toggleHamburgerMenu: () => void;
  closeHamburgerMenu: () => void;
  toggleSideMenu: () => void;
  setFocus: (itemId?: string) => void;
  getBreadcrumbs: (route: string) => NavigationItem[];
}

// ===== アニメーション =====

export interface AnimationConfig {
  duration: {
    fast: number;    // 150ms
    normal: number;  // 300ms
    slow: number;    // 500ms
  };
  easing: {
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
  scale: {
    enter: number;
    exit: number;
  };
}

export interface TransitionState {
  isEntering: boolean;
  isExiting: boolean;
  hasEntered: boolean;
  hasExited: boolean;
}

// ===== アクセシビリティ =====

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean;
  'role'?: string;
  'tabIndex'?: number;
}

export interface FocusManagement {
  trapFocus: boolean;
  restoreFocus: boolean;
  initialFocus?: string;
  finalFocus?: string;
}

export interface KeyboardNavigation {
  enableArrowKeys: boolean;
  enableHomeEnd: boolean;
  enableEscape: boolean;
  enableEnterSpace: boolean;
}

// ===== CSS-in-JS スタイル =====

export interface StyleProps {
  theme: 'light' | 'dark';
  device: DeviceType;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface ComponentStyles {
  container: React.CSSProperties;
  header: React.CSSProperties;
  nav: React.CSSProperties;
  main: React.CSSProperties;
  footer: React.CSSProperties;
  overlay: React.CSSProperties;
}

// ===== ユーティリティ型 =====

export type OptionalNavigationItem = Partial<NavigationItem> & Pick<NavigationItem, 'id' | 'label' | 'path'>;

export type ResponsiveBreakpoint<T> = {
  [K in BreakpointName]?: T;
};

export type ConditionalProps<T, U> = T extends true ? U : {};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ===== イベントハンドラー =====

export interface NavigationEventHandlers {
  onNavigate?: (path: string, item: NavigationItem) => void;
  onMenuOpen?: (menuType: NavigationType) => void;
  onMenuClose?: (menuType: NavigationType) => void;
  onLayoutChange?: (newLayout: 'mobile' | 'desktop', oldLayout?: 'mobile' | 'desktop') => void;
  onBreakpointChange?: (newBreakpoint: BreakpointName, oldBreakpoint?: BreakpointName) => void;
  onOrientationChange?: (orientation: Orientation) => void;
  onFocusChange?: (itemId?: string) => void;
}

// ===== API レスポンス型（将来の拡張用） =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

export interface NavigationApiResponse extends ApiResponse<NavigationConfig> {}

// ===== テスト用ヘルパー型 =====

export interface TestUtils {
  mockDeviceInfo: (overrides?: Partial<DeviceInfo>) => DeviceInfo;
  mockNavigationItem: (overrides?: Partial<NavigationItem>) => NavigationItem;
  mockAppState: (overrides?: Partial<AppState>) => AppState;
}

// ===== 設定ファイル型 =====

export interface ResponsiveConfig {
  breakpoints: BreakpointConfig;
  animations: AnimationConfig;
  accessibility: {
    enableFocusManagement: boolean;
    enableKeyboardNavigation: boolean;
    announceRouteChanges: boolean;
  };
  performance: {
    debounceResizeMs: number;
    enableVirtualization: boolean;
    lazyLoadThreshold: number;
  };
}

// ===== Mantineデフォルト設定 =====

export const DEFAULT_MANTINE_BREAKPOINTS: MantineBreakpointConfig = {
  xs: '36em',  // 576px
  sm: '48em',  // 768px
  md: '62em',  // 992px
  lg: '75em',  // 1200px
  xl: '88em',  // 1408px
};

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
    easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  },
  scale: {
    enter: 0.95,
    exit: 1.05,
  },
};
