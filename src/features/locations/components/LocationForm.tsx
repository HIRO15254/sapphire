"use client";

import { Button, Group, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";

export interface LocationFormValues {
  name: string;
}

export interface LocationFormProps {
  initialValues?: Partial<LocationFormValues>;
  onSubmit: (values: LocationFormValues) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

/**
 * 店舗フォームコンポーネント
 *
 * 責務:
 * - 店舗名の入力
 * - バリデーション
 */
export function LocationForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "保存",
}: LocationFormProps) {
  const form = useForm<LocationFormValues>({
    initialValues: {
      name: initialValues?.name ?? "",
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return "店舗名を入力してください";
        if (value.trim().length > 100) return "店舗名は100文字以内で入力してください";
        return null;
      },
    },
  });

  const handleSubmit = (values: LocationFormValues) => {
    onSubmit({ name: values.name.trim() });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="店舗名"
          placeholder="例: ポーカースタジアム渋谷"
          withAsterisk
          {...form.getInputProps("name")}
        />

        <Group justify="flex-end" gap="sm">
          {onCancel && (
            <Button variant="subtle" onClick={onCancel} disabled={isLoading}>
              キャンセル
            </Button>
          )}
          <Button type="submit" loading={isLoading}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
