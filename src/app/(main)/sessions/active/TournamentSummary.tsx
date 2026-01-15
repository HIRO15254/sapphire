'use client'

import {
  Group,
  Stack,
  Text,
} from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'

import type { BlindLevel } from '~/app/(main)/stores/[id]/types'

interface TournamentSummaryProps {
  timerStartedAt: Date | null
  blindLevels: BlindLevel[]
  currentStack: number
  buyIn: number
  entries: number | null
  remaining: number | null
  startingStack: number | null
}

/**
 * Get current big blind from timer and blind levels.
 */
function getCurrentBigBlind(
  timerStartedAt: Date | null,
  blindLevels: BlindLevel[],
): number | null {
  if (!timerStartedAt || blindLevels.length === 0) return null

  const elapsedMs = Date.now() - timerStartedAt.getTime()
  const elapsedSeconds = Math.floor(elapsedMs / 1000)

  let accumulatedSeconds = 0
  let lastBigBlind: number | null = null

  for (let i = 0; i < blindLevels.length; i++) {
    const level = blindLevels[i]
    if (!level) continue

    const levelDurationSeconds = level.durationMinutes * 60

    // Track last non-break big blind
    if (level.isBreak !== true && level.bigBlind) {
      lastBigBlind = level.bigBlind
    }

    accumulatedSeconds += levelDurationSeconds

    if (elapsedSeconds < accumulatedSeconds) {
      // For breaks, use the last known big blind
      if (level.isBreak === true) {
        return lastBigBlind
      }
      return level.bigBlind ?? null
    }
  }

  // Past all levels - return last big blind
  return lastBigBlind
}

/**
 * Tournament-specific summary display.
 * Shows timer, entries/remaining, prize pool, and average stack.
 */
export function TournamentSummary({
  timerStartedAt,
  blindLevels,
  currentStack,
  buyIn,
  entries,
  remaining,
  startingStack,
}: TournamentSummaryProps) {
  const [now, setNow] = useState(Date.now())

  // Update every second to keep BB count current
  useEffect(() => {
    if (!timerStartedAt || blindLevels.length === 0) return
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [timerStartedAt, blindLevels])

  // Calculate current big blind
  const currentBB = useMemo(
    () => getCurrentBigBlind(timerStartedAt, blindLevels),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timerStartedAt, blindLevels, now],
  )

  // Calculate prize pool (entries × buy-in)
  const prizePool = entries ? entries * buyIn : null

  // Calculate average stack (total chips / remaining)
  // Total chips = entries × starting stack (if we know both)
  const totalChips = entries && startingStack ? entries * startingStack : null
  const averageStack = totalChips && remaining ? Math.round(totalChips / remaining) : null

  // Format field display (remaining/entries)
  const fieldDisplay = remaining != null || entries != null
    ? `${remaining?.toLocaleString() ?? '-'} / ${entries?.toLocaleString() ?? '-'}`
    : '-'

  // Calculate BB counts
  const stackInBB = currentBB ? Math.round(currentStack / currentBB) : null
  const averageInBB = currentBB && averageStack ? Math.round(averageStack / currentBB) : null

  return (
    <Stack gap="xs" h="100%">
      {/* Tournament Stats - compact row */}
      <Group justify="space-between" gap="xs">
        <Stack align="center" gap={0}>
          <Text c="dimmed" size="xs">Field</Text>
          <Text fw={600} size="sm">{fieldDisplay}</Text>
        </Stack>
        <Stack align="center" gap={0}>
          <Text c="dimmed" size="xs">プライズ</Text>
          <Text fw={600} size="sm">{prizePool?.toLocaleString() ?? '-'}</Text>
        </Stack>
        <Stack align="center" gap={0}>
          <Text c="dimmed" size="xs">平均</Text>
          <Text fw={600} size="sm">
            {averageStack?.toLocaleString() ?? '-'}
            {averageInBB && <Text span size="xs" c="dimmed"> ({averageInBB}BB)</Text>}
          </Text>
        </Stack>
      </Group>

      {/* Current Stack (prominent) */}
      <Stack align="center" gap={0} style={{ flex: 1, justifyContent: 'center' }}>
        <Text fw={700} size="2rem">{currentStack.toLocaleString()}</Text>
        {stackInBB && (
          <Text size="sm" c="dimmed">{stackInBB}BB</Text>
        )}
      </Stack>
    </Stack>
  )
}
