import type { RouterOutputs } from '~/trpc/react'

export type Session = RouterOutputs['session']['getById']
export type AllInRecord = Session['allInRecords'][number]

/**
 * Format date only (e.g., 2025/12/29).
 */
export function formatDate(date: Date): string {
  const d = new Date(date)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Format time only (e.g., 22:30).
 */
export function formatTime(date: Date): string {
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Format session duration short (e.g., "2.0h").
 */
export function formatDurationShort(
  startTime: Date,
  endTime: Date | null,
): string {
  if (!endTime) return '-'

  const start = new Date(startTime)
  const end = new Date(endTime)
  const durationMs = end.getTime() - start.getTime()
  const durationHours = durationMs / (1000 * 60 * 60)

  return `${durationHours.toFixed(1)}h`
}

/**
 * Format session duration (e.g., "2.0h (22:30-0:30)").
 */
export function formatSessionDuration(
  startTime: Date,
  endTime: Date | null,
): string {
  const start = new Date(startTime)
  const startStr = formatTime(start)

  if (!endTime) {
    return `(${startStr}-)`
  }

  const end = new Date(endTime)
  const endStr = formatTime(end)
  const durationMs = end.getTime() - start.getTime()
  const durationHours = durationMs / (1000 * 60 * 60)

  return `${durationHours.toFixed(1)}h (${startStr}-${endStr})`
}

/**
 * Calculate active play time excluding pauses from session events.
 */
export function calculateActiveDuration(
  startTime: Date,
  endTime: Date | null,
  sessionEvents: Array<{ eventType: string; recordedAt: Date }>,
): { durationMs: number; pausedMs: number } {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()

  let pausedMs = 0
  let lastPauseTime: number | null = null

  for (const event of sessionEvents) {
    const eventTime = new Date(event.recordedAt).getTime()

    if (event.eventType === 'session_pause') {
      lastPauseTime = eventTime
    } else if (event.eventType === 'session_resume' && lastPauseTime !== null) {
      pausedMs += eventTime - lastPauseTime
      lastPauseTime = null
    }
  }

  // If session ended while paused, add remaining pause time
  if (lastPauseTime !== null && endTime) {
    pausedMs += end.getTime() - lastPauseTime
  }

  const totalMs = end.getTime() - start.getTime()
  const durationMs = totalMs - pausedMs

  return { durationMs, pausedMs }
}

/**
 * Format session duration with pause consideration (e.g., "2.0h (22:30-0:30)").
 * For live-recorded sessions, excludes paused time from the duration.
 */
export function formatSessionDurationWithEvents(
  startTime: Date,
  endTime: Date | null,
  sessionEvents: Array<{ eventType: string; recordedAt: Date }>,
): string {
  const start = new Date(startTime)
  const startStr = formatTime(start)

  if (!endTime) {
    return `(${startStr}-)`
  }

  const end = new Date(endTime)
  const endStr = formatTime(end)

  const { durationMs } = calculateActiveDuration(
    startTime,
    endTime,
    sessionEvents,
  )
  const durationHours = durationMs / (1000 * 60 * 60)

  return `${durationHours.toFixed(1)}h (${startStr}-${endStr})`
}

/**
 * Format profit/loss with + or - prefix.
 */
export function formatProfitLoss(profitLoss: number | null): string {
  if (profitLoss === null) return '-'
  const formatted = Math.abs(profitLoss).toLocaleString('ja-JP')
  if (profitLoss > 0) return `+${formatted}`
  if (profitLoss < 0) return `-${formatted}`
  return formatted
}

/**
 * Get color based on profit/loss.
 */
export function getProfitLossColor(profitLoss: number | null): string {
  if (profitLoss === null) return 'dimmed'
  if (profitLoss > 0) return 'green'
  if (profitLoss < 0) return 'red'
  return 'dimmed'
}

/**
 * Format EV value (no sign prefix since EV is always positive).
 */
export function formatEV(value: number): string {
  return value.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
}
