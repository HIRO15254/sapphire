'use client'

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  ScrollArea,
  Stack,
  Text,
  Timeline,
} from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconCards,
  IconClockPause,
  IconCoins,
  IconEdit,
  IconLogout,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTarget,
  IconTrash,
  IconUser,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
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

type AllInRecord =
  RouterOutputs['sessionEvent']['getActiveSession'] extends infer T
    ? T extends { allInRecords: infer R }
      ? R extends Array<infer Item>
        ? Item
        : never
      : never
    : never

interface SessionEventTimelineProps {
  events: SessionEvent[]
  allInRecords?: AllInRecord[]
  onEditAllIn?: (allIn: AllInRecord) => void
}

// Amount-editable event types
const AMOUNT_EDITABLE_EVENTS = ['stack_update', 'rebuy', 'addon']
// Time-editable event types (all except session_start, session_end)
const TIME_EDITABLE_EVENTS_EXCLUDE = ['session_start', 'session_end']
// Deletable event types (all except session_start, session_end)
const NON_DELETABLE_EVENTS = ['session_start', 'session_end']

// Unified timeline item type
type TimelineItemType =
  | { kind: 'event'; event: SessionEvent }
  | { kind: 'allIn'; allIn: AllInRecord }
  | { kind: 'hands'; count: number; startTime: Date; endTime: Date }
  | { kind: 'pauseResume'; pauseEvent: SessionEvent; resumeEvent: SessionEvent; durationMinutes: number }
  | { kind: 'ongoingBreak'; pauseEvent: SessionEvent }

/**
 * Session event timeline component.
 *
 * Displays a chronological list of session events with edit/delete actions.
 * Features:
 * - Groups consecutive hand events into a single "x hands" item
 * - Shows all-in records with edit/delete capability
 * - Groups pause/resume pairs into single items
 */
