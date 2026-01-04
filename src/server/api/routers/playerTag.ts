import { TRPCError } from '@trpc/server'
import { and, desc, eq, sql } from 'drizzle-orm'

import {
  isNotDeleted,
  playerTagAssignments,
  playerTags,
  softDelete,
} from '~/server/db/schema'
import {
  createTagSchema,
  deleteTagSchema,
  getTagByIdSchema,
  updateTagSchema,
} from '../schemas/player.schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * PlayerTag router for managing player tags/labels.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId.
 *
 * @see data-model.md Section 17. PlayerTag
 */
export const playerTagRouter = createTRPCRouter({
  // ============================================================================
  // Tag CRUD
  // ============================================================================

  /**
   * List all tags for the current user.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const tagList = await ctx.db
      .select()
      .from(playerTags)
      .where(
        and(eq(playerTags.userId, userId), isNotDeleted(playerTags.deletedAt)),
      )
      .orderBy(desc(playerTags.createdAt))

    return { tags: tagList }
  }),

  /**
   * Get a single tag by ID with player count.
   */
  getById: protectedProcedure
    .input(getTagByIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const tag = await ctx.db.query.playerTags.findFirst({
        where: and(
          eq(playerTags.id, input.id),
          eq(playerTags.userId, userId),
          isNotDeleted(playerTags.deletedAt),
        ),
      })

      if (!tag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'タグが見つかりません',
        })
      }

      // Count players with this tag
      const countResult = await ctx.db
        .select({
          count: sql<number>`COUNT(*)::integer`,
        })
        .from(playerTagAssignments)
        .where(eq(playerTagAssignments.tagId, tag.id))

      return {
        ...tag,
        playerCount: countResult[0]?.count ?? 0,
      }
    }),

  /**
   * Create a new tag.
   */
  create: protectedProcedure
    .input(createTagSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Check for duplicate name
      const existing = await ctx.db.query.playerTags.findFirst({
        where: and(
          eq(playerTags.userId, userId),
          eq(playerTags.name, input.name),
          isNotDeleted(playerTags.deletedAt),
        ),
      })

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '同じ名前のタグが既に存在します',
        })
      }

      const [newTag] = await ctx.db
        .insert(playerTags)
        .values({
          userId,
          name: input.name,
          color: input.color,
        })
        .returning()

      return newTag
    }),

  /**
   * Update an existing tag.
   */
  update: protectedProcedure
    .input(updateTagSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.playerTags.findFirst({
        where: and(
          eq(playerTags.id, input.id),
          eq(playerTags.userId, userId),
          isNotDeleted(playerTags.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'タグが見つかりません',
        })
      }

      // Check for duplicate name if name is being updated
      if (input.name && input.name !== existing.name) {
        const duplicate = await ctx.db.query.playerTags.findFirst({
          where: and(
            eq(playerTags.userId, userId),
            eq(playerTags.name, input.name),
            isNotDeleted(playerTags.deletedAt),
          ),
        })

        if (duplicate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '同じ名前のタグが既に存在します',
          })
        }
      }

      const updateData: Partial<typeof playerTags.$inferInsert> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.color !== undefined) updateData.color = input.color

      const [updated] = await ctx.db
        .update(playerTags)
        .set(updateData)
        .where(eq(playerTags.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Delete a tag (soft delete).
   * Also removes all tag assignments.
   */
  delete: protectedProcedure
    .input(deleteTagSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.playerTags.findFirst({
        where: and(
          eq(playerTags.id, input.id),
          eq(playerTags.userId, userId),
          isNotDeleted(playerTags.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'タグが見つかりません',
        })
      }

      // Delete all assignments for this tag
      await ctx.db
        .delete(playerTagAssignments)
        .where(eq(playerTagAssignments.tagId, input.id))

      // Soft delete the tag
      const [deleted] = await ctx.db
        .update(playerTags)
        .set({ deletedAt: softDelete() })
        .where(eq(playerTags.id, input.id))
        .returning()

      return deleted
    }),
})
