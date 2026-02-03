'use client'

import {
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import { IconFilter, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { GameTypeIcon } from '~/components/sessions/GameTypeBadge'
import {
  defaultFilters,
  gameTypeOptions,
  periodOptions,
} from '../lib/constants'
import { hasActiveFilters } from '../lib/filter-utils'
import type {
  CurrencyOption,
  FilterState,
  PeriodPreset,
  ProfitUnit,
  StoreOption,
} from '../lib/types'

interface SessionFilterProps {
  stores: StoreOption[]
  currencies: CurrencyOption[]
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  profitUnit: ProfitUnit
  onProfitUnitChange: (unit: ProfitUnit) => void
}

/**
 * Session filter component.
 *
 * Manages filter UI with bottom sheet drawer.
 * Filter state is controlled by parent component.
 */
export function SessionFilter({
  stores,
  currencies,
  filters,
  onFiltersChange,
  profitUnit,
  onProfitUnitChange,
}: SessionFilterProps) {
  // Draft filter state (used in drawer, only applied on "Apply" click)
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters)

  // Drawer state
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false)

  const isFiltered = hasActiveFilters(filters)

  // Open drawer and sync draft with applied
  const handleOpenDrawer = () => {
    setDraftFilters(filters)
    openDrawer()
  }

  // Apply filters from drawer
  const handleApplyFilters = () => {
    onFiltersChange(draftFilters)
    closeDrawer()
  }

  // Clear draft filters in drawer
  const handleClearDraftFilters = () => {
    setDraftFilters(defaultFilters)
  }

  // Clear all applied filters
  const handleClearAppliedFilters = () => {
    onFiltersChange(defaultFilters)
  }

  // Remove single filter from applied
  const removeAppliedFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters }
    if (key === 'periodPreset') {
      newFilters.periodPreset = 'all'
      newFilters.customDateRange = [null, null]
    } else if (key === 'gameType') {
      newFilters.gameType = 'all'
    } else {
      newFilters[key] = null as never
    }
    onFiltersChange(newFilters)
  }

  // Store options for select
  const storeSelectOptions = stores.map((store) => ({
    value: store.id,
    label: store.name,
  }))

  // Currency options for select
  const currencySelectOptions = currencies.map((currency) => ({
    value: currency.id,
    label: currency.name,
  }))

  // Quick filter options for SegmentedControl (icons only for Cash/Tournament)
  const quickFilterData = gameTypeOptions.map((opt) => ({
    value: opt.value,
    label:
      opt.value === 'all' ? (
        opt.label
      ) : (
        <GameTypeIcon gameType={opt.value} size={16} colored />
      ),
  }))

  // Determine which profit unit toggle to show
  const showProfitUnitToggle = filters.gameType !== 'all'
  const profitUnitOptions =
    filters.gameType === 'cash'
      ? [
          { value: 'real', label: '実収支' },
          { value: 'bb', label: 'BB' },
        ]
      : [
          { value: 'real', label: '実収支' },
          { value: 'bi', label: 'BI' },
        ]
  // Normalize profitUnit value for current gameType
  const normalizedProfitUnit =
    filters.gameType === 'cash' && profitUnit === 'bi'
      ? 'real'
      : filters.gameType === 'tournament' && profitUnit === 'bb'
        ? 'real'
        : profitUnit

  // Check if there are any active filters to display (excluding gameType which is in quick filter)
  const hasActiveFilterBadges =
    filters.periodPreset !== 'all' ||
    filters.currencyId !== null ||
    filters.storeId !== null

  return (
    <>
      {/* Row 1: Filter Button + Quick Selector */}
      <Group gap="sm" justify="space-between">
        <SegmentedControl
          data={quickFilterData}
          onChange={(value) =>
            onFiltersChange({
              ...filters,
              gameType: value as FilterState['gameType'],
            })
          }
          size="xs"
          value={filters.gameType}
        />
        <Button
          leftSection={<IconFilter size={16} />}
          onClick={handleOpenDrawer}
          size="xs"
          variant="light"
        >
          Filter
        </Button>
      </Group>

      {/* Row 2: Active Filters (scrollable) + Profit Unit Toggle (always visible when applicable) */}
      {(hasActiveFilterBadges || showProfitUnitToggle) && (
        <Group gap="sm" wrap="nowrap" justify="space-between">
          {/* Scrollable active filters area */}
          <ScrollArea type="scroll" offsetScrollbars scrollbarSize={4} style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" wrap="nowrap">
              {filters.periodPreset !== 'all' && (
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
                  style={{ flexShrink: 0 }}
                >
                  {
                    periodOptions.find((p) => p.value === filters.periodPreset)
                      ?.label
                  }
                </Badge>
              )}
              {filters.currencyId && (
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
                  style={{ flexShrink: 0 }}
                >
                  {currencies.find((c) => c.id === filters.currencyId)?.name}
                </Badge>
              )}
              {filters.storeId && (
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
                  style={{ flexShrink: 0 }}
                >
                  {stores.find((s) => s.id === filters.storeId)?.name}
                </Badge>
              )}
              {hasActiveFilterBadges && (
                <Button
                  color="gray"
                  onClick={handleClearAppliedFilters}
                  size="compact-xs"
                  variant="subtle"
                  style={{ flexShrink: 0 }}
                >
                  Clear
                </Button>
              )}
            </Group>
          </ScrollArea>

          {/* Profit Unit Toggle - always visible when Cash/Tournament is selected */}
          {showProfitUnitToggle && (
            <Box style={{ flexShrink: 0 }}>
              <SegmentedControl
                data={profitUnitOptions}
                onChange={(value) => onProfitUnitChange(value as ProfitUnit)}
                size="xs"
                value={normalizedProfitUnit}
              />
            </Box>
          )}
        </Group>
      )}

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
                  customDateRange: value as [Date | null, Date | null],
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
            data={currencySelectOptions}
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
            data={storeSelectOptions}
            label="Store"
            onChange={(value) =>
              setDraftFilters((prev) => ({ ...prev, storeId: value }))
            }
            placeholder="All stores"
            searchable
            value={draftFilters.storeId}
          />

          <Group gap="sm" justify="flex-end" mt="md">
            <Button onClick={handleClearDraftFilters} variant="subtle">
              Clear all
            </Button>
            <Button onClick={handleApplyFilters}>Apply</Button>
          </Group>
        </Stack>
      </Drawer>
    </>
  )
}
