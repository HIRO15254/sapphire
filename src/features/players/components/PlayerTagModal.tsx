'use client'

import {
  ActionIcon,
  Badge,
  Button,
  ColorInput,
  Group,
  Modal,
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
        value.trim().length === 0 ? 'タグ名を入力してください' : null,
      color: (value) =>
        value && !/^#[0-9A-Fa-f]{6}$/.test(value)
          ? '有効なカラーコードを入力してください'
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
            title: '成功',
            message: 'タグを更新しました',
            color: 'green',
          })
          setEditingTag(null)
          form.reset()
          router.refresh()
        } else {
          notifications.show({
            title: 'エラー',
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
            title: '成功',
            message: 'タグを作成しました',
            color: 'green',
          })
          form.reset()
          router.refresh()
        } else {
          notifications.show({
            title: 'エラー',
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
          title: '成功',
          message: 'タグを削除しました',
          color: 'green',
        })
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

  const handleClose = () => {
    setEditingTag(null)
    form.reset()
    onClose()
  }

  return (
    <Modal onClose={handleClose} opened={opened} size="md" title="タグ管理">
      <Stack gap="lg">
        {/* Tag form */}
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              label="タグ名"
              placeholder="例: アグレッシブ"
              required
              {...form.getInputProps('name')}
            />
            <ColorInput
              format="hex"
              label="カラー"
              placeholder="カラーを選択"
              swatches={TAG_COLOR_SWATCHES}
              swatchesPerRow={8}
              {...form.getInputProps('color')}
            />
            <Group gap="sm" justify="flex-end">
              {editingTag && (
                <Button
                  leftSection={<IconX size={16} />}
                  onClick={handleCancelEdit}
                  variant="subtle"
                >
                  キャンセル
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
                {editingTag ? '更新' : '追加'}
              </Button>
            </Group>
          </Stack>
        </form>

        {/* Existing tags */}
        {tags.length > 0 && (
          <Stack gap="xs">
            <Text fw={500} size="sm">
              既存のタグ
            </Text>
            {tags.map((tag) => (
              <Group justify="space-between" key={tag.id}>
                <Badge
                  color={tag.color ? undefined : 'gray'}
                  size="lg"
                  style={
                    tag.color
                      ? { backgroundColor: tag.color, color: '#fff' }
                      : undefined
                  }
                >
                  {tag.name}
                </Badge>
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
    </Modal>
  )
}
