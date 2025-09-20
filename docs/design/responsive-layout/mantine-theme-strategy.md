# Mantineテーマ・スタイリング戦略

## Mantineテーマシステム概要

Mantineでは、CSSの代わりにJavaScriptベースのテーマシステムを使用してスタイリングを管理します。これにより、型安全性とコンポーネントとの密結合が実現されます。

## テーマ構成ファイル

### 1. メインテーマ設定 (`src/theme/index.ts`)

```typescript
import { createTheme, MantineColorsTuple, rem, rgba } from '@mantine/core';

// カスタムカラーパレット
const primaryColor: MantineColorsTuple = [
  '#e3f2fd',
  '#bbdefb',
  '#90caf9',
  '#64b5f6',
  '#42a5f5',
  '#2196f3', // メインカラー
  '#1e88e5',
  '#1976d2',
  '#1565c0',
  '#0d47a1'
];

const grayColor: MantineColorsTuple = [
  '#f8f9fa',
  '#f1f3f4',
  '#e8eaed',
  '#dadce0',
  '#bdc1c6',
  '#9aa0a6',
  '#80868b',
  '#5f6368',
  '#3c4043',
  '#202124'
];

export const appTheme = createTheme({
  /** カラーパレット */
  primaryColor: 'primary',
  colors: {
    primary: primaryColor,
    gray: grayColor,
  },

  /** フォント設定 */
  fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Sans JP", sans-serif',
  fontFamilyMonospace: 'ui-monospace, "SF Mono", "Monaco", "Consolas", monospace',

  headings: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Sans JP", sans-serif',
    fontWeight: '600',
    textWrap: 'balance',
  },

  /** レスポンシブブレークポイント */
  breakpoints: {
    xs: '36em',  // 576px
    sm: '48em',  // 768px (メインブレークポイント)
    md: '62em',  // 992px
    lg: '75em',  // 1200px
    xl: '88em',  // 1408px
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
  defaultRadius: 'md',
  radius: {
    xs: rem(2),
    sm: rem(4),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
  },

  /** シャドウ設定 */
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  /** アクセシビリティ設定 */
  focusRing: 'auto',
  cursorType: 'pointer',
  activeClassName: 'mantine-active',

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
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
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

  /** コンポーネント固有設定 */
  components: {
    // AppShell設定
    AppShell: AppShell.extend({
      defaultProps: {
        transitionDuration: 200,
        transitionTimingFunction: 'ease-out',
      },
      styles: {
        main: {
          minHeight: '100vh',
        },
      },
    }),

    // NavLink設定
    NavLink: NavLink.extend({
      defaultProps: {
        variant: 'subtle',
      },
      styles: (theme, props) => ({
        root: {
          borderRadius: theme.radius.md,
          transition: `all ${theme.other.transitionDuration.fast} ease`,

          '&[data-active]': {
            backgroundColor: rgba(theme.colors.primary[6], 0.1),
            color: theme.colors.primary[6],
            fontWeight: 500,
          },

          '&:hover:not([data-active])': {
            backgroundColor: theme.colorScheme === 'dark'
              ? theme.colors.dark[6]
              : theme.colors.gray[0],
          },
        },

        label: {
          fontSize: rem(14),
        },
      }),
    }),

    // Button設定
    Button: Button.extend({
      defaultProps: {
        variant: 'filled',
      },
      styles: {
        root: {
          minHeight: rem(44), // タップエリア確保
        },
      },
    }),

    // ActionIcon設定
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        variant: 'subtle',
        size: 'lg',
      },
      styles: {
        root: {
          minWidth: rem(44),
          minHeight: rem(44), // タップエリア確保
        },
      },
    }),

    // Drawer設定
    Drawer: Drawer.extend({
      defaultProps: {
        transitionProps: {
          transition: 'slide-right',
          duration: 200,
          timingFunction: 'ease-out',
        },
        overlayProps: {
          backgroundOpacity: 0.5,
          blur: 3,
        },
        trapFocus: true,
        returnFocus: true,
      },
      styles: {
        content: {
          maxWidth: rem(320),
        },
      },
    }),

    // Text設定
    Text: Text.extend({
      styles: {
        root: {
          lineHeight: 1.6,
        },
      },
    }),

    // Paper設定
    Paper: Paper.extend({
      defaultProps: {
        p: 'md',
        shadow: 'sm',
        radius: 'md',
      },
    }),

    // Container設定
    Container: Container.extend({
      defaultProps: {
        size: 'xl',
      },
      styles: {
        root: {
          paddingLeft: 'var(--mantine-spacing-md)',
          paddingRight: 'var(--mantine-spacing-md)',
        },
      },
    }),
  },
});

export type AppTheme = typeof appTheme;
```

