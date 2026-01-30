/**
 * Pure functions for grouping session events into timeline items.
 * Extracted from SessionEventTimeline.tsx for reuse.
 */

export interface TimelineEvent {
  id: string
  sessionId: string
  eventType: string
  eventData: unknown
  sequence: number
  recordedAt: Date
  createdAt: Date
}

export interface TimelineAllInRecord {
  id: string
  sessionId: string
  potAmount: number
  winProbability: string
  actualResult: boolean
  recordedAt: Date
  runItTimes?: number | null
  winsInRunout?: number | null
}

export type GroupedTimelineItem =
  | { kind: 'event'; event: TimelineEvent }
  | { kind: 'allIn'; allIn: TimelineAllInRecord }
  | { kind: 'hands'; count: number; startTime: Date; endTime: Date }
  | {
      kind: 'pauseResume'
      pauseEvent: TimelineEvent
      resumeEvent: TimelineEvent
      durationMinutes: number
    }
  | { kind: 'ongoingBreak'; pauseEvent: TimelineEvent }

/**
 * Get the representative timestamp for a timeline item (used for sorting).
 */
function getItemTime(item: GroupedTimelineItem): number {
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

/**
 * Group timeline events and all-in records into unified timeline items.
 *
 * Groups:
 * - Consecutive hand_complete / hands_passed events into a single "X hands" item
 * - Pause/Resume pairs into a single break item with duration
 * - Unpaired pause into "ongoing break" item
 * - All-in records merged by timestamp
 * - Regular events as individual items
 *
 * Returns items sorted newest-first.
 */
export function groupTimelineItems(
  events: TimelineEvent[],
  allInRecords: TimelineAllInRecord[],
): GroupedTimelineItem[] {
  const items: GroupedTimelineItem[] = []

  let i = 0
  while (i < events.length) {
    const event = events[i]
    if (!event) {
      i++
      continue
    }

    // Group hand_complete and hands_passed events
    if (
      event.eventType === 'hand_complete' ||
      event.eventType === 'hands_passed'
    ) {
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
      const resumeIndex = events
        .slice(i + 1)
        .findIndex((e) => e.eventType === 'session_resume')

      if (resumeIndex !== -1) {
        const resumeEvent = events[i + 1 + resumeIndex]
        if (resumeEvent) {
          const pauseTime = new Date(event.recordedAt).getTime()
          const resumeTime = new Date(resumeEvent.recordedAt).getTime()
          const durationMinutes = Math.round(
            (resumeTime - pauseTime) / (1000 * 60),
          )

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

    // Skip paired session_resume events
    if (event.eventType === 'session_resume') {
      const prevPauseIndex = events
        .slice(0, i)
        .reverse()
        .findIndex((e) => e.eventType === 'session_pause')
      if (prevPauseIndex !== -1) {
        const pauseActualIndex = i - 1 - prevPauseIndex
        const hasPriorResume = events
          .slice(pauseActualIndex + 1, i)
          .some((e) => e.eventType === 'session_resume')
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

  // Sort by time, newest first
  items.sort((a, b) => getItemTime(a) - getItemTime(b))
  items.reverse()

  return items
}

/**
 * Get label for event type.
 */
export function getEventLabel(eventType: string): string {
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
 * Get color for event type.
 */
export function getEventColor(eventType: string): string {
  switch (eventType) {
    case 'session_start':
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
 * Get description text for an event.
 */
export function getEventDescription(
  event: TimelineEvent,
): string | null {
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
 * Format all-in record description text.
 */
export function formatAllInDescription(
  allIn: TimelineAllInRecord,
): string {
  const winProb = Number.parseFloat(allIn.winProbability)

  let result: string
  if (
    allIn.runItTimes &&
    allIn.runItTimes > 1 &&
    allIn.winsInRunout !== null &&
    allIn.winsInRunout !== undefined
  ) {
    if (allIn.winsInRunout === allIn.runItTimes) {
      result = '勝ち'
    } else if (allIn.winsInRunout === 0) {
      result = '負け'
    } else {
      result = `${allIn.winsInRunout}/${allIn.runItTimes}`
    }
  } else {
    result = allIn.actualResult ? '勝ち' : '負け'
  }

  return `${allIn.potAmount.toLocaleString()} / ${winProb.toFixed(1)}% → ${result}`
}

/**
 * Format timestamp to HH:MM.
 */
export function formatTimelineTime(date: Date): string {
  return new Date(date).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Event type classification constants
export const AMOUNT_EDITABLE_EVENTS = ['stack_update', 'rebuy', 'addon']
export const NON_EDITABLE_TIME_EVENTS = ['session_start', 'session_end']
export const NON_DELETABLE_EVENTS = ['session_start', 'session_end']
