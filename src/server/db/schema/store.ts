import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'
import { users } from './user'

/**
 * Store schema for poker venues.
 *
 * Represents a poker venue/store where users play sessions.
 * Supports optional location data for Google Maps integration.
 *
 * @see data-model.md Section 8. Store
 */
export const stores = createTable(
  'store',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Owner user - enforces data isolation.
     * Cascades on delete to remove all user's stores.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Store name (e.g., "ABCポーカー渋谷店")
     */
    name: d.varchar('name', { length: 255 }).notNull(),
    /**
     * Street address (optional)
     */
    address: d.text('address'),
    /**
     * Latitude coordinate for map display (-90 to 90)
     */
    latitude: d.numeric('latitude', { precision: 10, scale: 8 }),
    /**
     * Longitude coordinate for map display (-180 to 180)
     */
    longitude: d.numeric('longitude', { precision: 11, scale: 8 }),
    /**
     * Google Places API place ID for precise location
     */
    placeId: d.varchar('place_id', { length: 255 }),
    /**
     * Custom Google Maps URL (takes precedence over generated URL)
     */
    customMapUrl: d.text('custom_map_url'),
    /**
     * Optional notes about the store (HTML supported)
     */
    notes: d.text('notes'),
    /**
     * Archived flag - hides from active lists but preserves data.
     * Different from soft delete (deletedAt).
     */
    isArchived: d.boolean('is_archived').notNull().default(false),
    ...timestampColumns(d),
  }),
  (t) => [
    index('store_user_id_idx').on(t.userId),
    index('store_is_archived_idx').on(t.isArchived),
  ],
)

// Type exports
export type Store = typeof stores.$inferSelect
export type NewStore = typeof stores.$inferInsert
