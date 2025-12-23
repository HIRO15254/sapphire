import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'

import {
  isNotDeleted,
  softDelete,
  stores,
  tournamentBlindLevels,
  tournamentPrizeLevels,
  tournaments,
} from '~/server/db/schema'
import {
  archiveTournamentSchema,
  createTournamentSchema,
  deleteTournamentSchema,
  getTournamentByIdSchema,
  listTournamentsByStoreSchema,
  setBlindLevelsSchema,
  setPrizeLevelsSchema,
  updateTournamentSchema,
} from '../schemas/tournament.schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * Tournament router for managing tournament configurations.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId.
 *
 * @see data-model.md Section 10-12. Tournament, TournamentPrizeLevel, TournamentBlindLevel
 */
export const tournamentRouter = createTRPCRouter({
  // ============================================================================
  // Tournament CRUD
  // ============================================================================

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
   * Get a single tournament by ID with prize and blind levels.
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
          prizeLevels: {
            orderBy: (levels, { asc }) => [asc(levels.position)],
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

  /**
   * Create a new tournament with optional prize and blind levels.
   */
  create: protectedProcedure
    .input(createTournamentSchema)
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

      // Create tournament
      const [newTournament] = await ctx.db
        .insert(tournaments)
        .values({
          storeId: input.storeId,
          userId,
          currencyId: input.currencyId,
          name: input.name,
          buyIn: input.buyIn,
          rake: input.rake,
          startingStack: input.startingStack,
          notes: input.notes,
        })
        .returning()

      if (!newTournament) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'トーナメントの作成に失敗しました',
        })
      }

      // Create prize levels if provided
      if (input.prizeLevels && input.prizeLevels.length > 0) {
        await ctx.db.insert(tournamentPrizeLevels).values(
          input.prizeLevels.map((level) => ({
            tournamentId: newTournament.id,
            position: level.position,
            percentage: level.percentage?.toString(),
            fixedAmount: level.fixedAmount,
          })),
        )
      }

      // Create blind levels if provided
      if (input.blindLevels && input.blindLevels.length > 0) {
        await ctx.db.insert(tournamentBlindLevels).values(
          input.blindLevels.map((level) => ({
            tournamentId: newTournament.id,
            level: level.level,
            smallBlind: level.smallBlind,
            bigBlind: level.bigBlind,
            ante: level.ante,
            durationMinutes: level.durationMinutes,
          })),
        )
      }

      return newTournament
    }),

  /**
   * Update an existing tournament.
   */
  update: protectedProcedure
    .input(updateTournamentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.tournaments.findFirst({
        where: and(
          eq(tournaments.id, input.id),
          eq(tournaments.userId, userId),
          isNotDeleted(tournaments.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'トーナメントが見つかりません',
        })
      }

      const updateData: Partial<typeof tournaments.$inferInsert> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.currencyId !== undefined)
        updateData.currencyId = input.currencyId
      if (input.buyIn !== undefined) updateData.buyIn = input.buyIn
      if (input.rake !== undefined) updateData.rake = input.rake
      if (input.startingStack !== undefined)
        updateData.startingStack = input.startingStack
      if (input.notes !== undefined) updateData.notes = input.notes

      const [updated] = await ctx.db
        .update(tournaments)
        .set(updateData)
        .where(eq(tournaments.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Archive or unarchive a tournament.
   */
  archive: protectedProcedure
    .input(archiveTournamentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.tournaments.findFirst({
        where: and(
          eq(tournaments.id, input.id),
          eq(tournaments.userId, userId),
          isNotDeleted(tournaments.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'トーナメントが見つかりません',
        })
      }

      const [updated] = await ctx.db
        .update(tournaments)
        .set({ isArchived: input.isArchived })
        .where(eq(tournaments.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Delete a tournament (soft delete).
   */
  delete: protectedProcedure
    .input(deleteTournamentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.tournaments.findFirst({
        where: and(
          eq(tournaments.id, input.id),
          eq(tournaments.userId, userId),
          isNotDeleted(tournaments.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'トーナメントが見つかりません',
        })
      }

      const [deleted] = await ctx.db
        .update(tournaments)
        .set({ deletedAt: softDelete() })
        .where(eq(tournaments.id, input.id))
        .returning()

      return deleted
    }),

  // ============================================================================
  // Prize Level Management
  // ============================================================================

  /**
   * Set prize levels for a tournament (replaces all existing).
   */
  setPrizeLevels: protectedProcedure
    .input(setPrizeLevelsSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.tournaments.findFirst({
        where: and(
          eq(tournaments.id, input.tournamentId),
          eq(tournaments.userId, userId),
          isNotDeleted(tournaments.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'トーナメントが見つかりません',
        })
      }

      // Delete existing prize levels
      await ctx.db
        .delete(tournamentPrizeLevels)
        .where(eq(tournamentPrizeLevels.tournamentId, input.tournamentId))

      // Insert new prize levels
      if (input.levels.length > 0) {
        await ctx.db.insert(tournamentPrizeLevels).values(
          input.levels.map((level) => ({
            tournamentId: input.tournamentId,
            position: level.position,
            percentage: level.percentage?.toString(),
            fixedAmount: level.fixedAmount,
          })),
        )
      }

      return { success: true }
    }),

  // ============================================================================
  // Blind Level Management
  // ============================================================================

  /**
   * Set blind levels for a tournament (replaces all existing).
   */
  setBlindLevels: protectedProcedure
    .input(setBlindLevelsSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.tournaments.findFirst({
        where: and(
          eq(tournaments.id, input.tournamentId),
          eq(tournaments.userId, userId),
          isNotDeleted(tournaments.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'トーナメントが見つかりません',
        })
      }

      // Delete existing blind levels
      await ctx.db
        .delete(tournamentBlindLevels)
        .where(eq(tournamentBlindLevels.tournamentId, input.tournamentId))

      // Insert new blind levels
      if (input.levels.length > 0) {
        await ctx.db.insert(tournamentBlindLevels).values(
          input.levels.map((level) => ({
            tournamentId: input.tournamentId,
            level: level.level,
            smallBlind: level.smallBlind,
            bigBlind: level.bigBlind,
            ante: level.ante,
            durationMinutes: level.durationMinutes,
          })),
        )
      }

      return { success: true }
    }),
})
