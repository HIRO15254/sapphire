import "@/styles/globals.css";
import "@mantine/core/styles.css";

import { ColorSchemeScript, MantineProvider, createTheme, mantineHtmlProps } from "@mantine/core";
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { TRPCReactProvider } from "@/trpc/react";

// レスポンシブブレークポイントの定義（FR-011）
const theme = createTheme({
  breakpoints: {
    xs: "375px", // モバイル
    sm: "768px", // タブレット
    md: "1024px", // デスクトップ
    lg: "1920px", // ワイドスクリーン
    xl: "2560px", // ウルトラワイド
  },
  fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  primaryColor: "blue",
  defaultRadius: "md",
});

export const metadata: Metadata = {
  title: "Todoアプリ",
  description: "シンプルで使いやすいTodoアプリ",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Todoアプリ",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#228be6",
};

const geist = Geist({
  subsets: ["latin"],
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" {...mantineHtmlProps} suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={geist.className}>
        <ServiceWorkerRegistration />
        <MantineProvider theme={theme}>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
