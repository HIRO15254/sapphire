/**
 * Database schema exports for Poker Session Tracker.
 *
 * This file re-exports all schema definitions and defines relations.
 * Relations are centralized here to avoid circular import issues.
 */

import { relations } from 'drizzle-orm'

export { type Account, accounts, type NewAccount } from './account'
export {
  type BonusTransaction,
  bonusTransactions,
  type NewBonusTransaction,
} from './bonusTransaction'
// Export common utilities
export {
  createTable,
  isNotDeleted,
  softDelete,
  timestampColumns,
  type WithTimestamps,
} from './common'
export {
  type Currency,
  currencies,
  type NewCurrency,
} from './currency'
export {
  type NewPurchaseTransaction,
  type PurchaseTransaction,
  purchaseTransactions,
} from './purchaseTransaction'
// Export tables
export { type NewUser, type User, users } from './user'
export {
  type NewVerificationToken,
  type VerificationToken,
  verificationTokens,
} from './verificationToken'

// Import tables for relation definitions
import { accounts } from './account'
import { bonusTransactions } from './bonusTransaction'
import { currencies } from './currency'
import { purchaseTransactions } from './purchaseTransaction'
import { users } from './user'

/**
 * User relations to accounts, currencies, and transactions.
 * Note: sessions table removed - JWT sessions are used instead of database sessions.
 */
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  currencies: many(currencies),
  bonusTransactions: many(bonusTransactions),
  purchaseTransactions: many(purchaseTransactions),
}))

/**
 * Account relations to user.
 */
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

/**
 * Currency relations to user, bonus transactions, and purchase transactions.
 */
export const currenciesRelations = relations(currencies, ({ one, many }) => ({
  user: one(users, { fields: [currencies.userId], references: [users.id] }),
  bonusTransactions: many(bonusTransactions),
  purchaseTransactions: many(purchaseTransactions),
}))

/**
 * BonusTransaction relations to currency and user.
 */
export const bonusTransactionsRelations = relations(
  bonusTransactions,
  ({ one }) => ({
    currency: one(currencies, {
      fields: [bonusTransactions.currencyId],
      references: [currencies.id],
    }),
    user: one(users, {
      fields: [bonusTransactions.userId],
      references: [users.id],
    }),
  }),
)

/**
 * PurchaseTransaction relations to currency and user.
 */
export const purchaseTransactionsRelations = relations(
  purchaseTransactions,
  ({ one }) => ({
    currency: one(currencies, {
      fields: [purchaseTransactions.currencyId],
      references: [currencies.id],
    }),
    user: one(users, {
      fields: [purchaseTransactions.userId],
      references: [users.id],
    }),
  }),
)
