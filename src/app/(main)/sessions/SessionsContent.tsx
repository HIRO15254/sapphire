'use client'

import { Container, Stack } from '@mantine/core'
import { useMemo, useState } from 'react'
import { usePageTitle } from '~/contexts/PageTitleContext'
import type { RouterOutputs } from '~/trpc/react'
import {
  defaultFilters,
  type FilterState,
  hasActiveFilters,
  type PeriodPreset,
  SessionFilter,
} from './SessionFilter'
import { SessionList } from './SessionList'

type Session = RouterOutputs['session']['list']['sessions'][number]
type Store = RouterOutputs['store']['list']['stores'][number]
type Currency = RouterOutputs['currency']['list']['currencies'][number]

interface SessionsContentProps {
  sessions: Session[]
  stores: Store[]
  currencies: Currency[]
}

/**
 * Get date range for period preset.
 */
function getDateRangeForPreset(preset: PeriodPreset): {
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
function filterSessions(sessions: Session[], filters: FilterState): Session[] {
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
 * Session list content client component.
 *
 * Orchestrates filter and list components with client-side filtering.
 */
export function SessionsContent({
  sessions,
  stores,
  currencies,
}: SessionsContentProps) {
  usePageTitle('Sessions')

  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  // Filter sessions client-side
  const filteredSessions = useMemo(
    () => filterSessions(sessions, filters),
    [sessions, filters],
  )

  const isFiltered = hasActiveFilters(filters)

  // Prepare store/currency options for filter
  const storeOptions = stores.map((s) => ({ id: s.id, name: s.name }))
  const currencyOptions = currencies.map((c) => ({ id: c.id, name: c.name }))

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <SessionFilter
          currencies={currencyOptions}
          filters={filters}
          onFiltersChange={setFilters}
          stores={storeOptions}
        />

        <SessionList isFiltered={isFiltered} sessions={filteredSessions} />
      </Stack>
    </Container>
  )
}
