'use client'

import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  Overlay,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
} from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import {
  IconAlertCircle,
  IconChartLine,
  IconClock,
  IconCoins,
  IconHistory,
  IconInfoCircle,
  IconLogout,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTarget,
  IconUsers,
} from '@tabler/icons-react'
import { GameTypeBadge } from '~/components/sessions/GameTypeBadge'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'
import {
  SessionEventTimeline,
  type TimelineAllInRecord,
} from '~/components/sessions/SessionEventTimeline'
import { SessionProfitChart } from '~/components/sessions/SessionProfitChart'
import { type AllInFormValues, AllInModal } from '../[id]/AllInModal'
import { BlindTimerCard } from './BlindTimerCard'
import { HandCounterCard } from './HandCounterCard'
import { StartSessionForm } from './StartSessionForm'
import { TablematesCard } from './TablematesCard'
import { TournamentInfoTab } from './TournamentInfoTab'
import { TournamentSummary } from './TournamentSummary'

type ActiveSession = RouterOutputs['sessionEvent']['getActiveSession']

type AllInRecord = NonNullable<ActiveSession>['allInRecords'][number]

interface ActiveSessionContentProps {
  initialSession: ActiveSession
}

/**
 * Active session content client component.
 *
 * 2-card layout filling device height:
 * - Main card with 3 tabs (Session, Tablemates, History)
 * - Hand counter card at bottom
 */
