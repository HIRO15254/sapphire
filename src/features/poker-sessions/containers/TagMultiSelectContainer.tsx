"use client";

import { api } from "@/trpc/react";
import { notifications } from "@mantine/notifications";
import { useCallback } from "react";
import { TagMultiSelect, type TagMultiSelectProps } from "../components/TagMultiSelect";
import { useTags } from "../hooks/useTags";

type TagMultiSelectContainerProps = Omit<TagMultiSelectProps, "tags" | "onCreateNew" | "onDelete">;

export function TagMultiSelectContainer({
  value,
  onChange,
  ...props
}: TagMultiSelectContainerProps) {
  const { tags, isLoading: isLoadingTags } = useTags();
  const utils = api.useUtils();

  // Mutation for creating new tag
  const { mutateAsync: createTag, isPending: isCreating } = api.tags.create.useMutation({
    onSuccess: () => {
      // Invalidate tags cache to refetch the list
      void utils.tags.getAll.invalidate();
    },
  });

  // Mutation for deleting tag
  const { mutateAsync: deleteTag, isPending: isDeleting } = api.tags.delete.useMutation({
    onSuccess: (data) => {
      // Invalidate caches to refetch data
      void utils.tags.getAll.invalidate();
      void utils.sessions.getAll.invalidate();
      void utils.sessions.getStats.invalidate();

      notifications.show({
        title: "削除成功",
        message: `タグを削除しました${data.affectedSessions > 0 ? ` (${data.affectedSessions}件のセッションから削除)` : ""}`,
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: "削除失敗",
        message: error.message,
        color: "red",
      });
    },
  });

  // Handle creating new tag
  const handleCreateNew = useCallback(
    async (tagName: string) => {
      try {
        await createTag({ name: tagName });
      } catch (error) {
        console.error("Failed to create tag:", error);
        throw error;
      }
    },
    [createTag]
  );

  // Handle deleting tag
  const handleDelete = useCallback(
    async (tagId: number, tagName: string) => {
      try {
        await deleteTag({ id: tagId });
        // Remove the tag from the current selection if it's selected
        if (value.includes(tagName)) {
          onChange(value.filter((v) => v !== tagName));
        }
      } catch (error) {
        console.error("Failed to delete tag:", error);
        throw error;
      }
    },
    [deleteTag, value, onChange]
  );

  return (
    <TagMultiSelect
      value={value}
      onChange={onChange}
      tags={tags}
      onCreateNew={handleCreateNew}
      onDelete={handleDelete}
      isLoading={isLoadingTags || isCreating || isDeleting}
      {...props}
    />
  );
}
