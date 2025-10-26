import { TRPCError } from "@trpc/server";
import { and, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { sessionTags, tags } from "@/server/db/schema";

// Zod validation schemas
export const getAllTagsSchema = z.object({
  search: z.string().optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
});

export const deleteTagSchema = z.object({
  id: z.number().int().positive(),
});

export const tagsRouter = createTRPCRouter({
  // Get all tags for the authenticated user
  getAll: protectedProcedure.input(getAllTagsSchema).query(async ({ ctx, input }) => {
    const conditions = [eq(tags.userId, ctx.session.user.id)];

    // Add search filter if provided
    if (input.search) {
      conditions.push(ilike(tags.name, `%${input.search}%`));
    }

    // Get tags with session count
    const results = await ctx.db
      .select({
        id: tags.id,
        name: tags.name,
        sessionCount: sql<number>`COUNT(${sessionTags.sessionId})::int`,
      })
      .from(tags)
      .leftJoin(sessionTags, eq(sessionTags.tagId, tags.id))
      .where(and(...conditions))
      .groupBy(tags.id)
      .orderBy(tags.name);

    return results;
  }),

  // Create a new tag (or return existing if duplicate)
  create: protectedProcedure.input(createTagSchema).mutation(async ({ ctx, input }) => {
    const normalizedName = input.name.trim();

    // Check for existing tag (case-insensitive)
    const [existing] = await ctx.db
      .select()
      .from(tags)
      .where(
        and(eq(tags.userId, ctx.session.user.id), sql`LOWER(${tags.name}) = LOWER(${normalizedName})`)
      );

    // Return existing if found
    if (existing) {
      return existing;
    }

    // Create new tag
    const [newTag] = await ctx.db
      .insert(tags)
      .values({
        userId: ctx.session.user.id,
        name: normalizedName,
      })
      .returning();

    if (!newTag) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "タグの作成に失敗しました",
      });
    }

    return newTag;
  }),

  // Delete a tag (FR-021: CASCADE deletes session_tags associations)
  delete: protectedProcedure.input(deleteTagSchema).mutation(async ({ ctx, input }) => {
    // Verify ownership
    const [tag] = await ctx.db
      .select()
      .from(tags)
      .where(and(eq(tags.id, input.id), eq(tags.userId, ctx.session.user.id)));

    if (!tag) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "タグが見つかりません",
      });
    }

    // Count affected sessions before deletion
    const affectedSessionsResult = await ctx.db
      .select({ count: sql<number>`COUNT(DISTINCT ${sessionTags.sessionId})::int` })
      .from(sessionTags)
      .where(eq(sessionTags.tagId, input.id));

    const affectedSessions = affectedSessionsResult[0]?.count ?? 0;

    // Delete the tag (CASCADE will automatically delete session_tags entries)
    await ctx.db.delete(tags).where(eq(tags.id, input.id));

    return {
      success: true,
      affectedSessions,
    };
  }),
});
