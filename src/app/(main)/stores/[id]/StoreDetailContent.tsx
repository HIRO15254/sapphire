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
  Menu,
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
  IconCoffee,
  IconCoins,
  IconEdit,
  IconGift,
  IconPercentage,
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
  setTournamentPrizeStructures,
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
  const [blindLevels, setBlindLevels] = useState<
    Array<{
      level: number
      isBreak: boolean
      smallBlind?: number | null
      bigBlind?: number | null
      ante?: number | null
      durationMinutes: number
    }>
  >([])
  // Prize structure state - hierarchical: Structure -> Level -> Item
  type PrizeItem = {
    prizeType: 'percentage' | 'fixed_amount' | 'custom_prize'
    percentage?: number | null
    fixedAmount?: number | null
    customPrizeLabel?: string | null
    customPrizeValue?: number | null
    sortOrder: number
  }
  type PrizeLevel = {
    minPosition: number
    maxPosition: number
    sortOrder: number
    prizeItems: PrizeItem[]
  }
  type PrizeStructure = {
    minEntrants: number
    maxEntrants?: number | null
    sortOrder: number
    prizeLevels: PrizeLevel[]
  }
  const [prizeStructures, setPrizeStructures] = useState<PrizeStructure[]>([])
  const [activePrizeTab, setActivePrizeTab] = useState<string | null>('0')
  const [tournamentTab, setTournamentTab] = useState<string | null>('basic')

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

  // Transition states for Server Actions
  const [isUpdating, startUpdateTransition] = useTransition()
  const [isArchiving, startArchiveTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isSavingCashGame, startSaveCashGameTransition] = useTransition()
  const [isSavingTournament, startSaveTournamentTransition] = useTransition()

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
    setShowCashGameAdvanced(!!(game.straddle1 || game.straddle2 || game.ante))
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
    setBlindLevels([])
    setPrizeStructures([])
    setActivePrizeTab('0')
    setTournamentTab('basic')
    openTournamentModal()
  }

  const openTournamentForEdit = (
    tournament: Tournament,
    initialTab: 'basic' | 'blind' | 'prize' = 'basic',
  ) => {
    setEditingTournament(tournament)
    tournamentForm.setValues({
      currencyId: tournament.currencyId ?? '',
      name: tournament.name ?? '',
      buyIn: tournament.buyIn,
      rake: tournament.rake,
      startingStack: tournament.startingStack,
      notes: tournament.notes ?? '',
    })
    // Load blind levels
    setBlindLevels(
      tournament.blindLevels.map((bl) => ({
        level: bl.level,
        isBreak: bl.isBreak ?? false,
        smallBlind: bl.smallBlind,
        bigBlind: bl.bigBlind,
        ante: bl.ante ?? undefined,
        durationMinutes: bl.durationMinutes,
      })),
    )
    // Load prize structures
    setPrizeStructures(
      tournament.prizeStructures.map((ps, sIdx) => ({
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
    setActivePrizeTab('0')
    setTournamentTab(initialTab)
    openTournamentModal()
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
    field: keyof (typeof blindLevels)[number],
    value: number | undefined,
  ) => {
    setBlindLevels((prev) =>
      prev.map((level, i) => {
        if (i !== index) return level
        // Auto-fill SB = BB/2 and Ante = BB when BB is changed
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

  // Add prize structure (entry count range)
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

  // Add prize level to a structure (copy prizes from previous level)
  const addPrizeLevel = (sIdx: number) => {
    setPrizeStructures((prev) =>
      prev.map((s, i) => {
        if (i !== sIdx) return s
        const prevLevel = s.prizeLevels[s.prizeLevels.length - 1]
        const nextMinPosition = prevLevel ? prevLevel.maxPosition + 1 : 1
        // Copy prize items from previous level
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

  // Remove prize level from a structure
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

  // Add prize item to a level
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
    // Validate prize structure before saving
    if (prizeStructures.length > 0) {
      const prizeValidationError = validatePrizeStructure()
      if (prizeValidationError) {
        notifications.show({
          title: 'プライズストラクチャーエラー',
          message: prizeValidationError,
          color: 'red',
        })
        setTournamentTab('prize')
        return
      }
    }

    startSaveTournamentTransition(async () => {
      let tournamentId: string

      if (editingTournament) {
        // Update existing tournament
        const result = await updateTournament({
          id: editingTournament.id,
          currencyId: values.currencyId || undefined,
          name: values.name || undefined,
          buyIn: values.buyIn,
          rake: values.rake ?? undefined,
          startingStack: values.startingStack ?? undefined,
          notes: values.notes || undefined,
        })

        if (!result.success) {
          notifications.show({
            title: 'エラー',
            message: result.error,
            color: 'red',
          })
          return
        }
        tournamentId = editingTournament.id
      } else {
        // Create new tournament
        const result = await createTournament({
          storeId,
          currencyId: values.currencyId || undefined,
          name: values.name || undefined,
          buyIn: values.buyIn,
          rake: values.rake ?? undefined,
          startingStack: values.startingStack ?? undefined,
          notes: values.notes || undefined,
        })

        if (!result.success) {
          notifications.show({
            title: 'エラー',
            message: result.error,
            color: 'red',
          })
          return
        }
        tournamentId = result.data.id
      }

      // Save blind levels if any
      if (blindLevels.length > 0) {
        const blindResult = await setTournamentBlindLevels({
          tournamentId,
          levels: blindLevels.map((bl) => ({
            level: bl.level,
            isBreak: bl.isBreak,
            smallBlind: bl.isBreak ? null : bl.smallBlind,
            bigBlind: bl.isBreak ? null : bl.bigBlind,
            ante: bl.ante,
            durationMinutes: bl.durationMinutes,
          })),
        })

        if (!blindResult.success) {
          notifications.show({
            title: 'ブラインドストラクチャーエラー',
            message: blindResult.error,
            color: 'red',
          })
          return
        }
      }

      // Save prize structures if any
      if (prizeStructures.length > 0) {
        const prizeResult = await setTournamentPrizeStructures({
          tournamentId,
          structures: prizeStructures.map((ps) => ({
            minEntrants: ps.minEntrants,
            maxEntrants: ps.maxEntrants,
            sortOrder: ps.sortOrder,
            prizeLevels: ps.prizeLevels.map((pl) => ({
              minPosition: pl.minPosition,
              maxPosition: pl.maxPosition,
              sortOrder: pl.sortOrder,
              prizeItems: pl.prizeItems.map((pi) => ({
                prizeType: pi.prizeType,
                percentage: pi.percentage,
                fixedAmount: pi.fixedAmount,
                customPrizeLabel: pi.customPrizeLabel,
                customPrizeValue: pi.customPrizeValue,
                sortOrder: pi.sortOrder,
              })),
            })),
          })),
        })

        if (!prizeResult.success) {
          notifications.show({
            title: 'プライズストラクチャーエラー',
            message: prizeResult.error,
            color: 'red',
          })
          return
        }
      }

      notifications.show({
        title: editingTournament ? '更新完了' : '作成完了',
        message: editingTournament
          ? 'トーナメントを更新しました'
          : 'トーナメントを追加しました',
        color: 'green',
      })
      closeTournamentModal()
      tournamentForm.reset()
      setEditingTournament(null)
      setBlindLevels([])
      setPrizeStructures([])
      router.refresh()
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

  // Validate prize structure
  const validatePrizeStructure = (): string | null => {
    // Check for overlapping entry count ranges
    for (let i = 0; i < prizeStructures.length; i++) {
      const s1 = prizeStructures[i]
      if (!s1) continue
      for (let j = i + 1; j < prizeStructures.length; j++) {
        const s2 = prizeStructures[j]
        if (!s2) continue
        const s1Max = s1.maxEntrants ?? Infinity
        const s2Max = s2.maxEntrants ?? Infinity
        // Check if ranges overlap
        if (s1.minEntrants <= s2Max && s2.minEntrants <= s1Max) {
          return `エントリー数範囲が重複しています: ${s1.minEntrants}〜${s1.maxEntrants ?? '∞'}人 と ${s2.minEntrants}〜${s2.maxEntrants ?? '∞'}人`
        }
      }
    }

    // Check each structure
    for (const structure of prizeStructures) {
      const entryRange = `${structure.minEntrants}〜${structure.maxEntrants ?? '∞'}人`

      // Check for overlapping position ranges within the same structure
      for (let i = 0; i < structure.prizeLevels.length; i++) {
        const l1 = structure.prizeLevels[i]
        if (!l1) continue
        for (let j = i + 1; j < structure.prizeLevels.length; j++) {
          const l2 = structure.prizeLevels[j]
          if (!l2) continue
          // Check if position ranges overlap
          if (
            l1.minPosition <= l2.maxPosition &&
            l2.minPosition <= l1.maxPosition
          ) {
            return `${entryRange}の順位範囲が重複しています: ${l1.minPosition}〜${l1.maxPosition}位 と ${l2.minPosition}〜${l2.maxPosition}位`
          }
        }
      }

      // Check percentage totals for each position range
      for (const level of structure.prizeLevels) {
        const positionRange = `${level.minPosition}〜${level.maxPosition}位`
        const percentageItems = level.prizeItems.filter(
          (item) => item.prizeType === 'percentage',
        )

        if (percentageItems.length > 0) {
          const totalPercentage = percentageItems.reduce(
            (sum, item) => sum + (item.percentage ?? 0),
            0,
          )
          // Allow small floating point errors
          if (Math.abs(totalPercentage - 100) > 0.01) {
            return `${entryRange}の${positionRange}のパーセンテージ合計が100%ではありません（現在: ${totalPercentage.toFixed(2)}%）`
          }
        }
      }
    }

    return null
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
                              ? `${(tournament.buyIn - tournament.rake).toLocaleString()} + ${tournament.rake.toLocaleString()}`
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
              leftSection={
                showCashGameAdvanced ? (
                  <IconChevronUp size={14} />
                ) : (
                  <IconChevronDown size={14} />
                )
              }
              onClick={() => setShowCashGameAdvanced(!showCashGameAdvanced)}
              size="compact-sm"
              variant="subtle"
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

      {/* Tournament Modal (Create/Edit with Blind & Prize Structure) */}
      <Modal
        centered
        onClose={() => {
          closeTournamentModal()
          setEditingTournament(null)
          tournamentForm.reset()
          setBlindLevels([])
          setPrizeStructures([])
        }}
        opened={tournamentModalOpened}
        size="xl"
        title={editingTournament ? 'トーナメントを編集' : 'トーナメントを追加'}
      >
        <form onSubmit={handleTournamentSubmit}>
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
                    label="総バイイン"
                    min={1}
                    placeholder="10000"
                    thousandSeparator=","
                    withAsterisk
                    {...tournamentForm.getInputProps('buyIn')}
                  />
                  <NumberInput
                    description="総バイイン内のレーキ額"
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
                          {structure.minEntrants}〜
                          {structure.maxEntrants ?? '∞'}人
                        </Tabs.Tab>
                      ))}
                    </Tabs.List>
                    {prizeStructures.map((structure, sIdx) => (
                      <Tabs.Panel
                        key={`panel-${sIdx}`}
                        pt="xs"
                        value={String(sIdx)}
                      >
                        <Stack gap="xs">
                          <Group gap="xs">
                            <Text size="xs">エントリー:</Text>
                            <NumberInput
                              hideControls
                              min={1}
                              onChange={(val) =>
                                updatePrizeStructure(
                                  sIdx,
                                  'minEntrants',
                                  val as number,
                                )
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
                                if (
                                  Number(activePrizeTab) >=
                                  prizeStructures.length - 1
                                ) {
                                  setActivePrizeTab(
                                    String(
                                      Math.max(0, prizeStructures.length - 2),
                                    ),
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
                            <Table
                              horizontalSpacing={4}
                              verticalSpacing={4}
                              withRowBorders={false}
                            >
                              <Table.Tbody>
                                {structure.prizeLevels.map((level, lIdx) => (
                                  <Table.Tr key={`level-${sIdx}-${lIdx}`}>
                                    <Table.Td
                                      style={{ verticalAlign: 'middle' }}
                                      w={110}
                                    >
                                      <Group gap={2} wrap="nowrap">
                                        <NumberInput
                                          hideControls
                                          min={1}
                                          onChange={(val) =>
                                            updatePrizeLevel(
                                              sIdx,
                                              lIdx,
                                              'minPosition',
                                              val as number,
                                            )
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
                                            updatePrizeLevel(
                                              sIdx,
                                              lIdx,
                                              'maxPosition',
                                              val as number,
                                            )
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
                                    <Table.Td
                                      style={{ verticalAlign: 'middle' }}
                                    >
                                      <Stack align="flex-end" gap={2}>
                                        {level.prizeItems.map((item, iIdx) => (
                                          <Group
                                            gap={2}
                                            key={`item-${sIdx}-${lIdx}-${iIdx}`}
                                            wrap="nowrap"
                                          >
                                            <Box
                                              c={
                                                item.prizeType === 'percentage'
                                                  ? 'blue'
                                                  : item.prizeType ===
                                                      'fixed_amount'
                                                    ? 'green'
                                                    : 'grape'
                                              }
                                              style={{ display: 'flex' }}
                                            >
                                              {item.prizeType ===
                                              'percentage' ? (
                                                <IconPercentage size={14} />
                                              ) : item.prizeType ===
                                                'fixed_amount' ? (
                                                <IconCoins size={14} />
                                              ) : (
                                                <IconGift size={14} />
                                              )}
                                            </Box>
                                            {item.prizeType ===
                                              'percentage' && (
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
                                                    val === ''
                                                      ? null
                                                      : (val as number),
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
                                            {item.prizeType ===
                                              'fixed_amount' && (
                                              <NumberInput
                                                hideControls
                                                min={0}
                                                onChange={(val) =>
                                                  updatePrizeItem(
                                                    sIdx,
                                                    lIdx,
                                                    iIdx,
                                                    'fixedAmount',
                                                    val === ''
                                                      ? null
                                                      : (val as number),
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
                                            {item.prizeType ===
                                              'custom_prize' && (
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
                                                  value={
                                                    item.customPrizeLabel ?? ''
                                                  }
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
                                                      val === ''
                                                        ? null
                                                        : (val as number),
                                                    )
                                                  }
                                                  placeholder="換算値"
                                                  size="xs"
                                                  styles={{
                                                    input: {
                                                      padding: '2px 4px',
                                                    },
                                                  }}
                                                  value={
                                                    item.customPrizeValue ?? ''
                                                  }
                                                  w={70}
                                                />
                                              </Group>
                                            )}
                                            <ActionIcon
                                              color="red"
                                              onClick={() =>
                                                removePrizeItem(sIdx, lIdx, iIdx)
                                              }
                                              size="xs"
                                              variant="subtle"
                                            >
                                              <IconTrash size={12} />
                                            </ActionIcon>
                                          </Group>
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
                                            rightSection={
                                              <IconChevronDown size={12} />
                                            }
                                            size="xs"
                                            variant="light"
                                          >
                                            <IconPlus size={14} />
                                          </Button>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                          <Menu.Item
                                            disabled={level.prizeItems.some(
                                              (item) =>
                                                item.prizeType === 'percentage',
                                            )}
                                            leftSection={
                                              <IconPercentage size={14} />
                                            }
                                            onClick={() =>
                                              addPrizeItem(
                                                sIdx,
                                                lIdx,
                                                'percentage',
                                              )
                                            }
                                          >
                                            パーセンテージ
                                          </Menu.Item>
                                          <Menu.Item
                                            disabled={level.prizeItems.some(
                                              (item) =>
                                                item.prizeType ===
                                                'fixed_amount',
                                            )}
                                            leftSection={
                                              <IconCoins size={14} />
                                            }
                                            onClick={() =>
                                              addPrizeItem(
                                                sIdx,
                                                lIdx,
                                                'fixed_amount',
                                              )
                                            }
                                          >
                                            固定額
                                          </Menu.Item>
                                          <Menu.Item
                                            leftSection={<IconGift size={14} />}
                                            onClick={() =>
                                              addPrizeItem(
                                                sIdx,
                                                lIdx,
                                                'custom_prize',
                                              )
                                            }
                                          >
                                            カスタム
                                          </Menu.Item>
                                        </Menu.Dropdown>
                                      </Menu>
                                    </Table.Td>
                                    <Table.Td
                                      style={{ verticalAlign: 'middle' }}
                                      w={30}
                                    >
                                      <ActionIcon
                                        color="red"
                                        onClick={() =>
                                          removePrizeLevel(sIdx, lIdx)
                                        }
                                        size="sm"
                                        variant="subtle"
                                      >
                                        <IconTrash size={14} />
                                      </ActionIcon>
                                    </Table.Td>
                                  </Table.Tr>
                                ))}
                              </Table.Tbody>
                            </Table>
                          </ScrollArea>
                        </Stack>
                      </Tabs.Panel>
                    ))}
                  </Tabs>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="md">
            <Button
              onClick={() => {
                closeTournamentModal()
                setEditingTournament(null)
                tournamentForm.reset()
                setBlindLevels([])
                setPrizeStructures([])
              }}
              variant="subtle"
            >
              キャンセル
            </Button>
            <Button loading={isSavingTournament} type="submit">
              {editingTournament ? '更新' : '追加'}
            </Button>
          </Group>
        </form>
      </Modal>
    </Container>
  )
}
