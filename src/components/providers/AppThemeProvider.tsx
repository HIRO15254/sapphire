import { MantineProvider, createTheme } from "@mantine/core";
import { useLayoutEffect, useMemo } from "react";

type ThemeMode = "light" | "dark" | "auto";

export interface AppThemeProviderProps {
  children: React.ReactNode;
  theme?: ThemeMode;
  primaryColor?: string;
}

/**
 * 【機能概要】: アプリケーション全体のテーマ管理を行うプロバイダーコンポーネント
 * 【実装方針】: MantineProviderを包含し、テーマ設定とDOM属性の管理を担当
 * 【責任範囲】: テーマ作成、カラースキーム設定、DOM属性への反映
 * 🟢 信頼性レベル: Mantineドキュメントから確認済み
 */
export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({
  children,
  theme = "auto",
  primaryColor = "blue",
}) => {
  // 【テーマ作成】: Mantineカスタムテーマを作成してプライマリカラーを設定
  const mantineTheme = useMemo(
    () =>
      createTheme({
        primaryColor,
        defaultRadius: "md",
        breakpoints: {
          xs: "36em",
          sm: "48em",
          md: "62em",
          lg: "75em",
          xl: "88em",
        },
      }),
    [primaryColor]
  );

  // 【カラースキーム設定】: autoテーマの場合はlightにフォールバック
  const effectiveColorScheme = useMemo(() => {
    return theme === "auto" ? "light" : theme;
  }, [theme]);

  // 【DOM属性設定】: HTMLタグにdata-mantine-color-scheme属性を設定
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-mantine-color-scheme", effectiveColorScheme);

    // Mantine初期化後の再設定
    const timer = setTimeout(() => {
      document.documentElement.setAttribute("data-mantine-color-scheme", effectiveColorScheme);
    }, 0);

    return () => clearTimeout(timer);
  }, [effectiveColorScheme]);

  return (
    <MantineProvider
      theme={mantineTheme}
      defaultColorScheme={effectiveColorScheme}
      forceColorScheme={theme !== "auto" ? effectiveColorScheme : undefined}
    >
      {children}
    </MantineProvider>
  );
};

export default AppThemeProvider;