"use client";

import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBuilding,
  IconCards,
  IconEdit,
  IconPlus,
  IconPokerChip,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

import { GameListContainer } from "@/features/games/containers/GameListContainer";
import { useDeleteLocation, useLocation, useUpdateLocation } from "../hooks/useLocations";
import { LocationForm, type LocationFormValues } from "../components/LocationForm";

interface LocationDetailContainerProps {
  locationId: number;
}

/**
 * 店舗詳細コンテナ
 *
 * 責務:
 * - 店舗詳細の表示
 * - 店舗の編集・削除
 * - ゲーム一覧の表示
 */
export function LocationDetailContainer({ locationId }: LocationDetailContainerProps) {
  const router = useRouter();
  const { location, isLoading, error } = useLocation(locationId);
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  if (isLoading) {
    return (
      <Center h={300}>
        <Stack align="center" gap="sm">
          <Loader size="md" />
          <Text c="dimmed" size="sm">
            読み込み中...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (error || !location) {
    return (
      <Center h={300}>
        <Stack align="center" gap="sm">
          <Title order={4} c="red">
            エラーが発生しました
          </Title>
          <Text c="dimmed" size="sm">
            {error?.message ?? "店舗が見つかりません"}
          </Text>
          <Button component={Link} href="/locations" variant="light">
            店舗一覧に戻る
          </Button>
        </Stack>
      </Center>
    );
  }

  const handleUpdate = async (values: LocationFormValues) => {
    try {
      await updateLocation.mutateAsync({ id: locationId, name: values.name });
      notifications.show({
        title: "成功",
        message: "店舗を更新しました",
        color: "green",
      });
      closeEdit();
    } catch (error) {
      notifications.show({
        title: "エラー",
        message: error instanceof Error ? error.message : "店舗の更新に失敗しました",
        color: "red",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLocation.mutateAsync({ id: locationId });
      notifications.show({
        title: "成功",
        message: "店舗を削除しました",
        color: "green",
      });
      router.push("/locations");
    } catch (error) {
      notifications.show({
        title: "エラー",
        message: error instanceof Error ? error.message : "店舗の削除に失敗しました",
        color: "red",
      });
      closeDelete();
    }
  };

  const canDelete = location.sessionCount === 0;
  const deleteConfirmValid = deleteConfirmName === location.name;

  return (
    <>
      <Stack gap="lg">
        {/* ヘッダー */}
        <Group justify="space-between" align="center">
          <Button
            component={Link}
            href="/locations"
            variant="subtle"
            leftSection={<IconArrowLeft size={18} />}
          >
            店舗一覧に戻る
          </Button>
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconEdit size={18} />}
              onClick={openEdit}
            >
              編集
            </Button>
            <Button
              variant="light"
              color="red"
              leftSection={<IconTrash size={18} />}
              onClick={openDelete}
              disabled={!canDelete}
            >
              削除
            </Button>
          </Group>
        </Group>

        {/* 店舗情報カード */}
        <Card withBorder p="lg">
          <Stack gap="md">
            <Group gap="sm">
              <IconBuilding size={24} color="var(--mantine-color-blue-6)" />
              <Title order={2}>{location.name}</Title>
            </Group>

            <Group gap="md">
              <Badge
                variant="light"
                leftSection={<IconCards size={14} />}
                size="lg"
              >
                {location.gameCount}ゲーム
              </Badge>
              <Badge
                variant="light"
                color="gray"
                leftSection={<IconPokerChip size={14} />}
                size="lg"
              >
                {location.sessionCount}回プレイ
              </Badge>
            </Group>

          </Stack>
        </Card>

        <Divider />

        {/* ゲーム一覧 */}
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconCards size={20} />
              <Title order={4}>ゲーム</Title>
            </Group>
          </Group>
          <GameListContainer locationId={locationId} />
        </Stack>
      </Stack>

      {/* 編集モーダル */}
      <Modal opened={editOpened} onClose={closeEdit} title="店舗を編集">
        <LocationForm
          initialValues={{ name: location.name }}
          onSubmit={handleUpdate}
          onCancel={closeEdit}
          isLoading={updateLocation.isPending}
          submitLabel="更新"
        />
      </Modal>

      {/* 削除確認モーダル */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="店舗を削除">
        <Stack gap="md">
          <Text>
            店舗「<strong>{location.name}</strong>」を削除しますか？
          </Text>
          {location.gameCount > 0 && (
            <Text size="sm" c="orange">
              この店舗に紐付く{location.gameCount}件のゲームも削除されます。
            </Text>
          )}
          <Text size="sm" c="dimmed">
            この操作は取り消せません。削除を確認するには、店舗名を入力してください。
          </Text>
          <TextInput
            placeholder={location.name}
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={closeDelete}>
              キャンセル
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={deleteLocation.isPending}
              disabled={!deleteConfirmValid}
            >
              削除する
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
