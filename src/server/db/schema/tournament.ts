import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'
import { currencies } from './currency'
import { stores } from './store'
import { users } from './user'

/**
 * Tournament schema for tournament configurations at stores.
 *
 * Represents a tournament setup with buy-in and optional blind/prize structures.
 * Each tournament belongs to a store and optionally uses a currency.
 *
 * @see data-model.md Section 10. Tournament
 */
export const tournaments = createTable(
  'tournament',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Parent store - required reference.
     * Cascades on delete to remove all store's tournaments.
     */
    storeId: d
      .varchar('store_id', { length: 255 })
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    /**
     * Owner user - enforces data isolation.
     * Cascades on delete to remove all user's tournaments.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Optional currency for this tournament.
     * Null means real money or currency not tracked.
     */
    currencyId: d
      .varchar('currency_id', { length: 255 })
      .references(() => currencies.id, { onDelete: 'set null' }),
    /**
     * Tournament name (e.g., "サンデートーナメント")
     * Optional - can be identified by buyIn alone.
     */
    name: d.varchar('name', { length: 255 }),
    /**
     * Buy-in amount (required) - total amount paid
     */
    buyIn: d.integer('buy_in').notNull(),
    /**
     * Rake amount included in buy-in (optional)
     * Prize pool contribution = buyIn - rake
     */
    rake: d.integer('rake'),
    /**
     * Starting stack size (optional)
     */
    startingStack: d.integer('starting_stack'),
    /**
     * Optional notes about this tournament
     */
    notes: d.text('notes'),
    /**
     * Archived flag - hides from active lists but preserves data.
     */
    isArchived: d.boolean('is_archived').notNull().default(false),
    ...timestampColumns(d),
  }),
  (t) => [
    index('tournament_store_id_idx').on(t.storeId),
    index('tournament_user_id_idx').on(t.userId),
    index('tournament_currency_id_idx').on(t.currencyId),
    index('tournament_is_archived_idx').on(t.isArchived),
  ],
)

// Type exports
export type Tournament = typeof tournaments.$inferSelect
export type NewTournament = typeof tournaments.$inferInsert

/**
 * TournamentPrizeLevel schema for tournament prize structures.
 *
 * Defines prize payouts by position (percentage or fixed amount).
 *
 * @see data-model.md Section 11. TournamentPrizeLevel
 */
export const tournamentPrizeLevels = createTable(
  'tournament_prize_level',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Parent tournament - required reference.
     * Cascades on delete to remove all tournament's prize levels.
     */
    tournamentId: d
      .varchar('tournament_id', { length: 255 })
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    /**
     * Finishing position (1st, 2nd, 3rd, etc.)
     */
    position: d.integer('position').notNull(),
    /**
     * Prize percentage of total pool (0-100)
     * Either percentage or fixedAmount should be set.
     */
    percentage: d.numeric('percentage', { precision: 5, scale: 2 }),
    /**
     * Fixed prize amount
     * Either percentage or fixedAmount should be set.
     */
    fixedAmount: d.integer('fixed_amount'),
    /**
     * Created timestamp
     */
    createdAt: d
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    index('tournament_prize_level_tournament_id_idx').on(t.tournamentId),
    index('tournament_prize_level_position_idx').on(t.position),
  ],
)

// Type exports
export type TournamentPrizeLevel = typeof tournamentPrizeLevels.$inferSelect
export type NewTournamentPrizeLevel = typeof tournamentPrizeLevels.$inferInsert

/**
 * TournamentBlindLevel schema for tournament blind structures.
 *
 * Defines blind levels with SB/BB, optional ante, and duration.
 *
 * @see data-model.md Section 12. TournamentBlindLevel
 */
export const tournamentBlindLevels = createTable(
  'tournament_blind_level',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Parent tournament - required reference.
     * Cascades on delete to remove all tournament's blind levels.
     */
    tournamentId: d
      .varchar('tournament_id', { length: 255 })
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    /**
     * Blind level number (1, 2, 3, etc.)
     */
    level: d.integer('level').notNull(),
    /**
     * Small blind amount for this level
     */
    smallBlind: d.integer('small_blind').notNull(),
    /**
     * Big blind amount for this level (must be > smallBlind)
     */
    bigBlind: d.integer('big_blind').notNull(),
    /**
     * Optional ante amount for this level
     */
    ante: d.integer('ante'),
    /**
     * Duration of this level in minutes
     */
    durationMinutes: d.integer('duration_minutes').notNull(),
    /**
     * Created timestamp
     */
    createdAt: d
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    index('tournament_blind_level_tournament_id_idx').on(t.tournamentId),
    index('tournament_blind_level_level_idx').on(t.level),
  ],
)

// Type exports
export type TournamentBlindLevel = typeof tournamentBlindLevels.$inferSelect
export type NewTournamentBlindLevel = typeof tournamentBlindLevels.$inferInsert
