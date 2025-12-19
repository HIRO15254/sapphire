import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'
import { currencies } from './currency'
import { users } from './user'

/**
 * BonusTransaction schema for bonus currency received.
 *
 * Records bonuses received from various sources (friend referrals,
 * promotions, campaigns, etc.). Always positive amounts.
 *
 * @see data-model.md Section 6. BonusTransaction
 */
export const bonusTransactions = createTable(
  'bonus_transaction',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Associated currency for this bonus.
     * Cascades on delete.
     */
    currencyId: d
      .varchar('currency_id', { length: 255 })
      .notNull()
      .references(() => currencies.id, { onDelete: 'cascade' }),
    /**
     * Owner user - enforces data isolation.
     * Cascades on delete.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Bonus amount (always positive).
     */
    amount: d.integer('amount').notNull(),
    /**
     * Source description (e.g., "友達紹介", "キャンペーン", "デイリーボーナス")
     * Optional - for user's reference.
     */
    source: d.varchar('source', { length: 255 }),
    /**
     * Date when bonus was received.
     * Defaults to now, but can be backdated.
     */
    transactionDate: d
      .timestamp('transaction_date', { withTimezone: true })
      .notNull()
      .defaultNow(),
    ...timestampColumns(d),
  }),
  (t) => [
    index('bonus_transaction_currency_id_idx').on(t.currencyId),
    index('bonus_transaction_user_id_idx').on(t.userId),
    index('bonus_transaction_date_idx').on(t.transactionDate),
  ],
)

// Type exports
export type BonusTransaction = typeof bonusTransactions.$inferSelect
export type NewBonusTransaction = typeof bonusTransactions.$inferInsert
