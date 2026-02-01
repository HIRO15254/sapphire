'use client'

import {
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import Link from 'next/link'
import { formatPlayerDate } from '../lib/format-utils'
import type { PlayerListItem } from '../lib/types'

interface PlayerListProps {
  players: PlayerListItem[]
  isFiltered: boolean
  onOpenNewPlayer: () => void
}

/**
 * Player list component.
 *
 * Displays all player cards.
 */
export function PlayerList({
  players,
  isFiltered,
  onOpenNewPlayer,
}: PlayerListProps) {
  // Empty state
  if (players.length === 0) {
    return (
      <Card p="xl" radius="md" shadow="sm" withBorder>
        <Stack align="center" gap="md">
          <Text c="dimmed" size="lg">
            {isFiltered
              ? 'No players match filters'
              : 'No players registered'}
          </Text>
          <Text c="dimmed" size="sm">
            {isFiltered
              ? 'Try adjusting your filters'
              : 'Add a new player to start tracking opponents'}
          </Text>
          {!isFiltered && (
            <Button
              leftSection={<IconPlus size={16} />}
              mt="md"
              onClick={onOpenNewPlayer}
            >
              Add Player
            </Button>
          )}
        </Stack>
      </Card>
    )
  }

  return (
    <Stack gap="xs">
      {players.map((player) => (
        <Card
          component={Link}
          href={`/players/${player.id}`}
          key={player.id}
          px="sm"
          py="xs"
          radius="sm"
          shadow="xs"
          style={{ textDecoration: 'none', cursor: 'pointer' }}
          withBorder
        >
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Text fw={600} size="sm" truncate>
                {player.name}
              </Text>
              {player.tags.length > 0 && (
                <Group gap={4} style={{ overflow: 'hidden' }} wrap="nowrap">
                  {player.tags.map((tag) => (
                    <Badge
                      color={tag.color ?? undefined}
                      key={tag.id}
                      size="xs"
                      style={{ flexShrink: 0 }}
                      variant="light"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </Group>
              )}
            </Stack>
            <Text c="dimmed" size="xs" style={{ flexShrink: 0 }}>
              {formatPlayerDate(player.updatedAt ?? player.createdAt)}
            </Text>
          </Group>
        </Card>
      ))}
    </Stack>
  )
}
