'use client'

import {
  Badge,
  Button,
  CheckIcon,
  Combobox,
  Divider,
  Group,
  Modal,
  Pill,
  PillsInput,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  useCombobox,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { RichTextEditor } from '~/components/ui/RichTextEditor'
import { api } from '~/trpc/react'

// Schema for player edit form
const editPlayerSchema = z.object({
  name: z
    .string()
    .min(1, 'プレイヤー名を入力してください')
    .max(255, 'プレイヤー名は255文字以下で入力してください'),
  generalNotes: z.string().optional(),
})

// Player data passed from parent component
interface PlayerData {
  id: string
  name: string
  isTemporary: boolean
  generalNotes: string | null
  tags: Array<{ id: string; name: string; color: string | null }>
}

interface PlayerEditModalProps {
  opened: boolean
  onClose: () => void
  player: PlayerData | null
  sessionId: string
}

/**
 * Modal for editing player details during a session.
 * Allows editing name (for temporary players), tags, and general notes.
 * Player data is passed from parent to ensure latest state is shown.
 */
export function PlayerEditModal({
  opened,
  onClose,
  player,
  sessionId,
}: PlayerEditModalProps) {
  const utils = api.useUtils()

  // Get all tags
  const { data: tagsData } = api.playerTag.list.useQuery(undefined, {
    enabled: opened,
  })
  const allTags = tagsData?.tags ?? []

  // Local state for selected tags (only saved on submit)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  // Track the initial tag IDs for calculating changes on submit
  const [initialTagIds, setInitialTagIds] = useState<string[]>([])

  // Combobox for tag selection
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  })

  // Form
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      generalNotes: '',
    },
    validate: zodResolver(editPlayerSchema),
  })

  // Initialize form and tags when modal opens with player data
  // biome-ignore lint/correctness/useExhaustiveDependencies: form.setValues is stable, only reset when player/opened changes
  useEffect(() => {
    if (opened && player) {
      form.setValues({
        name: player.name,
        generalNotes: player.generalNotes ?? '',
      })
      const tagIds = player.tags.map((t) => t.id)
      setSelectedTagIds(tagIds)
      setInitialTagIds(tagIds)
    }
  }, [opened, player])

  // Mutations
  const updatePlayerMutation = api.player.update.useMutation({
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const assignTagMutation = api.player.assignTag.useMutation({
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const removeTagMutation = api.player.removeTag.useMutation({
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const handleSubmit = form.onSubmit(async (values) => {
    if (!player) return

    const playerId = player.id

    // Update player info
    await updatePlayerMutation.mutateAsync({
      id: playerId,
      name: values.name,
      generalNotes: values.generalNotes || undefined,
    })

    // Calculate tag changes using initialTagIds
    const tagsToAdd = selectedTagIds.filter((id) => !initialTagIds.includes(id))
    const tagsToRemove = initialTagIds.filter((id) => !selectedTagIds.includes(id))

    // Apply tag changes
    for (const tagId of tagsToAdd) {
      await assignTagMutation.mutateAsync({ playerId, tagId })
    }
    for (const tagId of tagsToRemove) {
      await removeTagMutation.mutateAsync({ playerId, tagId })
    }

    // Invalidate and close
    void utils.sessionTablemate.list.invalidate({ sessionId })

    notifications.show({
      title: '更新完了',
      message: 'プレイヤー情報を更新しました',
      color: 'green',
    })
    onClose()
  })

  // Handle tag toggle
  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    )
  }

  // Handle tag removal from pill
  const handleTagRemove = (tagId: string) => {
    setSelectedTagIds((current) => current.filter((id) => id !== tagId))
  }

  // Get tag by id
  const getTagById = (id: string) => allTags.find((t) => t.id === id)

  // Selected tags as pills
  const selectedTags = selectedTagIds
    .map((id) => getTagById(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)

  const isLoading =
    updatePlayerMutation.isPending ||
    assignTagMutation.isPending ||
    removeTagMutation.isPending

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${player?.name ?? ''} を編集`}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <ScrollArea.Autosize mah="70vh">
          <Stack gap="md" pr="xs">
            {/* Name - only editable for temporary players */}
            <TextInput
              label="プレイヤー名"
              withAsterisk
              disabled={!player?.isTemporary}
              key={form.key('name')}
              {...form.getInputProps('name')}
            />
            {player && !player.isTemporary && (
              <Text size="xs" c="dimmed" mt={-8}>
                永続プレイヤーの名前はプレイヤー詳細ページから変更できます
              </Text>
            )}

            {/* Tags with color badges */}
            <Stack gap="xs">
              <Text fw={500} size="sm">
                タグ
              </Text>
              <Combobox
                store={combobox}
                onOptionSubmit={handleTagToggle}
                withinPortal={false}
              >
                <Combobox.DropdownTarget>
                  <PillsInput onClick={() => combobox.openDropdown()}>
                    <Pill.Group>
                      {selectedTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          color={tag.color ?? 'gray'}
                          variant="light"
                          size="lg"
                          style={{ cursor: 'pointer' }}
                          rightSection={
                            <Text
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTagRemove(tag.id)
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              ×
                            </Text>
                          }
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      <Combobox.EventsTarget>
                        <PillsInput.Field
                          onFocus={() => combobox.openDropdown()}
                          onBlur={() => combobox.closeDropdown()}
                          placeholder={selectedTags.length === 0 ? 'タグを選択...' : ''}
                          style={{ minWidth: 80 }}
                        />
                      </Combobox.EventsTarget>
                    </Pill.Group>
                  </PillsInput>
                </Combobox.DropdownTarget>

                <Combobox.Dropdown>
                  <Combobox.Options>
                    {allTags.length === 0 ? (
                      <Combobox.Empty>タグがありません</Combobox.Empty>
                    ) : (
                      allTags.map((tag) => (
                        <Combobox.Option
                          key={tag.id}
                          value={tag.id}
                          active={selectedTagIds.includes(tag.id)}
                        >
                          <Group gap="sm">
                            {selectedTagIds.includes(tag.id) && <CheckIcon size={12} />}
                            <Badge color={tag.color ?? 'gray'} variant="light">
                              {tag.name}
                            </Badge>
                          </Group>
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </Combobox.Dropdown>
              </Combobox>
            </Stack>

            <Divider />

            {/* General Notes */}
            <Stack gap="xs">
              <Text fw={500} size="sm">
                メモ
              </Text>
              <RichTextEditor
                content={form.getValues().generalNotes ?? ''}
                onChange={(value) => form.setFieldValue('generalNotes', value)}
                variant="bubble"
                placeholder="プレイヤーに関するメモ..."
              />
            </Stack>

            <Group justify="flex-end">
              <Button onClick={onClose} variant="subtle">
                キャンセル
              </Button>
              <Button type="submit" loading={isLoading}>
                保存
              </Button>
            </Group>
          </Stack>
        </ScrollArea.Autosize>
      </form>
    </Modal>
  )
}
