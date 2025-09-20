import { useMediaQuery } from "@mantine/hooks";
import type { DeviceInfo, MantineBreakpoint, ResponsiveHookReturn } from "../types/responsive";

// ブレークポイント値（px）
export const breakpointValues = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1408,
} as const;

// レスポンシブユーティリティ関数
export const responsive = {
  // 値がブレークポイントより小さい場合の値を取得
  getValueForBreakpoint: <T>(
    value: T | { [K in MantineBreakpoint]?: T },
    breakpoint: MantineBreakpoint,
    fallback: T
  ): T => {
    if (typeof value === "object" && value !== null) {
      return (value as any)[breakpoint] ?? fallback;
    }
    return value ?? fallback;
  },

  // モバイルかどうかの判定
  isMobile: (width: number): boolean => width <= breakpointValues.sm,

  // タブレットかどうかの判定
  isTablet: (width: number): boolean => width > breakpointValues.sm && width <= breakpointValues.md,

  // デスクトップかどうかの判定
  isDesktop: (width: number): boolean => width > breakpointValues.md,
};

// レスポンシブ状態管理フック
export const useResponsiveLayout = (): ResponsiveHookReturn => {
  const isMobile = useMediaQuery("(max-width: 48em)");
  const isTablet = useMediaQuery("(min-width: 48em) and (max-width: 62em)");
  const isDesktop = useMediaQuery("(min-width: 62em)");

  // デバイス情報の構築
  const device: DeviceInfo = {
    screenWidth: typeof window !== "undefined" ? window.innerWidth : 0,
    screenHeight: typeof window !== "undefined" ? window.innerHeight : 0,
    deviceType: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
    isMobile,
    isTablet,
    isDesktop,
    orientation:
      typeof window !== "undefined"
        ? window.innerWidth > window.innerHeight
          ? "landscape"
          : "portrait"
        : "portrait",
    breakpoint: isMobile ? "sm" : isTablet ? "md" : "lg",
    pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
    isTouch:
      typeof window !== "undefined"
        ? "ontouchstart" in window || navigator.maxTouchPoints > 0
        : false,
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint: device.breakpoint,
    device,
  };
};
