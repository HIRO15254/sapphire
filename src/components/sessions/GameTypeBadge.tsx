'use client'

import { Badge, Group, type MantineColor, type MantineSize } from '@mantine/core'
import { IconPokerChip, IconTrophy } from '@tabler/icons-react'

/** Game type identifier */
export type GameType = 'cash_game' | 'cash' | 'tournament' | string | null

/** Check if game type is tournament */
export function isTournament(gameType: GameType): boolean {
  return gameType === 'tournament'
}

/** Get color for game type */
export function getGameTypeColor(gameType: GameType): MantineColor {
  return isTournament(gameType) ? 'grape' : 'blue'
}

/** Get label for game type (always English) */
export function getGameTypeLabel(gameType: GameType): string {
  return isTournament(gameType) ? 'Tournament' : 'Cash'
}

interface GameTypeIconProps {
  gameType: GameType
  size?: number
  colored?: boolean
}

/**
 * Icon component for game type.
 */
export function GameTypeIcon({
  gameType,
  size = 16,
  colored = true,
}: GameTypeIconProps) {
  const color = colored
    ? `var(--mantine-color-${getGameTypeColor(gameType)}-6)`
    : undefined

  if (isTournament(gameType)) {
    return <IconTrophy size={size} style={{ color }} />
  }
  return <IconPokerChip size={size} style={{ color }} />
}

interface GameTypeLabelWithIconProps {
  gameType: GameType
  iconSize?: number
  colored?: boolean
}

/**
 * Icon + label component for game type (used in SegmentedControl, etc.).
 */
export function GameTypeLabelWithIcon({
  gameType,
  iconSize = 16,
  colored = false,
}: GameTypeLabelWithIconProps) {
  return (
    <Group gap={4}>
      <GameTypeIcon gameType={gameType} size={iconSize} colored={colored} />
      <span>{getGameTypeLabel(gameType)}</span>
    </Group>
  )
}

interface GameTypeBadgeProps {
  gameType: GameType
  size?: MantineSize
  /** Show only icon without text label */
  iconOnly?: boolean
}

const ICON_SIZES: Record<MantineSize, number> = {
  xs: 10,
  sm: 10,
  md: 12,
  lg: 12,
  xl: 14,
}

/**
 * Unified badge component for displaying game type (Cash/Tournament).
 * Always uses variant="light" and English labels.
 */
export function GameTypeBadge({
  gameType,
  size = 'sm',
  iconOnly = false,
}: GameTypeBadgeProps) {
  const iconSize = ICON_SIZES[size] ?? 12
  const color = getGameTypeColor(gameType)

  if (iconOnly) {
    return (
      <Badge
        color={color}
        size={size}
        variant="light"
        style={{ paddingLeft: 6, paddingRight: 6 }}
      >
        <GameTypeIcon gameType={gameType} size={iconSize} colored={false} />
      </Badge>
    )
  }

  return (
    <Badge
      color={color}
      leftSection={
        <GameTypeIcon gameType={gameType} size={iconSize} colored={false} />
      }
      size={size}
      variant="light"
    >
      {getGameTypeLabel(gameType)}
    </Badge>
  )
}
