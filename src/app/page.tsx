import { auth, signIn, signOut } from "@/server/auth";
import { Button, Card, Container, Group, Stack, Text, Title } from "@mantine/core";
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconCards,
  IconChartLine,
  IconLogout,
} from "@tabler/icons-react";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <Container size="md" py="xl">
      <Stack gap="xl" align="center">
        <Stack gap="md" align="center">
          <IconCards size={64} stroke={1.5} />
          <Title order={1}>ポーカーセッショントラッカー</Title>
          <Text size="lg" c="dimmed" ta="center">
            あなたのポーカーセッションを記録・分析して、パフォーマンスを向上させましょう
          </Text>
        </Stack>

        {session?.user && (
          <Card shadow="sm" padding="lg" radius="md" withBorder w="100%" maw={500}>
            <Stack gap="md">
              <Text size="lg" fw={500}>
                ようこそ、{session.user.name}さん！
              </Text>
              <Text c="dimmed">{session.user.email}</Text>
            </Stack>
          </Card>
        )}

        <Card shadow="sm" padding="lg" radius="md" withBorder w="100%" maw={500}>
          <Stack gap="md">
            <Title order={3}>主な機能</Title>
            <Text>✓ セッション結果の記録（日時、場所、バイイン、キャッシュアウト）</Text>
            <Text>✓ 自動で収支を計算</Text>
            <Text>✓ 統計とパフォーマンス分析</Text>
            <Text>✓ 場所別のデータ比較</Text>
            <Text>✓ セッションにメモを追加</Text>
            <Text>✓ フィルタリングと検索機能</Text>
          </Stack>
        </Card>

        {session?.user ? (
          <Group gap="md">
            <Button
              component={Link}
              href="/poker-sessions"
              size="lg"
              leftSection={<IconChartLine size={20} />}
            >
              セッション管理
            </Button>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <Button
                type="submit"
                size="lg"
                variant="outline"
                leftSection={<IconLogout size={20} />}
              >
                ログアウト
              </Button>
            </form>
          </Group>
        ) : (
          <Stack gap="md" align="center">
            <Group gap="md">
              <form
                action={async () => {
                  "use server";
                  await signIn("google");
                }}
              >
                <Button type="submit" size="lg" leftSection={<IconBrandGoogle size={20} />}>
                  Googleでログイン
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await signIn("github");
                }}
              >
                <Button
                  type="submit"
                  size="lg"
                  variant="outline"
                  leftSection={<IconBrandGithub size={20} />}
                >
                  GitHubでログイン
                </Button>
              </form>
            </Group>
            <Text size="sm" c="dimmed" ta="center">
              Googleアカウント または GitHubアカウント でサインイン
            </Text>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
