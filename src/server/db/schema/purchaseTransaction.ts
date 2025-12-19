import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'
import { currencies } from './currency'
import { users } from './user'

/**
 * PurchaseTransaction schema for currency purchases.
 *
 * Records currency purchased with real money or other means.
 * Always positive amounts.
 *
 * @see data-model.md Section 7. PurchaseTransaction
 */
export const purchaseTransactions = createTable(
  'purchase_transaction',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Associated currency for this purchase.
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
     * Purchase amount (always positive).
     */
    amount: d.integer('amount').notNull(),
    /**
     * Optional note for this purchase (e.g., "月次購入", "特別セール")
     */
    note: d.text('note'),
    /**
     * Date when purchase was made.
     * Defaults to now, but can be backdated.
     */
    transactionDate: d
      .timestamp('transaction_date', { withTimezone: true })
      .notNull()
      .defaultNow(),
    ...timestampColumns(d),
  }),
  (t) => [
    index('purchase_transaction_currency_id_idx').on(t.currencyId),
    index('purchase_transaction_user_id_idx').on(t.userId),
    index('purchase_transaction_date_idx').on(t.transactionDate),
  ],
)

// Type exports
export type PurchaseTransaction = typeof purchaseTransactions.$inferSelect
export type NewPurchaseTransaction = typeof purchaseTransactions.$inferInsert
