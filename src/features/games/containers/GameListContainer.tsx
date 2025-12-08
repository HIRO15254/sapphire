"use client";

import { Button, Checkbox, Group, Modal, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { GameList } from "../components/GameList";
import {
  useArchiveGame,
  useDeleteGame,
  useGames,
  useGamesByLocation,
  useUnarchiveGame,
} from "../hooks/useGames";
import { GameFormContainer } from "./GameFormContainer";

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

interface GameListContainerProps {
  /** 特定の店舗のゲームのみ表示する場合に指定 */
  locationId?: number;
}

export function GameListContainer({ locationId }: GameListContainerProps) {
  const [includeArchived, setIncludeArchived] = useState(true);

  // locationIdが指定されている場合は店舗別、そうでなければ全ゲーム
  const allGames = useGames({ includeArchived });
  const locationGames = useGamesByLocation(locationId, { includeArchived });

  const { games, isLoading } = locationId !== undefined ? locationGames : allGames;
  const archiveGame = useArchiveGame();
  const unarchiveGame = useUnarchiveGame();
  const deleteGame = useDeleteGame();

  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const handleEdit = (id: number) => {
    const game = games.find((g) => g.id === id);
    if (game) {
      setSelectedGame(game);
      openEdit();
    }
  };

  const handleArchive = async (id: number) => {
    const game = games.find((g) => g.id === id);
    if (!game) return;

    try {
      await archiveGame.mutateAsync({ id });
      notifications.show({
        title: "ゲームをアーカイブしました",
        message: `「${game.name}」をアーカイブしました`,
        color: "green",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "エラーが発生しました";
      notifications.show({
        title: "アーカイブに失敗しました",
        message,
        color: "red",
      });
    }
  };

  const handleUnarchive = async (id: number) => {
    const game = games.find((g) => g.id === id);
    if (!game) return;

    try {
      await unarchiveGame.mutateAsync({ id });
      notifications.show({
        title: "アーカイブを解除しました",
        message: `「${game.name}」のアーカイブを解除しました`,
        color: "green",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "エラーが発生しました";
      notifications.show({
        title: "アーカイブ解除に失敗しました",
        message,
        color: "red",
      });
    }
  };

  const handleDelete = (id: number) => {
    const game = games.find((g) => g.id === id);
    if (game) {
      setSelectedGame(game);
      openDelete();
    }
  };

  const confirmDelete = async () => {
    if (!selectedGame) return;

    try {
      await deleteGame.mutateAsync({ id: selectedGame.id });
      notifications.show({
        title: "ゲームを削除しました",
        message: `「${selectedGame.name}」を削除しました`,
        color: "green",
      });
      closeDelete();
      setSelectedGame(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "エラーが発生しました";
      notifications.show({
        title: "ゲームの削除に失敗しました",
        message,
        color: "red",
      });
    }
  };

  // 店舗別表示の場合はコンパクトなヘッダー
  const showCompactHeader = locationId !== undefined;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        {!showCompactHeader && <Title order={2}>ゲーム管理</Title>}
        <Group gap="sm" style={showCompactHeader ? { width: "100%", justifyContent: "flex-end" } : undefined}>
          <Checkbox
            label="アーカイブ済みも表示"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.currentTarget.checked)}
            size="sm"
          />
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate} size={showCompactHeader ? "sm" : "md"}>
            ゲームを追加
          </Button>
        </Group>
      </Group>

      <GameList
        games={games}
        isLoading={isLoading}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        onDelete={handleDelete}
      />

      {/* 新規作成モーダル */}
      <Modal opened={createOpened} onClose={closeCreate} title="ゲームを追加" size="lg" centered>
        <GameFormContainer
          mode="create"
          onSuccess={closeCreate}
          onCancel={closeCreate}
          fixedLocationId={locationId}
        />
      </Modal>

      {/* 編集モーダル */}
      <Modal opened={editOpened} onClose={closeEdit} title="ゲームを編集" size="lg" centered>
        {selectedGame && (
          <GameFormContainer
            mode="edit"
            gameId={selectedGame.id}
            initialValues={{
              locationId: selectedGame.location?.id ?? locationId,
              currencyId: selectedGame.currency.id,
              name: selectedGame.name,
              smallBlind: selectedGame.smallBlind,
              bigBlind: selectedGame.bigBlind,
              ante: selectedGame.ante,
              minBuyIn: selectedGame.minBuyIn,
              maxBuyIn: selectedGame.maxBuyIn,
              rules: "",
            }}
            fixedLocationId={locationId}
            onSuccess={() => {
              closeEdit();
              setSelectedGame(null);
            }}
            onCancel={closeEdit}
          />
        )}
      </Modal>

      {/* 削除確認モーダル */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="ゲームを削除" centered>
        <Stack gap="md">
          <Text>「{selectedGame?.name}」を削除しますか？</Text>
          {selectedGame && selectedGame._count.sessions > 0 && (
            <Text c="red" size="sm">
              このゲームは{selectedGame._count.sessions}
              件のセッションで使用されているため削除できません。 アーカイブを使用してください。
            </Text>
          )}
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeDelete}>
              キャンセル
            </Button>
            <Button
              color="red"
              onClick={confirmDelete}
              loading={deleteGame.isPending}
              disabled={selectedGame ? selectedGame._count.sessions > 0 : false}
            >
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
