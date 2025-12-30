'use client'

import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  Modal,
  NumberInput,
  ScrollArea,
  Select,
  Stack,
  Table,
  Tabs,
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
import type {
  BlindLevel,
  Currency,
  PrizeItem,
  PrizeLevel,
  PrizeStructure,
  Tournament,
} from './types'

// Helper to handle NumberInput empty string -> null conversion
const optionalNumber = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.number().int().positive().nullable(),
)

const tournamentSchema = z.object({
  currencyId: z
    .string()
    .uuid('通貨を選択してください')
    .optional()
    .or(z.literal('')),
  name: z.string().max(255).optional(),
  buyIn: z
    .number()
    .int('バイインは整数で入力してください')
    .positive('バイインは正の数で入力してください'),
  rake: optionalNumber,
  startingStack: optionalNumber,
  notes: z.string().optional(),
})

export type TournamentFormValues = z.infer<typeof tournamentSchema>

interface TournamentModalProps {
  opened: boolean
  onClose: () => void
  currencies: Currency[]
  editingTournament: Tournament | null
  onSubmit: (
    values: TournamentFormValues,
    blindLevels: BlindLevel[],
    prizeStructures: PrizeStructure[],
  ) => void
  isLoading: boolean
  initialTab?: 'basic' | 'blind' | 'prize'
}

