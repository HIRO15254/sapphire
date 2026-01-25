'use client'

import {
  ActionIcon,
  Affix,
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Drawer,
  Group,
  Loader,
  Pagination,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import {
  IconAlertCircle,
  IconCalendar,
  IconFilter,
  IconMapPin,
  IconPlus,
  IconX,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'
import { GameTypeBadge } from '~/components/sessions/GameTypeBadge'
import { usePageTitle } from '~/contexts/PageTitleContext'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'
import {
  formatDate,
  formatDurationShort,
  formatProfitLoss,
  getProfitLossColor,
} from './[id]/types'

type Session = RouterOutputs['session']['list']['sessions'][number]
type Store = RouterOutputs['store']['list']['stores'][number]
type Currency = RouterOutputs['currency']['list']['currencies'][number]

/** Period preset options */
type PeriodPreset = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

/** Filter state type */
interface FilterState {
  gameType: 'all' | 'cash' | 'tournament'
  periodPreset: PeriodPreset
  customDateRange: [Date | null, Date | null]
  currencyId: string | null
  storeId: string | null
}

/** Default filter state */
const defaultFilters: FilterState = {
  gameType: 'all',
  periodPreset: 'all',
  customDateRange: [null, null],
  currencyId: null,
  storeId: null,
}

interface SessionsContentProps {
  initialSessions: Session[]
  initialTotal: number
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
 * Build query filters from filter state.
 */
function buildQueryFilters(filters: FilterState) {
  const queryFilters: {
    gameType?: 'cash' | 'tournament'
    storeId?: string
    currencyId?: string
    startFrom?: Date
    startTo?: Date
  } = {}

  if (filters.gameType !== 'all') {
    queryFilters.gameType = filters.gameType
  }
  if (filters.storeId) {
    queryFilters.storeId = filters.storeId
  }
  if (filters.currencyId) {
    queryFilters.currencyId = filters.currencyId
  }

  // Date range
  if (filters.periodPreset === 'custom') {
    if (filters.customDateRange[0]) {
      queryFilters.startFrom = filters.customDateRange[0]
    }
    if (filters.customDateRange[1]) {
      // Add 1 day to include the end date
      const endDate = new Date(filters.customDateRange[1])
      endDate.setDate(endDate.getDate() + 1)
      queryFilters.startTo = endDate
    }
  } else {
    const { startFrom, startTo } = getDateRangeForPreset(filters.periodPreset)
    if (startFrom) queryFilters.startFrom = startFrom
    if (startTo) queryFilters.startTo = startTo
  }

  return queryFilters
}

/**
 * Check if filters have any active conditions.
 */
function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.gameType !== 'all' ||
    filters.periodPreset !== 'all' ||
    filters.currencyId !== null ||
    filters.storeId !== null
  )
}

/**
 * Count active filters.
 */
function countActiveFilters(filters: FilterState): number {
  return [
    filters.gameType !== 'all',
    filters.periodPreset !== 'all',
    filters.currencyId !== null,
    filters.storeId !== null,
  ].filter(Boolean).length
}

/**
 * Session list content client component.
 *
 * Displays all sessions with profit/loss, filters, and pagination.
 * Uses initial data from server, fetches more on page/filter change.
 */
export function SessionsContent({
  initialSessions,
  initialTotal,
  stores,
  currencies,
}: SessionsContentProps) {
  usePageTitle('Sessions')

  const [page, setPage] = useState(1)
  const limit = 20

  // Applied filter state (used for queries)
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(defaultFilters)

  // Draft filter state (used in drawer, only applied on "Apply" click)
  const [draftFilters, setDraftFilters] = useState<FilterState>(defaultFilters)

  // Drawer state
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false)

  // Open drawer and sync draft with applied
  const handleOpenDrawer = () => {
    setDraftFilters(appliedFilters)
    openDrawer()
  }

  // Apply filters from drawer
  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters)
    setPage(1)
    closeDrawer()
  }

  // Clear all filters
  const handleClearFilters = () => {
    setDraftFilters(defaultFilters)
  }

  // Clear applied filters (from badge click)
  const handleClearAppliedFilters = () => {
    setAppliedFilters(defaultFilters)
    setPage(1)
  }

  // Remove single filter from applied
  const removeAppliedFilter = (key: keyof FilterState) => {
    const newFilters = { ...appliedFilters }
    if (key === 'periodPreset') {
      newFilters.periodPreset = 'all'
      newFilters.customDateRange = [null, null]
    } else if (key === 'gameType') {
      newFilters.gameType = 'all'
    } else {
      newFilters[key] = null as never
    }
    setAppliedFilters(newFilters)
    setPage(1)
  }

  const queryFilters = buildQueryFilters(appliedFilters)
  const isFiltered = hasActiveFilters(appliedFilters)
  const activeFilterCount = countActiveFilters(appliedFilters)

  // Check if we should use initial data (no filters and page 1)
  const useInitialData = !isFiltered && page === 1

  // Fetch paginated data when filters change or page > 1
  const { data, isLoading, error } = api.session.list.useQuery(
    { limit, offset: (page - 1) * limit, ...queryFilters },
    {
      enabled: !useInitialData,
    },
  )

  // Use server data for initial state, query data when filters/page change
  const sessions = useInitialData ? initialSessions : (data?.sessions ?? [])
  const total = useInitialData ? initialTotal : (data?.total ?? 0)

  const totalPages = Math.ceil(total / limit)

  /**
   * Get game display name.
   */
  const getGameName = (session: Session) => {
    if (session.cashGame) {
      return `${session.cashGame.smallBlind}/${session.cashGame.bigBlind}`
    }
    if (session.tournament) {
      return (
        session.tournament.name ??
        `¥${session.tournament.buyIn.toLocaleString()}`
      )
    }
    return '-'
  }

  // Store options for select
  const storeOptions = stores.map((store) => ({
    value: store.id,
    label: store.name,
  }))

  // Currency options for select
  const currencyOptions = currencies.map((currency) => ({
    value: currency.id,
    label: currency.name,
  }))

  // Period preset options
  const periodOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom' },
  ]

  // Game type options
  const gameTypeOptions = [
    { value: 'all', label: 'All' },
    { value: 'cash', label: 'Cash' },
    { value: 'tournament', label: 'Tournament' },
  ]

  // Determine content state
  const isLoadingContent = !useInitialData && isLoading
  const hasError = !useInitialData && error

  return (
    <>
      <Container py="xl" size="md">
        <Stack gap="lg">
          {/* Filter Button */}
          <Group gap="sm" justify="flex-end">
            <Button
              leftSection={<IconFilter size={16} />}
              onClick={handleOpenDrawer}
              rightSection={
                activeFilterCount > 0 && (
                  <Badge circle size="xs" variant="filled">
                    {activeFilterCount}
                  </Badge>
                )
              }
              size="xs"
              variant="light"
            >
              Filter
            </Button>
          </Group>

          {/* Active Filters Display */}
          {isFiltered && (
            <Group gap="xs">
              <Text c="dimmed" size="xs">
                Filters:
              </Text>
              {appliedFilters.gameType !== 'all' && (
                <Badge
                  rightSection={
                    <IconX
                      onClick={() => removeAppliedFilter('gameType')}
                      size={12}
                      style={{ cursor: 'pointer' }}
                    />
                  }
                  size="sm"
                  variant="light"
                >
                  {
                    gameTypeOptions.find(
                      (g) => g.value === appliedFilters.gameType,
                    )?.label
                  }
                </Badge>
              )}
              {appliedFilters.periodPreset !== 'all' && (
                <Badge
                  rightSection={
                    <IconX
                      onClick={() => removeAppliedFilter('periodPreset')}
                      size={12}
                      style={{ cursor: 'pointer' }}
                    />
                  }
                  size="sm"
                  variant="light"
                >
                  {
                    periodOptions.find(
                      (p) => p.value === appliedFilters.periodPreset,
                    )?.label
                  }
                </Badge>
              )}
              {appliedFilters.currencyId && (
                <Badge
                  rightSection={
                    <IconX
                      onClick={() => removeAppliedFilter('currencyId')}
                      size={12}
                      style={{ cursor: 'pointer' }}
                    />
                  }
                  size="sm"
                  variant="light"
                >
                  {
                    currencies.find((c) => c.id === appliedFilters.currencyId)
                      ?.name
                  }
                </Badge>
              )}
              {appliedFilters.storeId && (
                <Badge
                  rightSection={
                    <IconX
                      onClick={() => removeAppliedFilter('storeId')}
                      size={12}
                      style={{ cursor: 'pointer' }}
                    />
                  }
                  size="sm"
                  variant="light"
                >
                  {stores.find((s) => s.id === appliedFilters.storeId)?.name}
                </Badge>
              )}
              <Button
                color="gray"
                onClick={handleClearAppliedFilters}
                size="compact-xs"
                variant="subtle"
              >
                Clear all
              </Button>
            </Group>
          )}

          {/* Content Area: Loading / Error / Empty / List */}
          {isLoadingContent ? (
            <Stack align="center" gap="md" py="xl">
              <Loader size="md" />
              <Text c="dimmed" size="sm">
                Loading...
              </Text>
            </Stack>
          ) : hasError ? (
            <Alert
              color="red"
              icon={<IconAlertCircle size={16} />}
              title="Error"
            >
              {error?.message}
            </Alert>
          ) : sessions.length === 0 ? (
            <Card p="xl" radius="md" shadow="sm" withBorder>
              <Stack align="center" gap="md">
                <Text c="dimmed" size="lg">
                  {isFiltered
                    ? 'No sessions match filters'
                    : 'No sessions recorded'}
                </Text>
                <Text c="dimmed" size="sm">
                  {isFiltered
                    ? 'Try adjusting your filters'
                    : 'Record a new session to start analyzing your results'}
                </Text>
                {!isFiltered && (
                  <Button
                    component={Link}
                    href="/sessions/new"
                    leftSection={<IconPlus size={16} />}
                    mt="md"
                  >
                    Record New Session
                  </Button>
                )}
              </Stack>
            </Card>
          ) : (
            <Stack gap="xs">
              {sessions.map((session) => (
                <Card
                  component={Link}
                  href={`/sessions/${session.id}`}
                  key={session.id}
                  px="sm"
                  py="xs"
                  radius="sm"
                  shadow="xs"
                  style={{ textDecoration: 'none', cursor: 'pointer' }}
                  withBorder
                >
                  <Group justify="space-between" wrap="nowrap">
                    {/* Left: Badge, Game name + Date, Store */}
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Group gap="xs" wrap="nowrap">
                        <GameTypeBadge
                          gameType={session.gameType}
                          iconOnly
                          size="xs"
                        />
                        <Text fw={500} size="sm" truncate>
                          {getGameName(session)}
                        </Text>
                      </Group>
                      <Group gap="sm" wrap="nowrap">
                        <Group gap={4} wrap="nowrap">
                          <IconCalendar
                            size={12}
                            style={{ color: 'var(--mantine-color-dimmed)' }}
                          />
                          <Text c="dimmed" size="xs">
                            {formatDate(session.startTime)}
                          </Text>
                        </Group>
                        {session.store && (
                          <Group gap={4} style={{ minWidth: 0 }} wrap="nowrap">
                            <IconMapPin
                              size={12}
                              style={{
                                color: 'var(--mantine-color-dimmed)',
                                flexShrink: 0,
                              }}
                            />
                            <Text c="dimmed" size="xs" truncate>
                              {session.store.name}
                            </Text>
                          </Group>
                        )}
                      </Group>
                    </Stack>
                    {/* Right: Profit/Loss (with EV below) / Duration */}
                    <Group gap="xs" wrap="nowrap">
                      <Stack
                        align="flex-end"
                        gap={0}
                        style={{ lineHeight: 1.2 }}
                      >
                        <Text
                          c={getProfitLossColor(session.profitLoss)}
                          fw={700}
                          lh={1.2}
                          size="sm"
                        >
                          {formatProfitLoss(session.profitLoss)}
                        </Text>
                        {session.allInSummary &&
                          session.allInSummary.count > 0 &&
                          session.profitLoss !== null && (
                            <Text
                              c={getProfitLossColor(
                                session.profitLoss -
                                  session.allInSummary.evDifference,
                              )}
                              lh={1.2}
                              size="xs"
                            >
                              (EV:{' '}
                              {formatProfitLoss(
                                session.profitLoss -
                                  session.allInSummary.evDifference,
                              )}
                              )
                            </Text>
                          )}
                      </Stack>
                      <Text c="dimmed" size="xs">
                        /{' '}
                        {formatDurationShort(
                          session.startTime,
                          session.endTime,
                        )}
                      </Text>
                    </Group>
                  </Group>
                </Card>
              ))}

              {totalPages > 1 && (
                <Group justify="center" mt="lg">
                  <Pagination
                    onChange={setPage}
                    total={totalPages}
                    value={page}
                  />
                </Group>
              )}
            </Stack>
          )}
        </Stack>
      </Container>

      {/* Filter Drawer */}
      <Drawer
        onClose={closeDrawer}
        opened={drawerOpened}
        position="bottom"
        size="auto"
        title="Filter Sessions"
      >
        <Stack gap="md" pb="md">
          {/* Game Type */}
          <Stack gap="xs">
            <Text fw={500} size="sm">
              Game Type
            </Text>
            <SegmentedControl
              data={gameTypeOptions}
              fullWidth
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  gameType: value as 'all' | 'cash' | 'tournament',
                }))
              }
              size="xs"
              value={draftFilters.gameType}
            />
          </Stack>

          <Select
            clearable
            data={periodOptions}
            label="Period"
            onChange={(value) =>
              setDraftFilters((prev) => ({
                ...prev,
                periodPreset: (value as PeriodPreset) || 'all',
                customDateRange:
                  value !== 'custom' ? [null, null] : prev.customDateRange,
              }))
            }
            placeholder="Select period"
            value={draftFilters.periodPreset}
          />

          {draftFilters.periodPreset === 'custom' && (
            <DatePickerInput
              clearable
              label="Date Range"
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  customDateRange: value,
                }))
              }
              placeholder="Select date range"
              type="range"
              value={draftFilters.customDateRange}
              valueFormat="YYYY/MM/DD"
            />
          )}

          <Select
            clearable
            comboboxProps={{ position: 'bottom', middlewares: { flip: false } }}
            data={currencyOptions}
            label="Currency"
            onChange={(value) =>
              setDraftFilters((prev) => ({ ...prev, currencyId: value }))
            }
            placeholder="All currencies"
            searchable
            value={draftFilters.currencyId}
          />

          <Select
            clearable
            comboboxProps={{ position: 'bottom', middlewares: { flip: false } }}
            data={storeOptions}
            label="Store"
            onChange={(value) =>
              setDraftFilters((prev) => ({ ...prev, storeId: value }))
            }
            placeholder="All stores"
            searchable
            value={draftFilters.storeId}
          />

          <Group gap="sm" justify="flex-end" mt="md">
            <Button onClick={handleClearFilters} variant="subtle">
              Clear all
            </Button>
            <Button onClick={handleApplyFilters}>Apply</Button>
          </Group>
        </Stack>
      </Drawer>

      {/* FAB - Add Session */}
      <Affix position={{ bottom: 24, right: 24 }}>
        <ActionIcon
          aria-label="Record new session"
          color="blue"
          component={Link}
          href="/sessions/new"
          radius="xl"
          size={56}
          variant="filled"
        >
          <IconPlus size={28} />
        </ActionIcon>
      </Affix>
    </>
  )
}
