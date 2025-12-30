import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'

import {
  bonusTransactions,
  currencies,
  isNotDeleted,
  purchaseTransactions,
} from '~/server/db/schema'
import {
  getCurrencyByIdSchema,
  listBonusesByCurrencySchema,
  listCurrenciesSchema,
  listPurchasesByCurrencySchema,
} from '../../schemas/currency.schema'
import { createTRPCRouter, protectedProcedure } from '../../trpc'
import { calculateCurrencyBalance } from './helpers'

/**
 * Currency query procedures.
 */
export const currencyQueries = createTRPCRouter({
  /**
   * List all currencies for the current user.
   * Optionally includes archived currencies.
   */
  list: protectedProcedure
    .input(listCurrenciesSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const conditions = [
        eq(currencies.userId, userId),
        isNotDeleted(currencies.deletedAt),
      ]

      // Exclude archived unless requested
      if (!input?.includeArchived) {
        conditions.push(eq(currencies.isArchived, false))
      }

      const currencyList = await ctx.db
        .select()
        .from(currencies)
        .where(and(...conditions))
        .orderBy(desc(currencies.createdAt))

      // Calculate balances for each currency
      const currenciesWithBalances = await Promise.all(
        currencyList.map(async (currency) => {
          const balance = await calculateCurrencyBalance(ctx.db, currency.id)
          return {
            ...currency,
            ...balance,
          }
        }),
      )

      return { currencies: currenciesWithBalances }
    }),

  /**
   * Get a single currency by ID with balance breakdown.
   */
  getById: protectedProcedure
    .input(getCurrencyByIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const currency = await ctx.db.query.currencies.findFirst({
        where: and(
          eq(currencies.id, input.id),
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

      const balance = await calculateCurrencyBalance(ctx.db, currency.id)

      // Get transactions for detail view
      const bonusList = await ctx.db
        .select()
        .from(bonusTransactions)
        .where(
          and(
            eq(bonusTransactions.currencyId, currency.id),
            isNotDeleted(bonusTransactions.deletedAt),
          ),
        )
        .orderBy(desc(bonusTransactions.transactionDate))

      const purchaseList = await ctx.db
        .select()
        .from(purchaseTransactions)
        .where(
          and(
            eq(purchaseTransactions.currencyId, currency.id),
            isNotDeleted(purchaseTransactions.deletedAt),
          ),
        )
        .orderBy(desc(purchaseTransactions.transactionDate))

      return {
        ...currency,
        ...balance,
        bonusTransactions: bonusList,
        purchaseTransactions: purchaseList,
      }
    }),

  /**
   * List bonus transactions for a currency.
   */
  listBonuses: protectedProcedure
    .input(listBonusesByCurrencySchema)
    .query(async ({ ctx, input }) => {
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

      const bonuses = await ctx.db
        .select()
        .from(bonusTransactions)
        .where(
          and(
            eq(bonusTransactions.currencyId, input.currencyId),
            isNotDeleted(bonusTransactions.deletedAt),
          ),
        )
        .orderBy(desc(bonusTransactions.transactionDate))

      return { bonuses }
    }),

  /**
   * List purchase transactions for a currency.
   */
  listPurchases: protectedProcedure
    .input(listPurchasesByCurrencySchema)
    .query(async ({ ctx, input }) => {
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

      const purchases = await ctx.db
        .select()
        .from(purchaseTransactions)
        .where(
          and(
            eq(purchaseTransactions.currencyId, input.currencyId),
            isNotDeleted(purchaseTransactions.deletedAt),
          ),
        )
        .orderBy(desc(purchaseTransactions.transactionDate))

      return { purchases }
    }),
})
