"use client";

import { Badge, Card, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconBuilding, IconCards, IconPokerChip } from "@tabler/icons-react";
import Link from "next/link";

export interface LocationCardProps {
  location: {
    id: number;
    name: string;
    sessionCount: number;
    gameCount: number;
  };
}

/**
 * 店舗カードコンポーネント
 *
 * 責務:
 * - 店舗情報の表示（名前、セッション数、ゲーム数）
 * - 詳細ページへのリンク
 */
export function LocationCard({ location }: LocationCardProps) {
  return (
    <UnstyledButton
      component={Link}
      href={`/locations/${location.id}`}
      style={{ display: "block" }}
    >
      <Card withBorder p="sm" radius="md" style={{ cursor: "pointer" }}>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <IconBuilding size={20} color="var(--mantine-color-blue-6)" />
            <Text fw={500}>{location.name}</Text>
          </Group>
          <Group gap="xs">
            <Badge
              variant="light"
              leftSection={<IconCards size={12} />}
              size="sm"
            >
              {location.gameCount}ゲーム
            </Badge>
            <Badge
              variant="light"
              color="gray"
              leftSection={<IconPokerChip size={12} />}
              size="sm"
            >
              {location.sessionCount}回
            </Badge>
          </Group>
        </Group>
      </Card>
    </UnstyledButton>
  );
}
