'use client'

import { ActionIcon, Card, Group, Text, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconMinus, IconPlus } from '@tabler/icons-react'
import { api } from '~/trpc/react'

interface HandCounterCardProps {
  sessionId: string
  handCount: number
}

/**
 * Slim card for counting hands during a live session.
 * Displays hand count in the center with +/- buttons on either side.
 */
export function HandCounterCard({ sessionId, handCount }: HandCounterCardProps) {
  const utils = api.useUtils()

  const addHandMutation = api.sessionEvent.recordHandComplete.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const removeHandMutation = api.sessionEvent.deleteLatestHandComplete.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const handleAddHand = () => {
    addHandMutation.mutate({ sessionId })
  }

  const handleRemoveHand = () => {
    if (handCount > 0) {
      removeHandMutation.mutate({ sessionId })
    }
  }

  return (
    <Card padding="xs" radius="md" withBorder>
      <Group justify="center" gap="lg">
        <Tooltip label="ハンド数を減らす">
          <ActionIcon
            color="red"
            disabled={handCount === 0 || removeHandMutation.isPending}
            loading={removeHandMutation.isPending}
            onClick={handleRemoveHand}
            size="lg"
            variant="light"
          >
            <IconMinus size={20} />
          </ActionIcon>
        </Tooltip>

        <Group gap="xs" align="baseline">
          <Text fw={700} size="xl">
            {handCount}
          </Text>
          <Text c="dimmed" size="sm">
            ハンド
          </Text>
        </Group>

        <Tooltip label="ハンド完了">
          <ActionIcon
            color="green"
            disabled={addHandMutation.isPending}
            loading={addHandMutation.isPending}
            onClick={handleAddHand}
            size="lg"
            variant="light"
          >
            <IconPlus size={20} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Card>
  )
}
