import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'
import { currencies } from './currency'
import { stores } from './store'
import { users } from './user'

/**
 * CashGame schema for cash game configurations at stores.
 *
 * Represents a specific cash game setup with blinds, straddles, and ante.
 * Each cash game belongs to a store and optionally uses a currency.
 *
 * @see data-model.md Section 9. CashGame
 */
export const cashGames = createTable(
  'cash_game',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Parent store - required reference.
     * Cascades on delete to remove all store's cash games.
     */
    storeId: d
      .varchar('store_id', { length: 255 })
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    /**
     * Owner user - enforces data isolation.
     * Cascades on delete to remove all user's cash games.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Optional currency for this cash game.
     * Null means real money or currency not tracked.
     */
    currencyId: d
      .varchar('currency_id', { length: 255 })
      .references(() => currencies.id, { onDelete: 'set null' }),
    /**
     * Small blind amount (e.g., 100 for 100/200 game)
     */
    smallBlind: d.integer('small_blind').notNull(),
    /**
     * Big blind amount (must be > smallBlind)
     */
    bigBlind: d.integer('big_blind').notNull(),
    /**
     * Optional first straddle amount (must be > bigBlind)
     */
    straddle1: d.integer('straddle1'),
    /**
     * Optional second straddle amount (must be > straddle1)
     */
    straddle2: d.integer('straddle2'),
    /**
     * Optional ante amount
     */
    ante: d.integer('ante'),
    /**
     * Ante type: 'all_ante' (everyone pays) or 'bb_ante' (BB pays all antes)
     * Required if ante is set.
     */
    anteType: d.varchar('ante_type', { length: 20 }),
    /**
     * Optional notes about this cash game configuration
     */
    notes: d.text('notes'),
    /**
     * Archived flag - hides from active lists but preserves data.
     */
    isArchived: d.boolean('is_archived').notNull().default(false),
    /**
     * Display order for drag-and-drop sorting.
     * Lower values appear first.
     */
    sortOrder: d.integer('sort_order').notNull().default(0),
    ...timestampColumns(d),
  }),
  (t) => [
    index('cash_game_store_id_idx').on(t.storeId),
    index('cash_game_user_id_idx').on(t.userId),
    index('cash_game_currency_id_idx').on(t.currencyId),
    index('cash_game_is_archived_idx').on(t.isArchived),
    index('cash_game_sort_order_idx').on(t.sortOrder),
  ],
)

// Type exports
export type CashGame = typeof cashGames.$inferSelect
export type NewCashGame = typeof cashGames.$inferInsert
