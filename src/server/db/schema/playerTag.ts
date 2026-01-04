import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'
import { users } from './user'

/**
 * PlayerTag schema for categorizing players.
 *
 * User-defined tags that can be assigned to players for
 * quick identification and filtering (e.g., "アグレッシブ", "タイト", "ブラフ多め").
 *
 * @see data-model.md Section 17. PlayerTag
 */
export const playerTags = createTable(
  'player_tag',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Owner user - enforces data isolation.
     * Cascades on delete to remove all user's tags.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Tag name (e.g., "アグレッシブ", "タイト")
     */
    name: d.varchar('name', { length: 100 }).notNull(),
    /**
     * Optional hex color code for visual distinction (e.g., "#FF5733")
     */
    color: d.varchar('color', { length: 7 }),
    ...timestampColumns(d),
  }),
  (t) => [
    index('player_tag_user_id_idx').on(t.userId),
    // Unique constraint on (userId, name) where deletedAt IS NULL handled at application level
  ],
)

// Type exports
export type PlayerTag = typeof playerTags.$inferSelect
export type NewPlayerTag = typeof playerTags.$inferInsert
