import { index, primaryKey } from 'drizzle-orm/pg-core'
import type { AdapterAccount } from 'next-auth/adapters'

import { createTable } from './common'
import { users } from './user'

/**
 * Account schema for OAuth provider linking.
 * Links OAuth providers (Google, Discord, etc.) to users.
 *
 * @see data-model.md Section 2. Account (OAuth - NextAuth)
 */
export const accounts = createTable(
  'account',
  (d) => ({
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: d
      .varchar('type', { length: 255 })
      .$type<AdapterAccount['type']>()
      .notNull(),
    provider: d.varchar('provider', { length: 255 }).notNull(),
    providerAccountId: d
      .varchar('provider_account_id', { length: 255 })
      .notNull(),
    refresh_token: d.text('refresh_token'),
    access_token: d.text('access_token'),
    expires_at: d.integer('expires_at'),
    token_type: d.varchar('token_type', { length: 255 }),
    scope: d.varchar('scope', { length: 255 }),
    id_token: d.text('id_token'),
    session_state: d.varchar('session_state', { length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index('account_user_id_idx').on(t.userId),
  ],
)

// Type exports
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
