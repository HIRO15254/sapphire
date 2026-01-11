import { eq, sql } from 'drizzle-orm'
import { index, uniqueIndex } from 'drizzle-orm/pg-core'

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
     * Whether this is a temporary player created during a session.
     * Temporary players are created when adding a tablemate and can be:
     * - Converted to a permanent player (isTemporary → false)
     * - Merged with an existing player (data transferred, then deleted)
     * - Deleted when the tablemate leaves
     */
    isTemporary: d.boolean('is_temporary').notNull().default(false),
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
    // Unique constraint: player name must be unique per user for non-temporary, non-deleted players
    uniqueIndex('player_user_id_name_unique_idx')
      .on(t.userId, t.name)
      .where(sql`${t.isTemporary} = false and ${t.deletedAt} is null`),
  ],
)

// Type exports
export type Player = typeof players.$inferSelect
export type NewPlayer = typeof players.$inferInsert

/**
 * Helper to filter out temporary players.
 * Use in queries: where: and(..., isNotTemporary(players.isTemporary))
 */
export const isNotTemporary = (isTemporaryColumn: typeof players.isTemporary) =>
  eq(isTemporaryColumn, false)
