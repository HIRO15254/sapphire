import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { parseNumeric } from "@/lib/utils/currency";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pokerSessions } from "@/server/db/schema";

// Zod validation schemas
export const createSessionSchema = z.object({
  date: z.coerce.date(),
  location: z.string().min(1).max(255).trim(),
  buyIn: z.number().nonnegative(),
  cashOut: z.number().nonnegative(),
  durationMinutes: z.number().int().positive(),
  notes: z.string().max(10000).optional(),
});

export const updateSessionSchema = z.object({
  id: z.number().int().positive(),
  date: z.coerce.date().optional(),
  location: z.string().min(1).max(255).trim().optional(),
  buyIn: z.number().nonnegative().optional(),
  cashOut: z.number().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(10000).optional().nullable(),
});

export const getByIdSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteSessionSchema = z.object({
  id: z.number().int().positive(),
});

export const filterSessionsSchema = z
  .object({
    location: z.string().optional(),
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
    const [session] = await ctx.db
      .insert(pokerSessions)
      .values({
        userId: ctx.session.user.id,
        date: input.date,
        location: input.location,
        buyIn: input.buyIn.toFixed(2),
        cashOut: input.cashOut.toFixed(2),
        durationMinutes: input.durationMinutes,
        notes: input.notes ?? null,
      })
      .returning();

    if (!session) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create session",
      });
    }

    return addProfit(session);
  }),

  // Get all sessions for the authenticated user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db
      .select()
      .from(pokerSessions)
      .where(eq(pokerSessions.userId, ctx.session.user.id))
      .orderBy(desc(pokerSessions.date));

    return sessions.map(addProfit);
  }),

  // Get a single session by ID (user-scoped)
  getById: protectedProcedure.input(getByIdSchema).query(async ({ ctx, input }) => {
    const [session] = await ctx.db
      .select()
      .from(pokerSessions)
      .where(and(eq(pokerSessions.id, input.id), eq(pokerSessions.userId, ctx.session.user.id)));

    return session ? addProfit(session) : null;
  }),

  // Update a session (owner verification)
  update: protectedProcedure.input(updateSessionSchema).mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input;

    // Prepare update values
    const values: Record<string, unknown> = {};
    if (updates.date !== undefined) values.date = updates.date;
    if (updates.location !== undefined) values.location = updates.location;
    if (updates.buyIn !== undefined) values.buyIn = updates.buyIn.toFixed(2);
    if (updates.cashOut !== undefined) values.cashOut = updates.cashOut.toFixed(2);
    if (updates.durationMinutes !== undefined) values.durationMinutes = updates.durationMinutes;
    if (updates.notes !== undefined) values.notes = updates.notes;

    // Update with owner verification
    const [updated] = await ctx.db
      .update(pokerSessions)
      .set(values)
      .where(and(eq(pokerSessions.id, id), eq(pokerSessions.userId, ctx.session.user.id)))
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Session not found or you do not have permission to update it",
      });
    }

    return addProfit(updated);
  }),

  // Delete a session (owner verification)
  delete: protectedProcedure.input(deleteSessionSchema).mutation(async ({ ctx, input }) => {
    const result = await ctx.db
      .delete(pokerSessions)
      .where(and(eq(pokerSessions.id, input.id), eq(pokerSessions.userId, ctx.session.user.id)))
      .returning();

    return { success: result.length > 0 };
  }),
});
