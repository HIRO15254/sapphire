"use client";

import { api } from "@/trpc/react";

/**
 * 店舗一覧を取得するカスタムフック
 */
export function useLocations(search?: string) {
  const { data: locations, isLoading, error, refetch } = api.locations.getAll.useQuery({ search });

  return {
    locations: locations ?? [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * 単一店舗を取得するカスタムフック
 */
export function useLocation(id: number | undefined) {
  const { data, isLoading, error, refetch } = api.locations.getById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  return {
    location: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * 店舗一覧をセレクト用に変換するカスタムフック
 */
export function useLocationOptions() {
  const { locations, isLoading } = useLocations();

  return {
    locations: locations.map((loc) => ({
      value: loc.name,
      label: loc.name,
      id: loc.id,
    })),
    isLoading,
  };
}

/**
 * 店舗を作成するカスタムフック
 */
export function useCreateLocation() {
  const ctx = api.useUtils();

  return api.locations.create.useMutation({
    onSuccess: () => {
      void ctx.locations.getAll.invalidate();
    },
  });
}

/**
 * 店舗を更新するカスタムフック
 */
export function useUpdateLocation() {
  const ctx = api.useUtils();

  return api.locations.update.useMutation({
    onSuccess: (data) => {
      void ctx.locations.getAll.invalidate();
      void ctx.locations.getById.invalidate({ id: data.id });
    },
  });
}

/**
 * 店舗を削除するカスタムフック
 */
export function useDeleteLocation() {
  const ctx = api.useUtils();

  return api.locations.delete.useMutation({
    onSuccess: () => {
      void ctx.locations.getAll.invalidate();
    },
  });
}
