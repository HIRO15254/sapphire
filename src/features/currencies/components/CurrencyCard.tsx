"use client";

import { ActionIcon, Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconEdit, IconTrash, IconWallet } from "@tabler/icons-react";

export interface CurrencyCardProps {
  currency: {
    id: number;
    name: string;
    prefix: string;
    balance: number;
    _count: {
      games: number;
    };
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onUpdateBalance?: (id: number) => void;
  canDelete?: boolean;
}

export function CurrencyCard({
  currency,
  onEdit,
  onDelete,
  onUpdateBalance,
  canDelete = true,
}: CurrencyCardProps) {
  const gameCount = currency._count.games;
  const balanceColor = currency.balance >= 0 ? "teal" : "red";

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text fw={500} size="lg">
              {currency.name}
            </Text>
            {currency.prefix && (
              <Text size="sm" c="dimmed">
                プレフィックス: {currency.prefix}
              </Text>
            )}
          </Stack>
          <Group gap="xs">
            {onUpdateBalance && (
              <ActionIcon
                variant="subtle"
                color="teal"
                onClick={() => onUpdateBalance(currency.id)}
                aria-label="保有量を編集"
              >
                <IconWallet size={18} />
              </ActionIcon>
            )}
            {onEdit && (
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => onEdit(currency.id)}
                aria-label="編集"
              >
                <IconEdit size={18} />
              </ActionIcon>
            )}
            {onDelete && (
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => onDelete(currency.id)}
                disabled={!canDelete}
                aria-label="削除"
              >
                <IconTrash size={18} />
              </ActionIcon>
            )}
          </Group>
        </Group>

        {/* 保有量 */}
        <Group gap="xs" align="baseline">
          <Text size="sm" c="dimmed">
            保有量:
          </Text>
          <Title order={4} c={balanceColor}>
            {currency.balance.toLocaleString()}
          </Title>
        </Group>

        <Badge variant="light" color={gameCount > 0 ? "blue" : "gray"}>
          {gameCount}件のゲームで使用中
        </Badge>
      </Stack>
    </Card>
  );
}
