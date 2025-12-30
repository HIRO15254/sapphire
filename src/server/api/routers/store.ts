import { TRPCError } from '@trpc/server'
import { and, asc, desc, eq, sql } from 'drizzle-orm'

import { generateGoogleMapsUrl } from '~/lib/google-maps'
import {
  cashGames,
  isNotDeleted,
  softDelete,
  stores,
  tournaments,
} from '~/server/db/schema'
import {
  archiveStoreSchema,
  createStoreSchema,
  deleteStoreSchema,
  getStoreByIdSchema,
  listStoresSchema,
  updateStoreSchema,
} from '../schemas/store.schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * Store router for managing poker venues.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId.
 *
 * @see data-model.md Section 8. Store
 */
export const storeRouter = createTRPCRouter({
  // ============================================================================
  // Store CRUD
  // ============================================================================

  /**
   * List all stores for the current user.
   * Optionally includes archived stores.
   */
  list: protectedProcedure
    .input(listStoresSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const conditions = [
        eq(stores.userId, userId),
        isNotDeleted(stores.deletedAt),
      ]

      // Exclude archived unless requested
      if (!input?.includeArchived) {
        conditions.push(eq(stores.isArchived, false))
      }

      const storeList = await ctx.db
        .select()
        .from(stores)
        .where(and(...conditions))
        .orderBy(desc(stores.createdAt))

      // Calculate game counts for each store
      const storesWithCounts = await Promise.all(
        storeList.map(async (store) => {
          // Count cash games
          const cashGameResult = await ctx.db
            .select({
              count: sql<number>`COUNT(*)::integer`,
            })
            .from(cashGames)
            .where(
              and(
                eq(cashGames.storeId, store.id),
                isNotDeleted(cashGames.deletedAt),
                eq(cashGames.isArchived, false),
              ),
            )

          // Count tournaments
          const tournamentResult = await ctx.db
            .select({
              count: sql<number>`COUNT(*)::integer`,
            })
            .from(tournaments)
            .where(
              and(
                eq(tournaments.storeId, store.id),
                isNotDeleted(tournaments.deletedAt),
                eq(tournaments.isArchived, false),
              ),
            )

          return {
            ...store,
            cashGameCount: cashGameResult[0]?.count ?? 0,
            tournamentCount: tournamentResult[0]?.count ?? 0,
          }
        }),
      )

      return { stores: storesWithCounts }
    }),

  /**
   * Get a single store by ID with game lists and Google Maps URL.
   */
  getById: protectedProcedure
    .input(getStoreByIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const store = await ctx.db.query.stores.findFirst({
        where: and(
          eq(stores.id, input.id),
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

      // Get cash games for this store
      const cashGameList = await ctx.db.query.cashGames.findMany({
        where: and(
          eq(cashGames.storeId, store.id),
          isNotDeleted(cashGames.deletedAt),
        ),
        with: {
          currency: true,
        },
        orderBy: [asc(cashGames.sortOrder), desc(cashGames.createdAt)],
      })

      // Get tournaments for this store with prize structures and blind levels
      const tournamentList = await ctx.db.query.tournaments.findMany({
        where: and(
          eq(tournaments.storeId, store.id),
          isNotDeleted(tournaments.deletedAt),
        ),
        with: {
          currency: true,
          prizeStructures: {
            orderBy: (structures, { asc }) => [asc(structures.sortOrder)],
            with: {
              prizeLevels: {
                orderBy: (levels, { asc }) => [asc(levels.sortOrder)],
                with: {
                  prizeItems: {
                    orderBy: (items, { asc }) => [asc(items.sortOrder)],
                  },
                },
              },
            },
          },
          blindLevels: {
            orderBy: (levels, { asc }) => [asc(levels.level)],
          },
        },
        orderBy: [asc(tournaments.sortOrder), desc(tournaments.createdAt)],
      })

      // Use custom URL if provided, otherwise generate from location data
      const googleMapsUrl =
        store.customMapUrl ||
        generateGoogleMapsUrl({
          placeId: store.placeId,
          latitude: store.latitude ? Number(store.latitude) : null,
          longitude: store.longitude ? Number(store.longitude) : null,
          address: store.address,
        })

      return {
        ...store,
        cashGames: cashGameList,
        tournaments: tournamentList,
        googleMapsUrl,
      }
    }),

  /**
   * Create a new store.
   */
  create: protectedProcedure
    .input(createStoreSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const [newStore] = await ctx.db
        .insert(stores)
        .values({
          userId,
          name: input.name,
          address: input.address,
          latitude: input.latitude?.toString(),
          longitude: input.longitude?.toString(),
          placeId: input.placeId,
          customMapUrl: input.customMapUrl,
          notes: input.notes,
        })
        .returning()

      return newStore
    }),

  /**
   * Update an existing store.
   */
  update: protectedProcedure
    .input(updateStoreSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.stores.findFirst({
        where: and(
          eq(stores.id, input.id),
          eq(stores.userId, userId),
          isNotDeleted(stores.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '店舗が見つかりません',
        })
      }

      const updateData: Partial<typeof stores.$inferInsert> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.address !== undefined) updateData.address = input.address
      if (input.latitude !== undefined)
        updateData.latitude = input.latitude?.toString() ?? null
      if (input.longitude !== undefined)
        updateData.longitude = input.longitude?.toString() ?? null
      if (input.placeId !== undefined) updateData.placeId = input.placeId
      if (input.customMapUrl !== undefined)
        updateData.customMapUrl = input.customMapUrl
      if (input.notes !== undefined) updateData.notes = input.notes

      const [updated] = await ctx.db
        .update(stores)
        .set(updateData)
        .where(eq(stores.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Archive or unarchive a store.
   */
  archive: protectedProcedure
    .input(archiveStoreSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.stores.findFirst({
        where: and(
          eq(stores.id, input.id),
          eq(stores.userId, userId),
          isNotDeleted(stores.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '店舗が見つかりません',
        })
      }

      const [updated] = await ctx.db
        .update(stores)
        .set({ isArchived: input.isArchived })
        .where(eq(stores.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Delete a store (soft delete).
   */
  delete: protectedProcedure
    .input(deleteStoreSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.stores.findFirst({
        where: and(
          eq(stores.id, input.id),
          eq(stores.userId, userId),
          isNotDeleted(stores.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '店舗が見つかりません',
        })
      }

      const [deleted] = await ctx.db
        .update(stores)
        .set({ deletedAt: softDelete() })
        .where(eq(stores.id, input.id))
        .returning()

      return deleted
    }),
})
