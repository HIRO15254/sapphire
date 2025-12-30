'use client'

import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Pagination,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCalendar,
  IconPlus,
  IconPokerChip,
  IconTrendingDown,
  IconTrendingUp,
  IconTrophy,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'

type Session = RouterOutputs['session']['list']['sessions'][number]

interface SessionsContentProps {
  initialSessions: Session[]
  initialTotal: number
}

/**
 * Session list content client component.
 *
 * Displays all sessions with profit/loss and pagination.
 * Uses initial data from server, fetches more on page change.
 */
export function SessionsContent({
  initialSessions,
  initialTotal,
}: SessionsContentProps) {
  const [page, setPage] = useState(1)
  const limit = 20

  // Fetch paginated data when page > 1
  const { data, isLoading, error } = api.session.list.useQuery(
    { limit, offset: (page - 1) * limit },
    {
      enabled: page > 1,
    },
  )

  // Use server data for page 1, query data for other pages
  const sessions = page === 1 ? initialSessions : (data?.sessions ?? [])
  const total = page === 1 ? initialTotal : (data?.total ?? 0)

  const totalPages = Math.ceil(total / limit)

  /**
   * Format date to Japanese locale string.
   */
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  /**
   * Format profit/loss with + or - prefix.
   */
  const formatProfitLoss = (profitLoss: number | null) => {
    if (profitLoss === null) return '-'
    const formatted = Math.abs(profitLoss).toLocaleString('ja-JP')
    if (profitLoss > 0) return `+${formatted}`
    if (profitLoss < 0) return `-${formatted}`
    return formatted
  }

  /**
   * Get color based on profit/loss.
   */
  const getProfitLossColor = (profitLoss: number | null) => {
    if (profitLoss === null) return 'dimmed'
    if (profitLoss > 0) return 'green'
    if (profitLoss < 0) return 'red'
    return 'dimmed'
  }

  if (page > 1 && isLoading) {
    return (
      <Container py="xl" size="md">
        <Stack align="center" gap="lg">
          <Loader size="lg" />
          <Text c="dimmed">読み込み中...</Text>
        </Stack>
      </Container>
    )
  }

  if (page > 1 && error) {
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
          <Title order={1}>セッション履歴</Title>
          {sessions.length > 0 && (
            <Button
              component={Link}
              href="/sessions/new"
              leftSection={<IconPlus size={16} />}
            >
              新しいセッションを記録
            </Button>
          )}
        </Group>

        {sessions.length === 0 ? (
          <Card p="xl" radius="md" shadow="sm" withBorder>
            <Stack align="center" gap="md">
              <Text c="dimmed" size="lg">
                セッションが記録されていません
              </Text>
              <Text c="dimmed" size="sm">
                新しいセッションを記録して、収支の分析を始めましょう
              </Text>
              <Button
                component={Link}
                href="/sessions/new"
                leftSection={<IconPlus size={16} />}
                mt="md"
              >
                新しいセッションを記録
              </Button>
            </Stack>
          </Card>
        ) : (
          <Stack gap="md">
            {sessions.map((session) => (
              <Card
                component={Link}
                href={`/sessions/${session.id}`}
                key={session.id}
                p="lg"
                radius="md"
                shadow="sm"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
                withBorder
              >
                <Group justify="space-between">
                  <Stack gap="xs">
                    <Group gap="sm">
                      <Group gap={4}>
                        <IconCalendar size={14} style={{ color: 'gray' }} />
                        <Text c="dimmed" size="sm">
                          {formatDate(session.startTime)}
                        </Text>
                      </Group>
                      {session.gameType === 'tournament' ? (
                        <Badge
                          color="grape"
                          leftSection={<IconTrophy size={10} />}
                          size="sm"
                        >
                          トーナメント
                        </Badge>
                      ) : (
                        <Badge
                          color="blue"
                          leftSection={<IconPokerChip size={10} />}
                          size="sm"
                        >
                          キャッシュ
                        </Badge>
                      )}
                    </Group>
                    {session.store && (
                      <Text fw={500} size="md">
                        {session.store.name}
                      </Text>
                    )}
                    {session.cashGame && (
                      <Text c="dimmed" size="sm">
                        {session.cashGame.smallBlind}/{session.cashGame.bigBlind}
                      </Text>
                    )}
                    {session.tournament && (
                      <Text c="dimmed" size="sm">
                        {session.tournament.name ?? session.tournament.buyIn.toLocaleString()}
                      </Text>
                    )}
                  </Stack>
                  <Stack align="flex-end" gap="xs">
                    <Group gap={4}>
                      {session.profitLoss !== null && session.profitLoss > 0 && (
                        <IconTrendingUp
                          size={20}
                          style={{ color: 'var(--mantine-color-green-6)' }}
                        />
                      )}
                      {session.profitLoss !== null && session.profitLoss < 0 && (
                        <IconTrendingDown
                          size={20}
                          style={{ color: 'var(--mantine-color-red-6)' }}
                        />
                      )}
                      <Stack align="flex-end" gap={0}>
                        <Text
                          c={getProfitLossColor(session.profitLoss)}
                          fw={700}
                          size="xl"
                        >
                          {formatProfitLoss(session.profitLoss)}
                        </Text>
                        {session.allInSummary &&
                          session.allInSummary.count > 0 &&
                          session.profitLoss !== null && (
                            <Text
                              c={getProfitLossColor(
                                session.profitLoss - session.allInSummary.evDifference,
                              )}
                              size="xs"
                            >
                              (EV: {formatProfitLoss(
                                session.profitLoss - session.allInSummary.evDifference,
                              )})
                            </Text>
                          )}
                      </Stack>
                    </Group>
                    <Group gap="xs">
                      <Text c="dimmed" size="xs">
                        Buy-in: {session.buyIn.toLocaleString()}
                      </Text>
                      <Text c="dimmed" size="xs">
                        Cash-out: {(session.cashOut ?? 0).toLocaleString()}
                      </Text>
                    </Group>
                  </Stack>
                </Group>
              </Card>
            ))}

            {totalPages > 1 && (
              <Group justify="center" mt="lg">
                <Pagination
                  onChange={setPage}
                  total={totalPages}
                  value={page}
                />
              </Group>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
