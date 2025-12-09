"use client";

import { useCurrencies } from "@/features/currencies/hooks/useCurrencies";
import { useLocations } from "@/features/locations/hooks/useLocations";
import { notifications } from "@mantine/notifications";
import { GameForm, type GameFormValues } from "../components/GameForm";
import { useCreateGame, useUpdateGame } from "../hooks/useGames";

interface GameFormContainerProps {
  mode: "create" | "edit";
  gameId?: number;
  initialValues?: Partial<GameFormValues>;
  /** 店舗を固定する場合のlocationId */
  fixedLocationId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function GameFormContainer({
  mode,
  gameId,
  initialValues,
  fixedLocationId,
  onSuccess,
  onCancel,
}: GameFormContainerProps) {
  const { locations } = useLocations();
  const { currencies } = useCurrencies();
  const createGame = useCreateGame();
  const updateGame = useUpdateGame();

  const handleSubmit = async (values: GameFormValues) => {
    try {
      if (mode === "create") {
        await createGame.mutateAsync({
          locationId: values.locationId!,
          currencyId: values.currencyId!,
          name: values.name,
          smallBlind: values.smallBlind,
          bigBlind: values.bigBlind,
          ante: values.ante,
          minBuyIn: values.minBuyIn,
          maxBuyIn: values.maxBuyIn,
          rules: values.rules || undefined,
        });
        notifications.show({
          title: "ゲームを作成しました",
          message: `「${values.name}」を作成しました`,
          color: "green",
        });
      } else if (gameId) {
        await updateGame.mutateAsync({
          id: gameId,
          currencyId: values.currencyId!,
          name: values.name,
          smallBlind: values.smallBlind,
          bigBlind: values.bigBlind,
          ante: values.ante,
          minBuyIn: values.minBuyIn,
          maxBuyIn: values.maxBuyIn,
          rules: values.rules || undefined,
        });
        notifications.show({
          title: "ゲームを更新しました",
          message: `「${values.name}」を更新しました`,
          color: "green",
        });
      }
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "エラーが発生しました";
      notifications.show({
        title: mode === "create" ? "ゲームの作成に失敗しました" : "ゲームの更新に失敗しました",
        message,
        color: "red",
      });
    }
  };

  // 固定店舗がある場合はその店舗のみを表示
  const filteredLocations = fixedLocationId
    ? locations.filter((loc) => loc.id === fixedLocationId)
    : locations;

  // 固定店舗がある場合はinitialValuesにlocationIdを設定
  const formInitialValues = fixedLocationId
    ? { ...initialValues, locationId: fixedLocationId }
    : initialValues;

  return (
    <GameForm
      mode={mode}
      initialValues={formInitialValues}
      locations={filteredLocations}
      currencies={currencies}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={createGame.isPending || updateGame.isPending}
      disableLocationChange={mode === "edit"}
    />
  );
}