### 2. ダークテーマ対応 (`src/theme/colors.ts`)

```typescript
import { MantineColorsTuple } from '@mantine/core';

// ライトテーマカラー
export const lightColors = {
  primary: [
    '#e3f2fd',
    '#bbdefb',
    '#90caf9',
    '#64b5f6',
    '#42a5f5',
    '#2196f3',
    '#1e88e5',
    '#1976d2',
    '#1565c0',
    '#0d47a1'
  ] as MantineColorsTuple,

  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    tertiary: '#e9ecef',
  },

  text: {
    primary: '#212529',
    secondary: '#6c757d',
    muted: '#868e96',
  },

  border: '#e9ecef',
};

// ダークテーマカラー
export const darkColors = {
  primary: [
    '#0d47a1',
    '#1565c0',
    '#1976d2',
    '#1e88e5',
    '#2196f3',
    '#42a5f5',
    '#64b5f6',
    '#90caf9',
    '#bbdefb',
    '#e3f2fd'
  ] as MantineColorsTuple,

  background: {
    primary: '#1a1a1a',
    secondary: '#2d2d2d',
    tertiary: '#404040',
  },

  text: {
    primary: '#ffffff',
    secondary: '#cccccc',
    muted: '#999999',
  },

  border: '#404040',
};

// テーマ切り替え用ヘルパー
export const getThemeColors = (colorScheme: 'light' | 'dark') => {
  return colorScheme === 'dark' ? darkColors : lightColors;
};
```

### 3. レスポンシブユーティリティ (`src/theme/responsive.ts`)

```typescript
import { MantineBreakpoint } from '@mantine/core';

// メディアクエリヘルパー
export const createMediaQuery = (breakpoint: string) => `(max-width: ${breakpoint})`;

// レスポンシブスタイルヘルパー
export const responsiveStyles = {
  mobileOnly: createMediaQuery('48em'),
  tabletUp: '(min-width: 48em)',
  desktopUp: '(min-width: 62em)',
  largeUp: '(min-width: 75em)',
};

// ブレークポイント値（px）
export const breakpointValues = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1408,
} as const;

// レスポンシブプロパティ型
export type ResponsiveSize<T> = T | { [K in MantineBreakpoint]?: T };

// レスポンシブユーティリティ関数
export const responsive = {
  // 値がブレークポイントより小さい場合の値を取得
  getValueForBreakpoint: <T>(
    value: ResponsiveSize<T>,
    breakpoint: MantineBreakpoint,
    fallback: T
  ): T => {
    if (typeof value === 'object' && value !== null) {
      return value[breakpoint] ?? fallback;
    }
    return value ?? fallback;
  },

  // モバイルかどうかの判定
  isMobile: (width: number): boolean => width <= breakpointValues.sm,

  // タブレットかどうかの判定
  isTablet: (width: number): boolean =>
    width > breakpointValues.sm && width <= breakpointValues.md,

  // デスクトップかどうかの判定
  isDesktop: (width: number): boolean => width > breakpointValues.md,
};
```

### 4. コンポーネント固有スタイル (`src/theme/components.ts`)