export function TournamentModal({
  opened,
  onClose,
  currencies,
  editingTournament,
  onSubmit,
  isLoading,
  initialTab = 'basic',
}: TournamentModalProps) {
  const [tournamentTab, setTournamentTab] = useState<string | null>(initialTab)
  const [blindLevels, setBlindLevels] = useState<BlindLevel[]>([])
  const [prizeStructures, setPrizeStructures] = useState<PrizeStructure[]>([])
  const [activePrizeTab, setActivePrizeTab] = useState<string | null>('0')

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      currencyId: '',
      name: '',
      buyIn: 0,
      rake: null as number | null,
      startingStack: null as number | null,
      notes: '',
    },
    validate: zodResolver(tournamentSchema),
  })

  // Reset form when modal opens or editing tournament changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: form methods are stable
  useEffect(() => {
    if (opened) {
      setTournamentTab(initialTab)
      if (editingTournament) {
        form.setValues({
          currencyId: editingTournament.currencyId ?? '',
          name: editingTournament.name ?? '',
          buyIn: editingTournament.buyIn,
          rake: editingTournament.rake,
          startingStack: editingTournament.startingStack,
          notes: editingTournament.notes ?? '',
        })
        setBlindLevels(
          editingTournament.blindLevels.map((bl) => ({
            level: bl.level,
            isBreak: bl.isBreak ?? false,
            smallBlind: bl.smallBlind,
            bigBlind: bl.bigBlind,
            ante: bl.ante ?? undefined,
            durationMinutes: bl.durationMinutes,
          })),
        )
        setPrizeStructures(
          editingTournament.prizeStructures.map((ps, sIdx) => ({
            minEntrants: ps.minEntrants,
            maxEntrants: ps.maxEntrants,
            sortOrder: ps.sortOrder ?? sIdx,
            prizeLevels: ps.prizeLevels.map((pl, lIdx) => ({
              minPosition: pl.minPosition,
              maxPosition: pl.maxPosition,
              sortOrder: pl.sortOrder ?? lIdx,
              prizeItems: pl.prizeItems.map((pi, iIdx) => ({
                prizeType: pi.prizeType as
                  | 'percentage'
                  | 'fixed_amount'
                  | 'custom_prize',
                percentage: pi.percentage ? Number(pi.percentage) : null,
                fixedAmount: pi.fixedAmount ?? null,
                customPrizeLabel: pi.customPrizeLabel ?? null,
                customPrizeValue: pi.customPrizeValue ?? null,
                sortOrder: pi.sortOrder ?? iIdx,
              })),
            })),
          })),
        )
      } else {
        form.reset()
        setBlindLevels([])
        setPrizeStructures([])
      }
      setActivePrizeTab('0')
    }
  }, [opened, editingTournament, initialTab])

  const handleClose = () => {
    form.reset()
    setBlindLevels([])
    setPrizeStructures([])
    onClose()
  }

  // Add blind level
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

  // Remove blind level
  const removeBlindLevel = (index: number) => {
    setBlindLevels(blindLevels.filter((_, i) => i !== index))
  }

  // Update blind level (auto-fill SB and Ante when BB is changed)
  const updateBlindLevel = (
    index: number,
    field: keyof BlindLevel,
    value: number | undefined,
  ) => {
    setBlindLevels((prev) =>
      prev.map((level, i) => {
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

  // Add prize structure
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
  }

  // Remove prize structure
  const removePrizeStructure = (sIdx: number) => {
    setPrizeStructures(prizeStructures.filter((_, i) => i !== sIdx))
  }

  // Update prize structure
  const updatePrizeStructure = (
    sIdx: number,
    field: 'minEntrants' | 'maxEntrants',
    value: number | null,
  ) => {
    setPrizeStructures((prev) =>
      prev.map((s, i) => (i === sIdx ? { ...s, [field]: value } : s)),
    )
  }

  // Add prize level to a structure
  const addPrizeLevel = (sIdx: number) => {
    setPrizeStructures((prev) =>
      prev.map((s, i) => {
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

  // Remove prize level
  const removePrizeLevel = (sIdx: number, lIdx: number) => {
    setPrizeStructures((prev) =>
      prev.map((s, i) =>
        i === sIdx
          ? { ...s, prizeLevels: s.prizeLevels.filter((_, j) => j !== lIdx) }
          : s,
      ),
    )
  }

  // Update prize level
  const updatePrizeLevel = (
    sIdx: number,
    lIdx: number,
    field: 'minPosition' | 'maxPosition',
    value: number,
  ) => {
    setPrizeStructures((prev) =>
      prev.map((s, i) =>
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

  // Add prize item
  const addPrizeItem = (
    sIdx: number,
    lIdx: number,
    prizeType: 'percentage' | 'fixed_amount' | 'custom_prize',
  ) => {
    setPrizeStructures((prev) =>
      prev.map((s, i) =>
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

  // Remove prize item
  const removePrizeItem = (sIdx: number, lIdx: number, iIdx: number) => {
    setPrizeStructures((prev) =>
      prev.map((s, i) =>
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

  // Update prize item
  const updatePrizeItem = (
    sIdx: number,
    lIdx: number,
    iIdx: number,
    field: keyof PrizeItem,
    value: number | string | null,
  ) => {
    setPrizeStructures((prev) =>
      prev.map((s, i) =>
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

  const handleSubmit = form.onSubmit((values) => {
    onSubmit(values, blindLevels, prizeStructures)
  })

  const currencyOptions = currencies.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  return (
    <Modal
      centered
      onClose={handleClose}
      opened={opened}
      size="xl"
      title={editingTournament ? 'トーナメントを編集' : 'トーナメントを追加'}
    >
      <form onSubmit={handleSubmit}>
        <Tabs onChange={setTournamentTab} value={tournamentTab}>
          <Tabs.List>
            <Tabs.Tab value="basic">基本情報</Tabs.Tab>
            <Tabs.Tab value="blind">ブラインド</Tabs.Tab>
            <Tabs.Tab value="prize">プライズ</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel pt="md" value="basic">
            <Stack>
              <TextInput
                label="トーナメント名"
                placeholder="例: Sunday Million"
                {...form.getInputProps('name')}
              />
              <Select
                clearable
                data={currencyOptions}
                label="通貨"
                placeholder="選択してください"
                {...form.getInputProps('currencyId')}
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
          </Tabs.Panel>

          <Tabs.Panel pt="md" value="blind">
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
                <ScrollArea h={350}>
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
                            <Table.Td
                              colSpan={4}
                              style={{ textAlign: 'center' }}
                            >
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
                                  updateBlindLevel(
                                    index,
                                    'level',
                                    val as number,
                                  )
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
                                  updateBlindLevel(
                                    index,
                                    'smallBlind',
                                    val as number,
                                  )
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
                                  updateBlindLevel(
                                    index,
                                    'bigBlind',
                                    val as number,
                                  )
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
          </Tabs.Panel>

          <Tabs.Panel pt="md" value="prize">
            <Stack gap="xs">
              <Group justify="flex-end">
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => {
                    addPrizeStructure()
                    setActivePrizeTab(String(prizeStructures.length))
                  }}
                  size="xs"
                  variant="light"
                >
                  エントリー範囲追加
                </Button>
              </Group>
              {prizeStructures.length === 0 ? (
                <Text c="dimmed" py="md" size="sm" ta="center">
                  プライズストラクチャーが設定されていません
                </Text>
              ) : (
                <Tabs onChange={setActivePrizeTab} value={activePrizeTab}>
                  <Tabs.List>
                    {prizeStructures.map((structure, sIdx) => (
                      <Tabs.Tab key={`tab-${sIdx}`} value={String(sIdx)}>
                        {structure.minEntrants}〜{structure.maxEntrants ?? '∞'}
                        人
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                  {prizeStructures.map((structure, sIdx) => (
                    <Tabs.Panel
                      key={`panel-${sIdx}`}
                      pt="xs"
                      value={String(sIdx)}
                    >
                      <PrizeStructurePanel
                        activePrizeTab={activePrizeTab}
                        addPrizeItem={addPrizeItem}
                        addPrizeLevel={addPrizeLevel}
                        prizeStructures={prizeStructures}
                        removePrizeItem={removePrizeItem}
                        removePrizeLevel={removePrizeLevel}
                        removePrizeStructure={removePrizeStructure}
                        setActivePrizeTab={setActivePrizeTab}
                        sIdx={sIdx}
                        structure={structure}
                        updatePrizeItem={updatePrizeItem}
                        updatePrizeLevel={updatePrizeLevel}
                        updatePrizeStructure={updatePrizeStructure}
                      />
                    </Tabs.Panel>
                  ))}
                </Tabs>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" mt="md">
          <Button onClick={handleClose} variant="subtle">
            キャンセル
          </Button>
          <Button loading={isLoading} type="submit">
            {editingTournament ? '更新' : '追加'}
          </Button>
        </Group>
      </form>
    </Modal>
  )
}

// Prize Structure Panel Component
interface PrizeStructurePanelProps {
  structure: PrizeStructure
  sIdx: number
  prizeStructures: PrizeStructure[]
  activePrizeTab: string | null
  setActivePrizeTab: (tab: string | null) => void
  updatePrizeStructure: (
    sIdx: number,
    field: 'minEntrants' | 'maxEntrants',
    value: number | null,
  ) => void
  removePrizeStructure: (sIdx: number) => void
  addPrizeLevel: (sIdx: number) => void
  removePrizeLevel: (sIdx: number, lIdx: number) => void
  updatePrizeLevel: (
    sIdx: number,
    lIdx: number,
    field: 'minPosition' | 'maxPosition',
    value: number,
  ) => void
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

function PrizeStructurePanel({
  structure,
  sIdx,
  prizeStructures,
  activePrizeTab,
  setActivePrizeTab,
  updatePrizeStructure,
  removePrizeStructure,
  addPrizeLevel,
  removePrizeLevel,
  updatePrizeLevel,
  addPrizeItem,
  removePrizeItem,
  updatePrizeItem,
}: PrizeStructurePanelProps) {
  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Text size="xs">エントリー:</Text>
        <NumberInput
          hideControls
          min={1}
          onChange={(val) =>
            updatePrizeStructure(sIdx, 'minEntrants', val as number)
          }
          size="xs"
          styles={{ input: { padding: '2px 6px' } }}
          value={structure.minEntrants}
          w={55}
        />
        <Text size="xs">〜</Text>
        <NumberInput
          hideControls
          min={1}
          onChange={(val) =>
            updatePrizeStructure(
              sIdx,
              'maxEntrants',
              val === '' ? null : (val as number),
            )
          }
          placeholder="∞"
          size="xs"
          styles={{ input: { padding: '2px 6px' } }}
          value={structure.maxEntrants ?? ''}
          w={55}
        />
        <Text size="xs">人</Text>
        <ActionIcon
          color="red"
          onClick={() => {
            removePrizeStructure(sIdx)
            if (Number(activePrizeTab) >= prizeStructures.length - 1) {
              setActivePrizeTab(
                String(Math.max(0, prizeStructures.length - 2)),
              )
            }
          }}
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
          onClick={() => addPrizeLevel(sIdx)}
          size="xs"
          variant="subtle"
        >
          順位追加
        </Button>
      </Group>
      <ScrollArea h={280}>
        <Table horizontalSpacing={4} verticalSpacing={4} withRowBorders={false}>
          <Table.Tbody>
            {structure.prizeLevels.map((level, lIdx) => (
              <PrizeLevelRow
                addPrizeItem={addPrizeItem}
                key={`level-${sIdx}-${lIdx}`}
                level={level}
                lIdx={lIdx}
                removePrizeItem={removePrizeItem}
                removePrizeLevel={removePrizeLevel}
                sIdx={sIdx}
                updatePrizeItem={updatePrizeItem}
                updatePrizeLevel={updatePrizeLevel}
              />
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
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
            styles={{
              input: {
                padding: '2px 4px',
                textAlign: 'center',
              },
            }}
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
            styles={{
              input: {
                padding: '2px 4px',
                textAlign: 'center',
              },
            }}
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
              key={`item-${sIdx}-${lIdx}-${iIdx}`}
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
      <Table.Td
        style={{
          verticalAlign: 'middle',
          paddingLeft: 12,
        }}
        w={50}
      >
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
      <Box
        c={
          item.prizeType === 'percentage'
            ? 'blue'
            : item.prizeType === 'fixed_amount'
              ? 'green'
              : 'grape'
        }
        style={{ display: 'flex' }}
      >
        {item.prizeType === 'percentage' ? (
          <IconPercentage size={14} />
        ) : item.prizeType === 'fixed_amount' ? (
          <IconCoins size={14} />
        ) : (
          <IconGift size={14} />
        )}
      </Box>
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
          styles={{
            input: { padding: '2px 4px' },
          }}
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
          styles={{
            input: { padding: '2px 4px' },
          }}
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
            styles={{
              input: {
                padding: '2px 4px',
              },
            }}
            value={item.customPrizeLabel ?? ''}
            w={120}
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
            styles={{
              input: {
                padding: '2px 4px',
              },
            }}
            value={item.customPrizeValue ?? ''}
            w={70}
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
