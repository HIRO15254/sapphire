import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'

import {
  bonusTransactions,
  currencies,
  isNotDeleted,
  softDelete,
} from '~/server/db/schema'
import {
  addBonusSchema,
  deleteBonusSchema,
  updateBonusSchema,
} from '../../schemas/currency.schema'
import { createTRPCRouter, protectedProcedure } from '../../trpc'

/**
 * Bonus transaction mutation procedures.
 */
export const bonusMutations = createTRPCRouter({
  /**
   * Add a bonus transaction to a currency.
   */
  addBonus: protectedProcedure
    .input(addBonusSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify currency ownership
      const currency = await ctx.db.query.currencies.findFirst({
        where: and(
          eq(currencies.id, input.currencyId),
          eq(currencies.userId, userId),
          isNotDeleted(currencies.deletedAt),
        ),
      })

      if (!currency) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '通貨が見つかりません',
        })
      }

      const [bonus] = await ctx.db
        .insert(bonusTransactions)
        .values({
          currencyId: input.currencyId,
          userId,
          amount: input.amount,
          source: input.source,
          transactionDate: input.transactionDate ?? new Date(),
        })
        .returning()

      return bonus
    }),

  /**
   * Update a bonus transaction.
   */
  updateBonus: protectedProcedure
    .input(updateBonusSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.bonusTransactions.findFirst({
        where: and(
          eq(bonusTransactions.id, input.id),
          eq(bonusTransactions.userId, userId),
          isNotDeleted(bonusTransactions.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ボーナスが見つかりません',
        })
      }

      const updateData: Partial<typeof bonusTransactions.$inferInsert> = {}
      if (input.amount !== undefined) updateData.amount = input.amount
      if (input.source !== undefined) updateData.source = input.source
      if (input.transactionDate !== undefined)
        updateData.transactionDate = input.transactionDate

      const [updated] = await ctx.db
        .update(bonusTransactions)
        .set(updateData)
        .where(eq(bonusTransactions.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Delete a bonus transaction (soft delete).
   */
  deleteBonus: protectedProcedure
    .input(deleteBonusSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.bonusTransactions.findFirst({
        where: and(
          eq(bonusTransactions.id, input.id),
          eq(bonusTransactions.userId, userId),
          isNotDeleted(bonusTransactions.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ボーナスが見つかりません',
        })
      }

      const [deleted] = await ctx.db
        .update(bonusTransactions)
        .set({ deletedAt: softDelete() })
        .where(eq(bonusTransactions.id, input.id))
        .returning()

      return deleted
    }),
})
