import { useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import type { AppThemeHookReturn } from "../types/responsive";

// テーマ状態管理フック
export const useAppTheme = (): AppThemeHookReturn => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === "dark" ? "light" : "dark");
  };

  return {
    colorScheme: computedColorScheme,
    toggleColorScheme,
    setColorScheme,
  };
};
