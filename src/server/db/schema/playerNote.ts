import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'
import { players } from './player'
import { users } from './user'

/**
 * PlayerNote schema for date-specific observations.
 *
 * Allows users to record notes about a player on specific dates.
 * Useful for tracking playing patterns, tendencies, or notable
 * events observed during particular sessions.
 *
 * @see data-model.md Section 19. PlayerNote
 */
export const playerNotes = createTable(
  'player_note',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * The player this note is about.
     * Cascades on delete to remove notes when player is deleted.
     */
    playerId: d
      .varchar('player_id', { length: 255 })
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    /**
     * Owner user - enforces data isolation.
     * Cascades on delete to remove all user's notes.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * The date of observation (YYYY-MM-DD format).
     * Multiple notes can exist for the same date.
     */
    noteDate: d.date('note_date').notNull(),
    /**
     * The note content (text or HTML for rich text).
     */
    content: d.text('content').notNull(),
    ...timestampColumns(d),
  }),
  (t) => [
    index('player_note_player_id_idx').on(t.playerId),
    index('player_note_note_date_idx').on(t.noteDate),
  ],
)

// Type exports
export type PlayerNote = typeof playerNotes.$inferSelect
export type NewPlayerNote = typeof playerNotes.$inferInsert
