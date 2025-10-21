"use client";

import { Button, Container, Stack, Text, Title } from "@mantine/core";

export default function OfflinePage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="xl" align="center" style={{ minHeight: "60vh", justifyContent: "center" }}>
        <Title order={1}>オフライン</Title>
        <Text c="dimmed" ta="center">
          インターネットに接続されていません。
          <br />
          接続を確認してから再度お試しください。
        </Text>
        <Button onClick={() => window.location.reload()} variant="filled">
          再読み込み
        </Button>
      </Stack>
    </Container>
  );
}
