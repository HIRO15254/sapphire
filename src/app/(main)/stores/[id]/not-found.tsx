import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import Link from 'next/link'

/**
 * 404 page for store not found.
 */
export default function StoreNotFound() {
  return (
    <Container py="xl" size="md">
      <Stack align="center" gap="lg">
        <Title order={1}>店舗が見つかりません</Title>
        <Text c="dimmed">
          指定された店舗は存在しないか、削除されている可能性があります。
        </Text>
        <Button
          component={Link}
          href="/stores"
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
        >
          店舗一覧に戻る
        </Button>
      </Stack>
    </Container>
  )
}
