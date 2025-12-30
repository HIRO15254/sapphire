import { index } from 'drizzle-orm/pg-core'

import { createTable, timestampColumns } from './common'

/**
 * User schema for authentication.
 * Extended with passwordHash for credentials provider support.
 *
 * @see data-model.md Section 1. User (Authentication)
 */
export const users = createTable(
  'user',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar('name', { length: 255 }),
    email: d.varchar('email', { length: 255 }).notNull(),
    emailVerified: d.timestamp('email_verified', {
      mode: 'date',
      withTimezone: true,
    }),
    image: d.varchar('image', { length: 255 }),
    /**
     * Password hash for credentials authentication (email/password).
     * Nullable because OAuth users don't have passwords.
     * Uses bcrypt with 10 rounds.
     */
    passwordHash: d.varchar('password_hash', { length: 255 }),
    ...timestampColumns(d),
  }),
  (t) => [index('user_email_idx').on(t.email)],
)

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