```typescript
import { createTheme, rem, rgba } from '@mantine/core';

// レイアウトコンポーネント専用スタイル
export const layoutComponentStyles = {
  // ヘッダーナビゲーション
  HeaderNavigation: {
    styles: (theme: any) => ({
      root: {
        borderBottom: `1px solid ${theme.colors.gray[3]}`,
        backgroundColor: theme.colorScheme === 'dark'
          ? theme.colors.dark[7]
          : theme.white,
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: theme.other.zIndex.header,
      },

      brand: {
        fontWeight: 600,
        fontSize: rem(18),
        color: theme.colorScheme === 'dark'
          ? theme.white
          : theme.colors.gray[8],
      },

      navGroup: {
        gap: rem(4),

        '@media (max-width: 48em)': {
          display: 'none',
        },
      },
    }),
  },

  // フッターナビゲーション
  FooterNavigation: {
    styles: (theme: any) => ({
      root: {
        borderTop: `1px solid ${theme.colors.gray[3]}`,
        backgroundColor: theme.colorScheme === 'dark'
          ? theme.colors.dark[7]
          : theme.white,
        paddingBottom: 'env(safe-area-inset-bottom)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.other.zIndex.footer,

        '@media (min-width: 48em)': {
          display: 'none',
        },
      },

      navButton: {
        flex: 1,
        padding: rem(8),
        minHeight: theme.other.tapTargetSize,
        borderRadius: theme.radius.md,
        transition: `all ${theme.other.transitionDuration.fast} ease`,

        '&[data-active="true"]': {
          backgroundColor: rgba(theme.colors.primary[6], 0.1),
          color: theme.colors.primary[6],
        },

        '&:hover:not([data-active="true"])': {
          backgroundColor: theme.colorScheme === 'dark'
            ? theme.colors.dark[6]
            : theme.colors.gray[0],
        },
      },
    }),
  },

  // サイドナビゲーション
  SideNavigation: {
    styles: (theme: any) => ({
      root: {
        backgroundColor: theme.colorScheme === 'dark'
          ? theme.colors.dark[8]
          : theme.colors.gray[0],
        borderRight: `1px solid ${theme.colors.gray[3]}`,
        transition: `width ${theme.other.transitionDuration.normal} ease`,

        '@media (max-width: 62em)': {
          display: 'none',
        },
      },

      header: {
        padding: theme.spacing.md,
        borderBottom: `1px solid ${theme.colors.gray[3]}`,
        minHeight: theme.other.headerHeight.desktop,
      },

      collapseButton: {
        minWidth: rem(32),
        minHeight: rem(32),
      },

      sectionTitle: {
        fontSize: rem(11),
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: rem(0.5),
        color: theme.colors.gray[6],
        marginBottom: rem(8),
      },

      navLink: {
        marginBottom: rem(4),

        '&[data-collapsed="true"]': {
          justifyContent: 'center',

          '& .mantine-NavLink-label': {
            display: 'none',
          },
        },
      },

      tooltip: {
        fontSize: rem(12),
        padding: `${rem(4)} ${rem(8)}`,
      },
    }),
  },

  // ハンバーガーメニュー
  HamburgerMenu: {
    styles: (theme: any) => ({
      drawer: {
        '@media (min-width: 48em)': {
          display: 'none',
        },
      },

      header: {
        paddingBottom: rem(16),
        borderBottom: `1px solid ${theme.colors.gray[3]}`,
      },

      sectionTitle: {
        fontSize: rem(12),
        fontWeight: 600,
        color: theme.colors.gray[6],
        marginBottom: rem(8),
        textTransform: 'uppercase',
      },

      navLink: {
        padding: `${rem(12)} ${rem(16)}`,
        minHeight: theme.other.tapTargetSize,
        marginBottom: rem(4),
        borderRadius: theme.radius.md,
      },
    }),
  },
};
```

### 5. CSS-in-JS変数 (`src/theme/cssVariables.ts`)

