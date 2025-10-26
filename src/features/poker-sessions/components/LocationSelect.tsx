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

const CREATE_PREFIX = "__create__:";

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

  // Prepare select data with optional create option
  const selectData = useMemo(() => {
    const locationOptions = locations.map((loc) => ({ value: loc.value, label: loc.label }));

    // Add create option if search value doesn't match existing locations and onCreateNew is provided
    if (searchValue.trim() && onCreateNew) {
      const existingMatch = locations.find(
        (loc) => loc.value.toLowerCase() === searchValue.trim().toLowerCase()
      );
      if (!existingMatch) {
        locationOptions.unshift({
          value: `${CREATE_PREFIX}${searchValue.trim()}`,
          label: `+ 新規追加: ${searchValue.trim()}`,
        });
      }
    }

    return locationOptions;
  }, [locations, searchValue, onCreateNew]);

  // Handle selection (including create option)
  const handleChange = async (selectedValue: string | null) => {
    if (selectedValue?.startsWith(CREATE_PREFIX)) {
      const newLocationName = selectedValue.slice(CREATE_PREFIX.length);
      if (onCreateNew) {
        try {
          await onCreateNew(newLocationName);
          onChange(newLocationName);
          setSearchValue("");
        } catch (error) {
          console.error("Failed to create location:", error);
        }
      }
    } else {
      onChange(selectedValue);
    }
  };

  return (
    <Select
      label="場所"
      placeholder="例: ポーカースタジアム渋谷"
      withAsterisk
      data={selectData}
      value={value}
      onChange={handleChange}
      searchable
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      disabled={isLoading}
      error={error}
      maxDropdownHeight={300}
      limit={50}
      {...props}
    />
  );
}
