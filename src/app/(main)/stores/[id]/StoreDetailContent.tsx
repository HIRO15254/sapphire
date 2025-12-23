'use client'

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Container,
  Divider,
  Group,
  Modal,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconArchive,
  IconArchiveOff,
  IconArrowLeft,
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconList,
  IconPlus,
  IconPokerChip,
  IconTrash,
  IconTrophy,
} from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment, useState, useTransition } from 'react'
import { z } from 'zod'

import { GoogleMapsLink } from '~/components/ui/GoogleMapsLink'
import { RichTextContent } from '~/components/ui/RichTextContext'
import { RichTextEditor } from '~/components/ui/RichTextEditor'
import type { RouterOutputs } from '~/trpc/react'
import {
  archiveCashGame,
  archiveStore,
  archiveTournament,
  createCashGame,
  createTournament,
  deleteCashGame,
  deleteStore,
  deleteTournament,
  setTournamentBlindLevels,
  setTournamentPrizeLevels,
  unarchiveStore,
  updateCashGame,
  updateStore,
  updateTournament,
} from '../actions'

type Store = RouterOutputs['store']['getById']
type Currency = RouterOutputs['currency']['list']['currencies'][number]
type CashGame = Store['cashGames'][number]
type Tournament = Store['tournaments'][number]

// Schemas for forms
const updateStoreSchema = z.object({
  name: z
    .string()
    .min(1, '店舗名を入力してください')
    .max(255, '店舗名は255文字以下で入力してください'),
  address: z
    .string()
    .max(500, '住所は500文字以下で入力してください')
    .optional(),
  customMapUrl: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
})

// Helper to handle NumberInput empty string -> null conversion
const optionalNumber = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.number().int().positive().nullable(),
)

const cashGameSchema = z.object({
  currencyId: z
    .string()
    .uuid('通貨を選択してください')
    .optional()
    .or(z.literal('')),
  smallBlind: z
    .number()
    .int('SBは整数で入力してください')
    .positive('SBは正の数で入力してください'),
  bigBlind: z
    .number()
    .int('BBは整数で入力してください')
    .positive('BBは正の数で入力してください'),
  straddle1: optionalNumber,
  straddle2: optionalNumber,
  ante: optionalNumber,
  anteType: z
    .enum(['bb_ante', 'all_ante'])
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: z.string().optional(),
})

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

interface StoreDetailContentProps {
  initialStore: Store
  currencies: Currency[]
}

/**
 * Generate display name for cash game (e.g., "100/200" or "100/200/400/800")
 */
function generateCashGameDisplayName(game: {
  smallBlind: number
  bigBlind: number
  straddle1?: number | null
  straddle2?: number | null
  ante?: number | null
  anteType?: string | null
}): string {
  const parts = [game.smallBlind.toString(), game.bigBlind.toString()]

  if (game.straddle1) {
    parts.push(game.straddle1.toString())
  }
  if (game.straddle2) {
    parts.push(game.straddle2.toString())
  }

  let displayName = parts.join('/')

  if (game.ante && game.anteType) {
    const anteTypeLabel = game.anteType === 'bb_ante' ? 'BB' : 'All'
    displayName += ` (Ante: ${game.ante} ${anteTypeLabel})`
  }

  return displayName
}

/**
 * Store detail content client component.
 *
 * Shows store details with game lists and forms.
 */
