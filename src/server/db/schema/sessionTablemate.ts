import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'
import { players } from './player'
import { pokerSessions } from './session'
import { users } from './user'

/**
 * SessionTablemate schema for tracking tablemates during a session.
 *
 * Represents opponents at the table during a poker session.
 * Can start as anonymous (just a nickname) and later be linked to an existing Player,
 * or converted into a new Player record.
 *
 * This allows users to:
 * 1. Quickly add tablemates during a live session without creating full player profiles
 * 2. Add temporary notes specific to that session
 * 3. Later link or convert to a Player record for long-term tracking
 */
export const sessionTablemates = createTable(
  'session_tablemate',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Owner user - enforces data isolation.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Session this tablemate belongs to.
     */
    sessionId: d
      .varchar('session_id', { length: 255 })
      .notNull()
      .references(() => pokerSessions.id, { onDelete: 'cascade' }),
    /**
     * Temporary nickname for quick identification.
     * e.g., "赤シャツ", "眼鏡", "Seat 3"
     */
    nickname: d.varchar('nickname', { length: 100 }).notNull(),
    /**
     * Optional seat number (1-10 typically).
     */
    seatNumber: d.integer('seat_number'),
    /**
     * Session-specific notes (plain text).
     * Quick observations during the session.
     */
    sessionNotes: d.text('session_notes'),
    /**
     * Linked player record (optional).
     * NULL means anonymous/unlinked tablemate.
     * Can be set later when user identifies who this person is.
     */
    playerId: d
      .varchar('player_id', { length: 255 })
      .references(() => players.id, { onDelete: 'set null' }),
    ...timestampColumns(d),
  }),
  (t) => [
    index('session_tablemate_user_id_idx').on(t.userId),
    index('session_tablemate_session_id_idx').on(t.sessionId),
    index('session_tablemate_player_id_idx').on(t.playerId),
  ],
)

// Type exports
export type SessionTablemate = typeof sessionTablemates.$inferSelect
export type NewSessionTablemate = typeof sessionTablemates.$inferInsert
