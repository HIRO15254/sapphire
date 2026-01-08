'use client'

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Combobox,
  Group,
  Menu,
  Modal,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  useCombobox,
} from '@mantine/core'
import { useDisclosure, useElementSize } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconDoorExit,
  IconDotsVertical,
  IconLink,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { RichTextContent } from '~/components/ui/RichTextContext'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'
import { PlayerEditModal } from './PlayerEditModal'

type Tablemate = RouterOutputs['sessionTablemate']['list']['tablemates'][number]

interface TablematesCardProps {
  sessionId: string
}

// Default number of seats at a poker table
const SEAT_COUNT = 9

/**
 * Card for managing tablemates during a live session.
 * Shows 9 seat slots where each can be empty or occupied.
 *
 * When clicking an empty seat, a temporary player is automatically created.
 * The tablemate can later be:
 * - Converted to a permanent player (removes isTemporary flag)
 * - Linked to an existing player (merges temp player data into target)
 * - Deleted (removes tablemate and associated temporary player)
 */
export function TablematesCard({ sessionId }: TablematesCardProps) {
  const utils = api.useUtils()

  // Modals
  const [
    editModalOpened,
    { open: openEditModal, close: closeEditModal },
  ] = useDisclosure(false)
  const [linkModalOpened, { open: openLinkModal, close: closeLinkModal }] =
    useDisclosure(false)
  const [
    convertModalOpened,
    { open: openConvertModal, close: closeConvertModal },
  ] = useDisclosure(false)
  const [
    resetModalOpened,
    { open: openResetModal, close: closeResetModal },
  ] = useDisclosure(false)

  // State
  const [selectedTablemate, setSelectedTablemate] = useState<Tablemate | null>(
    null,
  )
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [playerSearchQuery, setPlayerSearchQuery] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')

  // Queries
  const { data: tablematesData } =
    api.sessionTablemate.list.useQuery({ sessionId })
  const { data: playersData } = api.player.list.useQuery({})

  const tablemates = tablematesData?.tablemates ?? []
  const players = playersData?.players ?? []

  // Build seat map: seatNumber -> tablemate
  const seatMap = new Map<number, Tablemate>()
  for (const tm of tablemates) {
    if (tm.seatNumber) {
      seatMap.set(tm.seatNumber, tm)
    }
  }

  // Mutations
  const createMutation = api.sessionTablemate.create.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '追加完了',
        message: '同卓者を追加しました',
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

  // Seat numbers
  const seats = Array.from({ length: SEAT_COUNT }, (_, i) => i + 1)

  // Handlers
  const handleAddSeat = (seatNumber: number) => {
    createMutation.mutate({
      sessionId,
      seatNumber,
    })
  }

  const handleOpenEdit = (tablemate: Tablemate) => {
    setSelectedTablemate(tablemate)
    openEditModal()
  }

  const handleCloseEdit = () => {
    closeEditModal()
    setSelectedTablemate(null)
  }

  const handleOpenLink = (tablemate: Tablemate) => {
    setSelectedTablemate(tablemate)
    setSelectedPlayerId(null)
    setPlayerSearchQuery('')
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
    })
  }

  const handleDelete = (tablemate: Tablemate) => {
    deleteMutation.mutate({ id: tablemate.id })
  }

  const handleResetTable = () => {
    // Delete all tablemates one by one
    for (const tm of tablemates) {
      deleteMutation.mutate({ id: tm.id })
    }
    closeResetModal()
  }

  // Player combobox
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  // Get player IDs that are already linked to other tablemates (excluding current)
  const linkedPlayerIds = useMemo(() => {
    const ids = new Set<string>()
    for (const tm of tablemates) {
      // Skip current tablemate and temporary players
      if (tm.id === selectedTablemate?.id) continue
      if (tm.player?.isTemporary) continue
      if (tm.playerId) {
        ids.add(tm.playerId)
      }
    }
    return ids
  }, [tablemates, selectedTablemate?.id])

  // Filter players: exclude already linked and filter by search query
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      // Exclude already linked players
      if (linkedPlayerIds.has(player.id)) return false
      // Filter by search query
      if (playerSearchQuery.trim()) {
        return player.name.toLowerCase().includes(playerSearchQuery.toLowerCase())
      }
      return true
    })
  }, [players, linkedPlayerIds, playerSearchQuery])

  const playerOptions = filteredPlayers.map((player) => (
    <Combobox.Option key={player.id} value={player.id}>
      {player.name}
    </Combobox.Option>
  ))

  const selectedPlayerName =
    players.find((p) => p.id === selectedPlayerId)?.name ?? ''

  // Get container size for dynamic ScrollArea height
  const { ref: containerRef, height: containerHeight } = useElementSize()
  // Header is approximately 28px, subtract with some margin
  const scrollAreaHeight = containerHeight > 0 ? containerHeight - 36 : 280

  return (
    <>
      <Box ref={containerRef} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Group justify="space-between" mb="xs">
          <Text fw={500} size="sm">
            同卓者 ({tablemates.length}/{SEAT_COUNT})
          </Text>
          {tablemates.length > 0 && (
            <Button
              color="red"
              leftSection={<IconRefresh size={14} />}
              onClick={openResetModal}
              size="compact-xs"
              variant="subtle"
            >
              卓リセット
            </Button>
          )}
        </Group>

        <ScrollArea.Autosize mah={scrollAreaHeight} offsetScrollbars>
          <Stack gap="xs">
            {seats.map((seatNumber) => {
              const tablemate = seatMap.get(seatNumber)

              if (tablemate) {
                const isTemporary = tablemate.player?.isTemporary ?? false
                const playerTags = tablemate.player?.tagAssignments ?? []
                const generalNotes = tablemate.player?.generalNotes

                // Occupied seat - entire area is clickable
                return (
                  <Box
                    key={seatNumber}
                    onClick={() => handleOpenEdit(tablemate)}
                    style={{
                      borderTop: '1px solid var(--mantine-color-default-border)',
                      borderRight: '1px solid var(--mantine-color-default-border)',
                      borderBottom: '1px solid var(--mantine-color-default-border)',
                      borderLeft: !isTemporary
                        ? '3px solid var(--mantine-color-blue-filled)'
                        : '1px solid var(--mantine-color-default-border)',
                      borderRadius: 'var(--mantine-radius-sm)',
                      padding: '8px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap" gap="xs">
                      <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <Badge size="sm" variant="light" color="gray" style={{ flexShrink: 0 }}>
                          {seatNumber}
                        </Badge>
                        <Text size="sm" fw={500} style={{ flexShrink: 0 }}>
                          {tablemate.nickname}
                        </Text>
                        {/* Player tags */}
                        {playerTags.slice(0, 3).map((ta) => (
                          <Badge
                            key={ta.tag.id}
                            size="xs"
                            variant="light"
                            color={ta.tag.color ?? 'gray'}
                            style={{ flexShrink: 0 }}
                          >
                            {ta.tag.name}
                          </Badge>
                        ))}
                        {playerTags.length > 3 && (
                          <Text size="xs" c="dimmed">
                            +{playerTags.length - 3}
                          </Text>
                        )}
                      </Group>

                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          color="orange"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(tablemate)
                          }}
                          size="sm"
                          variant="subtle"
                          title="離席"
                        >
                          <IconDoorExit size={14} />
                        </ActionIcon>
                        <Menu position="bottom-end" withArrow>
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconDotsVertical size={14} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
                            {isTemporary && (
                              <>
                                <Menu.Item
                                  leftSection={<IconLink size={14} />}
                                  onClick={() => handleOpenLink(tablemate)}
                                >
                                  既存プレイヤーを割り当て
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<IconUserPlus size={14} />}
                                  onClick={() => handleOpenConvert(tablemate)}
                                >
                                  新規プレイヤーとして作成
                                </Menu.Item>
                                <Menu.Divider />
                              </>
                            )}
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => handleDelete(tablemate)}
                            >
                              削除
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Group>

                    {/* Notes area - show general notes */}
                    {generalNotes && (
                      <Box
                        style={{
                          marginTop: 4,
                          padding: '4px 8px',
                          fontSize: 'var(--mantine-font-size-xs)',
                        }}
                      >
                        <RichTextContent content={generalNotes} />
                      </Box>
                    )}
                  </Box>
                )
              }

              // Empty seat - click to add
              return (
                <Box
                  key={seatNumber}
                  onClick={() => handleAddSeat(seatNumber)}
                  style={{
                    border: '1px dashed var(--mantine-color-default-border)',
                    borderRadius: 'var(--mantine-radius-sm)',
                    padding: '8px 12px',
                    cursor: createMutation.isPending ? 'wait' : 'pointer',
                    backgroundColor: 'transparent',
                    opacity: createMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <Group gap="xs">
                    <Badge size="sm" variant="outline" color="gray">
                      {seatNumber}
                    </Badge>
                    <Text size="sm" c="dimmed">
                      空席
                    </Text>
                    <IconPlus size={14} color="var(--mantine-color-dimmed)" />
                  </Group>
                </Box>
              )
            })}
          </Stack>
        </ScrollArea.Autosize>
      </Box>

      {/* Player Edit Modal */}
      <PlayerEditModal
        opened={editModalOpened}
        onClose={handleCloseEdit}
        player={
          selectedTablemate?.player
            ? {
                id: selectedTablemate.player.id,
                name: selectedTablemate.player.name,
                isTemporary: selectedTablemate.player.isTemporary,
                generalNotes: selectedTablemate.player.generalNotes,
                tags: selectedTablemate.player.tagAssignments.map((ta) => ({
                  id: ta.tag.id,
                  name: ta.tag.name,
                  color: ta.tag.color,
                })),
              }
            : null
        }
        tablemateId={selectedTablemate?.id ?? ''}
        sessionId={sessionId}
      />

      {/* Link Modal */}
      <Modal
        onClose={closeLinkModal}
        opened={linkModalOpened}
        title="既存プレイヤーを割り当て"
      >
        <Stack gap="md">
          <Text size="sm">
            「{selectedTablemate?.nickname}」を既存のプレイヤーに割り当てます。
            セッション中に追加したタグやメモは引き継がれます。
          </Text>
          <Combobox
            onOptionSubmit={(val) => {
              setSelectedPlayerId(val)
              setPlayerSearchQuery(players.find((p) => p.id === val)?.name ?? '')
              combobox.closeDropdown()
            }}
            store={combobox}
          >
            <Combobox.Target>
              <TextInput
                label="プレイヤーを検索"
                leftSection={<IconUser size={16} />}
                onClick={() => combobox.openDropdown()}
                onFocus={() => combobox.openDropdown()}
                onChange={(e) => {
                  setPlayerSearchQuery(e.currentTarget.value)
                  setSelectedPlayerId(null)
                  combobox.openDropdown()
                }}
                placeholder="プレイヤー名を入力..."
                rightSection={<Combobox.Chevron />}
                value={selectedPlayerId ? selectedPlayerName : playerSearchQuery}
              />
            </Combobox.Target>
            <Combobox.Dropdown>
              <Combobox.Options>
                {playerOptions.length > 0 ? (
                  playerOptions
                ) : playerSearchQuery.trim() ? (
                  <Combobox.Empty>「{playerSearchQuery}」に一致するプレイヤーがいません</Combobox.Empty>
                ) : (
                  <Combobox.Empty>割り当て可能なプレイヤーがいません</Combobox.Empty>
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
              割り当て
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Convert Modal */}
      <Modal
        onClose={closeConvertModal}
        opened={convertModalOpened}
        title="新規プレイヤーとして作成"
      >
        <Stack gap="md">
          <Text size="sm">
            「{selectedTablemate?.nickname}」を新しいプレイヤーとして登録します。
            セッション中に追加したタグやメモも保持されます。
          </Text>
          <TextInput
            label="プレイヤー名"
            onChange={(e) => setNewPlayerName(e.currentTarget.value)}
            required
            value={newPlayerName}
          />
          <Group justify="flex-end">
            <Button onClick={closeConvertModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              disabled={!newPlayerName.trim()}
              loading={convertMutation.isPending}
              onClick={handleConvert}
            >
              作成
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Reset Table Modal */}
      <Modal
        onClose={closeResetModal}
        opened={resetModalOpened}
        title="卓リセット"
      >
        <Stack gap="md">
          <Text size="sm">
            すべての同卓者（{tablemates.length}人）を削除しますか？
          </Text>
          <Text size="xs" c="dimmed">
            この操作は取り消せません。永続プレイヤーとして保存済みのデータは削除されません。
          </Text>
          <Group justify="flex-end">
            <Button onClick={closeResetModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              color="red"
              loading={deleteMutation.isPending}
              onClick={handleResetTable}
            >
              リセット
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
