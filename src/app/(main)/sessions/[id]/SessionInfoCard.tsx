'use client'

import { Card, Group, Stack, Text } from '@mantine/core'
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconNotes,
  IconPlayCard,
  IconTrophy,
} from '@tabler/icons-react'

import type { Session } from './types'
import {
  formatDate,
  formatSessionDuration,
  formatSessionDurationWithEvents,
} from './types'

interface SessionInfoCardProps {
  session: Session
}

export function SessionInfoCard({ session }: SessionInfoCardProps) {
  const hasEvents = session.sessionEvents.length > 0

  return (
    <Card radius="sm" shadow="xs" withBorder>
      <Stack gap="xs">
        {session.store && (
          <Group gap="xs" wrap="nowrap">
            <IconMapPin
              color="var(--mantine-color-dimmed)"
              size={16}
              style={{ flexShrink: 0 }}
            />
            <Text size="sm">{session.store.name}</Text>
          </Group>
        )}
        <Group gap="xs" wrap="nowrap">
          <IconCalendar
            color="var(--mantine-color-dimmed)"
            size={16}
            style={{ flexShrink: 0 }}
          />
          <Text size="sm">{formatDate(session.startTime)}</Text>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <IconClock
            color="var(--mantine-color-dimmed)"
            size={16}
            style={{ flexShrink: 0 }}
          />
          <Text size="sm">
            {hasEvents
              ? formatSessionDurationWithEvents(
                  session.startTime,
                  session.endTime,
                  session.sessionEvents,
                )
              : formatSessionDuration(session.startTime, session.endTime)}
          </Text>
        </Group>
        {session.cashGame && (
          <Group gap="xs" wrap="nowrap">
            <IconPlayCard
              color="var(--mantine-color-dimmed)"
              size={16}
              style={{ flexShrink: 0 }}
            />
            <Text size="sm">
              {session.cashGame.smallBlind}/{session.cashGame.bigBlind}
              {session.cashGame.currency && (
                <Text c="dimmed" component="span" ml={4} size="sm">
                  ({session.cashGame.currency.name})
                </Text>
              )}
            </Text>
          </Group>
        )}
        {session.tournament && (
          <Group gap="xs" wrap="nowrap">
            <IconTrophy
              color="var(--mantine-color-dimmed)"
              size={16}
              style={{ flexShrink: 0 }}
            />
            <Text size="sm">
              {session.tournament.name && `${session.tournament.name} / `}¥
              {session.tournament.buyIn.toLocaleString()}
              {session.tournament.rake != null && (
                <Text c="dimmed" component="span" ml={4} size="sm">
                  (Rake: ¥{session.tournament.rake.toLocaleString()})
                </Text>
              )}
            </Text>
          </Group>
        )}
        {session.notes && (
          <Group align="flex-start" gap="xs" wrap="nowrap">
            <IconNotes
              color="var(--mantine-color-dimmed)"
              size={16}
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {session.notes}
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  )
}
