import type { PlayerFilterState } from './types'

/**
 * Player type for filtering purposes.
 * Uses minimal interface to allow flexibility with different player shapes.
 */
interface FilterablePlayer {
  name: string
  tags: { id: string }[]
}

/**
 * Filter players based on filter state.
 *
 * - search: case-insensitive partial match on name
 * - tagIds: AND match — player must have ALL selected tags
 */
export function filterPlayers<T extends FilterablePlayer>(
  players: T[],
  filters: PlayerFilterState,
): T[] {
  return players.filter((player) => {
    // Search filter (case-insensitive partial match)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!player.name.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Tag filter (AND match — player must have ALL selected tags)
    if (filters.tagIds.length > 0) {
      const playerTagIds = new Set(player.tags.map((tag) => tag.id))
      for (const tagId of filters.tagIds) {
        if (!playerTagIds.has(tagId)) {
          return false
        }
      }
    }

    return true
  })
}

/**
 * Check if filters have any active conditions.
 */
export function hasActivePlayerFilters(
  filters: PlayerFilterState,
): boolean {
  return filters.search !== '' || filters.tagIds.length > 0
}
