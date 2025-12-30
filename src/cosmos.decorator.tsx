'use client'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/tiptap/styles.css'
import '~/styles/globals.css'

import { createTheme, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import type React from 'react'

/**
 * Mantine theme configuration (shared with main app).
 */
const theme = createTheme({
  fontFamily: 'sans-serif',
  lineHeights: {
    xs: '1.5',
    sm: '1.6',
    md: '1.75',
    lg: '1.8',
    xl: '1.9',
  },
})

/**
 * Global Cosmos decorator that wraps all fixtures with Mantine providers.
 *
 * This ensures components render with the same styling as the main app.
 */
export default function CosmosDecorator({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MantineProvider defaultColorScheme="auto" theme={theme}>
      <Notifications position="top-right" />
      {children}
    </MantineProvider>
  )
}
