'use client'

import { Button, Card, Divider, Group, Table, Text, Title } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

import type { Currency } from './types'

interface TransactionSectionProps {
  currency: Currency
  onAddBonusClick: () => void
  onAddPurchaseClick: () => void
}

export function TransactionSection({
  currency,
  onAddBonusClick,
  onAddPurchaseClick,
}: TransactionSectionProps) {
  return (
    <>
      {/* Transaction Actions */}
      <Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={onAddBonusClick}
          variant="light"
        >
          ボーナスを追加
        </Button>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={onAddPurchaseClick}
          variant="light"
        >
          購入を追加
        </Button>
      </Group>

      {/* Bonus Transactions */}
      <Card p="lg" radius="md" shadow="sm" withBorder>
        <Title order={3}>ボーナス履歴</Title>
        <Divider my="md" />
        {currency.bonusTransactions.length === 0 ? (
          <Text c="dimmed">ボーナス履歴はありません</Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>日付</Table.Th>
                <Table.Th>取得元</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currency.bonusTransactions.map((bonus) => (
                <Table.Tr key={bonus.id}>
                  <Table.Td>
                    {new Date(bonus.transactionDate).toLocaleDateString('ja-JP')}
                  </Table.Td>
                  <Table.Td>{bonus.source ?? '-'}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text c="teal" fw={500}>
                      +{bonus.amount.toLocaleString()}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Purchase Transactions */}
      <Card p="lg" radius="md" shadow="sm" withBorder>
        <Title order={3}>購入履歴</Title>
        <Divider my="md" />
        {currency.purchaseTransactions.length === 0 ? (
          <Text c="dimmed">購入履歴はありません</Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>日付</Table.Th>
                <Table.Th>メモ</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currency.purchaseTransactions.map((purchase) => (
                <Table.Tr key={purchase.id}>
                  <Table.Td>
                    {new Date(purchase.transactionDate).toLocaleDateString(
                      'ja-JP',
                    )}
                  </Table.Td>
                  <Table.Td>{purchase.note ?? '-'}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text c="teal" fw={500}>
                      +{purchase.amount.toLocaleString()}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
