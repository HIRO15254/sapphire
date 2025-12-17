import { TRPCError } from '@trpc/server'
import { and, desc, eq, sql } from 'drizzle-orm'

import type { db } from '~/server/db'
import {
  bonusTransactions,
  currencies,
  isNotDeleted,
  purchaseTransactions,
  softDelete,
} from '~/server/db/schema'
import {
  addBonusSchema,
  addPurchaseSchema,
  archiveCurrencySchema,
  createCurrencySchema,
  deleteBonusSchema,
  deleteCurrencySchema,
  deletePurchaseSchema,
  getCurrencyByIdSchema,
  listBonusesByCurrencySchema,
  listCurrenciesSchema,
  listPurchasesByCurrencySchema,
  updateBonusSchema,
  updateCurrencySchema,
  updatePurchaseSchema,
} from '../schemas/currency.schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

// ============================================================================
// Helper Functions (defined before router to avoid circular reference)
// ============================================================================

/** Balance calculation result type */
type BalanceBreakdown = {
  totalBonuses: number
  totalPurchases: number
  totalBuyIns: number
  totalCashOuts: number
  currentBalance: number
}

/**
 * Calculate the current balance and breakdown for a currency.
 *
 * Balance formula:
 * currentBalance = initialBalance + Σ(bonuses) + Σ(purchases) - Σ(buyIns) + Σ(cashOuts)
 *
 * Note: Session buy-ins and cashouts are not yet implemented (Phase 5).
 * For now, only bonuses and purchases are included.
 */
async function calculateCurrencyBalance(
  database: typeof db,
  currencyId: string,
): Promise<BalanceBreakdown> {
  // Get currency initial balance
  const currency = await database.query.currencies.findFirst({
    where: eq(currencies.id, currencyId),
    columns: { initialBalance: true },
  })

  if (!currency) {
    return {
      totalBonuses: 0,
      totalPurchases: 0,
      totalBuyIns: 0,
      totalCashOuts: 0,
      currentBalance: 0,
    }
  }

  // Calculate total bonuses
  const bonusResult = await database
    .select({
      total: sql<number>`COALESCE(SUM(${bonusTransactions.amount}), 0)::integer`,
    })
    .from(bonusTransactions)
    .where(
      and(
        eq(bonusTransactions.currencyId, currencyId),
        isNotDeleted(bonusTransactions.deletedAt),
      ),
    )

  // Calculate total purchases
  const purchaseResult = await database
    .select({
      total: sql<number>`COALESCE(SUM(${purchaseTransactions.amount}), 0)::integer`,
    })
    .from(purchaseTransactions)
    .where(
      and(
        eq(purchaseTransactions.currencyId, currencyId),
        isNotDeleted(purchaseTransactions.deletedAt),
      ),
    )

  const totalBonuses = bonusResult[0]?.total ?? 0
  const totalPurchases = purchaseResult[0]?.total ?? 0

  // TODO: Add session buy-ins and cashouts in Phase 5
  const totalBuyIns = 0
  const totalCashOuts = 0

  const currentBalance =
    currency.initialBalance +
    totalBonuses +
    totalPurchases -
    totalBuyIns +
    totalCashOuts

  return {
    totalBonuses,
    totalPurchases,
    totalBuyIns,
    totalCashOuts,
    currentBalance,
  }
}

/**
 * Currency router for managing virtual currencies and transactions.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId.
 *
 * @see data-model.md Section 5-7
 */
export const currencyRouter = createTRPCRouter({
  // ============================================================================
  // Currency CRUD
  // ============================================================================

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

  // ============================================================================
  // Bonus Transactions
  // ============================================================================

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

  // ============================================================================
  // Purchase Transactions
  // ============================================================================

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
