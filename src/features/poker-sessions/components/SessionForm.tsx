"use client";

import { Button, NumberInput, Stack, TextInput, Textarea } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { z } from "zod/v4";

// Zodスキーマ定義（バリデーションルール）
const sessionFormSchema = z.object({
  date: z.coerce.date({ error: "有効な日時を選択してください" }),
  location: z
    .string({ error: "場所を入力してください" })
    .min(1, { error: "場所を入力してください" })
    .max(255, { error: "場所は255文字以内で入力してください" })
    .trim(),
  buyIn: z
    .number({ error: "有効な金額を入力してください" })
    .nonnegative({ error: "バイインは0以上の値を入力してください" }),
  cashOut: z
    .number({ error: "有効な金額を入力してください" })
    .nonnegative({ error: "キャッシュアウトは0以上の値を入力してください" }),
  durationMinutes: z
    .number({ error: "有効な数値を入力してください" })
    .int({ error: "プレイ時間は整数で入力してください" })
    .positive({ error: "プレイ時間は1分以上を入力してください" }),
  notes: z.string().max(10000, { error: "メモは10,000文字以内で入力してください" }).optional(),
});

export type SessionFormValues = z.infer<typeof sessionFormSchema>;

export interface SessionFormProps {
  initialValues?: Partial<SessionFormValues>;
  onSubmit: (values: SessionFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function SessionForm({
  initialValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "保存",
}: SessionFormProps) {
  const form = useForm<SessionFormValues>({
    initialValues: {
      date: initialValues?.date ?? new Date(),
      location: initialValues?.location ?? "",
      buyIn: initialValues?.buyIn ?? 0,
      cashOut: initialValues?.cashOut ?? 0,
      durationMinutes: initialValues?.durationMinutes ?? 0,
      notes: initialValues?.notes ?? "",
    },
    validate: zod4Resolver(sessionFormSchema),
  });

  const handleSubmit = (values: SessionFormValues) => {
    onSubmit(values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <DateTimePicker
          label="日時"
          placeholder="セッション開始日時を選択"
          withAsterisk
          locale="ja"
          valueFormat="YYYY/MM/DD HH:mm"
          clearable
          {...form.getInputProps("date")}
        />

        <TextInput
          label="場所"
          placeholder="例: ポーカースタジアム渋谷"
          withAsterisk
          maxLength={255}
          {...form.getInputProps("location")}
        />

        <NumberInput
          label="バイイン (円)"
          placeholder="10000"
          withAsterisk
          min={0}
          step={100}
          thousandSeparator=","
          hideControls
          {...form.getInputProps("buyIn")}
        />

        <NumberInput
          label="キャッシュアウト (円)"
          placeholder="15000"
          withAsterisk
          min={0}
          step={100}
          thousandSeparator=","
          hideControls
          {...form.getInputProps("cashOut")}
        />

        <NumberInput
          label="プレイ時間 (分)"
          placeholder="180"
          withAsterisk
          min={1}
          step={10}
          hideControls
          {...form.getInputProps("durationMinutes")}
        />

        <Textarea
          label="メモ (任意)"
          placeholder="印象的なハンド、テーブルの雰囲気、学んだことなど"
          maxLength={10000}
          rows={4}
          autosize
          minRows={4}
          maxRows={10}
          {...form.getInputProps("notes")}
        />

        <Button
          type="submit"
          loading={isSubmitting}
          leftSection={<IconDeviceFloppy size={20} />}
          fullWidth
        >
          {submitLabel}
        </Button>
      </Stack>
    </form>
  );
}
