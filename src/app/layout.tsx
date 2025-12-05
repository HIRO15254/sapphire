import "@/styles/globals.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/tiptap/styles.css";

import { ColorSchemeScript, MantineProvider, createTheme, mantineHtmlProps } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { LayoutClientWrapper } from "@/features/layout/containers/LayoutClientWrapper";
import { auth } from "@/server/auth";
import { TRPCReactProvider } from "@/trpc/react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  title: "Sapphire - ポーカーセッショントラッカー",
  description: "ポーカーセッションを記録・分析して、パフォーマンスを向上させる",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sapphire",
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

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="ja" {...mantineHtmlProps} suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={geist.className}>
        <Analytics />
        <SpeedInsights />
        <ServiceWorkerRegistration />
        <MantineProvider theme={theme}>
          <ModalsProvider>
            <Notifications />
            <TRPCReactProvider>
              <LayoutClientWrapper session={session}>{children}</LayoutClientWrapper>
            </TRPCReactProvider>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
