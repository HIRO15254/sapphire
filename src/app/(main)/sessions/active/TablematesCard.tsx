'use client'

import {
  ActionIcon,
  Button,
  Combobox,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  TextInput,
  useCombobox,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconLink,
  IconPencil,
  IconPlus,
  IconTrash,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react'
import { useState } from 'react'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'

type Tablemate = RouterOutputs['sessionTablemate']['list']['tablemates'][number]

interface TablematesCardProps {
  sessionId: string
  maxHeight?: number
}

/**
 * Card for managing tablemates during a live session.
 * Allows adding anonymous tablemates, linking to existing players,
 * or converting to new player records.
 */
export function TablematesCard({ sessionId, maxHeight }: TablematesCardProps) {
  const utils = api.useUtils()

  // Modals
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] =
    useDisclosure(false)
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false)
  const [linkModalOpened, { open: openLinkModal, close: closeLinkModal }] =
    useDisclosure(false)
  const [
    convertModalOpened,
    { open: openConvertModal, close: closeConvertModal },
  ] = useDisclosure(false)

  // State
  const [selectedTablemate, setSelectedTablemate] = useState<Tablemate | null>(
    null,
  )
  const [nickname, setNickname] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')

  // Queries
  const { data: tablematesData, isLoading } =
    api.sessionTablemate.list.useQuery({ sessionId })
  const { data: playersData } = api.player.list.useQuery({})

  const tablemates = tablematesData?.tablemates ?? []
  const players = playersData?.players ?? []

  // Mutations
  const createMutation = api.sessionTablemate.create.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '追加完了',
        message: '同卓者を追加しました',
        color: 'green',
      })
      closeAddModal()
      setNickname('')
      setSessionNotes('')
      void utils.sessionTablemate.list.invalidate({ sessionId })
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const updateMutation = api.sessionTablemate.update.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '更新完了',
        message: '同卓者を更新しました',
        color: 'green',
      })
      closeEditModal()
      setSelectedTablemate(null)
      void utils.sessionTablemate.list.invalidate({ sessionId })
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const deleteMutation = api.sessionTablemate.delete.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '削除完了',
        message: '同卓者を削除しました',
        color: 'green',
      })
      void utils.sessionTablemate.list.invalidate({ sessionId })
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const linkMutation = api.sessionTablemate.linkToPlayer.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '紐付け完了',
        message: 'プレイヤーと紐付けしました',
        color: 'green',
      })
      closeLinkModal()
      setSelectedTablemate(null)
      setSelectedPlayerId(null)
      void utils.sessionTablemate.list.invalidate({ sessionId })
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const convertMutation = api.sessionTablemate.convertToPlayer.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '作成完了',
        message: '新しいプレイヤーを作成しました',
        color: 'green',
      })
      closeConvertModal()
      setSelectedTablemate(null)
      setNewPlayerName('')
      void utils.sessionTablemate.list.invalidate({ sessionId })
      void utils.player.list.invalidate()
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  // Handlers
  const handleAdd = () => {
    if (!nickname.trim()) return
    createMutation.mutate({
      sessionId,
      nickname: nickname.trim(),
      sessionNotes: sessionNotes.trim() || undefined,
    })
  }

  const handleOpenEdit = (tablemate: Tablemate) => {
    setSelectedTablemate(tablemate)
    setNickname(tablemate.nickname)
    setSessionNotes(tablemate.sessionNotes ?? '')
    openEditModal()
  }

  const handleEdit = () => {
    if (!selectedTablemate || !nickname.trim()) return
    updateMutation.mutate({
      id: selectedTablemate.id,
      nickname: nickname.trim(),
      sessionNotes: sessionNotes.trim() || null,
    })
  }

  const handleOpenLink = (tablemate: Tablemate) => {
    setSelectedTablemate(tablemate)
    setSelectedPlayerId(tablemate.playerId)
    openLinkModal()
  }

  const handleLink = () => {
    if (!selectedTablemate || !selectedPlayerId) return
    linkMutation.mutate({
      id: selectedTablemate.id,
      playerId: selectedPlayerId,
    })
  }

  const handleOpenConvert = (tablemate: Tablemate) => {
    setSelectedTablemate(tablemate)
    setNewPlayerName(tablemate.nickname)
    openConvertModal()
  }

  const handleConvert = () => {
    if (!selectedTablemate || !newPlayerName.trim()) return
    convertMutation.mutate({
      id: selectedTablemate.id,
      playerName: newPlayerName.trim(),
      generalNotes: selectedTablemate.sessionNotes ?? undefined,
    })
  }

  const handleDelete = (tablemate: Tablemate) => {
    deleteMutation.mutate({ id: tablemate.id })
  }

  // Player combobox
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const playerOptions = players.map((player) => (
    <Combobox.Option key={player.id} value={player.id}>
      {player.name}
    </Combobox.Option>
  ))

  const selectedPlayerName =
    players.find((p) => p.id === selectedPlayerId)?.name ?? ''

  return (
    <>
      <Stack gap="xs" h="100%">
        <Group justify="space-between">
          <Text fw={500} size="sm">
            同卓者
          </Text>
          <Button
            leftSection={<IconPlus size={14} />}
            onClick={openAddModal}
            size="xs"
            variant="light"
          >
            追加
          </Button>
        </Group>

        <ScrollArea.Autosize mah={maxHeight ?? 200} offsetScrollbars>
          {isLoading ? (
            <Text c="dimmed" size="sm">
              読み込み中...
            </Text>
          ) : tablemates.length === 0 ? (
            <Text c="dimmed" size="sm">
              同卓者はまだ登録されていません
            </Text>
          ) : (
            <Stack gap="xs">
              {tablemates.map((tablemate) => (
                <Paper key={tablemate.id} p="xs" radius="sm" withBorder>
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs">
                        <Text fw={500} size="sm" truncate>
                          {tablemate.nickname}
                        </Text>
                        {tablemate.player && (
                          <Text c="dimmed" size="xs">
                            → {tablemate.player.name}
                          </Text>
                        )}
                      </Group>
                      {tablemate.sessionNotes && (
                        <Text c="dimmed" size="xs" lineClamp={1}>
                          {tablemate.sessionNotes}
                        </Text>
                      )}
                    </Stack>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        onClick={() => handleOpenEdit(tablemate)}
                        size="sm"
                        variant="subtle"
                      >
                        <IconPencil size={14} />
                      </ActionIcon>
                      {!tablemate.playerId && (
                        <>
                          <ActionIcon
                            color="blue"
                            onClick={() => handleOpenLink(tablemate)}
                            size="sm"
                            variant="subtle"
                            title="既存プレイヤーと紐付け"
                          >
                            <IconLink size={14} />
                          </ActionIcon>
                          <ActionIcon
                            color="green"
                            onClick={() => handleOpenConvert(tablemate)}
                            size="sm"
                            variant="subtle"
                            title="新規プレイヤーとして保存"
                          >
                            <IconUserPlus size={14} />
                          </ActionIcon>
                        </>
                      )}
                      <ActionIcon
                        color="red"
                        onClick={() => handleDelete(tablemate)}
                        size="sm"
                        variant="subtle"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </ScrollArea.Autosize>
      </Stack>

      {/* Add Modal */}
      <Modal onClose={closeAddModal} opened={addModalOpened} title="同卓者を追加">
        <Stack gap="md">
          <TextInput
            label="ニックネーム"
            onChange={(e) => setNickname(e.currentTarget.value)}
            placeholder="例: 赤シャツ, Seat 3"
            required
            value={nickname}
          />
          <Textarea
            label="メモ"
            onChange={(e) => setSessionNotes(e.currentTarget.value)}
            placeholder="このセッションでの観察..."
            rows={2}
            value={sessionNotes}
          />
          <Group justify="flex-end">
            <Button onClick={closeAddModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              disabled={!nickname.trim()}
              loading={createMutation.isPending}
              onClick={handleAdd}
            >
              追加
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Modal */}
      <Modal onClose={closeEditModal} opened={editModalOpened} title="同卓者を編集">
        <Stack gap="md">
          <TextInput
            label="ニックネーム"
            onChange={(e) => setNickname(e.currentTarget.value)}
            required
            value={nickname}
          />
          <Textarea
            label="メモ"
            onChange={(e) => setSessionNotes(e.currentTarget.value)}
            rows={2}
            value={sessionNotes}
          />
          <Group justify="flex-end">
            <Button onClick={closeEditModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              disabled={!nickname.trim()}
              loading={updateMutation.isPending}
              onClick={handleEdit}
            >
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Link Modal */}
      <Modal
        onClose={closeLinkModal}
        opened={linkModalOpened}
        title="既存プレイヤーと紐付け"
      >
        <Stack gap="md">
          <Text size="sm">
            「{selectedTablemate?.nickname}」を既存のプレイヤーと紐付けます。
          </Text>
          <Combobox
            onOptionSubmit={(val) => {
              setSelectedPlayerId(val)
              combobox.closeDropdown()
            }}
            store={combobox}
          >
            <Combobox.Target>
              <TextInput
                label="プレイヤーを選択"
                leftSection={<IconUser size={16} />}
                onClick={() => combobox.openDropdown()}
                onFocus={() => combobox.openDropdown()}
                placeholder="プレイヤーを選択..."
                readOnly
                rightSection={<Combobox.Chevron />}
                value={selectedPlayerName}
              />
            </Combobox.Target>
            <Combobox.Dropdown>
              <Combobox.Options>
                {playerOptions.length > 0 ? (
                  playerOptions
                ) : (
                  <Combobox.Empty>プレイヤーがいません</Combobox.Empty>
                )}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
          <Group justify="flex-end">
            <Button onClick={closeLinkModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              disabled={!selectedPlayerId}
              loading={linkMutation.isPending}
              onClick={handleLink}
            >
              紐付け
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Convert Modal */}
      <Modal
        onClose={closeConvertModal}
        opened={convertModalOpened}
        title="新規プレイヤーとして保存"
      >
        <Stack gap="md">
          <Text size="sm">
            「{selectedTablemate?.nickname}」を新しいプレイヤーとして保存します。
          </Text>
          <TextInput
            label="プレイヤー名"
            onChange={(e) => setNewPlayerName(e.currentTarget.value)}
            required
            value={newPlayerName}
          />
          {selectedTablemate?.sessionNotes && (
            <Text c="dimmed" size="xs">
              メモ「{selectedTablemate.sessionNotes}」もプレイヤーに引き継がれます
            </Text>
          )}
          <Group justify="flex-end">
            <Button onClick={closeConvertModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              disabled={!newPlayerName.trim()}
              loading={convertMutation.isPending}
              onClick={handleConvert}
            >
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
