'use client'

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Divider,
  Group,
  Switch,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconArchive,
  IconArchiveOff,
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconGripVertical,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { GameTypeIcon } from '~/components/sessions/GameTypeBadge'
import { Fragment, useEffect, useRef, useState } from 'react'

import { RichTextContent } from '~/components/ui/RichTextContext'
import type { CashGame } from './types'
import { generateCashGameDisplayName } from './types'

interface CashGameSectionProps {
  cashGames: CashGame[]
  onCreateClick: () => void
  onEditClick: (game: CashGame) => void
  onArchiveToggle: (gameId: string, isArchived: boolean) => void
  onDelete: (gameId: string) => void
  onReorder?: (
    items: { id: string; sortOrder: number }[],
    newOrder: CashGame[],
  ) => void
}

/** Sortable row component for drag-and-drop */
function SortableRow({
  game,
  expandedId,
  setExpandedId,
  onEditClick,
  onArchiveToggle,
  onDelete,
}: {
  game: CashGame
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  onEditClick: (game: CashGame) => void
  onArchiveToggle: (gameId: string, isArchived: boolean) => void
  onDelete: (gameId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: game.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Fragment>
      <Table.Tr ref={setNodeRef} style={style}>
        <Table.Td>
          <ActionIcon
            {...attributes}
            {...listeners}
            size="sm"
            style={{ cursor: 'grab', touchAction: 'none' }}
            variant="subtle"
          >
            <IconGripVertical size={14} />
          </ActionIcon>
        </Table.Td>
        <Table.Td>
          {game.notes && (
            <ActionIcon
              onClick={() =>
                setExpandedId(expandedId === game.id ? null : game.id)
              }
              size="sm"
              variant="subtle"
            >
              {expandedId === game.id ? (
                <IconChevronUp size={14} />
              ) : (
                <IconChevronDown size={14} />
              )}
            </ActionIcon>
          )}
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            <Text fw={500}>{generateCashGameDisplayName(game)}</Text>
            {game.isArchived && (
              <Badge color="gray" size="xs">
                アーカイブ
              </Badge>
            )}
          </Group>
        </Table.Td>
        <Table.Td>
          {game.currency?.name ? (
            <Tooltip label={game.currency.name}>
              <Badge size="sm" variant="light">
                {game.currency.name.slice(0, 3)}
              </Badge>
            </Tooltip>
          ) : (
            '-'
          )}
        </Table.Td>
        <Table.Td>
          <Group gap="xs" justify="flex-end">
            <ActionIcon
              onClick={() => onEditClick(game)}
              title="編集"
              variant="subtle"
            >
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon
              color={game.isArchived ? 'teal' : 'gray'}
              onClick={() => onArchiveToggle(game.id, game.isArchived)}
              title={game.isArchived ? '復元' : 'アーカイブ'}
              variant="subtle"
            >
              {game.isArchived ? (
                <IconArchiveOff size={16} />
              ) : (
                <IconArchive size={16} />
              )}
            </ActionIcon>
            <ActionIcon
              color="red"
              onClick={() => onDelete(game.id)}
              title="削除"
              variant="subtle"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
      {game.notes && (
        <Table.Tr>
          <Table.Td colSpan={5} p={0}>
            <Collapse in={expandedId === game.id}>
              <Box m="sm">
                <RichTextContent content={game.notes} />
              </Box>
            </Collapse>
          </Table.Td>
        </Table.Tr>
      )}
    </Fragment>
  )
}

export function CashGameSection({
  cashGames,
  onCreateClick,
  onEditClick,
  onArchiveToggle,
  onDelete,
  onReorder,
}: CashGameSectionProps) {
  const [showArchived, setShowArchived] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Local state for immediate UI updates during drag
  const [localGames, setLocalGames] = useState<CashGame[]>(cashGames)

  // Track prop changes to sync local state
  const prevCashGamesRef = useRef(cashGames)
  useEffect(() => {
    if (cashGames !== prevCashGamesRef.current) {
      prevCashGamesRef.current = cashGames
      setLocalGames(cashGames)
    }
  }, [cashGames])

  const filteredGames = localGames.filter((g) => showArchived || !g.isArchived)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = filteredGames.findIndex((g) => g.id === active.id)
      const newIndex = filteredGames.findIndex((g) => g.id === over.id)

      const newFilteredGames = arrayMove(filteredGames, oldIndex, newIndex)

      // Reconstruct full list: non-archived in new order + archived that were hidden
      const archivedGames = localGames.filter(
        (g) => g.isArchived && !showArchived,
      )
      const newFullList = showArchived
        ? newFilteredGames
        : [...newFilteredGames, ...archivedGames]

      // Immediately update local state for optimistic UI
      setLocalGames(newFullList)

      // Call reorder callback with new sort orders and new full order
      if (onReorder) {
        const items = newFilteredGames.map((game, index) => ({
          id: game.id,
          sortOrder: index,
        }))
        onReorder(items, newFullList)
      }
    }
  }

  return (
    <Card p="lg" radius="md" shadow="sm" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <GameTypeIcon gameType="cash_game" size={20} />
          <Title order={3}>キャッシュゲーム</Title>
        </Group>
        <Group gap="md">
          {localGames.some((g) => g.isArchived) && (
            <Switch
              checked={showArchived}
              label="アーカイブ表示"
              onChange={(e) => setShowArchived(e.currentTarget.checked)}
              size="xs"
            />
          )}
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={onCreateClick}
            size="sm"
            variant="light"
          >
            キャッシュゲームを追加
          </Button>
        </Group>
      </Group>
      <Divider mb="md" />
      {filteredGames.length === 0 ? (
        <Text c="dimmed">キャッシュゲームが登録されていません</Text>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={filteredGames.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table withRowBorders={false}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={30}></Table.Th>
                  <Table.Th w={30}></Table.Th>
                  <Table.Th>ブラインド</Table.Th>
                  <Table.Th w={60}>通貨</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredGames.map((game) => (
                  <SortableRow
                    expandedId={expandedId}
                    game={game}
                    key={game.id}
                    onArchiveToggle={onArchiveToggle}
                    onDelete={onDelete}
                    onEditClick={onEditClick}
                    setExpandedId={setExpandedId}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </SortableContext>
        </DndContext>
      )}
    </Card>
  )
}
