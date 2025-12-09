import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { currencies, games, locations, pokerSessions } from "@/server/db/schema";

// Zod validation schemas
export const createGameSchema = z
  .object({
    locationId: z.number().int().positive("店舗を選択してください"),
    currencyId: z.number().int().positive("通貨を選択してください"),
    name: z.string().trim().min(1, "ゲーム名は必須です").max(100, "ゲーム名は100文字以内です"),
    smallBlind: z.number().int().positive("SBは1以上の整数です"),
    bigBlind: z.number().int().positive("BBは1以上の整数です"),
    ante: z.number().int().min(0, "Anteは0以上の整数です").default(0),
    minBuyIn: z.number().int().positive("最小バイインは1以上の整数です"),
    maxBuyIn: z.number().int().positive("最大バイインは1以上の整数です"),
    rules: z.string().max(50000).optional(),
  })
  .refine((data) => data.bigBlind >= data.smallBlind, {
    message: "BBはSB以上でなければなりません",
    path: ["bigBlind"],
  })
  .refine((data) => data.maxBuyIn >= data.minBuyIn, {
    message: "最大バイインは最小バイイン以上でなければなりません",
    path: ["maxBuyIn"],
  });

export const getAllGamesSchema = z
  .object({
    includeArchived: z.boolean().default(true),
  })
  .optional();

export const getByLocationSchema = z.object({
  locationId: z.number().int().positive(),
  includeArchived: z.boolean().default(true),
});

export const getActiveByLocationSchema = z.object({
  locationId: z.number().int().positive(),
});

export const getByIdSchema = z.object({
  id: z.number().int().positive(),
});

export const updateGameSchema = z
  .object({
    id: z.number().int().positive(),
    currencyId: z.number().int().positive().optional(),
    name: z.string().trim().min(1).max(100).optional(),
    smallBlind: z.number().int().positive().optional(),
    bigBlind: z.number().int().positive().optional(),
    ante: z.number().int().min(0).optional(),
    minBuyIn: z.number().int().positive().optional(),
    maxBuyIn: z.number().int().positive().optional(),
    rules: z.string().max(50000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.smallBlind !== undefined && data.bigBlind !== undefined) {
        return data.bigBlind >= data.smallBlind;
      }
      return true;
    },
    { message: "BBはSB以上でなければなりません", path: ["bigBlind"] }
  )
  .refine(
    (data) => {
      if (data.minBuyIn !== undefined && data.maxBuyIn !== undefined) {
        return data.maxBuyIn >= data.minBuyIn;
      }
      return true;
    },
    { message: "最大バイインは最小バイイン以上でなければなりません", path: ["maxBuyIn"] }
  );

export const archiveGameSchema = z.object({
  id: z.number().int().positive(),
});

export const unarchiveGameSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteGameSchema = z.object({
  id: z.number().int().positive(),
});

export const checkUsageSchema = z.object({
  id: z.number().int().positive(),
});

// Helper: Verify location ownership
async function verifyLocationOwnership(
  db: Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]["ctx"]["db"],
  locationId: number,
  userId: string
) {
  const [location] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.userId, userId)));

  return location;
}

// Helper: Verify currency ownership
async function verifyCurrencyOwnership(
  db: Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]["ctx"]["db"],
  currencyId: number,
  userId: string
) {
  const [currency] = await db
    .select()
    .from(currencies)
    .where(and(eq(currencies.id, currencyId), eq(currencies.userId, userId)));

  return currency;
}

// Helper: Verify game ownership (via location)
async function verifyGameOwnership(
  db: Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]["ctx"]["db"],
  gameId: number,
  userId: string
) {
  const [game] = await db
    .select({
      id: games.id,
      locationId: games.locationId,
      currencyId: games.currencyId,
      name: games.name,
      smallBlind: games.smallBlind,
      bigBlind: games.bigBlind,
      ante: games.ante,
      minBuyIn: games.minBuyIn,
      maxBuyIn: games.maxBuyIn,
      rules: games.rules,
      isArchived: games.isArchived,
      createdAt: games.createdAt,
      updatedAt: games.updatedAt,
    })
    .from(games)
    .innerJoin(locations, eq(locations.id, games.locationId))
    .where(and(eq(games.id, gameId), eq(locations.userId, userId)));

  return game;
}

