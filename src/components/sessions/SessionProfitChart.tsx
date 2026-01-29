'use client'

import { Box, Group, SegmentedControl, Text } from '@mantine/core'
import { LineChart } from '@mantine/charts'
import { useState } from 'react'

// Generic event type for chart building
export interface ChartSessionEvent {
  eventType: string
  eventData: unknown
  recordedAt: Date
}

// Generic all-in record type for luck calculation
export interface ChartAllInRecord {
  potAmount: number
  winProbability: string
  actualResult: boolean
  recordedAt: Date
}

interface SessionProfitChartProps {
  sessionEvents: ChartSessionEvent[]
  allInRecords?: ChartAllInRecord[]
  buyIn: number
  /** Current stack for live sessions */
  currentStack?: number
  /** Cash out amount for completed sessions */
  cashOut?: number | null
  /** End time for completed sessions */
  endTime?: Date | null
  /** Enable hand count x-axis mode (for live sessions) */
  enableHandsMode?: boolean
  /** Show dots on chart points */
  withDots?: boolean
  /** Fixed height (for session detail), or 100% (for live session) */
  height?: number | '100%'
  /** Big blind amount for cash games (used to set default y-axis max to 100bb) */
  bigBlind?: number
  /** Chart variant: cash (profit/loss) or tournament (absolute stack) */
  variant?: 'cash' | 'tournament'
}

interface ChartDataPoint {
  elapsedMinutes: number
  handCount: number
  profit: number
  adjustedProfit: number
  stack: number
}

/**
 * Shared chart component for sessions.
 *
 * Supports two variants:
 * - cash: Shows profit/loss with all-in adjustment
 * - tournament: Shows absolute stack value
 */
