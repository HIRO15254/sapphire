'use client'

import { ActionIcon, Group, Menu } from '@mantine/core'
import {
  IconArrowLeft,
  IconDotsVertical,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { GameTypeBadge } from '~/components/sessions/GameTypeBadge'

interface SessionHeaderProps {
  sessionId: string
  gameType: string | null
  onDeleteClick: () => void
  onEditClick: () => void
}

export function SessionHeader({
  gameType,
  onDeleteClick,
  onEditClick,
}: SessionHeaderProps) {
  const router = useRouter()

  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap="xs" wrap="nowrap">
        <ActionIcon
          aria-label="Back to sessions"
          onClick={() => router.push('/sessions')}
          variant="subtle"
        >
          <IconArrowLeft size={20} />
        </ActionIcon>
        <GameTypeBadge gameType={gameType} size="lg" />
      </Group>
      <Menu position="bottom-end" shadow="md">
        <Menu.Target>
          <ActionIcon aria-label="Menu" variant="subtle">
            <IconDotsVertical size={20} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconEdit size={16} />} onClick={onEditClick}>
            Edit
          </Menu.Item>
          <Menu.Item
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={onDeleteClick}
          >
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  )
}
