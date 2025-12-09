"use client";

import { Button, Group, Modal, Stack, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconBuilding, IconPlus } from "@tabler/icons-react";

import { LocationForm, type LocationFormValues } from "../components/LocationForm";
import { LocationList } from "../components/LocationList";
import { useCreateLocation, useLocations } from "../hooks/useLocations";

/**
 * 店舗一覧コンテナ
 *
 * 責務:
 * - 店舗データの取得
 * - 店舗の作成
 * - モーダルの管理
 */
export function LocationListContainer() {
  const { locations, isLoading } = useLocations();
  const createLocation = useCreateLocation();
  const [opened, { open, close }] = useDisclosure(false);

  const handleCreate = async (values: LocationFormValues) => {
    try {
      await createLocation.mutateAsync(values);
      notifications.show({
        title: "成功",
        message: "店舗を追加しました",
        color: "green",
      });
      close();
    } catch (error) {
      notifications.show({
        title: "エラー",
        message: error instanceof Error ? error.message : "店舗の追加に失敗しました",
        color: "red",
      });
    }
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconBuilding size={24} />
            <Title order={3}>店舗管理</Title>
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            店舗を追加
          </Button>
        </Group>

        <LocationList locations={locations} isLoading={isLoading} onAddNew={open} />
      </Stack>

      <Modal opened={opened} onClose={close} title="店舗を追加">
        <LocationForm
          onSubmit={handleCreate}
          onCancel={close}
          isLoading={createLocation.isPending}
          submitLabel="追加"
        />
      </Modal>
    </>
  );
}
