'use client'

import { ActionIcon, Box, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

/**
 * Theme toggle button for switching between light and dark mode.
 * Uses Mantine's built-in color scheme management.
 *
 * Uses CSS-based visibility (lightHidden/darkHidden) to prevent
 * hydration mismatch between server and client.
 */
export function ThemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme()

  return (
    <ActionIcon
      aria-label="テーマを切り替え"
      onClick={toggleColorScheme}
      size="lg"
      variant="default"
    >
      <Box darkHidden>
        <IconMoon size={18} />
      </Box>
      <Box lightHidden>
        <IconSun size={18} />
      </Box>
    </ActionIcon>
  )
}
