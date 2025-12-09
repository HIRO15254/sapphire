"use client";

import { Button, Card, Center, Loader, Stack, Text } from "@mantine/core";
import { IconBuilding, IconPlus } from "@tabler/icons-react";

import { LocationCard } from "./LocationCard";

export interface LocationListProps {
  locations: Array<{
    id: number;
    name: string;
    sessionCount: number;
    gameCount: number;
  }>;
  isLoading?: boolean;
  onAddNew?: () => void;
}

/**
 * 店舗一覧コンポーネント
 *
 * 責務:
 * - 店舗一覧の表示
 * - 空状態の表示
 * - ローディング状態の表示
 */
export function LocationList({ locations, isLoading, onAddNew }: LocationListProps) {
  if (isLoading) {
    return (
      <Center h={200}>
        <Stack align="center" gap="sm">
          <Loader size="md" />
          <Text c="dimmed" size="sm">
            店舗を読み込み中...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (locations.length === 0) {
    return (
      <Card withBorder p="xl">
        <Stack align="center" gap="md">
          <IconBuilding size={48} color="gray" />
          <Text fw={500} c="dimmed">
            店舗がありません
          </Text>
          <Text c="dimmed" size="sm" ta="center">
            店舗を追加して、ゲームやセッションを管理しましょう
          </Text>
          {onAddNew && (
            <Button leftSection={<IconPlus size={16} />} onClick={onAddNew}>
              店舗を追加
            </Button>
          )}
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="xs">
      {locations.map((location) => (
        <LocationCard key={location.id} location={location} />
      ))}
    </Stack>
  );
}
