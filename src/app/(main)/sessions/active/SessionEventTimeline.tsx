'use client'

import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  Timeline,
} from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCoin,
  IconEdit,
  IconLogout,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTarget,
  IconTrash,
  IconUser,
} from '@tabler/icons-react'
import { useState } from 'react'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'

type SessionEvent =
  RouterOutputs['sessionEvent']['getActiveSession'] extends infer T
    ? T extends { sessionEvents: infer E }
      ? E extends Array<infer Item>
        ? Item
        : never
      : never
    : never

interface SessionEventTimelineProps {
  events: SessionEvent[]
}

// Amount-editable event types
const AMOUNT_EDITABLE_EVENTS = ['stack_update', 'rebuy', 'addon', 'all_in']
// Time-editable event types (all except session_start, session_end)
const TIME_EDITABLE_EVENTS_EXCLUDE = ['session_start', 'session_end']
// Deletable event types (all except session_start, session_end)
const NON_DELETABLE_EVENTS = ['session_start', 'session_end']

/**
 * Session event timeline component.
 *
 * Displays a chronological list of session events with edit/delete actions.
 */
export function SessionEventTimeline({ events }: SessionEventTimelineProps) {
  const utils = api.useUtils()

  // Modal states
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false)
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false)

  // Selected event for edit/delete
  const [selectedEvent, setSelectedEvent] = useState<SessionEvent | null>(null)
  const [editAmount, setEditAmount] = useState<number | null>(null)
  const [editTime, setEditTime] = useState<string>('')

  // Mutations
  const deleteEvent = api.sessionEvent.deleteEvent.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      closeDeleteModal()
      setSelectedEvent(null)
    },
  })

  const updateEvent = api.sessionEvent.updateEvent.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      closeEditModal()
      setSelectedEvent(null)
      setEditAmount(null)
      setEditTime('')
    },
  })

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

  /**
   * Check if event amount is editable.
   */
  const isAmountEditable = (eventType: string) =>
    AMOUNT_EDITABLE_EVENTS.includes(eventType)

  /**
   * Check if event time is editable.
   */
  const isTimeEditable = (eventType: string) =>
    !TIME_EDITABLE_EVENTS_EXCLUDE.includes(eventType)

  /**
   * Check if event is editable (amount or time).
   */
  const isEditable = (eventType: string) =>
    isAmountEditable(eventType) || isTimeEditable(eventType)

  /**
   * Check if event is deletable.
   */
  const isDeletable = (eventType: string) =>
    !NON_DELETABLE_EVENTS.includes(eventType)

  /**
   * Format time for input (HH:MM format).
   */
  const formatTimeForInput = (date: Date) => {
    const d = new Date(date)
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  /**
   * Get time bounds for editing (min/max based on adjacent events).
   */
  const getTimeBounds = (event: SessionEvent) => {
    const eventIndex = events.findIndex((e) => e.id === event.id)
    const prevEvent = eventIndex > 0 ? events[eventIndex - 1] : null
    const nextEvent =
      eventIndex < events.length - 1 ? events[eventIndex + 1] : null

    return {
      minTime: prevEvent ? new Date(prevEvent.recordedAt) : null,
      maxTime: nextEvent ? new Date(nextEvent.recordedAt) : new Date(),
    }
  }

  /**
   * Handle edit button click.
   */
  const handleEditClick = (event: SessionEvent) => {
    setSelectedEvent(event)
    const data = event.eventData as Record<string, unknown> | null
    setEditAmount((data?.amount as number) ?? null)
    setEditTime(formatTimeForInput(event.recordedAt))
    openEditModal()
  }

  /**
   * Handle delete button click.
   */
  const handleDeleteClick = (event: SessionEvent) => {
    setSelectedEvent(event)
    openDeleteModal()
  }

  /**
   * Handle edit confirm.
   */
  const handleEditConfirm = () => {
    if (!selectedEvent) return

    // Build mutation input
    const mutationInput: {
      eventId: string
      amount?: number
      recordedAt?: Date
    } = {
      eventId: selectedEvent.id,
    }

    // Include amount if this event type supports it
    if (isAmountEditable(selectedEvent.eventType) && editAmount !== null) {
      mutationInput.amount = editAmount
    }

    // Include time if changed
    if (isTimeEditable(selectedEvent.eventType) && editTime) {
      const originalTime = formatTimeForInput(selectedEvent.recordedAt)
      if (editTime !== originalTime) {
        // Parse the time and create a new date with the same date but new time
        const [hours, minutes] = editTime.split(':').map(Number)
        const newDate = new Date(selectedEvent.recordedAt)
        newDate.setHours(hours ?? 0, minutes ?? 0, 0, 0)
        mutationInput.recordedAt = newDate
      }
    }

    // Only mutate if there's something to update
    if (mutationInput.amount !== undefined || mutationInput.recordedAt !== undefined) {
      updateEvent.mutate(mutationInput)
    } else {
      // Nothing changed, just close
      closeEditModal()
      setSelectedEvent(null)
      setEditAmount(null)
      setEditTime('')
    }
  }

  /**
   * Handle delete confirm.
   */
  const handleDeleteConfirm = () => {
    if (!selectedEvent) return
    deleteEvent.mutate({
      eventId: selectedEvent.id,
    })
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
    <>
      <Timeline active={sortedEvents.length} bulletSize={24} lineWidth={2}>
        {sortedEvents.map((event) => {
          const description = getEventDescription(event)
          const canEdit = isEditable(event.eventType)
          const canDelete = isDeletable(event.eventType)

          return (
            <Timeline.Item
              bullet={getEventIcon(event.eventType)}
              color={getEventColor(event.eventType)}
              key={event.id}
            >
              <Group gap="xs" justify="space-between" wrap="nowrap">
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
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

                {/* Action buttons */}
                {(canEdit || canDelete) && (
                  <Group gap={4}>
                    {canEdit && (
                      <ActionIcon
                        color="blue"
                        onClick={() => handleEditClick(event)}
                        size="sm"
                        variant="subtle"
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                    )}
                    {canDelete && (
                      <ActionIcon
                        color="red"
                        onClick={() => handleDeleteClick(event)}
                        size="sm"
                        variant="subtle"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                )}
              </Group>
            </Timeline.Item>
          )
        })}
      </Timeline>

      {/* Edit Modal */}
      <Modal
        onClose={() => {
          closeEditModal()
          setSelectedEvent(null)
          setEditAmount(null)
          setEditTime('')
        }}
        opened={editModalOpened}
        title="イベントを編集"
      >
        <Stack gap="md">
          {selectedEvent && (
            <Text c="dimmed" size="sm">
              {getEventLabel(selectedEvent.eventType)}を編集します
            </Text>
          )}

          {/* Amount input - only for amount-editable events */}
          {selectedEvent && isAmountEditable(selectedEvent.eventType) && (
            <NumberInput
              hideControls
              label="金額"
              min={0}
              onChange={(val) =>
                setEditAmount(typeof val === 'number' ? val : null)
              }
              thousandSeparator=","
              value={editAmount ?? ''}
            />
          )}

          {/* Time input - for time-editable events */}
          {selectedEvent && isTimeEditable(selectedEvent.eventType) && (
            <TimeInput
              description={(() => {
                const bounds = getTimeBounds(selectedEvent)
                const parts: string[] = []
                if (bounds.minTime) {
                  parts.push(`${formatTimeForInput(bounds.minTime)}より後`)
                }
                if (bounds.maxTime) {
                  parts.push(`${formatTimeForInput(bounds.maxTime)}より前`)
                }
                return parts.length > 0 ? parts.join('、') : undefined
              })()}
              label="時間"
              onChange={(e) => setEditTime(e.currentTarget.value)}
              value={editTime}
            />
          )}

          <Group justify="flex-end">
            <Button
              onClick={() => {
                closeEditModal()
                setSelectedEvent(null)
                setEditAmount(null)
                setEditTime('')
              }}
              variant="subtle"
            >
              キャンセル
            </Button>
            <Button
              loading={updateEvent.isPending}
              onClick={handleEditConfirm}
            >
              更新
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        onClose={() => {
          closeDeleteModal()
          setSelectedEvent(null)
        }}
        opened={deleteModalOpened}
        title="イベントを削除"
      >
        <Stack gap="md">
          {selectedEvent &&
          (selectedEvent.eventType === 'session_pause' ||
            selectedEvent.eventType === 'session_resume') ? (
            <Text>
              一時停止と再開はペアで削除されます。このペアを削除しますか？
            </Text>
          ) : (
            <Text>このイベントを削除しますか？</Text>
          )}
          {selectedEvent && (
            <Text c="dimmed" size="sm">
              {getEventLabel(selectedEvent.eventType)}
              {getEventDescription(selectedEvent)
                ? ` - ${getEventDescription(selectedEvent)}`
                : ''}
            </Text>
          )}
          <Group justify="flex-end">
            <Button
              onClick={() => {
                closeDeleteModal()
                setSelectedEvent(null)
              }}
              variant="subtle"
            >
              キャンセル
            </Button>
            <Button
              color="red"
              loading={deleteEvent.isPending}
              onClick={handleDeleteConfirm}
            >
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
