'use client'

import { Card, Divider, Group, Stack, Text, Title } from '@mantine/core'

import type { Currency } from './types'

interface BalanceBreakdownProps {
  currency: Currency
}

export function BalanceBreakdown({ currency }: BalanceBreakdownProps) {
  return (
    <Card p="lg" radius="md" shadow="sm" withBorder>
      <Title order={3}>残高内訳</Title>
      <Divider my="md" />
      <Stack gap="sm">
        <Group justify="space-between">
          <Text>初期残高</Text>
          <Text fw={500}>{currency.initialBalance.toLocaleString()}</Text>
        </Group>
        <Group justify="space-between">
          <Text>ボーナス合計</Text>
          <Text c="teal" fw={500}>
            +{currency.totalBonuses.toLocaleString()}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text>購入合計</Text>
          <Text c="teal" fw={500}>
            +{currency.totalPurchases.toLocaleString()}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text>バイイン合計</Text>
          <Text c="red" fw={500}>
            -{currency.totalBuyIns.toLocaleString()}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text>キャッシュアウト合計</Text>
          <Text c="teal" fw={500}>
            +{currency.totalCashOuts.toLocaleString()}
          </Text>
        </Group>
        <Divider />
        <Group justify="space-between">
          <Text fw={600} size="lg">
            現在残高
          </Text>
          <Text
            c={currency.currentBalance >= 0 ? 'teal' : 'red'}
            fw={700}
            size="xl"
          >
            {currency.currentBalance.toLocaleString()}
          </Text>
        </Group>
      </Stack>
    </Card>
  )
}
