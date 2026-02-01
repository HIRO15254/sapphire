'use client'

import {
  Button,
  Container,
  Drawer,
  Group,
  Stack,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconSettings } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { usePageTitle } from '~/contexts/PageTitleContext'
import {
  type PlayerFilterState,
  PlayerFAB,
  PlayerFilter,
  PlayerList,
  PlayerTagModal,
  defaultPlayerFilters,
  filterPlayers,
  hasActivePlayerFilters,
} from '~/features/players'
import type { RouterOutputs } from '~/trpc/react'
import { createPlayer } from './actions'

type Player = RouterOutputs['player']['list']['players'][number]
type Tag = RouterOutputs['playerTag']['list']['tags'][number]

interface PlayersContentProps {
  players: Player[]
  tags: Tag[]
}

/**
 * Player list content client component.
 *
 * Orchestrates filter, list, and tag management components with client-side filtering.
 */
export function PlayersContent({ players, tags }: PlayersContentProps) {
  usePageTitle('プレイヤー')

  const router = useRouter()
  const [filters, setFilters] = useState<PlayerFilterState>(defaultPlayerFilters)
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [isCreating, startCreateTransition] = useTransition()

  // Map tags to TagOption format for feature components
  const tagOptions = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
  }))

  // Filter players client-side
  const filteredPlayers = useMemo(
    () => filterPlayers(players, filters),
    [players, filters],
  )

  const isFiltered = hasActivePlayerFilters(filters)

  // Map players to PlayerListItem format
  const playerListItems = filteredPlayers.map((player) => ({
    id: player.id,
    name: player.name,
    tags: player.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
    createdAt: new Date(player.createdAt),
    updatedAt: player.updatedAt ? new Date(player.updatedAt) : null,
  }))

  // New player form
  const form = useForm({
    initialValues: {
      name: '',
    },
    validate: {
      name: (value) =>
        value.trim().length === 0 ? 'プレイヤー名を入力してください' : null,
    },
  })

  const handleSubmitNewPlayer = (values: typeof form.values) => {
    startCreateTransition(async () => {
      const result = await createPlayer({ name: values.name.trim() })

      if (result.success) {
        notifications.show({
          title: '成功',
          message: 'プレイヤーを追加しました',
          color: 'green',
        })
        form.reset()
        closeDrawer()
        router.refresh()
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  }

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <Group justify="flex-end">
          <Button
            leftSection={<IconSettings size={16} />}
            onClick={() => setTagModalOpen(true)}
            size="xs"
            variant="light"
          >
            タグ管理
          </Button>
        </Group>

        <PlayerFilter
          filters={filters}
          onFiltersChange={setFilters}
          tags={tagOptions}
        />

        <PlayerList
          isFiltered={isFiltered}
          onOpenNewPlayer={openDrawer}
          players={playerListItems}
        />
      </Stack>

      <PlayerFAB onOpen={openDrawer} />

      {/* New Player Drawer */}
      <Drawer
        onClose={closeDrawer}
        opened={drawerOpened}
        position="bottom"
        size="auto"
        title="新しいプレイヤーを追加"
      >
        <form onSubmit={form.onSubmit(handleSubmitNewPlayer)}>
          <Stack gap="md" pb="md">
            <TextInput
              label="プレイヤー名"
              placeholder="名前を入力"
              required
              {...form.getInputProps('name')}
            />
            <Group gap="sm" justify="flex-end">
              <Button onClick={closeDrawer} variant="subtle">
                キャンセル
              </Button>
              <Button loading={isCreating} type="submit">
                追加
              </Button>
            </Group>
          </Stack>
        </form>
      </Drawer>

      {/* Tag Management Modal */}
      <PlayerTagModal
        onClose={() => setTagModalOpen(false)}
        opened={tagModalOpen}
        tags={tagOptions}
      />
    </Container>
  )
}
