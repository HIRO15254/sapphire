'use client'

import {
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
  formatBBProfitLoss,
  formatBIProfitLoss,
  formatDate,
  formatDurationShort,
  formatGameName,
  formatProfitLoss,
  getProfitLossColor,
} from '../lib/format-utils'
import type { ProfitUnit, Session } from '../lib/types'
import { SessionFAB } from './SessionFAB'

interface SessionListProps {
  sessions: Session[]
  isFiltered: boolean
  onOpenNewSession: () => void
  profitUnit: ProfitUnit
}

function formatProfit(
  profitLoss: number | null,
  session: Session,
  profitUnit: ProfitUnit,
): string {
  switch (profitUnit) {
    case 'bb':
      return formatBBProfitLoss(profitLoss, session.cashGame?.bigBlind)
    case 'bi':
      return formatBIProfitLoss(profitLoss, session.tournament?.buyIn)
    default:
      return formatProfitLoss(profitLoss)
  }
}

/**
 * Session list component.
 *
 * Displays all session cards.
 */
export function SessionList({
  sessions,
  isFiltered,
  onOpenNewSession,
  profitUnit,
}: SessionListProps) {
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
                leftSection={<IconPlus size={16} />}
                mt="md"
                onClick={onOpenNewSession}
              >
                Record New Session
              </Button>
            )}
          </Stack>
        </Card>
        <SessionFAB onOpen={onOpenNewSession} />
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
                    {formatGameName(session)}
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
              <Group gap="xs" style={{ flexShrink: 0 }} wrap="nowrap">
                <Stack align="flex-end" gap={0} style={{ lineHeight: 1.2 }}>
                  <Text
                    c={getProfitLossColor(session.profitLoss)}
                    fw={700}
                    lh={1.2}
                    size="sm"
                  >
                    {formatProfit(session.profitLoss, session, profitUnit)}
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
                        {formatProfit(
                          session.profitLoss -
                            session.allInSummary.evDifference,
                          session,
                          profitUnit,
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

      <SessionFAB onOpen={onOpenNewSession} />
    </>
  )
}
