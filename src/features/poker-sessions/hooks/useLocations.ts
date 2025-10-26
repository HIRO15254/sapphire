import { api } from "@/trpc/react";
import { useMemo } from "react";
import type { LocationOption } from "../components/LocationSelect";

export interface UseLocationsOptions {
  search?: string;
}

export function useLocations(options: UseLocationsOptions = {}) {
  const { search } = options;

  // Fetch locations from API
  const { data: locationsData, isLoading, error } = api.locations.getAll.useQuery({ search });

  // Format locations for Select component
  const locations: LocationOption[] = useMemo(() => {
    if (!locationsData) return [];
    return locationsData.map((location) => ({
      value: location.name,
      label: location.name,
    }));
  }, [locationsData]);

  return {
    locations,
    isLoading,
    error,
  };
}
