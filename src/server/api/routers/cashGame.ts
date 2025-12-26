import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'

import { cashGames, isNotDeleted, softDelete, stores } from '~/server/db/schema'
import {
  archiveCashGameSchema,
  createCashGameSchema,
  deleteCashGameSchema,
  getCashGameByIdSchema,
  listCashGamesByStoreSchema,
  updateCashGameSchema,
} from '../schemas/cashGame.schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * Generate display name for cash game (e.g., "100/200" or "100/200/400/800")
 */
function generateDisplayName(game: {
  smallBlind: number
  bigBlind: number
  straddle1?: number | null
  straddle2?: number | null
  ante?: number | null
  anteType?: string | null
}): string {
  const parts = [game.smallBlind.toString(), game.bigBlind.toString()]

  if (game.straddle1) {
    parts.push(game.straddle1.toString())
  }
  if (game.straddle2) {
    parts.push(game.straddle2.toString())
  }

  let displayName = parts.join('/')

  if (game.ante && game.anteType) {
    const anteTypeLabel = game.anteType === 'bb_ante' ? 'BB' : 'All'
    displayName += ` (Ante: ${game.ante} ${anteTypeLabel})`
  }

  return displayName
}

/**
 * CashGame router for managing cash game configurations.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId.
 *
 * @see data-model.md Section 9. CashGame
 */
export const cashGameRouter = createTRPCRouter({
  // ============================================================================
  // Cash Game CRUD
  // ============================================================================

  /**
   * List cash games for a specific store.
   */
  listByStore: protectedProcedure
    .input(listCashGamesByStoreSchema)
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
        eq(cashGames.storeId, input.storeId),
        isNotDeleted(cashGames.deletedAt),
      ]

      if (!input.includeArchived) {
        conditions.push(eq(cashGames.isArchived, false))
      }

      const cashGameList = await ctx.db.query.cashGames.findMany({
        where: and(...conditions),
        with: {
          currency: true,
        },
        orderBy: [desc(cashGames.createdAt)],
      })

      return {
        cashGames: cashGameList.map((game) => ({
          ...game,
          currencyName: game.currency?.name,
          displayName: generateDisplayName(game),
        })),
      }
    }),

  /**
   * Get a single cash game by ID.
   */
  getById: protectedProcedure
    .input(getCashGameByIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const cashGame = await ctx.db.query.cashGames.findFirst({
        where: and(
          eq(cashGames.id, input.id),
          eq(cashGames.userId, userId),
          isNotDeleted(cashGames.deletedAt),
        ),
        with: {
          store: true,
          currency: true,
        },
      })

      if (!cashGame) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'キャッシュゲームが見つかりません',
        })
      }

      return {
        ...cashGame,
        storeName: cashGame.store?.name,
        displayName: generateDisplayName(cashGame),
      }
    }),

  /**
   * Create a new cash game.
   */
  create: protectedProcedure
    .input(createCashGameSchema)
    .mutation(async ({ ctx, input }) => {
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
          code: 'BAD_REQUEST',
          message: '指定された店舗が存在しません',
        })
      }

      const [newCashGame] = await ctx.db
        .insert(cashGames)
        .values({
          storeId: input.storeId,
          userId,
          currencyId: input.currencyId,
          smallBlind: input.smallBlind,
          bigBlind: input.bigBlind,
          straddle1: input.straddle1,
          straddle2: input.straddle2,
          ante: input.ante,
          anteType: input.anteType,
          notes: input.notes,
        })
        .returning()

      return newCashGame
    }),

  /**
   * Update an existing cash game.
   */
  update: protectedProcedure
    .input(updateCashGameSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.cashGames.findFirst({
        where: and(
          eq(cashGames.id, input.id),
          eq(cashGames.userId, userId),
          isNotDeleted(cashGames.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'キャッシュゲームが見つかりません',
        })
      }

      const updateData: Partial<typeof cashGames.$inferInsert> = {}
      if (input.currencyId !== undefined)
        updateData.currencyId = input.currencyId
      if (input.smallBlind !== undefined)
        updateData.smallBlind = input.smallBlind
      if (input.bigBlind !== undefined) updateData.bigBlind = input.bigBlind
      if (input.straddle1 !== undefined) updateData.straddle1 = input.straddle1
      if (input.straddle2 !== undefined) updateData.straddle2 = input.straddle2
      if (input.ante !== undefined) updateData.ante = input.ante
      if (input.anteType !== undefined) updateData.anteType = input.anteType
      if (input.notes !== undefined) updateData.notes = input.notes

      const [updated] = await ctx.db
        .update(cashGames)
        .set(updateData)
        .where(eq(cashGames.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Archive or unarchive a cash game.
   */
  archive: protectedProcedure
    .input(archiveCashGameSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.cashGames.findFirst({
        where: and(
          eq(cashGames.id, input.id),
          eq(cashGames.userId, userId),
          isNotDeleted(cashGames.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'キャッシュゲームが見つかりません',
        })
      }

      const [updated] = await ctx.db
        .update(cashGames)
        .set({ isArchived: input.isArchived })
        .where(eq(cashGames.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Delete a cash game (soft delete).
   */
  delete: protectedProcedure
    .input(deleteCashGameSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.cashGames.findFirst({
        where: and(
          eq(cashGames.id, input.id),
          eq(cashGames.userId, userId),
          isNotDeleted(cashGames.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'キャッシュゲームが見つかりません',
        })
      }

      const [deleted] = await ctx.db
        .update(cashGames)
        .set({ deletedAt: softDelete() })
        .where(eq(cashGames.id, input.id))
        .returning()

      return deleted
    }),
})
