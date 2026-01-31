import { TRPCError } from '@trpc/server'
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm'

import {
  isNotDeleted,
  isNotTemporary,
  playerNotes,
  players,
  playerTagAssignments,
  playerTags,
  softDelete,
} from '~/server/db/schema'
import {
  addNoteSchema,
  assignTagSchema,
  createPlayerSchema,
  deleteNoteSchema,
  deletePlayerSchema,
  getPlayerByIdSchema,
  listPlayersSchema,
  removeTagSchema,
  updateNoteSchema,
  updatePlayerSchema,
} from '../schemas/player.schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * Player router for managing opponent profiles.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId.
 *
 * @see data-model.md Sections 16-19
 */
export const playerRouter = createTRPCRouter({
  // ============================================================================
  // Player CRUD
  // ============================================================================

  /**
   * List all players for the current user with optional search and tag filters.
   */
  list: protectedProcedure
    .input(listPlayersSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Base conditions: exclude deleted and temporary players
      const conditions = [
        eq(players.userId, userId),
        isNotDeleted(players.deletedAt),
        isNotTemporary(players.isTemporary),
      ]

      // Search by name if provided
      if (input?.search) {
        conditions.push(ilike(players.name, `%${input.search}%`))
      }

      // Get player IDs filtered by tags if provided
      let filteredPlayerIds: string[] | null = null
      if (input?.tagIds && input.tagIds.length > 0) {
        const assignmentsResult = await ctx.db
          .select({ playerId: playerTagAssignments.playerId })
          .from(playerTagAssignments)
          .where(inArray(playerTagAssignments.tagId, input.tagIds))
          .groupBy(playerTagAssignments.playerId)
          .having(
            sql`COUNT(DISTINCT ${playerTagAssignments.tagId}) = ${input.tagIds.length}`,
          )

        filteredPlayerIds = assignmentsResult.map((r) => r.playerId)

        // If no players match the tag filter, return empty array
        if (filteredPlayerIds.length === 0) {
          return { players: [] }
        }

        conditions.push(inArray(players.id, filteredPlayerIds))
      }

      // Query players
      const playerList = await ctx.db
        .select()
        .from(players)
        .where(and(...conditions))
        .orderBy(desc(players.createdAt))

      // Get tags for each player
      const playersWithTags = await Promise.all(
        playerList.map(async (player) => {
          const assignments = await ctx.db
            .select({
              tagId: playerTagAssignments.tagId,
              tagName: playerTags.name,
              tagColor: playerTags.color,
            })
            .from(playerTagAssignments)
            .innerJoin(
              playerTags,
              and(
                eq(playerTagAssignments.tagId, playerTags.id),
                isNotDeleted(playerTags.deletedAt),
              ),
            )
            .where(eq(playerTagAssignments.playerId, player.id))

          return {
            ...player,
            tags: assignments.map((a) => ({
              id: a.tagId,
              name: a.tagName,
              color: a.tagColor,
            })),
          }
        }),
      )

      return { players: playersWithTags }
    }),

  /**
   * Get a single player by ID with tags and notes.
   */
  getById: protectedProcedure
    .input(getPlayerByIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const player = await ctx.db.query.players.findFirst({
        where: and(
          eq(players.id, input.id),
          eq(players.userId, userId),
          isNotDeleted(players.deletedAt),
        ),
      })

      if (!player) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'プレイヤーが見つかりません',
        })
      }

      // Get tags
      const assignments = await ctx.db
        .select({
          tagId: playerTagAssignments.tagId,
          tagName: playerTags.name,
          tagColor: playerTags.color,
        })
        .from(playerTagAssignments)
        .innerJoin(
          playerTags,
          and(
            eq(playerTagAssignments.tagId, playerTags.id),
            isNotDeleted(playerTags.deletedAt),
          ),
        )
        .where(eq(playerTagAssignments.playerId, player.id))

      // Get notes
      const notes = await ctx.db
        .select()
        .from(playerNotes)
        .where(
          and(
            eq(playerNotes.playerId, player.id),
            isNotDeleted(playerNotes.deletedAt),
          ),
        )
        .orderBy(desc(playerNotes.noteDate))

      return {
        ...player,
        tags: assignments.map((a) => ({
          id: a.tagId,
          name: a.tagName,
          color: a.tagColor,
        })),
        notes: notes.map((n) => ({
          id: n.id,
          noteDate: n.noteDate,
          content: n.content,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })),
      }
    }),

  /**
   * Create a new player.
   */
  create: protectedProcedure
    .input(createPlayerSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const [newPlayer] = await ctx.db
        .insert(players)
        .values({
          userId,
          name: input.name,
          generalNotes: input.generalNotes,
        })
        .returning()

      return newPlayer
    }),

  /**
   * Update an existing player.
   */
  update: protectedProcedure
    .input(updatePlayerSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.players.findFirst({
        where: and(
          eq(players.id, input.id),
          eq(players.userId, userId),
          isNotDeleted(players.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'プレイヤーが見つかりません',
        })
      }

      const updateData: Partial<typeof players.$inferInsert> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.generalNotes !== undefined)
        updateData.generalNotes = input.generalNotes

      // If no fields to update, return existing record
      if (Object.keys(updateData).length === 0) {
        return existing
      }

      const [updated] = await ctx.db
        .update(players)
        .set(updateData)
        .where(eq(players.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Delete a player (soft delete).
   */
  delete: protectedProcedure
    .input(deletePlayerSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existing = await ctx.db.query.players.findFirst({
        where: and(
          eq(players.id, input.id),
          eq(players.userId, userId),
          isNotDeleted(players.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'プレイヤーが見つかりません',
        })
      }

      const [deleted] = await ctx.db
        .update(players)
        .set({ deletedAt: softDelete() })
        .where(eq(players.id, input.id))
        .returning()

      return deleted
    }),

  // ============================================================================
  // Tag Assignment
  // ============================================================================

  /**
   * Assign a tag to a player.
   */
  assignTag: protectedProcedure
    .input(assignTagSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify player ownership
      const player = await ctx.db.query.players.findFirst({
        where: and(
          eq(players.id, input.playerId),
          eq(players.userId, userId),
          isNotDeleted(players.deletedAt),
        ),
      })

      if (!player) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'プレイヤーが見つかりません',
        })
      }

      // Verify tag ownership
      const tag = await ctx.db.query.playerTags.findFirst({
        where: and(
          eq(playerTags.id, input.tagId),
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

      // Check if already assigned
      const existing = await ctx.db.query.playerTagAssignments.findFirst({
        where: and(
          eq(playerTagAssignments.playerId, input.playerId),
          eq(playerTagAssignments.tagId, input.tagId),
        ),
      })

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'このタグは既に割り当てられています',
        })
      }

      const [assignment] = await ctx.db
        .insert(playerTagAssignments)
        .values({
          playerId: input.playerId,
          tagId: input.tagId,
        })
        .returning()

      return assignment
    }),

  /**
   * Remove a tag from a player.
   */
  removeTag: protectedProcedure
    .input(removeTagSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify player ownership
      const player = await ctx.db.query.players.findFirst({
        where: and(
          eq(players.id, input.playerId),
          eq(players.userId, userId),
          isNotDeleted(players.deletedAt),
        ),
      })

      if (!player) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'プレイヤーが見つかりません',
        })
      }

      // Delete assignment
      const deleted = await ctx.db
        .delete(playerTagAssignments)
        .where(
          and(
            eq(playerTagAssignments.playerId, input.playerId),
            eq(playerTagAssignments.tagId, input.tagId),
          ),
        )
        .returning()

      if (deleted.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'タグの割り当てが見つかりません',
        })
      }

      return deleted[0]
    }),

  // ============================================================================
  // Notes Management
  // ============================================================================

  /**
   * Add a note to a player.
   */
  addNote: protectedProcedure
    .input(addNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify player ownership
      const player = await ctx.db.query.players.findFirst({
        where: and(
          eq(players.id, input.playerId),
          eq(players.userId, userId),
          isNotDeleted(players.deletedAt),
        ),
      })

      if (!player) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'プレイヤーが見つかりません',
        })
      }

      const [note] = await ctx.db
        .insert(playerNotes)
        .values({
          playerId: input.playerId,
          userId,
          noteDate: input.noteDate,
          content: input.content,
        })
        .returning()

      return note
    }),

  /**
   * Update a note.
   */
  updateNote: protectedProcedure
    .input(updateNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify note ownership
      const existing = await ctx.db.query.playerNotes.findFirst({
        where: and(
          eq(playerNotes.id, input.id),
          eq(playerNotes.userId, userId),
          isNotDeleted(playerNotes.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ノートが見つかりません',
        })
      }

      const updateData: Partial<typeof playerNotes.$inferInsert> = {}
      if (input.content !== undefined) updateData.content = input.content
      if (input.noteDate !== undefined) updateData.noteDate = input.noteDate

      const [updated] = await ctx.db
        .update(playerNotes)
        .set(updateData)
        .where(eq(playerNotes.id, input.id))
        .returning()

      return updated
    }),

  /**
   * Delete a note (soft delete).
   */
  deleteNote: protectedProcedure
    .input(deleteNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify note ownership
      const existing = await ctx.db.query.playerNotes.findFirst({
        where: and(
          eq(playerNotes.id, input.id),
          eq(playerNotes.userId, userId),
          isNotDeleted(playerNotes.deletedAt),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ノートが見つかりません',
        })
      }

      const [deleted] = await ctx.db
        .update(playerNotes)
        .set({ deletedAt: softDelete() })
        .where(eq(playerNotes.id, input.id))
        .returning()

      return deleted
    }),
})
