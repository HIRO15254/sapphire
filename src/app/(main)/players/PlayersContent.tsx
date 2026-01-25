'use client'

import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  TagsInput,
  Text,
  TextInput,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  IconAlertCircle,
  IconPlus,
  IconSearch,
  IconSettings,
  IconUser,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'
import { usePageTitle } from '~/contexts/PageTitleContext'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'

import { PlayerTagModal } from './PlayerTagModal'

type Player = RouterOutputs['player']['list']['players'][number]
type Tag = RouterOutputs['playerTag']['list']['tags'][number]

interface PlayersContentProps {
  initialPlayers: Player[]
  initialTags: Tag[]
}

/**
 * Player list content client component.
 *
 * Displays all players with search and tag filtering.
 */
export function PlayersContent({
  initialPlayers,
  initialTags,
}: PlayersContentProps) {
  usePageTitle('プレイヤー')

  const [search, setSearch] = useState('')
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([])
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [debouncedSearch] = useDebouncedValue(search, 300)

  // Fetch tags for filter dropdown (use initial data, refetch when modal closes)
  const { data: tagsData } = api.playerTag.list.useQuery(undefined, {
    initialData: { tags: initialTags },
  })

  const tags = tagsData?.tags ?? initialTags

  // Convert selected tag names to IDs for API query
  const selectedTagIds = selectedTagNames
    .map((name) => tags.find((t) => t.name === name)?.id)
    .filter((id): id is string => id !== undefined)

  // Determine if filtering is active
  const hasFilters = Boolean(debouncedSearch) || selectedTagIds.length > 0

  // Fetch filtered data when filters are applied
  const { data, isLoading, error } = api.player.list.useQuery(
    {
      search: debouncedSearch || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    },
    {
      enabled: hasFilters,
    },
  )

  const players = hasFilters ? (data?.players ?? []) : initialPlayers

  // Create tag options for TagsInput (use names as values)
  const tagOptions = tags.map((tag) => tag.name)

  if (hasFilters && isLoading) {
    return (
      <Container py="xl" size="md">
        <Stack align="center" gap="lg">
          <Loader size="lg" />
          <Text c="dimmed">検索中...</Text>
        </Stack>
      </Container>
    )
  }

  if (hasFilters && error) {
    return (
      <Container py="xl" size="md">
        <Alert color="red" icon={<IconAlertCircle size={16} />} title="エラー">
          {error.message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <Group justify="flex-end">
          <Button
            leftSection={<IconSettings size={16} />}
            onClick={() => setTagModalOpen(true)}
            variant="light"
          >
            タグ管理
          </Button>
          {initialPlayers.length > 0 && (
            <Button
              component={Link}
              href="/players/new"
              leftSection={<IconPlus size={16} />}
            >
              新しいプレイヤーを追加
            </Button>
          )}
        </Group>

        {/* Search and Filter */}
        <Group grow>
          <TextInput
            leftSection={<IconSearch size={16} />}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="プレイヤーを検索"
            value={search}
          />
          <TagsInput
            clearable
            data={tagOptions}
            onChange={setSelectedTagNames}
            placeholder="タグでフィルター"
            value={selectedTagNames}
          />
        </Group>

        {players.length === 0 ? (
          <Card p="xl" radius="md" shadow="sm" withBorder>
            <Stack align="center" gap="md">
              <Text c="dimmed" size="lg">
                {hasFilters
                  ? '該当するプレイヤーが見つかりません'
                  : 'プレイヤーが登録されていません'}
              </Text>
              {!hasFilters && (
                <>
                  <Text c="dimmed" size="sm">
                    対戦相手のプレイヤーを追加して、プレイスタイルやノートを記録しましょう
                  </Text>
                  <Button
                    component={Link}
                    href="/players/new"
                    leftSection={<IconPlus size={16} />}
                    mt="md"
                  >
                    新しいプレイヤーを追加
                  </Button>
                </>
              )}
            </Stack>
          </Card>
        ) : (
          <Stack gap="md">
            {players.map((player) => (
              <Card
                component={Link}
                href={`/players/${player.id}`}
                key={player.id}
                p="lg"
                radius="md"
                shadow="sm"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
                withBorder
              >
                <Group justify="space-between">
                  <Stack gap="xs">
                    <Group gap="sm">
                      <IconUser size={20} style={{ color: 'gray' }} />
                      <Text fw={600} size="lg">
                        {player.name}
                      </Text>
                    </Group>
                    {player.tags.length > 0 && (
                      <Group gap="xs">
                        {player.tags.map((tag) => (
                          <Badge
                            color={tag.color ? undefined : 'gray'}
                            key={tag.id}
                            size="sm"
                            style={
                              tag.color
                                ? { backgroundColor: tag.color, color: '#fff' }
                                : undefined
                            }
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </Group>
                    )}
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Tag Management Modal */}
      <PlayerTagModal
        onClose={() => setTagModalOpen(false)}
        opened={tagModalOpen}
        tags={tags}
      />
    </Container>
  )
}
