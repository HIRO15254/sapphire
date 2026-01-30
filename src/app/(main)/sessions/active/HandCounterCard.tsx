'use client'

import {
  ActionIcon,
  Card,
  Group,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconMinus, IconPlus } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import {
  getPositionsForPlayerCount,
  type PokerPosition,
} from '~/server/api/schemas/sessionEvent.schema'
import { api } from '~/trpc/react'

interface HandCounterCardProps {
  sessionId: string
  handCount: number
  lastHandInfo: {
    recordedAt: Date
    position?: string
  } | null
  tablematesCount: number
  isSelfSeated: boolean
}

/**
 * Format relative time in Japanese (always in minutes).
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return 'たった今'
  return `${diffMinutes}分前`
}

/**
 * Slim card for counting hands during a live session.
 * Displays hand count with position selector and player count.
 * Shows last recorded time and allows position selection.
 */
export function HandCounterCard({
  sessionId,
  handCount,
  lastHandInfo,
  tablematesCount,
  isSelfSeated,
}: HandCounterCardProps) {
  const utils = api.useUtils()

  // Player count state - sync with tablemates count, minimum 2
  // When self is seated, tablematesCount already includes self (no +1 needed)
  const [playerCount, setPlayerCount] = useState<number>(
    Math.max(2, isSelfSeated ? tablematesCount : tablematesCount + 1),
  )

  // Display value for player count input (can be empty while editing)
  const [playerCountDisplay, setPlayerCountDisplay] = useState<number | string>(
    playerCount,
  )

  // Sync player count when tablemates count changes
  useEffect(() => {
    const newCount = Math.max(
      2,
      isSelfSeated ? tablematesCount : tablematesCount + 1,
    )
    setPlayerCount(newCount)
    setPlayerCountDisplay(newCount)
  }, [tablematesCount, isSelfSeated])

  // Sync display value when playerCount changes from other sources
  useEffect(() => {
    setPlayerCountDisplay(playerCount)
  }, [playerCount])

  // Get available positions for current player count
  const availablePositions = getPositionsForPlayerCount(playerCount)

  // Position selection state - default to last position or BTN
  const getInitialPosition = (): PokerPosition => {
    const lastPos = lastHandInfo?.position as PokerPosition | undefined
    if (lastPos && availablePositions.includes(lastPos)) {
      return lastPos
    }
    // Default to BTN or last available position
    return availablePositions.includes('BTN')
      ? 'BTN'
      : (availablePositions[availablePositions.length - 1] ?? 'BTN')
  }

  const [selectedPosition, setSelectedPosition] = useState<PokerPosition>(
    getInitialPosition(),
  )

  // Ensure selected position is valid when player count changes
  useEffect(() => {
    if (!availablePositions.includes(selectedPosition)) {
      // Find closest valid position
      const newPos = availablePositions.includes('BTN')
        ? 'BTN'
        : (availablePositions[availablePositions.length - 1] ?? 'BTN')
      setSelectedPosition(newPos)
    }
  }, [availablePositions, selectedPosition])

  /**
   * Get next position in rotation (clockwise: BTN → SB → BB → UTG → ...)
   * Array order is [BTN, CO, ..., BB, SB], so next means going forward in array
   */
  const getNextPosition = (currentPos: PokerPosition): PokerPosition => {
    const currentIndex = availablePositions.indexOf(currentPos)
    if (currentIndex === -1) return availablePositions[0] ?? 'BTN'
    const nextIndex = (currentIndex + 1) % availablePositions.length
    return availablePositions[nextIndex] ?? 'BTN'
  }

  /**
   * Get previous position in rotation (counter-clockwise)
   * Array order is [BTN, CO, ..., BB, SB], so prev means going backward in array
   */
  const getPrevPosition = (currentPos: PokerPosition): PokerPosition => {
    const currentIndex = availablePositions.indexOf(currentPos)
    if (currentIndex === -1)
      return availablePositions[availablePositions.length - 1] ?? 'BTN'
    const prevIndex =
      (currentIndex - 1 + availablePositions.length) % availablePositions.length
    return availablePositions[prevIndex] ?? 'BTN'
  }

  const addHandMutation = api.sessionEvent.recordHandComplete.useMutation({
    onMutate: async ({ position }) => {
      // Cancel outgoing refetches
      await utils.sessionEvent.getActiveSession.cancel()

      // Snapshot previous value
      const previousData = utils.sessionEvent.getActiveSession.getData()

      // Optimistically update
      utils.sessionEvent.getActiveSession.setData(undefined, (old) => {
        if (!old) return old
        const now = new Date()
        return {
          ...old,
          sessionEvents: [
            ...old.sessionEvents,
            {
              id: `optimistic-${Date.now()}`,
              sessionId,
              userId: '',
              eventType: 'hand_complete' as const,
              eventData: position ? { position } : {},
              sequence: old.sessionEvents.length + 1,
              recordedAt: now,
              createdAt: now,
            },
          ],
          lastHandInfo: {
            recordedAt: now,
            position,
          },
        }
      })

      return { previousData }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.sessionEvent.getActiveSession.setData(
          undefined,
          context.previousData,
        )
      }
    },
    onSettled: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
    },
  })

  const removeHandMutation =
    api.sessionEvent.deleteLatestHandComplete.useMutation({
      onMutate: async () => {
        // Cancel outgoing refetches
        await utils.sessionEvent.getActiveSession.cancel()

        // Snapshot previous value
        const previousData = utils.sessionEvent.getActiveSession.getData()

        // Optimistically update
        utils.sessionEvent.getActiveSession.setData(undefined, (old) => {
          if (!old) return old
          // Find and remove last hand_complete event
          const events = [...old.sessionEvents]
          const lastHandCompleteIndex = events
            .map((e, i) => ({ e, i }))
            .reverse()
            .find(({ e }) => e.eventType === 'hand_complete')?.i
          if (lastHandCompleteIndex !== undefined) {
            events.splice(lastHandCompleteIndex, 1)
          }

          // Find new last hand_complete for lastHandInfo
          const newLastHandComplete = [...events]
            .reverse()
            .find((e) => e.eventType === 'hand_complete')
          const newLastHandInfo = newLastHandComplete
            ? {
                recordedAt: newLastHandComplete.recordedAt,
                position: (
                  newLastHandComplete.eventData as Record<
                    string,
                    unknown
                  > | null
                )?.position as string | undefined,
              }
            : null

          return {
            ...old,
            sessionEvents: events,
            lastHandInfo: newLastHandInfo,
          }
        })

        return { previousData }
      },
      onError: (_err, _variables, context) => {
        // Rollback on error
        if (context?.previousData) {
          utils.sessionEvent.getActiveSession.setData(
            undefined,
            context.previousData,
          )
        }
      },
      onSettled: () => {
        void utils.sessionEvent.getActiveSession.invalidate()
      },
    })

  const handleAddHand = () => {
    addHandMutation.mutate({ sessionId, position: selectedPosition })
    // Rotate to next position (clockwise: BTN → SB → BB → ...)
    setSelectedPosition(getNextPosition(selectedPosition))
  }

  const handleRemoveHand = () => {
    if (handCount > 0) {
      removeHandMutation.mutate({ sessionId })
      // Rotate to previous position
      setSelectedPosition(getPrevPosition(selectedPosition))
    }
  }

  return (
    <Card padding="sm" radius="md" withBorder>
      <Stack gap="xs">
        {/* Position selector */}
        <SegmentedControl
          data={availablePositions.map((pos) => ({ label: pos, value: pos }))}
          fullWidth
          onChange={(val) => setSelectedPosition(val as PokerPosition)}
          size="xs"
          value={selectedPosition}
        />

        {/* Hand counter with player count */}
        <Group gap="md" justify="center">
          <Tooltip label="ハンド数を減らす">
            <ActionIcon
              color="red"
              disabled={handCount === 0}
              onClick={handleRemoveHand}
              size="lg"
              variant="light"
            >
              <IconMinus size={20} />
            </ActionIcon>
          </Tooltip>

          <Group align="baseline" gap="xs">
            <Text fw={700} size="xl">
              {handCount}
            </Text>
            <Text c="dimmed" size="sm">
              ハンド
            </Text>
          </Group>

          <Tooltip label="ハンド完了">
            <ActionIcon
              color="green"
              onClick={handleAddHand}
              size="lg"
              variant="light"
            >
              <IconPlus size={20} />
            </ActionIcon>
          </Tooltip>

          {/* Player count selector */}
          <Group gap={4}>
            <NumberInput
              allowDecimal={false}
              allowNegative={false}
              hideControls
              max={9}
              min={2}
              onBlur={() => {
                // On blur, validate and reset to valid value
                const numVal =
                  typeof playerCountDisplay === 'number'
                    ? playerCountDisplay
                    : parseInt(String(playerCountDisplay), 10)
                if (!isNaN(numVal) && numVal >= 2 && numVal <= 9) {
                  setPlayerCount(numVal)
                  setPlayerCountDisplay(numVal)
                } else {
                  // Reset to current valid value
                  setPlayerCountDisplay(playerCount)
                }
              }}
              onChange={(val) => {
                // Allow empty value temporarily while typing
                setPlayerCountDisplay(val)
                // If valid number, update actual state immediately
                if (typeof val === 'number' && val >= 2 && val <= 9) {
                  setPlayerCount(val)
                }
              }}
              onFocus={(e) => e.target.select()}
              size="xs"
              styles={{
                input: {
                  textAlign: 'center',
                  paddingLeft: 4,
                  paddingRight: 4,
                },
              }}
              value={playerCountDisplay}
              w={50}
            />
            <Text c="dimmed" size="xs">
              人
            </Text>
          </Group>
        </Group>

        {/* Last recorded info */}
        <Text c="dimmed" size="xs" ta="center">
          {lastHandInfo
            ? `最終記録: ${formatRelativeTime(lastHandInfo.recordedAt)}`
            : '記録なし'}
        </Text>
      </Stack>
    </Card>
  )
}
