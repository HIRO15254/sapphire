'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import {
  type ArchiveTournamentInput,
  archiveTournamentSchema,
  type CreateTournamentInput,
  createTournamentSchema,
  type DeleteTournamentInput,
  deleteTournamentSchema,
  type UpdateTournamentInput,
  updateTournamentSchema,
} from '~/server/api/schemas/tournament.schema'
import { auth } from '~/server/auth'
import { db } from '~/server/db'
import { isNotDeleted, softDelete, stores, tournaments } from '~/server/db/schema'
import type { ActionResult } from './store'

/**
 * Create a new tournament.
 *
 * Revalidates: store-{storeId}
 */
export async function createTournament(
  input: CreateTournamentInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = createTournamentSchema.parse(input)

    // Verify store ownership
    const store = await db.query.stores.findFirst({
      where: and(
        eq(stores.id, validated.storeId),
        eq(stores.userId, session.user.id),
        isNotDeleted(stores.deletedAt),
      ),
    })

    if (!store) {
      return { success: false, error: '店舗が見つかりません' }
    }

    // Create tournament
    const [tournament] = await db
      .insert(tournaments)
      .values({
        storeId: validated.storeId,
        userId: session.user.id,
        currencyId: validated.currencyId,
        name: validated.name,
        buyIn: validated.buyIn,
        rake: validated.rake,
        startingStack: validated.startingStack,
        notes: validated.notes,
      })
      .returning({ id: tournaments.id })

    if (!tournament) {
      throw new Error('トーナメントの作成に失敗しました')
    }

    // Revalidate store detail
    revalidateTag(`store-${validated.storeId}`)

    return { success: true, data: { id: tournament.id } }
  } catch (error) {
    console.error('Failed to create tournament:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'トーナメントの作成に失敗しました',
    }
  }
}

/**
 * Update an existing tournament.
 *
 * Revalidates: store-{storeId}
 */
export async function updateTournament(
  input: UpdateTournamentInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = updateTournamentSchema.parse(input)

    // Verify ownership
    const existing = await db.query.tournaments.findFirst({
      where: and(
        eq(tournaments.id, validated.id),
        eq(tournaments.userId, session.user.id),
        isNotDeleted(tournaments.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'トーナメントが見つかりません' }
    }

    // Build update data
    const updateData: Partial<typeof tournaments.$inferInsert> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.currencyId !== undefined)
      updateData.currencyId = validated.currencyId
    if (validated.buyIn !== undefined) updateData.buyIn = validated.buyIn
    if (validated.rake !== undefined) updateData.rake = validated.rake
    if (validated.startingStack !== undefined)
      updateData.startingStack = validated.startingStack
    if (validated.notes !== undefined) updateData.notes = validated.notes

    // Update tournament
    await db
      .update(tournaments)
      .set(updateData)
      .where(eq(tournaments.id, validated.id))

    // Revalidate store detail
    revalidateTag(`store-${existing.storeId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to update tournament:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'トーナメントの更新に失敗しました',
    }
  }
}

/**
 * Archive a tournament.
 *
 * Revalidates: store-{storeId}
 */
export async function archiveTournament(
  input: ArchiveTournamentInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = archiveTournamentSchema.parse(input)

    // Verify ownership
    const existing = await db.query.tournaments.findFirst({
      where: and(
        eq(tournaments.id, validated.id),
        eq(tournaments.userId, session.user.id),
        isNotDeleted(tournaments.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'トーナメントが見つかりません' }
    }

    // Archive tournament
    await db
      .update(tournaments)
      .set({ isArchived: validated.isArchived })
      .where(eq(tournaments.id, validated.id))

    // Revalidate store detail
    revalidateTag(`store-${existing.storeId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to archive tournament:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'トーナメントのアーカイブに失敗しました',
    }
  }
}

/**
 * Delete a tournament (soft delete).
 *
 * Revalidates: store-{storeId}
 */
export async function deleteTournament(
  input: DeleteTournamentInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = deleteTournamentSchema.parse(input)

    // Verify ownership
    const existing = await db.query.tournaments.findFirst({
      where: and(
        eq(tournaments.id, validated.id),
        eq(tournaments.userId, session.user.id),
        isNotDeleted(tournaments.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'トーナメントが見つかりません' }
    }

    // Soft delete tournament
    await db
      .update(tournaments)
      .set({ deletedAt: softDelete() })
      .where(eq(tournaments.id, validated.id))

    // Revalidate store detail
    revalidateTag(`store-${existing.storeId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to delete tournament:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'トーナメントの削除に失敗しました',
    }
  }
}
