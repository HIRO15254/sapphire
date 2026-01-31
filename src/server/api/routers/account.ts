import { eq } from 'drizzle-orm'

import { accounts, users } from '~/server/db/schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * Account router for managing linked login methods.
 * Provides queries for retrieving linked OAuth providers and password status.
 */
export const accountRouter = createTRPCRouter({
  /**
   * Get all linked accounts and password status for the current user.
   */
  getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const [linkedAccounts, user] = await Promise.all([
      ctx.db
        .select({
          provider: accounts.provider,
          providerAccountId: accounts.providerAccountId,
        })
        .from(accounts)
        .where(eq(accounts.userId, userId)),
      ctx.db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { passwordHash: true },
      }),
    ])

    return {
      providers: linkedAccounts.map((a) => ({
        provider: a.provider,
        providerAccountId: a.providerAccountId,
      })),
      hasPassword: !!user?.passwordHash,
    }
  }),
})
