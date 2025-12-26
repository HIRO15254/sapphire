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
 * Prize type enum values for tournament prize items.
 * - percentage: プライズプールの何%が得られるか
 * - fixed_amount: バイインと同じ仮想通貨の特定数量
 * - custom_prize: カスタムプライズ（説明文と換算価値）
 */
export const PRIZE_TYPES = [
  'percentage',
  'fixed_amount',
  'custom_prize',
] as const
export type PrizeType = (typeof PRIZE_TYPES)[number]

/**
 * TournamentPrizeStructure schema for entry count ranges.
 *
 * Each tournament can have multiple prize structures for different entry count ranges.
 *
 * @see data-model.md Section 11. TournamentPrizeStructure
 */
export const tournamentPrizeStructures = createTable(
  'tournament_prize_structure',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Parent tournament - required reference.
     * Cascades on delete to remove all tournament's prize structures.
     */
    tournamentId: d
      .varchar('tournament_id', { length: 255 })
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    /**
     * Minimum number of entrants for this structure (a人から)
     */
    minEntrants: d.integer('min_entrants').notNull(),
    /**
     * Maximum number of entrants for this structure (b人まで, null = no limit)
     */
    maxEntrants: d.integer('max_entrants'),
    /**
     * Display order
     */
    sortOrder: d.integer('sort_order').notNull().default(0),
    /**
     * Created timestamp
     */
    createdAt: d
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    index('tournament_prize_structure_tournament_id_idx').on(t.tournamentId),
    index('tournament_prize_structure_sort_order_idx').on(t.sortOrder),
  ],
)

// Type exports
export type TournamentPrizeStructure =
  typeof tournamentPrizeStructures.$inferSelect
export type NewTournamentPrizeStructure =
  typeof tournamentPrizeStructures.$inferInsert

/**
 * TournamentPrizeLevel schema for position ranges within a prize structure.
 *
 * Each prize structure can have multiple prize levels for different position ranges.
 *
 * @see data-model.md Section 11a. TournamentPrizeLevel
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
     * Parent prize structure - required reference.
     * Cascades on delete to remove all structure's prize levels.
     */
    prizeStructureId: d
      .varchar('prize_structure_id', { length: 255 })
      .notNull()
      .references(() => tournamentPrizeStructures.id, { onDelete: 'cascade' }),
    /**
     * Starting position of the range (a位から)
     */
    minPosition: d.integer('min_position').notNull(),
    /**
     * Ending position of the range (b位まで)
     */
    maxPosition: d.integer('max_position').notNull(),
    /**
     * Display order
     */
    sortOrder: d.integer('sort_order').notNull().default(0),
    /**
     * Created timestamp
     */
    createdAt: d
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    index('tournament_prize_level_structure_id_idx').on(t.prizeStructureId),
    index('tournament_prize_level_sort_order_idx').on(t.sortOrder),
  ],
)

// Type exports
export type TournamentPrizeLevel = typeof tournamentPrizeLevels.$inferSelect
export type NewTournamentPrizeLevel = typeof tournamentPrizeLevels.$inferInsert

/**
 * TournamentPrizeItem schema for individual prizes within a prize level.
 *
 * Each prize level can have multiple prize items (percentage, fixed amount, custom prize).
 *
 * @see data-model.md Section 11b. TournamentPrizeItem
 */
export const tournamentPrizeItems = createTable(
  'tournament_prize_item',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Parent prize level - required reference.
     * Cascades on delete to remove all level's prize items.
     */
    prizeLevelId: d
      .varchar('prize_level_id', { length: 255 })
      .notNull()
      .references(() => tournamentPrizeLevels.id, { onDelete: 'cascade' }),
    /**
     * Prize type: 'percentage', 'fixed_amount', or 'custom_prize'
     */
    prizeType: d.varchar('prize_type', { length: 20 }).notNull(),
    /**
     * Prize percentage of total pool (0-100)
     * Used when prizeType = 'percentage'
     */
    percentage: d.numeric('percentage', { precision: 5, scale: 2 }),
    /**
     * Fixed prize amount in virtual currency
     * Used when prizeType = 'fixed_amount'
     */
    fixedAmount: d.integer('fixed_amount'),
    /**
     * Custom prize description label
     * Used when prizeType = 'custom_prize'
     */
    customPrizeLabel: d.text('custom_prize_label'),
    /**
     * Custom prize value in virtual currency equivalent
     * Used when prizeType = 'custom_prize'
     */
    customPrizeValue: d.integer('custom_prize_value'),
    /**
     * Display order
     */
    sortOrder: d.integer('sort_order').notNull().default(0),
    /**
     * Created timestamp
     */
    createdAt: d
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    index('tournament_prize_item_level_id_idx').on(t.prizeLevelId),
    index('tournament_prize_item_sort_order_idx').on(t.sortOrder),
  ],
)

// Type exports
export type TournamentPrizeItem = typeof tournamentPrizeItems.$inferSelect
export type NewTournamentPrizeItem = typeof tournamentPrizeItems.$inferInsert

/**
 * TournamentBlindLevel schema for tournament blind structures.
 *
 * Defines blind levels with SB/BB, optional ante, duration, and break support.
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
     * Whether this is a break (休憩) instead of a blind level
     */
    isBreak: d.boolean('is_break').notNull().default(false),
    /**
     * Small blind amount for this level (nullable for breaks)
     */
    smallBlind: d.integer('small_blind'),
    /**
     * Big blind amount for this level (nullable for breaks)
     */
    bigBlind: d.integer('big_blind'),
    /**
     * Optional ante amount for this level
     */
    ante: d.integer('ante'),
    /**
     * Duration of this level/break in minutes
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
