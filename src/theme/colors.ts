import type { MantineColorsTuple } from "@mantine/core";

// ライトテーマカラー
export const lightColors = {
  primary: [
    "#e3f2fd",
    "#bbdefb",
    "#90caf9",
    "#64b5f6",
    "#42a5f5",
    "#2196f3",
    "#1e88e5",
    "#1976d2",
    "#1565c0",
    "#0d47a1",
  ] as MantineColorsTuple,

  background: {
    primary: "#ffffff",
    secondary: "#f8f9fa",
    tertiary: "#e9ecef",
  },

  text: {
    primary: "#212529",
    secondary: "#6c757d",
    muted: "#868e96",
  },

  border: "#e9ecef",
};

// ダークテーマカラー
export const darkColors = {
  primary: [
    "#0d47a1",
    "#1565c0",
    "#1976d2",
    "#1e88e5",
    "#2196f3",
    "#42a5f5",
    "#64b5f6",
    "#90caf9",
    "#bbdefb",
    "#e3f2fd",
  ] as MantineColorsTuple,

  background: {
    primary: "#1a1a1a",
    secondary: "#2d2d2d",
    tertiary: "#404040",
  },

  text: {
    primary: "#ffffff",
    secondary: "#cccccc",
    muted: "#999999",
  },

  border: "#404040",
};

// テーマ切り替え用ヘルパー
export const getThemeColors = (colorScheme: "light" | "dark") => {
  return colorScheme === "dark" ? darkColors : lightColors;
};
