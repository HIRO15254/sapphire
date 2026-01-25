'use client'

import {
  Badge,
  Button,
  CheckIcon,
  Combobox,
  Divider,
  Group,
  Loader,
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
import { IconPlus } from '@tabler/icons-react'
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
  tablemateId: string
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
  tablemateId,
  sessionId,
}: PlayerEditModalProps) {
  const utils = api.useUtils()

  // Get all tags
  const { data: tagsData } = api.playerTag.list.useQuery(undefined, {
    enabled: opened,
  })
  const allTags = tagsData?.tags ?? []

  // Get all players for linking (only for temporary players)
  const { data: playersData } = api.player.list.useQuery(
    {},
    { enabled: opened && player?.isTemporary },
  )
  const allPlayers = playersData?.players ?? []

  // Local state for selected tags (only saved on submit)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  // Track the initial tag IDs for calculating changes on submit
  const [initialTagIds, setInitialTagIds] = useState<string[]>([])

  // Search query for tag combobox
  const [tagSearch, setTagSearch] = useState('')

  // For temporary players: name search and selected player
  const [nameSearch, setNameSearch] = useState('')
  const [selectedExistingPlayerId, setSelectedExistingPlayerId] = useState<
    string | null
  >(null)
  // Track if user explicitly chose to create a new permanent player
  const [willCreateNew, setWillCreateNew] = useState(false)

  // Combobox for tag selection
  const tagCombobox = useCombobox({
    onDropdownClose: () => tagCombobox.resetSelectedOption(),
    onDropdownOpen: () => tagCombobox.updateSelectedOptionIndex('active'),
  })

  // Combobox for player name (temp players only)
  const nameCombobox = useCombobox({
    onDropdownClose: () => nameCombobox.resetSelectedOption(),
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
      setTagSearch('')
      // For temporary players, initialize name search
      setNameSearch(player.name)
      setSelectedExistingPlayerId(null)
      setWillCreateNew(false)
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

  const createTagMutation = api.playerTag.create.useMutation({
    onSuccess: (newTag) => {
      // Add the new tag to selected tags
      if (newTag) {
        setSelectedTagIds((current) => [...current, newTag.id])
      }
      // Invalidate tag list to refresh
      void utils.playerTag.list.invalidate()
      setTagSearch('')
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const linkToPlayerMutation = api.sessionTablemate.linkToPlayer.useMutation({
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  const convertToPlayerMutation =
    api.sessionTablemate.convertToPlayer.useMutation({
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

    if (player.isTemporary) {
      if (selectedExistingPlayerId) {
        // Link to existing player
        await linkToPlayerMutation.mutateAsync({
          id: tablemateId,
          playerId: selectedExistingPlayerId,
        })

        // Apply tags to target player
        const tagsToAdd = selectedTagIds.filter(
          (id) => !initialTagIds.includes(id),
        )
        for (const tagId of tagsToAdd) {
          await assignTagMutation.mutateAsync({
            playerId: selectedExistingPlayerId,
            tagId,
          })
        }

        // Update notes on target player if provided
        if (values.generalNotes) {
          await updatePlayerMutation.mutateAsync({
            id: selectedExistingPlayerId,
            generalNotes: values.generalNotes,
          })
        }

        void utils.player.list.invalidate()
        notifications.show({
          title: '紐付け完了',
          message: `既存プレイヤーに紐付けしました`,
          color: 'green',
        })
      } else if (willCreateNew) {
        // Convert to new permanent player
        await convertToPlayerMutation.mutateAsync({
          id: tablemateId,
          playerName: nameSearch.trim(),
        })

        // Update notes if provided
        if (values.generalNotes) {
          await updatePlayerMutation.mutateAsync({
            id: player.id,
            generalNotes: values.generalNotes,
          })
        }

        // Apply tag changes
        const tagsToAdd = selectedTagIds.filter(
          (id) => !initialTagIds.includes(id),
        )
        const tagsToRemove = initialTagIds.filter(
          (id) => !selectedTagIds.includes(id),
        )
        for (const tagId of tagsToAdd) {
          await assignTagMutation.mutateAsync({ playerId: player.id, tagId })
        }
        for (const tagId of tagsToRemove) {
          await removeTagMutation.mutateAsync({ playerId: player.id, tagId })
        }

        void utils.player.list.invalidate()
        notifications.show({
          title: '永続化完了',
          message: `「${nameSearch.trim()}」を永続プレイヤーとして作成しました`,
          color: 'green',
        })
      } else {
        // Just update the temporary player (no persist)
        await updatePlayerMutation.mutateAsync({
          id: player.id,
          name: nameSearch.trim(),
          generalNotes: values.generalNotes || undefined,
        })

        // Apply tag changes
        const tagsToAdd = selectedTagIds.filter(
          (id) => !initialTagIds.includes(id),
        )
        const tagsToRemove = initialTagIds.filter(
          (id) => !selectedTagIds.includes(id),
        )
        for (const tagId of tagsToAdd) {
          await assignTagMutation.mutateAsync({ playerId: player.id, tagId })
        }
        for (const tagId of tagsToRemove) {
          await removeTagMutation.mutateAsync({ playerId: player.id, tagId })
        }

        notifications.show({
          title: '更新完了',
          message: '一時プレイヤー情報を更新しました',
          color: 'green',
        })
      }
    } else {
      // Non-temporary player: just update
      await updatePlayerMutation.mutateAsync({
        id: player.id,
        name: values.name,
        generalNotes: values.generalNotes || undefined,
      })

      // Apply tag changes
      const tagsToAdd = selectedTagIds.filter(
        (id) => !initialTagIds.includes(id),
      )
      const tagsToRemove = initialTagIds.filter(
        (id) => !selectedTagIds.includes(id),
      )
      for (const tagId of tagsToAdd) {
        await assignTagMutation.mutateAsync({ playerId: player.id, tagId })
      }
      for (const tagId of tagsToRemove) {
        await removeTagMutation.mutateAsync({ playerId: player.id, tagId })
      }

      notifications.show({
        title: '更新完了',
        message: 'プレイヤー情報を更新しました',
        color: 'green',
      })
    }

    // Invalidate and close
    void utils.sessionTablemate.list.invalidate({ sessionId })
    onClose()
  })

  // Handle tag toggle or create new tag
  const handleTagToggle = (value: string) => {
    if (value === '$create') {
      // Create new tag with the search query
      if (tagSearch.trim()) {
        createTagMutation.mutate({ name: tagSearch.trim() })
      }
      return
    }

    setSelectedTagIds((current) =>
      current.includes(value)
        ? current.filter((id) => id !== value)
        : [...current, value],
    )
    setTagSearch('')
  }

  // Filter tags based on search
  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase()),
  )

  // Check if search matches any existing tag exactly
  const exactTagMatch = allTags.some(
    (tag) => tag.name.toLowerCase() === tagSearch.toLowerCase(),
  )

  // Filter players based on name search (exclude already linked temporary players' IDs)
  const filteredPlayers = allPlayers.filter((p) =>
    p.name.toLowerCase().includes(nameSearch.toLowerCase()),
  )

  // Check if name search matches any existing player exactly
  const exactPlayerMatch = allPlayers.some(
    (p) => p.name.toLowerCase() === nameSearch.trim().toLowerCase(),
  )

  // Get selected player name for display
  const selectedPlayerName = selectedExistingPlayerId
    ? (allPlayers.find((p) => p.id === selectedExistingPlayerId)?.name ?? '')
    : ''

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
    removeTagMutation.isPending ||
    createTagMutation.isPending ||
    linkToPlayerMutation.isPending ||
    convertToPlayerMutation.isPending

  return (
    <Modal
      onClose={onClose}
      opened={opened}
      size="lg"
      title={`${player?.name ?? ''} を編集`}
    >
      <form onSubmit={handleSubmit}>
        <ScrollArea.Autosize mah="70vh">
          <Stack gap="md" pr="xs">
            {/* Name field */}
            {player?.isTemporary ? (
              // Temporary player: combobox to search existing players or create new
              <Stack gap={4}>
                <Combobox
                  onOptionSubmit={(val) => {
                    if (val === '$create') {
                      setSelectedExistingPlayerId(null)
                      setWillCreateNew(true)
                      nameCombobox.closeDropdown()
                    } else {
                      setSelectedExistingPlayerId(val)
                      setNameSearch(
                        allPlayers.find((p) => p.id === val)?.name ?? '',
                      )
                      setWillCreateNew(false)
                      nameCombobox.closeDropdown()
                    }
                  }}
                  store={nameCombobox}
                >
                  <Combobox.Target>
                    <TextInput
                      label="プレイヤー名"
                      onChange={(e) => {
                        setNameSearch(e.currentTarget.value)
                        setSelectedExistingPlayerId(null)
                        setWillCreateNew(false)
                        nameCombobox.openDropdown()
                      }}
                      onClick={() => nameCombobox.openDropdown()}
                      onFocus={() => nameCombobox.openDropdown()}
                      placeholder="プレイヤー名を入力..."
                      rightSection={<Combobox.Chevron />}
                      value={
                        selectedExistingPlayerId
                          ? selectedPlayerName
                          : nameSearch
                      }
                      withAsterisk
                    />
                  </Combobox.Target>
                  <Combobox.Dropdown>
                    <Combobox.Options>
                      {/* Create new option */}
                      {nameSearch.trim() && !exactPlayerMatch && (
                        <Combobox.Option value="$create">
                          <Group gap="sm">
                            <IconPlus size={14} />
                            <Text size="sm">
                              「{nameSearch.trim()}」を永続化
                            </Text>
                          </Group>
                        </Combobox.Option>
                      )}
                      {/* Existing players */}
                      {filteredPlayers.map((p) => (
                        <Combobox.Option key={p.id} value={p.id}>
                          {p.name}
                        </Combobox.Option>
                      ))}
                      {filteredPlayers.length === 0 && !nameSearch.trim() && (
                        <Combobox.Empty>プレイヤーがいません</Combobox.Empty>
                      )}
                    </Combobox.Options>
                  </Combobox.Dropdown>
                </Combobox>
                {/* Show action description */}
                {(selectedExistingPlayerId || willCreateNew) && (
                  <Text c="dimmed" size="xs">
                    {selectedExistingPlayerId
                      ? `既存のプレイヤー「${selectedPlayerName}」に紐付けます`
                      : `新しいプレイヤー「${nameSearch.trim()}」として永続化します`}
                  </Text>
                )}
              </Stack>
            ) : (
              // Non-temporary player: read-only name
              <>
                <TextInput
                  disabled
                  key={form.key('name')}
                  label="プレイヤー名"
                  withAsterisk
                  {...form.getInputProps('name')}
                />
                <Text c="dimmed" mt={-8} size="xs">
                  永続プレイヤーの名前はプレイヤー詳細ページから変更できます
                </Text>
              </>
            )}

            {/* Tags with color badges */}
            <Stack gap="xs">
              <Text fw={500} size="sm">
                タグ
              </Text>
              <Combobox
                onOptionSubmit={handleTagToggle}
                store={tagCombobox}
                withinPortal={false}
              >
                <Combobox.DropdownTarget>
                  <PillsInput onClick={() => tagCombobox.openDropdown()}>
                    <Pill.Group>
                      {selectedTags.map((tag) => (
                        <Badge
                          color={tag.color ?? 'gray'}
                          key={tag.id}
                          rightSection={
                            <Text
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTagRemove(tag.id)
                              }}
                              size="xs"
                              style={{ cursor: 'pointer' }}
                            >
                              ×
                            </Text>
                          }
                          size="lg"
                          style={{ cursor: 'pointer' }}
                          variant="light"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      <Combobox.EventsTarget>
                        <PillsInput.Field
                          onBlur={() => tagCombobox.closeDropdown()}
                          onChange={(e) => {
                            setTagSearch(e.currentTarget.value)
                            tagCombobox.openDropdown()
                            tagCombobox.updateSelectedOptionIndex()
                          }}
                          onFocus={() => tagCombobox.openDropdown()}
                          placeholder={
                            selectedTags.length === 0
                              ? 'タグを検索または作成...'
                              : ''
                          }
                          style={{ minWidth: 80 }}
                          value={tagSearch}
                        />
                      </Combobox.EventsTarget>
                    </Pill.Group>
                  </PillsInput>
                </Combobox.DropdownTarget>

                <Combobox.Dropdown>
                  <Combobox.Options>
                    {/* Create new tag option */}
                    {tagSearch.trim() && !exactTagMatch && (
                      <Combobox.Option
                        disabled={createTagMutation.isPending}
                        value="$create"
                      >
                        <Group gap="sm">
                          {createTagMutation.isPending ? (
                            <Loader size={12} />
                          ) : (
                            <IconPlus size={12} />
                          )}
                          <Text size="sm">「{tagSearch.trim()}」を作成</Text>
                        </Group>
                      </Combobox.Option>
                    )}
                    {/* Existing tags filtered by search */}
                    {filteredTags.length === 0 && !tagSearch.trim() ? (
                      <Combobox.Empty>タグがありません</Combobox.Empty>
                    ) : (
                      filteredTags.map((tag) => (
                        <Combobox.Option
                          active={selectedTagIds.includes(tag.id)}
                          key={tag.id}
                          value={tag.id}
                        >
                          <Group gap="sm">
                            {selectedTagIds.includes(tag.id) && (
                              <CheckIcon size={12} />
                            )}
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
                placeholder="プレイヤーに関するメモ..."
                variant="bubble"
              />
            </Stack>

            <Group justify="flex-end">
              <Button onClick={onClose} variant="subtle">
                キャンセル
              </Button>
              <Button loading={isLoading} type="submit">
                保存
              </Button>
            </Group>
          </Stack>
        </ScrollArea.Autosize>
      </form>
    </Modal>
  )
}
