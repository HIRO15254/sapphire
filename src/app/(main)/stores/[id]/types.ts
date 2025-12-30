import type { RouterOutputs } from '~/trpc/react'

export type Store = RouterOutputs['store']['getById']
export type Currency = RouterOutputs['currency']['list']['currencies'][number]
export type CashGame = Store['cashGames'][number]
export type Tournament = Store['tournaments'][number]

export type PrizeItem = {
  prizeType: 'percentage' | 'fixed_amount' | 'custom_prize'
  percentage?: number | null
  fixedAmount?: number | null
  customPrizeLabel?: string | null
  customPrizeValue?: number | null
  sortOrder: number
}

export type PrizeLevel = {
  minPosition: number
  maxPosition: number
  sortOrder: number
  prizeItems: PrizeItem[]
}

export type PrizeStructure = {
  minEntrants: number
  maxEntrants?: number | null
  sortOrder: number
  prizeLevels: PrizeLevel[]
}

export type BlindLevel = {
  level: number
  isBreak: boolean
  smallBlind?: number | null
  bigBlind?: number | null
  ante?: number | null
  durationMinutes: number
}

/**
 * Generate display name for cash game (e.g., "100/200" or "100/200/400/800")
 */
export function generateCashGameDisplayName(game: {
  smallBlind: number
  bigBlind: number
  straddle1?: number | null
  straddle2?: number | null
  ante?: number | null
  anteType?: string | null
}): string {
  const parts = [game.smallBlind.toString(), game.bigBlind.toString()]

  if (game.straddle1) {
    parts.push(game.straddle1.toString())
  }
  if (game.straddle2) {
    parts.push(game.straddle2.toString())
  }

  let displayName = parts.join('/')

  if (game.ante && game.anteType) {
    const anteTypeLabel = game.anteType === 'bb_ante' ? 'BB' : 'All'
    displayName += ` (Ante: ${game.ante} ${anteTypeLabel})`
  }

  return displayName
}
