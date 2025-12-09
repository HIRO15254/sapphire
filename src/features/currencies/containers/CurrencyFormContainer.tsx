"use client";

import { notifications } from "@mantine/notifications";
import { CurrencyForm, type CurrencyFormValues } from "../components/CurrencyForm";
import { useCreateCurrency, useUpdateCurrency } from "../hooks/useCurrencies";

export interface CurrencyFormContainerProps {
  mode: "create" | "edit";
  currencyId?: number;
  initialValues?: Partial<CurrencyFormValues>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CurrencyFormContainer({
  mode,
  currencyId,
  initialValues,
  onSuccess,
  onCancel,
}: CurrencyFormContainerProps) {
  const createCurrency = useCreateCurrency();
  const updateCurrency = useUpdateCurrency();

  const isSubmitting = createCurrency.isPending || updateCurrency.isPending;

  const handleSubmit = async (values: CurrencyFormValues) => {
    try {
      if (mode === "create") {
        await createCurrency.mutateAsync(values);
        notifications.show({
          title: "通貨を追加しました",
          message: `「${values.name}」を追加しました`,
          color: "green",
        });
      } else if (currencyId) {
        await updateCurrency.mutateAsync({ id: currencyId, ...values });
        notifications.show({
          title: "通貨を更新しました",
          message: `「${values.name}」に更新しました`,
          color: "green",
        });
      }
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "エラーが発生しました";
      notifications.show({
        title: mode === "create" ? "通貨の追加に失敗しました" : "通貨の更新に失敗しました",
        message,
        color: "red",
      });
    }
  };

  return (
    <CurrencyForm
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      submitLabel={mode === "create" ? "追加" : "更新"}
    />
  );
}
