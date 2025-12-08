"use client";

import { Button, Card, Group, Text } from "@mantine/core";
import { IconBolt, IconList, IconPlus } from "@tabler/icons-react";
import Link from "next/link";

/**
 * クイックアクションコンポーネント
 *
 * 責務:
 * - ダッシュボードからの主要アクションへのショートカット提供
 * - 新規セッション作成とセッション一覧へのアクセス
 * - コンパクトな1行レイアウト
 */
export function QuickActions() {
  return (
    <Card withBorder p="sm">
      <Group justify="space-between" align="center">
        <Group gap="xs" align="center">
          <IconBolt size={16} color="var(--mantine-color-yellow-6)" />
          <Text size="sm" fw={500}>
            クイックアクション
          </Text>
        </Group>
        <Group gap="xs">
          <Button
            component={Link}
            href="/poker-sessions/new"
            leftSection={<IconPlus size={16} />}
            variant="filled"
            size="xs"
          >
            新規セッション
          </Button>
          <Button
            component={Link}
            href="/poker-sessions"
            leftSection={<IconList size={16} />}
            variant="light"
            size="xs"
          >
            セッション一覧
          </Button>
        </Group>
      </Group>
    </Card>
  );
}
