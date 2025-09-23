// Re-export enhanced types for backward compatibility

export type { UseResponsiveLayoutReturn } from "./hooks/useResponsiveLayout";
export type {
  BaseComponentProps,
  FooterNavigationProps,
  HamburgerMenuProps,
  HeaderNavigationProps,
  NavigationItemStyles,
  NavigationItemVariant,
  SideNavigationProps,
} from "./types/ComponentTypes";
export type {
  GroupedNavigationItems,
  NavigationConfig,
  NavigationItem,
  NavigationValidationResult,
  SafeNavigationConfig,
} from "./types/NavigationTypes";
export type {
  BreakpointConfig,
  LayoutConfiguration,
  ResponsiveLayoutContext,
  ResponsiveLayoutProps,
  ResponsiveLayoutState,
  ThemeMode,
} from "./types/ResponsiveLayoutTypes";
