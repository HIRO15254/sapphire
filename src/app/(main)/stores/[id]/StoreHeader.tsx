'use client'

import { Badge, Button, Group, Title } from '@mantine/core'
import {
  IconArchive,
  IconArchiveOff,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react'

interface StoreHeaderProps {
  name: string
  isArchived: boolean
  isArchiving: boolean
  onEditClick: () => void
  onArchiveToggle: () => void
  onDeleteClick: () => void
}

export function StoreHeader({
  name,
  isArchived,
  isArchiving,
  onEditClick,
  onArchiveToggle,
  onDeleteClick,
}: StoreHeaderProps) {
  return (
    <Group justify="space-between">
      <Group gap="sm">
        <Title order={1}>{name}</Title>
        {isArchived && (
          <Badge color="gray" size="lg">
            アーカイブ済み
          </Badge>
        )}
      </Group>
      <Group>
        <Button
          leftSection={<IconEdit size={16} />}
          onClick={onEditClick}
          variant="outline"
        >
          編集
        </Button>
        <Button
          color={isArchived ? 'teal' : 'gray'}
          leftSection={
            isArchived ? (
              <IconArchiveOff size={16} />
            ) : (
              <IconArchive size={16} />
            )
          }
          loading={isArchiving}
          onClick={onArchiveToggle}
          variant="outline"
        >
          {isArchived ? 'アーカイブ解除' : 'アーカイブ'}
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
