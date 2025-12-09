"use client";

import { Select, type SelectProps } from "@mantine/core";
import { useMemo } from "react";

export interface GameOption {
  id: number;
  name: string;
  smallBlind: number;
  bigBlind: number;
}

export interface GameSelectProps
  extends Omit<SelectProps, "data" | "searchable" | "value" | "onChange"> {
  value: number | null;
  onChange: (value: number | null) => void;
  games?: GameOption[];
  isLoading?: boolean;
}

export function GameSelect({
  value,
  onChange,
  games = [],
  isLoading = false,
  error,
  ...props
}: GameSelectProps) {
  // Prepare select data
  const selectData = useMemo(() => {
    return games.map((game) => ({
      value: game.id.toString(),
      label: game.name,
    }));
  }, [games]);

  // Handle selection
  const handleChange = (selectedValue: string | null) => {
    onChange(selectedValue ? Number.parseInt(selectedValue, 10) : null);
  };

  return (
    <Select
      label="ゲーム"
      placeholder="ゲームを選択"
      data={selectData}
      value={value?.toString() ?? null}
      onChange={handleChange}
      searchable
      disabled={isLoading || games.length === 0}
      error={error}
      maxDropdownHeight={300}
      nothingFoundMessage={games.length === 0 ? "この店舗にゲームがありません" : "見つかりません"}
      withAsterisk
      {...props}
    />
  );
}
