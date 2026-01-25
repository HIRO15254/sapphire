'use client'

import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconCoffee } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'

import type { BlindLevel } from '~/app/(main)/stores/[id]/types'

interface BlindTimerCardProps {
  timerStartedAt: Date
  blindLevels: BlindLevel[]
}

interface CurrentLevelInfo {
  currentIndex: number
  currentLevel: BlindLevel
  remainingSeconds: number
  nextLevel: BlindLevel | null
  isBreak: boolean
  displayLevel: number | null
}

/**
 * Calculate current blind level from timer start time and blind structure.
 */
function calculateCurrentLevel(
  timerStartedAt: Date,
  blindLevels: BlindLevel[],
): CurrentLevelInfo | null {
  if (blindLevels.length === 0) return null

  const elapsedMs = Date.now() - timerStartedAt.getTime()
  const elapsedSeconds = Math.floor(elapsedMs / 1000)

  let accumulatedSeconds = 0
  let displayLevel = 0

  for (let i = 0; i < blindLevels.length; i++) {
    const level = blindLevels[i]
    if (!level) continue

    const levelDurationSeconds = level.durationMinutes * 60
    const isBreak = level.isBreak === true

    if (!isBreak) {
      displayLevel++
    }

    accumulatedSeconds += levelDurationSeconds

    if (elapsedSeconds < accumulatedSeconds) {
      const levelStartSeconds = accumulatedSeconds - levelDurationSeconds
      const elapsedInLevel = elapsedSeconds - levelStartSeconds
      const remainingSeconds = levelDurationSeconds - elapsedInLevel

      // Find next non-null level
      const nextLevel = blindLevels[i + 1] ?? null

      return {
        currentIndex: i,
        currentLevel: level,
        remainingSeconds,
        nextLevel,
        isBreak,
        displayLevel: isBreak ? null : displayLevel,
      }
    }
  }

  // Tournament has ended (past all levels) - show last level
  const lastLevel = blindLevels[blindLevels.length - 1]
  if (!lastLevel) return null

  const isLastBreak = lastLevel.isBreak === true
  return {
    currentIndex: blindLevels.length - 1,
    currentLevel: lastLevel,
    remainingSeconds: 0,
    nextLevel: null,
    isBreak: isLastBreak,
    displayLevel: isLastBreak ? null : displayLevel,
  }
}

/**
 * Format seconds as MM:SS.
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Calculate display level number for a level index (skipping breaks).
 */
function getDisplayLevelForIndex(
  blindLevels: BlindLevel[],
  targetIndex: number,
): number {
  let displayLevel = 0
  for (let i = 0; i <= targetIndex && i < blindLevels.length; i++) {
    const level = blindLevels[i]
    if (level && level.isBreak !== true) {
      displayLevel++
    }
  }
  return displayLevel
}

/**
 * Tournament blind timer display card.
 * Shows current blind level, remaining time, and next level info.
 */
export function BlindTimerCard({
  timerStartedAt,
  blindLevels,
}: BlindTimerCardProps) {
  const [now, setNow] = useState(Date.now())

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const levelInfo = useMemo(
    () => calculateCurrentLevel(timerStartedAt, blindLevels),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timerStartedAt, blindLevels, now],
  )

  if (!levelInfo) return null

  const { currentLevel, remainingSeconds, nextLevel, isBreak, displayLevel } =
    levelInfo
  const isLowTime = remainingSeconds <= 60 && remainingSeconds > 0

  // Get next level's display level number
  const nextDisplayLevel = nextLevel
    ? nextLevel.isBreak !== true
      ? getDisplayLevelForIndex(blindLevels, levelInfo.currentIndex + 1)
      : null
    : null

  return (
    <Card p="sm" radius="md" withBorder>
      <Stack gap="xs">
        {/* Header: Level and Time */}
        <Group align="flex-start" justify="space-between">
          {isBreak ? (
            <Group gap="xs">
              <ThemeIcon color="orange" size="sm" variant="light">
                <IconCoffee size={14} />
              </ThemeIcon>
              <Text c="orange" fw={600} size="sm">
                Break
              </Text>
            </Group>
          ) : (
            <Text fw={600} size="sm">
              Level {displayLevel}
            </Text>
          )}
          <Text
            c={isLowTime ? 'red' : undefined}
            fw={700}
            size="lg"
            style={isLowTime ? { animation: 'pulse 1s infinite' } : undefined}
          >
            {formatTime(remainingSeconds)}
          </Text>
        </Group>

        {/* Current blinds (if not break) */}
        {!isBreak && (
          <Text c="dimmed" size="sm">
            SB {currentLevel.smallBlind?.toLocaleString() ?? '-'} / BB{' '}
            {currentLevel.bigBlind?.toLocaleString() ?? '-'}
            {currentLevel.ante
              ? ` / Ante ${currentLevel.ante.toLocaleString()}`
              : ''}
          </Text>
        )}

        {/* Next level info */}
        {nextLevel && (
          <Text c="dimmed" size="xs">
            Next:{' '}
            {nextLevel.isBreak === true
              ? 'Break'
              : `Level ${nextDisplayLevel} - SB ${nextLevel.smallBlind?.toLocaleString() ?? '-'} / BB ${nextLevel.bigBlind?.toLocaleString() ?? '-'}`}
          </Text>
        )}

        {/* Tournament ended */}
        {!nextLevel && remainingSeconds === 0 && (
          <Text c="dimmed" size="xs">
            ブラインドストラクチャー終了
          </Text>
        )}
      </Stack>
    </Card>
  )
}
