'use client'

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconPlus } from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'

type Currency = RouterOutputs['currency']['list']['currencies'][number]

interface CurrenciesContentProps {
  initialCurrencies: Currency[]
}

/**
 * Currency list content client component.
 *
 * Displays all currencies with balance information.
 * Uses initial data from server, allows filtering on client.
 */
export function CurrenciesContent({
  initialCurrencies,
}: CurrenciesContentProps) {
  const [includeArchived, setIncludeArchived] = useState(false)

  // Fetch archived data only when includeArchived is true
  const { data, isLoading, error } = api.currency.list.useQuery(
    { includeArchived: true },
    {
      enabled: includeArchived,
    },
  )

  // Use server data by default, switch to query data when includeArchived is true
  const currencies = includeArchived
    ? (data?.currencies ?? [])
    : initialCurrencies

  if (includeArchived && isLoading) {
    return (
      <Container py="xl" size="md">
        <Stack align="center" gap="lg">
          <Loader size="lg" />
          <Text c="dimmed">読み込み中...</Text>
        </Stack>
      </Container>
    )
  }

  if (includeArchived && error) {
    return (
      <Container py="xl" size="md">
        <Alert color="red" icon={<IconAlertCircle size={16} />} title="エラー">
          {error.message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>通貨管理</Title>
          <Button
            component={Link}
            href="/currencies/new"
            leftSection={<IconPlus size={16} />}
          >
            新しい通貨を追加
          </Button>
        </Group>

        <Checkbox
          checked={includeArchived}
          label="アーカイブ済みを表示"
          onChange={(event) => setIncludeArchived(event.currentTarget.checked)}
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
                component={Link}
                href="/currencies/new"
                leftSection={<IconPlus size={16} />}
                mt="md"
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
                  <Stack gap="xs">
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
                    <Text c="dimmed" size="sm">
                      初期残高: {currency.initialBalance.toLocaleString()}
                    </Text>
                  </Stack>
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
    </Container>
  )
}
