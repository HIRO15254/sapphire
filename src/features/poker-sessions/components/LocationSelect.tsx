"use client";

import { Select, type SelectProps } from "@mantine/core";
import { useMemo, useState } from "react";

export interface LocationOption {
  value: string;
  label: string;
}

export interface LocationSelectProps
  extends Omit<SelectProps, "data" | "searchable" | "value" | "onChange"> {
  value: string | null;
  onChange: (value: string | null) => void;
  locations?: LocationOption[];
  onCreateNew?: (locationName: string) => Promise<void>;
  isLoading?: boolean;
}

export function LocationSelect({
  value,
  onChange,
  locations = [],
  onCreateNew,
  isLoading = false,
  error,
  ...props
}: LocationSelectProps) {
  const [searchValue, setSearchValue] = useState("");

  // Prepare select data from locations
  const selectData = useMemo(
    () => locations.map((loc) => ({ value: loc.value, label: loc.label })),
    [locations]
  );

  // Handle creating new location
  const handleCreate = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || !onCreateNew) return null;

    try {
      await onCreateNew(trimmedQuery);
      // After creation, select the new location
      onChange(trimmedQuery);
      setSearchValue("");
      return trimmedQuery;
    } catch (error) {
      console.error("Failed to create location:", error);
      return null;
    }
  };

  return (
    <Select
      label="場所"
      placeholder="例: ポーカースタジアム渋谷"
      withAsterisk
      data={selectData}
      value={value}
      onChange={onChange}
      searchable
      creatable={!!onCreateNew}
      getCreateLabel={(query) => `+ 新規追加: ${query}`}
      onCreate={onCreateNew ? handleCreate : undefined}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      disabled={isLoading}
      error={error}
      maxDropdownHeight={300}
      limit={50}
      filter={({ options, search }) => {
        const filtered = options.filter((option) =>
          option.label.toLowerCase().includes(search.toLowerCase().trim())
        );
        return filtered;
      }}
      {...props}
    />
  );
}
