'use client'

import {
  Box,
  Card,
  Divider,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { LineChart } from '@mantine/charts'
import {
  IconCalendar,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react'
import { useState } from 'react'

import type { Session } from './types'
import {
  formatDate,
  formatProfitLoss,
  formatSessionDuration,
  formatSessionDurationWithEvents,
  getProfitLossColor,
} from './types'

interface SessionInfoProps {
  session: Session
}

export function SessionInfo({ session }: SessionInfoProps) {
  // Toggle between summary and chart view (only if we have session events)
  const hasEvents = session.sessionEvents.length > 0
  const [topView, setTopView] = useState<'summary' | 'chart'>('summary')

  /**
   * Build chart data from session events.
   */
  const buildChartData = () => {
    const events = session.sessionEvents
    const startEvent = events.find((e) => e.eventType === 'session_start')
    if (!startEvent) return []

    const startTime = new Date(startEvent.recordedAt).getTime()
    const chartData: {
      elapsedMinutes: number
      profit: number
      adjustedProfit: number
    }[] = []

    // Calculate total buy-in at each point in time
    const buyInEvents: { time: number; amount: number }[] = []
    let accumulatedRebuyAddon = 0
    for (const event of events) {
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
        if (buyInEvent.time <= upToTime) {
          total += buyInEvent.amount
        }
      }
      return total
    }

    // Track pause time
    let cumulativePausedMs = 0
    let lastPauseTime: number | null = null

    // All-in luck calculation
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

    // Starting point
    chartData.push({
      elapsedMinutes: 0,
      profit: 0,
      adjustedProfit: 0,
    })

    // Process events
    for (const event of events) {
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
          profit,
          adjustedProfit: profit - luck,
        })
      }
    }

    // Add final point (cash-out)
    if (session.endTime && session.cashOut !== null) {
      const endTime = new Date(session.endTime).getTime()
      let totalPausedMs = cumulativePausedMs
      if (lastPauseTime !== null) {
        totalPausedMs += endTime - lastPauseTime
      }
      const totalElapsedMs = endTime - startTime - totalPausedMs
      const elapsedMinutes = Math.round(totalElapsedMs / (1000 * 60))
      const finalProfit = session.cashOut - session.buyIn
      const finalLuck = getCumulativeLuck(endTime)

      if (chartData.length === 0 || chartData[chartData.length - 1]?.elapsedMinutes !== elapsedMinutes) {
        chartData.push({
          elapsedMinutes,
          profit: finalProfit,
          adjustedProfit: finalProfit - finalLuck,
        })
      }
    }

    return chartData
  }

  const formatElapsed = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}分`
    return `${hours}h${mins > 0 ? `${mins}m` : ''}`
  }

  return (
    <>
      {/* Profit/Loss Summary or Chart */}
      <Card p="lg" radius="md" shadow="sm" withBorder>
        <Stack gap="md">
          {/* Toggle (only show if we have events) */}
          {hasEvents && (
            <Group justify="flex-end">
              <SegmentedControl
                data={[
                  { label: 'サマリー', value: 'summary' },
                  { label: 'グラフ', value: 'chart' },
                ]}
                onChange={(value) => setTopView(value as 'summary' | 'chart')}
                size="xs"
                value={topView}
              />
            </Group>
          )}

          <Box h={hasEvents ? 180 : undefined}>
            {/* Summary View */}
            {topView === 'summary' && (
              <Stack align="center" gap="md" h="100%" justify="center">
                <Group gap={8}>
                  {session.profitLoss !== null && session.profitLoss > 0 && (
                    <IconTrendingUp
                      size={32}
                      style={{ color: 'var(--mantine-color-green-6)' }}
                    />
                  )}
                  {session.profitLoss !== null && session.profitLoss < 0 && (
                    <IconTrendingDown
                      size={32}
                      style={{ color: 'var(--mantine-color-red-6)' }}
                    />
                  )}
                  <Stack align="center" gap={0}>
                    <Text
                      c={getProfitLossColor(session.profitLoss)}
                      fw={700}
                      size="3rem"
                    >
                      {formatProfitLoss(session.profitLoss)}
                    </Text>
                    {/* EV-adjusted profit next to main profit */}
                    {session.allInSummary &&
                      session.allInSummary.count > 0 &&
                      session.profitLoss !== null && (
                        <Text
                          c={getProfitLossColor(
                            session.profitLoss - session.allInSummary.evDifference,
                          )}
                          size="sm"
                        >
                          (EV:{' '}
                          {formatProfitLoss(
                            session.profitLoss - session.allInSummary.evDifference,
                          )}
                          )
                        </Text>
                      )}
                  </Stack>
                </Group>
                <Group gap="xl">
                  <Stack align="center" gap={0}>
                    <Text c="dimmed" size="sm">
                      Buy-in
                    </Text>
                    <Text fw={500} size="lg">
                      {session.buyIn.toLocaleString()}
                    </Text>
                  </Stack>
                  <Stack align="center" gap={0}>
                    <Text c="dimmed" size="sm">
                      Cash-out
                    </Text>
                    <Text fw={500} size="lg">
                      {(session.cashOut ?? 0).toLocaleString()}
                    </Text>
                  </Stack>
                </Group>
              </Stack>
            )}

            {/* Chart View */}
            {topView === 'chart' && hasEvents && (() => {
              const chartData = buildChartData()

              if (chartData.length < 2) {
                return (
                  <Stack align="center" h="100%" justify="center">
                    <Text c="dimmed" size="sm" ta="center">
                      スタック記録がありません
                    </Text>
                  </Stack>
                )
              }

              return (
                <LineChart
                  data={chartData}
                  dataKey="elapsedMinutes"
                  h={180}
                  series={[
                    { name: 'profit', color: 'green.6', label: '収支' },
                    { name: 'adjustedProfit', color: 'orange.6', label: 'All-in調整収支' },
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
                    tickFormatter: formatElapsed,
                  }}
                />
              )
            })()}
          </Box>
        </Stack>
      </Card>

      {/* Session Info */}
      <Card p="lg" radius="md" shadow="sm" withBorder>
        <Stack gap="md">
          <Group gap="sm">
            <IconCalendar size={20} />
            <Title order={3}>セッション情報</Title>
          </Group>
          <Divider />
          <Table withRowBorders={false}>
            <Table.Tbody>
              {session.store && (
                <Table.Tr>
                  <Table.Td c="dimmed" w={120}>
                    店舗
                  </Table.Td>
                  <Table.Td fw={500}>{session.store.name}</Table.Td>
                </Table.Tr>
              )}
              <Table.Tr>
                <Table.Td c="dimmed" w={120}>
                  日付
                </Table.Td>
                <Table.Td>{formatDate(session.startTime)}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td c="dimmed" w={120}>
                  セッション時間
                </Table.Td>
                <Table.Td>
                  {hasEvents
                    ? formatSessionDurationWithEvents(
                        session.startTime,
                        session.endTime,
                        session.sessionEvents,
                      )
                    : formatSessionDuration(session.startTime, session.endTime)}
                </Table.Td>
              </Table.Tr>
              {session.cashGame && (
                <Table.Tr>
                  <Table.Td c="dimmed" w={120}>
                    ブラインド
                  </Table.Td>
                  <Table.Td>
                    {session.cashGame.smallBlind}/{session.cashGame.bigBlind}
                    {session.cashGame.currency && (
                      <Text c="dimmed" component="span" ml="xs" size="sm">
                        ({session.cashGame.currency.name})
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              )}
              {session.tournament && (
                <>
                  {session.tournament.name && (
                    <Table.Tr>
                      <Table.Td c="dimmed" w={120}>
                        トーナメント名
                      </Table.Td>
                      <Table.Td fw={500}>{session.tournament.name}</Table.Td>
                    </Table.Tr>
                  )}
                  <Table.Tr>
                    <Table.Td c="dimmed" w={120}>
                      バイイン
                    </Table.Td>
                    <Table.Td>
                      ¥{session.tournament.buyIn.toLocaleString()}
                      {session.tournament.rake && (
                        <Text c="dimmed" component="span" ml="xs" size="sm">
                          (レーキ: ¥{session.tournament.rake.toLocaleString()})
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                </>
              )}
              {session.notes && (
                <Table.Tr>
                  <Table.Td c="dimmed" w={120}>
                    メモ
                  </Table.Td>
                  <Table.Td style={{ whiteSpace: 'pre-wrap' }}>
                    {session.notes}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>
    </>
  )
}
