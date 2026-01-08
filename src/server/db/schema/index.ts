/**
 * Database schema exports for Poker Session Tracker.
 *
 * This file re-exports all schema definitions and defines relations.
 * Relations are centralized here to avoid circular import issues.
 */

import { relations } from 'drizzle-orm'

export { type Account, accounts, type NewAccount } from './account'
export {
  type AllInRecord,
  allInRecords,
  type NewAllInRecord,
} from './allInRecord'
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
  type NewPokerSession,
  type PokerSession,
  pokerSessions,
} from './session'
export {
  type NewSessionEvent,
  SESSION_EVENT_TYPES,
  type SessionEvent,
  type SessionEventType,
  sessionEvents,
} from './sessionEvent'
export {
  type NewStore,
  type Store,
  stores,
} from './store'
export {
  type NewTournament,
  type NewTournamentBlindLevel,
  type NewTournamentPrizeItem,
  type NewTournamentPrizeLevel,
  type NewTournamentPrizeStructure,
  PRIZE_TYPES,
  type PrizeType,
  type Tournament,
  type TournamentBlindLevel,
  type TournamentPrizeItem,
  type TournamentPrizeLevel,
  type TournamentPrizeStructure,
  tournamentBlindLevels,
  tournamentPrizeItems,
  tournamentPrizeLevels,
  tournamentPrizeStructures,
  tournaments,
} from './tournament'
// Export tables
export { type NewUser, type User, users } from './user'
export {
  type NewVerificationToken,
  type VerificationToken,
  verificationTokens,
} from './verificationToken'
export {
  isNotTemporary,
  type NewPlayer,
  type Player,
  players,
} from './player'
export {
  type NewPlayerTag,
  type PlayerTag,
  playerTags,
} from './playerTag'
export {
  type NewPlayerTagAssignment,
  type PlayerTagAssignment,
  playerTagAssignments,
} from './playerTagAssignment'
export {
  type NewPlayerNote,
  type PlayerNote,
  playerNotes,
} from './playerNote'
export {
  type NewSessionTablemate,
  type SessionTablemate,
  sessionTablemates,
} from './sessionTablemate'

// Import tables for relation definitions
import { accounts } from './account'
import { allInRecords } from './allInRecord'
import { bonusTransactions } from './bonusTransaction'
import { cashGames } from './cashGame'
import { currencies } from './currency'
import { purchaseTransactions } from './purchaseTransaction'
import { pokerSessions } from './session'
import { sessionEvents } from './sessionEvent'
import { stores } from './store'
import {
  tournamentBlindLevels,
  tournamentPrizeItems,
  tournamentPrizeLevels,
  tournamentPrizeStructures,
  tournaments,
} from './tournament'
import { users } from './user'
import { players } from './player'
import { playerTags } from './playerTag'
import { playerTagAssignments } from './playerTagAssignment'
import { playerNotes } from './playerNote'
import { sessionTablemates } from './sessionTablemate'

/**
 * User relations to accounts, currencies, stores, games, transactions, sessions, all-ins, and players.
 * Note: authSessions table removed - JWT sessions are used instead of database sessions.
 */
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  currencies: many(currencies),
  bonusTransactions: many(bonusTransactions),
  purchaseTransactions: many(purchaseTransactions),
  stores: many(stores),
  cashGames: many(cashGames),
  tournaments: many(tournaments),
  pokerSessions: many(pokerSessions),
  allInRecords: many(allInRecords),
  sessionEvents: many(sessionEvents),
  players: many(players),
  playerTags: many(playerTags),
  playerNotes: many(playerNotes),
  sessionTablemates: many(sessionTablemates),
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
 * Store relations to user, cash games, tournaments, and sessions.
 */
export const storesRelations = relations(stores, ({ one, many }) => ({
  user: one(users, { fields: [stores.userId], references: [users.id] }),
  cashGames: many(cashGames),
  tournaments: many(tournaments),
  pokerSessions: many(pokerSessions),
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
 * Tournament relations to store, user, currency, prize structures, and blind levels.
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
  prizeStructures: many(tournamentPrizeStructures),
  blindLevels: many(tournamentBlindLevels),
}))

/**
 * TournamentPrizeStructure relations to tournament and prize levels.
 */
