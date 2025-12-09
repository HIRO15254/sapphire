import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { currencies, games, locations } from "@/server/db/schema";

// Zod validation schemas
export const createCurrencySchema = z.object({
  name: z.string().trim().min(1, "通貨名は必須です").max(100, "通貨名は100文字以内です"),
  prefix: z.string().trim().max(10, "プレフィックスは10文字以内です").optional().default(""),
});

export const getByIdSchema = z.object({
  id: z.number().int().positive(),
});

export const updateCurrencySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1, "通貨名は必須です").max(100, "通貨名は100文字以内です"),
  prefix: z.string().trim().max(10, "プレフィックスは10文字以内です").optional(),
});

export const deleteCurrencySchema = z.object({
  id: z.number().int().positive(),
});

export const checkUsageSchema = z.object({
  id: z.number().int().positive(),
});

export const updateBalanceSchema = z.object({
  id: z.number().int().positive(),
  balance: z.number(),
});

export const currenciesRouter = createTRPCRouter({
  // Create a new currency
  create: protectedProcedure.input(createCurrencySchema).mutation(async ({ ctx, input }) => {
    const normalizedName = input.name.trim();

    // Check for existing currency (case-insensitive)
    const [existing] = await ctx.db
      .select()
      .from(currencies)
      .where(
        and(
          eq(currencies.userId, ctx.session.user.id),
          sql`LOWER(${currencies.name}) = ${normalizedName.toLowerCase()}`
        )
      );

    if (existing) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "同じ名前の通貨が既に存在します",
      });
    }

    // Create new currency
    const [newCurrency] = await ctx.db
      .insert(currencies)
      .values({
        userId: ctx.session.user.id,
        name: normalizedName,
        prefix: input.prefix ?? "",
      })
      .returning();

    if (!newCurrency) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "通貨の作成に失敗しました",
      });
    }

    return newCurrency;
  }),

  // Get all currencies for the authenticated user with game count and balance
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const results = await ctx.db
      .select({
        id: currencies.id,
        name: currencies.name,
        prefix: currencies.prefix,
        balance: currencies.balance,
        createdAt: currencies.createdAt,
        updatedAt: currencies.updatedAt,
        gameCount: sql<number>`COUNT(${games.id})::int`,
      })
      .from(currencies)
      .leftJoin(games, eq(games.currencyId, currencies.id))
      .where(eq(currencies.userId, ctx.session.user.id))
      .groupBy(currencies.id)
      .orderBy(currencies.name);

    return results.map((r) => ({
      ...r,
      balance: Number(r.balance),
      _count: { games: r.gameCount },
    }));
  }),

  // Get currency by ID with associated games
  getById: protectedProcedure.input(getByIdSchema).query(async ({ ctx, input }) => {
    const [currency] = await ctx.db
      .select()
      .from(currencies)
      .where(and(eq(currencies.id, input.id), eq(currencies.userId, ctx.session.user.id)));

    if (!currency) {
      return null;
    }

    // Get associated games with location names
    const associatedGames = await ctx.db
      .select({
        id: games.id,
        name: games.name,
        locationId: games.locationId,
        locationName: locations.name,
      })
      .from(games)
      .innerJoin(locations, eq(locations.id, games.locationId))
      .where(eq(games.currencyId, input.id));

    return {
      ...currency,
      games: associatedGames,
    };
  }),

  // Update currency name
  update: protectedProcedure.input(updateCurrencySchema).mutation(async ({ ctx, input }) => {
    const normalizedName = input.name.trim();

    // Verify ownership
    const [existing] = await ctx.db
      .select()
      .from(currencies)
      .where(and(eq(currencies.id, input.id), eq(currencies.userId, ctx.session.user.id)));

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "通貨が見つかりません",
      });
    }

    // Check for duplicate name (case-insensitive, excluding self)
    const [duplicate] = await ctx.db
      .select()
      .from(currencies)
      .where(
        and(
          eq(currencies.userId, ctx.session.user.id),
          sql`LOWER(${currencies.name}) = ${normalizedName.toLowerCase()}`,
          sql`${currencies.id} != ${input.id}`
        )
      );

    if (duplicate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "同じ名前の通貨が既に存在します",
      });
    }

    // Update currency
    const updateValues: { name: string; prefix?: string } = { name: normalizedName };
    if (input.prefix !== undefined) {
      updateValues.prefix = input.prefix;
    }

    const [updated] = await ctx.db
      .update(currencies)
      .set(updateValues)
      .where(eq(currencies.id, input.id))
      .returning();

    return updated!;
  }),

  // Delete currency (only if not used by any games)
  delete: protectedProcedure.input(deleteCurrencySchema).mutation(async ({ ctx, input }) => {
    // Verify ownership
    const [currency] = await ctx.db
      .select()
      .from(currencies)
      .where(and(eq(currencies.id, input.id), eq(currencies.userId, ctx.session.user.id)));

    if (!currency) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "通貨が見つかりません",
      });
    }

    // Check if currency is used by any games
    const [usage] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(games)
      .where(eq(games.currencyId, input.id));

    if (usage && usage.count > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "この通貨はゲームで使用されているため削除できません",
      });
    }

    // Delete the currency
    await ctx.db.delete(currencies).where(eq(currencies.id, input.id));

    return { success: true };
  }),

  // Check if currency can be deleted (usage check)
  checkUsage: protectedProcedure.input(checkUsageSchema).query(async ({ ctx, input }) => {
    // Verify ownership first
    const [currency] = await ctx.db
      .select()
      .from(currencies)
      .where(and(eq(currencies.id, input.id), eq(currencies.userId, ctx.session.user.id)));

    if (!currency) {
      return { canDelete: false, usedByGames: [] };
    }

    // Get games using this currency
    const usedByGames = await ctx.db
      .select({
        id: games.id,
        name: games.name,
        locationId: games.locationId,
        locationName: locations.name,
      })
      .from(games)
      .innerJoin(locations, eq(locations.id, games.locationId))
      .where(eq(games.currencyId, input.id));

    return {
      canDelete: usedByGames.length === 0,
      usedByGames,
    };
  }),

  // Update currency balance
  updateBalance: protectedProcedure.input(updateBalanceSchema).mutation(async ({ ctx, input }) => {
    // Verify ownership
    const [existing] = await ctx.db
      .select()
      .from(currencies)
      .where(and(eq(currencies.id, input.id), eq(currencies.userId, ctx.session.user.id)));

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "通貨が見つかりません",
      });
    }

    // Update balance
    const [updated] = await ctx.db
      .update(currencies)
      .set({ balance: input.balance.toFixed(2) })
      .where(eq(currencies.id, input.id))
      .returning();

    return {
      ...updated!,
      balance: Number(updated!.balance),
    };
  }),
});
