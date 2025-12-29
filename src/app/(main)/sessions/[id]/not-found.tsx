import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import Link from 'next/link'

/**
 * Session not found page.
 */
export default function SessionNotFound() {
  return (
    <Container py="xl" size="md">
      <Stack align="center" gap="lg">
        <Title order={1}>セッションが見つかりません</Title>
        <Text c="dimmed">
          このセッションは存在しないか、アクセス権限がありません。
        </Text>
        <Button
          component={Link}
          href="/sessions"
          leftSection={<IconArrowLeft size={16} />}
        >
          セッション一覧に戻る
        </Button>
      </Stack>
    </Container>
  )
}
