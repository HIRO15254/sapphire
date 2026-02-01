'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import {
  type CreateAllInInput,
  createAllInSchema,
  type DeleteAllInInput,
  deleteAllInSchema,
  type UpdateAllInInput,
  updateAllInSchema,
} from '~/server/api/schemas/allIn.schema'
import {
  type CreateArchiveSessionInput,
  createArchiveSessionSchema,
  type DeleteSessionInput,
  deleteSessionSchema,
  type UpdateSessionInput,
  updateSessionSchema,
} from '~/server/api/schemas/session.schema'
import { auth } from '~/server/auth'
import { db } from '~/server/db'
import {
  allInRecords,
  isNotDeleted,
  pokerSessions,
  sessionEvents,
  softDelete,
} from '~/server/db/schema'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Standard result type for Server Actions
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// Session CRUD Actions
// ============================================================================

/**
 * Create a new archive session (completed session).
 *
 * Revalidates: session-list
 */
export async function createArchiveSession(
  input: CreateArchiveSessionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = createArchiveSessionSchema.parse(input)

    // Create session
    const [newSession] = await db
      .insert(pokerSessions)
      .values({
        userId: session.user.id,
        storeId: validated.storeId,
        gameType: validated.gameType,
        cashGameId: validated.cashGameId,
        tournamentId: validated.tournamentId,
        isActive: false, // Archive session is completed
        startTime: validated.startTime,
        endTime: validated.endTime,
        buyIn: validated.buyIn,
        cashOut: validated.cashOut,
        notes: validated.notes,
      })
      .returning({ id: pokerSessions.id })

    if (!newSession) {
      throw new Error('セッションの作成に失敗しました')
    }

    revalidateTag('session-list')
    return { success: true, data: { id: newSession.id } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'セッションの作成に失敗しました' }
  }
}

/**
 * Update an existing session.
 *
 * Revalidates: session-list
 */
