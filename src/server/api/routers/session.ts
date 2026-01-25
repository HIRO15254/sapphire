import { TRPCError } from '@trpc/server'
import { and, desc, eq, gte, inArray, lt, or, sql } from 'drizzle-orm'

import {
  allInRecords,
  cashGames,
  isNotDeleted,
  pokerSessions,
  softDelete,
  tournaments,
} from '~/server/db/schema'
import {
  createArchiveSessionSchema,
  deleteSessionSchema,
  getSessionByIdSchema,
  listSessionsSchema,
  updateSessionSchema,
} from '../schemas/session.schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * Session router for managing poker sessions.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId.
 *
 * @see data-model.md Section 13. PokerSession
 */
export const sessionRouter = createTRPCRouter({
  // ============================================================================
  // Session CRUD
  // ============================================================================

  /**
   * List all sessions for the current user with optional filters and pagination.
   */
  list: protectedProcedure
    .input(listSessionsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const limit = input?.limit // undefined means no limit (fetch all)
      const offset = input?.offset ?? 0

      const conditions = [
        eq(pokerSessions.userId, userId),
        isNotDeleted(pokerSessions.deletedAt),
        // Only list archive (completed) sessions
        eq(pokerSessions.isActive, false),
      ]

      // Optional filters
      if (input?.storeId) {
        conditions.push(eq(pokerSessions.storeId, input.storeId))
      }
      if (input?.gameType) {
        conditions.push(eq(pokerSessions.gameType, input.gameType))
      }
      if (input?.startFrom) {
        conditions.push(gte(pokerSessions.startTime, input.startFrom))
      }
      if (input?.startTo) {
        conditions.push(lt(pokerSessions.startTime, input.startTo))
      }

      // Currency filter: find games with this currency, then filter sessions
      let currencyGameIds: {
        cashGameIds: string[]
        tournamentIds: string[]
      } | null = null
      if (input?.currencyId) {
        const [currencyCashGames, currencyTournaments] = await Promise.all([
          ctx.db
            .select({ id: cashGames.id })
            .from(cashGames)
            .where(eq(cashGames.currencyId, input.currencyId)),
          ctx.db
            .select({ id: tournaments.id })
            .from(tournaments)
            .where(eq(tournaments.currencyId, input.currencyId)),
        ])
        currencyGameIds = {
          cashGameIds: currencyCashGames.map((g) => g.id),
          tournamentIds: currencyTournaments.map((t) => t.id),
        }

        // Filter sessions that use these games
        const gameConditions = []
        if (currencyGameIds.cashGameIds.length > 0) {
          gameConditions.push(
            inArray(pokerSessions.cashGameId, currencyGameIds.cashGameIds),
          )
        }
        if (currencyGameIds.tournamentIds.length > 0) {
          gameConditions.push(
            inArray(pokerSessions.tournamentId, currencyGameIds.tournamentIds),
          )
        }
        if (gameConditions.length === 0) {
          // No games with this currency, return empty
          return { sessions: [], total: 0, hasMore: false }
        }
        const orCondition = or(...gameConditions)
        if (orCondition) {
          conditions.push(orCondition)
        }
      }

      // Get total count for pagination
      const countResult = await ctx.db
        .select({ count: sql<number>`COUNT(*)::integer` })
        .from(pokerSessions)
        .where(and(...conditions))

      const total = countResult[0]?.count ?? 0

      // Get sessions with related data including all-in records
      const sessions = await ctx.db.query.pokerSessions.findMany({
        where: and(...conditions),
        with: {
          store: true,
          cashGame: {
            with: {
              currency: true,
            },
          },
          tournament: {
            with: {
              currency: true,
            },
          },
          allInRecords: {
            where: isNotDeleted(allInRecords.deletedAt),
          },
        },
        orderBy: [desc(pokerSessions.startTime)],
        limit,
        offset,
      })

      // Calculate profit/loss and all-in summary for each session
      const sessionsWithProfitLoss = sessions.map((session) => {
        const profitLoss =
          session.cashOut !== null ? session.cashOut - session.buyIn : null
        const allInSummary = calculateAllInSummary(session.allInRecords)
        return {
          ...session,
          profitLoss,
          allInSummary,
        }
      })

      return {
        sessions: sessionsWithProfitLoss,
        total,
        hasMore: offset + sessions.length < total,
      }
    }),

  /**
   * Get a single session by ID with related data and all-in records.
   */
  getById: protectedProcedure
    .input(getSessionByIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.id),
          eq(pokerSessions.userId, userId),
          isNotDeleted(pokerSessions.deletedAt),
        ),
        with: {
          store: true,
          cashGame: {
            with: {
              currency: true,
            },
          },
          tournament: {
            with: {
              currency: true,
            },
          },
          allInRecords: {
            where: isNotDeleted(allInRecords.deletedAt),
            orderBy: [desc(allInRecords.recordedAt)],
          },
          sessionEvents: {
            orderBy: (events, { asc }) => [asc(events.sequence)],
          },
        },
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'セッションが見つかりません',
        })
      }

      // Calculate profit/loss
      const profitLoss =
        session.cashOut !== null ? session.cashOut - session.buyIn : null

      // Calculate all-in summary
      const allInSummary = calculateAllInSummary(session.allInRecords)

      return {
        ...session,
        profitLoss,
        allInSummary,
      }
    }),

  /**
   * Create a new archive session (completed session with known buy-in and cashout).
   */
  createArchive: protectedProcedure
    .input(createArchiveSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const [newSession] = await ctx.db
        .insert(pokerSessions)
        .values({
          userId,
          storeId: input.storeId,
          gameType: input.gameType,
          cashGameId: input.cashGameId,
          tournamentId: input.tournamentId,
          isActive: false, // Archive session is not active
          startTime: input.startTime,
          endTime: input.endTime,
          buyIn: input.buyIn,
          cashOut: input.cashOut,
          notes: input.notes,
        })
        .returning()

      return newSession
    }),

  /**
   * Update an existing session.
   */
  update: protectedProcedure
    .input(updateSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.id),
          eq(pokerSessions.userId, userId),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'セッションが見つかりません',
        })
      }

      const updateData: Partial<typeof pokerSessions.$inferInsert> = {}
      if (input.storeId !== undefined) updateData.storeId = input.storeId
      if (input.gameType !== undefined) updateData.gameType = input.gameType
      if (input.cashGameId !== undefined)
        updateData.cashGameId = input.cashGameId
      if (input.tournamentId !== undefined)
        updateData.tournamentId = input.tournamentId
      if (input.startTime !== undefined) updateData.startTime = input.startTime
      if (input.endTime !== undefined) updateData.endTime = input.endTime
      if (input.buyIn !== undefined) updateData.buyIn = input.buyIn
      if (input.cashOut !== undefined) updateData.cashOut = input.cashOut
      if (input.notes !== undefined) updateData.notes = input.notes

      const [updated] = await ctx.db
        .update(pokerSessions)
        .set(updateData)
        .where(eq(pokerSessions.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Delete a session (soft delete).
   */
  delete: protectedProcedure
    .input(deleteSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.id),
          eq(pokerSessions.userId, userId),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'セッションが見つかりません',
        })
      }

      const [deleted] = await ctx.db
        .update(pokerSessions)
        .set({ deletedAt: softDelete() })
        .where(eq(pokerSessions.id, input.id))
        .returning()

      return deleted
    }),
})