export function ActiveSessionContent({
  initialSession,
}: ActiveSessionContentProps) {
  const router = useRouter()
  const utils = api.useUtils()

  // Modal states
  const [rebuyModalOpened, { open: openRebuyModal, close: closeRebuyModal }] =
    useDisclosure(false)
  const [addonModalOpened, { open: openAddonModal, close: closeAddonModal }] =
    useDisclosure(false)
  const [endModalOpened, { open: openEndModal, close: closeEndModal }] =
    useDisclosure(false)
  const [allInModalOpened, { open: openAllInModal, close: closeAllInModal }] =
    useDisclosure(false)

  // Query active session
  const {
    data: session,
    isLoading,
    error,
    refetch,
  } = api.sessionEvent.getActiveSession.useQuery(undefined, {
    initialData: initialSession,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Query tablemates for hand counter player count
  const { data: tablematesData } = api.sessionTablemate.list.useQuery(
    { sessionId: initialSession?.id ?? '' },
    { enabled: !!initialSession?.id },
  )

  // Mutations
  const endSession = api.sessionEvent.endSession.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      router.push('/sessions')
    },
  })

  const pauseSession = api.sessionEvent.pauseSession.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void refetch()
    },
  })

  const resumeSession = api.sessionEvent.resumeSession.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void refetch()
    },
  })

  const updateStack = api.sessionEvent.updateStack.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void refetch()
      setStackAmount(null)
    },
  })

  const recordRebuy = api.sessionEvent.recordRebuy.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void refetch()
      setRebuyCost(null)
      setRebuyTime('')
      closeRebuyModal()
    },
  })

  const recordAddon = api.sessionEvent.recordAddon.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void refetch()
      setAddonCost(null)
      setAddonChips(null)
      setAddonTime('')
      closeAddonModal()
    },
  })

  // All-in mutations
  const createAllIn = api.allIn.create.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void refetch()
      closeAllInModal()
      setEditingAllIn(null)
    },
  })

  const updateAllIn = api.allIn.update.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void refetch()
      closeAllInModal()
      setEditingAllIn(null)
    },
  })

  // Tournament field update mutation
  const updateTournamentField = api.sessionEvent.updateTournamentField.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void refetch()
    },
  })

  // Local state
  const [cashOutAmount, setCashOutAmount] = useState<number | null>(null)
  const [stackAmount, setStackAmount] = useState<number | null>(null)
  const [rebuyCost, setRebuyCost] = useState<number | null>(null)
  const [addonCost, setAddonCost] = useState<number | null>(null)
  const [addonChips, setAddonChips] = useState<number | null>(null)

  // Time state for actions
  const [rebuyTime, setRebuyTime] = useState<string>('')
  const [addonTime, setAddonTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')

  // Tournament final position (for end session)
  const [finalPosition, setFinalPosition] = useState<number | null>(null)

  // Tournament entries and remaining (for inline editing)
  const [entriesInput, setEntriesInput] = useState<number | null>(null)
  const [remainingInput, setRemainingInput] = useState<number | null>(null)

  // Main card active tab
  const [activeTab, setActiveTab] = useState<string>('session')

  // Toggle between summary and chart view in session tab
  const [sessionView, setSessionView] = useState<'summary' | 'chart'>('summary')

  // Editing all-in record
  const [editingAllIn, setEditingAllIn] = useState<AllInRecord | null>(null)

  /**
   * Get current time as HH:MM string.
   */
  const getCurrentTimeString = () => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  /**
   * Parse time string to Date object.
   */
  const parseTimeToDate = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours ?? 0, minutes ?? 0, 0, 0)
    return date
  }

  /**
   * Format elapsed time to hours and minutes.
   */
  const formatElapsedTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}分`
    return `${hours}時間${mins}分`
  }

  /**
   * Handle end session.
   */
  const handleEndSession = () => {
    if (!session || cashOutAmount === null) return
    const recordedAt = endTime ? parseTimeToDate(endTime) : undefined
    endSession.mutate({
      sessionId: session.id,
      cashOut: cashOutAmount,
      recordedAt,
      finalPosition: session.gameType === 'tournament' ? finalPosition : null,
    })
  }

  /**
   * Handle pause session.
   */
  const handlePauseSession = () => {
    if (!session) return
    pauseSession.mutate({ sessionId: session.id })
  }

  /**
   * Handle resume session.
   */
  const handleResumeSession = () => {
    if (!session) return
    resumeSession.mutate({ sessionId: session.id })
  }

  /**
   * Handle stack update (cash game only).
   */
  const handleUpdateStack = () => {
    if (!session || stackAmount === null) return
    updateStack.mutate({
      sessionId: session.id,
      amount: stackAmount,
    })
  }

  /**
   * Handle combined stack + field update (tournament only).
   */
  const handleUpdateStackAndField = async () => {
    if (!session) return
    // Update both stack and field together
    await Promise.all([
      updateStack.mutateAsync({
        sessionId: session.id,
        amount: stackAmount ?? session.currentStack,
      }),
      updateTournamentField.mutateAsync({
        sessionId: session.id,
        entries: entriesInput ?? session.tournamentEntries ?? undefined,
        remaining: remainingInput ?? session.tournamentRemaining ?? undefined,
      }),
    ])
  }

  /**
   * Handle rebuy (cash game only).
   */
  const handleRebuy = () => {
    if (!session || rebuyCost === null) return
    const recordedAt = rebuyTime ? parseTimeToDate(rebuyTime) : undefined
    recordRebuy.mutate({
      sessionId: session.id,
      cost: rebuyCost,
      recordedAt,
    })
  }

  /**
   * Handle addon.
   */
  const handleAddon = () => {
    if (!session || addonCost === null) return
    const recordedAt = addonTime ? parseTimeToDate(addonTime) : undefined
    recordAddon.mutate({
      sessionId: session.id,
      cost: addonCost,
      chips: addonChips,
      recordedAt,
    })
  }

  /**
   * Handle all-in record form submit.
   */
  const handleAllInSubmit = (values: AllInFormValues) => {
    if (!session) return

    const winProbability = Number.parseFloat(values.winProbability)

    // Determine actual result based on useRunIt
    const actualResult = values.useRunIt
      ? (values.winsInRunout ?? 0) > 0
      : values.actualResult === 'win'

    // Parse recordedAt time
    const recordedAt = values.recordedAt ? parseTimeToDate(values.recordedAt) : undefined

    if (editingAllIn) {
      // Update existing all-in record
      updateAllIn.mutate({
        id: editingAllIn.id,
        potAmount: values.potAmount,
        winProbability,
        actualResult,
        recordedAt,
      })
    } else {
      // Create new all-in record
      createAllIn.mutate({
        sessionId: session.id,
        potAmount: values.potAmount,
        winProbability,
        actualResult,
        runItTimes: values.useRunIt ? values.runItTimes : null,
        winsInRunout: values.useRunIt ? values.winsInRunout : null,
        recordedAt,
      })
    }
  }

  /**
   * Handle edit all-in record from timeline.
   */
  const handleEditAllIn = (timelineAllIn: TimelineAllInRecord) => {
    // Find the full record from session data
    const fullRecord = session?.allInRecords.find((r) => r.id === timelineAllIn.id)
    if (fullRecord) {
      setEditingAllIn(fullRecord)
      openAllInModal()
    }
  }

  /**
   * Open end session modal with current stack as default.
   */
  const handleOpenEndModal = () => {
    if (session) {
      setCashOutAmount(session.currentStack)
      setEndTime(getCurrentTimeString())
      // For tournaments, default finalPosition to remaining players
      if (session.gameType === 'tournament') {
        setFinalPosition(session.tournamentRemaining ?? null)
      } else {
        setFinalPosition(null)
      }
    }
    openEndModal()
  }

  if (isLoading && !session) {
    return (
      <Container py="md" size="md">
        <Stack align="center" gap="lg">
          <Loader size="lg" />
          <Text c="dimmed">読み込み中...</Text>
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container py="md" size="md">
        <Alert color="red" icon={<IconAlertCircle size={16} />} title="エラー">
          {error.message}
        </Alert>
      </Container>
    )
  }

  // No active session - show start form
  if (!session) {
    return (
      <Container py="md" size="md">
        <StartSessionForm />
      </Container>
    )
  }

  // Active session exists - show controls
  const sessionIsPaused = session.isPaused
  const isCashGame = session.gameType === 'cash'
  const isTournament = session.gameType === 'tournament'

  // Get pause start time (most recent session_pause event)
  const pauseStartTime = sessionIsPaused
    ? (() => {
        const pauseEvent = [...session.sessionEvents]
          .reverse()
          .find((e) => e.eventType === 'session_pause')
        if (!pauseEvent) return null
        const date = new Date(pauseEvent.recordedAt)
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      })()
    : null

  // Calculate profit/loss
  const profitLoss = session.currentStack - session.buyIn

  // Calculate hand count (hand_complete events + hands_passed counts)
  const handCount = session.sessionEvents.reduce((count, event) => {
    if (event.eventType === 'hand_complete') {
      return count + 1
    }
    if (event.eventType === 'hands_passed') {
      const data = event.eventData as Record<string, unknown> | null
      return count + ((data?.count as number) ?? 0)
    }
    return count
  }, 0)

  // Calculate minTime (last event time) for time input validation
  const minTime = session.sessionEvents.length > 0
    ? new Date(session.sessionEvents[session.sessionEvents.length - 1]?.recordedAt ?? new Date())
    : undefined

  // Format minTime for description
  const minTimeString = minTime
    ? `${minTime.getHours().toString().padStart(2, '0')}:${minTime.getMinutes().toString().padStart(2, '0')}`
    : undefined

  // Build game info string compactly
  const gameInfo = (() => {
    const parts: string[] = []
    if (session.store) parts.push(session.store.name)
    if (session.cashGame) {
      parts.push(`${session.cashGame.smallBlind}/${session.cashGame.bigBlind}`)
    }
    if (session.tournament) {
      parts.push(
        session.tournament.name ??
          `Buy-in ${session.tournament.buyIn.toLocaleString()}`,
      )
    }
    return parts.join(' / ')
  })()

  // Common button style for consistency
  const buttonHeight = 42

  return (
    <Container
      size="md"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px - 32px)',
        gap: 'var(--mantine-spacing-md)',
      }}
    >
      {/* CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}
      </style>

      {/* Tournament Blind Timer - Fixed at top */}
      {isTournament && (() => {
        type BlindLevelArray = NonNullable<typeof session.tournament>['blindLevels']
        const overrideBlinds = session.tournamentOverrideBlinds as BlindLevelArray | null
        const blindLevels = overrideBlinds ?? session.tournament?.blindLevels ?? []

        if (!session.timerStartedAt || blindLevels.length === 0) return null

        return (
          <BlindTimerCard
            timerStartedAt={new Date(session.timerStartedAt)}
            blindLevels={blindLevels}
          />
        )
      })()}

      {/* Main Card - 3 Tabs */}
      <Card p="sm" radius="md" shadow="sm" withBorder style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'session')} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Tabs.List>
            <Tabs.Tab value="session" leftSection={<IconChartLine size={14} />}>
              セッション
            </Tabs.Tab>
            <Tabs.Tab value="tablemates" leftSection={<IconUsers size={14} />}>
              同卓者
            </Tabs.Tab>
            {isTournament && (
              <Tabs.Tab value="info" leftSection={<IconInfoCircle size={14} />}>
                情報
              </Tabs.Tab>
            )}
            <Tabs.Tab value="history" leftSection={<IconHistory size={14} />}>
              履歴
            </Tabs.Tab>
          </Tabs.List>

          {/* Tab 1: Session (Summary/Chart + Actions) */}
          <Tabs.Panel value="session" pt="sm" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header with status and toggle */}
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                {sessionIsPaused ? (
                  <Badge
                    color="gray"
                    leftSection={<IconPlayerPause size={12} />}
                    size="sm"
                    variant="filled"
                  >
                    停止
                  </Badge>
                ) : (
                  <Badge
                    color="red"
                    leftSection={
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          animation: 'pulse 1.5s infinite',
                        }}
                      />
                    }
                    size="sm"
                    variant="filled"
                  >
                    LIVE
                  </Badge>
                )}
                <GameTypeBadge
                  gameType={isTournament ? 'tournament' : 'cash_game'}
                  size="xs"
                />
                {gameInfo && (
                  <Text c="dimmed" size="xs" lineClamp={1}>
                    {gameInfo}
                  </Text>
                )}
              </Group>
              <SegmentedControl
                data={[
                  { label: 'サマリー', value: 'summary' },
                  { label: 'グラフ', value: 'chart' },
                ]}
                onChange={(value) => setSessionView(value as 'summary' | 'chart')}
                size="xs"
                value={sessionView}
              />
            </Group>

            {/* Content area */}
            <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: sessionView === 'chart' ? 'hidden' : 'auto' }}>
              {/* Summary View */}
              {sessionView === 'summary' && (
                <>
                  {/* Tournament Summary */}
                  {isTournament && (() => {
                    type BlindLevelArray = NonNullable<typeof session.tournament>['blindLevels']
                    const overrideBlinds = session.tournamentOverrideBlinds as BlindLevelArray | null
                    const blindLevels = overrideBlinds ?? session.tournament?.blindLevels ?? []
                    const startingStack = session.tournament?.startingStack ?? null

                    return (
                      <TournamentSummary
                        timerStartedAt={session.timerStartedAt ? new Date(session.timerStartedAt) : null}
                        blindLevels={blindLevels}
                        currentStack={session.currentStack}
                        buyIn={session.buyIn}
                        entries={session.tournamentEntries}
                        remaining={session.tournamentRemaining}
                        startingStack={startingStack}
                      />
                    )
                  })()}

                  {/* Cash Game Summary */}
                  {isCashGame && (
                    <Stack h="100%" justify="center" gap="md">
                      {/* Profit/Loss - prominent display */}
                      <Stack align="center" gap={0}>
                        <Text
                          c={profitLoss > 0 ? 'green' : profitLoss < 0 ? 'red' : 'dimmed'}
                          fw={700}
                          size="2rem"
                        >
                          {profitLoss >= 0 ? '+' : ''}
                          {profitLoss.toLocaleString()}
                        </Text>
                      </Stack>

                      {/* Stats row */}
                      <SimpleGrid cols={3}>
                        <Stack align="center" gap={0}>
                          <Text c="dimmed" size="xs">Buy-in</Text>
                          <Text fw={600} size="sm">{session.buyIn.toLocaleString()}</Text>
                        </Stack>
                        <Stack align="center" gap={0}>
                          <Text c="dimmed" size="xs">スタック</Text>
                          <Text fw={600} size="sm">{session.currentStack.toLocaleString()}</Text>
                        </Stack>
                        <Stack align="center" gap={0}>
                          <Text c="dimmed" size="xs">経過</Text>
                          <Text fw={600} size="sm">{formatElapsedTime(session.elapsedMinutes)}</Text>
                        </Stack>
                      </SimpleGrid>
                    </Stack>
                  )}
                </>
              )}

              {/* Chart View */}
              {sessionView === 'chart' && (
                <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <SessionProfitChart
                    sessionEvents={session.sessionEvents}
                    allInRecords={session.allInRecords}
                    buyIn={session.buyIn}
                    currentStack={session.currentStack}
                    variant={isTournament ? 'tournament' : 'cash'}
                    enableHandsMode={isCashGame}
                    bigBlind={session.cashGame?.bigBlind}
                  />
                </Box>
              )}
            </Box>

            <Divider my="sm" />

              {/* Actions Section - fixed at bottom */}
              <Stack gap="sm" style={{ flexShrink: 0 }}>
                {/* Row 1: Stack form (cash game) or Stack + Field (tournament) */}
                {isTournament ? (
                  <Group gap="xs">
                    <NumberInput
                      flex={1}
                      hideControls
                      leftSection={<IconCoins size={16} />}
                      min={0}
                      onChange={(val) =>
                        setStackAmount(typeof val === 'number' ? val : null)
                      }
                      placeholder={session.currentStack.toLocaleString()}
                      size="md"
                      styles={{ input: { height: buttonHeight } }}
                      thousandSeparator=","
                      value={stackAmount ?? ''}
                    />
                    <NumberInput
                      w={70}
                      hideControls
                      min={1}
                      onChange={(val) =>
                        setRemainingInput(typeof val === 'number' ? val : null)
                      }
                      placeholder="残り"
                      size="md"
                      styles={{ input: { height: buttonHeight, textAlign: 'center' } }}
                      value={remainingInput ?? session.tournamentRemaining ?? ''}
                    />
                    <Text c="dimmed" size="sm">/</Text>
                    <NumberInput
                      w={70}
                      hideControls
                      min={1}
                      onChange={(val) =>
                        setEntriesInput(typeof val === 'number' ? val : null)
                      }
                      placeholder="E数"
                      size="md"
                      styles={{ input: { height: buttonHeight, textAlign: 'center' } }}
                      value={entriesInput ?? session.tournamentEntries ?? ''}
                    />
                    <Button
                      h={buttonHeight}
                      loading={updateStack.isPending || updateTournamentField.isPending}
                      onClick={handleUpdateStackAndField}
                      variant="light"
                    >
                      更新
                    </Button>
                  </Group>
                ) : (
                  <Group gap="xs">
                    <NumberInput
                      flex={1}
                      hideControls
                      leftSection={<IconCoins size={16} />}
                      min={0}
                      onChange={(val) =>
                        setStackAmount(typeof val === 'number' ? val : null)
                      }
                      placeholder={session.currentStack.toLocaleString()}
                      size="md"
                      styles={{ input: { height: buttonHeight } }}
                      thousandSeparator=","
                      value={stackAmount ?? ''}
                    />
                    <Button
                      disabled={stackAmount === null}
                      h={buttonHeight}
                      loading={updateStack.isPending}
                      onClick={handleUpdateStack}
                      variant="light"
                    >
                      更新
                    </Button>
                  </Group>
                )}

                {/* Row 2: Buy-in / All-in buttons */}
                <SimpleGrid cols={2}>
                  {isCashGame && (
                    <>
                      <Button
                        color="orange"
                        h={buttonHeight}
                        leftSection={<IconPlus size={16} />}
                        onClick={openRebuyModal}
                        variant="light"
                      >
                        追加Buy-in
                      </Button>
                      <Button
                        color="pink"
                        h={buttonHeight}
                        leftSection={<IconTarget size={16} />}
                        onClick={openAllInModal}
                        variant="light"
                      >
                        オールイン
                      </Button>
                    </>
                  )}
                  {isTournament && (
                    <>
                      <Button
                        color="teal"
                        h={buttonHeight}
                        leftSection={<IconPlus size={16} />}
                        onClick={openAddonModal}
                        variant="light"
                      >
                        アドオン
                      </Button>
                      <Button
                        color="red"
                        h={buttonHeight}
                        leftSection={<IconLogout size={16} />}
                        onClick={handleOpenEndModal}
                        variant="light"
                      >
                        終了
                      </Button>
                    </>
                  )}
                </SimpleGrid>

                {/* Row 3: Pause and Cash-out buttons (cash game only) */}
                {isCashGame && (
                  <SimpleGrid cols={2}>
                    <Button
                      color="gray"
                      h={buttonHeight}
                      leftSection={<IconPlayerPause size={16} />}
                      loading={pauseSession.isPending}
                      onClick={handlePauseSession}
                      variant="light"
                    >
                      一時停止
                    </Button>
                    <Button
                      color="red"
                      h={buttonHeight}
                      leftSection={<IconLogout size={16} />}
                      onClick={handleOpenEndModal}
                      variant="light"
                    >
                      キャッシュアウト
                    </Button>
                  </SimpleGrid>
                )}
              </Stack>
          </Tabs.Panel>

          {/* Tab 2: Tablemates */}
          <Tabs.Panel value="tablemates" pt="sm" style={{ flex: 1, overflow: 'auto' }}>
            <TablematesCard sessionId={session.id} />
          </Tabs.Panel>

          {/* Tab 3: Info (Tournament only) */}
          {isTournament && (
            <Tabs.Panel value="info" pt="sm" style={{ flex: 1, overflow: 'auto' }}>
              <TournamentInfoTab session={session} />
            </Tabs.Panel>
          )}

          {/* Tab 4: History */}
          <Tabs.Panel value="history" pt="sm" style={{ flex: 1, overflow: 'hidden' }}>
            <SessionEventTimeline
              events={session.sessionEvents}
              allInRecords={session.allInRecords}
              sessionId={session.id}
              onEditAllIn={handleEditAllIn}
            />
          </Tabs.Panel>
        </Tabs>

        {/* Pause overlay for card */}
        {sessionIsPaused && (
          <Overlay
            color="dark"
            backgroundOpacity={0.6}
            blur={2}
            center
            radius="md"
            zIndex={100}
          >
            <Stack align="center" gap="sm">
              <IconPlayerPause size={32} color="white" />
              <Text c="white" fw={500}>休憩中{pauseStartTime && ` (${pauseStartTime}〜)`}</Text>
              <Button
                color="green"
                leftSection={<IconPlayerPlay size={16} />}
                loading={resumeSession.isPending}
                onClick={handleResumeSession}
                variant="light"
              >
                再開
              </Button>
            </Stack>
          </Overlay>
        )}
      </Card>

      {/* Hand Counter Card - Fixed at bottom */}
      <Box style={{ position: 'relative' }}>
        <HandCounterCard
          sessionId={session.id}
          handCount={handCount}
          lastHandInfo={session.lastHandInfo}
          tablematesCount={tablematesData?.tablemates.length ?? 0}
        />
        {sessionIsPaused && (
          <Overlay
            color="dark"
            backgroundOpacity={0.6}
            blur={2}
            center
            radius="md"
            zIndex={100}
          >
            <Text c="white" fw={500} size="sm">休憩中</Text>
          </Overlay>
        )}
      </Box>

      {/* Buy-in Addition Modal (Cash Game only) */}
      <Modal
        onClose={closeRebuyModal}
        opened={rebuyModalOpened}
        title="追加Buy-in"
      >
        <Stack gap="md">
          <TimeInput
            description={minTimeString ? `${minTimeString}より後` : undefined}
            label="発生時刻"
            leftSection={<IconClock size={16} />}
            onChange={(e) => setRebuyTime(e.currentTarget.value)}
            value={rebuyTime || getCurrentTimeString()}
          />
          <NumberInput
            hideControls
            label="追加Buy-in額"
            min={1}
            onChange={(val) =>
              setRebuyCost(typeof val === 'number' ? val : null)
            }
            placeholder="金額を入力"
            required
            thousandSeparator=","
            value={rebuyCost ?? ''}
          />
          <Group justify="flex-end">
            <Button onClick={closeRebuyModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              color="orange"
              disabled={!rebuyCost}
              loading={recordRebuy.isPending}
              onClick={handleRebuy}
            >
              追加
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Addon Modal */}
      <Modal onClose={closeAddonModal} opened={addonModalOpened} title="アドオン">
        <Stack gap="md">
          <TimeInput
            description={minTimeString ? `${minTimeString}より後` : undefined}
            label="発生時刻"
            leftSection={<IconClock size={16} />}
            onChange={(e) => setAddonTime(e.currentTarget.value)}
            value={addonTime || getCurrentTimeString()}
          />
          <NumberInput
            hideControls
            label="支払い額"
            min={1}
            onChange={(val) =>
              setAddonCost(typeof val === 'number' ? val : null)
            }
            placeholder="金額を入力"
            required
            thousandSeparator=","
            value={addonCost ?? ''}
          />
          <NumberInput
            hideControls
            label="獲得チップ"
            min={1}
            onChange={(val) =>
              setAddonChips(typeof val === 'number' ? val : null)
            }
            placeholder="チップ数を入力"
            thousandSeparator=","
            value={addonChips ?? ''}
          />
          <Group justify="flex-end">
            <Button onClick={closeAddonModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              color="teal"
              disabled={!addonCost}
              loading={recordAddon.isPending}
              onClick={handleAddon}
            >
              追加
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* All-in Record Modal */}
      <AllInModal
        editingAllIn={editingAllIn}
        isLoading={createAllIn.isPending || updateAllIn.isPending}
        minTime={minTime}
        onClose={() => {
          closeAllInModal()
          setEditingAllIn(null)
        }}
        onSubmit={handleAllInSubmit}
        opened={allInModalOpened}
      />

      {/* End Session Modal */}
      <Modal
        onClose={closeEndModal}
        opened={endModalOpened}
        title={isTournament ? 'セッション終了' : 'キャッシュアウト'}
      >
        <Stack gap="md">
          <Text c="dimmed" size="sm">
            {isTournament
              ? 'セッションを終了します。順位と獲得額を入力してください。'
              : 'セッションを終了します。キャッシュアウト額を確認してください。'}
          </Text>
          <TimeInput
            description={minTimeString ? `${minTimeString}より後` : undefined}
            label="発生時刻"
            leftSection={<IconClock size={16} />}
            onChange={(e) => setEndTime(e.currentTarget.value)}
            value={endTime || getCurrentTimeString()}
          />
          {/* Tournament final position */}
          {isTournament && (
            <NumberInput
              hideControls
              label="順位"
              min={1}
              onChange={(val) =>
                setFinalPosition(typeof val === 'number' ? val : null)
              }
              placeholder="順位を入力"
              thousandSeparator=","
              value={finalPosition ?? ''}
              description={session?.tournamentEntries ? `${session.tournamentEntries}人中` : undefined}
            />
          )}
          <NumberInput
            hideControls
            label={isTournament ? '獲得額' : 'キャッシュアウト額'}
            min={0}
            onChange={(val) =>
              setCashOutAmount(typeof val === 'number' ? val : null)
            }
            placeholder={isTournament ? '獲得額を入力（0 = バスト）' : 'キャッシュアウト額を入力'}
            required
            thousandSeparator=","
            value={cashOutAmount ?? ''}
          />
          <Group justify="flex-end">
            <Button onClick={closeEndModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              color="red"
              disabled={cashOutAmount === null}
              loading={endSession.isPending}
              onClick={handleEndSession}
            >
              終了
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
