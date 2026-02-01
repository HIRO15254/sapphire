/**
 * Session feature type definitions.
 *
 * These types are extracted from the original components and
 * centralized here for reuse across the feature.
 */

/** Period preset options for date filtering */
export type PeriodPreset =
  | 'all'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom'

/** Filter state for session list filtering */
export interface FilterState {
  gameType: 'all' | 'cash' | 'tournament'
  periodPreset: PeriodPreset
  customDateRange: [Date | null, Date | null]
  currencyId: string | null
  storeId: string | null
}

/** Store option for filter select */
export interface StoreOption {
  id: string
  name: string
}

/** Currency option for filter select */
export interface CurrencyOption {
  id: string
  name: string
}

/** Profit display unit for session list */
export type ProfitUnit = 'real' | 'bb' | 'bi'

/** Session data structure for list display */
export interface Session {
  id: string
  gameType: string | null
  startTime: Date
  endTime: Date | null
  profitLoss: number | null
  store: { name: string } | null
  cashGame: { smallBlind: number; bigBlind: number } | null
  tournament: { name: string | null; buyIn: number } | null
  allInSummary: {
    count: number
    evDifference: number
  } | null
}
