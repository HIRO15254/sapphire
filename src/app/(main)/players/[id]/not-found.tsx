import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import Link from 'next/link'

/**
 * 404 page for player not found.
 */
export default function PlayerNotFound() {
  return (
    <Container py="xl" size="md">
      <Stack align="center" gap="lg">
        <Title order={1}>プレイヤーが見つかりません</Title>
        <Text c="dimmed">
          指定されたプレイヤーは存在しないか、削除されている可能性があります。
        </Text>
        <Button
          component={Link}
          href="/players"
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
        >
          プレイヤー一覧に戻る
        </Button>
      </Stack>
    </Container>
  )
}
