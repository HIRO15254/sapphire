"use client";

import { useActiveGamesByLocation } from "@/features/games/hooks/useGames";
import { GameSelect, type GameSelectProps } from "../components/GameSelect";

interface GameSelectContainerProps extends Omit<GameSelectProps, "games" | "isLoading"> {
  locationId: number | undefined;
}

export function GameSelectContainer({
  locationId,
  value,
  onChange,
  ...props
}: GameSelectContainerProps) {
  const { games, isLoading } = useActiveGamesByLocation(locationId);

  return (
    <GameSelect value={value} onChange={onChange} games={games} isLoading={isLoading} {...props} />
  );
}
