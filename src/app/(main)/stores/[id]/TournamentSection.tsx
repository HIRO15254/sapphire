'use client'

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
  IconPlus,
  IconTrash,
  IconTrophy,
} from '@tabler/icons-react'
import { Fragment, useState } from 'react'

import { RichTextContent } from '~/components/ui/RichTextContext'
import type { Tournament } from './types'

interface TournamentSectionProps {
  tournaments: Tournament[]
  onCreateClick: () => void
  onEditClick: (tournament: Tournament) => void
  onArchiveToggle: (tournamentId: string, isArchived: boolean) => void
  onDelete: (tournamentId: string) => void
}

export function TournamentSection({
  tournaments,
  onCreateClick,
  onEditClick,
  onArchiveToggle,
  onDelete,
}: TournamentSectionProps) {
  const [showArchived, setShowArchived] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredTournaments = tournaments.filter(
    (t) => showArchived || !t.isArchived,
  )

  return (
    <Card p="lg" radius="md" shadow="sm" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <IconTrophy size={20} />
          <Title order={3}>トーナメント</Title>
        </Group>
        <Group gap="md">
          {tournaments.some((t) => t.isArchived) && (
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
        <Table withRowBorders={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={30}></Table.Th>
              <Table.Th>名前</Table.Th>
              <Table.Th>バイイン</Table.Th>
              <Table.Th w={60}>通貨</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>操作</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredTournaments.map((tournament) => (
              <Fragment key={tournament.id}>
                <Table.Tr>
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
                    <Table.Td colSpan={5} p={0}>
                      <Collapse in={expandedId === tournament.id}>
                        <Paper bg="gray.0" p="sm">
                          <RichTextContent content={tournament.notes} />
                        </Paper>
                      </Collapse>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Fragment>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  )
}
