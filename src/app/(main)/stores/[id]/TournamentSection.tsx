'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
  Button,
  Card,
  Collapse,
  Divider,
  Group,
  Paper,
  Switch,
  Table,
  Title,
  Tooltip,
  Text,
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
  IconTrophy,
} from '@tabler/icons-react'
import { Fragment, useEffect, useRef, useState } from 'react'

import { RichTextContent } from '~/components/ui/RichTextContext'
import type { Tournament } from './types'

interface TournamentSectionProps {
  tournaments: Tournament[]
  onCreateClick: () => void
  onEditClick: (tournament: Tournament) => void
  onArchiveToggle: (tournamentId: string, isArchived: boolean) => void
  onDelete: (tournamentId: string) => void
  onReorder?: (
    items: { id: string; sortOrder: number }[],
    newOrder: Tournament[],
  ) => void
}

/** Sortable row component for drag-and-drop */
function SortableRow({
  tournament,
  expandedId,
  setExpandedId,
  onEditClick,
  onArchiveToggle,
  onDelete,
}: {
  tournament: Tournament
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  onEditClick: (tournament: Tournament) => void
  onArchiveToggle: (tournamentId: string, isArchived: boolean) => void
  onDelete: (tournamentId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tournament.id })

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
          {tournament.notes && (
            <ActionIcon
              onClick={() =>
                setExpandedId(
                  expandedId === tournament.id ? null : tournament.id,
                )
              }
              size="sm"
              variant="subtle"
            >
              {expandedId === tournament.id ? (
                <IconChevronUp size={14} />
              ) : (
                <IconChevronDown size={14} />
              )}
            </ActionIcon>
          )}
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            <Text fw={500}>
              {tournament.name ?? tournament.buyIn.toLocaleString()}
            </Text>
            {tournament.isArchived && (
              <Badge color="gray" size="xs">
                アーカイブ
              </Badge>
            )}
          </Group>
        </Table.Td>
        <Table.Td>
          {tournament.rake
            ? `${(tournament.buyIn - tournament.rake).toLocaleString()} + ${tournament.rake.toLocaleString()}`
            : tournament.buyIn.toLocaleString()}
        </Table.Td>
        <Table.Td>
          {tournament.currency?.name ? (
            <Tooltip label={tournament.currency.name}>
              <Badge size="sm" variant="light">
                {tournament.currency.name.slice(0, 3)}
              </Badge>
            </Tooltip>
          ) : (
            '-'
          )}
        </Table.Td>
        <Table.Td>
          <Group gap="xs" justify="flex-end">
            <ActionIcon
              onClick={() => onEditClick(tournament)}
              title="編集"
              variant="subtle"
            >
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon
              color={tournament.isArchived ? 'teal' : 'gray'}
              onClick={() =>
                onArchiveToggle(tournament.id, tournament.isArchived)
              }
              title={tournament.isArchived ? '復元' : 'アーカイブ'}
              variant="subtle"
            >
              {tournament.isArchived ? (
                <IconArchiveOff size={16} />
              ) : (
                <IconArchive size={16} />
              )}
            </ActionIcon>
            <ActionIcon
              color="red"
              onClick={() => onDelete(tournament.id)}
              title="削除"
              variant="subtle"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
      {tournament.notes && (
        <Table.Tr>
          <Table.Td colSpan={6} p={0}>
            <Collapse in={expandedId === tournament.id}>
              <Paper bg="gray.0" p="sm">
                <RichTextContent content={tournament.notes} />
              </Paper>
            </Collapse>
          </Table.Td>
        </Table.Tr>
      )}
    </Fragment>
  )
}

export function TournamentSection({
  tournaments,
  onCreateClick,
  onEditClick,
  onArchiveToggle,
  onDelete,
  onReorder,
}: TournamentSectionProps) {
  const [showArchived, setShowArchived] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Local state for immediate UI updates during drag
  const [localTournaments, setLocalTournaments] =
    useState<Tournament[]>(tournaments)

  // Track prop changes to sync local state
  const prevTournamentsRef = useRef(tournaments)
  useEffect(() => {
    if (tournaments !== prevTournamentsRef.current) {
      prevTournamentsRef.current = tournaments
      setLocalTournaments(tournaments)
    }
  }, [tournaments])

  const filteredTournaments = localTournaments.filter(
    (t) => showArchived || !t.isArchived,
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = filteredTournaments.findIndex((t) => t.id === active.id)
      const newIndex = filteredTournaments.findIndex((t) => t.id === over.id)

      const newFilteredTournaments = arrayMove(
        filteredTournaments,
        oldIndex,
        newIndex,
      )

      // Rebuild full tournament list maintaining order
      const archivedTournaments = localTournaments.filter(
        (t) => t.isArchived && !showArchived,
      )
      const newTournaments = showArchived
        ? newFilteredTournaments
        : [...newFilteredTournaments, ...archivedTournaments]

      // Immediately update local state for optimistic UI
      setLocalTournaments(newTournaments)

      // Call reorder callback with new sort orders and new order
      if (onReorder) {
        const items = newFilteredTournaments.map((tournament, index) => ({
          id: tournament.id,
          sortOrder: index,
        }))
        onReorder(items, newTournaments)
      }
    }
  }

  return (
    <Card p="lg" radius="md" shadow="sm" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <IconTrophy size={20} />
          <Title order={3}>トーナメント</Title>
        </Group>
        <Group gap="md">
          {localTournaments.some((t) => t.isArchived) && (
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
            トーナメントを追加
          </Button>
        </Group>
      </Group>
      <Divider mb="md" />
      {filteredTournaments.length === 0 ? (
        <Text c="dimmed">トーナメントが登録されていません</Text>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={filteredTournaments.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table withRowBorders={false}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={30}></Table.Th>
                  <Table.Th w={30}></Table.Th>
                  <Table.Th>名前</Table.Th>
                  <Table.Th>バイイン</Table.Th>
                  <Table.Th w={60}>通貨</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredTournaments.map((tournament) => (
                  <SortableRow
                    expandedId={expandedId}
                    key={tournament.id}
                    onArchiveToggle={onArchiveToggle}
                    onDelete={onDelete}
                    onEditClick={onEditClick}
                    setExpandedId={setExpandedId}
                    tournament={tournament}
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
