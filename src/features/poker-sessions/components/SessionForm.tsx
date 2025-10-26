"use client";

import { Button, Group, NumberInput, Stack } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconDeviceFloppy, IconX } from "@tabler/icons-react";
import { zod4Resolver as zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";
import { LocationSelectContainer } from "../containers/LocationSelectContainer";
import { TagMultiSelectContainer } from "../containers/TagMultiSelectContainer";
import { RichTextEditor } from "./RichTextEditor";

// Zodスキーマ定義（バリデーションルール）
const sessionFormSchema = z.object({
  date: z.coerce.date(),
  location: z.string().min(1, "場所を入力してください").max(255).trim(),
  buyIn: z.number().nonnegative("バイインは0以上の値を入力してください"),
  cashOut: z.number().nonnegative("キャッシュアウトは0以上の値を入力してください"),
  durationMinutes: z.number().int().positive("プレイ時間は1分以上を入力してください"),
  tags: z.array(z.string()).max(20, "タグは最大20個までです").optional(),
  notes: z.string().max(50000, "メモは50,000文字以内で入力してください").optional(),
});

export type SessionFormValues = z.infer<typeof sessionFormSchema>;

export interface SessionFormProps {
  initialValues?: Partial<SessionFormValues>;
  onSubmit: (values: SessionFormValues) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function SessionForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "保存",
}: SessionFormProps) {
  const form = useForm<SessionFormValues>({
    initialValues: {
      date: initialValues?.date ?? new Date(),
      location: initialValues?.location ?? "",
      buyIn: initialValues?.buyIn ?? 0,
      cashOut: initialValues?.cashOut ?? 0,
      durationMinutes: initialValues?.durationMinutes ?? 0,
      tags: initialValues?.tags ?? [],
      notes: initialValues?.notes ?? "",
    },
    validate: zodResolver(sessionFormSchema),
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

        <LocationSelectContainer
          value={form.values.location}
          onChange={(value) => form.setFieldValue("location", value ?? "")}
          error={form.errors.location}
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

        <TagMultiSelectContainer
          value={form.values.tags ?? []}
          onChange={(value) => form.setFieldValue("tags", value)}
          error={form.errors.tags}
        />

        <RichTextEditor
          value={form.values.notes ?? ""}
          onChange={(value) => form.setFieldValue("notes", value)}
          placeholder="印象的なハンド、テーブルの雰囲気、学んだことなど"
          error={typeof form.errors.notes === "string" ? form.errors.notes : undefined}
          label="メモ (任意)"
        />

        <Group justify="flex-end" gap="sm">
          {onCancel && (
            <Button variant="default" onClick={onCancel} leftSection={<IconX size={20} />}>
              キャンセル
            </Button>
          )}
          <Button type="submit" loading={isLoading} leftSection={<IconDeviceFloppy size={20} />}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
