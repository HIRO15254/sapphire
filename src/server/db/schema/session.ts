import { index } from 'drizzle-orm/pg-core'

import { cashGames } from './cashGame'
import { createTable, timestampColumns } from './common'
import { stores } from './store'
import { tournaments } from './tournament'
import { users } from './user'

/**
 * PokerSession schema for recording playing sessions.
 *
 * Represents a poker session at a specific store, which can be either:
 * - Archive (completed session with known buy-in and cashout)
 * - Active (ongoing session in real-time)
 *
 * Sessions can be associated with:
 * - A store (optional but recommended)
 * - A specific cash game or tournament
 *
 * @see data-model.md Section 13. PokerSession
 */
export const pokerSessions = createTable(
  'poker_session',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Owner user - enforces data isolation.
     * Cascades on delete to remove all user's sessions.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Associated store where the session was played.
     * Optional but recommended for location tracking.
     */
    storeId: d
      .varchar('store_id', { length: 255 })
      .references(() => stores.id, { onDelete: 'set null' }),
    /**
     * Game type discriminator: 'cash' or 'tournament'.
     */
    gameType: d.varchar('game_type', { length: 20 }),
    /**
     * Associated cash game (if gameType is 'cash').
     */
    cashGameId: d
      .varchar('cash_game_id', { length: 255 })
      .references(() => cashGames.id, { onDelete: 'set null' }),
    /**
     * Associated tournament (if gameType is 'tournament').
     */
    tournamentId: d
      .varchar('tournament_id', { length: 255 })
      .references(() => tournaments.id, { onDelete: 'set null' }),
    /**
     * True if this is an active (ongoing) session.
     * Only one active session per user should exist.
     */
    isActive: d.boolean('is_active').notNull().default(false),
    /**
     * Session start time.
     * Required for all sessions.
     */
    startTime: d.timestamp('start_time', { withTimezone: true }).notNull(),
    /**
     * Session end time.
     * Null for active sessions, set when session is completed.
     */
    endTime: d.timestamp('end_time', { withTimezone: true }),
    /**
     * Total buy-in amount for the session.
     * For cash games: sum of all buy-ins including rebuys.
     * For tournaments: entry fee + rebuys + add-ons.
     */
    buyIn: d.integer('buy_in').notNull(),
    /**
     * Final cashout amount.
     * Null for active sessions, set when session is completed.
     */
    cashOut: d.integer('cash_out'),
    /**
     * Rich text notes (HTML).
     */
    notes: d.text('notes'),
    ...timestampColumns(d),
  }),
  (t) => [
    index('poker_session_user_id_idx').on(t.userId),
    index('poker_session_store_id_idx').on(t.storeId),
    index('poker_session_start_time_idx').on(t.startTime),
    index('poker_session_is_active_idx').on(t.isActive),
  ],
)

// Type exports
export type PokerSession = typeof pokerSessions.$inferSelect
export type NewPokerSession = typeof pokerSessions.$inferInsert
