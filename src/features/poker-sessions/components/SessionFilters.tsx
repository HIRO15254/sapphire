"use client";

import { Button, Collapse, Grid, Group, MultiSelect, Paper, Select, Stack } from "@mantine/core";
import { DatePickerInput, type DatesRangeValue } from "@mantine/dates";
import { IconFilter, IconFilterOff, IconSearch } from "@tabler/icons-react";
import { useState } from "react";

interface SessionFiltersProps {
  locations: string[];
  tags?: Array<{ id: number; name: string }>;
  onApplyFilters: (filters: {
    location?: string;
    tagIds?: number[];
    startDate?: Date;
    endDate?: Date;
  }) => void;
  onClearFilters: () => void;
  isFiltering: boolean;
}

export function SessionFilters({
  locations,
  tags = [],
  onApplyFilters,
  onClearFilters,
  isFiltering,
}: SessionFiltersProps) {
  const [opened, setOpened] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DatesRangeValue>([null, null]);

  const handleApply = () => {
    const filters: {
      location?: string;
      tagIds?: number[];
      startDate?: Date;
      endDate?: Date;
    } = {};

    if (location) {
      filters.location = location;
    }
    if (selectedTagIds.length > 0) {
      filters.tagIds = selectedTagIds.map((id) => Number.parseInt(id, 10));
    }
    if (dateRange[0]) {
      filters.startDate = dateRange[0] instanceof Date ? dateRange[0] : new Date(dateRange[0]);
    }
    if (dateRange[1]) {
      filters.endDate = dateRange[1] instanceof Date ? dateRange[1] : new Date(dateRange[1]);
    }

    onApplyFilters(filters);
  };

  const handleClear = () => {
    setLocation(null);
    setSelectedTagIds([]);
    setDateRange([null, null]);
    onClearFilters();
  };

  const hasActiveFilters =
    location !== null ||
    selectedTagIds.length > 0 ||
    dateRange[0] !== null ||
    dateRange[1] !== null;

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Button
            variant="light"
            leftSection={<IconFilter size={16} />}
            onClick={() => setOpened(!opened)}
          >
            {opened ? "フィルターを閉じる" : "フィルター"}
          </Button>

          {isFiltering && (
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconFilterOff size={16} />}
              onClick={handleClear}
            >
              フィルターをクリア
            </Button>
          )}
        </Group>

        <Collapse in={opened}>
          <Stack gap="md">
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Select
                  label="場所"
                  placeholder="場所を選択"
                  data={locations.map((loc) => ({ value: loc, label: loc }))}
                  value={location}
                  onChange={setLocation}
                  clearable
                  searchable
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <MultiSelect
                  label="タグ"
                  placeholder="タグで絞り込み"
                  data={tags.map((tag) => ({ value: tag.id.toString(), label: tag.name }))}
                  value={selectedTagIds}
                  onChange={setSelectedTagIds}
                  clearable
                  searchable
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <DatePickerInput
                  type="range"
                  label="期間"
                  placeholder="開始日 〜 終了日"
                  value={dateRange}
                  onChange={setDateRange}
                  clearable
                />
              </Grid.Col>
            </Grid>

            <Group justify="flex-end">
              <Button
                leftSection={<IconSearch size={16} />}
                onClick={handleApply}
                disabled={!hasActiveFilters}
              >
                検索
              </Button>
            </Group>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
