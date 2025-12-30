'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
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
