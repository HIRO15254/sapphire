"use client";

import { api } from "@/trpc/react";
import { useCallback } from "react";
import { LocationSelect, type LocationSelectProps } from "../components/LocationSelect";
import { useLocations } from "../hooks/useLocations";

type LocationSelectContainerProps = Omit<LocationSelectProps, "locations" | "onCreateNew">;

export function LocationSelectContainer({
  value,
  onChange,
  ...props
}: LocationSelectContainerProps) {
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
        // Invalidate first - the onChange will be called with undefined locationId
        // because the new location isn't in the cache yet
      } catch (error) {
        console.error("Failed to create location:", error);
        throw error;
      }
    },
    [createLocation]
  );

  // Wrap onChange to also look up locationId from locations
  const handleChange = useCallback(
    (newValue: string | null, locationId: number | undefined) => {
      // If locationId is undefined but we have a value, try to find it in locations
      let resolvedLocationId = locationId;
      if (!resolvedLocationId && newValue) {
        const found = locations.find((loc) => loc.value === newValue);
        resolvedLocationId = found?.id;
      }
      onChange(newValue, resolvedLocationId);
    },
    [onChange, locations]
  );

  return (
    <LocationSelect
      value={value}
      onChange={handleChange}
      locations={locations}
      onCreateNew={handleCreateNew}
      isLoading={isLoadingLocations || isCreating}
      {...props}
    />
  );
}
