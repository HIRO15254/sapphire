import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'

import { isNotDeleted, stores, tournaments } from '~/server/db/schema'
import {
  getTournamentByIdSchema,
  listTournamentsByStoreSchema,
} from '../../schemas/tournament.schema'
import { createTRPCRouter, protectedProcedure } from '../../trpc'

/**
 * Tournament query procedures.
 */
export const tournamentQueries = createTRPCRouter({
  /**
   * List tournaments for a specific store.
   */
  listByStore: protectedProcedure
    .input(listTournamentsByStoreSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify store ownership
      const store = await ctx.db.query.stores.findFirst({
        where: and(
          eq(stores.id, input.storeId),
          eq(stores.userId, userId),
          isNotDeleted(stores.deletedAt),
        ),
      })

      if (!store) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '店舗が見つかりません',
        })
      }

      const conditions = [
        eq(tournaments.storeId, input.storeId),
        isNotDeleted(tournaments.deletedAt),
      ]

      if (!input.includeArchived) {
        conditions.push(eq(tournaments.isArchived, false))
      }

      const tournamentList = await ctx.db.query.tournaments.findMany({
        where: and(...conditions),
        with: {
          currency: true,
        },
        orderBy: [desc(tournaments.createdAt)],
      })

      return {
        tournaments: tournamentList.map((tournament) => ({
          ...tournament,
          currencyName: tournament.currency?.name,
        })),
      }
    }),

  /**
   * Get a single tournament by ID with prize structures and blind levels.
   */
  getById: protectedProcedure
    .input(getTournamentByIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const tournament = await ctx.db.query.tournaments.findFirst({
        where: and(
          eq(tournaments.id, input.id),
          eq(tournaments.userId, userId),
          isNotDeleted(tournaments.deletedAt),
        ),
        with: {
          store: true,
          currency: true,
          prizeStructures: {
            orderBy: (structures, { asc }) => [asc(structures.sortOrder)],
            with: {
              prizeLevels: {
                orderBy: (levels, { asc }) => [asc(levels.sortOrder)],
                with: {
                  prizeItems: {
                    orderBy: (items, { asc }) => [asc(items.sortOrder)],
                  },
                },
              },
            },
          },
          blindLevels: {
            orderBy: (levels, { asc }) => [asc(levels.level)],
          },
        },
      })

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'トーナメントが見つかりません',
        })
      }

      return {
        ...tournament,
        storeName: tournament.store?.name,
      }
    }),
})
