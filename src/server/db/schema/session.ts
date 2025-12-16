import { index } from 'drizzle-orm/pg-core'

import { createTable } from './common'
import { users } from './user'

/**
 * AuthSession schema for database session management.
 * Used by NextAuth.js for database session strategy.
 *
 * @see data-model.md Section 3. AuthSession (NextAuth)
 */
export const sessions = createTable(
  'session',
  (d) => ({
    sessionToken: d
      .varchar('session_token', { length: 255 })
      .notNull()
      .primaryKey(),
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: d
      .timestamp('expires', { mode: 'date', withTimezone: true })
      .notNull(),
  }),
  (t) => [
    index('session_user_id_idx').on(t.userId),
    index('session_expires_idx').on(t.expires),
  ],
)

// Type exports
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