export function StoreDetailContent({
  initialStore,
  currencies,
}: StoreDetailContentProps) {
  const router = useRouter()
  const storeId = initialStore.id
  const store = initialStore

  // State for showing archived games
  const [showArchivedCashGames, setShowArchivedCashGames] = useState(false)
  const [showArchivedTournaments, setShowArchivedTournaments] = useState(false)

  // State for expanded notes
  const [expandedCashGameId, setExpandedCashGameId] = useState<string | null>(
    null,
  )
  const [expandedTournamentId, setExpandedTournamentId] = useState<
    string | null
  >(null)

  // State for advanced settings in modals
  const [showCashGameAdvanced, setShowCashGameAdvanced] = useState(false)

  // State for editing games
  const [editingCashGame, setEditingCashGame] = useState<CashGame | null>(null)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null,
  )
  const [editingStructureTournament, setEditingStructureTournament] =
    useState<Tournament | null>(null)
  const [blindLevels, setBlindLevels] = useState<
    Array<{
      level: number
      smallBlind: number
      bigBlind: number
      ante?: number
      durationMinutes: number
    }>
  >([])
  const [prizeLevels, setPrizeLevels] = useState<
    Array<{
      position: number
      percentage?: number
      fixedAmount?: number
    }>
  >([])
  const [activeStructureTab, setActiveStructureTab] = useState<string | null>(
    'blinds',
  )

  // Modal states
  const [editMode, { toggle: toggleEditMode, close: closeEditMode }] =
    useDisclosure(false)
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false)
  const [
    cashGameModalOpened,
    { open: openCashGameModal, close: closeCashGameModal },
  ] = useDisclosure(false)
  const [
    tournamentModalOpened,
    { open: openTournamentModal, close: closeTournamentModal },
  ] = useDisclosure(false)
  const [
    structureModalOpened,
    { open: openStructureModal, close: closeStructureModal },
  ] = useDisclosure(false)

  // Transition states for Server Actions
  const [isUpdating, startUpdateTransition] = useTransition()
  const [isArchiving, startArchiveTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isSavingCashGame, startSaveCashGameTransition] = useTransition()
  const [isSavingTournament, startSaveTournamentTransition] = useTransition()
  const [isSavingStructure, startSaveStructureTransition] = useTransition()

  // Forms
  const editForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: store.name,
      address: store.address ?? '',
      customMapUrl: store.customMapUrl ?? '',
      notes: store.notes ?? '',
    },
    validate: zodResolver(updateStoreSchema),
  })

  const cashGameForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      currencyId: '',
      smallBlind: 0,
      bigBlind: 0,
      straddle1: null as number | null,
      straddle2: null as number | null,
      ante: null as number | null,
      anteType: '' as string,
      notes: '',
    },
    validate: zodResolver(cashGameSchema),
  })

  const tournamentForm = useForm({
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

  // Open cash game modal for create or edit
  const openCashGameForCreate = () => {
    setEditingCashGame(null)
    cashGameForm.reset()
    setShowCashGameAdvanced(false)
    openCashGameModal()
  }

  const openCashGameForEdit = (game: CashGame) => {
    setEditingCashGame(game)
    // Auto-expand if straddle or ante exists
    setShowCashGameAdvanced(
      !!(game.straddle1 || game.straddle2 || game.ante),
    )
    cashGameForm.setValues({
      currencyId: game.currencyId ?? '',
      smallBlind: game.smallBlind,
      bigBlind: game.bigBlind,
      straddle1: game.straddle1,
      straddle2: game.straddle2,
      ante: game.ante,
      anteType: game.anteType ?? '',
      notes: game.notes ?? '',
    })
    openCashGameModal()
  }

  // Open tournament modal for create or edit
  const openTournamentForCreate = () => {
    setEditingTournament(null)
    tournamentForm.reset()
    openTournamentModal()
  }

  const openTournamentForEdit = (tournament: Tournament) => {
    setEditingTournament(tournament)
    tournamentForm.setValues({
      currencyId: tournament.currencyId ?? '',
      name: tournament.name ?? '',
      buyIn: tournament.buyIn,
      rake: tournament.rake,
      startingStack: tournament.startingStack,
      notes: tournament.notes ?? '',
    })
    openTournamentModal()
  }

  // Open structure modal for editing blind/prize levels
  const openStructureForEdit = (tournament: Tournament) => {
    setEditingStructureTournament(tournament)
    setBlindLevels(
      tournament.blindLevels.map((bl) => ({
        level: bl.level,
        smallBlind: bl.smallBlind,
        bigBlind: bl.bigBlind,
        ante: bl.ante ?? undefined,
        durationMinutes: bl.durationMinutes,
      })),
    )
    setPrizeLevels(
      tournament.prizeLevels.map((pl) => ({
        position: pl.position,
        percentage: pl.percentage ? Number(pl.percentage) : undefined,
        fixedAmount: pl.fixedAmount ?? undefined,
      })),
    )
    setActiveStructureTab('blinds')
    openStructureModal()
  }

  // Add blind level
  const addBlindLevel = () => {
    const nextLevel =
      blindLevels.length > 0
        ? Math.max(...blindLevels.map((l) => l.level)) + 1
        : 1
    const prevLevel = blindLevels[blindLevels.length - 1]
    setBlindLevels([
      ...blindLevels,
      {
        level: nextLevel,
        smallBlind: prevLevel ? prevLevel.smallBlind * 2 : 100,
        bigBlind: prevLevel ? prevLevel.bigBlind * 2 : 200,
        ante: prevLevel?.ante ? prevLevel.ante * 2 : undefined,
        durationMinutes: prevLevel?.durationMinutes ?? 20,
      },
    ])
  }

  // Remove blind level
  const removeBlindLevel = (index: number) => {
    setBlindLevels(blindLevels.filter((_, i) => i !== index))
  }

  // Update blind level
  const updateBlindLevel = (
    index: number,
    field: keyof (typeof blindLevels)[number],
    value: number | undefined,
  ) => {
    setBlindLevels((prev) =>
      prev.map((level, i) =>
        i === index ? { ...level, [field]: value } : level,
      ),
    )
  }

  // Add prize level
  const addPrizeLevel = () => {
    const nextPosition =
      prizeLevels.length > 0
        ? Math.max(...prizeLevels.map((l) => l.position)) + 1
        : 1
    setPrizeLevels([
      ...prizeLevels,
      {
        position: nextPosition,
        percentage: undefined,
        fixedAmount: undefined,
      },
    ])
  }

  // Remove prize level
  const removePrizeLevel = (index: number) => {
    setPrizeLevels(prizeLevels.filter((_, i) => i !== index))
  }

  // Update prize level
  const updatePrizeLevel = (
    index: number,
    field: keyof (typeof prizeLevels)[number],
    value: number | undefined,
  ) => {
    setPrizeLevels((prev) =>
      prev.map((level, i) =>
        i === index ? { ...level, [field]: value } : level,
      ),
    )
  }

  // Event handlers
  const handleEditSubmit = editForm.onSubmit((values) => {
    startUpdateTransition(async () => {
      const result = await updateStore({
        id: storeId,
        name: values.name,
        address: values.address || undefined,
        customMapUrl: values.customMapUrl || undefined,
        notes: values.notes || undefined,
      })

      if (result.success) {
        notifications.show({
          title: '更新完了',
          message: '店舗を更新しました',
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

  const handleArchiveToggle = () => {
    startArchiveTransition(async () => {
      const result = store.isArchived
        ? await unarchiveStore({ id: storeId })
        : await archiveStore({ id: storeId })

      if (result.success) {
        notifications.show({
          title: store.isArchived ? 'アーカイブ解除完了' : 'アーカイブ完了',
          message: store.isArchived
            ? '店舗のアーカイブを解除しました'
            : '店舗をアーカイブしました',
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

  const handleDelete = () => {
    closeDeleteModal()
    startDeleteTransition(async () => {
      const result = await deleteStore({ id: storeId })

      if (result.success) {
        notifications.show({
          title: '削除完了',
          message: '店舗を削除しました',
          color: 'green',
        })
        router.push('/stores')
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  }

  const handleCashGameSubmit = cashGameForm.onSubmit((values) => {
    startSaveCashGameTransition(async () => {
      // Convert empty/falsy values to null for optional number fields
      const straddle1 =
        values.straddle1 && typeof values.straddle1 === 'number'
          ? values.straddle1
          : null
      const straddle2 =
        values.straddle2 && typeof values.straddle2 === 'number'
          ? values.straddle2
          : null
      const ante =
        values.ante && typeof values.ante === 'number' ? values.ante : null
      const anteType = ante && values.anteType ? values.anteType : null

      if (editingCashGame) {
        // Update existing
        const result = await updateCashGame({
          id: editingCashGame.id,
          currencyId: values.currencyId || null,
          smallBlind: values.smallBlind,
          bigBlind: values.bigBlind,
          straddle1,
          straddle2,
          ante,
          anteType: anteType as 'bb_ante' | 'all_ante' | null,
          notes: values.notes || null,
        })

        if (result.success) {
          notifications.show({
            title: '更新完了',
            message: 'キャッシュゲームを更新しました',
            color: 'green',
          })
          closeCashGameModal()
          cashGameForm.reset()
          setEditingCashGame(null)
          router.refresh()
        } else {
          notifications.show({
            title: 'エラー',
            message: result.error,
            color: 'red',
          })
        }
      } else {
        // Create new
        const result = await createCashGame({
          storeId,
          currencyId: values.currencyId || undefined,
          smallBlind: values.smallBlind,
          bigBlind: values.bigBlind,
          straddle1: straddle1 ?? undefined,
          straddle2: straddle2 ?? undefined,
          ante: ante ?? undefined,
          anteType: (anteType as 'bb_ante' | 'all_ante') ?? undefined,
          notes: values.notes || undefined,
        })

        if (result.success) {
          notifications.show({
            title: '作成完了',
            message: 'キャッシュゲームを追加しました',
            color: 'green',
          })
          closeCashGameModal()
          cashGameForm.reset()
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
  })

  const handleTournamentSubmit = tournamentForm.onSubmit((values) => {
    startSaveTournamentTransition(async () => {
      if (editingTournament) {
        // Update existing
        const result = await updateTournament({
          id: editingTournament.id,
          currencyId: values.currencyId || undefined,
          name: values.name || undefined,
          buyIn: values.buyIn,
          rake: values.rake ?? undefined,
          startingStack: values.startingStack ?? undefined,
          notes: values.notes || undefined,
        })

        if (result.success) {
          notifications.show({
            title: '更新完了',
            message: 'トーナメントを更新しました',
            color: 'green',
          })
          closeTournamentModal()
          tournamentForm.reset()
          setEditingTournament(null)
          router.refresh()
        } else {
          notifications.show({
            title: 'エラー',
            message: result.error,
            color: 'red',
          })
        }
      } else {
        // Create new
        const result = await createTournament({
          storeId,
          currencyId: values.currencyId || undefined,
          name: values.name || undefined,
          buyIn: values.buyIn,
          rake: values.rake ?? undefined,
          startingStack: values.startingStack ?? undefined,
          notes: values.notes || undefined,
        })

        if (result.success) {
          notifications.show({
            title: '作成完了',
            message: 'トーナメントを追加しました',
            color: 'green',
          })
          closeTournamentModal()
          tournamentForm.reset()
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
  })

  const handleCashGameArchiveToggle = (
    cashGameId: string,
    isArchived: boolean,
  ) => {
    startArchiveTransition(async () => {
      const result = await archiveCashGame({
        id: cashGameId,
        isArchived: !isArchived,
      })

      if (result.success) {
        notifications.show({
          title: isArchived ? 'アーカイブ解除完了' : 'アーカイブ完了',
          message: isArchived
            ? 'キャッシュゲームのアーカイブを解除しました'
            : 'キャッシュゲームをアーカイブしました',
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

  const handleCashGameDelete = (cashGameId: string) => {
    startDeleteTransition(async () => {
      const result = await deleteCashGame({ id: cashGameId })

      if (result.success) {
        notifications.show({
          title: '削除完了',
          message: 'キャッシュゲームを削除しました',
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

  const handleTournamentArchiveToggle = (
    tournamentId: string,
    isArchived: boolean,
  ) => {
    startArchiveTransition(async () => {
      const result = await archiveTournament({
        id: tournamentId,
        isArchived: !isArchived,
      })

      if (result.success) {
        notifications.show({
          title: isArchived ? 'アーカイブ解除完了' : 'アーカイブ完了',
          message: isArchived
            ? 'トーナメントのアーカイブを解除しました'
            : 'トーナメントをアーカイブしました',
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

  const handleTournamentDelete = (tournamentId: string) => {
    startDeleteTransition(async () => {
      const result = await deleteTournament({ id: tournamentId })

      if (result.success) {
        notifications.show({
          title: '削除完了',
          message: 'トーナメントを削除しました',
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

  // Save tournament structure (blind levels and prize levels)
  const handleSaveStructure = () => {
    if (!editingStructureTournament) return

    startSaveStructureTransition(async () => {
      // Save blind levels
      const blindResult = await setTournamentBlindLevels({
        tournamentId: editingStructureTournament.id,
        levels: blindLevels.map((bl) => ({
          level: bl.level,
          smallBlind: bl.smallBlind,
          bigBlind: bl.bigBlind,
          ante: bl.ante,
          durationMinutes: bl.durationMinutes,
        })),
      })

      if (!blindResult.success) {
        notifications.show({
          title: 'エラー',
          message: blindResult.error,
          color: 'red',
        })
        return
      }

      // Save prize levels
      const prizeResult = await setTournamentPrizeLevels({
        tournamentId: editingStructureTournament.id,
        levels: prizeLevels.map((pl) => ({
          position: pl.position,
          percentage: pl.percentage,
          fixedAmount: pl.fixedAmount,
        })),
      })

      if (!prizeResult.success) {
        notifications.show({
          title: 'エラー',
          message: prizeResult.error,
          color: 'red',
        })
        return
      }

      notifications.show({
        title: '保存完了',
        message: 'トーナメントストラクチャーを保存しました',
        color: 'green',
      })
      closeStructureModal()
      setEditingStructureTournament(null)
      router.refresh()
    })
  }

  // Currency options for selects
  const currencyOptions = currencies.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <Button
          component={Link}
          href="/stores"
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          w="fit-content"
        >
          店舗一覧に戻る
        </Button>

        {/* Header */}
        <Group justify="space-between">
          <Group gap="sm">
            <Title order={1}>{store.name}</Title>
            {store.isArchived && (
              <Badge color="gray" size="lg">
                アーカイブ済み
              </Badge>
            )}
          </Group>
          <Group>
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={toggleEditMode}
              variant="outline"
            >
              編集
            </Button>
            <Button
              color={store.isArchived ? 'teal' : 'gray'}
              leftSection={
                store.isArchived ? (
                  <IconArchiveOff size={16} />
                ) : (
                  <IconArchive size={16} />
                )
              }
              loading={isArchiving}
              onClick={handleArchiveToggle}
              variant="outline"
            >
              {store.isArchived ? 'アーカイブ解除' : 'アーカイブ'}
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={openDeleteModal}
              variant="outline"
            >
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
                  label="店舗名"
                  withAsterisk
                  {...editForm.getInputProps('name')}
                />
                <TextInput
                  label="住所"
                  {...editForm.getInputProps('address')}
                />
                <TextInput
                  label="Google Maps URL"
                  placeholder="https://maps.google.com/..."
                  {...editForm.getInputProps('customMapUrl')}
                />
                <Stack gap="xs">
                  <Text fw={500} size="sm">
                    メモ
                  </Text>
                  <RichTextEditor
                    content={editForm.getValues().notes ?? ''}
                    onChange={(value) => editForm.setFieldValue('notes', value)}
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

        {/* Store Info */}
        <Card p="lg" radius="md" shadow="sm" withBorder>
          <Stack gap="md">
            {store.address && (
              <Group justify="space-between">
                <Text c="dimmed">住所</Text>
                <Text>{store.address}</Text>
              </Group>
            )}
            {store.googleMapsUrl && (
              <Group justify="space-between">
                <Text c="dimmed">地図</Text>
                <GoogleMapsLink url={store.googleMapsUrl} />
              </Group>
            )}
            {store.notes && (
              <>
                <Divider />
                <Stack gap="xs">
                  <Text c="dimmed" size="sm">
                    メモ
                  </Text>
                  <RichTextContent content={store.notes} />
                </Stack>
              </>
            )}
          </Stack>
        </Card>

        {/* Cash Games Section */}
        <Card p="lg" radius="md" shadow="sm" withBorder>
          <Group justify="space-between" mb="md">
            <Group gap="sm">
              <IconPokerChip size={20} />
              <Title order={3}>キャッシュゲーム</Title>
            </Group>
            <Group gap="md">
              {store.cashGames.some((g) => g.isArchived) && (
                <Switch
                  checked={showArchivedCashGames}
                  label="アーカイブ表示"
                  onChange={(e) =>
                    setShowArchivedCashGames(e.currentTarget.checked)
                  }
                  size="xs"
                />
              )}
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openCashGameForCreate}
                size="sm"
                variant="light"
              >
                追加
              </Button>
            </Group>
          </Group>
          <Divider mb="md" />
          {(() => {
            const filteredGames = store.cashGames.filter(
              (g) => showArchivedCashGames || !g.isArchived,
            )
            if (filteredGames.length === 0) {
              return (
                <Text c="dimmed">キャッシュゲームが登録されていません</Text>
              )
            }
            return (
              <Stack gap={0}>
                <Table withRowBorders={false}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={30}></Table.Th>
                      <Table.Th>ブラインド</Table.Th>
                      <Table.Th w={60}>通貨</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>操作</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredGames.map((game) => (
                      <Fragment key={game.id}>
                        <Table.Tr>
                          <Table.Td>
                            {game.notes && (
                              <ActionIcon
                                onClick={() =>
                                  setExpandedCashGameId(
                                    expandedCashGameId === game.id
                                      ? null
                                      : game.id,
                                  )
                                }
                                size="sm"
                                variant="subtle"
                              >
                                {expandedCashGameId === game.id ? (
                                  <IconChevronUp size={14} />
                                ) : (
                                  <IconChevronDown size={14} />
                                )}
                              </ActionIcon>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Text fw={500}>
                                {generateCashGameDisplayName(game)}
                              </Text>
                              {game.isArchived && (
                                <Badge color="gray" size="xs">
                                  アーカイブ
                                </Badge>
                              )}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            {game.currency?.name ? (
                              <Tooltip label={game.currency.name}>
                                <Badge size="sm" variant="light">
                                  {game.currency.name.slice(0, 3)}
                                </Badge>
                              </Tooltip>
                            ) : (
                              '-'
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="flex-end">
                              <ActionIcon
                                onClick={() => openCashGameForEdit(game)}
                                title="編集"
                                variant="subtle"
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                color={game.isArchived ? 'teal' : 'gray'}
                                onClick={() =>
                                  handleCashGameArchiveToggle(
                                    game.id,
                                    game.isArchived,
                                  )
                                }
                                title={game.isArchived ? '復元' : 'アーカイブ'}
                                variant="subtle"
                              >
                                {game.isArchived ? (
                                  <IconArchiveOff size={16} />
                                ) : (
                                  <IconArchive size={16} />
                                )}
                              </ActionIcon>
                              <ActionIcon
                                color="red"
                                onClick={() => handleCashGameDelete(game.id)}
                                title="削除"
                                variant="subtle"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                        {game.notes && (
                          <Table.Tr>
                            <Table.Td colSpan={4} p={0}>
                              <Collapse in={expandedCashGameId === game.id}>
                                <Box m="sm">
                                  <RichTextContent content={game.notes} />
                                </Box>
                              </Collapse>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Fragment>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            )
          })()}
        </Card>

        {/* Tournaments Section */}
        <Card p="lg" radius="md" shadow="sm" withBorder>
          <Group justify="space-between" mb="md">
            <Group gap="sm">
              <IconTrophy size={20} />
              <Title order={3}>トーナメント</Title>
            </Group>
            <Group gap="md">
              {store.tournaments.some((t) => t.isArchived) && (
                <Switch
                  checked={showArchivedTournaments}
                  label="アーカイブ表示"
                  onChange={(e) =>
                    setShowArchivedTournaments(e.currentTarget.checked)
                  }
                  size="xs"
                />
              )}
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openTournamentForCreate}
                size="sm"
                variant="light"
              >
                追加
              </Button>
            </Group>
          </Group>
          <Divider mb="md" />
          {(() => {
            const filteredTournaments = store.tournaments.filter(
              (t) => showArchivedTournaments || !t.isArchived,
            )
            if (filteredTournaments.length === 0) {
              return <Text c="dimmed">トーナメントが登録されていません</Text>
            }
            return (
              <Stack gap={0}>
                <Table withRowBorders={false}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={30}></Table.Th>
                      <Table.Th>名前</Table.Th>
                      <Table.Th>バイイン</Table.Th>
                      <Table.Th w={60}>通貨</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>操作</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredTournaments.map((tournament) => (
                      <Fragment key={tournament.id}>
                        <Table.Tr>
                          <Table.Td>
                            {tournament.notes && (
                              <ActionIcon
                                onClick={() =>
                                  setExpandedTournamentId(
                                    expandedTournamentId === tournament.id
                                      ? null
                                      : tournament.id,
                                  )
                                }
                                size="sm"
                                variant="subtle"
                              >
                                {expandedTournamentId === tournament.id ? (
                                  <IconChevronUp size={14} />
                                ) : (
                                  <IconChevronDown size={14} />
                                )}
                              </ActionIcon>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Text fw={500}>
                                {tournament.name ??
                                  tournament.buyIn.toLocaleString()}
                              </Text>
                              {tournament.isArchived && (
                                <Badge color="gray" size="xs">
                                  アーカイブ
                                </Badge>
                              )}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            {tournament.rake
                              ? `${tournament.buyIn.toLocaleString()} (${tournament.rake.toLocaleString()})`
                              : tournament.buyIn.toLocaleString()}
                          </Table.Td>
                          <Table.Td>
                            {tournament.currency?.name ? (
                              <Tooltip label={tournament.currency.name}>
                                <Badge size="sm" variant="light">
                                  {tournament.currency.name.slice(0, 3)}
                                </Badge>
                              </Tooltip>
                            ) : (
                              '-'
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="flex-end">
                              <ActionIcon
                                onClick={() =>
                                  openTournamentForEdit(tournament)
                                }
                                title="編集"
                                variant="subtle"
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                onClick={() => openStructureForEdit(tournament)}
                                title="ストラクチャー"
                                variant="subtle"
                              >
                                <IconList size={16} />
                              </ActionIcon>
                              <ActionIcon
                                color={tournament.isArchived ? 'teal' : 'gray'}
                                onClick={() =>
                                  handleTournamentArchiveToggle(
                                    tournament.id,
                                    tournament.isArchived,
                                  )
                                }
                                title={
                                  tournament.isArchived ? '復元' : 'アーカイブ'
                                }
                                variant="subtle"
                              >
                                {tournament.isArchived ? (
                                  <IconArchiveOff size={16} />
                                ) : (
                                  <IconArchive size={16} />
                                )}
                              </ActionIcon>
                              <ActionIcon
                                color="red"
                                onClick={() =>
                                  handleTournamentDelete(tournament.id)
                                }
                                title="削除"
                                variant="subtle"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                        {tournament.notes && (
                          <Table.Tr>
                            <Table.Td colSpan={5} p={0}>
                              <Collapse
                                in={expandedTournamentId === tournament.id}
                              >
                                <Paper bg="gray.0" p="sm">
                                  <RichTextContent content={tournament.notes} />
                                </Paper>
                              </Collapse>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Fragment>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            )
          })()}
        </Card>
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal
        centered
        onClose={closeDeleteModal}
        opened={deleteModalOpened}
        title="店舗の削除"
      >
        <Stack>
          <Text>
            「{store.name}」を削除しますか？この操作は取り消せません。
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

      {/* Cash Game Modal (Create/Edit) */}
      <Modal
        centered
        onClose={() => {
          closeCashGameModal()
          setEditingCashGame(null)
          cashGameForm.reset()
        }}
        opened={cashGameModalOpened}
        size="lg"
        title={
          editingCashGame ? 'キャッシュゲームを編集' : 'キャッシュゲームを追加'
        }
      >
        <form onSubmit={handleCashGameSubmit}>
          <Stack>
            <Select
              clearable
              data={currencyOptions}
              label="通貨"
              placeholder="選択してください"
              {...cashGameForm.getInputProps('currencyId')}
            />
            <Group grow>
              <NumberInput
                label="SB"
                min={1}
                placeholder="100"
                thousandSeparator=","
                withAsterisk
                {...cashGameForm.getInputProps('smallBlind')}
              />
              <NumberInput
                label="BB"
                min={1}
                placeholder="200"
                thousandSeparator=","
                withAsterisk
                {...cashGameForm.getInputProps('bigBlind')}
              />
            </Group>
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={() => setShowCashGameAdvanced(!showCashGameAdvanced)}
              leftSection={
                showCashGameAdvanced ? (
                  <IconChevronUp size={14} />
                ) : (
                  <IconChevronDown size={14} />
                )
              }
            >
              追加設定
            </Button>
            <Collapse in={showCashGameAdvanced}>
              <Stack gap="md">
                <Group grow>
                  <NumberInput
                    label="ストラドル1"
                    min={1}
                    placeholder="400"
                    thousandSeparator=","
                    {...cashGameForm.getInputProps('straddle1')}
                  />
                  <NumberInput
                    label="ストラドル2"
                    min={1}
                    placeholder="800"
                    thousandSeparator=","
                    {...cashGameForm.getInputProps('straddle2')}
                  />
                </Group>
                <Group grow>
                  <NumberInput
                    label="アンティ"
                    min={1}
                    placeholder="200"
                    thousandSeparator=","
                    {...cashGameForm.getInputProps('ante')}
                  />
                  <Select
                    clearable
                    data={[
                      { value: 'bb_ante', label: 'BBアンティ' },
                      { value: 'all_ante', label: '全員アンティ' },
                    ]}
                    description="アンティがある場合のみ選択"
                    label="アンティタイプ"
                    placeholder="選択してください"
                    {...cashGameForm.getInputProps('anteType')}
                  />
                </Group>
              </Stack>
            </Collapse>
            <Stack gap="xs">
              <Text fw={500} size="sm">
                メモ
              </Text>
              <RichTextEditor
                content={cashGameForm.getValues().notes ?? ''}
                onChange={(value) => cashGameForm.setFieldValue('notes', value)}
              />
            </Stack>
            <Group justify="flex-end">
              <Button
                onClick={() => {
                  closeCashGameModal()
                  setEditingCashGame(null)
                  cashGameForm.reset()
                }}
                variant="subtle"
              >
                キャンセル
              </Button>
              <Button loading={isSavingCashGame} type="submit">
                {editingCashGame ? '更新' : '追加'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Tournament Modal (Create/Edit) */}
      <Modal
        centered
        onClose={() => {
          closeTournamentModal()
          setEditingTournament(null)
          tournamentForm.reset()
        }}
        opened={tournamentModalOpened}
        size="lg"
        title={editingTournament ? 'トーナメントを編集' : 'トーナメントを追加'}
      >
        <form onSubmit={handleTournamentSubmit}>
          <Stack>
            <TextInput
              label="トーナメント名"
              placeholder="例: Sunday Million"
              {...tournamentForm.getInputProps('name')}
            />
            <Select
              clearable
              data={currencyOptions}
              label="通貨"
              placeholder="選択してください"
              {...tournamentForm.getInputProps('currencyId')}
            />
            <Group grow>
              <NumberInput
                label="バイイン"
                min={1}
                placeholder="10000"
                thousandSeparator=","
                withAsterisk
                {...tournamentForm.getInputProps('buyIn')}
              />
              <NumberInput
                description="バイイン内のレーキ額"
                label="レーキ"
                min={0}
                placeholder="1000"
                thousandSeparator=","
                {...tournamentForm.getInputProps('rake')}
              />
            </Group>
            <NumberInput
              label="スターティングスタック"
              min={1}
              placeholder="30000"
              thousandSeparator=","
              {...tournamentForm.getInputProps('startingStack')}
            />
            <Stack gap="xs">
              <Text fw={500} size="sm">
                メモ
              </Text>
              <RichTextEditor
                content={tournamentForm.getValues().notes ?? ''}
                onChange={(value) =>
                  tournamentForm.setFieldValue('notes', value)
                }
              />
            </Stack>
            <Group justify="flex-end">
              <Button
                onClick={() => {
                  closeTournamentModal()
                  setEditingTournament(null)
                  tournamentForm.reset()
                }}
                variant="subtle"
              >
                キャンセル
              </Button>
              <Button loading={isSavingTournament} type="submit">
                {editingTournament ? '更新' : '追加'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Tournament Structure Modal */}
      <Modal
        centered
        onClose={() => {
          closeStructureModal()
          setEditingStructureTournament(null)
          setBlindLevels([])
          setPrizeLevels([])
        }}
        opened={structureModalOpened}
        size="xl"
        title={`ストラクチャー: ${editingStructureTournament?.name ?? 'トーナメント'}`}
      >
        <Stack>
          <Tabs onChange={setActiveStructureTab} value={activeStructureTab}>
            <Tabs.List>
              <Tabs.Tab value="blinds">ブラインドレベル</Tabs.Tab>
              <Tabs.Tab value="prizes">プライズレベル</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel pt="md" value="blinds">
              <Stack>
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">
                    ブラインドレベルを設定してください
                  </Text>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={addBlindLevel}
                    size="xs"
                    variant="light"
                  >
                    レベル追加
                  </Button>
                </Group>
                {blindLevels.length === 0 ? (
                  <Text c="dimmed" py="md" ta="center">
                    ブラインドレベルが設定されていません
                  </Text>
                ) : (
                  <ScrollArea h={300}>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Lv</Table.Th>
                          <Table.Th>SB</Table.Th>
                          <Table.Th>BB</Table.Th>
                          <Table.Th>Ante</Table.Th>
                          <Table.Th>時間(分)</Table.Th>
                          <Table.Th></Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {blindLevels.map((level, index) => (
                          <Table.Tr key={`blind-${level.level}-${index}`}>
                            <Table.Td>
                              <NumberInput
                                min={1}
                                onChange={(val) =>
                                  updateBlindLevel(
                                    index,
                                    'level',
                                    val as number,
                                  )
                                }
                                size="xs"
                                value={level.level}
                                w={60}
                              />
                            </Table.Td>
                            <Table.Td>
                              <NumberInput
                                min={1}
                                onChange={(val) =>
                                  updateBlindLevel(
                                    index,
                                    'smallBlind',
                                    val as number,
                                  )
                                }
                                size="xs"
                                thousandSeparator=","
                                value={level.smallBlind}
                                w={100}
                              />
                            </Table.Td>
                            <Table.Td>
                              <NumberInput
                                min={1}
                                onChange={(val) =>
                                  updateBlindLevel(
                                    index,
                                    'bigBlind',
                                    val as number,
                                  )
                                }
                                size="xs"
                                thousandSeparator=","
                                value={level.bigBlind}
                                w={100}
                              />
                            </Table.Td>
                            <Table.Td>
                              <NumberInput
                                min={0}
                                onChange={(val) =>
                                  updateBlindLevel(
                                    index,
                                    'ante',
                                    val === '' ? undefined : (val as number),
                                  )
                                }
                                size="xs"
                                thousandSeparator=","
                                value={level.ante ?? ''}
                                w={80}
                              />
                            </Table.Td>
                            <Table.Td>
                              <NumberInput
                                min={1}
                                onChange={(val) =>
                                  updateBlindLevel(
                                    index,
                                    'durationMinutes',
                                    val as number,
                                  )
                                }
                                size="xs"
                                value={level.durationMinutes}
                                w={70}
                              />
                            </Table.Td>
                            <Table.Td>
                              <ActionIcon
                                color="red"
                                onClick={() => removeBlindLevel(index)}
                                variant="subtle"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel pt="md" value="prizes">
              <Stack>
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">
                    プライズレベルを設定してください（%か固定額のいずれか）
                  </Text>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={addPrizeLevel}
                    size="xs"
                    variant="light"
                  >
                    順位追加
                  </Button>
                </Group>
                {prizeLevels.length === 0 ? (
                  <Text c="dimmed" py="md" ta="center">
                    プライズレベルが設定されていません
                  </Text>
                ) : (
                  <ScrollArea h={300}>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>順位</Table.Th>
                          <Table.Th>%</Table.Th>
                          <Table.Th>固定額</Table.Th>
                          <Table.Th></Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {prizeLevels.map((level, index) => (
                          <Table.Tr key={`prize-${level.position}-${index}`}>
                            <Table.Td>
                              <NumberInput
                                min={1}
                                onChange={(val) =>
                                  updatePrizeLevel(
                                    index,
                                    'position',
                                    val as number,
                                  )
                                }
                                size="xs"
                                value={level.position}
                                w={60}
                              />
                            </Table.Td>
                            <Table.Td>
                              <NumberInput
                                max={100}
                                min={0}
                                onChange={(val) =>
                                  updatePrizeLevel(
                                    index,
                                    'percentage',
                                    val === '' ? undefined : (val as number),
                                  )
                                }
                                size="xs"
                                suffix="%"
                                value={level.percentage ?? ''}
                                w={80}
                              />
                            </Table.Td>
                            <Table.Td>
                              <NumberInput
                                min={0}
                                onChange={(val) =>
                                  updatePrizeLevel(
                                    index,
                                    'fixedAmount',
                                    val === '' ? undefined : (val as number),
                                  )
                                }
                                size="xs"
                                thousandSeparator=","
                                value={level.fixedAmount ?? ''}
                                w={120}
                              />
                            </Table.Td>
                            <Table.Td>
                              <ActionIcon
                                color="red"
                                onClick={() => removePrizeLevel(index)}
                                variant="subtle"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="md">
            <Button
              onClick={() => {
                closeStructureModal()
                setEditingStructureTournament(null)
                setBlindLevels([])
                setPrizeLevels([])
              }}
              variant="subtle"
            >
              キャンセル
            </Button>
            <Button loading={isSavingStructure} onClick={handleSaveStructure}>
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
