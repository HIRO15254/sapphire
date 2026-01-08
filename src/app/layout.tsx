import '~/styles/globals.css'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/tiptap/styles.css'
import '@mantine/charts/styles.css';

import {
  ColorSchemeScript,
  createTheme,
  MantineProvider,
  mantineHtmlProps,
} from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import type React from 'react'
import { ServiceWorkerRegistration } from '~/components/ServiceWorkerRegistration'
import { TRPCReactProvider } from '~/trpc/react'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

const theme = createTheme({
  fontFamily: 'var(--font-noto-sans-jp), sans-serif',
  // 日本語テキストに適した行間
  lineHeights: {
    xs: '1.5',
    sm: '1.6',
    md: '1.75',
    lg: '1.8',
    xl: '1.9',
  },
})

export const viewport: Viewport = {
  themeColor: '#228be6',
}

export const metadata: Metadata = {
  title: 'Sapphire',
  description: 'ライブポーカーセッション・ハンド記録アプリ',
  icons: [
    { rel: 'icon', url: '/icons/favicon.ico' },
    { rel: 'icon', url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/icons/apple-touch-icon.png' },
  ],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sapphire',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" {...mantineHtmlProps} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className={notoSansJP.variable}>
        <MantineProvider defaultColorScheme="auto" theme={theme}>
          <Notifications position="top-right" />
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <ServiceWorkerRegistration />
        </MantineProvider>
      </body>
    </html>
  )
}
