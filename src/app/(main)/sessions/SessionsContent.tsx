'use client'

import {
  Alert,
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
  IconMapPin,
  IconPlus,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'
import { GameTypeBadge } from '~/components/sessions/GameTypeBadge'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'
import {
  formatDate,
  formatDurationShort,
  formatProfitLoss,
  getProfitLossColor,
} from './[id]/types'

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
   * Get game display name.
   */
  const getGameName = (session: Session) => {
    if (session.cashGame) {
      return `${session.cashGame.smallBlind}/${session.cashGame.bigBlind}`
    }
    if (session.tournament) {
      return (
        session.tournament.name ??
        `¥${session.tournament.buyIn.toLocaleString()}`
      )
    }
    return '-'
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
          <Stack gap="xs">
            {sessions.map((session) => (
              <Card
                component={Link}
                href={`/sessions/${session.id}`}
                key={session.id}
                px="sm"
                py="xs"
                radius="sm"
                shadow="xs"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
                withBorder
              >
                <Group justify="space-between" wrap="nowrap">
                  {/* Left: Badge, Game name + Date, Store */}
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Group gap="xs" wrap="nowrap">
                      <GameTypeBadge gameType={session.gameType} size="xs" />
                      <Text fw={500} size="sm" truncate>
                        {getGameName(session)}
                      </Text>
                    </Group>
                    <Group gap="sm" wrap="nowrap">
                      <Group gap={4} wrap="nowrap">
                        <IconCalendar
                          size={12}
                          style={{ color: 'var(--mantine-color-dimmed)' }}
                        />
                        <Text c="dimmed" size="xs">
                          {formatDate(session.startTime)}
                        </Text>
                      </Group>
                      {session.store && (
                        <Group gap={4} style={{ minWidth: 0 }} wrap="nowrap">
                          <IconMapPin
                            size={12}
                            style={{
                              color: 'var(--mantine-color-dimmed)',
                              flexShrink: 0,
                            }}
                          />
                          <Text c="dimmed" size="xs" truncate>
                            {session.store.name}
                          </Text>
                        </Group>
                      )}
                    </Group>
                  </Stack>
                  {/* Right: Profit/Loss (with EV below) / Duration */}
                  <Group gap="xs" wrap="nowrap">
                    <Stack align="flex-end" gap={0} style={{ lineHeight: 1.2 }}>
                      <Text
                        c={getProfitLossColor(session.profitLoss)}
                        fw={700}
                        size="sm"
                        lh={1.2}
                      >
                        {formatProfitLoss(session.profitLoss)}
                      </Text>
                      {session.allInSummary &&
                        session.allInSummary.count > 0 &&
                        session.profitLoss !== null && (
                          <Text
                            c={getProfitLossColor(
                              session.profitLoss -
                                session.allInSummary.evDifference,
                            )}
                            size="xs"
                            lh={1.2}
                          >
                            (EV:{' '}
                            {formatProfitLoss(
                              session.profitLoss -
                                session.allInSummary.evDifference,
                            )}
                            )
                          </Text>
                        )}
                    </Stack>
                    <Text c="dimmed" size="xs">
                      /{' '}
                      {formatDurationShort(session.startTime, session.endTime)}
                    </Text>
                  </Group>
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
