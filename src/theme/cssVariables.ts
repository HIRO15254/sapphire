import type { CSSVariablesResolver } from "@mantine/core";

// CSS変数として出力する値
export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {
    // レイアウト関連
    "--app-header-height-mobile": theme.other.headerHeight.mobile,
    "--app-header-height-desktop": theme.other.headerHeight.desktop,
    "--app-footer-height": theme.other.footerHeight,
    "--app-sidebar-width-expanded": theme.other.sidebarWidth.expanded,
    "--app-sidebar-width-collapsed": theme.other.sidebarWidth.collapsed,

    // タップエリア
    "--app-tap-target-size": theme.other.tapTargetSize,

    // z-index
    "--app-z-header": theme.other.zIndex.header.toString(),
    "--app-z-footer": theme.other.zIndex.footer.toString(),
    "--app-z-sidebar": theme.other.zIndex.sidebar.toString(),
    "--app-z-hamburger": theme.other.zIndex.hamburger.toString(),
    "--app-z-overlay": theme.other.zIndex.overlay.toString(),

    // アニメーション
    "--app-transition-fast": theme.other.transitionDuration.fast,
    "--app-transition-normal": theme.other.transitionDuration.normal,
    "--app-transition-slow": theme.other.transitionDuration.slow,

    // セーフエリア
    "--app-safe-area-top": "env(safe-area-inset-top)",
    "--app-safe-area-bottom": "env(safe-area-inset-bottom)",
    "--app-safe-area-left": "env(safe-area-inset-left)",
    "--app-safe-area-right": "env(safe-area-inset-right)",
  },

  light: {
    // ライトテーマ専用変数
    "--app-bg-primary": theme.white,
    "--app-bg-secondary": theme.colors.gray[0],
    "--app-bg-tertiary": theme.colors.gray[1],
    "--app-text-primary": theme.colors.gray[9],
    "--app-text-secondary": theme.colors.gray[6],
    "--app-border-color": theme.colors.gray[3],
  },

  dark: {
    // ダークテーマ専用変数
    "--app-bg-primary": theme.colors.dark[7],
    "--app-bg-secondary": theme.colors.dark[8],
    "--app-bg-tertiary": theme.colors.dark[6],
    "--app-text-primary": theme.white,
    "--app-text-secondary": theme.colors.gray[4],
    "--app-border-color": theme.colors.dark[4],
  },
});
