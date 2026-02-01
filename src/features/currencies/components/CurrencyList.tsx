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
    <Stack gap="sm">
      <Checkbox
        checked={includeArchived}
        label="Show archived"
        onChange={(event) => onIncludeArchivedChange(event.currentTarget.checked)}
        size="xs"
      />

      {currencies.length === 0 ? (
        <Card p="xl" radius="md" shadow="sm" withBorder>
          <Stack align="center" gap="md">
            <Text c="dimmed" size="lg">
              No currencies registered
            </Text>
            <Text c="dimmed" size="sm">
              Add a currency to start tracking your poker sessions
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              mt="md"
              onClick={onOpenNewCurrency}
            >
              Add Currency
            </Button>
          </Stack>
        </Card>
      ) : (
        <Stack gap="xs">
          {currencies.map((currency) => (
            <Card
              component={Link}
              href={`/currencies/${currency.id}`}
              key={currency.id}
              px="sm"
              py="xs"
              radius="sm"
              shadow="xs"
              style={{ textDecoration: 'none', cursor: 'pointer' }}
              withBorder
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="xs" wrap="nowrap">
                  <Text fw={500} size="sm" truncate>
                    {currency.name}
                  </Text>
                  {currency.isArchived && (
                    <Text c="dimmed" size="xs">
                      (Archived)
                    </Text>
                  )}
                </Group>
                <Text
                  c={currency.currentBalance >= 0 ? 'teal' : 'red'}
                  fw={700}
                  size="sm"
                  style={{ flexShrink: 0 }}
                >
                  {currency.currentBalance.toLocaleString()}
                </Text>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
