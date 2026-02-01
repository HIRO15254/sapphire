'use client'

import {
  ActionIcon,
  Button,
  ColorInput,
  Drawer,
  Group,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  createTag,
  deleteTag,
  updateTag,
} from '~/app/(main)/players/actions'
import type { TagOption } from '../lib/types'
import { PlayerTagBadge } from './PlayerTagBadge'

/**
 * Default color swatches for player tags.
 * Colors chosen to represent common player type categories.
 */
const TAG_COLOR_SWATCHES = [
  '#fa5252', // Red - Aggressive
  '#fd7e14', // Orange - Loose
  '#fab005', // Yellow - Tricky
  '#40c057', // Green - Tight
  '#228be6', // Blue - Passive
  '#7950f2', // Violet - Unknown
  '#be4bdb', // Pink - Fish
  '#868e96', // Gray - Neutral
]

interface PlayerTagModalProps {
  opened: boolean
  onClose: () => void
  tags: TagOption[]
}

/**
 * Tag management modal component.
 *
 * Allows creating, editing, and deleting player tags.
 * Uses Server Actions for all mutations.
 */
export function PlayerTagModal({
  opened,
  onClose,
  tags,
}: PlayerTagModalProps) {
  const [editingTag, setEditingTag] = useState<TagOption | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm({
    initialValues: {
      name: '',
      color: '',
    },
    validate: {
      name: (value) =>
        value.trim().length === 0 ? 'Please enter a tag name' : null,
      color: (value) =>
        value && !/^#[0-9A-Fa-f]{6}$/.test(value)
          ? 'Please enter a valid hex color code'
          : null,
    },
  })

  const handleSubmit = (values: typeof form.values) => {
    startTransition(async () => {
      if (editingTag) {
        const result = await updateTag({
          id: editingTag.id,
          name: values.name,
          color: values.color || null,
        })
        if (result.success) {
          notifications.show({
            title: 'Success',
            message: 'Tag updated',
            color: 'green',
          })
          setEditingTag(null)
          form.reset()
          router.refresh()
        } else {
          notifications.show({
            title: 'Error',
            message: result.error,
            color: 'red',
          })
        }
      } else {
        const result = await createTag({
          name: values.name,
          color: values.color || undefined,
        })
        if (result.success) {
          notifications.show({
            title: 'Success',
            message: 'Tag created',
            color: 'green',
          })
          form.reset()
          router.refresh()
        } else {
          notifications.show({
            title: 'Error',
            message: result.error,
            color: 'red',
          })
        }
      }
    })
  }

  const handleEdit = (tag: TagOption) => {
    setEditingTag(tag)
    form.setValues({
      name: tag.name,
      color: tag.color ?? '',
    })
  }

  const handleCancelEdit = () => {
    setEditingTag(null)
    form.reset()
  }

  const handleDelete = (tagId: string) => {
    startTransition(async () => {
      const result = await deleteTag({ id: tagId })
      if (result.success) {
        notifications.show({
          title: 'Success',
          message: 'Tag deleted',
          color: 'green',
        })
        router.refresh()
      } else {
        notifications.show({
          title: 'Error',
          message: result.error,
          color: 'red',
        })
      }
    })
  }

  const handleClose = () => {
    setEditingTag(null)
    form.reset()
    onClose()
  }

  return (
    <Drawer
      onClose={handleClose}
      opened={opened}
      position="bottom"
      size="auto"
      title="Manage Tags"
    >
      <Stack gap="lg" pb="md">
        {/* Tag form */}
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              label="Tag Name"
              placeholder="e.g. Aggressive"
              required
              {...form.getInputProps('name')}
            />
            <ColorInput
              format="hex"
              label="Color"
              placeholder="Pick a color"
              swatches={TAG_COLOR_SWATCHES}
              swatchesPerRow={5}
              {...form.getInputProps('color')}
            />
            <Group gap="sm" justify="flex-end">
              {editingTag && (
                <Button
                  leftSection={<IconX size={16} />}
                  onClick={handleCancelEdit}
                  variant="subtle"
                >
                  Cancel
                </Button>
              )}
              <Button
                leftSection={
                  editingTag ? (
                    <IconPencil size={16} />
                  ) : (
                    <IconPlus size={16} />
                  )
                }
                loading={isPending}
                type="submit"
              >
                {editingTag ? 'Update' : 'Add'}
              </Button>
            </Group>
          </Stack>
        </form>

        {/* Existing tags */}
        {tags.length > 0 && (
          <Stack gap="xs">
            <Text fw={500} size="sm">
              Existing Tags
            </Text>
            {tags.map((tag) => (
              <Group justify="space-between" key={tag.id}>
                <PlayerTagBadge size="lg" tag={tag} />
                <Group gap="xs">
                  <ActionIcon
                    disabled={editingTag?.id === tag.id}
                    onClick={() => handleEdit(tag)}
                    variant="subtle"
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                  <ActionIcon
                    color="red"
                    loading={isPending}
                    onClick={() => handleDelete(tag.id)}
                    variant="subtle"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </Drawer>
  )
}
