'use client'

import {
  Button,
  Container,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { z } from 'zod'

import { RichTextEditor } from '~/components/ui/RichTextEditor'
import {
  archiveCashGame,
  archiveStore,
  archiveTournament,
  createCashGame,
  createTournament,
  deleteCashGame,
  deleteStore,
  deleteTournament,
  reorderCashGames,
  reorderTournaments,
  setTournamentBlindLevels,
  setTournamentPrizeStructures,
  unarchiveStore,
  updateCashGame,
  updateStore,
  updateTournament,
} from '../actions'
import { CashGameModal } from './CashGameModal'
import { CashGameSection } from './CashGameSection'
import { StoreHeader } from './StoreHeader'
import { StoreInfo } from './StoreInfo'
import { TournamentModal, type TournamentFormValues } from './TournamentModal'
import { TournamentSection } from './TournamentSection'
import type {
  BlindLevel,
  CashGame,
  Currency,
  PrizeStructure,
  Store,
  Tournament,
} from './types'

// Schema for store edit form
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

interface StoreDetailContentProps {
  initialStore: Store
  currencies: Currency[]
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

  // Local state for optimistic updates on reorder
  const [cashGames, setCashGames] = useState<CashGame[]>(
    initialStore.cashGames,
  )
  const [tournaments, setTournaments] = useState<Tournament[]>(
    initialStore.tournaments,
  )

  // Track server data to detect actual changes (vs optimistic updates)
  const serverCashGamesRef = useRef(initialStore.cashGames)
  const serverTournamentsRef = useRef(initialStore.tournaments)

  // Sync local state when server data actually changes (e.g., after refresh from other operations)
  useEffect(() => {
    // Only sync if server data has changed (different reference from what we last saw)
    if (initialStore.cashGames !== serverCashGamesRef.current) {
      serverCashGamesRef.current = initialStore.cashGames
      setCashGames(initialStore.cashGames)
    }
  }, [initialStore.cashGames])

  useEffect(() => {
    if (initialStore.tournaments !== serverTournamentsRef.current) {
      serverTournamentsRef.current = initialStore.tournaments
      setTournaments(initialStore.tournaments)
    }
  }, [initialStore.tournaments])

  // State for editing games (determines which game to edit in modal)
  const [editingCashGame, setEditingCashGame] = useState<CashGame | null>(null)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null,
  )
  const [tournamentInitialTab, setTournamentInitialTab] = useState<
    'basic' | 'blind' | 'prize'
  >('basic')

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

  // Store edit form
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

  // Open cash game modal for create or edit
  const openCashGameForCreate = () => {
    setEditingCashGame(null)
    openCashGameModal()
  }

  const openCashGameForEdit = (game: CashGame) => {
    setEditingCashGame(game)
    openCashGameModal()
  }

  // Open tournament modal for create or edit
  const openTournamentForCreate = () => {
    setEditingTournament(null)
    setTournamentInitialTab('basic')
    openTournamentModal()
  }

  const openTournamentForEdit = (tournament: Tournament) => {
    setEditingTournament(tournament)
    setTournamentInitialTab('basic')
    openTournamentModal()
  }

  // Store handlers
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

  // Cash game handlers
  const handleCashGameSubmit = (values: {
    currencyId?: string
    smallBlind: number
    bigBlind: number
    straddle1?: number | null
    straddle2?: number | null
    ante?: number | null
    anteType?: string | null | ''
    notes?: string
  }) => {
    startSaveCashGameTransition(async () => {
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

  // Tournament handlers
  const handleTournamentSubmit = (
    values: TournamentFormValues,
    blindLevels: BlindLevel[],
    prizeStructures: PrizeStructure[],
  ) => {
    // Validate prize structure before saving
    if (prizeStructures.length > 0) {
      const prizeValidationError = validatePrizeStructure(prizeStructures)
      if (prizeValidationError) {
        notifications.show({
          title: 'プライズストラクチャーエラー',
          message: prizeValidationError,
          color: 'red',
        })
        return
      }
    }

    startSaveTournamentTransition(async () => {
      let tournamentId: string

      if (editingTournament) {
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
      setEditingTournament(null)
      router.refresh()
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

  const handleCashGameModalClose = () => {
    closeCashGameModal()
    setEditingCashGame(null)
  }

  const handleTournamentModalClose = () => {
    closeTournamentModal()
    setEditingTournament(null)
  }

  // Reorder handlers (optimistic update - fire and forget with rollback on error)
  const handleCashGameReorder = (
    items: { id: string; sortOrder: number }[],
    newOrder: CashGame[],
  ) => {
    // Optimistic update: immediately update local state
    setCashGames(newOrder)

    // Fire async request without blocking UI
    void (async () => {
      const result = await reorderCashGames({
        storeId,
        items,
      })

      if (!result.success) {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
        // Rollback: refresh to get server state
        router.refresh()
      }
    })()
  }

  const handleTournamentReorder = (
    items: { id: string; sortOrder: number }[],
    newOrder: Tournament[],
  ) => {
    // Optimistic update: immediately update local state
    setTournaments(newOrder)

    // Fire async request without blocking UI
    void (async () => {
      const result = await reorderTournaments({
        storeId,
        items,
      })

      if (!result.success) {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
        // Rollback: refresh to get server state
        router.refresh()
      }
    })()
  }

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
        <StoreHeader
          isArchived={store.isArchived}
          isArchiving={isArchiving}
          name={store.name}
          onArchiveToggle={handleArchiveToggle}
          onDeleteClick={openDeleteModal}
          onEditClick={toggleEditMode}
        />

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
        <StoreInfo
          address={store.address}
          googleMapsUrl={store.googleMapsUrl}
          notes={store.notes}
        />

        {/* Cash Games Section */}
        <CashGameSection
          cashGames={cashGames}
          onArchiveToggle={handleCashGameArchiveToggle}
          onCreateClick={openCashGameForCreate}
          onDelete={handleCashGameDelete}
          onEditClick={openCashGameForEdit}
          onReorder={handleCashGameReorder}
        />

        {/* Tournaments Section */}
        <TournamentSection
          onArchiveToggle={handleTournamentArchiveToggle}
          onCreateClick={openTournamentForCreate}
          onDelete={handleTournamentDelete}
          onEditClick={openTournamentForEdit}
          onReorder={handleTournamentReorder}
          tournaments={tournaments}
        />
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

      {/* Cash Game Modal */}
      <CashGameModal
        currencies={currencies}
        editingCashGame={editingCashGame}
        isLoading={isSavingCashGame}
        onClose={handleCashGameModalClose}
        onSubmit={handleCashGameSubmit}
        opened={cashGameModalOpened}
      />

      {/* Tournament Modal */}
      <TournamentModal
        currencies={currencies}
        editingTournament={editingTournament}
        initialTab={tournamentInitialTab}
        isLoading={isSavingTournament}
        onClose={handleTournamentModalClose}
        onSubmit={handleTournamentSubmit}
        opened={tournamentModalOpened}
      />
    </Container>
  )
}

/**
 * Validate prize structure for overlapping ranges and percentage totals
 */
function validatePrizeStructure(prizeStructures: PrizeStructure[]): string | null {
  // Check for overlapping entry count ranges
  for (let i = 0; i < prizeStructures.length; i++) {
    const s1 = prizeStructures[i]
    if (!s1) continue
    for (let j = i + 1; j < prizeStructures.length; j++) {
      const s2 = prizeStructures[j]
      if (!s2) continue
      const s1Max = s1.maxEntrants ?? Infinity
      const s2Max = s2.maxEntrants ?? Infinity
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
        if (Math.abs(totalPercentage - 100) > 0.01) {
          return `${entryRange}の${positionRange}のパーセンテージ合計が100%ではありません（現在: ${totalPercentage.toFixed(2)}%）`
        }
      }
    }
  }

  return null
}
