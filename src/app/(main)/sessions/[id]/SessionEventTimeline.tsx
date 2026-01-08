'use client'

import { Badge, Group, Stack, Text, Timeline } from '@mantine/core'
import {
  IconCoin,
  IconLogout,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTarget,
  IconUser,
} from '@tabler/icons-react'

import type { Session } from './types'

type SessionEvent = Session['sessionEvents'][number]

interface SessionEventTimelineProps {
  events: SessionEvent[]
}

/**
 * Read-only session event timeline component for session detail page.
 *
 * Displays a chronological list of session events without edit/delete actions.
 */
export function SessionEventTimeline({ events }: SessionEventTimelineProps) {
  /**
   * Format timestamp to Japanese locale string.
   */
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * Get icon for event type.
   */
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'session_start':
        return <IconPlayerPlay size={16} />
      case 'session_resume':
        return <IconPlayerPlay size={16} />
      case 'session_pause':
        return <IconPlayerPause size={16} />
      case 'session_end':
        return <IconLogout size={16} />
      case 'player_seated':
        return <IconUser size={16} />
      case 'stack_update':
        return <IconCoin size={16} />
      case 'rebuy':
        return <IconPlus size={16} />
      case 'addon':
        return <IconPlus size={16} />
      case 'all_in':
        return <IconTarget size={16} />
      default:
        return <IconCoin size={16} />
    }
  }

  /**
   * Get color for event type.
   */
  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'session_start':
        return 'green'
      case 'session_resume':
        return 'green'
      case 'session_pause':
        return 'gray'
      case 'session_end':
        return 'red'
      case 'player_seated':
        return 'cyan'
      case 'stack_update':
        return 'blue'
      case 'rebuy':
        return 'orange'
      case 'addon':
        return 'teal'
      case 'all_in':
        return 'pink'
      default:
        return 'gray'
    }
  }

  /**
   * Get label for event type.
   */
  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'session_start':
        return 'セッション開始'
      case 'session_resume':
        return '再開'
      case 'session_pause':
        return '一時停止'
      case 'session_end':
        return 'セッション終了'
      case 'player_seated':
        return 'プレイヤー着席'
      case 'hand_recorded':
        return 'ハンド記録'
      case 'hands_passed':
        return 'ハンド経過'
      case 'stack_update':
        return 'スタック更新'
      case 'rebuy':
        return '追加Buy-in'
      case 'addon':
        return 'アドオン'
      case 'all_in':
        return 'オールイン'
      default:
        return eventType
    }
  }

  /**
   * Get description for event.
   */
  const getEventDescription = (event: SessionEvent) => {
    const data = event.eventData as Record<string, unknown> | null

    switch (event.eventType) {
      case 'session_end':
        return data?.cashOut
          ? `キャッシュアウト: ${(data.cashOut as number).toLocaleString()}`
          : null
      case 'player_seated':
        return data?.playerName
          ? `${data.playerName as string} (席${data.seatNumber as number})`
          : null
      case 'stack_update':
        return data?.amount
          ? `スタック: ${(data.amount as number).toLocaleString()}`
          : null
      case 'rebuy':
        return data?.amount
          ? `+${(data.amount as number).toLocaleString()}`
          : null
      case 'addon':
        return data?.amount
          ? `+${(data.amount as number).toLocaleString()}`
          : null
      case 'all_in':
        return data?.amount
          ? `スタック: ${(data.amount as number).toLocaleString()}`
          : null
      case 'hands_passed':
        return data?.count ? `${data.count as number}ハンド` : null
      default:
        return null
    }
  }

  if (events.length === 0) {
    return (
      <Text c="dimmed" ta="center">
        イベントがありません
      </Text>
    )
  }

  // Sort events by sequence (newest first for display)
  const sortedEvents = [...events].reverse()

  return (
    <Timeline active={sortedEvents.length} bulletSize={24} lineWidth={2}>
      {sortedEvents.map((event) => {
        const description = getEventDescription(event)

        return (
          <Timeline.Item
            bullet={getEventIcon(event.eventType)}
            color={getEventColor(event.eventType)}
            key={event.id}
          >
            <Stack gap={4}>
              <Group gap="xs">
                <Badge color={getEventColor(event.eventType)} size="sm">
                  {getEventLabel(event.eventType)}
                </Badge>
                <Text c="dimmed" size="xs">
                  {formatTime(event.recordedAt)}
                </Text>
              </Group>
              {description && <Text size="sm">{description}</Text>}
            </Stack>
          </Timeline.Item>
        )
      })}
    </Timeline>
  )
}
