import '~/styles/globals.css'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/tiptap/styles.css'

import { ColorSchemeScript, createTheme, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'

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

export const metadata: Metadata = {
  title: 'Sapphire',
  description: 'ライブポーカーセッション・ハンド記録アプリ',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className={notoSansJP.variable}>
        <MantineProvider defaultColorScheme="auto" theme={theme}>
          <Notifications position="top-right" />
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
