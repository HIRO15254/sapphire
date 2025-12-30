import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'

import {
  currencies,
  isNotDeleted,
  purchaseTransactions,
  softDelete,
} from '~/server/db/schema'
import {
  addPurchaseSchema,
  deletePurchaseSchema,
  updatePurchaseSchema,
} from '../../schemas/currency.schema'
import { createTRPCRouter, protectedProcedure } from '../../trpc'

/**
 * Purchase transaction mutation procedures.
 */
export const purchaseMutations = createTRPCRouter({
  /**
   * Add a purchase transaction to a currency.
   */
  addPurchase: protectedProcedure
    .input(addPurchaseSchema)
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

      const [purchase] = await ctx.db
        .insert(purchaseTransactions)
        .values({
          currencyId: input.currencyId,
          userId,
          amount: input.amount,
          note: input.note,
          transactionDate: input.transactionDate ?? new Date(),
        })
        .returning()

      return purchase
    }),

  /**
   * Update a purchase transaction.
   */
  updatePurchase: protectedProcedure
    .input(updatePurchaseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.purchaseTransactions.findFirst({
        where: and(
          eq(purchaseTransactions.id, input.id),
          eq(purchaseTransactions.userId, userId),
          isNotDeleted(purchaseTransactions.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '購入記録が見つかりません',
        })
      }

      const updateData: Partial<typeof purchaseTransactions.$inferInsert> = {}
      if (input.amount !== undefined) updateData.amount = input.amount
      if (input.note !== undefined) updateData.note = input.note
      if (input.transactionDate !== undefined)
        updateData.transactionDate = input.transactionDate

      const [updated] = await ctx.db
        .update(purchaseTransactions)
        .set(updateData)
        .where(eq(purchaseTransactions.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Delete a purchase transaction (soft delete).
   */
  deletePurchase: protectedProcedure
    .input(deletePurchaseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.purchaseTransactions.findFirst({
        where: and(
          eq(purchaseTransactions.id, input.id),
          eq(purchaseTransactions.userId, userId),
          isNotDeleted(purchaseTransactions.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '購入記録が見つかりません',
        })
      }

      const [deleted] = await ctx.db
        .update(purchaseTransactions)
        .set({ deletedAt: softDelete() })
        .where(eq(purchaseTransactions.id, input.id))
        .returning()

      return deleted
    }),
})
