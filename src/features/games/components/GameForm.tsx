import { Button, Group, NumberInput, Select, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";

export interface GameFormValues {
  locationId: number | null;
  currencyId: number | null;
  name: string;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  minBuyIn: number;
  maxBuyIn: number;
  rules: string;
}

interface GameFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<GameFormValues>;
  locations: Array<{ id: number; name: string }>;
  currencies: Array<{ id: number; name: string }>;
  onSubmit: (values: GameFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** edit モードで店舗を変更不可にする */
  disableLocationChange?: boolean;
}

export function GameForm({
  mode,
  initialValues,
  locations,
  currencies,
  onSubmit,
  onCancel,
  isSubmitting = false,
  disableLocationChange = false,
}: GameFormProps) {
  const form = useForm<GameFormValues>({
    initialValues: {
      locationId: initialValues?.locationId ?? null,
      currencyId: initialValues?.currencyId ?? null,
      name: initialValues?.name ?? "",
      smallBlind: initialValues?.smallBlind ?? 1,
      bigBlind: initialValues?.bigBlind ?? 2,
      ante: initialValues?.ante ?? 0,
      minBuyIn: initialValues?.minBuyIn ?? 40,
      maxBuyIn: initialValues?.maxBuyIn ?? 200,
      rules: initialValues?.rules ?? "",
    },
    validate: {
      locationId: (value) => (value === null ? "店舗を選択してください" : null),
      currencyId: (value) => (value === null ? "通貨を選択してください" : null),
      name: (value) => {
        if (!value.trim()) return "ゲーム名は必須です";
        if (value.length > 100) return "ゲーム名は100文字以内です";
        return null;
      },
      smallBlind: (value) => (value < 1 ? "SBは1以上の整数です" : null),
      bigBlind: (value, values) => {
        if (value < 1) return "BBは1以上の整数です";
        if (value < values.smallBlind) return "BBはSB以上でなければなりません";
        return null;
      },
      ante: (value) => (value < 0 ? "Anteは0以上の整数です" : null),
      minBuyIn: (value) => (value < 1 ? "最小バイインは1以上の整数です" : null),
      maxBuyIn: (value, values) => {
        if (value < 1) return "最大バイインは1以上の整数です";
        if (value < values.minBuyIn) return "最大バイインは最小バイイン以上でなければなりません";
        return null;
      },
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    onSubmit(values);
  });

  const locationOptions = locations.map((loc) => ({
    value: String(loc.id),
    label: loc.name,
  }));

  const currencyOptions = currencies.map((cur) => ({
    value: String(cur.id),
    label: cur.name,
  }));

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Select
          label="店舗"
          placeholder="店舗を選択"
          data={locationOptions}
          value={form.values.locationId ? String(form.values.locationId) : null}
          onChange={(value) => form.setFieldValue("locationId", value ? Number(value) : null)}
          error={form.errors.locationId}
          disabled={mode === "edit" && disableLocationChange}
          required
          searchable
        />

        <Select
          label="通貨"
          placeholder="通貨を選択"
          data={currencyOptions}
          value={form.values.currencyId ? String(form.values.currencyId) : null}
          onChange={(value) => form.setFieldValue("currencyId", value ? Number(value) : null)}
          error={form.errors.currencyId}
          required
          searchable
        />

        <TextInput
          label="ゲーム名"
          placeholder="例: 1/2 NL"
          {...form.getInputProps("name")}
          required
        />

        <Group grow>
          <NumberInput
            label="スモールブラインド (SB)"
            min={1}
            {...form.getInputProps("smallBlind")}
            required
          />
          <NumberInput
            label="ビッグブラインド (BB)"
            min={1}
            {...form.getInputProps("bigBlind")}
            required
          />
        </Group>

        <NumberInput
          label="アンティ"
          description="アンティがない場合は0"
          min={0}
          {...form.getInputProps("ante")}
        />

        <Group grow>
          <NumberInput
            label="最小バイイン (BB単位)"
            min={1}
            {...form.getInputProps("minBuyIn")}
            required
          />
          <NumberInput
            label="最大バイイン (BB単位)"
            min={1}
            {...form.getInputProps("maxBuyIn")}
            required
          />
        </Group>

        <Textarea
          label="その他のルール"
          placeholder="ストラドルなし、など"
          rows={3}
          {...form.getInputProps("rules")}
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {mode === "create" ? "作成" : "更新"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
