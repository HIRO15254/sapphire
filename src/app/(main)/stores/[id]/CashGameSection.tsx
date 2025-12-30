'use client'

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
  IconPokerChip,
  IconTrash,
} from '@tabler/icons-react'
import { Fragment, useState } from 'react'

import { RichTextContent } from '~/components/ui/RichTextContext'
import type { CashGame } from './types'
import { generateCashGameDisplayName } from './types'

interface CashGameSectionProps {
  cashGames: CashGame[]
  onCreateClick: () => void
  onEditClick: (game: CashGame) => void
  onArchiveToggle: (gameId: string, isArchived: boolean) => void
  onDelete: (gameId: string) => void
}

export function CashGameSection({
  cashGames,
  onCreateClick,
  onEditClick,
  onArchiveToggle,
  onDelete,
}: CashGameSectionProps) {
  const [showArchived, setShowArchived] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredGames = cashGames.filter((g) => showArchived || !g.isArchived)

  return (
    <Card p="lg" radius="md" shadow="sm" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <IconPokerChip size={20} />
          <Title order={3}>キャッシュゲーム</Title>
        </Group>
        <Group gap="md">
          {cashGames.some((g) => g.isArchived) && (
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
        <Table withRowBorders={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={30}></Table.Th>
              <Table.Th>ブラインド</Table.Th>
              <Table.Th w={60}>通貨</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>操作</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredGames.map((game) => (
              <Fragment key={game.id}>
                <Table.Tr>
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
                    <Table.Td colSpan={4} p={0}>
                      <Collapse in={expandedId === game.id}>
                        <Box m="sm">
                          <RichTextContent content={game.notes} />
                        </Box>
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
