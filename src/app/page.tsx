import { Button, Container, Stack, Text, Title } from '@mantine/core'
import Link from 'next/link'

import { auth } from '~/server/auth'

export default async function Home() {
  const session = await auth()

  return (
    <Container py="xl" size="sm">
      <Stack align="center" gap="lg">
        <Title order={1}>ポーカーセッショントラッカー</Title>
        <Text c="dimmed" ta="center">
          ライブポーカーのセッションとハンドを記録・分析するアプリケーション
        </Text>

        {session?.user ? (
          <Stack align="center" gap="md">
            <Text>ようこそ、{session.user.name ?? session.user.email}さん</Text>
            <Button component={Link} href="/api/auth/signout" variant="outline">
              ログアウト
            </Button>
          </Stack>
        ) : (
          <Stack align="center" gap="md">
            <Text c="dimmed">ログインして始めましょう</Text>
            <Button component={Link} href="/api/auth/signin">
              ログイン
            </Button>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
