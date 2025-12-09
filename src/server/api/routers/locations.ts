import { TRPCError } from "@trpc/server";
import { and, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { games, locations, pokerSessions } from "@/server/db/schema";

// Zod validation schemas
export const getAllLocationsSchema = z.object({
  search: z.string().optional(),
});

export const getByIdSchema = z.object({
  id: z.number().int().positive(),
});

export const createLocationSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const updateLocationSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(100),
});

export const deleteLocationSchema = z.object({
  id: z.number().int().positive(),
});

// Default deleted location name (FR-020)
const DEFAULT_DELETED_LOCATION = "削除された場所";

export const locationsRouter = createTRPCRouter({
  // Get all locations for the authenticated user with session and game counts
  getAll: protectedProcedure.input(getAllLocationsSchema).query(async ({ ctx, input }) => {
    const conditions = [eq(locations.userId, ctx.session.user.id)];

    // Add search filter if provided
    if (input.search) {
      conditions.push(ilike(locations.name, `%${input.search}%`));
    }

    // Get locations with session count
    const locationResults = await ctx.db
      .select({
        id: locations.id,
        userId: locations.userId,
        name: locations.name,
        createdAt: locations.createdAt,
        sessionCount: sql<number>`COUNT(DISTINCT ${pokerSessions.id})::int`,
      })
      .from(locations)
      .leftJoin(pokerSessions, eq(pokerSessions.locationId, locations.id))
      .where(and(...conditions))
      .groupBy(locations.id)
      .orderBy(locations.name);

    // Get game counts for each location
    const gameCounts = await ctx.db
      .select({
        locationId: games.locationId,
        gameCount: sql<number>`COUNT(*)::int`,
      })
      .from(games)
      .where(
        sql`${games.locationId} IN (${sql.join(
          locationResults.map((l) => sql`${l.id}`),
          sql`, `
        )})`
      )
      .groupBy(games.locationId);

    const gameCountMap = new Map(gameCounts.map((g) => [g.locationId, g.gameCount]));

    return locationResults.map((location) => ({
      ...location,
      gameCount: gameCountMap.get(location.id) ?? 0,
    }));
  }),

  // Get a single location by ID
  getById: protectedProcedure.input(getByIdSchema).query(async ({ ctx, input }) => {
    const [location] = await ctx.db
      .select({
        id: locations.id,
        userId: locations.userId,
        name: locations.name,
        createdAt: locations.createdAt,
        updatedAt: locations.updatedAt,
      })
      .from(locations)
      .where(and(eq(locations.id, input.id), eq(locations.userId, ctx.session.user.id)));

    if (!location) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "店舗が見つかりません",
      });
    }

    // Get session count
    const [sessionResult] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(pokerSessions)
      .where(eq(pokerSessions.locationId, input.id));

    // Get game count
    const [gameResult] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(games)
      .where(eq(games.locationId, input.id));

    return {
      ...location,
      sessionCount: sessionResult?.count ?? 0,
      gameCount: gameResult?.count ?? 0,
    };
  }),

  // Create a new location (or return existing if duplicate)
  create: protectedProcedure.input(createLocationSchema).mutation(async ({ ctx, input }) => {
    const normalizedName = input.name.trim();

    // Check for existing location (case-insensitive)
    const [existing] = await ctx.db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.userId, ctx.session.user.id),
          sql`LOWER(${locations.name}) = ${normalizedName.toLowerCase()}`
        )
      );

    // Return existing if found
    if (existing) {
      return existing;
    }

    // Create new location
    const [newLocation] = await ctx.db
      .insert(locations)
      .values({
        userId: ctx.session.user.id,
        name: normalizedName,
      })
      .returning();

    if (!newLocation) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "場所の作成に失敗しました",
      });
    }

    return newLocation;
  }),

  // Update a location's name
  update: protectedProcedure.input(updateLocationSchema).mutation(async ({ ctx, input }) => {
    const normalizedName = input.name.trim();

    // Verify ownership
    const [existing] = await ctx.db
      .select()
      .from(locations)
      .where(and(eq(locations.id, input.id), eq(locations.userId, ctx.session.user.id)));

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "店舗が見つかりません",
      });
    }

    // Check for duplicate name (case-insensitive, excluding self)
    const [duplicate] = await ctx.db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.userId, ctx.session.user.id),
          sql`LOWER(${locations.name}) = ${normalizedName.toLowerCase()}`,
          sql`${locations.id} != ${input.id}`
        )
      );

    if (duplicate) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "同じ名前の店舗が既に存在します",
      });
    }

    // Update the location
    const [updated] = await ctx.db
      .update(locations)
      .set({ name: normalizedName })
      .where(eq(locations.id, input.id))
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "店舗の更新に失敗しました",
      });
    }

    return updated;
  }),

  // Delete a location (only if not assigned to any sessions)
  delete: protectedProcedure.input(deleteLocationSchema).mutation(async ({ ctx, input }) => {
    // Verify ownership
    const [location] = await ctx.db
      .select()
      .from(locations)
      .where(and(eq(locations.id, input.id), eq(locations.userId, ctx.session.user.id)));

    if (!location) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "場所が見つかりません",
      });
    }

    // Prevent deletion of default location
    if (location.name === DEFAULT_DELETED_LOCATION) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "システムデフォルト場所は削除できません",
      });
    }

    // Check if any sessions are using this location
    const [sessionCount] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(pokerSessions)
      .where(eq(pokerSessions.locationId, input.id));

    if (sessionCount && sessionCount.count > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `この場所は${sessionCount.count}件のセッションに使用されているため削除できません`,
      });
    }

    // Delete the location
    await ctx.db.delete(locations).where(eq(locations.id, input.id));

    return {
      success: true,
      affectedSessions: 0,
    };
  }),
});
