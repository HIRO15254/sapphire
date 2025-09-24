import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <Container size="sm" py={80}>
      <Stack gap="xl" align="center">
        <Title order={1} ta="center" c="dimmed">
          404
        </Title>

        <Title order={2} ta="center">
          ページが見つかりません
        </Title>

        <Text c="dimmed" ta="center" size="lg">
          お探しのページは存在しないか、まだ実装されていません。
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
