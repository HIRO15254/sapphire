"use client";

import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconList, IconPlus } from "@tabler/icons-react";
import Link from "next/link";

/**
 * クイックアクションコンポーネント
 *
 * 責務:
 * - ダッシュボードからの主要アクションへのショートカット提供
 * - 新規セッション作成とセッション一覧へのアクセス
 */
export function QuickActions() {
  return (
    <Card withBorder p="md">
      <Stack gap="md">
        <Title order={4}>クイックアクション</Title>
        <Text size="sm" c="dimmed">
          よく使う機能にすばやくアクセス
        </Text>
        <Group gap="sm">
          <Button
            component={Link}
            href="/poker-sessions/new"
            leftSection={<IconPlus size={18} />}
            variant="filled"
          >
            新規セッション
          </Button>
          <Button
            component={Link}
            href="/poker-sessions"
            leftSection={<IconList size={18} />}
            variant="light"
          >
            セッション一覧
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
