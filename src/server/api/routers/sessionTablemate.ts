import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'

import {
  isNotDeleted,
  isNotTemporary,
  playerNotes,
  players,
  playerTagAssignments,
  pokerSessions,
  sessionTablemates,
} from '~/server/db/schema'
import {
  convertToPlayerSchema,
  createSelfSessionTablemateSchema,
  createSessionTablemateSchema,
  deleteSessionTablemateSchema,
  linkTablemateToPlayerSchema,
  listSessionTablematesSchema,
  updateSessionTablemateSchema,
} from '../schemas/sessionTablemate.schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * SessionTablemate router for managing tablemates during sessions.
 *
 * Tablemates are now backed by temporary players (isTemporary=true).
 * This allows full player features (tags, notes) to be used during sessions.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId.
 */
export const sessionTablemateRouter = createTRPCRouter({
  /**
   * List all tablemates for a session.
   */
  list: protectedProcedure
    .input(listSessionTablematesSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session belongs to user
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'セッションが見つかりません',
        })
      }

      const tablemates = await ctx.db.query.sessionTablemates.findMany({
        where: and(
          eq(sessionTablemates.sessionId, input.sessionId),
          eq(sessionTablemates.userId, userId),
        ),
        with: {
          player: {
            columns: {
              id: true,
              name: true,
              isTemporary: true,
              generalNotes: true,
            },
            with: {
              tagAssignments: {
                with: {
                  tag: true,
                },
              },
              notes: true,
            },
          },
        },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
      })

      return { tablemates }
    }),

  /**
   * Create a new tablemate for a session.
   * Automatically creates a temporary player with default name "Seat X".
   */
  create: protectedProcedure
    .input(createSessionTablemateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session belongs to user
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'セッションが見つかりません',
        })
      }

      // Check if seat is already taken
      const existingTablemate = await ctx.db.query.sessionTablemates.findFirst({
        where: and(
          eq(sessionTablemates.sessionId, input.sessionId),
          eq(sessionTablemates.seatNumber, input.seatNumber),
        ),
      })

      if (existingTablemate) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'この席は既に使用されています',
        })
      }

      // Create temporary player with empty name (UI shows "Seat X" as placeholder)
      const playerName = ''
      const [player] = await ctx.db
        .insert(players)
        .values({
          userId,
          name: playerName,
          isTemporary: true,
        })
        .returning()

      if (!player) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '仮プレイヤーの作成に失敗しました',
        })
      }

      // Create tablemate linked to the temporary player
      const [tablemate] = await ctx.db
        .insert(sessionTablemates)
        .values({
          userId,
          sessionId: input.sessionId,
          seatNumber: input.seatNumber,
          playerId: player.id,
        })
        .returning()

      return { tablemate, player }
    }),

  /**
   * Create a self-seating tablemate (the user themselves).
   * No player record is created; playerId is null.
   * Only one isSelf=true record per session is allowed.
   */
  createSelf: protectedProcedure
    .input(createSelfSessionTablemateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session belongs to user
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'セッションが見つかりません',
        })
      }

      // Check if self is already seated in this session
      const existingSelf = await ctx.db.query.sessionTablemates.findFirst({
        where: and(
          eq(sessionTablemates.sessionId, input.sessionId),
          eq(sessionTablemates.userId, userId),
          eq(sessionTablemates.isSelf, true),
        ),
      })

      if (existingSelf) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '既に自分が着席しています',
        })
      }

      // Check if seat is already taken
      const existingTablemate = await ctx.db.query.sessionTablemates.findFirst({
        where: and(
          eq(sessionTablemates.sessionId, input.sessionId),
          eq(sessionTablemates.seatNumber, input.seatNumber),
        ),
      })

      if (existingTablemate) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'この席は既に使用されています',
        })
      }

      // Create self tablemate (no player record)
      const [tablemate] = await ctx.db
        .insert(sessionTablemates)
        .values({
          userId,
          sessionId: input.sessionId,
          seatNumber: input.seatNumber,
          isSelf: true,
          playerId: null,
        })
        .returning()

      return { tablemate }
    }),

  /**
   * Update a tablemate's session notes.
   * Notes are stored on the tablemate record (session-specific).
   */
  update: protectedProcedure
    .input(updateSessionTablemateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify tablemate exists and belongs to user
      const existing = await ctx.db.query.sessionTablemates.findFirst({
        where: and(
          eq(sessionTablemates.id, input.id),
          eq(sessionTablemates.userId, userId),
        ),
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '同卓者が見つかりません',
        })
      }

      // Build update data
      const updateData: Partial<typeof sessionTablemates.$inferInsert> = {}
      if (input.sessionNotes !== undefined)
        updateData.sessionNotes = input.sessionNotes

      await ctx.db
        .update(sessionTablemates)
        .set(updateData)
        .where(eq(sessionTablemates.id, input.id))

      return { success: true }
    }),

  /**
   * Delete a tablemate and its associated temporary player.
   */
  delete: protectedProcedure
    .input(deleteSessionTablemateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify tablemate exists and belongs to user
      const existing = await ctx.db.query.sessionTablemates.findFirst({
        where: and(
          eq(sessionTablemates.id, input.id),
          eq(sessionTablemates.userId, userId),
        ),
        with: {
          player: true,
        },
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '同卓者が見つかりません',
        })
      }

      // Delete tablemate first (due to FK constraint)
      await ctx.db
        .delete(sessionTablemates)
        .where(eq(sessionTablemates.id, input.id))

      // If the linked player is temporary, delete it too
      if (existing.playerId && existing.player?.isTemporary) {
        const tempPlayerId = existing.playerId

        // Delete tag assignments first
        await ctx.db
          .delete(playerTagAssignments)
          .where(eq(playerTagAssignments.playerId, tempPlayerId))

        // Delete player notes
        await ctx.db
          .delete(playerNotes)
          .where(eq(playerNotes.playerId, tempPlayerId))

        // Delete the temporary player
        await ctx.db
          .delete(players)
          .where(eq(players.id, tempPlayerId))
      }

      return { success: true }
    }),

  /**
   * Link (merge) a tablemate's temporary player with an existing permanent player.
   * - Moves tag assignments from temp player to target player
   * - Moves notes from temp player to target player
   * - Updates tablemate to point to target player
   * - Deletes the temporary player
   */
  linkToPlayer: protectedProcedure
    .input(linkTablemateToPlayerSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify tablemate exists and belongs to user
      const tablemate = await ctx.db.query.sessionTablemates.findFirst({
        where: and(
          eq(sessionTablemates.id, input.id),
          eq(sessionTablemates.userId, userId),
        ),
        with: {
          player: true,
        },
      })

      if (!tablemate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '同卓者が見つかりません',
        })
      }

      // Verify target player exists and belongs to user (and is not temporary)
      const targetPlayer = await ctx.db.query.players.findFirst({
        where: and(
          eq(players.id, input.playerId),
          eq(players.userId, userId),
          isNotDeleted(players.deletedAt),
          isNotTemporary(players.isTemporary),
        ),
      })

      if (!targetPlayer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'プレイヤーが見つかりません',
        })
      }

      const tempPlayerId = tablemate.playerId

      // Only merge if there's a temporary player to merge from
      if (tempPlayerId && tablemate.player?.isTemporary) {
        // Move tag assignments from temp player to target player
        // (update playerId, skip if tag already exists on target)
        const tempTagAssignments = await ctx.db.query.playerTagAssignments.findMany({
          where: eq(playerTagAssignments.playerId, tempPlayerId),
        })

        const targetTagAssignments = await ctx.db.query.playerTagAssignments.findMany({
          where: eq(playerTagAssignments.playerId, input.playerId),
        })

        const targetTagIds = new Set(targetTagAssignments.map(a => a.tagId))

        for (const assignment of tempTagAssignments) {
          if (!targetTagIds.has(assignment.tagId)) {
            // Move to target player
            await ctx.db
              .update(playerTagAssignments)
              .set({ playerId: input.playerId })
              .where(eq(playerTagAssignments.id, assignment.id))
          } else {
            // Delete duplicate
            await ctx.db
              .delete(playerTagAssignments)
              .where(eq(playerTagAssignments.id, assignment.id))
          }
        }

        // Move notes from temp player to target player
        await ctx.db
          .update(playerNotes)
          .set({ playerId: input.playerId })
          .where(eq(playerNotes.playerId, tempPlayerId))

        // Delete the temporary player
        await ctx.db
          .delete(players)
          .where(eq(players.id, tempPlayerId))
      }

      // Update tablemate to point to target player
      await ctx.db
        .update(sessionTablemates)
        .set({
          playerId: input.playerId,
        })
        .where(eq(sessionTablemates.id, input.id))

      return { success: true }
    }),

  /**
   * Convert a temporary player to a permanent player.
   * Simply removes the isTemporary flag.
   * Optionally allows renaming the player.
   */
  convertToPlayer: protectedProcedure
    .input(convertToPlayerSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify tablemate exists and belongs to user
      const tablemate = await ctx.db.query.sessionTablemates.findFirst({
        where: and(
          eq(sessionTablemates.id, input.id),
          eq(sessionTablemates.userId, userId),
        ),
        with: {
          player: true,
        },
      })

      if (!tablemate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '同卓者が見つかりません',
        })
      }

      if (!tablemate.playerId || !tablemate.player?.isTemporary) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'この同卓者は仮プレイヤーではありません',
        })
      }

      // Update player: remove temporary flag, optionally rename
      const updateData: Partial<typeof players.$inferInsert> = {
        isTemporary: false,
      }
      if (input.playerName) {
        updateData.name = input.playerName
      }

      await ctx.db
        .update(players)
        .set(updateData)
        .where(eq(players.id, tablemate.playerId))

      // Fetch updated player
      const player = await ctx.db.query.players.findFirst({
        where: eq(players.id, tablemate.playerId),
      })

      return { player }
    }),
})
