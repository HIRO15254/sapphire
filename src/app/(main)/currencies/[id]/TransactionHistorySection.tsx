'use client'

import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import Link from 'next/link'

import {
  buildUnifiedTransactions,
  type Currency,
  type UnifiedTransaction,
} from './types'

interface TransactionHistorySectionProps {
  currency: Currency
  onAddBonusClick: () => void
  onAddPurchaseClick: () => void
}

function TransactionTypeBadge({ type }: { type: UnifiedTransaction['type'] }) {
  switch (type) {
    case 'session':
      return (
        <Badge color="blue" size="sm" variant="light">
          セッション
        </Badge>
      )
    case 'bonus':
      return (
        <Badge color="teal" size="sm" variant="light">
          ボーナス
        </Badge>
      )
    case 'purchase':
      return (
        <Badge color="grape" size="sm" variant="light">
          購入
        </Badge>
      )
  }
}

function TransactionAmount({ amount }: { amount: number }) {
  const isPositive = amount >= 0
  const color = isPositive ? 'teal' : 'red'
  const prefix = isPositive ? '+' : ''

  return (
    <Text c={color} fw={500}>
      {prefix}
      {amount.toLocaleString()}
    </Text>
  )
}

function TransactionDetail({
  transaction,
}: {
  transaction: UnifiedTransaction
}) {
  if (transaction.type === 'session') {
    return (
      <Text
        component={Link}
        href={`/sessions/${transaction.id}`}
        size="sm"
        td="underline"
      >
        {transaction.detail}
      </Text>
    )
  }

  return (
    <Text c={transaction.detail ? undefined : 'dimmed'} size="sm">
      {transaction.detail || '-'}
    </Text>
  )
}

export function TransactionHistorySection({
  currency,
  onAddBonusClick,
  onAddPurchaseClick,
}: TransactionHistorySectionProps) {
  const transactions = buildUnifiedTransactions(currency)

  return (
    <Card p="lg" radius="md" shadow="sm" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>取引履歴</Title>
        <Group gap="sm">
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={onAddBonusClick}
            size="xs"
            variant="light"
          >
            ボーナス
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={onAddPurchaseClick}
            size="xs"
            variant="light"
          >
            購入
          </Button>
        </Group>
      </Group>
      <Divider mb="md" />

      {transactions.length === 0 ? (
        <Text c="dimmed">取引履歴はありません</Text>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>日付</Table.Th>
              <Table.Th>種類</Table.Th>
              <Table.Th>詳細</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {transactions.map((transaction) => (
              <Table.Tr key={`${transaction.type}-${transaction.id}`}>
                <Table.Td>
                  {transaction.date.toLocaleDateString('ja-JP')}
                </Table.Td>
                <Table.Td>
                  <TransactionTypeBadge type={transaction.type} />
                </Table.Td>
                <Table.Td>
                  <TransactionDetail transaction={transaction} />
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <TransactionAmount amount={transaction.amount} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  )
}
