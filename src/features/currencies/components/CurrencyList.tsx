'use client'

import {
  Button,
  Card,
  Checkbox,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import Link from 'next/link'
import type { Currency } from '../lib/types'

interface CurrencyListProps {
  currencies: Currency[]
  includeArchived: boolean
  onIncludeArchivedChange: (value: boolean) => void
  onOpenNewCurrency: () => void
}

export function CurrencyList({
  currencies,
  includeArchived,
  onIncludeArchivedChange,
  onOpenNewCurrency,
}: CurrencyListProps) {
  return (
    <Stack gap="lg">
      <Checkbox
        checked={includeArchived}
        label="アーカイブ済みを表示"
        onChange={(event) => onIncludeArchivedChange(event.currentTarget.checked)}
      />

      {currencies.length === 0 ? (
        <Card p="xl" radius="md" shadow="sm" withBorder>
          <Stack align="center" gap="md">
            <Text c="dimmed" size="lg">
              通貨が登録されていません
            </Text>
            <Text c="dimmed" size="sm">
              新しい通貨を追加して、ポーカーセッションの記録を始めましょう
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              mt="md"
              onClick={onOpenNewCurrency}
            >
              新しい通貨を追加
            </Button>
          </Stack>
        </Card>
      ) : (
        <Stack gap="md">
          {currencies.map((currency) => (
            <Card
              component={Link}
              href={`/currencies/${currency.id}`}
              key={currency.id}
              p="lg"
              radius="md"
              shadow="sm"
              style={{ textDecoration: 'none', cursor: 'pointer' }}
              withBorder
            >
              <Group justify="space-between">
                <Group gap="sm">
                  <Text fw={600} size="lg">
                    {currency.name}
                  </Text>
                  {currency.isArchived && (
                    <Text c="dimmed" size="sm">
                      （アーカイブ済み）
                    </Text>
                  )}
                </Group>
                <Stack align="flex-end" gap="xs">
                  <Text c="dimmed" size="sm">
                    現在残高
                  </Text>
                  <Text
                    c={currency.currentBalance >= 0 ? 'teal' : 'red'}
                    fw={700}
                    size="xl"
                  >
                    {currency.currentBalance.toLocaleString()}
                  </Text>
                </Stack>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
