'use client'

import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
} from '@mantine/core'
import { LineChart } from '@mantine/charts'
import { TimeInput } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import {
  IconAlertCircle,
  IconChartLine,
  IconClock,
  IconCoin,
  IconHistory,
  IconLogout,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconPokerChip,
  IconRefresh,
  IconTarget,
  IconTrophy,
  IconUsers,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'
import { type AllInFormValues, AllInModal } from '../[id]/AllInModal'
import { HandCounterCard } from './HandCounterCard'
import { SessionEventTimeline } from './SessionEventTimeline'
import { StartSessionForm } from './StartSessionForm'
import { TablematesCard } from './TablematesCard'

type ActiveSession = RouterOutputs['sessionEvent']['getActiveSession']

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
      setRebuyAmount(null)
      setRebuyTime('')
      closeRebuyModal()
    },
  })

  const recordAddon = api.sessionEvent.recordAddon.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void refetch()
      setAddonAmount(null)
      setAddonTime('')
      closeAddonModal()
    },
  })

  // All-in mutation
  const createAllIn = api.allIn.create.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
      void refetch()
      closeAllInModal()
    },
  })

  // Local state
  const [cashOutAmount, setCashOutAmount] = useState<number | null>(null)
  const [stackAmount, setStackAmount] = useState<number | null>(null)
  const [rebuyAmount, setRebuyAmount] = useState<number | null>(null)
  const [addonAmount, setAddonAmount] = useState<number | null>(null)

  // Time state for actions
  const [rebuyTime, setRebuyTime] = useState<string>('')
  const [addonTime, setAddonTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')

  // Main card active tab
  const [activeTab, setActiveTab] = useState<string>('session')

  // Toggle between summary and chart view in session tab
  const [sessionView, setSessionView] = useState<'summary' | 'chart'>('summary')

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
   * Handle stack update.
   */
  const handleUpdateStack = () => {
    if (!session || stackAmount === null) return
    updateStack.mutate({
      sessionId: session.id,
      amount: stackAmount,
    })
  }

  /**
   * Handle rebuy.
   */
  const handleRebuy = () => {
    if (!session || rebuyAmount === null) return
    const recordedAt = rebuyTime ? parseTimeToDate(rebuyTime) : undefined
    recordRebuy.mutate({
      sessionId: session.id,
      amount: rebuyAmount,
      recordedAt,
    })
  }

  /**
   * Handle addon.
   */
  const handleAddon = () => {
    if (!session || addonAmount === null) return
    const recordedAt = addonTime ? parseTimeToDate(addonTime) : undefined
    recordAddon.mutate({
      sessionId: session.id,
      amount: addonAmount,
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

  /**
   * Open end session modal with current stack as default.
   */
  const handleOpenEndModal = () => {
    if (session) {
      setCashOutAmount(session.currentStack)
      setEndTime(getCurrentTimeString())
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

      {/* Main Card - 3 Tabs */}
      <Card p="sm" radius="md" shadow="sm" withBorder style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'session')} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Tabs.List>
            <Tabs.Tab value="session" leftSection={<IconChartLine size={14} />}>
              セッション
            </Tabs.Tab>
            <Tabs.Tab value="tablemates" leftSection={<IconUsers size={14} />}>
              同卓者
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={14} />}>
              履歴
            </Tabs.Tab>
          </Tabs.List>

          {/* Tab 1: Session (Summary + Actions) */}
          <Tabs.Panel value="session" pt="sm" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Summary Section - grows to fill available space */}
            <Box style={{ flex: 1, minHeight: 120, display: 'flex', flexDirection: 'column' }}>
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
                    {isTournament ? (
                      <Badge
                        color="grape"
                        leftSection={<IconTrophy size={10} />}
                        size="xs"
                        variant="light"
                      >
                        MTT
                      </Badge>
                    ) : (
                      <Badge
                        color="blue"
                        leftSection={<IconPokerChip size={10} />}
                        size="xs"
                        variant="light"
                      >
                        Cash
                      </Badge>
                    )}
                    {gameInfo && (
                      <Text c="dimmed" size="xs" lineClamp={1}>
                        {gameInfo}
                      </Text>
                    )}
                  </Group>
                  <Group gap="xs">
                    <SegmentedControl
                      data={[
                        { label: 'サマリー', value: 'summary' },
                        { label: 'グラフ', value: 'chart' },
                      ]}
                      onChange={(value) => setSessionView(value as 'summary' | 'chart')}
                      size="xs"
                      value={sessionView}
                    />
                    <Button
                      leftSection={<IconRefresh size={14} />}
                      onClick={() => refetch()}
                      variant="subtle"
                      size="xs"
                      px="xs"
                    >
                      更新
                    </Button>
                  </Group>
                </Group>

                {/* Content area - grows to fill available space */}
                <Box style={{ flex: 1, minHeight: 80 }}>
                  {/* Summary View */}
                  {sessionView === 'summary' && (
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
                          <Text c="dimmed" size="xs">
                            Buy-in
                          </Text>
                          <Text fw={600} size="sm">{session.buyIn.toLocaleString()}</Text>
                        </Stack>
                        <Stack align="center" gap={0}>
                          <Text c="dimmed" size="xs">
                            スタック
                          </Text>
                          <Text fw={600} size="sm">{session.currentStack.toLocaleString()}</Text>
                        </Stack>
                        <Stack align="center" gap={0}>
                          <Text c="dimmed" size="xs">
                            経過
                          </Text>
                          <Text fw={600} size="sm">{formatElapsedTime(session.elapsedMinutes)}</Text>
                        </Stack>
                      </SimpleGrid>
                    </Stack>
                  )}

                  {/* Chart View */}
                  {sessionView === 'chart' && (
                    <Box h="100%">
                      <ChartView session={session} />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Actions Section - fixed at bottom */}
              <Stack gap="sm" mt="md" style={{ flexShrink: 0 }}>
                {/* Row 1: Stack form with inline update button */}
                <Group gap="xs">
                  <NumberInput
                    disabled={sessionIsPaused}
                    flex={1}
                    hideControls
                    leftSection={<IconCoin size={16} />}
                    min={0}
                    onChange={(val) =>
                      setStackAmount(typeof val === 'number' ? val : null)
                    }
                    placeholder="スタック額"
                    size="md"
                    styles={{ input: { height: buttonHeight } }}
                    thousandSeparator=","
                    value={stackAmount ?? session.currentStack}
                  />
                  <Button
                    disabled={stackAmount === null || sessionIsPaused}
                    h={buttonHeight}
                    loading={updateStack.isPending}
                    onClick={handleUpdateStack}
                    variant="filled"
                  >
                    更新
                  </Button>
                </Group>

                {/* Row 2: Buy-in / All-in buttons */}
                <SimpleGrid cols={2}>
                  {isCashGame && (
                    <>
                      <Button
                        color="orange"
                        disabled={sessionIsPaused}
                        h={buttonHeight}
                        leftSection={<IconPlus size={16} />}
                        onClick={openRebuyModal}
                        variant="light"
                      >
                        追加Buy-in
                      </Button>
                      <Button
                        color="pink"
                        disabled={sessionIsPaused}
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
                        color="orange"
                        disabled={sessionIsPaused}
                        h={buttonHeight}
                        leftSection={<IconPlus size={16} />}
                        onClick={openRebuyModal}
                        variant="light"
                      >
                        リバイ
                      </Button>
                      <Button
                        color="teal"
                        disabled={sessionIsPaused}
                        h={buttonHeight}
                        leftSection={<IconPlus size={16} />}
                        onClick={openAddonModal}
                        variant="light"
                      >
                        アドオン
                      </Button>
                    </>
                  )}
                </SimpleGrid>

                {/* Row 3: Pause/Resume and Cash-out buttons */}
                <SimpleGrid cols={2}>
                  {sessionIsPaused ? (
                    <Button
                      color="green"
                      h={buttonHeight}
                      leftSection={<IconPlayerPlay size={16} />}
                      loading={resumeSession.isPending}
                      onClick={handleResumeSession}
                      variant="light"
                    >
                      再開
                    </Button>
                  ) : (
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
                  )}
                  <Button
                    color="red"
                    disabled={sessionIsPaused}
                    h={buttonHeight}
                    leftSection={<IconLogout size={16} />}
                    onClick={handleOpenEndModal}
                    variant="light"
                  >
                    キャッシュアウト
                  </Button>
                </SimpleGrid>
              </Stack>
          </Tabs.Panel>

          {/* Tab 2: Tablemates */}
          <Tabs.Panel value="tablemates" pt="sm" style={{ flex: 1, overflow: 'auto' }}>
            <TablematesCard sessionId={session.id} />
          </Tabs.Panel>

          {/* Tab 3: History */}
          <Tabs.Panel value="history" pt="sm" style={{ flex: 1, overflow: 'auto' }}>
            <SessionEventTimeline events={session.sessionEvents} />
          </Tabs.Panel>
        </Tabs>
      </Card>

      {/* Hand Counter Card - Fixed at bottom */}
      <HandCounterCard
        sessionId={session.id}
        handCount={handCount}
        lastHandInfo={session.lastHandInfo}
        tablematesCount={tablematesData?.tablemates.length ?? 0}
      />

      {/* Rebuy / Buy-in Addition Modal */}
      <Modal
        onClose={closeRebuyModal}
        opened={rebuyModalOpened}
        title={isCashGame ? '追加Buy-in' : 'リバイ'}
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
            label={isCashGame ? '追加Buy-in額' : 'リバイ額'}
            min={1}
            onChange={(val) =>
              setRebuyAmount(typeof val === 'number' ? val : null)
            }
            placeholder="金額を入力"
            required
            thousandSeparator=","
            value={rebuyAmount ?? ''}
          />
          <Group justify="flex-end">
            <Button onClick={closeRebuyModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              color="orange"
              disabled={!rebuyAmount}
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
            label="アドオン額"
            min={1}
            onChange={(val) =>
              setAddonAmount(typeof val === 'number' ? val : null)
            }
            placeholder="金額を入力"
            required
            thousandSeparator=","
            value={addonAmount ?? ''}
          />
          <Group justify="flex-end">
            <Button onClick={closeAddonModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              color="teal"
              disabled={!addonAmount}
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
        editingAllIn={null}
        isLoading={createAllIn.isPending}
        minTime={minTime}
        onClose={closeAllInModal}
        onSubmit={handleAllInSubmit}
        opened={allInModalOpened}
      />

      {/* End Session Modal */}
      <Modal
        onClose={closeEndModal}
        opened={endModalOpened}
        title="キャッシュアウト"
      >
        <Stack gap="md">
          <Text c="dimmed" size="sm">
            セッションを終了します。キャッシュアウト額を確認してください。
          </Text>
          <TimeInput
            description={minTimeString ? `${minTimeString}より後` : undefined}
            label="発生時刻"
            leftSection={<IconClock size={16} />}
            onChange={(e) => setEndTime(e.currentTarget.value)}
            value={endTime || getCurrentTimeString()}
          />
          <NumberInput
            hideControls
            label="キャッシュアウト額"
            min={0}
            onChange={(val) =>
              setCashOutAmount(typeof val === 'number' ? val : null)
            }
            placeholder="キャッシュアウト額を入力"
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

// Chart view component extracted for clarity
function ChartView({ session }: { session: NonNullable<ActiveSession> }) {
  const [xAxisMode, setXAxisMode] = useState<'time' | 'hands'>('time')

  // Build chart data from events with elapsed minutes (excluding paused time)
  const startEvent = session.sessionEvents.find(
    (e) => e.eventType === 'session_start'
  )
  if (!startEvent) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        スタック記録がありません
      </Text>
    )
  }

  const startTime = new Date(startEvent.recordedAt).getTime()
  const chartData: {
    elapsedMinutes: number
    handCount: number
    profit: number
    adjustedProfit: number
  }[] = []

  // First pass: calculate total buy-in at each point in time
  const buyInEvents: { time: number; amount: number }[] = [
    { time: startTime, amount: session.buyIn }
  ]
  let accumulatedRebuyAddon = 0
  for (const event of session.sessionEvents) {
    const data = event.eventData as Record<string, unknown> | null
    if ((event.eventType === 'rebuy' || event.eventType === 'addon') && data?.amount) {
      accumulatedRebuyAddon += data.amount as number
      buyInEvents.push({
        time: new Date(event.recordedAt).getTime(),
        amount: data.amount as number,
      })
    }
  }
  const initialBuyIn = session.buyIn - accumulatedRebuyAddon

  const getTotalBuyIn = (upToTime: number) => {
    let total = initialBuyIn
    for (const buyInEvent of buyInEvents) {
      if (buyInEvent.time > startTime && buyInEvent.time <= upToTime) {
        total += buyInEvent.amount
      }
    }
    return total
  }

  let cumulativePausedMs = 0
  let lastPauseTime: number | null = null
  let cumulativeHandCount = 0

  const allInRecords = session.allInRecords ?? []
  const sortedAllIns = [...allInRecords].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  )

  const getCumulativeLuck = (upToTime: number) => {
    let luck = 0
    for (const allIn of sortedAllIns) {
      const allInTime = new Date(allIn.recordedAt).getTime()
      if (allInTime > upToTime) break
      const winProbability = parseFloat(allIn.winProbability)
      const expectedValue = allIn.potAmount * (winProbability / 100)
      const actualValue = allIn.actualResult ? allIn.potAmount : 0
      luck += actualValue - expectedValue
    }
    return luck
  }

  chartData.push({
    elapsedMinutes: 0,
    handCount: 0,
    profit: 0,
    adjustedProfit: 0,
  })

  for (const event of session.sessionEvents) {
    const data = event.eventData as Record<string, unknown> | null
    const eventTime = new Date(event.recordedAt).getTime()

    if (event.eventType === 'session_pause') {
      lastPauseTime = eventTime
      continue
    } else if (event.eventType === 'session_resume' && lastPauseTime !== null) {
      cumulativePausedMs += eventTime - lastPauseTime
      lastPauseTime = null
      continue
    }

    // Track hand count
    if (event.eventType === 'hand_complete') {
      cumulativeHandCount += 1
      continue
    }
    if (event.eventType === 'hands_passed' && data?.count) {
      cumulativeHandCount += data.count as number
      continue
    }

    if (event.eventType === 'stack_update' && data?.amount) {
      const rawElapsedMs = eventTime - startTime
      const activeElapsedMs = rawElapsedMs - cumulativePausedMs
      const elapsedMinutes = Math.round(activeElapsedMs / (1000 * 60))

      const stackAmount = data.amount as number
      const totalBuyInAtTime = getTotalBuyIn(eventTime)
      const profit = stackAmount - totalBuyInAtTime
      const luck = getCumulativeLuck(eventTime)

      chartData.push({
        elapsedMinutes,
        handCount: cumulativeHandCount,
        profit,
        adjustedProfit: profit - luck,
      })
    }
  }

  let currentPausedMs = cumulativePausedMs
  if (lastPauseTime !== null) {
    currentPausedMs += Date.now() - lastPauseTime
  }
  const nowElapsed = Math.round((Date.now() - startTime - currentPausedMs) / (1000 * 60))
  const currentProfit = session.currentStack - session.buyIn
  const currentLuck = getCumulativeLuck(Date.now())

  // Calculate total hand count
  const totalHandCount = session.sessionEvents.reduce((count, event) => {
    if (event.eventType === 'hand_complete') return count + 1
    if (event.eventType === 'hands_passed') {
      const data = event.eventData as Record<string, unknown> | null
      return count + ((data?.count as number) ?? 0)
    }
    return count
  }, 0)

  if (chartData.length === 0 || chartData[chartData.length - 1]?.elapsedMinutes !== nowElapsed) {
    chartData.push({
      elapsedMinutes: nowElapsed,
      handCount: totalHandCount,
      profit: currentProfit,
      adjustedProfit: currentProfit - currentLuck,
    })
  }

  if (chartData.length < 2) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        スタック記録がありません
      </Text>
    )
  }

  const formatElapsed = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}分`
    return `${hours}h${mins > 0 ? `${mins}m` : ''}`
  }

  const formatHands = (hands: number) => `${hands}H`

  const dataKey = xAxisMode === 'time' ? 'elapsedMinutes' : 'handCount'
  const tickFormatter = xAxisMode === 'time' ? formatElapsed : formatHands

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Group justify="flex-end" mb={4} style={{ flexShrink: 0 }}>
        <SegmentedControl
          data={[
            { label: '時間', value: 'time' },
            { label: 'ハンド', value: 'hands' },
          ]}
          onChange={(value) => setXAxisMode(value as 'time' | 'hands')}
          size="xs"
          value={xAxisMode}
        />
      </Group>
      <Box style={{ flex: 1, minHeight: 80 }}>
        <LineChart
          data={chartData}
          dataKey={dataKey}
          h="100%"
          series={[
            { name: 'profit', color: 'green.6', label: '収支' },
            { name: 'adjustedProfit', color: 'orange.6', label: 'All-in調整' },
          ]}
          curveType="linear"
          withDots
          connectNulls
          referenceLines={[
            { y: 0, label: '±0', color: 'gray.5' },
          ]}
          valueFormatter={(value) => value.toLocaleString()}
          xAxisProps={{
            type: 'number',
            domain: [0, 'dataMax'],
            tickFormatter,
          }}
        />
      </Box>
    </Box>
  )
}
