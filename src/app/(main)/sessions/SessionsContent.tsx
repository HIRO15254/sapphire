'use client'

import { Container, Drawer, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { usePageTitle } from '~/contexts/PageTitleContext'
import {
  type FilterState,
  type NewSessionFormData,
  type ProfitUnit,
  NewSessionForm,
  SessionFilter,
  SessionList,
  defaultFilters,
  filterSessions,
  hasActiveFilters,
} from '~/features/sessions'
import type { RouterOutputs } from '~/trpc/react'
import { createArchiveSession } from './actions'

type Session = RouterOutputs['session']['list']['sessions'][number]
type Store = RouterOutputs['store']['list']['stores'][number]
type StoreWithGames = RouterOutputs['store']['getById']
type Currency = RouterOutputs['currency']['list']['currencies'][number]

interface SessionsContentProps {
  sessions: Session[]
  stores: Store[]
  storesWithGames: StoreWithGames[]
  currencies: Currency[]
}

/**
 * Session list content client component.
 *
 * Orchestrates filter and list components with client-side filtering.
 */
export function SessionsContent({
  sessions,
  stores,
  storesWithGames,
  currencies,
}: SessionsContentProps) {
  usePageTitle('Sessions')

  const router = useRouter()
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false)
  const [isCreating, startCreateTransition] = useTransition()
  const [profitUnit, setProfitUnit] = useState<ProfitUnit>('real')

  // Reset profitUnit when gameType changes to 'all'
  useEffect(() => {
    if (filters.gameType === 'all') {
      setProfitUnit('real')
    }
  }, [filters.gameType])

  // Filter sessions client-side
  const filteredSessions = useMemo(
    () => filterSessions(sessions, filters),
    [sessions, filters],
  )

  const isFiltered = hasActiveFilters(filters)

  // Prepare store/currency options for filter
  const storeOptions = stores.map((s) => ({ id: s.id, name: s.name }))
  const currencyOptions = currencies.map((c) => ({ id: c.id, name: c.name }))

  const handleSubmitNewSession = (data: NewSessionFormData) => {
    startCreateTransition(async () => {
      const result = await createArchiveSession({
        storeId: data.storeId,
        gameType: data.gameType,
        cashGameId: data.cashGameId,
        tournamentId: data.tournamentId,
        startTime: data.startTime,
        endTime: data.endTime,
        buyIn: data.buyIn,
        cashOut: data.cashOut,
        notes: data.notes,
      })

      if (result.success) {
        notifications.show({
          title: 'Session Recorded',
          message: 'Your session has been saved',
          color: 'green',
        })
        closeDrawer()
        router.push(`/sessions/${result.data.id}`)
      } else {
        notifications.show({
          title: 'Error',
          message: result.error,
          color: 'red',
        })
      }
    })
  }

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <SessionFilter
          currencies={currencyOptions}
          filters={filters}
          onFiltersChange={setFilters}
          onProfitUnitChange={setProfitUnit}
          profitUnit={profitUnit}
          stores={storeOptions}
        />

        <SessionList
          isFiltered={isFiltered}
          onOpenNewSession={openDrawer}
          profitUnit={profitUnit}
          sessions={filteredSessions}
        />
      </Stack>

      <Drawer
        onClose={closeDrawer}
        opened={drawerOpened}
        position="bottom"
        size="auto"
        title="Record Session"
      >
        <NewSessionForm
          isSubmitting={isCreating}
          onCancel={closeDrawer}
          onSubmit={handleSubmitNewSession}
          stores={storesWithGames}
        />
      </Drawer>
    </Container>
  )
}
