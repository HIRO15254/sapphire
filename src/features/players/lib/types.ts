/**
 * Player feature type definitions.
 *
 * These types are centralized here for reuse across the feature.
 */

/** Filter state for player list filtering */
export interface PlayerFilterState {
  search: string
  tagIds: string[]
}

/** Tag option for filter select and display */
export interface TagOption {
  id: string
  name: string
  color: string | null
}

/** Player data structure for list display */
export interface PlayerListItem {
  id: string
  name: string
  tags: TagOption[]
  createdAt: Date
  updatedAt: Date | null
}
