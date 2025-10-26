import { TRPCError } from "@trpc/server";
import { and, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { locations, pokerSessions } from "@/server/db/schema";

// Zod validation schemas
export const getAllLocationsSchema = z.object({
  search: z.string().optional(),
});

export const createLocationSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const deleteLocationSchema = z.object({
  id: z.number().int().positive(),
});

// Default deleted location name (FR-020)
const DEFAULT_DELETED_LOCATION = "削除された場所";

export const locationsRouter = createTRPCRouter({
  // Get all locations for the authenticated user
  getAll: protectedProcedure.input(getAllLocationsSchema).query(async ({ ctx, input }) => {
    const conditions = [eq(locations.userId, ctx.session.user.id)];

    // Add search filter if provided
    if (input.search) {
      conditions.push(ilike(locations.name, `%${input.search}%`));
    }

    // Get locations with session count
    const results = await ctx.db
      .select({
        id: locations.id,
        userId: locations.userId,
        name: locations.name,
        sessionCount: sql<number>`COUNT(${pokerSessions.id})::int`,
      })
      .from(locations)
      .leftJoin(pokerSessions, eq(pokerSessions.locationId, locations.id))
      .where(and(...conditions))
      .groupBy(locations.id)
      .orderBy(locations.name);

    return results;
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
