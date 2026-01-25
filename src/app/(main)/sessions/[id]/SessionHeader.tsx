'use client'

import { Button, Group } from '@mantine/core'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import Link from 'next/link'
import { GameTypeBadge } from '~/components/sessions/GameTypeBadge'

interface SessionHeaderProps {
  sessionId: string
  gameType: string | null
  onDeleteClick: () => void
}

export function SessionHeader({
  sessionId,
  gameType,
  onDeleteClick,
}: SessionHeaderProps) {
  return (
    <Group justify="space-between">
      <GameTypeBadge gameType={gameType} size="lg" />
      <Group>
        <Button
          component={Link}
          href={`/sessions/${sessionId}/edit`}
          leftSection={<IconEdit size={16} />}
          variant="outline"
        >
          編集
        </Button>
        <Button
          color="red"
          leftSection={<IconTrash size={16} />}
          onClick={onDeleteClick}
          variant="outline"
        >
          削除
        </Button>
      </Group>
    </Group>
  )
}
