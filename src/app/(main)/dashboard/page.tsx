'use client'

import {
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconCards,
  IconCoin,
  IconTrendingUp,
} from '@tabler/icons-react'
import Link from 'next/link'

import { api } from '~/trpc/react'

/**
 * Dashboard page.
 *
 * Displays overview of user's poker tracking data.
 */
export default function DashboardPage() {
  const { data: currencies } = api.currency.list.useQuery({
    includeArchived: false,
  })

  const totalBalance = currencies?.currencies.reduce(
    (sum: number, c) => sum + c.currentBalance,
    0,
  ) ?? 0

  return (
    <Container py="xl" size="lg">
      <Stack gap="xl">
        <Title order={1}>ダッシュボード</Title>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          <Card component={Link} href="/currencies" p="lg" radius="md" shadow="sm" withBorder>
            <Group>
              <IconCoin size={32} stroke={1.5} />
              <Stack gap={0}>
                <Text c="dimmed" size="sm">
                  通貨残高合計
                </Text>
                <Text fw={700} size="xl">
                  {totalBalance.toLocaleString()}
                </Text>
              </Stack>
            </Group>
          </Card>

          <Card component={Link} href="/sessions" p="lg" radius="md" shadow="sm" withBorder>
            <Group>
              <IconCards size={32} stroke={1.5} />
              <Stack gap={0}>
                <Text c="dimmed" size="sm">
                  セッション
                </Text>
                <Text fw={700} size="xl">
                  -
                </Text>
              </Stack>
            </Group>
          </Card>

          <Card component={Link} href="/statistics" p="lg" radius="md" shadow="sm" withBorder>
            <Group>
              <IconTrendingUp size={32} stroke={1.5} />
              <Stack gap={0}>
                <Text c="dimmed" size="sm">
                  統計
                </Text>
                <Text fw={700} size="xl">
                  -
                </Text>
              </Stack>
            </Group>
          </Card>
        </SimpleGrid>

        <Card p="lg" radius="md" shadow="sm" withBorder>
          <Stack>
            <Title order={3}>最近のアクティビティ</Title>
            <Text c="dimmed">
              セッションや取引の履歴がここに表示されます
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
