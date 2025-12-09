import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { parseNumeric } from "@/lib/utils/currency";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { currencies, games, locations, pokerSessions, sessionTags, tags } from "@/server/db/schema";

// Zod validation schemas
export const createSessionSchema = z
  .object({
    date: z.coerce.date(),
    locationId: z.number().int().positive().optional(),
    newLocationName: z.string().min(1).max(255).trim().optional(),
    gameId: z.number().int().positive().optional().nullable(),
    buyIn: z.number().nonnegative(),
    cashOut: z.number().nonnegative(),
    durationMinutes: z.number().int().positive(),
    notes: z.string().max(50000).optional(),
    existingTagIds: z.array(z.number().int().positive()).max(20).optional(),
    newTagNames: z.array(z.string().min(1).max(50).trim()).max(20).optional(),
  })
  .refine((data) => data.locationId !== undefined || data.newLocationName !== undefined, {
    message: "locationId または newLocationName のいずれかが必要です",
  });

export const updateSessionSchema = z.object({
  id: z.number().int().positive(),
  date: z.coerce.date().optional(),
  locationId: z.number().int().positive().optional(),
  newLocationName: z.string().min(1).max(255).trim().optional(),
  gameId: z.number().int().positive().optional().nullable(),
  buyIn: z.number().nonnegative().optional(),
  cashOut: z.number().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(50000).optional().nullable(),
  existingTagIds: z.array(z.number().int().positive()).max(20).optional(),
  newTagNames: z.array(z.string().min(1).max(50).trim()).max(20).optional(),
});

export const getByIdSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteSessionSchema = z.object({
  id: z.number().int().positive(),
});

export const filterSessionsSchema = z
  .object({
    locationIds: z.array(z.number().int().positive()).optional(),
    tagIds: z.array(z.number().int().positive()).max(20).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    message: "startDate must be before or equal to endDate",
  });

// Helper function to add profit to session
function addProfit<T extends { buyIn: string; cashOut: string }>(
  session: T
): T & { profit: number } {
  return {
    ...session,
    profit: parseNumeric(session.cashOut) - parseNumeric(session.buyIn),
  };
}

