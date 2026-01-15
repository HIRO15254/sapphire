/**
 * Type definitions for active session tournament info.
 *
 * Re-exports shared types and defines session-specific tournament types.
 */

// Re-export types from stores types (shared tournament types)
export type {
  BlindLevel,
  PrizeItem,
  PrizeLevel,
  PrizeStructure,
} from '~/app/(main)/stores/[id]/types'

import type {
  BlindLevel,
  PrizeStructure,
} from '~/app/(main)/stores/[id]/types'

/**
 * Tournament basic info override for session-specific settings.
 */
export interface TournamentBasicOverride {
  name?: string | null
  buyIn: number
  rake?: number | null
  startingStack?: number | null
  notes?: string | null
}

/**
 * Merged tournament data for display.
 * Combines store tournament settings with session overrides.
 */
export interface SessionTournamentData {
  // Basic info
  basic: {
    name: string | null
    buyIn: number
    rake: number | null
    startingStack: number | null
    notes: string | null
  }
  // Blind levels (from store or override)
  blindLevels: BlindLevel[]
  // Prize structures (from store or override)
  prizeStructures: PrizeStructure[]
  // Override status for each section
  hasBasicOverride: boolean
  hasBlindsOverride: boolean
  hasPrizesOverride: boolean
}

/**
 * Edit mode for tournament edit modal.
 */
export type TournamentEditMode = 'basic' | 'blind' | 'prize'

/**
 * Edit choice when user clicks edit button.
 */
export type EditChoice = 'store' | 'session'
