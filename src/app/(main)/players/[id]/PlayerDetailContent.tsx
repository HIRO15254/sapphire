'use client'

import {
  ActionIcon,
  Button,
  Card,
  Container,
  Group,
  Modal,
  Paper,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { z } from 'zod'

import { RichTextContent } from '~/components/ui/RichTextContext'
import { RichTextEditor } from '~/components/ui/RichTextEditor'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'
import { deletePlayer, updatePlayer } from '../actions'
import { PlayerNoteModal } from './PlayerNoteModal'

type Player = RouterOutputs['player']['getById']
type Tag = RouterOutputs['playerTag']['list']['tags'][number]

// Schema for player edit form
const updatePlayerSchema = z.object({
  name: z
    .string()
    .min(1, 'プレイヤー名を入力してください')
    .max(255, 'プレイヤー名は255文字以下で入力してください'),
  generalNotes: z.string().optional(),
})

interface PlayerDetailContentProps {
  initialPlayer: Player
  allTags: Tag[]
}

/**
 * Player detail content client component.
 *
 * Shows player details with tags and notes.
 */
export function PlayerDetailContent({
  initialPlayer,
  allTags,
}: PlayerDetailContentProps) {
  const router = useRouter()
  const utils = api.useUtils()

  // Use query with initial data to enable real-time updates after mutations
  const { data: player } = api.player.getById.useQuery(
    { id: initialPlayer.id },
    { initialData: initialPlayer },
  )

  // Use query for tags to get updated tag list
  const { data: tagsData } = api.playerTag.list.useQuery(undefined, {
    initialData: { tags: allTags },
  })
  const tags = tagsData?.tags ?? allTags

  // Modal states
  const [editMode, { toggle: toggleEditMode, close: closeEditMode }] =
    useDisclosure(false)
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false)
  const [noteModalOpened, { open: openNoteModal, close: closeNoteModal }] =
    useDisclosure(false)
  const [editingNote, setEditingNote] = useState<{
    id: string
    noteDate: string
    content: string
  } | null>(null)

  // Transition states for Server Actions
  const [isUpdating, startUpdateTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  // Tag mutations
  const assignTagMutation = api.player.assignTag.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '成功',
        message: 'タグを追加しました',
        color: 'green',
      })
      void utils.player.getById.invalidate({ id: player.id })
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const removeTagMutation = api.player.removeTag.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '成功',
        message: 'タグを削除しました',
        color: 'green',
      })
      void utils.player.getById.invalidate({ id: player.id })
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  // Note mutations
  const addNoteMutation = api.player.addNote.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '成功',
        message: 'ノートを追加しました',
        color: 'green',
      })
      closeNoteModal()
      setEditingNote(null)
      void utils.player.getById.invalidate({ id: player.id })
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const updateNoteMutation = api.player.updateNote.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '成功',
        message: 'ノートを更新しました',
        color: 'green',
      })
      closeNoteModal()
      setEditingNote(null)
      void utils.player.getById.invalidate({ id: player.id })
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const deleteNoteMutation = api.player.deleteNote.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '成功',
        message: 'ノートを削除しました',
        color: 'green',
      })
      void utils.player.getById.invalidate({ id: player.id })
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  // Player edit form
  const editForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: player.name,
      generalNotes: player.generalNotes ?? '',
    },
    validate: zodResolver(updatePlayerSchema),
  })

  const handleEditSubmit = editForm.onSubmit((values) => {
    startUpdateTransition(async () => {
      const result = await updatePlayer({
        id: player.id,
        name: values.name,
        generalNotes: values.generalNotes || undefined,
      })

      if (result.success) {
        notifications.show({
          title: '更新完了',
          message: 'プレイヤーを更新しました',
          color: 'green',
        })
        closeEditMode()
        router.refresh()
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  })

  const handleDelete = () => {
    closeDeleteModal()
    startDeleteTransition(async () => {
      const result = await deletePlayer({ id: player.id })

      if (result.success) {
        notifications.show({
          title: '削除完了',
          message: 'プレイヤーを削除しました',
          color: 'green',
        })
        router.push('/players')
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  }

  // Handle tag changes from TagsInput
  const handleTagsChange = (newTagNames: string[]) => {
    const currentTagNames = player.tags.map((t) => t.name)

    // Find tags to add (in newTagNames but not in current)
    const tagsToAdd = newTagNames.filter((name) => !currentTagNames.includes(name))
    // Find tags to remove (in current but not in newTagNames)
    const tagsToRemove = currentTagNames.filter((name) => !newTagNames.includes(name))

    // Add new tags
    for (const tagName of tagsToAdd) {
      const tag = tags.find((t) => t.name === tagName)
      if (tag) {
        assignTagMutation.mutate({ playerId: player.id, tagId: tag.id })
      }
    }

    // Remove old tags
    for (const tagName of tagsToRemove) {
      const tag = player.tags.find((t) => t.name === tagName)
      if (tag) {
        removeTagMutation.mutate({ playerId: player.id, tagId: tag.id })
      }
    }
  }

  const handleAddNote = () => {
    setEditingNote(null)
    openNoteModal()
  }

  const handleEditNote = (note: { id: string; noteDate: string; content: string }) => {
    setEditingNote(note)
    openNoteModal()
  }

  const handleNoteSubmit = (values: { noteDate: string; content: string }) => {
    if (editingNote) {
      updateNoteMutation.mutate({
        id: editingNote.id,
        noteDate: values.noteDate,
        content: values.content,
      })
    } else {
      addNoteMutation.mutate({
        playerId: player.id,
        noteDate: values.noteDate,
        content: values.content,
      })
    }
  }

  const handleDeleteNote = (noteId: string) => {
    deleteNoteMutation.mutate({ id: noteId })
  }

  // Prepare tag data for TagsInput
  const assignedTagNames = player.tags.map((t) => t.name)
  const allTagNames = tags.map((t) => t.name)

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <Button
          component={Link}
          href="/players"
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          w="fit-content"
        >
          プレイヤー一覧に戻る
        </Button>

        {/* Header */}
        <Group justify="space-between">
          <Title order={1}>{player.name}</Title>
          <Group>
            <Button onClick={toggleEditMode} variant="light">
              編集
            </Button>
            <Button color="red" onClick={openDeleteModal} variant="light">
              削除
            </Button>
          </Group>
        </Group>

        {/* Edit Form */}
        {editMode && (
          <Paper p="lg" radius="md" shadow="sm" withBorder>
            <form onSubmit={handleEditSubmit}>
              <Stack>
                <TextInput
                  label="プレイヤー名"
                  withAsterisk
                  {...editForm.getInputProps('name')}
                />
                <Stack gap="xs">
                  <Text fw={500} size="sm">
                    メモ
                  </Text>
                  <RichTextEditor
                    content={editForm.getValues().generalNotes ?? ''}
                    onChange={(value) =>
                      editForm.setFieldValue('generalNotes', value)
                    }
                  />
                </Stack>
                <Group justify="flex-end">
                  <Button onClick={closeEditMode} variant="subtle">
                    キャンセル
                  </Button>
                  <Button loading={isUpdating} type="submit">
                    保存
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        )}

        {/* General Notes */}
        {player.generalNotes && (
          <Paper p="lg" radius="md" shadow="sm" withBorder>
            <Stack gap="xs">
              <Text fw={500} size="sm">
                メモ
              </Text>
              <RichTextContent content={player.generalNotes} />
            </Stack>
          </Paper>
        )}

        {/* Tags Section */}
        <Paper p="lg" radius="md" shadow="sm" withBorder>
          <Stack gap="md">
            <Text fw={500}>タグ</Text>
            <TagsInput
              data={allTagNames}
              value={assignedTagNames}
              onChange={handleTagsChange}
              placeholder="タグを選択または入力"
              clearable
            />
            {allTagNames.length === 0 && (
              <Text c="dimmed" size="sm">
                タグがまだ作成されていません。プレイヤー一覧画面からタグを管理できます。
              </Text>
            )}
          </Stack>
        </Paper>

        {/* Notes Section */}
        <Paper p="lg" radius="md" shadow="sm" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={500}>日付別ノート</Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={handleAddNote}
              >
                ノートを追加
              </Button>
            </Group>
            {player.notes.length === 0 ? (
              <Text c="dimmed" size="sm">
                日付別ノートはまだありません
              </Text>
            ) : (
              <Stack gap="sm">
                {player.notes.map((note) => (
                  <Card key={note.id} p="md" radius="md" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Text size="sm" c="dimmed">
                          {note.noteDate}
                        </Text>
                        <Text size="sm">{note.content}</Text>
                      </Stack>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleEditNote(note)}
                          aria-label="ノートを編集"
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteNote(note.id)}
                          aria-label="ノートを削除"
                          loading={deleteNoteMutation.isPending}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal
        centered
        onClose={closeDeleteModal}
        opened={deleteModalOpened}
        title="プレイヤーの削除"
      >
        <Stack>
          <Text>
            「{player.name}」を削除しますか？この操作は取り消せません。
          </Text>
          <Group justify="flex-end">
            <Button onClick={closeDeleteModal} variant="subtle">
              キャンセル
            </Button>
            <Button color="red" loading={isDeleting} onClick={handleDelete}>
              削除を確認
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Note Modal */}
      <PlayerNoteModal
        opened={noteModalOpened}
        onClose={() => {
          closeNoteModal()
          setEditingNote(null)
        }}
        onSubmit={handleNoteSubmit}
        editingNote={editingNote}
        isLoading={addNoteMutation.isPending || updateNoteMutation.isPending}
      />
    </Container>
  )
}
