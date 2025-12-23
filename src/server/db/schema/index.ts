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
export {
  type CashGame,
  cashGames,
  type NewCashGame,
} from './cashGame'
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
export {
  type NewStore,
  type Store,
  stores,
} from './store'
export {
  type NewTournament,
  type NewTournamentBlindLevel,
  type NewTournamentPrizeLevel,
  type Tournament,
  type TournamentBlindLevel,
  type TournamentPrizeLevel,
  tournamentBlindLevels,
  tournamentPrizeLevels,
  tournaments,
} from './tournament'
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
import { cashGames } from './cashGame'
import { currencies } from './currency'
import { purchaseTransactions } from './purchaseTransaction'
import { stores } from './store'
import {
  tournamentBlindLevels,
  tournamentPrizeLevels,
  tournaments,
} from './tournament'
import { users } from './user'

/**
 * User relations to accounts, currencies, stores, games, and transactions.
 * Note: sessions table removed - JWT sessions are used instead of database sessions.
 */
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  currencies: many(currencies),
  bonusTransactions: many(bonusTransactions),
  purchaseTransactions: many(purchaseTransactions),
  stores: many(stores),
  cashGames: many(cashGames),
  tournaments: many(tournaments),
}))

/**
 * Account relations to user.
 */
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

/**
 * Currency relations to user, bonus transactions, purchase transactions, and games.
 */
export const currenciesRelations = relations(currencies, ({ one, many }) => ({
  user: one(users, { fields: [currencies.userId], references: [users.id] }),
  bonusTransactions: many(bonusTransactions),
  purchaseTransactions: many(purchaseTransactions),
  cashGames: many(cashGames),
  tournaments: many(tournaments),
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

/**
 * Store relations to user, cash games, and tournaments.
 */
export const storesRelations = relations(stores, ({ one, many }) => ({
  user: one(users, { fields: [stores.userId], references: [users.id] }),
  cashGames: many(cashGames),
  tournaments: many(tournaments),
}))

/**
 * CashGame relations to store, user, and currency.
 */
export const cashGamesRelations = relations(cashGames, ({ one }) => ({
  store: one(stores, {
    fields: [cashGames.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [cashGames.userId],
    references: [users.id],
  }),
  currency: one(currencies, {
    fields: [cashGames.currencyId],
    references: [currencies.id],
  }),
}))

/**
 * Tournament relations to store, user, currency, prize levels, and blind levels.
 */
export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  store: one(stores, {
    fields: [tournaments.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [tournaments.userId],
    references: [users.id],
  }),
  currency: one(currencies, {
    fields: [tournaments.currencyId],
    references: [currencies.id],
  }),
  prizeLevels: many(tournamentPrizeLevels),
  blindLevels: many(tournamentBlindLevels),
}))

/**
 * TournamentPrizeLevel relations to tournament.
 */
export const tournamentPrizeLevelsRelations = relations(
  tournamentPrizeLevels,
  ({ one }) => ({
    tournament: one(tournaments, {
      fields: [tournamentPrizeLevels.tournamentId],
      references: [tournaments.id],
    }),
  }),
)

/**
 * TournamentBlindLevel relations to tournament.
 */
export const tournamentBlindLevelsRelations = relations(
  tournamentBlindLevels,
  ({ one }) => ({
    tournament: one(tournaments, {
      fields: [tournamentBlindLevels.tournamentId],
      references: [tournaments.id],
    }),
  }),
)