export async function updateSession(
  input: UpdateSessionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = updateSessionSchema.parse(input)

    // Verify ownership
    const existing = await db.query.pokerSessions.findFirst({
      where: and(
        eq(pokerSessions.id, validated.id),
        eq(pokerSessions.userId, session.user.id),
        isNotDeleted(pokerSessions.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    // Build update data
    const updateData: Partial<typeof pokerSessions.$inferInsert> = {}
    if (validated.storeId !== undefined) updateData.storeId = validated.storeId
    if (validated.gameType !== undefined)
      updateData.gameType = validated.gameType
    if (validated.cashGameId !== undefined)
      updateData.cashGameId = validated.cashGameId
    if (validated.tournamentId !== undefined)
      updateData.tournamentId = validated.tournamentId
    if (validated.startTime !== undefined)
      updateData.startTime = validated.startTime
    if (validated.endTime !== undefined) updateData.endTime = validated.endTime
    if (validated.buyIn !== undefined) updateData.buyIn = validated.buyIn
    if (validated.cashOut !== undefined) updateData.cashOut = validated.cashOut
    if (validated.notes !== undefined) updateData.notes = validated.notes

    // Update session
    const [updated] = await db
      .update(pokerSessions)
      .set(updateData)
      .where(eq(pokerSessions.id, validated.id))
      .returning({ id: pokerSessions.id })

    if (!updated) {
      throw new Error('セッションの更新に失敗しました')
    }

    revalidateTag('session-list')
    return { success: true, data: { id: updated.id } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'セッションの更新に失敗しました' }
  }
}

/**
 * Delete a session (soft delete).
 *
 * Revalidates: session-list
 */
export async function deleteSession(
  input: DeleteSessionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = deleteSessionSchema.parse(input)

    // Verify ownership
    const existing = await db.query.pokerSessions.findFirst({
      where: and(
        eq(pokerSessions.id, validated.id),
        eq(pokerSessions.userId, session.user.id),
        isNotDeleted(pokerSessions.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    // Soft delete session
    const [deleted] = await db
      .update(pokerSessions)
      .set({ deletedAt: softDelete() })
      .where(eq(pokerSessions.id, validated.id))
      .returning({ id: pokerSessions.id })

    if (!deleted) {
      throw new Error('セッションの削除に失敗しました')
    }

    revalidateTag('session-list')
    return { success: true, data: { id: deleted.id } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'セッションの削除に失敗しました' }
  }
}

// ============================================================================
// AllIn Record CRUD Actions
// ============================================================================

/**
 * Create a new all-in record for a session.
 *
 * Revalidates: session-list
 */
export async function createAllInRecord(
  input: CreateAllInInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = createAllInSchema.parse(input)

    // Verify session ownership
    const existingSession = await db.query.pokerSessions.findFirst({
      where: and(
        eq(pokerSessions.id, validated.sessionId),
        eq(pokerSessions.userId, session.user.id),
        isNotDeleted(pokerSessions.deletedAt),
      ),
    })

    if (!existingSession) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    // Create all-in record
    const [newRecord] = await db
      .insert(allInRecords)
      .values({
        sessionId: validated.sessionId,
        userId: session.user.id,
        potAmount: validated.potAmount,
        winProbability: validated.winProbability.toString(),
        actualResult: validated.actualResult,
        runItTimes: validated.runItTimes,
        winsInRunout: validated.winsInRunout,
        recordedAt: validated.recordedAt ?? new Date(),
      })
      .returning({ id: allInRecords.id })

    if (!newRecord) {
      throw new Error('オールイン記録の作成に失敗しました')
    }

    revalidateTag('session-list')
    return { success: true, data: { id: newRecord.id } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'オールイン記録の作成に失敗しました' }
  }
}

/**
 * Update an existing all-in record.
 *
 * Revalidates: session-list
 */
export async function updateAllInRecord(
  input: UpdateAllInInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = updateAllInSchema.parse(input)

    // Verify ownership
    const existing = await db.query.allInRecords.findFirst({
      where: and(
        eq(allInRecords.id, validated.id),
        eq(allInRecords.userId, session.user.id),
        isNotDeleted(allInRecords.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'オールイン記録が見つかりません' }
    }

    // Build update data
    const updateData: Partial<typeof allInRecords.$inferInsert> = {}
    if (validated.potAmount !== undefined)
      updateData.potAmount = validated.potAmount
    if (validated.winProbability !== undefined)
      updateData.winProbability = validated.winProbability.toString()
    if (validated.actualResult !== undefined)
      updateData.actualResult = validated.actualResult
    if (validated.runItTimes !== undefined)
      updateData.runItTimes = validated.runItTimes
    if (validated.winsInRunout !== undefined)
      updateData.winsInRunout = validated.winsInRunout
    if (validated.recordedAt !== undefined)
      updateData.recordedAt = validated.recordedAt

    // Update record
    const [updated] = await db
      .update(allInRecords)
      .set(updateData)
      .where(eq(allInRecords.id, validated.id))
      .returning({ id: allInRecords.id })

    if (!updated) {
      throw new Error('オールイン記録の更新に失敗しました')
    }

    revalidateTag('session-list')
    return { success: true, data: { id: updated.id } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'オールイン記録の更新に失敗しました' }
  }
}

/**
 * Delete an all-in record (soft delete).
 *
 * Revalidates: session-list
 */
export async function deleteAllInRecord(
  input: DeleteAllInInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = deleteAllInSchema.parse(input)

    // Verify ownership
    const existing = await db.query.allInRecords.findFirst({
      where: and(
        eq(allInRecords.id, validated.id),
        eq(allInRecords.userId, session.user.id),
        isNotDeleted(allInRecords.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'オールイン記録が見つかりません' }
    }

    // Soft delete record
    const [deleted] = await db
      .update(allInRecords)
      .set({ deletedAt: softDelete() })
      .where(eq(allInRecords.id, validated.id))
      .returning({ id: allInRecords.id })

    if (!deleted) {
      throw new Error('オールイン記録の削除に失敗しました')
    }

    revalidateTag('session-list')
    return { success: true, data: { id: deleted.id } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'オールイン記録の削除に失敗しました' }
  }
}

// ============================================================================
// Session Event Actions
// ============================================================================

const deleteSessionEventSchema = z.object({
  eventId: z.string().uuid('有効なイベントIDを指定してください'),
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
})

type DeleteSessionEventInput = z.infer<typeof deleteSessionEventSchema>

/**
 * Delete a session event.
 * Cannot delete session_start or session_end events.
 * For rebuy/addon events, adjusts the session buyIn.
 *
 * Revalidates: session-list
 */
export async function deleteSessionEvent(
  input: DeleteSessionEventInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = deleteSessionEventSchema.parse(input)

    // Verify session ownership
    const existingSession = await db.query.pokerSessions.findFirst({
      where: and(
        eq(pokerSessions.id, validated.sessionId),
        eq(pokerSessions.userId, session.user.id),
        isNotDeleted(pokerSessions.deletedAt),
      ),
    })

    if (!existingSession) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    // Find the event
    const event = await db.query.sessionEvents.findFirst({
      where: and(
        eq(sessionEvents.id, validated.eventId),
        eq(sessionEvents.sessionId, validated.sessionId),
        eq(sessionEvents.userId, session.user.id),
      ),
    })

    if (!event) {
      return { success: false, error: 'イベントが見つかりません' }
    }

    // Cannot delete session_start or session_end
    if (
      event.eventType === 'session_start' ||
      event.eventType === 'session_end'
    ) {
      return { success: false, error: 'このイベントは削除できません' }
    }

    // If rebuy or addon, adjust session buyIn
    if (event.eventType === 'rebuy' || event.eventType === 'addon') {
      const eventData = event.eventData as Record<string, unknown> | null
      const amount = (eventData?.amount as number) ?? 0
      await db
        .update(pokerSessions)
        .set({ buyIn: existingSession.buyIn - amount })
        .where(eq(pokerSessions.id, validated.sessionId))
    }

    // Delete the event
    await db
      .delete(sessionEvents)
      .where(eq(sessionEvents.id, validated.eventId))

    revalidateTag('session-list')
    return { success: true, data: { id: validated.eventId } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'イベントの削除に失敗しました' }
  }
}

const updateSessionEventSchema = z.object({
  eventId: z.string().uuid('有効なイベントIDを指定してください'),
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  amount: z
    .number()
    .int('金額は整数で入力してください')
    .min(0, '金額は0以上で入力してください')
    .optional(),
  recordedAt: z.date().optional(),
})

type UpdateSessionEventInput = z.infer<typeof updateSessionEventSchema>

/**
 * Update a session event's amount and/or time.
 * Amount editing: stack_update, rebuy, addon only.
 * For rebuy/addon, also adjusts the session buyIn.
 *
 * Revalidates: session-list
 */
export async function updateSessionEvent(
  input: UpdateSessionEventInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = updateSessionEventSchema.parse(input)

    // Verify session ownership
    const existingSession = await db.query.pokerSessions.findFirst({
      where: and(
        eq(pokerSessions.id, validated.sessionId),
        eq(pokerSessions.userId, session.user.id),
        isNotDeleted(pokerSessions.deletedAt),
      ),
    })

    if (!existingSession) {
      return { success: false, error: 'セッションが見つかりません' }
    }

    // Find the event
    const event = await db.query.sessionEvents.findFirst({
      where: and(
        eq(sessionEvents.id, validated.eventId),
        eq(sessionEvents.sessionId, validated.sessionId),
        eq(sessionEvents.userId, session.user.id),
      ),
    })

    if (!event) {
      return { success: false, error: 'イベントが見つかりません' }
    }

    // Cannot edit session_start or session_end
    if (
      event.eventType === 'session_start' ||
      event.eventType === 'session_end'
    ) {
      return { success: false, error: 'このイベントは編集できません' }
    }

    // Amount editing: only stack_update, rebuy, addon
    const amountEditableTypes = ['stack_update', 'rebuy', 'addon']
    if (
      validated.amount !== undefined &&
      !amountEditableTypes.includes(event.eventType)
    ) {
      return { success: false, error: 'このイベントの金額は編集できません' }
    }

    // Prepare update data
    const updateData: { eventData?: { amount: number }; recordedAt?: Date } = {}

    // Handle amount update
    let amountDiff = 0
    if (validated.amount !== undefined) {
      const oldEventData = event.eventData as Record<string, unknown> | null
      const oldAmount = (oldEventData?.amount as number) ?? 0
      amountDiff = validated.amount - oldAmount
      updateData.eventData = { amount: validated.amount }
    }

    // Handle time update
    if (validated.recordedAt !== undefined) {
      updateData.recordedAt = validated.recordedAt
    }

    // Update event
    await db
      .update(sessionEvents)
      .set(updateData)
      .where(eq(sessionEvents.id, validated.eventId))

    // If rebuy or addon amount changed, adjust session buyIn
    if (
      validated.amount !== undefined &&
      (event.eventType === 'rebuy' || event.eventType === 'addon')
    ) {
      await db
        .update(pokerSessions)
        .set({ buyIn: existingSession.buyIn + amountDiff })
        .where(eq(pokerSessions.id, validated.sessionId))
    }

    revalidateTag('session-list')
    return { success: true, data: { id: validated.eventId } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'イベントの更新に失敗しました' }
  }
}
