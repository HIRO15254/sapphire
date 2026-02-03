/**
 * Player feature constants.
 *
 * These constants are centralized here for reuse across the feature.
 */

import type { PlayerFilterState } from './types'

/** Default filter state */
export const defaultPlayerFilters: PlayerFilterState = {
  search: '',
  tagIds: [],
}
