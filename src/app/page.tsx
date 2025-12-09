import { DashboardContainer } from "@/features/dashboard/containers/DashboardContainer";
import { auth } from "@/server/auth";
import { Anchor, Button, Card, Container, Stack, Text, Title } from "@mantine/core";
import { IconCards } from "@tabler/icons-react";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  // 認証済みユーザーにはダッシュボードを表示
  if (session?.user) {
    return <DashboardContainer />;
  }

  // 未認証ユーザーにはランディングページを表示
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

        <Stack gap="md" align="center">
          <Button component={Link} href="/auth/signin" size="lg">
            ログイン
          </Button>
          <Anchor href="/auth/signup" size="sm">
            新規登録
          </Anchor>
        </Stack>
      </Stack>
    </Container>
  );
}
