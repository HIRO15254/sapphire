'use client'

import { Stack, Text } from '@mantine/core'
import { ThemeToggle } from '../ThemeToggle'

/**
 * Fixture for ThemeToggle component.
 * Demonstrates light/dark mode toggle functionality.
 */
export default function ThemeToggleFixture() {
  return (
    <Stack align="center" gap="md" p="xl">
      <Text c="dimmed" size="sm">
        ライト/ダークモードを切り替えるボタン
      </Text>
      <ThemeToggle />
    </Stack>
  )
}