/**
 * Calculate all-in summary statistics for a session.
 *
 * @param allInRecords - Array of all-in records
 * @returns Summary statistics including count, EV, and EV difference
 */
function calculateAllInSummary(
  records: Array<{
    potAmount: number
    winProbability: string
    actualResult: boolean
    runItTimes: number | null
    winsInRunout: number | null
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

  // Parse winProbability from string (decimal) to number
  const winProbabilities = records.map((r) => parseFloat(r.winProbability))
  const averageWinRate = winProbabilities.reduce((sum, p) => sum + p, 0) / count

  // Calculate EV: Σ(potAmount × winProbability / 100)
  const allInEV = records.reduce(
    (sum, r, i) => sum + r.potAmount * ((winProbabilities[i] ?? 0) / 100),
    0,
  )

  // Calculate actual result total
  // For Run it X times: potAmount × (winsInRunout / runItTimes)
  // For normal all-in: potAmount if won, 0 if lost
  const actualResultTotal = records.reduce((sum, r) => {
    if (r.runItTimes != null && r.runItTimes > 1 && r.winsInRunout != null) {
      // Run it X times: partial pot based on wins
      return sum + r.potAmount * (r.winsInRunout / r.runItTimes)
    }
    // Normal all-in: full pot if won, 0 if lost
    return sum + (r.actualResult ? r.potAmount : 0)
  }, 0)

  // EV difference: actualResultTotal - allInEV
  const evDifference = actualResultTotal - allInEV

  // Count wins/losses (for Run it X times, count as win if winsInRunout > 0)
  const winCount = records.filter((r) => {
    if (r.runItTimes != null && r.runItTimes > 1) {
      return (r.winsInRunout ?? 0) > 0
    }
    return r.actualResult
  }).length
  const lossCount = count - winCount

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