```typescript
import { CSSVariablesResolver } from '@mantine/core';

// CSS変数として出力する値
export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {
    // レイアウト関連
    '--app-header-height-mobile': theme.other.headerHeight.mobile,
    '--app-header-height-desktop': theme.other.headerHeight.desktop,
    '--app-footer-height': theme.other.footerHeight,
    '--app-sidebar-width-expanded': theme.other.sidebarWidth.expanded,
    '--app-sidebar-width-collapsed': theme.other.sidebarWidth.collapsed,

    // タップエリア
    '--app-tap-target-size': theme.other.tapTargetSize,

    // z-index
    '--app-z-header': theme.other.zIndex.header.toString(),
    '--app-z-footer': theme.other.zIndex.footer.toString(),
    '--app-z-sidebar': theme.other.zIndex.sidebar.toString(),
    '--app-z-hamburger': theme.other.zIndex.hamburger.toString(),
    '--app-z-overlay': theme.other.zIndex.overlay.toString(),

    // アニメーション
    '--app-transition-fast': theme.other.transitionDuration.fast,
    '--app-transition-normal': theme.other.transitionDuration.normal,
    '--app-transition-slow': theme.other.transitionDuration.slow,

    // セーフエリア
    '--app-safe-area-top': 'env(safe-area-inset-top)',
    '--app-safe-area-bottom': 'env(safe-area-inset-bottom)',
    '--app-safe-area-left': 'env(safe-area-inset-left)',
    '--app-safe-area-right': 'env(safe-area-inset-right)',
  },

  light: {
    // ライトテーマ専用変数
    '--app-bg-primary': theme.white,
    '--app-bg-secondary': theme.colors.gray[0],
    '--app-bg-tertiary': theme.colors.gray[1],
    '--app-text-primary': theme.colors.gray[9],
    '--app-text-secondary': theme.colors.gray[6],
    '--app-border-color': theme.colors.gray[3],
  },

  dark: {
    // ダークテーマ専用変数
    '--app-bg-primary': theme.colors.dark[7],
    '--app-bg-secondary': theme.colors.dark[8],
    '--app-bg-tertiary': theme.colors.dark[6],
    '--app-text-primary': theme.white,
    '--app-text-secondary': theme.colors.gray[4],
    '--app-border-color': theme.colors.dark[4],
  },
});
```

### 6. テーマプロバイダー統合 (`src/theme/ThemeProvider.tsx`)

```typescript
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { useHotkeys, useLocalStorage } from '@mantine/hooks';
import { appTheme } from './index';
import { cssVariablesResolver } from './cssVariables';

interface AppThemeProviderProps {
  children: React.ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const [colorScheme, setColorScheme] = useLocalStorage<'light' | 'dark' | 'auto'>({
    key: 'app-color-scheme',
    defaultValue: 'auto',
  });

  // キーボードショートカット (Ctrl/Cmd + J でテーマ切り替え)
  useHotkeys([
    ['mod+J', () => setColorScheme(c => c === 'dark' ? 'light' : 'dark')],
  ]);

  return (
    <>
      <ColorSchemeScript defaultColorScheme={colorScheme} />
      <MantineProvider
        theme={appTheme}
        defaultColorScheme={colorScheme}
        cssVariablesResolver={cssVariablesResolver}
      >
        {children}
      </MantineProvider>
    </>
  );
}
```

## 実装のポイント

### 1. **完全なMantine依存**
- CSSファイルは一切使用せず、Mantineのテーマシステムのみ使用
- 全スタイルをJavaScript/TypeScriptで管理

### 2. **型安全性**
- すべてのテーマ値がTypeScriptで型付け
- カスタムプロパティも型安全にアクセス可能

### 3. **レスポンシブ対応**
- Mantineのブレークポイントシステムを活用
- useMediaQueryフックによる動的判定

### 4. **アクセシビリティ**
- タップエリアサイズの確保
- フォーカス管理
- reduced-motionサポート

### 5. **パフォーマンス**
- CSS-in-JSによる必要最小限のスタイル出力
- ダイナミックインポートでテーマの分割読み込み対応

この戦略により、Mantineの機能を最大限活用したレスポンシブレイアウトシステムが構築できます。