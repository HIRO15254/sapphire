'use client'

import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Menu,
  Modal,
  NumberInput,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import {
  IconChevronDown,
  IconCoffee,
  IconCoins,
  IconGift,
  IconPercentage,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { RichTextEditor } from '~/components/ui/RichTextEditor'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'

import type {
  BlindLevel,
  EditChoice,
  PrizeItem,
  PrizeLevel,
  PrizeStructure,
  SessionTournamentData,
  TournamentEditMode,
} from './types'

type ActiveSession = NonNullable<
  RouterOutputs['sessionEvent']['getActiveSession']
>

interface TournamentEditModalProps {
  opened: boolean
  onClose: () => void
  mode: TournamentEditMode
  editChoice: EditChoice
  session: ActiveSession
  tournamentData: SessionTournamentData
}

// Basic info form schema
const basicFormSchema = z.object({
  name: z.string().max(255).optional(),
  buyIn: z.number().int().positive(),
  rake: z.number().int().positive().nullable().optional(),
  startingStack: z.number().int().positive().nullable().optional(),
  notes: z.string().optional(),
})

type BasicFormValues = z.infer<typeof basicFormSchema>

/**
 * Modal for editing tournament data.
 * Handles both session-specific overrides and store edits.
 */
export function TournamentEditModal({
  opened,
  onClose,
  mode,
  editChoice,
  session,
  tournamentData,
}: TournamentEditModalProps) {
  const utils = api.useUtils()

  // Mutations for session overrides
  const updateBasic =
    api.sessionEvent.updateTournamentOverrideBasic.useMutation({
      onSuccess: () => {
        void utils.sessionEvent.getActiveSession.invalidate()
        onClose()
      },
    })

  const updateBlinds =
    api.sessionEvent.updateTournamentOverrideBlinds.useMutation({
      onSuccess: () => {
        void utils.sessionEvent.getActiveSession.invalidate()
        onClose()
      },
    })

  const updatePrizes =
    api.sessionEvent.updateTournamentOverridePrizes.useMutation({
      onSuccess: () => {
        void utils.sessionEvent.getActiveSession.invalidate()
        onClose()
      },
    })

  // Mutations for store updates
  const updateStoreBasic = api.tournament.update.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void utils.store.getById.invalidate()
      onClose()
    },
  })

  const updateStoreBlinds = api.tournament.setBlindLevels.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void utils.store.getById.invalidate()
      onClose()
    },
  })

  const updateStorePrizes = api.tournament.setPrizeStructures.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void utils.store.getById.invalidate()
      onClose()
    },
  })

  // Basic info form
  const basicForm = useForm<BasicFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      buyIn: 0,
      rake: null,
      startingStack: null,
      notes: '',
    },
    validate: zodResolver(basicFormSchema),
  })

  // Blind levels state
  const [blindLevels, setBlindLevels] = useState<BlindLevel[]>([])

  // Prize structures state
  const [prizeStructures, setPrizeStructures] = useState<PrizeStructure[]>([])
  const [activePrizeTab, setActivePrizeTab] = useState<string>('0')

  // Reset form/state when modal opens
  useEffect(() => {
    if (opened) {
      if (mode === 'basic') {
        basicForm.setValues({
          name: tournamentData.basic.name ?? '',
          buyIn: tournamentData.basic.buyIn,
          rake: tournamentData.basic.rake,
          startingStack: tournamentData.basic.startingStack,
          notes: tournamentData.basic.notes ?? '',
        })
      } else if (mode === 'blind') {
        setBlindLevels([...tournamentData.blindLevels])
      } else if (mode === 'prize') {
        setPrizeStructures([...tournamentData.prizeStructures])
        setActivePrizeTab('0')
      }
    }
  }, [opened, mode, tournamentData])

  const handleSubmit = () => {
    const tournamentId = session.tournament?.id
    if (!tournamentId) return

    if (editChoice === 'store') {
      // Store update
      if (mode === 'basic') {
        const values = basicForm.getValues()
        updateStoreBasic.mutate({
          id: tournamentId,
          name: values.name || null,
          buyIn: values.buyIn,
          rake: values.rake,
          startingStack: values.startingStack,
          notes: values.notes || null,
        })
      } else if (mode === 'blind') {
        updateStoreBlinds.mutate({
          tournamentId,
          levels: blindLevels,
        })
      } else if (mode === 'prize') {
        updateStorePrizes.mutate({
          tournamentId,
          structures: prizeStructures,
        })
      }
      return
    }

    // Session override
    if (mode === 'basic') {
      const values = basicForm.getValues()
      updateBasic.mutate({
        sessionId: session.id,
        data: {
          name: values.name || null,
          buyIn: values.buyIn,
          rake: values.rake,
          startingStack: values.startingStack,
          notes: values.notes || null,
        },
      })
    } else if (mode === 'blind') {
      updateBlinds.mutate({
        sessionId: session.id,
        blindLevels,
      })
    } else if (mode === 'prize') {
      updatePrizes.mutate({
        sessionId: session.id,
        prizeStructures,
      })
    }
  }

  const isLoading =
    updateBasic.isPending ||
    updateBlinds.isPending ||
    updatePrizes.isPending ||
    updateStoreBasic.isPending ||
    updateStoreBlinds.isPending ||
    updateStorePrizes.isPending

  const modeTitle: Record<TournamentEditMode, string> = {
    basic: '基本情報を編集',
    blind: 'ブラインドストラクチャーを編集',
    prize: 'プライズストラクチャーを編集',
  }

  return (
    <Modal
      centered
      onClose={onClose}
      opened={opened}
      size="lg"
      title={modeTitle[mode]}
    >
      <Stack>
        {editChoice === 'store' && (
          <Text c="orange" size="sm">
            ストア設定への変更はすべてのセッションに反映されます。
          </Text>
        )}

        {mode === 'basic' && <BasicInfoForm form={basicForm} />}

        {mode === 'blind' && (
          <BlindLevelEditor
            blindLevels={blindLevels}
            setBlindLevels={setBlindLevels}
          />
        )}

        {mode === 'prize' && (
          <PrizeStructureEditor
            activePrizeTab={activePrizeTab}
            prizeStructures={prizeStructures}
            setActivePrizeTab={setActivePrizeTab}
            setPrizeStructures={setPrizeStructures}
          />
        )}

        <Group justify="flex-end" mt="md">
          <Button onClick={onClose} variant="subtle">
            キャンセル
          </Button>
          <Button loading={isLoading} onClick={handleSubmit}>
            保存
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

// Basic Info Form Component
function BasicInfoForm({
  form,
}: {
  form: ReturnType<typeof useForm<BasicFormValues>>
}) {
  return (
    <Stack>
      <TextInput
        label="トーナメント名"
        placeholder="例: Sunday Million"
        {...form.getInputProps('name')}
      />
      <Group grow>
        <NumberInput
          label="総バイイン"
          min={1}
          placeholder="10000"
          thousandSeparator=","
          withAsterisk
          {...form.getInputProps('buyIn')}
        />
        <NumberInput
          description="総バイイン内のレーキ額"
          label="レーキ"
          min={0}
          placeholder="1000"
          thousandSeparator=","
          {...form.getInputProps('rake')}
        />
      </Group>
      <NumberInput
        label="スターティングスタック"
        min={1}
        placeholder="30000"
        thousandSeparator=","
        {...form.getInputProps('startingStack')}
      />
      <Stack gap="xs">
        <Text fw={500} size="sm">
          メモ
        </Text>
        <RichTextEditor
          content={form.getValues().notes ?? ''}
          onChange={(value) => form.setFieldValue('notes', value)}
        />
      </Stack>
    </Stack>
  )
}

// Blind Level Editor Component
interface BlindLevelEditorProps {
  blindLevels: BlindLevel[]
  setBlindLevels: (levels: BlindLevel[]) => void
}

function BlindLevelEditor({
  blindLevels,
  setBlindLevels,
}: BlindLevelEditorProps) {
  const addBlindLevel = (isBreak = false) => {
    const nextLevel =
      blindLevels.length > 0
        ? Math.max(...blindLevels.map((l) => l.level)) + 1
        : 1
    const prevLevel = blindLevels[blindLevels.length - 1]

    if (isBreak) {
      setBlindLevels([
        ...blindLevels,
        {
          level: nextLevel,
          isBreak: true,
          smallBlind: null,
          bigBlind: null,
          ante: null,
          durationMinutes: 10,
        },
      ])
    } else {
      setBlindLevels([
        ...blindLevels,
        {
          level: nextLevel,
          isBreak: false,
          smallBlind:
            prevLevel && !prevLevel.isBreak
              ? (prevLevel.smallBlind ?? 100) * 2
              : 100,
          bigBlind:
            prevLevel && !prevLevel.isBreak
              ? (prevLevel.bigBlind ?? 200) * 2
              : 200,
          ante: prevLevel?.ante ? prevLevel.ante * 2 : undefined,
          durationMinutes: prevLevel?.durationMinutes ?? 20,
        },
      ])
    }
  }

  const removeBlindLevel = (index: number) => {
    setBlindLevels(blindLevels.filter((_, i) => i !== index))
  }

  const updateBlindLevel = (
    index: number,
    field: keyof BlindLevel,
    value: number | boolean | undefined | null,
  ) => {
    setBlindLevels(
      blindLevels.map((level, i) => {
        if (i !== index) return level
        if (field === 'bigBlind' && typeof value === 'number') {
          return {
            ...level,
            bigBlind: value,
            smallBlind: Math.floor(value / 2),
            ante: value,
          }
        }
        return { ...level, [field]: value }
      }),
    )
  }

  return (
    <Stack gap="xs">
      <Group gap="xs" justify="flex-end">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => addBlindLevel(false)}
          size="xs"
          variant="light"
        >
          レベル追加
        </Button>
        <Button
          color="orange"
          leftSection={<IconCoffee size={16} />}
          onClick={() => addBlindLevel(true)}
          size="xs"
          variant="light"
        >
          ブレイク追加
        </Button>
      </Group>
      {blindLevels.length === 0 ? (
        <Text c="dimmed" py="md" size="sm" ta="center">
          ブラインドレベルが設定されていません
        </Text>
      ) : (
        <ScrollArea h={300}>
          <Table
            horizontalSpacing={4}
            verticalSpacing={4}
            withRowBorders={false}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={45}>Lv</Table.Th>
                <Table.Th w={75}>SB</Table.Th>
                <Table.Th w={75}>BB</Table.Th>
                <Table.Th w={65}>Ante</Table.Th>
                <Table.Th w={50}>分</Table.Th>
                <Table.Th w={30}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {blindLevels.map((level, index) =>
                level.isBreak ? (
                  <Table.Tr key={`blind-break-${index}`}>
                    <Table.Td colSpan={4} style={{ textAlign: 'center' }}>
                      <Text c="orange" fw={500} size="sm">
                        Break
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        hideControls
                        min={1}
                        onChange={(val) =>
                          updateBlindLevel(
                            index,
                            'durationMinutes',
                            val as number,
                          )
                        }
                        size="xs"
                        styles={{ input: { padding: '2px 6px' } }}
                        value={level.durationMinutes}
                      />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color="red"
                        onClick={() => removeBlindLevel(index)}
                        size="xs"
                        variant="subtle"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  <Table.Tr key={`blind-${level.level}-${index}`}>
                    <Table.Td>
                      <NumberInput
                        hideControls
                        min={1}
                        onChange={(val) =>
                          updateBlindLevel(index, 'level', val as number)
                        }
                        size="xs"
                        styles={{ input: { padding: '2px 6px' } }}
                        value={level.level}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        hideControls
                        min={1}
                        onChange={(val) =>
                          updateBlindLevel(index, 'smallBlind', val as number)
                        }
                        size="xs"
                        styles={{ input: { padding: '2px 6px' } }}
                        thousandSeparator=","
                        value={level.smallBlind ?? ''}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        hideControls
                        min={1}
                        onChange={(val) =>
                          updateBlindLevel(index, 'bigBlind', val as number)
                        }
                        size="xs"
                        styles={{ input: { padding: '2px 6px' } }}
                        thousandSeparator=","
                        value={level.bigBlind ?? ''}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        hideControls
                        min={0}
                        onChange={(val) =>
                          updateBlindLevel(
                            index,
                            'ante',
                            val === '' ? undefined : (val as number),
                          )
                        }
                        size="xs"
                        styles={{ input: { padding: '2px 6px' } }}
                        thousandSeparator=","
                        value={level.ante ?? ''}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        hideControls
                        min={1}
                        onChange={(val) =>
                          updateBlindLevel(
                            index,
                            'durationMinutes',
                            val as number,
                          )
                        }
                        size="xs"
                        styles={{ input: { padding: '2px 6px' } }}
                        value={level.durationMinutes}
                      />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color="red"
                        onClick={() => removeBlindLevel(index)}
                        size="xs"
                        variant="subtle"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ),
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Stack>
  )
}

// Prize Structure Editor Component
interface PrizeStructureEditorProps {
  prizeStructures: PrizeStructure[]
  setPrizeStructures: (structures: PrizeStructure[]) => void
  activePrizeTab: string
  setActivePrizeTab: (tab: string) => void
}

function PrizeStructureEditor({
  prizeStructures,
  setPrizeStructures,
  activePrizeTab,
  setActivePrizeTab,
}: PrizeStructureEditorProps) {
  const addPrizeStructure = () => {
    const prevStructure = prizeStructures[prizeStructures.length - 1]
    const nextSortOrder = prizeStructures.length
    setPrizeStructures([
      ...prizeStructures,
      {
        minEntrants: prevStructure
          ? (prevStructure.maxEntrants ?? prevStructure.minEntrants) + 1
          : 1,
        maxEntrants: null,
        sortOrder: nextSortOrder,
        prizeLevels: [],
      },
    ])
    setActivePrizeTab(String(prizeStructures.length))
  }

  const removePrizeStructure = (sIdx: number) => {
    setPrizeStructures(prizeStructures.filter((_, i) => i !== sIdx))
    if (Number(activePrizeTab) >= prizeStructures.length - 1) {
      setActivePrizeTab(String(Math.max(0, prizeStructures.length - 2)))
    }
  }

  const updatePrizeStructure = (
    sIdx: number,
    field: 'minEntrants' | 'maxEntrants',
    value: number | null,
  ) => {
    setPrizeStructures(
      prizeStructures.map((s, i) =>
        i === sIdx ? { ...s, [field]: value } : s,
      ),
    )
  }

  const addPrizeLevel = (sIdx: number) => {
    setPrizeStructures(
      prizeStructures.map((s, i) => {
        if (i !== sIdx) return s
        const prevLevel = s.prizeLevels[s.prizeLevels.length - 1]
        const nextMinPosition = prevLevel ? prevLevel.maxPosition + 1 : 1
        const copiedPrizeItems = prevLevel
          ? prevLevel.prizeItems.map((item, idx) => ({
              ...item,
              sortOrder: idx,
            }))
          : []
        return {
          ...s,
          prizeLevels: [
            ...s.prizeLevels,
            {
              minPosition: nextMinPosition,
              maxPosition: nextMinPosition,
              sortOrder: s.prizeLevels.length,
              prizeItems: copiedPrizeItems,
            },
          ],
        }
      }),
    )
  }

  const removePrizeLevel = (sIdx: number, lIdx: number) => {
    setPrizeStructures(
      prizeStructures.map((s, i) =>
        i === sIdx
          ? { ...s, prizeLevels: s.prizeLevels.filter((_, j) => j !== lIdx) }
          : s,
      ),
    )
  }

  const updatePrizeLevel = (
    sIdx: number,
    lIdx: number,
    field: 'minPosition' | 'maxPosition',
    value: number,
  ) => {
    setPrizeStructures(
      prizeStructures.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              prizeLevels: s.prizeLevels.map((l, j) =>
                j === lIdx ? { ...l, [field]: value } : l,
              ),
            }
          : s,
      ),
    )
  }

  const addPrizeItem = (
    sIdx: number,
    lIdx: number,
    prizeType: 'percentage' | 'fixed_amount' | 'custom_prize',
  ) => {
    setPrizeStructures(
      prizeStructures.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              prizeLevels: s.prizeLevels.map((l, j) =>
                j === lIdx
                  ? {
                      ...l,
                      prizeItems: [
                        ...l.prizeItems,
                        {
                          prizeType,
                          percentage: null,
                          fixedAmount: null,
                          customPrizeLabel: null,
                          customPrizeValue: null,
                          sortOrder: l.prizeItems.length,
                        },
                      ],
                    }
                  : l,
              ),
            }
          : s,
      ),
    )
  }

  const removePrizeItem = (sIdx: number, lIdx: number, iIdx: number) => {
    setPrizeStructures(
      prizeStructures.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              prizeLevels: s.prizeLevels.map((l, j) =>
                j === lIdx
                  ? {
                      ...l,
                      prizeItems: l.prizeItems.filter((_, k) => k !== iIdx),
                    }
                  : l,
              ),
            }
          : s,
      ),
    )
  }

  const updatePrizeItem = (
    sIdx: number,
    lIdx: number,
    iIdx: number,
    field: keyof PrizeItem,
    value: number | string | null,
  ) => {
    setPrizeStructures(
      prizeStructures.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              prizeLevels: s.prizeLevels.map((l, j) =>
                j === lIdx
                  ? {
                      ...l,
                      prizeItems: l.prizeItems.map((p, k) =>
                        k === iIdx ? { ...p, [field]: value } : p,
                      ),
                    }
                  : l,
              ),
            }
          : s,
      ),
    )
  }

  const activeStructure = prizeStructures[Number(activePrizeTab)]

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Group gap="xs">
          {prizeStructures.map((structure, sIdx) => (
            <Button
              key={`tab-${sIdx}`}
              onClick={() => setActivePrizeTab(String(sIdx))}
              size="xs"
              variant={activePrizeTab === String(sIdx) ? 'filled' : 'light'}
            >
              {structure.minEntrants}〜{structure.maxEntrants ?? '∞'}人
            </Button>
          ))}
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={addPrizeStructure}
          size="xs"
          variant="light"
        >
          範囲追加
        </Button>
      </Group>

      {prizeStructures.length === 0 ? (
        <Text c="dimmed" py="md" size="sm" ta="center">
          プライズストラクチャーが設定されていません
        </Text>
      ) : activeStructure ? (
        <Stack gap="xs">
          <Group gap="xs">
            <Text size="xs">エントリー:</Text>
            <NumberInput
              hideControls
              min={1}
              onChange={(val) =>
                updatePrizeStructure(
                  Number(activePrizeTab),
                  'minEntrants',
                  val as number,
                )
              }
              size="xs"
              styles={{ input: { padding: '2px 6px' } }}
              value={activeStructure.minEntrants}
              w={55}
            />
            <Text size="xs">〜</Text>
            <NumberInput
              hideControls
              min={1}
              onChange={(val) =>
                updatePrizeStructure(
                  Number(activePrizeTab),
                  'maxEntrants',
                  val === '' ? null : (val as number),
                )
              }
              placeholder="∞"
              size="xs"
              styles={{ input: { padding: '2px 6px' } }}
              value={activeStructure.maxEntrants ?? ''}
              w={55}
            />
            <Text size="xs">人</Text>
            <ActionIcon
              color="red"
              onClick={() => removePrizeStructure(Number(activePrizeTab))}
              size="xs"
              variant="subtle"
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
          <Divider />
          <Group justify="space-between">
            <Text c="dimmed" size="xs">
              順位とプライズ
            </Text>
            <Button
              leftSection={<IconPlus size={14} />}
              onClick={() => addPrizeLevel(Number(activePrizeTab))}
              size="xs"
              variant="subtle"
            >
              順位追加
            </Button>
          </Group>
          <ScrollArea h={200}>
            <Table
              horizontalSpacing={4}
              verticalSpacing={4}
              withRowBorders={false}
            >
              <Table.Tbody>
                {activeStructure.prizeLevels.map((level, lIdx) => (
                  <PrizeLevelRow
                    addPrizeItem={addPrizeItem}
                    key={`level-${lIdx}`}
                    level={level}
                    lIdx={lIdx}
                    removePrizeItem={removePrizeItem}
                    removePrizeLevel={removePrizeLevel}
                    sIdx={Number(activePrizeTab)}
                    updatePrizeItem={updatePrizeItem}
                    updatePrizeLevel={updatePrizeLevel}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      ) : null}
    </Stack>
  )
}

// Prize Level Row Component
interface PrizeLevelRowProps {
  level: PrizeLevel
  sIdx: number
  lIdx: number
  updatePrizeLevel: (
    sIdx: number,
    lIdx: number,
    field: 'minPosition' | 'maxPosition',
    value: number,
  ) => void
  removePrizeLevel: (sIdx: number, lIdx: number) => void
  addPrizeItem: (
    sIdx: number,
    lIdx: number,
    prizeType: 'percentage' | 'fixed_amount' | 'custom_prize',
  ) => void
  removePrizeItem: (sIdx: number, lIdx: number, iIdx: number) => void
  updatePrizeItem: (
    sIdx: number,
    lIdx: number,
    iIdx: number,
    field: keyof PrizeItem,
    value: number | string | null,
  ) => void
}

function PrizeLevelRow({
  level,
  sIdx,
  lIdx,
  updatePrizeLevel,
  removePrizeLevel,
  addPrizeItem,
  removePrizeItem,
  updatePrizeItem,
}: PrizeLevelRowProps) {
  return (
    <Table.Tr>
      <Table.Td style={{ verticalAlign: 'middle' }} w={110}>
        <Group gap={2} wrap="nowrap">
          <NumberInput
            hideControls
            min={1}
            onChange={(val) =>
              updatePrizeLevel(sIdx, lIdx, 'minPosition', val as number)
            }
            size="xs"
            styles={{ input: { padding: '2px 4px', textAlign: 'center' } }}
            value={level.minPosition}
            w={36}
          />
          <Text size="xs">〜</Text>
          <NumberInput
            hideControls
            min={1}
            onChange={(val) =>
              updatePrizeLevel(sIdx, lIdx, 'maxPosition', val as number)
            }
            size="xs"
            styles={{ input: { padding: '2px 4px', textAlign: 'center' } }}
            value={level.maxPosition}
            w={36}
          />
          <Text size="xs">位</Text>
        </Group>
      </Table.Td>
      <Table.Td style={{ verticalAlign: 'middle' }}>
        <Stack align="flex-end" gap={2}>
          {level.prizeItems.map((item, iIdx) => (
            <PrizeItemRow
              iIdx={iIdx}
              item={item}
              key={`item-${iIdx}`}
              lIdx={lIdx}
              removePrizeItem={removePrizeItem}
              sIdx={sIdx}
              updatePrizeItem={updatePrizeItem}
            />
          ))}
          {level.prizeItems.length === 0 && (
            <Text c="dimmed" size="xs">
              プライズなし
            </Text>
          )}
        </Stack>
      </Table.Td>
      <Table.Td style={{ verticalAlign: 'middle', paddingLeft: 12 }} w={50}>
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <Button
              px={6}
              rightSection={<IconChevronDown size={12} />}
              size="xs"
              variant="light"
            >
              <IconPlus size={14} />
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              disabled={level.prizeItems.some(
                (item) => item.prizeType === 'percentage',
              )}
              leftSection={<IconPercentage size={14} />}
              onClick={() => addPrizeItem(sIdx, lIdx, 'percentage')}
            >
              パーセンテージ
            </Menu.Item>
            <Menu.Item
              disabled={level.prizeItems.some(
                (item) => item.prizeType === 'fixed_amount',
              )}
              leftSection={<IconCoins size={14} />}
              onClick={() => addPrizeItem(sIdx, lIdx, 'fixed_amount')}
            >
              固定額
            </Menu.Item>
            <Menu.Item
              leftSection={<IconGift size={14} />}
              onClick={() => addPrizeItem(sIdx, lIdx, 'custom_prize')}
            >
              カスタム
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
      <Table.Td style={{ verticalAlign: 'middle' }} w={30}>
        <ActionIcon
          color="red"
          onClick={() => removePrizeLevel(sIdx, lIdx)}
          size="sm"
          variant="subtle"
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  )
}

// Prize Item Row Component
interface PrizeItemRowProps {
  item: PrizeItem
  sIdx: number
  lIdx: number
  iIdx: number
  updatePrizeItem: (
    sIdx: number,
    lIdx: number,
    iIdx: number,
    field: keyof PrizeItem,
    value: number | string | null,
  ) => void
  removePrizeItem: (sIdx: number, lIdx: number, iIdx: number) => void
}

function PrizeItemRow({
  item,
  sIdx,
  lIdx,
  iIdx,
  updatePrizeItem,
  removePrizeItem,
}: PrizeItemRowProps) {
  return (
    <Group gap={2} wrap="nowrap">
      <ActionIcon
        c={
          item.prizeType === 'percentage'
            ? 'blue'
            : item.prizeType === 'fixed_amount'
              ? 'green'
              : 'grape'
        }
        size="xs"
        variant="transparent"
      >
        {item.prizeType === 'percentage' ? (
          <IconPercentage size={14} />
        ) : item.prizeType === 'fixed_amount' ? (
          <IconCoins size={14} />
        ) : (
          <IconGift size={14} />
        )}
      </ActionIcon>
      {item.prizeType === 'percentage' && (
        <NumberInput
          decimalScale={2}
          hideControls
          max={100}
          min={0}
          onChange={(val) =>
            updatePrizeItem(
              sIdx,
              lIdx,
              iIdx,
              'percentage',
              val === '' ? null : (val as number),
            )
          }
          size="xs"
          styles={{ input: { padding: '2px 4px' } }}
          suffix="%"
          value={item.percentage ?? ''}
          w={65}
        />
      )}
      {item.prizeType === 'fixed_amount' && (
        <NumberInput
          hideControls
          min={0}
          onChange={(val) =>
            updatePrizeItem(
              sIdx,
              lIdx,
              iIdx,
              'fixedAmount',
              val === '' ? null : (val as number),
            )
          }
          size="xs"
          styles={{ input: { padding: '2px 4px' } }}
          thousandSeparator=","
          value={item.fixedAmount ?? ''}
          w={80}
        />
      )}
      {item.prizeType === 'custom_prize' && (
        <Group gap={2} wrap="wrap">
          <TextInput
            onChange={(e) =>
              updatePrizeItem(
                sIdx,
                lIdx,
                iIdx,
                'customPrizeLabel',
                e.target.value || null,
              )
            }
            placeholder="名称"
            size="xs"
            styles={{ input: { padding: '2px 4px' } }}
            value={item.customPrizeLabel ?? ''}
            w={100}
          />
          <NumberInput
            hideControls
            min={0}
            onChange={(val) =>
              updatePrizeItem(
                sIdx,
                lIdx,
                iIdx,
                'customPrizeValue',
                val === '' ? null : (val as number),
              )
            }
            placeholder="換算値"
            size="xs"
            styles={{ input: { padding: '2px 4px' } }}
            value={item.customPrizeValue ?? ''}
            w={60}
          />
        </Group>
      )}
      <ActionIcon
        color="red"
        onClick={() => removePrizeItem(sIdx, lIdx, iIdx)}
        size="xs"
        variant="subtle"
      >
        <IconTrash size={12} />
      </ActionIcon>
    </Group>
  )
}
