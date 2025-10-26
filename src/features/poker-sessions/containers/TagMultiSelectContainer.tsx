"use client";

import { api } from "@/trpc/react";
import { useCallback } from "react";
import { TagMultiSelect, type TagMultiSelectProps } from "../components/TagMultiSelect";
import { useTags } from "../hooks/useTags";

type TagMultiSelectContainerProps = Omit<TagMultiSelectProps, "tags" | "onCreateNew">;

export function TagMultiSelectContainer({ value, onChange, ...props }: TagMultiSelectContainerProps) {
  const { tags, isLoading: isLoadingTags } = useTags();
  const utils = api.useUtils();

  // Mutation for creating new tag
  const { mutateAsync: createTag, isPending: isCreating } = api.tags.create.useMutation({
    onSuccess: () => {
      // Invalidate tags cache to refetch the list
      void utils.tags.getAll.invalidate();
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

  return (
    <TagMultiSelect
      value={value}
      onChange={onChange}
      tags={tags}
      onCreateNew={handleCreateNew}
      isLoading={isLoadingTags || isCreating}
      {...props}
    />
  );
}
