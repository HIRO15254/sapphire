import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import { Link, useLocation } from "react-router-dom";

export default function ComingSoonPage() {
  const location = useLocation();

  // パスから表示名を生成
  const getPageName = (pathname: string) => {
    const pathMap: Record<string, string> = {
      "/users": "ユーザー管理",
      "/notes": "ノート管理",
      "/search": "検索",
      "/notifications": "通知",
      "/dashboard": "ダッシュボード",
      "/favorites": "お気に入り",
      "/settings": "設定",
    };
    return pathMap[pathname] || "このページ";
  };

  return (
    <Container size="sm" py={80}>
      <Stack gap="xl" align="center">
        <Title order={1} ta="center" c="dimmed">
          準備中
        </Title>

        <Title order={2} ta="center">
          {getPageName(location.pathname)}
        </Title>

        <Text c="dimmed" ta="center" size="lg">
          このページは現在開発中です。近日公開予定です。
        </Text>

        <Button
          component={Link}
          to="/"
          leftSection={<IconHome size={16} />}
          variant="filled"
          size="md"
        >
          ホームに戻る
        </Button>
      </Stack>
    </Container>
  );
}
