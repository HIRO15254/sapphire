"use client";

import { MultiSelect, type MultiSelectProps } from "@mantine/core";
import { useMemo, useState } from "react";

export interface TagOption {
  value: string;
  label: string;
}

export interface TagMultiSelectProps
  extends Omit<MultiSelectProps, "data" | "searchable" | "value" | "onChange"> {
  value: string[];
  onChange: (value: string[]) => void;
  tags?: TagOption[];
  onCreateNew?: (tagName: string) => Promise<void>;
  isLoading?: boolean;
  maxTags?: number;
}

export function TagMultiSelect({
  value,
  onChange,
  tags = [],
  onCreateNew,
  isLoading = false,
  maxTags = 20,
  error,
  ...props
}: TagMultiSelectProps) {
  const [searchValue, setSearchValue] = useState("");

  // Prepare select data from tags
  const selectData = useMemo(() => tags.map((tag) => ({ value: tag.value, label: tag.label })), [tags]);

  // Handle creating new tag
  const handleCreate = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || !onCreateNew) return null;

    // Check max tags limit
    if (value.length >= maxTags) {
      return null;
    }

    try {
      await onCreateNew(trimmedQuery);
      // After creation, add the new tag to selection
      onChange([...value, trimmedQuery]);
      setSearchValue("");
      return trimmedQuery;
    } catch (error) {
      console.error("Failed to create tag:", error);
      return null;
    }
  };

  // Handle tag removal
  const handleChange = (newValue: string[]) => {
    // Enforce max tags limit
    if (newValue.length > maxTags) {
      return;
    }
    onChange(newValue);
  };

  return (
    <MultiSelect
      label="タグ"
      placeholder="例: トーナメント, ハイステークス"
      description={`最大${maxTags}個まで設定可能`}
      data={selectData}
      value={value}
      onChange={handleChange}
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
      clearable
      {...props}
    />
  );
}