export function SessionProfitChart({
  sessionEvents,
  allInRecords = [],
  buyIn,
  currentStack,
  cashOut,
  endTime,
  enableHandsMode = false,
  withDots = false,
  height = '100%',
  bigBlind,
  variant = 'cash',
}: SessionProfitChartProps) {
  const [xAxisMode, setXAxisMode] = useState<'time' | 'hands'>('time')

  const isTournament = variant === 'tournament'

  // Find session start event
  const startEvent = sessionEvents.find((e) => e.eventType === 'session_start')
  if (!startEvent) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        スタック記録がありません
      </Text>
    )
  }

  const startTime = new Date(startEvent.recordedAt).getTime()
  const chartData: ChartDataPoint[] = []

  // Calculate buy-in events for rebuy/addon tracking
  const buyInEvents: { time: number; amount: number }[] = []
  let accumulatedRebuyAddon = 0
  for (const event of sessionEvents) {
    const data = event.eventData as Record<string, unknown> | null
    if ((event.eventType === 'rebuy' || event.eventType === 'addon') && data?.amount) {
      accumulatedRebuyAddon += data.amount as number
      buyInEvents.push({
        time: new Date(event.recordedAt).getTime(),
        amount: data.amount as number,
      })
    }
  }
  const initialBuyIn = buyIn - accumulatedRebuyAddon

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
  let cumulativeHandCount = 0

  // Sort all-in records for luck calculation
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

  // Find initial stack for tournament mode
  const firstStackUpdate = sessionEvents.find((e) => e.eventType === 'stack_update')
  const initialStack = firstStackUpdate
    ? ((firstStackUpdate.eventData as Record<string, unknown>)?.amount as number) ?? (currentStack ?? buyIn)
    : (currentStack ?? buyIn)

  // Starting point
  chartData.push({
    elapsedMinutes: 0,
    handCount: 0,
    profit: 0,
    adjustedProfit: 0,
    stack: initialStack,
  })

  // Process events
  for (const event of sessionEvents) {
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

      // Skip if same time as previous point (update instead)
      const lastPoint = chartData[chartData.length - 1]
      if (lastPoint && lastPoint.elapsedMinutes === elapsedMinutes) {
        lastPoint.profit = profit
        lastPoint.adjustedProfit = profit - luck
        lastPoint.stack = stackAmount
        lastPoint.handCount = cumulativeHandCount
      } else {
        chartData.push({
          elapsedMinutes,
          handCount: cumulativeHandCount,
          profit,
          adjustedProfit: profit - luck,
          stack: stackAmount,
        })
      }
    }
  }

  // Add final point based on session state
  if (currentStack !== undefined) {
    // Live session: add current point
    let currentPausedMs = cumulativePausedMs
    if (lastPauseTime !== null) {
      currentPausedMs += Date.now() - lastPauseTime
    }
    const nowElapsed = Math.round((Date.now() - startTime - currentPausedMs) / (1000 * 60))
    const currentProfit = currentStack - buyIn
    const currentLuck = getCumulativeLuck(Date.now())

    // Calculate total hand count
    const totalHandCount = sessionEvents.reduce((count, event) => {
      if (event.eventType === 'hand_complete') return count + 1
      if (event.eventType === 'hands_passed') {
        const data = event.eventData as Record<string, unknown> | null
        return count + ((data?.count as number) ?? 0)
      }
      return count
    }, 0)

    const lastRecordedPoint = chartData[chartData.length - 1]
    if (lastRecordedPoint && lastRecordedPoint.elapsedMinutes !== nowElapsed) {
      chartData.push({
        elapsedMinutes: nowElapsed,
        handCount: totalHandCount,
        profit: currentProfit,
        adjustedProfit: currentProfit - currentLuck,
        stack: currentStack,
      })
    }
  } else if (endTime && cashOut !== null && cashOut !== undefined) {
    // Completed session: add cash-out point
    const endTimeMs = new Date(endTime).getTime()
    let totalPausedMs = cumulativePausedMs
    if (lastPauseTime !== null) {
      totalPausedMs += endTimeMs - lastPauseTime
    }
    const totalElapsedMs = endTimeMs - startTime - totalPausedMs
    const elapsedMinutes = Math.round(totalElapsedMs / (1000 * 60))
    const finalProfit = cashOut - buyIn
    const finalLuck = getCumulativeLuck(endTimeMs)

    const lastRecordedPoint = chartData[chartData.length - 1]
    if (!lastRecordedPoint || lastRecordedPoint.elapsedMinutes !== elapsedMinutes) {
      chartData.push({
        elapsedMinutes,
        handCount: cumulativeHandCount,
        profit: finalProfit,
        adjustedProfit: finalProfit - finalLuck,
        stack: cashOut,
      })
    }
  }

  if (chartData.length < 2) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        スタック記録がありません
      </Text>
    )
  }

  const dataKey = xAxisMode === 'time' ? 'elapsedMinutes' : 'handCount'

  // Calculate y-axis domain
  const yAxisDomain = (() => {
    if (isTournament) {
      // Tournament: start from 0
      return [0, 'auto'] as [number, 'auto']
    }

    if (!bigBlind) return undefined

    const minRange = 100 * bigBlind

    // Find actual data range
    const allValues = chartData.flatMap((d) => [d.profit, d.adjustedProfit])
    const dataMax = Math.max(...allValues)
    const dataMin = Math.min(...allValues)
    const dataRange = dataMax - dataMin

    // If data range >= 100bb, use actual range
    if (dataRange >= minRange) {
      return [dataMin, dataMax] as [number, number]
    }

    // Otherwise, add buffer equally to top and bottom to make 100bb range
    const buffer = (minRange - dataRange) / 2
    const yMin = dataMin - buffer
    const yMax = dataMax + buffer

    return [yMin, yMax] as [number, number]
  })()

  // Format elapsed minutes to "Xh Ym" format
  const formatElapsedMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`
  }

  // Custom tooltip label formatter
  const tooltipLabelFormatter = (label: number) => {
    if (xAxisMode === 'time') {
      return formatElapsedMinutes(label)
    }
    return `${label} hands`
  }

  // Series configuration based on variant
  const series = isTournament
    ? [{ name: 'stack', color: 'blue.6', label: 'スタック' }]
    : [
        { name: 'profit', color: 'green.6', label: '収支' },
        { name: 'adjustedProfit', color: 'orange.6', label: 'All-in調整' },
      ]

  // Reference lines (only for cash variant)
  const referenceLines = isTournament
    ? undefined
    : [{ y: 0, label: '±0', color: 'gray.5' }]

  // Show hands mode toggle only for cash variant with enableHandsMode
  const showHandsToggle = !isTournament && enableHandsMode

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {showHandsToggle && (
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
      )}
      <Box style={{ flex: 1, minHeight: 0 }}>
        <LineChart
          data={chartData}
          dataKey={dataKey}
          h={height}
          series={series}
          curveType="linear"
          withDots={withDots}
          connectNulls
          referenceLines={referenceLines}
          valueFormatter={(value) => value.toLocaleString()}
          xAxisProps={{
            type: 'number',
            domain: [0, 'dataMax'],
            tick: showHandsToggle ? false : undefined,
            tickFormatter: showHandsToggle ? undefined : formatElapsedMinutes,
          }}
          yAxisProps={yAxisDomain ? { domain: yAxisDomain } : undefined}
          tooltipProps={{
            wrapperStyle: { zIndex: 1000 },
            labelFormatter: tooltipLabelFormatter,
          }}
        />
      </Box>
    </Box>
  )
}
