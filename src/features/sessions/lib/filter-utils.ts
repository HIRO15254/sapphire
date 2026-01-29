import type { FilterState, PeriodPreset } from './types'

/**
 * Session type for filtering purposes.
 * Uses minimal interface to allow flexibility with different session shapes.
 */
interface FilterableSession {
  gameType: string | null
  startTime: Date
  store?: { id: string } | null
  cashGame?: { currency?: { id: string } | null } | null
  tournament?: { currency?: { id: string } | null } | null
}

/**
 * Get date range for period preset.
 */
export function getDateRangeForPreset(preset: PeriodPreset): {
  startFrom?: Date
  startTo?: Date
} {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  switch (preset) {
    case 'thisMonth':
      return {
        startFrom: new Date(year, month, 1),
        startTo: new Date(year, month + 1, 1),
      }
    case 'lastMonth':
      return {
        startFrom: new Date(year, month - 1, 1),
        startTo: new Date(year, month, 1),
      }
    case 'thisYear':
      return {
        startFrom: new Date(year, 0, 1),
        startTo: new Date(year + 1, 0, 1),
      }
    default:
      return {}
  }
}

/**
 * Filter sessions based on filter state.
 */
export function filterSessions<T extends FilterableSession>(
  sessions: T[],
  filters: FilterState,
): T[] {
  return sessions.filter((session) => {
    // Game type filter
    if (filters.gameType !== 'all') {
      if (filters.gameType === 'cash' && session.gameType !== 'cash') {
        return false
      }
      if (
        filters.gameType === 'tournament' &&
        session.gameType !== 'tournament'
      ) {
        return false
      }
    }

    // Period filter
    let startFrom: Date | undefined
    let startTo: Date | undefined

    if (filters.periodPreset === 'custom') {
      if (filters.customDateRange[0]) {
        startFrom = filters.customDateRange[0]
      }
      if (filters.customDateRange[1]) {
        // Add 1 day to include the end date
        startTo = new Date(filters.customDateRange[1])
        startTo.setDate(startTo.getDate() + 1)
      }
    } else if (filters.periodPreset !== 'all') {
      const range = getDateRangeForPreset(filters.periodPreset)
      startFrom = range.startFrom
      startTo = range.startTo
    }

    if (startFrom) {
      const sessionDate = new Date(session.startTime)
      if (sessionDate < startFrom) {
        return false
      }
    }
    if (startTo) {
      const sessionDate = new Date(session.startTime)
      if (sessionDate >= startTo) {
        return false
      }
    }

    // Store filter
    if (filters.storeId) {
      if (session.store?.id !== filters.storeId) {
        return false
      }
    }

    // Currency filter - check if the session's game uses this currency
    if (filters.currencyId) {
      const cashGameCurrencyId = session.cashGame?.currency?.id
      const tournamentCurrencyId = session.tournament?.currency?.id
      if (
        cashGameCurrencyId !== filters.currencyId &&
        tournamentCurrencyId !== filters.currencyId
      ) {
        return false
      }
    }

    return true
  })
}

/**
 * Check if filters have any active conditions.
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.gameType !== 'all' ||
    filters.periodPreset !== 'all' ||
    filters.currencyId !== null ||
    filters.storeId !== null
  )
}