export const sessionsRouter = createTRPCRouter({
  // Create a new poker session
  create: protectedProcedure.input(createSessionSchema).mutation(async ({ ctx, input }) => {
    return await ctx.db.transaction(async (tx) => {
      // 1. Determine locationId
      let locationId = input.locationId;

      if (input.newLocationName) {
        // Create or get location
        const normalizedLocationName = input.newLocationName.trim();
        const [existingLocation] = await tx
          .select()
          .from(locations)
          .where(
            and(
              eq(locations.userId, ctx.session.user.id),
              sql`LOWER(${locations.name}) = LOWER(${normalizedLocationName})`
            )
          );

        if (existingLocation) {
          locationId = existingLocation.id;
        } else {
          const [newLocation] = await tx
            .insert(locations)
            .values({
              userId: ctx.session.user.id,
              name: normalizedLocationName,
            })
            .returning();

          if (!newLocation) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "場所の作成に失敗しました",
            });
          }

          locationId = newLocation.id;
        }
      }

      if (!locationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "場所を指定してください",
        });
      }

      // 2. Create or get tags
      const tagIds: number[] = [];

      if (input.newTagNames && input.newTagNames.length > 0) {
        for (const tagName of input.newTagNames) {
          const normalizedTagName = tagName.trim();
          const [existingTag] = await tx
            .select()
            .from(tags)
            .where(
              and(
                eq(tags.userId, ctx.session.user.id),
                sql`LOWER(${tags.name}) = LOWER(${normalizedTagName})`
              )
            );

          if (existingTag) {
            tagIds.push(existingTag.id);
          } else {
            const [newTag] = await tx
              .insert(tags)
              .values({
                userId: ctx.session.user.id,
                name: normalizedTagName,
              })
              .returning();

            if (!newTag) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "タグの作成に失敗しました",
              });
            }

            tagIds.push(newTag.id);
          }
        }
      }

      if (input.existingTagIds) {
        tagIds.push(...input.existingTagIds);
      }

      // Validate max tags
      if (tagIds.length > 20) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "タグは最大20個まで設定できます",
        });
      }

      // 3. Create session
      const [session] = await tx
        .insert(pokerSessions)
        .values({
          userId: ctx.session.user.id,
          date: input.date,
          locationId,
          gameId: input.gameId ?? null,
          buyIn: input.buyIn.toFixed(2),
          cashOut: input.cashOut.toFixed(2),
          durationMinutes: input.durationMinutes,
          notes: input.notes || null,
        })
        .returning();

      if (!session) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "セッションの作成に失敗しました",
        });
      }

      // 5. Create session-tag associations
      if (tagIds.length > 0) {
        await tx.insert(sessionTags).values(
          tagIds.map((tagId) => ({
            sessionId: session.id,
            tagId,
          }))
        );
      }

      // 6. Fetch location and tags for response
      const [location] = await tx.select().from(locations).where(eq(locations.id, locationId));

      const sessionTagsData = await tx
        .select({
          id: tags.id,
          name: tags.name,
        })
        .from(sessionTags)
        .innerJoin(tags, eq(sessionTags.tagId, tags.id))
        .where(eq(sessionTags.sessionId, session.id));

      return {
        ...addProfit(session),
        location: location ?? { id: locationId, name: "" },
        tags: sessionTagsData,
      };
    });
  }),

  // Get all sessions for the authenticated user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db
      .select()
      .from(pokerSessions)
      .where(eq(pokerSessions.userId, ctx.session.user.id))
      .orderBy(desc(pokerSessions.date));

    // Fetch locations, games, and tags for all sessions
    const results = await Promise.all(
      sessions.map(async (session) => {
        const [location] = await ctx.db
          .select()
          .from(locations)
          .where(eq(locations.id, session.locationId));

        // Fetch game with currency if gameId exists
        let game: {
          id: number;
          name: string;
          smallBlind: number;
          bigBlind: number;
          currencyPrefix: string;
        } | null = null;
        if (session.gameId) {
          const [gameData] = await ctx.db
            .select({
              id: games.id,
              name: games.name,
              smallBlind: games.smallBlind,
              bigBlind: games.bigBlind,
              currencyPrefix: currencies.prefix,
            })
            .from(games)
            .innerJoin(currencies, eq(games.currencyId, currencies.id))
            .where(eq(games.id, session.gameId));
          game = gameData ?? null;
        }

        const sessionTagsData = await ctx.db
          .select({
            id: tags.id,
            name: tags.name,
          })
          .from(sessionTags)
          .innerJoin(tags, eq(sessionTags.tagId, tags.id))
          .where(eq(sessionTags.sessionId, session.id));

        return {
          ...addProfit(session),
          location: location ?? { id: session.locationId, name: "" },
          game,
          tags: sessionTagsData,
        };
      })
    );

    return results;
  }),

  // Get a single session by ID (user-scoped)
  getById: protectedProcedure.input(getByIdSchema).query(async ({ ctx, input }) => {
    const [session] = await ctx.db
      .select()
      .from(pokerSessions)
      .where(and(eq(pokerSessions.id, input.id), eq(pokerSessions.userId, ctx.session.user.id)));

    if (!session) {
      return null;
    }

    // Fetch location
    const [location] = await ctx.db
      .select()
      .from(locations)
      .where(eq(locations.id, session.locationId));

    // Fetch game with currency if gameId exists
    let game: {
      id: number;
      name: string;
      smallBlind: number;
      bigBlind: number;
      currencyPrefix: string;
    } | null = null;
    if (session.gameId) {
      const [gameData] = await ctx.db
        .select({
          id: games.id,
          name: games.name,
          smallBlind: games.smallBlind,
          bigBlind: games.bigBlind,
          currencyPrefix: currencies.prefix,
        })
        .from(games)
        .innerJoin(currencies, eq(games.currencyId, currencies.id))
        .where(eq(games.id, session.gameId));
      game = gameData ?? null;
    }

    const sessionTagsData = await ctx.db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(sessionTags)
      .innerJoin(tags, eq(sessionTags.tagId, tags.id))
      .where(eq(sessionTags.sessionId, session.id));

    return {
      ...addProfit(session),
      location: location ?? { id: session.locationId, name: "" },
      game,
      tags: sessionTagsData,
    };
  }),

  // Update a session (owner verification)
  update: protectedProcedure.input(updateSessionSchema).mutation(async ({ ctx, input }) => {
    return await ctx.db.transaction(async (tx) => {
      const { id, ...updates } = input;

      // Verify ownership first
      const [existing] = await tx
        .select()
        .from(pokerSessions)
        .where(and(eq(pokerSessions.id, id), eq(pokerSessions.userId, ctx.session.user.id)));

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "セッションが見つかりません",
        });
      }

      // Determine locationId if location update is provided
      let locationId = existing.locationId;

      if (updates.newLocationName) {
        const normalizedLocationName = updates.newLocationName.trim();
        const [existingLocation] = await tx
          .select()
          .from(locations)
          .where(
            and(
              eq(locations.userId, ctx.session.user.id),
              sql`LOWER(${locations.name}) = LOWER(${normalizedLocationName})`
            )
          );

        if (existingLocation) {
          locationId = existingLocation.id;
        } else {
          const [newLocation] = await tx
            .insert(locations)
            .values({
              userId: ctx.session.user.id,
              name: normalizedLocationName,
            })
            .returning();

          if (newLocation) {
            locationId = newLocation.id;
          }
        }
      } else if (updates.locationId !== undefined) {
        locationId = updates.locationId;
      }

      // Handle tag updates
      if (updates.existingTagIds !== undefined || updates.newTagNames !== undefined) {
        // Delete existing tag associations
        await tx.delete(sessionTags).where(eq(sessionTags.sessionId, id));

        // Create new tag associations
        const tagIds: number[] = [];

        if (updates.newTagNames && updates.newTagNames.length > 0) {
          for (const tagName of updates.newTagNames) {
            const normalizedTagName = tagName.trim();
            const [existingTag] = await tx
              .select()
              .from(tags)
              .where(
                and(
                  eq(tags.userId, ctx.session.user.id),
                  sql`LOWER(${tags.name}) = LOWER(${normalizedTagName})`
                )
              );

            if (existingTag) {
              tagIds.push(existingTag.id);
            } else {
              const [newTag] = await tx
                .insert(tags)
                .values({
                  userId: ctx.session.user.id,
                  name: normalizedTagName,
                })
                .returning();

              if (newTag) {
                tagIds.push(newTag.id);
              }
            }
          }
        }

        if (updates.existingTagIds) {
          tagIds.push(...updates.existingTagIds);
        }

        if (tagIds.length > 20) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "タグは最大20個まで設定できます",
          });
        }

        if (tagIds.length > 0) {
          await tx.insert(sessionTags).values(
            tagIds.map((tagId) => ({
              sessionId: id,
              tagId,
            }))
          );
        }
      }

      // Prepare update values for session
      const values: Record<string, unknown> = {};
      if (updates.date !== undefined) values.date = updates.date;
      if (locationId !== existing.locationId) values.locationId = locationId;
      if (updates.gameId !== undefined) values.gameId = updates.gameId;
      if (updates.buyIn !== undefined) values.buyIn = updates.buyIn.toFixed(2);
      if (updates.cashOut !== undefined) values.cashOut = updates.cashOut.toFixed(2);
      if (updates.durationMinutes !== undefined) values.durationMinutes = updates.durationMinutes;
      if (updates.notes !== undefined) {
        values.notes = updates.notes || null;
      }

      // Update session
      const [updated] = await tx
        .update(pokerSessions)
        .set(values)
        .where(eq(pokerSessions.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "セッションの更新に失敗しました",
        });
      }

      // Fetch location and tags for response
      const [location] = await tx
        .select()
        .from(locations)
        .where(eq(locations.id, updated.locationId));

      const sessionTagsData = await tx
        .select({
          id: tags.id,
          name: tags.name,
        })
        .from(sessionTags)
        .innerJoin(tags, eq(sessionTags.tagId, tags.id))
        .where(eq(sessionTags.sessionId, updated.id));

      return {
        ...addProfit(updated),
        location: location ?? { id: updated.locationId, name: "" },
        tags: sessionTagsData,
      };
    });
  }),

  // Delete a session (owner verification)
  delete: protectedProcedure.input(deleteSessionSchema).mutation(async ({ ctx, input }) => {
    const result = await ctx.db
      .delete(pokerSessions)
      .where(and(eq(pokerSessions.id, input.id), eq(pokerSessions.userId, ctx.session.user.id)))
      .returning();

    return { success: result.length > 0 };
  }),

  // Get statistics for authenticated user
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Get all user sessions with locations, games, and currency info
    const sessionsData = await ctx.db
      .select({
        id: pokerSessions.id,
        buyIn: pokerSessions.buyIn,
        cashOut: pokerSessions.cashOut,
        durationMinutes: pokerSessions.durationMinutes,
        locationId: pokerSessions.locationId,
        locationName: locations.name,
        gameId: pokerSessions.gameId,
        gameName: games.name,
        bigBlind: games.bigBlind,
        currencyId: games.currencyId,
      })
      .from(pokerSessions)
      .innerJoin(locations, eq(pokerSessions.locationId, locations.id))
      .leftJoin(games, eq(pokerSessions.gameId, games.id))
      .where(eq(pokerSessions.userId, ctx.session.user.id));

    // Return zero stats if no sessions
    if (sessionsData.length === 0) {
      return {
        totalProfit: 0,
        sessionCount: 0,
        avgProfit: 0,
        totalDurationMinutes: 0,
        totalProfitBB: null as number | null,
        avgProfitBB: null as number | null,
        sessionsWithGameCount: 0,
        byLocation: [],
        byLocationGame: [],
      };
    }

    // Get all currencies for the user to have prefix info
    const userCurrencies = await ctx.db
      .select({
        id: currencies.id,
        name: currencies.name,
        prefix: currencies.prefix,
      })
      .from(currencies)
      .where(eq(currencies.userId, ctx.session.user.id));

    const currencyMap = new Map(userCurrencies.map((c) => [c.id, c]));

    // Calculate overall stats
    let totalProfit = 0;
    let totalDurationMinutes = 0;
    let totalProfitBB = 0;
    let sessionsWithGameCount = 0;
    const locationMap = new Map<
      number,
      {
        locationId: number;
        locationName: string;
        profit: number;
        count: number;
        profitBB: number;
        countWithGame: number;
      }
    >();

    // locationId-gameId combination stats
    const locationGameMap = new Map<
      string,
      {
        locationId: number;
        locationName: string;
        gameId: number;
        gameName: string;
        currencyId: number;
        currencyPrefix: string;
        bigBlind: number;
        profit: number;
        durationMinutes: number;
        count: number;
      }
    >();

    for (const session of sessionsData) {
      const profit = parseNumeric(session.cashOut) - parseNumeric(session.buyIn);
      totalProfit += profit;
      totalDurationMinutes += session.durationMinutes;

      // BB単位計算（ゲームが設定されている場合のみ）
      let profitBB = 0;
      const hasGame = session.gameId !== null && session.bigBlind !== null && session.bigBlind > 0;
      if (hasGame) {
        profitBB = profit / session.bigBlind!;
        totalProfitBB += profitBB;
        sessionsWithGameCount += 1;
      }

      // Aggregate by location ID (for backwards compatibility)
      const locationStats = locationMap.get(session.locationId);
      if (locationStats) {
        locationStats.profit += profit;
        locationStats.count += 1;
        if (hasGame) {
          locationStats.profitBB += profitBB;
          locationStats.countWithGame += 1;
        }
      } else {
        locationMap.set(session.locationId, {
          locationId: session.locationId,
          locationName: session.locationName,
          profit,
          count: 1,
          profitBB: hasGame ? profitBB : 0,
          countWithGame: hasGame ? 1 : 0,
        });
      }

      // Aggregate by location + game combination
      if (hasGame && session.gameId && session.gameName && session.currencyId) {
        const key = `${session.locationId}-${session.gameId}`;
        const currency = currencyMap.get(session.currencyId);
        const existing = locationGameMap.get(key);
        if (existing) {
          existing.profit += profit;
          existing.durationMinutes += session.durationMinutes;
          existing.count += 1;
        } else {
          locationGameMap.set(key, {
            locationId: session.locationId,
            locationName: session.locationName,
            gameId: session.gameId,
            gameName: session.gameName,
            currencyId: session.currencyId,
            currencyPrefix: currency?.prefix || "",
            bigBlind: session.bigBlind!,
            profit,
            durationMinutes: session.durationMinutes,
            count: 1,
          });
        }
      }
    }

    const sessionCount = sessionsData.length;
    const avgProfit = Math.round(totalProfit / sessionCount);
    const avgProfitBB =
      sessionsWithGameCount > 0
        ? Math.round(totalProfitBB * 10) / 10 / sessionsWithGameCount
        : null;
    const totalProfitBBResult =
      sessionsWithGameCount > 0 ? Math.round(totalProfitBB * 10) / 10 : null;

    // Build location stats array (for backwards compatibility)
    const byLocation = Array.from(locationMap.values()).map((stats) => ({
      location: {
        id: stats.locationId,
        name: stats.locationName,
      },
      profit: stats.profit,
      count: stats.count,
      avgProfit: Math.round(stats.profit / stats.count),
      profitBB: stats.countWithGame > 0 ? Math.round(stats.profitBB * 10) / 10 : null,
      avgProfitBB:
        stats.countWithGame > 0
          ? Math.round((stats.profitBB / stats.countWithGame) * 10) / 10
          : null,
    }));

    // Build location+game stats array
    const byLocationGame = Array.from(locationGameMap.values()).map((stats) => ({
      location: {
        id: stats.locationId,
        name: stats.locationName,
      },
      game: {
        id: stats.gameId,
        name: stats.gameName,
      },
      currency: {
        id: stats.currencyId,
        prefix: stats.currencyPrefix,
      },
      profit: stats.profit,
      durationMinutes: stats.durationMinutes,
      count: stats.count,
      // 時給計算 (profit / hours)
      hourlyRate:
        stats.durationMinutes > 0 ? Math.round((stats.profit / stats.durationMinutes) * 60) : 0,
    }));

    return {
      totalProfit,
      sessionCount,
      avgProfit,
      totalDurationMinutes,
      totalProfitBB: totalProfitBBResult,
      avgProfitBB,
      sessionsWithGameCount,
      byLocation,
      byLocationGame,
    };
  }),

  // Get filtered sessions with optional location, tags, and date range filters
  getFiltered: protectedProcedure.input(filterSessionsSchema).query(async ({ ctx, input }) => {
    // Build where conditions array
    const conditions = [eq(pokerSessions.userId, ctx.session.user.id)];

    // Add location filter if provided (OR condition for multiple locations)
    if (input.locationIds && input.locationIds.length > 0) {
      conditions.push(inArray(pokerSessions.locationId, input.locationIds));
    }

    // Add date range filters if provided
    if (input.startDate) {
      conditions.push(gte(pokerSessions.date, input.startDate));
    }
    if (input.endDate) {
      conditions.push(lte(pokerSessions.date, input.endDate));
    }

    // Execute base query
    let sessions = await ctx.db
      .select()
      .from(pokerSessions)
      .where(and(...conditions))
      .orderBy(desc(pokerSessions.date));

    // Filter by tags (AND condition - session must have ALL specified tags)
    if (input.tagIds && input.tagIds.length > 0) {
      const sessionIdsWithAllTags = await ctx.db
        .select({ sessionId: sessionTags.sessionId })
        .from(sessionTags)
        .where(inArray(sessionTags.tagId, input.tagIds))
        .groupBy(sessionTags.sessionId)
        .having(sql`COUNT(DISTINCT ${sessionTags.tagId}) = ${input.tagIds.length}`);

      const validSessionIds = new Set(sessionIdsWithAllTags.map((row) => row.sessionId));
      sessions = sessions.filter((session) => validSessionIds.has(session.id));
    }

    // Fetch locations, games, and tags for all sessions
    const results = await Promise.all(
      sessions.map(async (session) => {
        const [location] = await ctx.db
          .select()
          .from(locations)
          .where(eq(locations.id, session.locationId));

        // Fetch game with currency if gameId exists
        let game: {
          id: number;
          name: string;
          smallBlind: number;
          bigBlind: number;
          currencyPrefix: string;
        } | null = null;
        if (session.gameId) {
          const [gameData] = await ctx.db
            .select({
              id: games.id,
              name: games.name,
              smallBlind: games.smallBlind,
              bigBlind: games.bigBlind,
              currencyPrefix: currencies.prefix,
            })
            .from(games)
            .innerJoin(currencies, eq(games.currencyId, currencies.id))
            .where(eq(games.id, session.gameId));
          game = gameData ?? null;
        }

        const sessionTagsData = await ctx.db
          .select({
            id: tags.id,
            name: tags.name,
          })
          .from(sessionTags)
          .innerJoin(tags, eq(sessionTags.tagId, tags.id))
          .where(eq(sessionTags.sessionId, session.id));

        return {
          ...addProfit(session),
          location: location ?? { id: session.locationId, name: "" },
          game,
          tags: sessionTagsData,
        };
      })
    );

    return results;
  }),
});
