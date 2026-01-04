import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'

import {
  isNotDeleted,
  players,
  pokerSessions,
  sessionTablemates,
} from '~/server/db/schema'
import {
  convertToPlayerSchema,
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
            },
          },
        },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
      })

      return { tablemates }
    }),

  /**
   * Create a new tablemate for a session.
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

      // If playerId is provided, verify it belongs to user
      if (input.playerId) {
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
      }

      const [tablemate] = await ctx.db
        .insert(sessionTablemates)
        .values({
          userId,
          sessionId: input.sessionId,
          nickname: input.nickname,
          seatNumber: input.seatNumber,
          sessionNotes: input.sessionNotes,
          playerId: input.playerId,
        })
        .returning()

      return { tablemate }
    }),

  /**
   * Update a tablemate.
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

      // If playerId is provided (and not null), verify it belongs to user
      if (input.playerId) {
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
      }

      // Build update data
      const updateData: Partial<typeof sessionTablemates.$inferInsert> = {}
      if (input.nickname !== undefined) updateData.nickname = input.nickname
      if (input.seatNumber !== undefined)
        updateData.seatNumber = input.seatNumber
      if (input.sessionNotes !== undefined)
        updateData.sessionNotes = input.sessionNotes
      if (input.playerId !== undefined) updateData.playerId = input.playerId

      await ctx.db
        .update(sessionTablemates)
        .set(updateData)
        .where(eq(sessionTablemates.id, input.id))

      return { success: true }
    }),

  /**
   * Delete a tablemate.
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
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '同卓者が見つかりません',
        })
      }

      await ctx.db
        .delete(sessionTablemates)
        .where(eq(sessionTablemates.id, input.id))

      return { success: true }
    }),

  /**
   * Link a tablemate to an existing player.
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
      })

      if (!tablemate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '同卓者が見つかりません',
        })
      }

      // Verify player exists and belongs to user
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

      await ctx.db
        .update(sessionTablemates)
        .set({ playerId: input.playerId })
        .where(eq(sessionTablemates.id, input.id))

      return { success: true }
    }),

  /**
   * Convert a tablemate to a new player record.
   * Creates a new player and links it to this tablemate.
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
      })

      if (!tablemate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '同卓者が見つかりません',
        })
      }

      // Create new player
      const [player] = await ctx.db
        .insert(players)
        .values({
          userId,
          name: input.playerName,
          generalNotes: input.generalNotes,
        })
        .returning()

      if (!player) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'プレイヤーの作成に失敗しました',
        })
      }

      // Link tablemate to new player
      await ctx.db
        .update(sessionTablemates)
        .set({ playerId: player.id })
        .where(eq(sessionTablemates.id, input.id))

      return { player }
    }),
})
