import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'

import { currencies, isNotDeleted, softDelete } from '~/server/db/schema'
import {
  archiveCurrencySchema,
  createCurrencySchema,
  deleteCurrencySchema,
  updateCurrencySchema,
} from '../../schemas/currency.schema'
import { createTRPCRouter, protectedProcedure } from '../../trpc'

/**
 * Currency CRUD mutation procedures.
 */
export const currencyMutations = createTRPCRouter({
  /**
   * Create a new currency.
   */
  create: protectedProcedure
    .input(createCurrencySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const [newCurrency] = await ctx.db
        .insert(currencies)
        .values({
          userId,
          name: input.name,
          initialBalance: input.initialBalance,
        })
        .returning()

      return newCurrency
    }),

  /**
   * Update an existing currency.
   */
  update: protectedProcedure
    .input(updateCurrencySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.currencies.findFirst({
        where: and(
          eq(currencies.id, input.id),
          eq(currencies.userId, userId),
          isNotDeleted(currencies.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '通貨が見つかりません',
        })
      }

      const updateData: Partial<typeof currencies.$inferInsert> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.initialBalance !== undefined)
        updateData.initialBalance = input.initialBalance

      const [updated] = await ctx.db
        .update(currencies)
        .set(updateData)
        .where(eq(currencies.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Archive a currency (hide from active lists).
   */
  archive: protectedProcedure
    .input(archiveCurrencySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.currencies.findFirst({
        where: and(
          eq(currencies.id, input.id),
          eq(currencies.userId, userId),
          isNotDeleted(currencies.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '通貨が見つかりません',
        })
      }

      const [updated] = await ctx.db
        .update(currencies)
        .set({ isArchived: true })
        .where(eq(currencies.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Unarchive a currency.
   */
  unarchive: protectedProcedure
    .input(archiveCurrencySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.currencies.findFirst({
        where: and(
          eq(currencies.id, input.id),
          eq(currencies.userId, userId),
          isNotDeleted(currencies.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '通貨が見つかりません',
        })
      }

      const [updated] = await ctx.db
        .update(currencies)
        .set({ isArchived: false })
        .where(eq(currencies.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Delete a currency (soft delete).
   */
  delete: protectedProcedure
    .input(deleteCurrencySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.currencies.findFirst({
        where: and(
          eq(currencies.id, input.id),
          eq(currencies.userId, userId),
          isNotDeleted(currencies.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '通貨が見つかりません',
        })
      }

      const [deleted] = await ctx.db
        .update(currencies)
        .set({ deletedAt: softDelete() })
        .where(eq(currencies.id, input.id))
        .returning()

      return deleted
    }),
})
