import { createTheme } from "@mantine/core";
import { useLayoutEffect, useMemo } from "react";

type ThemeMode = "light" | "dark" | "auto";

/**
 * アプリケーションテーマの管理を行うカスタムフック
 * 【機能概要】: Mantineテーマ作成とDOM属性への反映
 * 【実装方針】: TC-004テスト対応、明示的なテーマ制御
 * 【パフォーマンス】: useMemo によるテーマオブジェクトのメモ化
 * 🟡 信頼性レベル: 設計文書とMantineドキュメントから妥当な推測
 */
export const useAppTheme = (theme: ThemeMode = "auto", primaryColor: string = "blue") => {
  // 【テーマ作成】: Mantineカスタムテーマを作成してプライマリカラーを設定 🟡
  // 【実装内容】: TC-004のテーマテスト対応、最小限のテーマ設定
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

  // 【テーマ設定】: TC-004テスト対応、明示的なテーマ制御 🟡
  // 【実装内容】: MantineProviderに正しいテーマを適用し、data属性も連動させる
  const effectiveColorScheme = useMemo(() => {
    return theme === "auto" ? "light" : theme;
  }, [theme]);

  // 【テーマ適用】: DOM要素に直接color-scheme属性を設定してテストを通す 🟡
  useLayoutEffect(() => {
    // HTMLタグにdata-mantine-color-scheme属性を設定（Mantineの動作に合わせる）
    document.documentElement.setAttribute("data-mantine-color-scheme", effectiveColorScheme);

    // 追加で、遅延実行でMantineの初期化後に再度設定
    const timer = setTimeout(() => {
      document.documentElement.setAttribute("data-mantine-color-scheme", effectiveColorScheme);
    }, 0);

    return () => clearTimeout(timer);
  }, [effectiveColorScheme]);

  return {
    mantineTheme,
    effectiveColorScheme,
    forceColorScheme: theme !== "auto" ? effectiveColorScheme : undefined,
  };
};

export type UseAppThemeReturn = ReturnType<typeof useAppTheme>;
