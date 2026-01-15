import { TRPCError } from '@trpc/server'
import { and, asc, desc, eq } from 'drizzle-orm'

import {
  isNotDeleted,
  pokerSessions,
  sessionEvents,
  tournamentBlindLevels,
  tournamentPrizeLevels,
  tournamentPrizeStructures,
} from '~/server/db/schema'
import {
  clearTournamentOverridesSchema,
  deleteEventSchema,
  deleteLatestHandCompleteSchema,
  endSessionSchema,
  listBySessionSchema,
  pauseSessionSchema,
  recordAddonSchema,
  recordHandCompleteSchema,
  recordHandSchema,
  recordHandsPassedSchema,
  recordRebuySchema,
  resumeSessionSchema,
  seatPlayerSchema,
  startSessionSchema,
  updateEventSchema,
  updateStackSchema,
  updateTimerStartedAtSchema,
  updateTournamentFieldSchema,
  updateTournamentOverrideBasicSchema,
  updateTournamentOverrideBlindsSchema,
  updateTournamentOverridePrizesSchema,
} from '../schemas/sessionEvent.schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * SessionEvent router for active session event recording.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId.
 *
 * @see data-model.md Section 14. SessionEvent
 */
export const sessionEventRouter = createTRPCRouter({
  // ============================================================================
  // Session Lifecycle
  // ============================================================================

  /**
   * Start a new active session.
   * Creates a PokerSession with isActive=true and adds session_start event.
   * Only one active session per user is allowed.
   */
  startSession: protectedProcedure
    .input(startSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Check if user already has an active session
      const existingActive = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (existingActive) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '既にアクティブなセッションが存在します',
        })
      }

      const now = new Date()

      // Create new active session
      const [newSession] = await ctx.db
        .insert(pokerSessions)
        .values({
          userId,
          storeId: input.storeId,
          gameType: input.gameType,
          cashGameId: input.cashGameId,
          tournamentId: input.tournamentId,
          isActive: true,
          startTime: now,
          buyIn: input.buyIn,
          timerStartedAt: input.timerStartedAt,
        })
        .returning()

      if (!newSession) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'セッションの作成に失敗しました',
        })
      }

      // Create session_start event
      const [startEvent] = await ctx.db
        .insert(sessionEvents)
        .values({
          sessionId: newSession.id,
          userId,
          eventType: 'session_start',
          eventData: {},
          sequence: 1,
          recordedAt: now,
        })
        .returning()

      // If initialStack is provided (for tournaments), create a stack_update event
      // This sets the starting chip count separate from the monetary buy-in
      if (input.initialStack !== null && input.initialStack !== undefined) {
        await ctx.db.insert(sessionEvents).values({
          sessionId: newSession.id,
          userId,
          eventType: 'stack_update',
          eventData: { amount: input.initialStack },
          sequence: 2,
          recordedAt: now,
        })
      }

      return {
        sessionId: newSession.id,
        eventId: startEvent?.id,
        startTime: now,
      }
    }),

  /**
   * End an active session.
   * Sets endTime and cashOut, marks isActive=false, adds session_end event.
   */
  endSession: protectedProcedure
    .input(endSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and active status
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      const recordedAt = input.recordedAt ?? new Date()

      // Get next sequence number
      const lastEvent = await ctx.db.query.sessionEvents.findFirst({
        where: eq(sessionEvents.sessionId, input.sessionId),
        orderBy: [desc(sessionEvents.sequence)],
      })
      const nextSequence = (lastEvent?.sequence ?? 0) + 1

      // Create session_end event
      const [endEvent] = await ctx.db
        .insert(sessionEvents)
        .values({
          sessionId: input.sessionId,
          userId,
          eventType: 'session_end',
          eventData: { cashOut: input.cashOut },
          sequence: nextSequence,
          recordedAt,
        })
        .returning()

      // Update session to completed
      const [updatedSession] = await ctx.db
        .update(pokerSessions)
        .set({
          isActive: false,
          endTime: recordedAt,
          cashOut: input.cashOut,
          finalPosition: input.finalPosition,
        })
        .where(eq(pokerSessions.id, input.sessionId))
        .returning()

      return {
        sessionId: updatedSession?.id,
        eventId: endEvent?.id,
        endTime: recordedAt,
        profitLoss: input.cashOut - session.buyIn,
      }
    }),

  /**
   * Pause an active session.
   * Adds session_pause event.
   */
  pauseSession: protectedProcedure
    .input(pauseSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and active status
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      const now = new Date()

      // Get next sequence number
      const lastEvent = await ctx.db.query.sessionEvents.findFirst({
        where: eq(sessionEvents.sessionId, input.sessionId),
        orderBy: [desc(sessionEvents.sequence)],
      })
      const nextSequence = (lastEvent?.sequence ?? 0) + 1

      // Create session_pause event
      const [pauseEvent] = await ctx.db
        .insert(sessionEvents)
        .values({
          sessionId: input.sessionId,
          userId,
          eventType: 'session_pause',
          eventData: {},
          sequence: nextSequence,
          recordedAt: now,
        })
        .returning()

      return {
        eventId: pauseEvent?.id,
        recordedAt: now,
      }
    }),

  /**
   * Resume a paused session.
   * Adds session_resume event.
   */
  resumeSession: protectedProcedure
    .input(resumeSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and active status
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      const now = new Date()

      // Get next sequence number
      const lastEvent = await ctx.db.query.sessionEvents.findFirst({
        where: eq(sessionEvents.sessionId, input.sessionId),
        orderBy: [desc(sessionEvents.sequence)],
      })
      const nextSequence = (lastEvent?.sequence ?? 0) + 1

      // Create session_resume event
      const [resumeEvent] = await ctx.db
        .insert(sessionEvents)
        .values({
          sessionId: input.sessionId,
          userId,
          eventType: 'session_resume',
          eventData: {},
          sequence: nextSequence,
          recordedAt: now,
        })
        .returning()

      return {
        eventId: resumeEvent?.id,
        recordedAt: now,
      }
    }),

  // ============================================================================
  // Event Recording
  // ============================================================================

  /**
   * Seat a player at the table.
   * Adds player_seated event.
   */
  seatPlayer: protectedProcedure
    .input(seatPlayerSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and active status
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      const now = new Date()

      // Get next sequence number
      const lastEvent = await ctx.db.query.sessionEvents.findFirst({
        where: eq(sessionEvents.sessionId, input.sessionId),
        orderBy: [desc(sessionEvents.sequence)],
      })
      const nextSequence = (lastEvent?.sequence ?? 0) + 1

      // Create player_seated event
      const [event] = await ctx.db
        .insert(sessionEvents)
        .values({
          sessionId: input.sessionId,
          userId,
          eventType: 'player_seated',
          eventData: {
            playerId: input.playerId,
            seatNumber: input.seatNumber,
            playerName: input.playerName,
          },
          sequence: nextSequence,
          recordedAt: now,
        })
        .returning()

      return {
        eventId: event?.id,
        eventType: 'player_seated',
        eventData: {
          playerId: input.playerId,
          seatNumber: input.seatNumber,
          playerName: input.playerName,
        },
        sequence: nextSequence,
        recordedAt: now,
      }
    }),

  /**
   * Update current stack amount.
   * Adds stack_update event.
   */
  updateStack: protectedProcedure
    .input(updateStackSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and active status
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      const recordedAt = input.recordedAt ?? new Date()

      // Get next sequence number
      const lastEvent = await ctx.db.query.sessionEvents.findFirst({
        where: eq(sessionEvents.sessionId, input.sessionId),
        orderBy: [desc(sessionEvents.sequence)],
      })
      const nextSequence = (lastEvent?.sequence ?? 0) + 1

      // Create stack_update event
      const [event] = await ctx.db
        .insert(sessionEvents)
        .values({
          sessionId: input.sessionId,
          userId,
          eventType: 'stack_update',
          eventData: { amount: input.amount },
          sequence: nextSequence,
          recordedAt,
        })
        .returning()

      return {
        eventId: event?.id,
        eventType: 'stack_update',
        eventData: { amount: input.amount },
        sequence: nextSequence,
        recordedAt,
      }
    }),

  /**
   * Record a rebuy.
   * Adds rebuy event and updates session buyIn total.
   */
  recordRebuy: protectedProcedure
    .input(recordRebuySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and active status
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      const recordedAt = input.recordedAt ?? new Date()

      // Get next sequence number
      const lastEvent = await ctx.db.query.sessionEvents.findFirst({
        where: eq(sessionEvents.sessionId, input.sessionId),
        orderBy: [desc(sessionEvents.sequence)],
      })
      const nextSequence = (lastEvent?.sequence ?? 0) + 1

      // Create rebuy event with cost and chips
      const eventData = {
        amount: input.cost, // backwards compatibility
        cost: input.cost,
        chips: input.chips ?? undefined,
      }

      const [event] = await ctx.db
        .insert(sessionEvents)
        .values({
          sessionId: input.sessionId,
          userId,
          eventType: 'rebuy',
          eventData,
          sequence: nextSequence,
          recordedAt,
        })
        .returning()

      // Update session buyIn total (using cost)
      await ctx.db
        .update(pokerSessions)
        .set({
          buyIn: session.buyIn + input.cost,
        })
        .where(eq(pokerSessions.id, input.sessionId))

      return {
        eventId: event?.id,
        eventType: 'rebuy',
        eventData,
        sequence: nextSequence,
        recordedAt,
        newBuyInTotal: session.buyIn + input.cost,
      }
    }),

  /**
   * Record an addon.
   * Adds addon event and updates session buyIn total.
   */
  recordAddon: protectedProcedure
    .input(recordAddonSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and active status
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      const recordedAt = input.recordedAt ?? new Date()

      // Get next sequence number
      const lastEvent = await ctx.db.query.sessionEvents.findFirst({
        where: eq(sessionEvents.sessionId, input.sessionId),
        orderBy: [desc(sessionEvents.sequence)],
      })
      const nextSequence = (lastEvent?.sequence ?? 0) + 1

      // Create addon event with cost and chips
      const eventData = {
        amount: input.cost, // backwards compatibility
        cost: input.cost,
        chips: input.chips ?? undefined,
      }

      const [event] = await ctx.db
        .insert(sessionEvents)
        .values({
          sessionId: input.sessionId,
          userId,
          eventType: 'addon',
          eventData,
          sequence: nextSequence,
          recordedAt,
        })
        .returning()

      // Update session buyIn total (using cost)
      await ctx.db
        .update(pokerSessions)
        .set({
          buyIn: session.buyIn + input.cost,
        })
        .where(eq(pokerSessions.id, input.sessionId))

      return {
        eventId: event?.id,
        eventType: 'addon',
        eventData,
        sequence: nextSequence,
        recordedAt,
        newBuyInTotal: session.buyIn + input.cost,
      }
    }),

  /**
   * Record hands passed (without full history).
   * Adds hands_passed event.
   */
  recordHandsPassed: protectedProcedure
    .input(recordHandsPassedSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and active status
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      const now = new Date()

      // Get next sequence number
      const lastEvent = await ctx.db.query.sessionEvents.findFirst({
        where: eq(sessionEvents.sessionId, input.sessionId),
        orderBy: [desc(sessionEvents.sequence)],
      })
      const nextSequence = (lastEvent?.sequence ?? 0) + 1

      // Create hands_passed event
      const [event] = await ctx.db
        .insert(sessionEvents)
        .values({
          sessionId: input.sessionId,
          userId,
          eventType: 'hands_passed',
          eventData: { count: input.count },
          sequence: nextSequence,
          recordedAt: now,
        })
        .returning()

      return {
        eventId: event?.id,
        eventType: 'hands_passed',
        eventData: { count: input.count },
        sequence: nextSequence,
        recordedAt: now,
      }
    }),

  /**
   * Record a hand with full history.
   * Adds hand_recorded event.
   */
  recordHand: protectedProcedure
    .input(recordHandSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and active status
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      const now = new Date()

      // Get next sequence number
      const lastEvent = await ctx.db.query.sessionEvents.findFirst({
        where: eq(sessionEvents.sessionId, input.sessionId),
        orderBy: [desc(sessionEvents.sequence)],
      })
      const nextSequence = (lastEvent?.sequence ?? 0) + 1

      // Create hand_recorded event
      const [event] = await ctx.db
        .insert(sessionEvents)
        .values({
          sessionId: input.sessionId,
          userId,
          eventType: 'hand_recorded',
          eventData: { handId: input.handId },
          sequence: nextSequence,
          recordedAt: now,
        })
        .returning()

      return {
        eventId: event?.id,
        eventType: 'hand_recorded',
        eventData: { handId: input.handId },
        sequence: nextSequence,
        recordedAt: now,
      }
    }),

  /**
   * Record a hand completion (for hand counting).
   * Adds hand_complete event. This event is NOT shown in timeline.
   */
  recordHandComplete: protectedProcedure
    .input(recordHandCompleteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and active status
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      const now = new Date()

      // Get next sequence number
      const lastEvent = await ctx.db.query.sessionEvents.findFirst({
        where: eq(sessionEvents.sessionId, input.sessionId),
        orderBy: [desc(sessionEvents.sequence)],
      })
      const nextSequence = (lastEvent?.sequence ?? 0) + 1

      // Create hand_complete event with optional position
      const [event] = await ctx.db
        .insert(sessionEvents)
        .values({
          sessionId: input.sessionId,
          userId,
          eventType: 'hand_complete',
          eventData: input.position ? { position: input.position } : {},
          sequence: nextSequence,
          recordedAt: now,
        })
        .returning()

      return {
        eventId: event?.id,
        eventType: 'hand_complete',
        eventData: input.position ? { position: input.position } : {},
        sequence: nextSequence,
        recordedAt: now,
      }
    }),

  /**
   * Delete the latest hand_complete event.
   * Used to decrement the hand counter.
   */
  deleteLatestHandComplete: protectedProcedure
    .input(deleteLatestHandCompleteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and active status
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      // Find the latest hand_complete event
      const latestHandComplete = await ctx.db.query.sessionEvents.findFirst({
        where: and(
          eq(sessionEvents.sessionId, input.sessionId),
          eq(sessionEvents.userId, userId),
          eq(sessionEvents.eventType, 'hand_complete'),
        ),
        orderBy: [desc(sessionEvents.sequence)],
      })

      if (!latestHandComplete) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '削除するハンド完了イベントがありません',
        })
      }

      // Delete the event
      await ctx.db
        .delete(sessionEvents)
        .where(eq(sessionEvents.id, latestHandComplete.id))

      return {
        success: true,
        deletedEventId: latestHandComplete.id,
      }
    }),

  /**
   * Delete an event.
   * For rebuy/addon events, also adjusts the session buyIn.
   * For pause/resume events, deletes the pair together.
   * Cannot delete session_start or session_end events.
   */
  deleteEvent: protectedProcedure
    .input(deleteEventSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Find the event
      const event = await ctx.db.query.sessionEvents.findFirst({
        where: and(
          eq(sessionEvents.id, input.eventId),
          eq(sessionEvents.userId, userId),
        ),
      })

      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'イベントが見つかりません',
        })
      }

      // Cannot delete session_start or session_end
      if (
        event.eventType === 'session_start' ||
        event.eventType === 'session_end'
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'このイベントは削除できません',
        })
      }

      // Verify session is still active
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, event.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '終了済みのセッションのイベントは削除できません',
        })
      }

      // If rebuy or addon, adjust session buyIn
      if (event.eventType === 'rebuy' || event.eventType === 'addon') {
        const eventData = event.eventData as Record<string, unknown> | null
        const amount = (eventData?.amount as number) ?? 0
        await ctx.db
          .update(pokerSessions)
          .set({
            buyIn: session.buyIn - amount,
          })
          .where(eq(pokerSessions.id, session.id))
      }

      // For pause/resume events, find and delete the paired event
      const deletedEventIds: string[] = [input.eventId]

      if (event.eventType === 'session_pause') {
        // Find the next session_resume event (same session, higher sequence)
        const pairedResume = await ctx.db.query.sessionEvents.findFirst({
          where: and(
            eq(sessionEvents.sessionId, event.sessionId),
            eq(sessionEvents.eventType, 'session_resume'),
          ),
          orderBy: [asc(sessionEvents.sequence)],
        })
        // Find the resume that comes after this pause
        if (pairedResume && pairedResume.sequence > event.sequence) {
          // Check there's no other pause between them
          const eventsBetween = await ctx.db.query.sessionEvents.findMany({
            where: and(
              eq(sessionEvents.sessionId, event.sessionId),
              eq(sessionEvents.eventType, 'session_pause'),
            ),
          })
          const pausesBetween = eventsBetween.filter(
            (e) => e.sequence > event.sequence && e.sequence < pairedResume.sequence
          )
          if (pausesBetween.length === 0) {
            deletedEventIds.push(pairedResume.id)
          }
        }
      } else if (event.eventType === 'session_resume') {
        // Find the previous session_pause event (same session, lower sequence)
        const allPauses = await ctx.db.query.sessionEvents.findMany({
          where: and(
            eq(sessionEvents.sessionId, event.sessionId),
            eq(sessionEvents.eventType, 'session_pause'),
          ),
          orderBy: [desc(sessionEvents.sequence)],
        })
        // Find the pause that comes before this resume
        const pairedPause = allPauses.find((p) => p.sequence < event.sequence)
        if (pairedPause) {
          // Check there's no other resume between them
          const resumesBetween = await ctx.db.query.sessionEvents.findMany({
            where: and(
              eq(sessionEvents.sessionId, event.sessionId),
              eq(sessionEvents.eventType, 'session_resume'),
            ),
          })
          const resumesInBetween = resumesBetween.filter(
            (r) => r.sequence > pairedPause.sequence && r.sequence < event.sequence
          )
          if (resumesInBetween.length === 0) {
            deletedEventIds.push(pairedPause.id)
          }
        }
      }

      // Delete all identified events
      for (const eventId of deletedEventIds) {
        await ctx.db
          .delete(sessionEvents)
          .where(eq(sessionEvents.id, eventId))
      }

      return { success: true, deletedEventIds }
    }),

  /**
   * Update an event's amount and/or time.
   * Amount editing: stack_update, rebuy, addon, all_in only.
   * Time editing: all events except session_start/session_end, within adjacent event bounds.
   * For rebuy/addon, also adjusts the session buyIn.
   */
  updateEvent: protectedProcedure
    .input(updateEventSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Find the event
      const event = await ctx.db.query.sessionEvents.findFirst({
        where: and(
          eq(sessionEvents.id, input.eventId),
          eq(sessionEvents.userId, userId),
        ),
      })

      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'イベントが見つかりません',
        })
      }

      // Cannot edit session_start or session_end
      if (
        event.eventType === 'session_start' ||
        event.eventType === 'session_end'
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'このイベントは編集できません',
        })
      }

      // Amount editing: only stack_update, rebuy, addon, all_in
      const amountEditableTypes = ['stack_update', 'rebuy', 'addon', 'all_in']
      if (input.amount !== undefined && !amountEditableTypes.includes(event.eventType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'このイベントの金額は編集できません',
        })
      }

      // Verify session is still active
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, event.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '終了済みのセッションのイベントは編集できません',
        })
      }

      // If updating time, validate it's within adjacent event bounds
      if (input.recordedAt !== undefined) {
        // Get all events for this session ordered by sequence
        const allEvents = await ctx.db.query.sessionEvents.findMany({
          where: eq(sessionEvents.sessionId, event.sessionId),
          orderBy: [asc(sessionEvents.sequence)],
        })

        const currentIndex = allEvents.findIndex((e) => e.id === event.id)
        const prevEvent = currentIndex > 0 ? allEvents[currentIndex - 1] : null
        const nextEvent = currentIndex < allEvents.length - 1 ? allEvents[currentIndex + 1] : null

        // New time must be after previous event (if exists)
        if (prevEvent && input.recordedAt <= prevEvent.recordedAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '時間は前のイベントより後でなければなりません',
          })
        }

        // New time must be before next event (if exists)
        if (nextEvent && input.recordedAt >= nextEvent.recordedAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '時間は次のイベントより前でなければなりません',
          })
        }

        // New time cannot be in the future
        if (input.recordedAt > new Date()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '未来の時間は設定できません',
          })
        }
      }

      // Prepare update data
      const updateData: { eventData?: { amount: number }; recordedAt?: Date } = {}

      // Handle amount update
      let amountDiff = 0
      if (input.amount !== undefined) {
        const oldEventData = event.eventData as Record<string, unknown> | null
        const oldAmount = (oldEventData?.amount as number) ?? 0
        amountDiff = input.amount - oldAmount
        updateData.eventData = { amount: input.amount }
      }

      // Handle time update
      if (input.recordedAt !== undefined) {
        updateData.recordedAt = input.recordedAt
      }

      // Update event
      await ctx.db
        .update(sessionEvents)
        .set(updateData)
        .where(eq(sessionEvents.id, input.eventId))

      // If rebuy or addon amount changed, adjust session buyIn
      if (input.amount !== undefined && (event.eventType === 'rebuy' || event.eventType === 'addon')) {
        await ctx.db
          .update(pokerSessions)
          .set({
            buyIn: session.buyIn + amountDiff,
          })
          .where(eq(pokerSessions.id, session.id))
      }

      return {
        success: true,
        updatedEventId: input.eventId,
        newAmount: input.amount,
        newRecordedAt: input.recordedAt,
      }
    }),

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Get the current user's active session with all events.
   */
  getActiveSession: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const session = await ctx.db.query.pokerSessions.findFirst({
      where: and(
        eq(pokerSessions.userId, userId),
        eq(pokerSessions.isActive, true),
        isNotDeleted(pokerSessions.deletedAt),
      ),
      with: {
        store: true,
        cashGame: true,
        tournament: {
          with: {
            blindLevels: {
              orderBy: [asc(tournamentBlindLevels.level)],
            },
            prizeStructures: {
              with: {
                prizeLevels: {
                  with: {
                    prizeItems: true,
                  },
                  orderBy: [asc(tournamentPrizeLevels.sortOrder)],
                },
              },
              orderBy: [asc(tournamentPrizeStructures.sortOrder)],
            },
          },
        },
        sessionEvents: {
          orderBy: [asc(sessionEvents.sequence)],
        },
        allInRecords: {
          orderBy: (allInRecords, { asc }) => [asc(allInRecords.recordedAt)],
        },
      },
    })

    if (!session) {
      return null
    }

    // Calculate current stack from events
    let currentStack = session.buyIn
    // Calculate paused duration
    let pausedMs = 0
    let lastPauseTime: Date | null = null
    let isPaused = false

    for (const event of session.sessionEvents) {
      const data = event.eventData as Record<string, unknown> | null
      if (event.eventType === 'stack_update' && data?.amount) {
        currentStack = data.amount as number
      } else if (event.eventType === 'rebuy' && data?.amount) {
        // Stack increases by rebuy amount
        currentStack += data.amount as number
      } else if (event.eventType === 'addon' && data?.amount) {
        // Stack increases by addon amount
        currentStack += data.amount as number
      }

      // Track pause/resume for calculating paused duration
      if (event.eventType === 'session_pause') {
        lastPauseTime = event.recordedAt
        isPaused = true
      } else if (event.eventType === 'session_resume' && lastPauseTime) {
        pausedMs += event.recordedAt.getTime() - lastPauseTime.getTime()
        lastPauseTime = null
        isPaused = false
      }
    }

    // If currently paused, add time since last pause
    if (isPaused && lastPauseTime) {
      pausedMs += Date.now() - lastPauseTime.getTime()
    }

    // Calculate elapsed time (excluding paused time)
    const totalElapsedMs = Date.now() - session.startTime.getTime()
    const activeElapsedMs = totalElapsedMs - pausedMs
    const elapsedMinutes = Math.floor(activeElapsedMs / (1000 * 60))

    // Find last hand_complete event for lastHandInfo
    const lastHandComplete = [...session.sessionEvents]
      .reverse()
      .find((e) => e.eventType === 'hand_complete')
    const lastHandInfo = lastHandComplete
      ? {
          recordedAt: lastHandComplete.recordedAt,
          position:
            (lastHandComplete.eventData as Record<string, unknown> | null)
              ?.position as string | undefined,
        }
      : null

    return {
      ...session,
      currentStack,
      elapsedMinutes,
      isPaused,
      lastHandInfo,
    }
  }),

  /**
   * List all events for a specific session.
   */
  listBySession: protectedProcedure
    .input(listBySessionSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'セッションが見つかりません',
        })
      }

      const events = await ctx.db.query.sessionEvents.findMany({
        where: eq(sessionEvents.sessionId, input.sessionId),
        orderBy: [asc(sessionEvents.sequence)],
      })

      return events
    }),

  // ============================================================================
  // Tournament Override Mutations
  // ============================================================================

  /**
   * Update tournament basic info override for an active session.
   * Creates a session-specific copy of tournament settings.
   */
  updateTournamentOverrideBasic: protectedProcedure
    .input(updateTournamentOverrideBasicSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and is tournament type
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      if (session.gameType !== 'tournament') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'トーナメントセッションではありません',
        })
      }

      await ctx.db
        .update(pokerSessions)
        .set({
          tournamentOverrideBasic: input.data,
          updatedAt: new Date(),
        })
        .where(eq(pokerSessions.id, input.sessionId))

      return { success: true }
    }),

  /**
   * Update tournament blind levels override for an active session.
   */
  updateTournamentOverrideBlinds: protectedProcedure
    .input(updateTournamentOverrideBlindsSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and is tournament type
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      if (session.gameType !== 'tournament') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'トーナメントセッションではありません',
        })
      }

      await ctx.db
        .update(pokerSessions)
        .set({
          tournamentOverrideBlinds: input.blindLevels,
          updatedAt: new Date(),
        })
        .where(eq(pokerSessions.id, input.sessionId))

      return { success: true }
    }),

  /**
   * Update tournament prize structures override for an active session.
   */
  updateTournamentOverridePrizes: protectedProcedure
    .input(updateTournamentOverridePrizesSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership and is tournament type
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      if (session.gameType !== 'tournament') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'トーナメントセッションではありません',
        })
      }

      await ctx.db
        .update(pokerSessions)
        .set({
          tournamentOverridePrizes: input.prizeStructures,
          updatedAt: new Date(),
        })
        .where(eq(pokerSessions.id, input.sessionId))

      return { success: true }
    }),

  /**
   * Clear tournament overrides for an active session.
   * Reverts to using the store tournament settings.
   */
  clearTournamentOverrides: protectedProcedure
    .input(clearTournamentOverridesSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      // Build update object based on what should be cleared
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      if (input.clearBasic) {
        updateData.tournamentOverrideBasic = null
      }
      if (input.clearBlinds) {
        updateData.tournamentOverrideBlinds = null
      }
      if (input.clearPrizes) {
        updateData.tournamentOverridePrizes = null
      }

      // If no specific clear flags, clear all
      if (!input.clearBasic && !input.clearBlinds && !input.clearPrizes) {
        updateData.tournamentOverrideBasic = null
        updateData.tournamentOverrideBlinds = null
        updateData.tournamentOverridePrizes = null
      }

      await ctx.db
        .update(pokerSessions)
        .set(updateData)
        .where(eq(pokerSessions.id, input.sessionId))

      return { success: true }
    }),

  /**
   * Update timer start time for tournament session.
   */
  updateTimerStartedAt: protectedProcedure
    .input(updateTimerStartedAtSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      await ctx.db
        .update(pokerSessions)
        .set({
          timerStartedAt: input.timerStartedAt,
          updatedAt: new Date(),
        })
        .where(eq(pokerSessions.id, input.sessionId))

      return { success: true }
    }),

  /**
   * Update tournament field (entries, remaining players).
   */
  updateTournamentField: protectedProcedure
    .input(updateTournamentFieldSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify session ownership
      const session = await ctx.db.query.pokerSessions.findFirst({
        where: and(
          eq(pokerSessions.id, input.sessionId),
          eq(pokerSessions.userId, userId),
          eq(pokerSessions.isActive, true),
          isNotDeleted(pokerSessions.deletedAt),
        ),
      })

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'アクティブなセッションが見つかりません',
        })
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      if (input.entries !== undefined) {
        updateData.tournamentEntries = input.entries
      }
      if (input.remaining !== undefined) {
        updateData.tournamentRemaining = input.remaining
      }

      await ctx.db
        .update(pokerSessions)
        .set(updateData)
        .where(eq(pokerSessions.id, input.sessionId))

      return { success: true }
    }),
})
