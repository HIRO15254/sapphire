/**
 * Database schema exports for Poker Session Tracker.
 *
 * This file re-exports all schema definitions and defines relations.
 * Relations are centralized here to avoid circular import issues.
 */

import { relations } from 'drizzle-orm'

export { type Account, accounts, type NewAccount } from './account'
// Export common utilities
export {
  createTable,
  isNotDeleted,
  softDelete,
  timestampColumns,
  type WithTimestamps,
} from './common'
// Export tables
export { type NewUser, type User, users } from './user'
export {
  type NewVerificationToken,
  type VerificationToken,
  verificationTokens,
} from './verificationToken'

// Import tables for relation definitions
import { accounts } from './account'
import { users } from './user'

/**
 * User relations to accounts.
 * Note: sessions table removed - JWT sessions are used instead of database sessions.
 */
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}))

/**
 * Account relations to user.
 */
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))
