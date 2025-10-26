"use client";

import { api } from "@/trpc/react";
import { useCallback } from "react";
import { LocationSelect, type LocationSelectProps } from "../components/LocationSelect";
import { useLocations } from "../hooks/useLocations";

type LocationSelectContainerProps = Omit<LocationSelectProps, "locations" | "onCreateNew">;

export function LocationSelectContainer({ value, onChange, ...props }: LocationSelectContainerProps) {
  const { locations, isLoading: isLoadingLocations } = useLocations();
  const utils = api.useUtils();

  // Mutation for creating new location
  const { mutateAsync: createLocation, isPending: isCreating } = api.locations.create.useMutation({
    onSuccess: () => {
      // Invalidate locations cache to refetch the list
      void utils.locations.getAll.invalidate();
    },
  });

  // Handle creating new location
  const handleCreateNew = useCallback(
    async (locationName: string) => {
      try {
        await createLocation({ name: locationName });
      } catch (error) {
        console.error("Failed to create location:", error);
        throw error;
      }
    },
    [createLocation]
  );

  return (
    <LocationSelect
      value={value}
      onChange={onChange}
      locations={locations}
      onCreateNew={handleCreateNew}
      isLoading={isLoadingLocations || isCreating}
      {...props}
    />
  );
}
