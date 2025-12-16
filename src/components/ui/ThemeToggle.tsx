'use client'

import { ActionIcon, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

/**
 * Theme toggle button for switching between light and dark mode.
 * Uses Mantine's built-in color scheme management.
 */
export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <ActionIcon
      aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      onClick={toggleColorScheme}
      size="lg"
      variant="default"
    >
      {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  )
}