export const gamesRouter = createTRPCRouter({
  // Create a new game
  create: protectedProcedure.input(createGameSchema).mutation(async ({ ctx, input }) => {
    // Verify location ownership
    const location = await verifyLocationOwnership(ctx.db, input.locationId, ctx.session.user.id);
    if (!location) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "店舗が見つかりません",
      });
    }

    // Verify currency ownership
    const currency = await verifyCurrencyOwnership(ctx.db, input.currencyId, ctx.session.user.id);
    if (!currency) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "通貨が見つかりません",
      });
    }

    const normalizedName = input.name.trim();

    // Check for duplicate game name in the same location
    const [existing] = await ctx.db
      .select()
      .from(games)
      .where(
        and(
          eq(games.locationId, input.locationId),
          sql`LOWER(${games.name}) = ${normalizedName.toLowerCase()}`
        )
      );

    if (existing) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "同じ名前のゲームがこの店舗に既に存在します",
      });
    }

    // Create new game
    const [newGame] = await ctx.db
      .insert(games)
      .values({
        locationId: input.locationId,
        currencyId: input.currencyId,
        name: normalizedName,
        smallBlind: input.smallBlind,
        bigBlind: input.bigBlind,
        ante: input.ante,
        minBuyIn: input.minBuyIn,
        maxBuyIn: input.maxBuyIn,
        rules: input.rules,
      })
      .returning();

    if (!newGame) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "ゲームの作成に失敗しました",
      });
    }

    return {
      ...newGame,
      location: { id: location.id, name: location.name },
      currency: { id: currency.id, name: currency.name },
    };
  }),

  // Get all games for the authenticated user (across all locations)
  getAll: protectedProcedure.input(getAllGamesSchema).query(async ({ ctx, input }) => {
    const includeArchived = input?.includeArchived ?? true;

    const conditions = [eq(locations.userId, ctx.session.user.id)];
    if (!includeArchived) {
      conditions.push(eq(games.isArchived, false));
    }

    const results = await ctx.db
      .select({
        id: games.id,
        name: games.name,
        smallBlind: games.smallBlind,
        bigBlind: games.bigBlind,
        ante: games.ante,
        minBuyIn: games.minBuyIn,
        maxBuyIn: games.maxBuyIn,
        isArchived: games.isArchived,
        createdAt: games.createdAt,
        updatedAt: games.updatedAt,
        locationId: locations.id,
        locationName: locations.name,
        currencyId: currencies.id,
        currencyName: currencies.name,
        sessionCount: sql<number>`COUNT(${pokerSessions.id})::int`,
      })
      .from(games)
      .innerJoin(locations, eq(locations.id, games.locationId))
      .innerJoin(currencies, eq(currencies.id, games.currencyId))
      .leftJoin(pokerSessions, eq(pokerSessions.gameId, games.id))
      .where(and(...conditions))
      .groupBy(games.id, locations.id, locations.name, currencies.id, currencies.name)
      .orderBy(locations.name, games.name);

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      smallBlind: r.smallBlind,
      bigBlind: r.bigBlind,
      ante: r.ante,
      minBuyIn: r.minBuyIn,
      maxBuyIn: r.maxBuyIn,
      isArchived: r.isArchived,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      location: { id: r.locationId, name: r.locationName },
      currency: { id: r.currencyId, name: r.currencyName },
      _count: { sessions: r.sessionCount },
    }));
  }),

  // Get games for a specific location
  getByLocation: protectedProcedure.input(getByLocationSchema).query(async ({ ctx, input }) => {
    // Verify location ownership
    const location = await verifyLocationOwnership(ctx.db, input.locationId, ctx.session.user.id);
    if (!location) {
      return [];
    }

    const conditions = [eq(games.locationId, input.locationId)];
    if (!input.includeArchived) {
      conditions.push(eq(games.isArchived, false));
    }

    const results = await ctx.db
      .select({
        id: games.id,
        name: games.name,
        smallBlind: games.smallBlind,
        bigBlind: games.bigBlind,
        ante: games.ante,
        minBuyIn: games.minBuyIn,
        maxBuyIn: games.maxBuyIn,
        isArchived: games.isArchived,
        createdAt: games.createdAt,
        updatedAt: games.updatedAt,
        currencyId: currencies.id,
        currencyName: currencies.name,
        sessionCount: sql<number>`COUNT(${pokerSessions.id})::int`,
      })
      .from(games)
      .innerJoin(currencies, eq(currencies.id, games.currencyId))
      .leftJoin(pokerSessions, eq(pokerSessions.gameId, games.id))
      .where(and(...conditions))
      .groupBy(games.id, currencies.id, currencies.name)
      .orderBy(games.name);

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      smallBlind: r.smallBlind,
      bigBlind: r.bigBlind,
      ante: r.ante,
      minBuyIn: r.minBuyIn,
      maxBuyIn: r.maxBuyIn,
      isArchived: r.isArchived,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      currency: { id: r.currencyId, name: r.currencyName },
      _count: { sessions: r.sessionCount },
    }));
  }),

  // Get active games for a specific location (for session form dropdown)
  getActiveByLocation: protectedProcedure
    .input(getActiveByLocationSchema)
    .query(async ({ ctx, input }) => {
      // Verify location ownership
      const location = await verifyLocationOwnership(ctx.db, input.locationId, ctx.session.user.id);
      if (!location) {
        return [];
      }

      const results = await ctx.db
        .select({
          id: games.id,
          name: games.name,
          smallBlind: games.smallBlind,
          bigBlind: games.bigBlind,
          ante: games.ante,
          minBuyIn: games.minBuyIn,
          maxBuyIn: games.maxBuyIn,
          currencyId: currencies.id,
          currencyName: currencies.name,
        })
        .from(games)
        .innerJoin(currencies, eq(currencies.id, games.currencyId))
        .where(and(eq(games.locationId, input.locationId), eq(games.isArchived, false)))
        .orderBy(games.name);

      return results.map((r) => ({
        id: r.id,
        name: r.name,
        smallBlind: r.smallBlind,
        bigBlind: r.bigBlind,
        ante: r.ante,
        minBuyIn: r.minBuyIn,
        maxBuyIn: r.maxBuyIn,
        currency: { id: r.currencyId, name: r.currencyName },
      }));
    }),

  // Get game by ID
  getById: protectedProcedure.input(getByIdSchema).query(async ({ ctx, input }) => {
    const game = await verifyGameOwnership(ctx.db, input.id, ctx.session.user.id);
    if (!game) {
      return null;
    }

    // Get location and currency info
    const [location] = await ctx.db
      .select()
      .from(locations)
      .where(eq(locations.id, game.locationId));
    const [currency] = await ctx.db
      .select()
      .from(currencies)
      .where(eq(currencies.id, game.currencyId));

    // Get session count
    const [sessionCount] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(pokerSessions)
      .where(eq(pokerSessions.gameId, input.id));

    return {
      ...game,
      location: location ? { id: location.id, name: location.name } : null,
      currency: currency ? { id: currency.id, name: currency.name } : null,
      _count: { sessions: sessionCount?.count ?? 0 },
    };
  }),

  // Update game
  update: protectedProcedure.input(updateGameSchema).mutation(async ({ ctx, input }) => {
    const { id, ...updateData } = input;

    // Verify game ownership
    const existingGame = await verifyGameOwnership(ctx.db, id, ctx.session.user.id);
    if (!existingGame) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ゲームが見つかりません",
      });
    }

    // If currency is being changed, verify new currency ownership
    if (updateData.currencyId) {
      const currency = await verifyCurrencyOwnership(
        ctx.db,
        updateData.currencyId,
        ctx.session.user.id
      );
      if (!currency) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "通貨が見つかりません",
        });
      }
    }

    // Check for duplicate name if name is being changed
    if (updateData.name) {
      const normalizedName = updateData.name.trim();
      const [duplicate] = await ctx.db
        .select()
        .from(games)
        .where(
          and(
            eq(games.locationId, existingGame.locationId),
            sql`LOWER(${games.name}) = ${normalizedName.toLowerCase()}`,
            sql`${games.id} != ${id}`
          )
        );

      if (duplicate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "同じ名前のゲームがこの店舗に既に存在します",
        });
      }
    }

    // Build update object
    const updateValues: Record<string, unknown> = {};
    if (updateData.currencyId !== undefined) updateValues.currencyId = updateData.currencyId;
    if (updateData.name !== undefined) updateValues.name = updateData.name.trim();
    if (updateData.smallBlind !== undefined) updateValues.smallBlind = updateData.smallBlind;
    if (updateData.bigBlind !== undefined) updateValues.bigBlind = updateData.bigBlind;
    if (updateData.ante !== undefined) updateValues.ante = updateData.ante;
    if (updateData.minBuyIn !== undefined) updateValues.minBuyIn = updateData.minBuyIn;
    if (updateData.maxBuyIn !== undefined) updateValues.maxBuyIn = updateData.maxBuyIn;
    if (updateData.rules !== undefined) updateValues.rules = updateData.rules;

    // Update game
    const [updated] = await ctx.db
      .update(games)
      .set(updateValues)
      .where(eq(games.id, id))
      .returning();

    // Get location and currency info
    const [location] = await ctx.db
      .select()
      .from(locations)
      .where(eq(locations.id, updated!.locationId));
    const [currency] = await ctx.db
      .select()
      .from(currencies)
      .where(eq(currencies.id, updated!.currencyId));

    return {
      ...updated!,
      location: { id: location!.id, name: location!.name },
      currency: { id: currency!.id, name: currency!.name },
    };
  }),

  // Archive a game
  archive: protectedProcedure.input(archiveGameSchema).mutation(async ({ ctx, input }) => {
    const game = await verifyGameOwnership(ctx.db, input.id, ctx.session.user.id);
    if (!game) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ゲームが見つかりません",
      });
    }

    await ctx.db.update(games).set({ isArchived: true }).where(eq(games.id, input.id));

    return { success: true };
  }),

  // Unarchive a game
  unarchive: protectedProcedure.input(unarchiveGameSchema).mutation(async ({ ctx, input }) => {
    const game = await verifyGameOwnership(ctx.db, input.id, ctx.session.user.id);
    if (!game) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ゲームが見つかりません",
      });
    }

    await ctx.db.update(games).set({ isArchived: false }).where(eq(games.id, input.id));

    return { success: true };
  }),

  // Delete a game (only if not used by any sessions)
  delete: protectedProcedure.input(deleteGameSchema).mutation(async ({ ctx, input }) => {
    const game = await verifyGameOwnership(ctx.db, input.id, ctx.session.user.id);
    if (!game) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ゲームが見つかりません",
      });
    }

    // Check if game is used by any sessions
    const [usage] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(pokerSessions)
      .where(eq(pokerSessions.gameId, input.id));

    if (usage && usage.count > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "このゲームはセッションで使用されているため削除できません",
      });
    }

    await ctx.db.delete(games).where(eq(games.id, input.id));

    return { success: true };
  }),

  // Check if game can be deleted (usage check)
  checkUsage: protectedProcedure.input(checkUsageSchema).query(async ({ ctx, input }) => {
    const game = await verifyGameOwnership(ctx.db, input.id, ctx.session.user.id);
    if (!game) {
      return { canDelete: false, sessionCount: 0 };
    }

    const [usage] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(pokerSessions)
      .where(eq(pokerSessions.gameId, input.id));

    return {
      canDelete: (usage?.count ?? 0) === 0,
      sessionCount: usage?.count ?? 0,
    };
  }),
});
