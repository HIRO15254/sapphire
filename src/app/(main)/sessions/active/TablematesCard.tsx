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
} from '@tabler/icons-react'
import { useState } from 'react'
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
 * - Converted to a permanent player (via edit modal)
 * - Linked to an existing player (via edit modal)
 * - Deleted (removes tablemate and associated temporary player)
 */
export function TablematesCard({ sessionId }: TablematesCardProps) {
  const utils = api.useUtils()

  // Modals
  const [
    editModalOpened,
    { open: openEditModal, close: closeEditModal },
  ] = useDisclosure(false)
  const [
    resetModalOpened,
    { open: openResetModal, close: closeResetModal },
  ] = useDisclosure(false)

  // State
  const [selectedTablemate, setSelectedTablemate] = useState<Tablemate | null>(
    null,
  )

  // Queries
  const { data: tablematesData } =
    api.sessionTablemate.list.useQuery({ sessionId })

  const tablemates = tablematesData?.tablemates ?? []

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
                          {tablemate.player?.name}
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
