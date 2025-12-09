"use client";

import { Center, Loader, SimpleGrid, Stack, Text } from "@mantine/core";
import { CurrencyCard, type CurrencyCardProps } from "./CurrencyCard";

export interface CurrencyListProps {
  currencies: CurrencyCardProps["currency"][];
  isLoading?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onUpdateBalance?: (id: number) => void;
  canDeleteCheck?: (currency: CurrencyCardProps["currency"]) => boolean;
}

export function CurrencyList({
  currencies,
  isLoading = false,
  onEdit,
  onDelete,
  onUpdateBalance,
  canDeleteCheck,
}: CurrencyListProps) {
  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (currencies.length === 0) {
    return (
      <Stack align="center" py="xl" gap="sm">
        <Text size="lg" c="dimmed">
          通貨が登録されていません
        </Text>
        <Text size="sm" c="dimmed">
          「通貨を追加」ボタンから新しい通貨を登録してください
        </Text>
      </Stack>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
      {currencies.map((currency) => (
        <CurrencyCard
          key={currency.id}
          currency={currency}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateBalance={onUpdateBalance}
          canDelete={canDeleteCheck ? canDeleteCheck(currency) : currency._count.games === 0}
        />
      ))}
    </SimpleGrid>
  );
}
