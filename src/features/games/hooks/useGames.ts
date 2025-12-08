"use client";

import { api } from "@/trpc/react";

/**
 * 全ゲーム一覧を取得するカスタムフック
 */
export function useGames(options?: { includeArchived?: boolean }) {
  const { data: games, isLoading, error } = api.games.getAll.useQuery(options);

  return {
    games: games ?? [],
    isLoading,
    error,
  };
}

/**
 * 特定の店舗のゲーム一覧を取得するカスタムフック
 */
export function useGamesByLocation(
  locationId: number | undefined,
  options?: { includeArchived?: boolean }
) {
  const {
    data: games,
    isLoading,
    error,
  } = api.games.getByLocation.useQuery(
    { locationId: locationId ?? 0, includeArchived: options?.includeArchived ?? true },
    { enabled: locationId !== undefined && locationId > 0 }
  );

  return {
    games: games ?? [],
    isLoading,
    error,
  };
}

/**
 * 特定の店舗のアクティブなゲーム一覧を取得するカスタムフック
 * (セッション登録フォーム用)
 */
export function useActiveGamesByLocation(locationId: number | undefined) {
  const {
    data: games,
    isLoading,
    error,
  } = api.games.getActiveByLocation.useQuery(
    { locationId: locationId ?? 0 },
    { enabled: locationId !== undefined && locationId > 0 }
  );

  return {
    games: games ?? [],
    isLoading,
    error,
  };
}

/**
 * ゲームを作成するカスタムフック
 */
export function useCreateGame() {
  const ctx = api.useUtils();

  return api.games.create.useMutation({
    onSuccess: (data) => {
      void ctx.games.getAll.invalidate();
      void ctx.games.getByLocation.invalidate({ locationId: data.location.id });
      void ctx.games.getActiveByLocation.invalidate({ locationId: data.location.id });
    },
  });
}

/**
 * ゲームを更新するカスタムフック
 */
export function useUpdateGame() {
  const ctx = api.useUtils();

  return api.games.update.useMutation({
    onSuccess: (data) => {
      void ctx.games.getAll.invalidate();
      void ctx.games.getById.invalidate({ id: data.id });
      void ctx.games.getByLocation.invalidate({ locationId: data.location.id });
      void ctx.games.getActiveByLocation.invalidate({ locationId: data.location.id });
    },
  });
}

/**
 * ゲームをアーカイブするカスタムフック
 */
export function useArchiveGame() {
  const ctx = api.useUtils();

  return api.games.archive.useMutation({
    onSuccess: () => {
      void ctx.games.invalidate();
    },
  });
}

/**
 * ゲームのアーカイブを解除するカスタムフック
 */
export function useUnarchiveGame() {
  const ctx = api.useUtils();

  return api.games.unarchive.useMutation({
    onSuccess: () => {
      void ctx.games.invalidate();
    },
  });
}

/**
 * ゲームを削除するカスタムフック
 */
export function useDeleteGame() {
  const ctx = api.useUtils();

  return api.games.delete.useMutation({
    onSuccess: () => {
      void ctx.games.invalidate();
    },
  });
}

/**
 * ゲームの使用状況を確認するカスタムフック
 */
export function useGameUsage(id: number | undefined) {
  return api.games.checkUsage.useQuery({ id: id ?? 0 }, { enabled: id !== undefined && id > 0 });
}
