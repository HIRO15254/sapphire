import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import {
  isNotDeleted,
  softDelete,
  stores,
  tournamentBlindLevels,
  tournamentPrizeItems,
  tournamentPrizeLevels,
  tournamentPrizeStructures,
  tournaments,
} from '~/server/db/schema'
import {
  archiveTournamentSchema,
  createTournamentSchema,
  deleteTournamentSchema,
  setBlindLevelsSchema,
  setPrizeStructuresSchema,
  updateTournamentSchema,
} from '../../schemas/tournament.schema'
import { createTRPCRouter, protectedProcedure } from '../../trpc'

/**
 * Tournament mutation procedures.
 */
export const tournamentMutations = createTRPCRouter({
  /**
   * Create a new tournament with optional prize structures and blind levels.
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

      // Create prize structures if provided (hierarchical)
      if (input.prizeStructures && input.prizeStructures.length > 0) {
        for (const [sIdx, structure] of input.prizeStructures.entries()) {
          const [newStructure] = await ctx.db
            .insert(tournamentPrizeStructures)
            .values({
              tournamentId: newTournament.id,
              minEntrants: structure.minEntrants,
              maxEntrants: structure.maxEntrants ?? null,
              sortOrder: structure.sortOrder ?? sIdx,
            })
            .returning()

          if (newStructure && structure.prizeLevels.length > 0) {
            for (const [lIdx, level] of structure.prizeLevels.entries()) {
              const [newLevel] = await ctx.db
                .insert(tournamentPrizeLevels)
                .values({
                  prizeStructureId: newStructure.id,
                  minPosition: level.minPosition,
                  maxPosition: level.maxPosition,
                  sortOrder: level.sortOrder ?? lIdx,
                })
                .returning()

              if (newLevel && level.prizeItems.length > 0) {
                await ctx.db.insert(tournamentPrizeItems).values(
                  level.prizeItems.map((item, iIdx) => ({
                    prizeLevelId: newLevel.id,
                    prizeType: item.prizeType,
                    percentage: item.percentage?.toString() ?? null,
                    fixedAmount: item.fixedAmount ?? null,
                    customPrizeLabel: item.customPrizeLabel ?? null,
                    customPrizeValue: item.customPrizeValue ?? null,
                    sortOrder: item.sortOrder ?? iIdx,
                  })),
                )
              }
            }
          }
        }
      }

      // Create blind levels if provided
      if (input.blindLevels && input.blindLevels.length > 0) {
        await ctx.db.insert(tournamentBlindLevels).values(
          input.blindLevels.map((level) => ({
            tournamentId: newTournament.id,
            level: level.level,
            isBreak: level.isBreak ?? false,
            smallBlind: level.smallBlind ?? null,
            bigBlind: level.bigBlind ?? null,
            ante: level.ante ?? null,
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

  /**
   * Set prize structures for a tournament (replaces all existing).
   * Hierarchical: Structure -> Level -> Item
   */
  setPrizeStructures: protectedProcedure
    .input(setPrizeStructuresSchema)
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

      // Delete existing prize structures (cascades to levels and items)
      await ctx.db
        .delete(tournamentPrizeStructures)
        .where(eq(tournamentPrizeStructures.tournamentId, input.tournamentId))

      // Insert new prize structures (hierarchical)
      for (const [sIdx, structure] of input.structures.entries()) {
        const [newStructure] = await ctx.db
          .insert(tournamentPrizeStructures)
          .values({
            tournamentId: input.tournamentId,
            minEntrants: structure.minEntrants,
            maxEntrants: structure.maxEntrants ?? null,
            sortOrder: structure.sortOrder ?? sIdx,
          })
          .returning()

        if (newStructure && structure.prizeLevels.length > 0) {
          for (const [lIdx, level] of structure.prizeLevels.entries()) {
            const [newLevel] = await ctx.db
              .insert(tournamentPrizeLevels)
              .values({
                prizeStructureId: newStructure.id,
                minPosition: level.minPosition,
                maxPosition: level.maxPosition,
                sortOrder: level.sortOrder ?? lIdx,
              })
              .returning()

            if (newLevel && level.prizeItems.length > 0) {
              await ctx.db.insert(tournamentPrizeItems).values(
                level.prizeItems.map((item, iIdx) => ({
                  prizeLevelId: newLevel.id,
                  prizeType: item.prizeType,
                  percentage: item.percentage?.toString() ?? null,
                  fixedAmount: item.fixedAmount ?? null,
                  customPrizeLabel: item.customPrizeLabel ?? null,
                  customPrizeValue: item.customPrizeValue ?? null,
                  sortOrder: item.sortOrder ?? iIdx,
                })),
              )
            }
          }
        }
      }

      return { success: true }
    }),

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
            isBreak: level.isBreak ?? false,
            smallBlind: level.smallBlind ?? null,
            bigBlind: level.bigBlind ?? null,
            ante: level.ante ?? null,
            durationMinutes: level.durationMinutes,
          })),
        )
      }

      return { success: true }
    }),

  /**
   * Reorder tournaments within a store.
   */
  reorder: protectedProcedure
    .input(
      z.object({
        storeId: z.string(),
        items: z.array(
          z.object({
            id: z.string(),
            sortOrder: z.number().int().min(0),
          }),
        ),
      }),
    )
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
          code: 'NOT_FOUND',
          message: '店舗が見つかりません',
        })
      }

      // Update sortOrder for each tournament
      for (const item of input.items) {
        await ctx.db
          .update(tournaments)
          .set({ sortOrder: item.sortOrder })
          .where(
            and(
              eq(tournaments.id, item.id),
              eq(tournaments.storeId, input.storeId),
              eq(tournaments.userId, userId),
            ),
          )
      }

      return { success: true }
    }),
})
