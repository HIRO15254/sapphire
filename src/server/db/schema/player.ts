import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'
import { users } from './user'

/**
 * Player schema for opponent tracking.
 *
 * Represents a poker opponent/player that the user wants to track.
 * Players can have tags for categorization and date-specific notes
 * for observations made on particular days.
 *
 * @see data-model.md Section 16. Player
 */
export const players = createTable(
  'player',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Owner user - enforces data isolation.
     * Cascades on delete to remove all user's players.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Player name/nickname (e.g., "田中太郎", "タイトおじさん")
     */
    name: d.varchar('name', { length: 255 }).notNull(),
    /**
     * General notes about this player (HTML format for rich text).
     * For ongoing observations that aren't date-specific.
     */
    generalNotes: d.text('general_notes'),
    ...timestampColumns(d),
  }),
  (t) => [
    index('player_user_id_idx').on(t.userId),
    index('player_name_idx').on(t.name),
  ],
)

// Type exports
export type Player = typeof players.$inferSelect
export type NewPlayer = typeof players.$inferInsert
