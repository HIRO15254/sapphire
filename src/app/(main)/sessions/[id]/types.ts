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
