'use client'

import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconMapPin,
  IconPlus,
  IconPokerChip,
  IconTrophy,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'

type Store = RouterOutputs['store']['list']['stores'][number]

interface StoresContentProps {
  initialStores: Store[]
}

/**
 * Store list content client component.
 *
 * Displays all stores with game counts.
 * Uses initial data from server, allows filtering on client.
 */
export function StoresContent({ initialStores }: StoresContentProps) {
  const [includeArchived, setIncludeArchived] = useState(false)

  // Fetch archived data only when includeArchived is true
  const { data, isLoading, error } = api.store.list.useQuery(
    { includeArchived: true },
    {
      enabled: includeArchived,
    },
  )

  // Use server data by default, switch to query data when includeArchived is true
  const stores = includeArchived ? (data?.stores ?? []) : initialStores

  if (includeArchived && isLoading) {
    return (
      <Container py="xl" size="md">
        <Stack align="center" gap="lg">
          <Loader size="lg" />
          <Text c="dimmed">読み込み中...</Text>
        </Stack>
      </Container>
    )
  }

  if (includeArchived && error) {
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
        <Group justify="space-between">
          <Title order={1}>店舗管理</Title>
          {stores.length > 0 && (
            <Button
              component={Link}
              href="/stores/new"
              leftSection={<IconPlus size={16} />}
            >
              新しい店舗を追加
            </Button>
          )}
        </Group>

        <Checkbox
          checked={includeArchived}
          label="アーカイブ済みを表示"
          onChange={(event) => setIncludeArchived(event.currentTarget.checked)}
        />

        {stores.length === 0 ? (
          <Card p="xl" radius="md" shadow="sm" withBorder>
            <Stack align="center" gap="md">
              <Text c="dimmed" size="lg">
                店舗が登録されていません
              </Text>
              <Text c="dimmed" size="sm">
                新しい店舗を追加して、ポーカーセッションの記録を始めましょう
              </Text>
              <Button
                component={Link}
                href="/stores/new"
                leftSection={<IconPlus size={16} />}
                mt="md"
              >
                新しい店舗を追加
              </Button>
            </Stack>
          </Card>
        ) : (
          <Stack gap="md">
            {stores.map((store) => (
              <Card
                component={Link}
                href={`/stores/${store.id}`}
                key={store.id}
                p="lg"
                radius="md"
                shadow="sm"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
                withBorder
              >
                <Group justify="space-between">
                  <Stack gap="xs">
                    <Group gap="sm">
                      <Text fw={600} size="lg">
                        {store.name}
                      </Text>
                      {store.isArchived && (
                        <Badge color="gray" size="sm">
                          アーカイブ済み
                        </Badge>
                      )}
                    </Group>
                    {store.address && (
                      <Group gap="xs">
                        <IconMapPin size={14} style={{ color: 'gray' }} />
                        <Text c="dimmed" size="sm">
                          {store.address}
                        </Text>
                      </Group>
                    )}
                  </Stack>
                  <Group gap="lg">
                    <Stack align="center" gap={4}>
                      <Group gap={4}>
                        <IconPokerChip size={16} style={{ color: 'gray' }} />
                        <Text c="dimmed" size="xs">
                          キャッシュ
                        </Text>
                      </Group>
                      <Text fw={600} size="lg">
                        {store.cashGameCount}
                      </Text>
                    </Stack>
                    <Stack align="center" gap={4}>
                      <Group gap={4}>
                        <IconTrophy size={16} style={{ color: 'gray' }} />
                        <Text c="dimmed" size="xs">
                          トーナメント
                        </Text>
                      </Group>
                      <Text fw={600} size="lg">
                        {store.tournamentCount}
                      </Text>
                    </Stack>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
