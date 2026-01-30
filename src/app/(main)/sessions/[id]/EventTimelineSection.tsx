'use client'

import {
  Badge,
  Card,
  Collapse,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import {
  IconCards,
  IconChevronDown,
  IconChevronUp,
  IconClockPause,
  IconCoins,
  IconLogout,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTarget,
  IconUser,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import type { AllInRecord } from './types'
import {
  type TimelineAllInRecord,
  type TimelineEvent,
  formatAllInDescription,
  formatTimelineTime,
  getEventColor,
  getEventDescription,
  getEventLabel,
  groupTimelineItems,
} from './timelineGrouping'

interface EventTimelineSectionProps {
  events: TimelineEvent[]
  allInRecords: AllInRecord[]
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'session_start':
    case 'session_resume':
      return <IconPlayerPlay size={14} />
    case 'session_pause':
      return <IconPlayerPause size={14} />
    case 'session_end':
      return <IconLogout size={14} />
    case 'player_seated':
      return <IconUser size={14} />
    case 'stack_update':
      return <IconCoins size={14} />
    case 'rebuy':
    case 'addon':
      return <IconPlus size={14} />
    case 'all_in':
      return <IconTarget size={14} />
    default:
      return <IconCoins size={14} />
  }
}

export function EventTimelineSection({
  events,
  allInRecords,
}: EventTimelineSectionProps) {
  const [opened, setOpened] = useState(false)

  const timelineItems = useMemo(
    () =>
      groupTimelineItems(
        events,
        allInRecords as unknown as TimelineAllInRecord[],
      ),
    [events, allInRecords],
  )

  return (
    <Card radius="sm" shadow="xs" withBorder>
      <UnstyledButton
        onClick={() => setOpened((o) => !o)}
        style={{ width: '100%' }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Text fw={500}>イベント履歴</Text>
          {opened ? (
            <IconChevronUp size={18} />
          ) : (
            <IconChevronDown size={18} />
          )}
        </Group>
      </UnstyledButton>

      <Collapse in={opened}>
        <Stack gap="xs" mt="sm">
          {timelineItems.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center">
              イベントがありません
            </Text>
          ) : (
            timelineItems.map((item, index) => {
              if (item.kind === 'hands') {
                return (
                  <Group gap="xs" key={`hands-${index}`} wrap="nowrap">
                    <Badge
                      color="violet"
                      leftSection={<IconCards size={12} />}
                      size="sm"
                      variant="light"
                    >
                      {item.count}ハンド
                    </Badge>
                    <Text c="dimmed" size="xs">
                      {formatTimelineTime(item.startTime)} -{' '}
                      {formatTimelineTime(item.endTime)}
                    </Text>
                  </Group>
                )
              }

              if (item.kind === 'pauseResume') {
                return (
                  <Group
                    gap="xs"
                    key={`pause-${item.pauseEvent.id}`}
                    wrap="nowrap"
                  >
                    <Badge
                      color="gray"
                      leftSection={<IconClockPause size={12} />}
                      size="sm"
                      variant="light"
                    >
                      休憩 {item.durationMinutes}分
                    </Badge>
                    <Text c="dimmed" size="xs">
                      {formatTimelineTime(item.pauseEvent.recordedAt)} -{' '}
                      {formatTimelineTime(item.resumeEvent.recordedAt)}
                    </Text>
                  </Group>
                )
              }

              if (item.kind === 'ongoingBreak') {
                return (
                  <Group
                    gap="xs"
                    key={`ongoing-${item.pauseEvent.id}`}
                    wrap="nowrap"
                  >
                    <Badge
                      color="gray"
                      leftSection={<IconClockPause size={12} />}
                      size="sm"
                      variant="light"
                    >
                      休憩中
                    </Badge>
                    <Text c="dimmed" size="xs">
                      {formatTimelineTime(item.pauseEvent.recordedAt)} -
                    </Text>
                  </Group>
                )
              }

              if (item.kind === 'allIn') {
                return (
                  <Group
                    gap="xs"
                    key={`allIn-${item.allIn.id}`}
                    wrap="nowrap"
                  >
                    <Badge
                      color="pink"
                      leftSection={<IconTarget size={12} />}
                      size="sm"
                      variant="light"
                    >
                      オールイン
                    </Badge>
                    <Text size="xs" style={{ flex: 1, minWidth: 0 }} truncate>
                      {formatAllInDescription(item.allIn)}
                    </Text>
                    <Text c="dimmed" size="xs">
                      {formatTimelineTime(item.allIn.recordedAt)}
                    </Text>
                  </Group>
                )
              }

              // Regular event
              const event = item.event
              const description = getEventDescription(event)
              const color = getEventColor(event.eventType)
              const label = getEventLabel(event.eventType)

              return (
                <Group gap="xs" key={event.id} wrap="nowrap">
                  <Badge
                    color={color}
                    leftSection={getEventIcon(event.eventType)}
                    size="sm"
                    variant="light"
                  >
                    {label}
                  </Badge>
                  {description && (
                    <Text size="xs" style={{ flex: 1, minWidth: 0 }} truncate>
                      {description}
                    </Text>
                  )}
                  <Text c="dimmed" size="xs">
                    {formatTimelineTime(event.recordedAt)}
                  </Text>
                </Group>
              )
            })
          )}
        </Stack>
      </Collapse>
    </Card>
  )
}
