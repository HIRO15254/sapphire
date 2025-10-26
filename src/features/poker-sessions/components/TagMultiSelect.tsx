"use client";

import { ActionIcon, Group, MultiSelect, type MultiSelectProps, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconTrash } from "@tabler/icons-react";
import { useMemo, useState } from "react";

export interface TagOption {
  value: string;
  label: string;
  id?: number;
}

export interface TagMultiSelectProps
  extends Omit<MultiSelectProps, "data" | "searchable" | "value" | "onChange"> {
  value: string[];
  onChange: (value: string[]) => void;
  tags?: TagOption[];
  onCreateNew?: (tagName: string) => Promise<void>;
  onDelete?: (tagId: number, tagName: string) => Promise<void>;
  isLoading?: boolean;
  maxTags?: number;
}

const CREATE_PREFIX = "__create__:";

export function TagMultiSelect({
  value,
  onChange,
  tags = [],
  onCreateNew,
  onDelete,
  isLoading = false,
  maxTags = 20,
  error,
  ...props
}: TagMultiSelectProps) {
  const [searchValue, setSearchValue] = useState("");

  // Prepare select data with optional create option
  const selectData = useMemo(() => {
    const tagOptions = tags.map((tag) => ({
      value: tag.value,
      label: tag.label,
      id: tag.id,
    }));

    // Add create option if search value doesn't match existing tags and onCreateNew is provided
    if (searchValue.trim() && onCreateNew && value.length < maxTags) {
      const existingMatch = tags.find(
        (tag) => tag.value.toLowerCase() === searchValue.trim().toLowerCase()
      );
      const alreadySelected = value.some(
        (v) => v.toLowerCase() === searchValue.trim().toLowerCase()
      );
      if (!existingMatch && !alreadySelected) {
        tagOptions.unshift({
          value: `${CREATE_PREFIX}${searchValue.trim()}`,
          label: `+ 新規追加: ${searchValue.trim()}`,
          id: undefined,
        });
      }
    }

    return tagOptions;
  }, [tags, searchValue, onCreateNew, value, maxTags]);

  // Handle delete with confirmation
  const handleDelete = (tagId: number, tagName: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!onDelete) return;

    modals.openConfirmModal({
      title: "タグを削除",
      children: (
        <Text size="sm">
          「{tagName}」を削除してもよろしいですか？
          <br />
          このタグが設定されている全てのセッションから削除されます。
        </Text>
      ),
      labels: { confirm: "削除", cancel: "キャンセル" },
      confirmProps: { color: "red" },
      onConfirm: () => onDelete(tagId, tagName),
    });
  };

  // Handle selection (including create option)
  const handleChange = async (selectedValues: string[]) => {
    // Enforce max tags limit
    if (selectedValues.length > maxTags) {
      return;
    }

    // Check if any value is a create option
    const createValue = selectedValues.find((v) => v.startsWith(CREATE_PREFIX));
    if (createValue && onCreateNew) {
      const newTagName = createValue.slice(CREATE_PREFIX.length);
      try {
        await onCreateNew(newTagName);
        // Replace the create prefix value with the actual tag name
        const updatedValues = selectedValues
          .filter((v) => v !== createValue)
          .concat(newTagName);
        onChange(updatedValues);
        setSearchValue("");
      } catch (error) {
        console.error("Failed to create tag:", error);
      }
    } else {
      onChange(selectedValues);
    }
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
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      disabled={isLoading}
      error={error}
      maxDropdownHeight={300}
      limit={50}
      clearable
      renderOption={({ option }) => {
        const optionData = selectData.find((item) => item.value === option.value);
        const isCreateOption = option.value.startsWith(CREATE_PREFIX);

        // Create option - no delete button
        if (isCreateOption) {
          return <Text>{option.label}</Text>;
        }

        // Regular option - show delete button if onDelete is provided and has ID
        return (
          <Group justify="space-between" wrap="nowrap" style={{ width: "100%" }}>
            <Text style={{ flex: 1 }}>{option.label}</Text>
            {onDelete && optionData?.id && (
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={(e) => handleDelete(optionData.id!, option.label, e)}
                aria-label={`${option.label}を削除`}
              >
                <IconTrash size={14} />
              </ActionIcon>
            )}
          </Group>
        );
      }}
      {...props}
    />
  );
}
