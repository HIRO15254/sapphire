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
import { IconCards, IconCoin, IconTrendingUp } from '@tabler/icons-react'
import Link from 'next/link'
import { usePageTitle } from '~/contexts/PageTitleContext'

interface DashboardContentProps {
  totalBalance: number
}

/**
 * Dashboard content client component.
 *
 * Displays dashboard UI with data passed from server component.
 */
export function DashboardContent({ totalBalance }: DashboardContentProps) {
  usePageTitle('ダッシュボード')

  return (
    <Container py="xl" size="lg">
      <Stack gap="xl">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          <Card
            component={Link}
            href="/currencies"
            p="lg"
            radius="md"
            shadow="sm"
            withBorder
          >
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

          <Card
            component={Link}
            href="/sessions"
            p="lg"
            radius="md"
            shadow="sm"
            withBorder
          >
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

          <Card
            component={Link}
            href="/statistics"
            p="lg"
            radius="md"
            shadow="sm"
            withBorder
          >
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
            <Text c="dimmed">セッションや取引の履歴がここに表示されます</Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
