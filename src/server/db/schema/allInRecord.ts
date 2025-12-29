import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'
import { pokerSessions } from './session'
import { users } from './user'

/**
 * AllInRecord schema for tracking all-in situations within a session.
 *
 * Records individual all-in occurrences with:
 * - Pot amount at the time of all-in
 * - Win probability (equity percentage)
 * - Actual result (win/loss)
 * - Run it X times support (optional)
 *
 * Used for calculating Expected Value (EV) and tracking luck/variance.
 *
 * Calculations (performed in application layer):
 * - allInEV = Σ(potAmount × winProbability / 100)
 * - For Run it X times: actual win amount = potAmount × (winsInRunout / runItTimes)
 * - actualResultTotal = Σ(actual win amounts)
 * - evDifference = actualResultTotal - allInEV
 *
 * @see data-model.md Section 15. AllInRecord
 */
export const allInRecords = createTable(
  'all_in_record',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Parent session this all-in belongs to.
     * Cascades on delete to remove all session's all-in records.
     */
    sessionId: d
      .varchar('session_id', { length: 255 })
      .notNull()
      .references(() => pokerSessions.id, { onDelete: 'cascade' }),
    /**
     * Owner user - enforces data isolation.
     * Cascades on delete to remove all user's all-in records.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Total pot size at the time of all-in.
     * Used for EV calculation.
     */
    potAmount: d.integer('pot_amount').notNull(),
    /**
     * Win probability (equity) as a percentage.
     * Stored as decimal(5,2) for precision up to 2 decimal places.
     * Range: 0.00 to 100.00
     */
    winProbability: d.numeric('win_probability', { precision: 5, scale: 2 }).notNull(),
    /**
     * Actual outcome of the all-in.
     * For simple all-in: true = won, false = lost.
     * For Run it X times: ignored, use winsInRunout/runItTimes instead.
     */
    actualResult: d.boolean('actual_result').notNull(),
    /**
     * Number of times to run it out (e.g., 2 for "run it twice").
     * null = normal single runout.
     */
    runItTimes: d.integer('run_it_times'),
    /**
     * Number of wins in the runout when using "run it X times".
     * null = normal single runout.
     * Range: 0 to runItTimes.
     */
    winsInRunout: d.integer('wins_in_runout'),
    /**
     * When the all-in was recorded.
     * Defaults to current time but can be backdated for archive sessions.
     */
    recordedAt: d
      .timestamp('recorded_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    ...timestampColumns(d),
  }),
  (t) => [
    index('all_in_record_session_id_idx').on(t.sessionId),
    index('all_in_record_user_id_idx').on(t.userId),
  ],
)

// Type exports
export type AllInRecord = typeof allInRecords.$inferSelect
export type NewAllInRecord = typeof allInRecords.$inferInsert
