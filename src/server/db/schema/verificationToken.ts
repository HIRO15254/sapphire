import { primaryKey } from 'drizzle-orm/pg-core'

import { createTable } from './common'

/**
 * VerificationToken schema for email verification.
 * Used by NextAuth.js for email verification flow.
 *
 * @see data-model.md Section 4. VerificationToken (NextAuth)
 */
export const verificationTokens = createTable(
  'verification_token',
  (d) => ({
    identifier: d.varchar('identifier', { length: 255 }).notNull(),
    token: d.varchar('token', { length: 255 }).notNull(),
    expires: d
      .timestamp('expires', { mode: 'date', withTimezone: true })
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
)

// Type exports
export type VerificationToken = typeof verificationTokens.$inferSelect
export type NewVerificationToken = typeof verificationTokens.$inferInsert
