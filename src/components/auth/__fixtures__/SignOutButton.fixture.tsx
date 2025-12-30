'use client'

import { Button, Stack, Text } from '@mantine/core'

/**
 * Fixture for SignOutButton component.
 *
 * Note: The actual SignOutButton uses next-auth which requires session context.
 * This fixture demonstrates the visual appearance without the auth functionality.
 */
export default {
  Default: (
    <Stack p="md">
      <Text size="sm">デフォルト（実際の認証なし）:</Text>
      <Button onClick={() => alert('ログアウトがクリックされました')}>
        ログアウト
      </Button>
    </Stack>
  ),

  Variants: (
    <Stack p="md">
      <Text size="sm">ボタンバリエーション:</Text>
      <Button onClick={() => alert('ログアウト')} variant="default">
        ログアウト
      </Button>
      <Button color="red" onClick={() => alert('ログアウト')} variant="light">
        ログアウト
      </Button>
      <Button onClick={() => alert('ログアウト')} variant="subtle">
        ログアウト
      </Button>
    </Stack>
  ),
}
