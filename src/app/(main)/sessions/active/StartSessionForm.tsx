'use client'

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { IconAlertCircle, IconClock, IconPlayerPlay } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
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
  const [initialStack, setInitialStack] = useState<number | null>(null)
  const [useTimer, setUseTimer] = useState(false)
  const [timerTime, setTimerTime] = useState<string>('')
  const timerInputRef = useRef<HTMLInputElement>(null)

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
    // Reset timer and initial stack when switching away from tournament
    if (value !== 'tournament') {
      setUseTimer(false)
      setTimerTime('')
      setInitialStack(null)
    }
  }

  /**
   * Handle store change.
   */
  const handleStoreChange = (value: string | null) => {
    setStoreId(value)
    setCashGameId(null)
    setTournamentId(null)
    // Reset buy-in and initial stack when store changes
    if (gameType === 'tournament') {
      setBuyIn(null)
      setInitialStack(null)
    }
  }

  /**
   * Handle tournament selection.
   * Auto-fills buy-in and initial stack from tournament data.
   */
  const handleTournamentChange = (value: string | null) => {
    setTournamentId(value)
    if (value) {
      // Find the selected tournament and auto-fill values
      const tournament = tournamentsData?.tournaments.find(
        (t) => t.id === value,
      )
      if (tournament) {
        setBuyIn(tournament.buyIn)
        setInitialStack(tournament.startingStack ?? null)
      }
    } else {
      // Clear values when tournament is deselected
      setBuyIn(null)
      setInitialStack(null)
    }
  }

  /**
   * Handle timer toggle.
   */
  const handleTimerToggle = (checked: boolean) => {
    setUseTimer(checked)
    if (checked && !timerTime) {
      // Default to current time when enabling timer
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setTimerTime(`${hours}:${minutes}`)
    }
  }

  /**
   * Parse timer time string to Date.
   */
  const parseTimerStartedAt = (): Date | null => {
    if (!useTimer || !timerTime) return null
    const parts = timerTime.split(':').map(Number)
    const hours = parts[0]
    const minutes = parts[1]
    if (
      hours === undefined ||
      minutes === undefined ||
      isNaN(hours) ||
      isNaN(minutes)
    )
      return null
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  /**
   * Handle form submit.
   */
  const handleSubmit = () => {
    if (buyIn === null) return
    // For tournaments, initialStack is required
    if (gameType === 'tournament' && initialStack === null) return

    startSession.mutate({
      storeId: storeId ?? undefined,
      gameType,
      cashGameId: gameType === 'cash' ? cashGameId : null,
      tournamentId: gameType === 'tournament' ? tournamentId : null,
      buyIn,
      initialStack: gameType === 'tournament' ? initialStack : null,
      timerStartedAt: gameType === 'tournament' ? parseTimerStartedAt() : null,
    })
  }

  // For tournaments, both buyIn and initialStack are required
  const isValid =
    buyIn !== null &&
    buyIn > 0 &&
    (gameType !== 'tournament' || (initialStack !== null && initialStack > 0))

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
              onChange={handleTournamentChange}
              placeholder="トーナメントを選択"
              value={tournamentId}
            />
          )}

        {/* Timer start time (tournament only) */}
        {gameType === 'tournament' && (
          <Stack gap="xs">
            <Checkbox
              checked={useTimer}
              label="ブラインドタイマーを使用"
              onChange={(e) => handleTimerToggle(e.currentTarget.checked)}
            />
            {useTimer && (
              <Group align="flex-end" gap="xs">
                <TimeInput
                  label="タイマー開始時刻"
                  leftSection={<IconClock size={16} />}
                  onChange={(e) => setTimerTime(e.currentTarget.value)}
                  ref={timerInputRef}
                  style={{ flex: 1 }}
                  value={timerTime}
                />
                <Button
                  onClick={() => {
                    const now = new Date()
                    const hours = now.getHours().toString().padStart(2, '0')
                    const minutes = now.getMinutes().toString().padStart(2, '0')
                    setTimerTime(`${hours}:${minutes}`)
                  }}
                  size="sm"
                  variant="light"
                >
                  今
                </Button>
              </Group>
            )}
          </Stack>
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

        {/* Initial Stack (tournament only) */}
        {gameType === 'tournament' && (
          <NumberInput
            hideControls
            label="初期スタック"
            min={1}
            onChange={(val) =>
              setInitialStack(typeof val === 'number' ? val : null)
            }
            placeholder="初期スタックを入力"
            required
            thousandSeparator=","
            value={initialStack ?? ''}
          />
        )}

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
