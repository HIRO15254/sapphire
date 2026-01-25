'use client'

import {
  ActionIcon,
  Affix,
  Button,
  Card,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import { IconCalendar, IconMapPin, IconPlus } from '@tabler/icons-react'
import Link from 'next/link'
import { GameTypeBadge } from '~/components/sessions/GameTypeBadge'
import {
  formatDate,
  formatDurationShort,
  formatProfitLoss,
  getProfitLossColor,
} from './[id]/types'

interface Session {
  id: string
  gameType: string | null
  startTime: Date
  endTime: Date | null
  profitLoss: number | null
  store: { name: string } | null
  cashGame: { smallBlind: number; bigBlind: number } | null
  tournament: { name: string | null; buyIn: number } | null
  allInSummary: {
    count: number
    evDifference: number
  } | null
}

interface SessionListProps {
  sessions: Session[]
  isFiltered: boolean
}

/**
 * Session list component.
 *
 * Displays all session cards.
 */
export function SessionList({ sessions, isFiltered }: SessionListProps) {
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

  // Empty state
  if (sessions.length === 0) {
    return (
      <>
        <Card p="xl" radius="md" shadow="sm" withBorder>
          <Stack align="center" gap="md">
            <Text c="dimmed" size="lg">
              {isFiltered
                ? 'No sessions match filters'
                : 'No sessions recorded'}
            </Text>
            <Text c="dimmed" size="sm">
              {isFiltered
                ? 'Try adjusting your filters'
                : 'Record a new session to start analyzing your results'}
            </Text>
            {!isFiltered && (
              <Button
                component={Link}
                href="/sessions/new"
                leftSection={<IconPlus size={16} />}
                mt="md"
              >
                Record New Session
              </Button>
            )}
          </Stack>
        </Card>
        <SessionFAB />
      </>
    )
  }

  return (
    <>
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
                  <GameTypeBadge
                    gameType={session.gameType}
                    iconOnly
                    size="xs"
                  />
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
                    lh={1.2}
                    size="sm"
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
                        lh={1.2}
                        size="xs"
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
                  / {formatDurationShort(session.startTime, session.endTime)}
                </Text>
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>

      <SessionFAB />
    </>
  )
}

/**
 * Floating action button for adding new session.
 */
function SessionFAB() {
  return (
    <Affix position={{ bottom: 24, right: 24 }} zIndex={100}>
      <ActionIcon
        aria-label="Record new session"
        color="blue"
        component={Link}
        href="/sessions/new"
        radius="xl"
        size={56}
        variant="filled"
      >
        <IconPlus size={28} />
      </ActionIcon>
    </Affix>
  )
}
