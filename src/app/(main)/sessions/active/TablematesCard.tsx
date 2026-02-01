'use client'

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Modal,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core'
import { useDisclosure, useElementSize } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconDoorExit,
  IconDotsVertical,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react'
import { useRef, useState } from 'react'
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
 * When clicking an empty seat:
 * - If self is not seated: shows a menu to choose "自分を着席" or "対戦相手を着席"
 * - If self is seated: directly creates an opponent tablemate (no menu)
 *
 * Self-seating creates a special record with isSelf=true, no player record.
 */
export function TablematesCard({ sessionId }: TablematesCardProps) {
  const utils = api.useUtils()

  // Modals
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false)
  const [resetModalOpened, { open: openResetModal, close: closeResetModal }] =
    useDisclosure(false)

  // State
  const [selectedTablemate, setSelectedTablemate] = useState<Tablemate | null>(
    null,
  )
  const isBulkDeleting = useRef(false)

  // Queries
  const { data: tablematesData } = api.sessionTablemate.list.useQuery({
    sessionId,
  })

  const tablemates = tablematesData?.tablemates ?? []

  // Derived: check if self is seated
  const selfTablemate = tablemates.find((tm) => tm.isSelf)
  const isSelfSeated = !!selfTablemate

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

  const createSelfMutation = api.sessionTablemate.createSelf.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '着席完了',
        message: '自分を着席させました',
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
      // Skip notification and invalidation during bulk delete
      if (isBulkDeleting.current) return
      notifications.show({
        title: '削除完了',
        message: '同卓者を削除しました',
        color: 'green',
      })
      void utils.sessionTablemate.list.invalidate({ sessionId })
    },
    onError: (error) => {
      // Skip notification during bulk delete (will show summary error)
      if (isBulkDeleting.current) return
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
  const handleAddOpponent = (seatNumber: number) => {
    createMutation.mutate({
      sessionId,
      seatNumber,
    })
  }

  const handleSeatSelf = (seatNumber: number) => {
    createSelfMutation.mutate({
      sessionId,
      seatNumber,
    })
  }

  const handleOpenEdit = (tablemate: Tablemate) => {
    // Don't open edit modal for self
    if (tablemate.isSelf) return
    setSelectedTablemate(tablemate)
    openEditModal()
  }

  const handleCloseEdit = () => {
    closeEditModal()
    setSelectedTablemate(null)
  }

  const handleDelete = (tablemate: Tablemate) => {
    deleteMutation.mutate({ id: tablemate.id })
  }

  const handleResetTable = async () => {
    const count = tablemates.length
    isBulkDeleting.current = true
    closeResetModal()

    try {
      // Delete all tablemates in parallel
      await Promise.all(
        tablemates.map((tm) => deleteMutation.mutateAsync({ id: tm.id })),
      )

      notifications.show({
        title: 'リセット完了',
        message: `${count}人の同卓者を削除しました`,
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: 'エラー',
        message: error instanceof Error ? error.message : '削除に失敗しました',
        color: 'red',
      })
    } finally {
      isBulkDeleting.current = false
      void utils.sessionTablemate.list.invalidate({ sessionId })
    }
  }

  const isPending =
    createMutation.isPending ||
    createSelfMutation.isPending ||
    deleteMutation.isPending

  // Get container size for dynamic ScrollArea height
  const { ref: containerRef, height: containerHeight } = useElementSize()
  // Header is approximately 28px, subtract with some margin
  const scrollAreaHeight = containerHeight > 0 ? containerHeight - 36 : 280

  return (
    <>
      <Box
        ref={containerRef}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
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
                // Self seat - special rendering
                if (tablemate.isSelf) {
                  return (
                    <Box
                      key={seatNumber}
                      style={{
                        borderTop:
                          '1px solid var(--mantine-color-default-border)',
                        borderRight:
                          '1px solid var(--mantine-color-default-border)',
                        borderBottom:
                          '1px solid var(--mantine-color-default-border)',
                        borderLeft:
                          '3px solid var(--mantine-color-green-filled)',
                        borderRadius: 'var(--mantine-radius-sm)',
                        padding: '8px 12px',
                      }}
                    >
                      <Group gap="xs" justify="space-between" wrap="nowrap">
                        <Group
                          gap="xs"
                          style={{ flex: 1, minWidth: 0 }}
                          wrap="nowrap"
                        >
                          <Badge
                            color="green"
                            size="sm"
                            style={{ flexShrink: 0 }}
                            variant="light"
                          >
                            {seatNumber}
                          </Badge>
                          <Text
                            c="green"
                            fw={600}
                            size="sm"
                            style={{ flexShrink: 0 }}
                          >
                            自分
                          </Text>
                        </Group>

                        <ActionIcon
                          color="orange"
                          onClick={() => handleDelete(tablemate)}
                          size="sm"
                          title="離席"
                          variant="subtle"
                        >
                          <IconDoorExit size={14} />
                        </ActionIcon>
                      </Group>
                    </Box>
                  )
                }

                // Opponent seat - existing behavior
                const isTemporary = tablemate.player?.isTemporary ?? false
                const playerTags = tablemate.player?.tagAssignments ?? []
                const generalNotes = tablemate.player?.generalNotes

                return (
                  <Box
                    key={seatNumber}
                    onClick={() => handleOpenEdit(tablemate)}
                    style={{
                      borderTop:
                        '1px solid var(--mantine-color-default-border)',
                      borderRight:
                        '1px solid var(--mantine-color-default-border)',
                      borderBottom:
                        '1px solid var(--mantine-color-default-border)',
                      borderLeft: !isTemporary
                        ? '3px solid var(--mantine-color-blue-filled)'
                        : '1px solid var(--mantine-color-default-border)',
                      borderRadius: 'var(--mantine-radius-sm)',
                      padding: '8px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <Group gap="xs" justify="space-between" wrap="nowrap">
                      <Group
                        gap="xs"
                        style={{ flex: 1, minWidth: 0 }}
                        wrap="nowrap"
                      >
                        <Badge
                          color="gray"
                          size="sm"
                          style={{ flexShrink: 0 }}
                          variant="light"
                        >
                          {seatNumber}
                        </Badge>
                        <Text
                          c={tablemate.player?.name ? undefined : 'dimmed'}
                          fw={500}
                          size="sm"
                          style={{ flexShrink: 0 }}
                        >
                          {tablemate.player?.name || `Seat ${seatNumber}`}
                        </Text>
                        {/* Player tags */}
                        {playerTags.slice(0, 3).map((ta) => (
                          <Badge
                            color={ta.tag.color ?? 'gray'}
                            key={ta.tag.id}
                            size="xs"
                            style={{ flexShrink: 0 }}
                            variant="light"
                          >
                            {ta.tag.name}
                          </Badge>
                        ))}
                        {playerTags.length > 3 && (
                          <Text c="dimmed" size="xs">
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
                          title="離席"
                          variant="subtle"
                        >
                          <IconDoorExit size={14} />
                        </ActionIcon>
                        <Menu position="bottom-end" withArrow>
                          <Menu.Target>
                            <ActionIcon
                              onClick={(e) => e.stopPropagation()}
                              size="sm"
                              variant="subtle"
                            >
                              <IconDotsVertical size={14} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
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

              // Empty seat
              // If self is not seated: show menu with self/opponent choice
              // If self is seated: directly add opponent (no confirmation)
              if (!isSelfSeated) {
                return (
                  <Menu key={seatNumber} position="bottom-start" withArrow>
                    <Menu.Target>
                      <Box
                        style={{
                          border:
                            '1px dashed var(--mantine-color-default-border)',
                          borderRadius: 'var(--mantine-radius-sm)',
                          padding: '8px 12px',
                          cursor: isPending ? 'wait' : 'pointer',
                          backgroundColor: 'transparent',
                          opacity: isPending ? 0.6 : 1,
                        }}
                      >
                        <Group gap="xs">
                          <Badge color="gray" size="sm" variant="outline">
                            {seatNumber}
                          </Badge>
                          <Text c="dimmed" size="sm">
                            空席
                          </Text>
                          <IconPlus
                            color="var(--mantine-color-dimmed)"
                            size={14}
                          />
                        </Group>
                      </Box>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconUser size={14} />}
                        onClick={() => handleSeatSelf(seatNumber)}
                      >
                        自分を着席
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconUserPlus size={14} />}
                        onClick={() => handleAddOpponent(seatNumber)}
                      >
                        対戦相手を着席
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )
              }

              // Self is already seated - directly add opponent (no menu)
              return (
                <Box
                  key={seatNumber}
                  onClick={() => !isPending && handleAddOpponent(seatNumber)}
                  style={{
                    border:
                      '1px dashed var(--mantine-color-default-border)',
                    borderRadius: 'var(--mantine-radius-sm)',
                    padding: '8px 12px',
                    cursor: isPending ? 'wait' : 'pointer',
                    backgroundColor: 'transparent',
                    opacity: isPending ? 0.6 : 1,
                  }}
                >
                  <Group gap="xs">
                    <Badge color="gray" size="sm" variant="outline">
                      {seatNumber}
                    </Badge>
                    <Text c="dimmed" size="sm">
                      空席
                    </Text>
                    <IconPlus
                      color="var(--mantine-color-dimmed)"
                      size={14}
                    />
                  </Group>
                </Box>
              )
            })}
          </Stack>
        </ScrollArea.Autosize>
      </Box>

      {/* Player Edit Modal */}
      <PlayerEditModal
        onClose={handleCloseEdit}
        opened={editModalOpened}
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
        seatNumber={selectedTablemate?.seatNumber ?? null}
        sessionId={sessionId}
        tablemateId={selectedTablemate?.id ?? ''}
      />

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
          <Text c="dimmed" size="xs">
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
