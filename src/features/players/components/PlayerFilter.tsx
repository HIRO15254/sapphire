'use client'

import {
  Badge,
  Button,
  Drawer,
  Group,
  MultiSelect,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconFilter, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { defaultPlayerFilters } from '../lib/constants'
import { hasActivePlayerFilters } from '../lib/filter-utils'
import type { PlayerFilterState, TagOption } from '../lib/types'

interface PlayerFilterProps {
  tags: TagOption[]
  filters: PlayerFilterState
  onFiltersChange: (filters: PlayerFilterState) => void
}

/**
 * Player filter component.
 *
 * Manages filter UI with bottom sheet drawer.
 * Filter state is controlled by parent component.
 */
export function PlayerFilter({
  tags,
  filters,
  onFiltersChange,
}: PlayerFilterProps) {
  // Draft filter state (used in drawer, only applied on "Apply" click)
  const [draftFilters, setDraftFilters] =
    useState<PlayerFilterState>(filters)

  // Drawer state
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false)

  const isFiltered = hasActivePlayerFilters(filters)

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
    setDraftFilters(defaultPlayerFilters)
  }

  // Clear all applied filters
  const handleClearAppliedFilters = () => {
    onFiltersChange(defaultPlayerFilters)
  }

  // Remove search from applied filters
  const removeSearchFilter = () => {
    onFiltersChange({ ...filters, search: '' })
  }

  // Remove a specific tag from applied filters
  const removeTagFilter = (tagId: string) => {
    onFiltersChange({
      ...filters,
      tagIds: filters.tagIds.filter((id) => id !== tagId),
    })
  }

  // Tag options for MultiSelect
  const tagSelectOptions = tags.map((tag) => ({
    value: tag.id,
    label: tag.name,
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
          {filters.search && (
            <Badge
              rightSection={
                <IconX
                  onClick={removeSearchFilter}
                  size={12}
                  style={{ cursor: 'pointer' }}
                />
              }
              size="sm"
              variant="light"
            >
              {filters.search}
            </Badge>
          )}
          {filters.tagIds.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId)
            if (!tag) return null
            return (
              <Badge
                color={tag.color ?? undefined}
                key={tagId}
                rightSection={
                  <IconX
                    onClick={() => removeTagFilter(tagId)}
                    size={12}
                    style={{ cursor: 'pointer' }}
                  />
                }
                size="sm"
                variant="light"
              >
                {tag.name}
              </Badge>
            )
          })}
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
        title="Filter Players"
      >
        <Stack gap="md" pb="md">
          <TextInput
            label="Search"
            onChange={(e) =>
              setDraftFilters((prev) => ({
                ...prev,
                search: e.currentTarget.value,
              }))
            }
            placeholder="Player name"
            value={draftFilters.search}
          />

          <MultiSelect
            clearable
            comboboxProps={{ position: 'bottom', middlewares: { flip: false } }}
            data={tagSelectOptions}
            label="Tags"
            onChange={(value) =>
              setDraftFilters((prev) => ({ ...prev, tagIds: value }))
            }
            placeholder="Select tags"
            searchable
            value={draftFilters.tagIds}
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
