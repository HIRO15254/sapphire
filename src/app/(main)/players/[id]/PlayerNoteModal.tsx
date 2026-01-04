'use client'

import { Button, Group, Modal, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useEffect } from 'react'

interface PlayerNoteModalProps {
  opened: boolean
  onClose: () => void
  onSubmit: (values: { noteDate: string; content: string }) => void
  editingNote: { id: string; noteDate: string; content: string } | null
  isLoading: boolean
}

/**
 * Modal for adding or editing player notes.
 */
export function PlayerNoteModal({
  opened,
  onClose,
  onSubmit,
  editingNote,
  isLoading,
}: PlayerNoteModalProps) {
  const form = useForm({
    initialValues: {
      noteDate: new Date().toISOString().split('T')[0] ?? '',
      content: '',
    },
    validate: {
      noteDate: (value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value) ? null : '日付形式が不正です',
      content: (value) =>
        value.trim().length > 0 ? null : 'ノート内容を入力してください',
    },
  })

  // Reset form when editing note changes or modal opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: form methods are stable
  useEffect(() => {
    if (opened) {
      if (editingNote) {
        form.setValues({
          noteDate: editingNote.noteDate,
          content: editingNote.content,
        })
      } else {
        form.reset()
        form.setFieldValue('noteDate', new Date().toISOString().split('T')[0] ?? '')
      }
    }
  }, [opened, editingNote])

  const handleSubmit = form.onSubmit((values) => {
    onSubmit(values)
  })

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editingNote ? 'ノートを編集' : 'ノートを追加'}
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="日付"
            type="date"
            required
            {...form.getInputProps('noteDate')}
          />
          <Textarea
            label="内容"
            placeholder="プレイヤーの観察やメモを入力..."
            required
            minRows={3}
            autosize
            maxRows={10}
            {...form.getInputProps('content')}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" loading={isLoading}>
              保存
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