export function SessionEventTimeline({
  events,
  allInRecords = [],
  onEditAllIn,
}: SessionEventTimelineProps) {
  const utils = api.useUtils()

  // Modal states
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false)
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false)
  const [
    deleteAllInModalOpened,
    { open: openDeleteAllInModal, close: closeDeleteAllInModal },
  ] = useDisclosure(false)
  const [
    editBreakModalOpened,
    { open: openEditBreakModal, close: closeEditBreakModal },
  ] = useDisclosure(false)

  // Selected event for edit/delete
  const [selectedEvent, setSelectedEvent] = useState<SessionEvent | null>(null)
  const [selectedAllIn, setSelectedAllIn] = useState<AllInRecord | null>(null)
  const [editAmount, setEditAmount] = useState<number | null>(null)
  const [editTime, setEditTime] = useState<string>('')

  // Selected break (pause/resume pair or ongoing) for edit/delete
  const [selectedBreak, setSelectedBreak] = useState<{
    pauseEvent: SessionEvent
    resumeEvent?: SessionEvent  // Optional for ongoing breaks
  } | null>(null)
  const [editBreakStartTime, setEditBreakStartTime] = useState<string>('')
  const [editBreakEndTime, setEditBreakEndTime] = useState<string>('')

  // Delete break modal
  const [
    deleteBreakModalOpened,
    { open: openDeleteBreakModal, close: closeDeleteBreakModal },
  ] = useDisclosure(false)

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

  const deleteAllIn = api.allIn.delete.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      closeDeleteAllInModal()
      setSelectedAllIn(null)
    },
  })

  /**
   * Build unified timeline items from events and all-in records.
   */
  const timelineItems = useMemo(() => {
    const items: TimelineItemType[] = []

    // Process events into groups
    let i = 0
    while (i < events.length) {
      const event = events[i]
      if (!event) {
        i++
        continue
      }

      // Group hand_complete and hands_passed events
      if (event.eventType === 'hand_complete' || event.eventType === 'hands_passed') {
        let handCount = 0
        const startTime = new Date(event.recordedAt)
        let endTime = startTime

        while (i < events.length) {
          const current = events[i]
          if (!current) break

          if (current.eventType === 'hand_complete') {
            handCount += 1
            endTime = new Date(current.recordedAt)
            i++
          } else if (current.eventType === 'hands_passed') {
            const data = current.eventData as Record<string, unknown> | null
            handCount += (data?.count as number) ?? 0
            endTime = new Date(current.recordedAt)
            i++
          } else {
            break
          }
        }

        if (handCount > 0) {
          items.push({ kind: 'hands', count: handCount, startTime, endTime })
        }
        continue
      }

      // Group pause/resume pairs
      if (event.eventType === 'session_pause') {
        // Look for corresponding resume
        const resumeIndex = events.slice(i + 1).findIndex(
          (e) => e.eventType === 'session_resume'
        )

        if (resumeIndex !== -1) {
          const resumeEvent = events[i + 1 + resumeIndex]
          if (resumeEvent) {
            const pauseTime = new Date(event.recordedAt).getTime()
            const resumeTime = new Date(resumeEvent.recordedAt).getTime()
            const durationMinutes = Math.round((resumeTime - pauseTime) / (1000 * 60))

            items.push({
              kind: 'pauseResume',
              pauseEvent: event,
              resumeEvent,
              durationMinutes,
            })

            // Skip to after resume event
            i = i + 1 + resumeIndex + 1
            continue
          }
        }

        // Unpaired pause - show as ongoing break
        items.push({ kind: 'ongoingBreak', pauseEvent: event })
        i++
        continue
      }

      // Skip session_resume if we haven't paired it (shouldn't happen normally)
      if (event.eventType === 'session_resume') {
        // Check if this was already paired - if so skip
        const prevPauseIndex = events.slice(0, i).reverse().findIndex(
          (e) => e.eventType === 'session_pause'
        )
        if (prevPauseIndex !== -1) {
          // Check if there's no resume between that pause and this one
          const pauseActualIndex = i - 1 - prevPauseIndex
          const hasPriorResume = events.slice(pauseActualIndex + 1, i).some(
            (e) => e.eventType === 'session_resume'
          )
          if (!hasPriorResume) {
            // This is a paired resume, skip
            i++
            continue
          }
        }
        // Unpaired resume - show as regular event
        items.push({ kind: 'event', event })
        i++
        continue
      }

      // Regular event
      items.push({ kind: 'event', event })
      i++
    }

    // Add all-in records
    for (const allIn of allInRecords) {
      items.push({ kind: 'allIn', allIn })
    }

    // Sort by time (get the representative time for each item)
    const getItemTime = (item: TimelineItemType): number => {
      switch (item.kind) {
        case 'event':
          return new Date(item.event.recordedAt).getTime()
        case 'allIn':
          return new Date(item.allIn.recordedAt).getTime()
        case 'hands':
          return item.endTime.getTime()
        case 'pauseResume':
          return new Date(item.resumeEvent.recordedAt).getTime()
        case 'ongoingBreak':
          return new Date(item.pauseEvent.recordedAt).getTime()
      }
    }

    items.sort((a, b) => getItemTime(a) - getItemTime(b))

    // Reverse for newest first
    return items.reverse()
  }, [events, allInRecords])

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
        return <IconCoins size={16} />
      case 'rebuy':
        return <IconPlus size={16} />
      case 'addon':
        return <IconPlus size={16} />
      case 'all_in':
        return <IconTarget size={16} />
      default:
        return <IconCoins size={16} />
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
   * Get time bounds for break editing.
   * For start time: after previous event, before end time
   * For end time: after start time, before next event
   */
  const getBreakTimeBounds = () => {
    if (!selectedBreak) return { startMin: null, startMax: null, endMin: null, endMax: null }

    const pauseIndex = events.findIndex((e) => e.id === selectedBreak.pauseEvent.id)
    const prevEvent = pauseIndex > 0 ? events[pauseIndex - 1] : null

    if (selectedBreak.resumeEvent) {
      // Completed break
      const resumeIndex = events.findIndex((e) => e.id === selectedBreak.resumeEvent?.id)
      const nextEvent = resumeIndex < events.length - 1 ? events[resumeIndex + 1] : null

      return {
        startMin: prevEvent ? new Date(prevEvent.recordedAt) : null,
        startMax: new Date(selectedBreak.resumeEvent.recordedAt), // Must be before end time
        endMin: new Date(selectedBreak.pauseEvent.recordedAt), // Must be after start time
        endMax: nextEvent ? new Date(nextEvent.recordedAt) : new Date(),
      }
    }

    // Ongoing break (no resume)
    const nextEvent = pauseIndex < events.length - 1 ? events[pauseIndex + 1] : null
    return {
      startMin: prevEvent ? new Date(prevEvent.recordedAt) : null,
      startMax: nextEvent ? new Date(nextEvent.recordedAt) : new Date(),
      endMin: null,
      endMax: null,
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
   * Handle all-in edit button click.
   */
  const handleAllInEditClick = (allIn: AllInRecord) => {
    if (onEditAllIn) {
      onEditAllIn(allIn)
    }
  }

  /**
   * Handle all-in delete button click.
   */
  const handleAllInDeleteClick = (allIn: AllInRecord) => {
    setSelectedAllIn(allIn)
    openDeleteAllInModal()
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

  /**
   * Handle all-in delete confirm.
   */
  const handleAllInDeleteConfirm = () => {
    if (!selectedAllIn) return
    deleteAllIn.mutate({
      id: selectedAllIn.id,
    })
  }

  /**
   * Handle break (pause/resume) edit click.
   */
  const handleBreakEditClick = (pauseEvent: SessionEvent, resumeEvent?: SessionEvent) => {
    setSelectedBreak({ pauseEvent, resumeEvent })
    setEditBreakStartTime(formatTimeForInput(pauseEvent.recordedAt))
    setEditBreakEndTime(resumeEvent ? formatTimeForInput(resumeEvent.recordedAt) : '')
    openEditBreakModal()
  }

  /**
   * Handle break (pause/resume) delete click.
   */
  const handleBreakDeleteClick = (pauseEvent: SessionEvent, resumeEvent?: SessionEvent) => {
    setSelectedBreak({ pauseEvent, resumeEvent })
    openDeleteBreakModal()
  }

  /**
   * Handle break delete confirm - deletes both pause and resume events.
   */
  const handleBreakDeleteConfirm = async () => {
    if (!selectedBreak) return

    // Delete pause event
    await deleteEvent.mutateAsync({ eventId: selectedBreak.pauseEvent.id })

    // Delete resume event if it exists
    if (selectedBreak.resumeEvent) {
      await deleteEvent.mutateAsync({ eventId: selectedBreak.resumeEvent.id })
    }

    closeDeleteBreakModal()
    setSelectedBreak(null)
  }

  /**
   * Parse time string (HH:MM) to Date using a reference date.
   */
  const parseTimeString = (timeStr: string, refDate: Date): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const result = new Date(refDate)
    result.setHours(hours ?? 0, minutes ?? 0, 0, 0)
    return result
  }

  /**
   * Handle break edit confirm.
   */
  const handleBreakEditConfirm = async () => {
    if (!selectedBreak) return

    const bounds = getBreakTimeBounds()
    const originalStartTime = formatTimeForInput(selectedBreak.pauseEvent.recordedAt)
    const startTimeChanged = editBreakStartTime !== originalStartTime

    // Validate start time
    if (startTimeChanged) {
      const newStartDate = parseTimeString(editBreakStartTime, selectedBreak.pauseEvent.recordedAt)
      if (bounds.startMin && newStartDate <= bounds.startMin) {
        notifications.show({
          color: 'red',
          message: `開始時刻は${formatTimeForInput(bounds.startMin)}より後にしてください`,
        })
        return
      }
      if (bounds.startMax && newStartDate >= bounds.startMax) {
        notifications.show({
          color: 'red',
          message: `開始時刻は${formatTimeForInput(bounds.startMax)}より前にしてください`,
        })
        return
      }
    }

    // For ongoing breaks (no resume event), only check start time
    if (!selectedBreak.resumeEvent) {
      if (!startTimeChanged) {
        closeEditBreakModal()
        setSelectedBreak(null)
        setEditBreakStartTime('')
        setEditBreakEndTime('')
        return
      }

      const [hours, minutes] = editBreakStartTime.split(':').map(Number)
      const newDate = new Date(selectedBreak.pauseEvent.recordedAt)
      newDate.setHours(hours ?? 0, minutes ?? 0, 0, 0)
      updateEvent.mutate({
        eventId: selectedBreak.pauseEvent.id,
        recordedAt: newDate,
      })
      return
    }

    // For completed breaks (with resume event)
    const originalEndTime = formatTimeForInput(selectedBreak.resumeEvent.recordedAt)
    const endTimeChanged = editBreakEndTime !== originalEndTime

    // Validate end time
    if (endTimeChanged) {
      const newEndDate = parseTimeString(editBreakEndTime, selectedBreak.resumeEvent.recordedAt)
      if (bounds.endMin && newEndDate <= bounds.endMin) {
        notifications.show({
          color: 'red',
          message: `終了時刻は${formatTimeForInput(bounds.endMin)}より後にしてください`,
        })
        return
      }
      if (bounds.endMax && newEndDate >= bounds.endMax) {
        notifications.show({
          color: 'red',
          message: `終了時刻は${formatTimeForInput(bounds.endMax)}より前にしてください`,
        })
        return
      }
    }

    // Validate start < end after edits
    const newStartDate = startTimeChanged
      ? parseTimeString(editBreakStartTime, selectedBreak.pauseEvent.recordedAt)
      : new Date(selectedBreak.pauseEvent.recordedAt)
    const newEndDate = endTimeChanged
      ? parseTimeString(editBreakEndTime, selectedBreak.resumeEvent.recordedAt)
      : new Date(selectedBreak.resumeEvent.recordedAt)

    if (newStartDate >= newEndDate) {
      notifications.show({
        color: 'red',
        message: '開始時刻は終了時刻より前にしてください',
      })
      return
    }

    if (!startTimeChanged && !endTimeChanged) {
      // Nothing changed, just close
      closeEditBreakModal()
      setSelectedBreak(null)
      setEditBreakStartTime('')
      setEditBreakEndTime('')
      return
    }

    // Update pause event if start time changed
    if (startTimeChanged) {
      const [hours, minutes] = editBreakStartTime.split(':').map(Number)
      const newDate = new Date(selectedBreak.pauseEvent.recordedAt)
      newDate.setHours(hours ?? 0, minutes ?? 0, 0, 0)
      updateEvent.mutate({
        eventId: selectedBreak.pauseEvent.id,
        recordedAt: newDate,
      })
    }

    // Update resume event if end time changed
    if (endTimeChanged) {
      const [hours, minutes] = editBreakEndTime.split(':').map(Number)
      const newDate = new Date(selectedBreak.resumeEvent.recordedAt)
      newDate.setHours(hours ?? 0, minutes ?? 0, 0, 0)
      updateEvent.mutate({
        eventId: selectedBreak.resumeEvent.id,
        recordedAt: newDate,
      })
    }

    // Close modal (will be handled by mutation success if only one update)
    if (startTimeChanged && endTimeChanged) {
      // Both updated, manually close after a delay
      setTimeout(() => {
        closeEditBreakModal()
        setSelectedBreak(null)
        setEditBreakStartTime('')
        setEditBreakEndTime('')
      }, 500)
    }
  }

  /**
   * Format all-in description.
   */
  const formatAllInDescription = (allIn: AllInRecord) => {
    const winProb = parseFloat(allIn.winProbability)
    const result = allIn.actualResult ? '勝ち' : '負け'
    return `${allIn.potAmount.toLocaleString()} / ${winProb.toFixed(1)}% → ${result}`
  }

  if (timelineItems.length === 0) {
    return (
      <Text c="dimmed" ta="center">
        イベントがありません
      </Text>
    )
  }

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
        <Timeline active={timelineItems.length} bulletSize={24} lineWidth={2}>
          {timelineItems.map((item, index) => {
            // Hands group item
            if (item.kind === 'hands') {
              return (
                <Timeline.Item
                  bullet={<IconCards size={16} />}
                  color="violet"
                  key={`hands-${index}`}
                >
                  <Group gap="xs" justify="space-between" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs">
                        <Badge color="violet" size="sm">
                          ハンド
                        </Badge>
                        <Text c="dimmed" size="xs">
                          {formatTime(item.startTime)} - {formatTime(item.endTime)}
                        </Text>
                      </Group>
                      <Text size="sm">{item.count}ハンド</Text>
                    </Stack>
                  </Group>
                </Timeline.Item>
              )
            }

            // Pause/Resume pair item (休憩)
            if (item.kind === 'pauseResume') {
              return (
                <Timeline.Item
                  bullet={<IconClockPause size={16} />}
                  color="gray"
                  key={`pause-${item.pauseEvent.id}`}
                >
                  <Group gap="xs" justify="space-between" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs">
                        <Badge color="gray" size="sm">
                          休憩
                        </Badge>
                        <Text c="dimmed" size="xs">
                          {formatTime(item.pauseEvent.recordedAt)} - {formatTime(item.resumeEvent.recordedAt)}
                        </Text>
                      </Group>
                      <Text size="sm">{item.durationMinutes}分</Text>
                    </Stack>

                    <Group gap={4}>
                      <ActionIcon
                        color="blue"
                        onClick={() => handleBreakEditClick(item.pauseEvent, item.resumeEvent)}
                        size="sm"
                        variant="subtle"
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        onClick={() => handleBreakDeleteClick(item.pauseEvent, item.resumeEvent)}
                        size="sm"
                        variant="subtle"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Timeline.Item>
              )
            }

            // Ongoing break item (未完了の休憩)
            if (item.kind === 'ongoingBreak') {
              return (
                <Timeline.Item
                  bullet={<IconClockPause size={16} />}
                  color="gray"
                  key={`ongoing-${item.pauseEvent.id}`}
                >
                  <Group gap="xs" justify="space-between" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs">
                        <Badge color="gray" size="sm">
                          休憩中
                        </Badge>
                        <Text c="dimmed" size="xs">
                          {formatTime(item.pauseEvent.recordedAt)} -
                        </Text>
                      </Group>
                    </Stack>

                    <Group gap={4}>
                      <ActionIcon
                        color="blue"
                        onClick={() => handleBreakEditClick(item.pauseEvent)}
                        size="sm"
                        variant="subtle"
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        onClick={() => handleBreakDeleteClick(item.pauseEvent)}
                        size="sm"
                        variant="subtle"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Timeline.Item>
              )
            }

            // All-in record item
            if (item.kind === 'allIn') {
              return (
                <Timeline.Item
                  bullet={<IconTarget size={16} />}
                  color="pink"
                  key={`allIn-${item.allIn.id}`}
                >
                  <Group gap="xs" justify="space-between" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs">
                        <Badge color="pink" size="sm">
                          オールイン
                        </Badge>
                        <Text c="dimmed" size="xs">
                          {formatTime(item.allIn.recordedAt)}
                        </Text>
                      </Group>
                      <Text size="sm">{formatAllInDescription(item.allIn)}</Text>
                    </Stack>

                    <Group gap={4}>
                      <ActionIcon
                        color="blue"
                        onClick={() => handleAllInEditClick(item.allIn)}
                        size="sm"
                        variant="subtle"
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        onClick={() => handleAllInDeleteClick(item.allIn)}
                        size="sm"
                        variant="subtle"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Timeline.Item>
              )
            }

            // Regular event item
            const event = item.event
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
      </ScrollArea>

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
        title={
          selectedEvent?.eventType === 'session_pause' ||
          selectedEvent?.eventType === 'session_resume'
            ? '休憩を削除'
            : 'イベントを削除'
        }
      >
        <Stack gap="md">
          {selectedEvent &&
          (selectedEvent.eventType === 'session_pause' ||
            selectedEvent.eventType === 'session_resume') ? (
            <Text>この休憩を削除しますか？</Text>
          ) : (
            <Text>このイベントを削除しますか？</Text>
          )}
          {selectedEvent &&
            selectedEvent.eventType !== 'session_pause' &&
            selectedEvent.eventType !== 'session_resume' && (
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

      {/* Delete All-in Confirmation Modal */}
      <Modal
        onClose={() => {
          closeDeleteAllInModal()
          setSelectedAllIn(null)
        }}
        opened={deleteAllInModalOpened}
        title="オールイン記録を削除"
      >
        <Stack gap="md">
          <Text>このオールイン記録を削除しますか？</Text>
          {selectedAllIn && (
            <Text c="dimmed" size="sm">
              {formatAllInDescription(selectedAllIn)}
            </Text>
          )}
          <Group justify="flex-end">
            <Button
              onClick={() => {
                closeDeleteAllInModal()
                setSelectedAllIn(null)
              }}
              variant="subtle"
            >
              キャンセル
            </Button>
            <Button
              color="red"
              loading={deleteAllIn.isPending}
              onClick={handleAllInDeleteConfirm}
            >
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Break Modal */}
      <Modal
        onClose={() => {
          closeEditBreakModal()
          setSelectedBreak(null)
          setEditBreakStartTime('')
          setEditBreakEndTime('')
        }}
        opened={editBreakModalOpened}
        title={selectedBreak?.resumeEvent ? '休憩を編集' : '休憩中を編集'}
      >
        <Stack gap="md">
          {(() => {
            const bounds = getBreakTimeBounds()
            const startDescParts: string[] = []
            if (bounds.startMin) {
              startDescParts.push(`${formatTimeForInput(bounds.startMin)}より後`)
            }
            if (bounds.startMax) {
              startDescParts.push(`${formatTimeForInput(bounds.startMax)}より前`)
            }
            const startDesc = startDescParts.length > 0 ? startDescParts.join('、') : undefined

            const endDescParts: string[] = []
            if (bounds.endMin) {
              endDescParts.push(`${formatTimeForInput(bounds.endMin)}より後`)
            }
            if (bounds.endMax) {
              endDescParts.push(`${formatTimeForInput(bounds.endMax)}より前`)
            }
            const endDesc = endDescParts.length > 0 ? endDescParts.join('、') : undefined

            return (
              <>
                <TimeInput
                  label="開始時刻"
                  description={startDesc}
                  value={editBreakStartTime}
                  onChange={(e) => setEditBreakStartTime(e.currentTarget.value)}
                />
                {selectedBreak?.resumeEvent && (
                  <TimeInput
                    label="終了時刻"
                    description={endDesc}
                    value={editBreakEndTime}
                    onChange={(e) => setEditBreakEndTime(e.currentTarget.value)}
                  />
                )}
              </>
            )
          })()}
          <Group justify="flex-end">
            <Button
              onClick={() => {
                closeEditBreakModal()
                setSelectedBreak(null)
                setEditBreakStartTime('')
                setEditBreakEndTime('')
              }}
              variant="subtle"
            >
              キャンセル
            </Button>
            <Button
              loading={updateEvent.isPending}
              onClick={handleBreakEditConfirm}
            >
              更新
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Break Confirmation Modal */}
      <Modal
        onClose={() => {
          closeDeleteBreakModal()
          setSelectedBreak(null)
        }}
        opened={deleteBreakModalOpened}
        title="休憩を削除"
      >
        <Stack gap="md">
          <Text>この休憩を削除しますか？</Text>
          {selectedBreak && (
            <Text c="dimmed" size="sm">
              {formatTimeForInput(selectedBreak.pauseEvent.recordedAt)}
              {selectedBreak.resumeEvent
                ? ` - ${formatTimeForInput(selectedBreak.resumeEvent.recordedAt)}`
                : ' - (継続中)'}
            </Text>
          )}
          <Group justify="flex-end">
            <Button
              onClick={() => {
                closeDeleteBreakModal()
                setSelectedBreak(null)
              }}
              variant="subtle"
            >
              キャンセル
            </Button>
            <Button
              color="red"
              loading={deleteEvent.isPending}
              onClick={handleBreakDeleteConfirm}
            >
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
