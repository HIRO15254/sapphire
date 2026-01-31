import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'

import {
  allInRecords,
  isNotDeleted,
  pokerSessions,
  softDelete,
} from '~/server/db/schema'
import {
  createAllInSchema,
  deleteAllInSchema,
  listBySessionSchema,
  updateAllInSchema,
} from '../schemas/allIn.schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * AllIn router for managing all-in records within sessions.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId and verifying session ownership.
 *
 * @see data-model.md Section 15. AllInRecord
 */
export const allInRouter = createTRPCRouter({
  // ============================================================================
  // AllIn CRUD
  // ============================================================================

  /**
   * List all-in records for a specific session.
   */
  listBySession: protectedProcedure
    .input(listBySessionSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'セッションが見つかりません',
        })
      }

      const records = await ctx.db.query.allInRecords.findMany({
        where: and(
          eq(allInRecords.sessionId, input.sessionId),
          isNotDeleted(allInRecords.deletedAt),
        ),
        orderBy: [desc(allInRecords.recordedAt)],
      })

      // Calculate summary
      const summary = calculateSummary(records)

      return {
        allInRecords: records,
        summary,
      }
    }),

  /**
   * Create a new all-in record for a session.
   */
  create: protectedProcedure
    .input(createAllInSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'セッションが見つかりません',
        })
      }

      const [newRecord] = await ctx.db
        .insert(allInRecords)
        .values({
          sessionId: input.sessionId,
          userId,
          potAmount: input.potAmount,
          winProbability: input.winProbability.toString(),
          actualResult: input.actualResult,
          recordedAt: input.recordedAt ?? new Date(),
        })
        .returning()

      return newRecord
    }),

  /**
   * Update an existing all-in record.
   */
  update: protectedProcedure
    .input(updateAllInSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.allInRecords.findFirst({
        where: and(
          eq(allInRecords.id, input.id),
          eq(allInRecords.userId, userId),
          isNotDeleted(allInRecords.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'オールイン記録が見つかりません',
        })
      }

      const updateData: Partial<typeof allInRecords.$inferInsert> = {}
      if (input.potAmount !== undefined) updateData.potAmount = input.potAmount
      if (input.winProbability !== undefined)
        updateData.winProbability = input.winProbability.toString()
      if (input.actualResult !== undefined)
        updateData.actualResult = input.actualResult
      if (input.runItTimes !== undefined)
        updateData.runItTimes = input.runItTimes
      if (input.winsInRunout !== undefined)
        updateData.winsInRunout = input.winsInRunout
      if (input.recordedAt !== undefined)
        updateData.recordedAt = input.recordedAt

      const [updated] = await ctx.db
        .update(allInRecords)
        .set(updateData)
        .where(eq(allInRecords.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Delete an all-in record (soft delete).
   */
  delete: protectedProcedure
    .input(deleteAllInSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.allInRecords.findFirst({
        where: and(
          eq(allInRecords.id, input.id),
          eq(allInRecords.userId, userId),
          isNotDeleted(allInRecords.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'オールイン記録が見つかりません',
        })
      }

      const [deleted] = await ctx.db
        .update(allInRecords)
        .set({ deletedAt: softDelete() })
        .where(eq(allInRecords.id, input.id))
        .returning()

      return deleted
    }),
})

/**
 * Calculate summary statistics for all-in records.
 *
 * @param records - Array of all-in records
 * @returns Summary statistics
 */
function calculateSummary(
  records: Array<{
    potAmount: number
    winProbability: string
    actualResult: boolean
  }>,
) {
  if (records.length === 0) {
    return {
      count: 0,
      totalPotAmount: 0,
      averageWinRate: 0,
      allInEV: 0,
      actualResultTotal: 0,
      evDifference: 0,
      winCount: 0,
      lossCount: 0,
    }
  }

  const count = records.length
  const totalPotAmount = records.reduce((sum, r) => sum + r.potAmount, 0)

  // Parse winProbability from string to number
  const winProbabilities = records.map((r) => parseFloat(r.winProbability))
  const averageWinRate = winProbabilities.reduce((sum, p) => sum + p, 0) / count

  // Calculate EV: Σ(potAmount × winProbability / 100)
  const allInEV = records.reduce(
    (sum, r, i) => sum + r.potAmount * ((winProbabilities[i] ?? 0) / 100),
    0,
  )

  // Calculate actual result total: Σ(potAmount where actualResult = true)
  const actualResultTotal = records
    .filter((r) => r.actualResult)
    .reduce((sum, r) => sum + r.potAmount, 0)

  // EV difference: actualResultTotal - allInEV
  const evDifference = actualResultTotal - allInEV

  const winCount = records.filter((r) => r.actualResult).length
  const lossCount = records.filter((r) => !r.actualResult).length

  return {
    count,
    totalPotAmount,
    averageWinRate,
    allInEV,
    actualResultTotal,
    evDifference,
    winCount,
    lossCount,
  }
}
