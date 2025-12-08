"use client";

import { Button, Group, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";

export interface CurrencyFormValues {
  name: string;
  prefix: string;
}

export interface CurrencyFormProps {
  initialValues?: Partial<CurrencyFormValues>;
  onSubmit: (values: CurrencyFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function CurrencyForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "保存",
}: CurrencyFormProps) {
  const form = useForm<CurrencyFormValues>({
    initialValues: {
      name: initialValues?.name ?? "",
      prefix: initialValues?.prefix ?? "",
    },
    validate: {
      name: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return "通貨名は必須です";
        if (trimmed.length > 100) return "通貨名は100文字以内です";
        return null;
      },
      prefix: (value) => {
        if (value.length > 10) return "プレフィックスは10文字以内です";
        return null;
      },
    },
  });

  const handleSubmit = (values: CurrencyFormValues) => {
    onSubmit({ name: values.name.trim(), prefix: values.prefix.trim() });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="通貨名"
          placeholder="例: GGポイント、JOPTポイント"
          required
          {...form.getInputProps("name")}
        />

        <TextInput
          label="プレフィックス"
          placeholder="例: GG, JOPT"
          description="収支表示で使用される通貨の略称（任意）"
          maxLength={10}
          {...form.getInputProps("prefix")}
        />

        <Group justify="flex-end" gap="sm">
          {onCancel && (
            <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
              キャンセル
            </Button>
          )}
          <Button type="submit" loading={isSubmitting}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
