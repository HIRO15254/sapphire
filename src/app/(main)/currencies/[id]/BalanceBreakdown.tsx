'use client'

import { Card, Group, Text } from '@mantine/core'

import type { Currency } from './types'

interface BalanceBreakdownProps {
  currency: Currency
}

export function BalanceBreakdown({ currency }: BalanceBreakdownProps) {
  return (
    <Card p="lg" radius="md" shadow="sm" withBorder>
      <Group justify="space-between">
        <Text fw={500} size="lg">
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
    </Card>
  )
}
