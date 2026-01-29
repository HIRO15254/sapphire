'use client'

import {
  Button,
  Drawer,
  Group,
  Badge,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import { IconFilter, IconX } from '@tabler/icons-react'
import { useState } from 'react'
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
  StoreOption,
} from '../lib/types'

interface SessionFilterProps {
  stores: StoreOption[]
  currencies: CurrencyOption[]
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
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

  return (
    <>
      {/* Filter Button */}
      <Group gap="sm" justify="flex-end">
        <Button
          leftSection={<IconFilter size={16} />}
          onClick={handleOpenDrawer}
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
          {filters.gameType !== 'all' && (
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
              {gameTypeOptions.find((g) => g.value === filters.gameType)?.label}
            </Badge>
          )}
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
            >
              {stores.find((s) => s.id === filters.storeId)?.name}
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
