'use client'

import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

/**
 * Theme toggle button for switching between light and dark mode.
 * Uses Mantine's built-in color scheme management.
 *
 * Uses useComputedColorScheme with getInitialValueInEffect to prevent
 * hydration mismatch between server and client.
 */
export function ThemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

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
