/**
 * Session feature constants.
 *
 * These constants are extracted from SessionFilter.tsx and
 * centralized here for reuse across the feature.
 */

import type { FilterState, PeriodPreset } from './types'

/** Period preset options for filter select */
export const periodOptions: { value: PeriodPreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
]

/** Game type options for filter segmented control */
export const gameTypeOptions: {
  value: FilterState['gameType']
  label: string
}[] = [
  { value: 'all', label: 'All' },
  { value: 'cash', label: 'Cash' },
  { value: 'tournament', label: 'Tournament' },
]

/** Default filter state */
export const defaultFilters: FilterState = {
  gameType: 'all',
  periodPreset: 'all',
  customDateRange: [null, null],
  currencyId: null,
  storeId: null,
}
