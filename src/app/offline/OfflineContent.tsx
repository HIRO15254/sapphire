'use client'

import { IconCloudOff, IconRefresh } from '@tabler/icons-react'
import { Button, Container, Stack, Text, Title } from '@mantine/core'

export function OfflineContent() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <Container size="xs" py="xl">
      <Stack align="center" gap="lg" mt="xl">
        <IconCloudOff size={80} stroke={1.5} color="var(--mantine-color-gray-5)" />

        <Title order={1} ta="center">
          オフライン
        </Title>

        <Text c="dimmed" ta="center" size="lg">
          ネットワーク接続がありません。
          <br />
          インターネット接続を確認してから再試行してください。
        </Text>

        <Button
          size="lg"
          leftSection={<IconRefresh size={20} />}
          onClick={handleRetry}
          mt="md"
        >
          再試行
        </Button>
      </Stack>
    </Container>
  )
}
