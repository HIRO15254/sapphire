import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'
import { users } from './user'

/**
 * Currency schema for virtual currencies at amusement poker venues.
 *
 * Represents a virtual currency/chip balance at a specific poker venue.
 * Balance is calculated via database VIEW aggregating:
 * - Initial balance
 * - Bonus transactions (+)
 * - Purchase transactions (+)
 * - Session buy-ins (-)
 * - Session cashouts (+)
 *
 * @see data-model.md Section 5. Currency
 */
export const currencies = createTable(
  'currency',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Owner user - enforces data isolation.
     * Cascades on delete to remove all user's currencies.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Currency name (e.g., "ABC Poker Chips", "XYZアミューズメントチップ")
     */
    name: d.varchar('name', { length: 255 }).notNull(),
    /**
     * Starting balance when currency was created.
     * Used as base for balance calculations.
     */
    initialBalance: d.integer('initial_balance').notNull().default(0),
    /**
     * Archived flag - hides from active lists but preserves data.
     * Different from soft delete (deletedAt).
     */
    isArchived: d.boolean('is_archived').notNull().default(false),
    ...timestampColumns(d),
  }),
  (t) => [
    index('currency_user_id_idx').on(t.userId),
    index('currency_is_archived_idx').on(t.isArchived),
  ],
)

// Type exports
export type Currency = typeof currencies.$inferSelect
export type NewCurrency = typeof currencies.$inferInsert
