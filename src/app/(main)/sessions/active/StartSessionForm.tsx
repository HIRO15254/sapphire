'use client'

import {
  Alert,
  Button,
  Card,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from '@mantine/core'
import { IconAlertCircle, IconPlayerPlay } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '~/trpc/react'

/**
 * Start session form component.
 *
 * Allows user to start a new active session.
 */
export function StartSessionForm() {
  const router = useRouter()
  const utils = api.useUtils()

  // Query stores
  const { data: storesData } = api.store.list.useQuery({})

  // Local state
  const [gameType, setGameType] = useState<'cash' | 'tournament'>('cash')
  const [storeId, setStoreId] = useState<string | null>(null)
  const [cashGameId, setCashGameId] = useState<string | null>(null)
  const [tournamentId, setTournamentId] = useState<string | null>(null)
  const [buyIn, setBuyIn] = useState<number | null>(null)

  // Query cash games and tournaments for selected store
  const { data: cashGamesData } = api.cashGame.listByStore.useQuery(
    { storeId: storeId ?? '' },
    { enabled: !!storeId && gameType === 'cash' },
  )

  const { data: tournamentsData } = api.tournament.listByStore.useQuery(
    { storeId: storeId ?? '' },
    { enabled: !!storeId && gameType === 'tournament' },
  )

  // Start session mutation
  const startSession = api.sessionEvent.startSession.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      router.refresh()
    },
  })

  // Store options
  const storeOptions =
    storesData?.stores.map((store) => ({
      value: store.id,
      label: store.name,
    })) ?? []

  // Cash game options
  const cashGameOptions =
    cashGamesData?.cashGames.map((game) => ({
      value: game.id,
      label: `${game.smallBlind}/${game.bigBlind}${game.currency ? ` (${game.currency.name})` : ''}`,
    })) ?? []

  // Tournament options
  const tournamentOptions =
    tournamentsData?.tournaments.map((tournament) => ({
      value: tournament.id,
      label: tournament.name ?? `Buy-in: ${tournament.buyIn.toLocaleString()}`,
    })) ?? []

  /**
   * Handle game type change.
   */
  const handleGameTypeChange = (value: string) => {
    setGameType(value as 'cash' | 'tournament')
    setCashGameId(null)
    setTournamentId(null)
  }

  /**
   * Handle store change.
   */
  const handleStoreChange = (value: string | null) => {
    setStoreId(value)
    setCashGameId(null)
    setTournamentId(null)
  }

  /**
   * Handle form submit.
   */
  const handleSubmit = () => {
    if (buyIn === null) return

    startSession.mutate({
      storeId: storeId ?? undefined,
      gameType,
      cashGameId: gameType === 'cash' ? cashGameId : null,
      tournamentId: gameType === 'tournament' ? tournamentId : null,
      buyIn,
    })
  }

  const isValid = buyIn !== null && buyIn > 0

  return (
    <Card p="lg" radius="md" shadow="sm" withBorder>
      <Stack gap="lg">
        <Text fw={500} size="lg">
          新しいセッションを開始
        </Text>

        {startSession.error && (
          <Alert
            color="red"
            icon={<IconAlertCircle size={16} />}
            title="エラー"
          >
            {startSession.error.message}
          </Alert>
        )}

        {/* Game Type */}
        <Stack gap="xs">
          <Text fw={500} size="sm">
            ゲームタイプ
          </Text>
          <SegmentedControl
            data={[
              { value: 'cash', label: 'キャッシュ' },
              { value: 'tournament', label: 'トーナメント' },
            ]}
            fullWidth
            onChange={handleGameTypeChange}
            value={gameType}
          />
        </Stack>

        {/* Store */}
        <Select
          clearable
          data={storeOptions}
          label="店舗（任意）"
          onChange={handleStoreChange}
          placeholder="店舗を選択"
          searchable
          value={storeId}
        />

        {/* Cash Game (if store selected and game type is cash) */}
        {storeId && gameType === 'cash' && cashGameOptions.length > 0 && (
          <Select
            clearable
            data={cashGameOptions}
            label="キャッシュゲーム（任意）"
            onChange={setCashGameId}
            placeholder="ゲームを選択"
            value={cashGameId}
          />
        )}

        {/* Tournament (if store selected and game type is tournament) */}
        {storeId &&
          gameType === 'tournament' &&
          tournamentOptions.length > 0 && (
            <Select
              clearable
              data={tournamentOptions}
              label="トーナメント（任意）"
              onChange={setTournamentId}
              placeholder="トーナメントを選択"
              value={tournamentId}
            />
          )}

        {/* Buy-in */}
        <NumberInput
          hideControls
          label="バイイン額"
          min={1}
          onChange={(val) => setBuyIn(typeof val === 'number' ? val : null)}
          placeholder="バイイン額を入力"
          required
          thousandSeparator=","
          value={buyIn ?? ''}
        />

        {/* Submit */}
        <Button
          disabled={!isValid}
          fullWidth
          leftSection={<IconPlayerPlay size={16} />}
          loading={startSession.isPending}
          onClick={handleSubmit}
          size="md"
        >
          セッションを開始
        </Button>
      </Stack>
    </Card>
  )
}
