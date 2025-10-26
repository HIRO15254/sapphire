import { api } from "@/trpc/react";
import { useMemo } from "react";
import type { TagOption } from "../components/TagMultiSelect";

export interface UseTagsOptions {
  search?: string;
}

export function useTags(options: UseTagsOptions = {}) {
  const { search } = options;

  // Fetch tags from API
  const { data: tagsData, isLoading, error } = api.tags.getAll.useQuery({ search });

  // Format tags for MultiSelect component
  const tags: TagOption[] = useMemo(() => {
    if (!tagsData) return [];
    return tagsData.map((tag) => ({
      value: tag.name,
      label: tag.name,
    }));
  }, [tagsData]);

  return {
    tags,
    isLoading,
    error,
  };
}
