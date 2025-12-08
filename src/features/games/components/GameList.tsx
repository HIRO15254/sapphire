import { Center, Grid, Loader, Text } from "@mantine/core";
import { GameCard } from "./GameCard";

interface Game {
  id: number;
  name: string;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  minBuyIn: number;
  maxBuyIn: number;
  isArchived: boolean;
  location?: { id: number; name: string };
  currency: { id: number; name: string };
  _count: { sessions: number };
}

interface GameListProps {
  games: Game[];
  isLoading: boolean;
  onEdit: (id: number) => void;
  onArchive: (id: number) => void;
  onUnarchive: (id: number) => void;
  onDelete: (id: number) => void;
}

export function GameList({
  games,
  isLoading,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: GameListProps) {
  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (games.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">ゲームがまだ登録されていません。</Text>
      </Center>
    );
  }

  return (
    <Grid>
      {games.map((game) => (
        <Grid.Col key={game.id} span={{ base: 12, sm: 6, lg: 4 }}>
          <GameCard
            game={game}
            onEdit={onEdit}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            onDelete={onDelete}
          />
        </Grid.Col>
      ))}
    </Grid>
  );
}
