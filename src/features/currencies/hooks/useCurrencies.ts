"use client";

import { api } from "@/trpc/react";

/**
 * 通貨一覧を取得するカスタムフック
 */
export function useCurrencies() {
  const { data: currencies, isLoading, error } = api.currencies.getAll.useQuery();

  return {
    currencies: currencies ?? [],
    isLoading,
    error,
  };
}

/**
 * 通貨を作成するカスタムフック
 */
export function useCreateCurrency() {
  const ctx = api.useUtils();

  return api.currencies.create.useMutation({
    onSuccess: () => {
      void ctx.currencies.getAll.invalidate();
    },
  });
}

/**
 * 通貨を更新するカスタムフック
 */
export function useUpdateCurrency() {
  const ctx = api.useUtils();

  return api.currencies.update.useMutation({
    onSuccess: (data) => {
      void ctx.currencies.getAll.invalidate();
      void ctx.currencies.getById.invalidate({ id: data.id });
    },
  });
}

/**
 * 通貨を削除するカスタムフック
 */
export function useDeleteCurrency() {
  const ctx = api.useUtils();

  return api.currencies.delete.useMutation({
    onSuccess: () => {
      void ctx.currencies.getAll.invalidate();
    },
  });
}

/**
 * 通貨の使用状況を確認するカスタムフック
 */
export function useCurrencyUsage(id: number | undefined) {
  return api.currencies.checkUsage.useQuery(
    { id: id ?? 0 },
    { enabled: id !== undefined && id > 0 }
  );
}

/**
 * 通貨の保有量を更新するカスタムフック
 */
export function useUpdateCurrencyBalance() {
  const ctx = api.useUtils();

  return api.currencies.updateBalance.useMutation({
    onSuccess: (data) => {
      void ctx.currencies.getAll.invalidate();
      void ctx.currencies.getById.invalidate({ id: data.id });
    },
  });
}
