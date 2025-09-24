import { createTheme, rem } from "@mantine/core";

export const appTheme = createTheme({
  /** カラーパレット - Mantine公式カラースキーム使用 */
  primaryColor: "blue",

  /** フォント設定 */
  fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Sans JP", sans-serif',
  fontFamilyMonospace: 'ui-monospace, "SF Mono", "Monaco", "Consolas", monospace',

  headings: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Sans JP", sans-serif',
    fontWeight: "600",
    textWrap: "balance",
  },

  /** レスポンシブブレークポイント */
  breakpoints: {
    xs: "36em", // 576px
    sm: "48em", // 768px (メインブレークポイント)
    md: "62em", // 992px
    lg: "75em", // 1200px
    xl: "88em", // 1408px
  },

  /** スペーシングシステム */
  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
    xxl: rem(48),
  },

  /** 角丸設定 */
  defaultRadius: "md",
  radius: {
    xs: rem(2),
    sm: rem(4),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
  },

  /** シャドウ設定 */
  shadows: {
    xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },

  /** アクセシビリティ設定 */
  focusRing: "always",
  cursorType: "pointer",
  activeClassName: "mantine-active",

  /** その他設定 */
  respectReducedMotion: true,
  autoContrast: true,

  /** カスタム値 */
  other: {
    // レイアウト固有の値
    headerHeight: {
      mobile: rem(56),
      desktop: rem(64),
    },
    footerHeight: rem(80),
    sidebarWidth: {
      expanded: rem(280),
      collapsed: rem(80),
    },

    // タップエリア
    tapTargetSize: rem(44),

    // アニメーション
    transitionDuration: {
      fast: "150ms",
      normal: "200ms",
      slow: "300ms",
    },

    // z-index
    zIndex: {
      header: 100,
      sidebar: 90,
      footer: 100,
      hamburger: 110,
      overlay: 105,
      modal: 120,
      tooltip: 130,
    },
  },
});

export type AppTheme = typeof appTheme;
