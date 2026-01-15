'use client'

import { Box, Text } from '@mantine/core'
import { LineChart } from '@mantine/charts'

export interface TournamentChartEvent {
  eventType: string
  eventData: unknown
  recordedAt: Date
}

interface TournamentStackChartProps {
  sessionEvents: TournamentChartEvent[]
  currentStack: number
  /** Fixed height or 100% */
  height?: number | '100%'
}

interface ChartDataPoint {
  elapsedMinutes: number
  stack: number
}

/**
 * Tournament stack chart - shows absolute stack value over time.
 */
export function TournamentStackChart({
  sessionEvents,
  currentStack,
  height = '100%',
}: TournamentStackChartProps) {
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

  // Find initial stack from first stack_update event
  const firstStackUpdate = sessionEvents.find((e) => e.eventType === 'stack_update')
  const initialStack = firstStackUpdate
    ? ((firstStackUpdate.eventData as Record<string, unknown>)?.amount as number) ?? currentStack
    : currentStack

  // Starting point
  chartData.push({
    elapsedMinutes: 0,
    stack: initialStack,
  })

  // Process stack_update events
  for (const event of sessionEvents) {
    const data = event.eventData as Record<string, unknown> | null
    const eventTime = new Date(event.recordedAt).getTime()

    if (event.eventType === 'stack_update' && data?.amount) {
      const elapsedMs = eventTime - startTime
      const elapsedMinutes = Math.round(elapsedMs / (1000 * 60))
      const stackAmount = data.amount as number

      // Skip if same time as previous point
      const lastPoint = chartData[chartData.length - 1]
      if (lastPoint && lastPoint.elapsedMinutes === elapsedMinutes) {
        // Update the last point instead
        lastPoint.stack = stackAmount
      } else {
        chartData.push({
          elapsedMinutes,
          stack: stackAmount,
        })
      }
    }
  }

  // Add current point
  const nowElapsed = Math.round((Date.now() - startTime) / (1000 * 60))
  const lastPoint = chartData[chartData.length - 1]
  if (lastPoint && lastPoint.elapsedMinutes !== nowElapsed) {
    chartData.push({
      elapsedMinutes: nowElapsed,
      stack: currentStack,
    })
  }

  if (chartData.length < 2) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        スタック記録がありません
      </Text>
    )
  }

  // Format elapsed minutes to "Xh Ym" format
  const formatElapsedMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`
  }

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box style={{ flex: 1, minHeight: 80 }}>
        <LineChart
          data={chartData}
          dataKey="elapsedMinutes"
          h={height}
          series={[
            { name: 'stack', color: 'blue.6', label: 'スタック' },
          ]}
          curveType="linear"
          connectNulls
          valueFormatter={(value) => value.toLocaleString()}
          xAxisProps={{
            type: 'number',
            domain: [0, 'dataMax'],
            tickFormatter: formatElapsedMinutes,
          }}
          yAxisProps={{
            domain: [0, 'auto'],
          }}
          tooltipProps={{
            wrapperStyle: { zIndex: 1000 },
            labelFormatter: formatElapsedMinutes,
          }}
        />
      </Box>
    </Box>
  )
}
