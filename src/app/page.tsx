import { Button, Container, Stack, Text, Title } from '@mantine/core'
import Link from 'next/link'

import { SignOutButton } from '~/components/auth/SignOutButton'
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
            <SignOutButton variant="outline" w={200} />
          </Stack>
        ) : (
          <Stack align="center" gap="md">
            <Text c="dimmed">ログインして始めましょう</Text>
            <Button component={Link} href="/auth/signin" w={200}>
              ログイン
            </Button>
            <Button
              component={Link}
              href="/auth/register"
              variant="outline"
              w={200}
            >
              新規登録
            </Button>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