export const tournamentPrizeStructuresRelations = relations(
  tournamentPrizeStructures,
  ({ one, many }) => ({
    tournament: one(tournaments, {
      fields: [tournamentPrizeStructures.tournamentId],
      references: [tournaments.id],
    }),
    prizeLevels: many(tournamentPrizeLevels),
  }),
)

/**
 * TournamentPrizeLevel relations to prize structure and prize items.
 */
export const tournamentPrizeLevelsRelations = relations(
  tournamentPrizeLevels,
  ({ one, many }) => ({
    prizeStructure: one(tournamentPrizeStructures, {
      fields: [tournamentPrizeLevels.prizeStructureId],
      references: [tournamentPrizeStructures.id],
    }),
    prizeItems: many(tournamentPrizeItems),
  }),
)

/**
 * TournamentPrizeItem relations to prize level.
 */
export const tournamentPrizeItemsRelations = relations(
  tournamentPrizeItems,
  ({ one }) => ({
    prizeLevel: one(tournamentPrizeLevels, {
      fields: [tournamentPrizeItems.prizeLevelId],
      references: [tournamentPrizeLevels.id],
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

/**
 * PokerSession relations to user, store, cash game, tournament, and all-in records.
 */
export const pokerSessionsRelations = relations(
  pokerSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [pokerSessions.userId],
      references: [users.id],
    }),
    store: one(stores, {
      fields: [pokerSessions.storeId],
      references: [stores.id],
    }),
    cashGame: one(cashGames, {
      fields: [pokerSessions.cashGameId],
      references: [cashGames.id],
    }),
    tournament: one(tournaments, {
      fields: [pokerSessions.tournamentId],
      references: [tournaments.id],
    }),
    allInRecords: many(allInRecords),
    sessionEvents: many(sessionEvents),
    tablemates: many(sessionTablemates),
  }),
)

/**
 * AllInRecord relations to session and user.
 */
export const allInRecordsRelations = relations(allInRecords, ({ one }) => ({
  session: one(pokerSessions, {
    fields: [allInRecords.sessionId],
    references: [pokerSessions.id],
  }),
  user: one(users, {
    fields: [allInRecords.userId],
    references: [users.id],
  }),
}))

/**
 * SessionEvent relations to session and user.
 */
export const sessionEventsRelations = relations(sessionEvents, ({ one }) => ({
  session: one(pokerSessions, {
    fields: [sessionEvents.sessionId],
    references: [pokerSessions.id],
  }),
  user: one(users, {
    fields: [sessionEvents.userId],
    references: [users.id],
  }),
}))

/**
 * Player relations to user, tags, and notes.
 */
export const playersRelations = relations(players, ({ one, many }) => ({
  user: one(users, { fields: [players.userId], references: [users.id] }),
  tagAssignments: many(playerTagAssignments),
  notes: many(playerNotes),
}))

/**
 * PlayerTag relations to user and assignments.
 */
export const playerTagsRelations = relations(playerTags, ({ one, many }) => ({
  user: one(users, { fields: [playerTags.userId], references: [users.id] }),
  assignments: many(playerTagAssignments),
}))

/**
 * PlayerTagAssignment relations to player and tag.
 */
export const playerTagAssignmentsRelations = relations(
  playerTagAssignments,
  ({ one }) => ({
    player: one(players, {
      fields: [playerTagAssignments.playerId],
      references: [players.id],
    }),
    tag: one(playerTags, {
      fields: [playerTagAssignments.tagId],
      references: [playerTags.id],
    }),
  }),
)

/**
 * PlayerNote relations to player and user.
 */
export const playerNotesRelations = relations(playerNotes, ({ one }) => ({
  player: one(players, {
    fields: [playerNotes.playerId],
    references: [players.id],
  }),
  user: one(users, {
    fields: [playerNotes.userId],
    references: [users.id],
  }),
}))

/**
 * SessionTablemate relations to session, player, and user.
 */
export const sessionTablematesRelations = relations(
  sessionTablemates,
  ({ one }) => ({
    session: one(pokerSessions, {
      fields: [sessionTablemates.sessionId],
      references: [pokerSessions.id],
    }),
    player: one(players, {
      fields: [sessionTablemates.playerId],
      references: [players.id],
    }),
    user: one(users, {
      fields: [sessionTablemates.userId],
      references: [users.id],
    }),
  }),
)
