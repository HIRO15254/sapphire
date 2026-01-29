import type { Session } from './types'

/**
 * Format game display name.
 *
 * For cash games: shows blinds (e.g., "100/200")
 * For tournaments: shows name or buyIn amount (without currency symbol)
 */
export function formatGameName(session: Session): string {
  if (session.cashGame) {
    return `${session.cashGame.smallBlind}/${session.cashGame.bigBlind}`
  }
  if (session.tournament) {
    return (
      session.tournament.name ??
      session.tournament.buyIn.toLocaleString()
    )
  }
  return '-'
}

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
