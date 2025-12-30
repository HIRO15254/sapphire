'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import {
  type ArchiveCashGameInput,
  archiveCashGameSchema,
  type CreateCashGameInput,
  createCashGameSchema,
  type DeleteCashGameInput,
  deleteCashGameSchema,
  type UpdateCashGameInput,
  updateCashGameSchema,
} from '~/server/api/schemas/cashGame.schema'
import { auth } from '~/server/auth'
import { db } from '~/server/db'
import {
  cashGames,
  isNotDeleted,
  softDelete,
  stores,
} from '~/server/db/schema'
import type { ActionResult } from './store'

/**
 * Create a new cash game.
 *
 * Revalidates: store-{storeId}
 */
export async function createCashGame(
  input: CreateCashGameInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = createCashGameSchema.parse(input)

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

    // Create cash game
    const [cashGame] = await db
      .insert(cashGames)
      .values({
        storeId: validated.storeId,
        userId: session.user.id,
        currencyId: validated.currencyId,
        smallBlind: validated.smallBlind,
        bigBlind: validated.bigBlind,
        straddle1: validated.straddle1,
        straddle2: validated.straddle2,
        ante: validated.ante,
        anteType: validated.anteType,
        notes: validated.notes,
      })
      .returning({ id: cashGames.id })

    if (!cashGame) {
      throw new Error('キャッシュゲームの作成に失敗しました')
    }

    // Revalidate store detail
    revalidateTag(`store-${validated.storeId}`)

    return { success: true, data: { id: cashGame.id } }
  } catch (error) {
    console.error('Failed to create cash game:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'キャッシュゲームの作成に失敗しました',
    }
  }
}

/**
 * Update an existing cash game.
 *
 * Revalidates: store-{storeId}
 */
export async function updateCashGame(
  input: UpdateCashGameInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = updateCashGameSchema.parse(input)

    // Verify ownership
    const existing = await db.query.cashGames.findFirst({
      where: and(
        eq(cashGames.id, validated.id),
        eq(cashGames.userId, session.user.id),
        isNotDeleted(cashGames.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'キャッシュゲームが見つかりません' }
    }

    // Build update data
    const updateData: Partial<typeof cashGames.$inferInsert> = {}
    if (validated.currencyId !== undefined)
      updateData.currencyId = validated.currencyId
    if (validated.smallBlind !== undefined)
      updateData.smallBlind = validated.smallBlind
    if (validated.bigBlind !== undefined)
      updateData.bigBlind = validated.bigBlind
    if (validated.straddle1 !== undefined)
      updateData.straddle1 = validated.straddle1
    if (validated.straddle2 !== undefined)
      updateData.straddle2 = validated.straddle2
    if (validated.ante !== undefined) updateData.ante = validated.ante
    if (validated.anteType !== undefined)
      updateData.anteType = validated.anteType
    if (validated.notes !== undefined) updateData.notes = validated.notes

    // Update cash game
    await db
      .update(cashGames)
      .set(updateData)
      .where(eq(cashGames.id, validated.id))

    // Revalidate store detail
    revalidateTag(`store-${existing.storeId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to update cash game:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'キャッシュゲームの更新に失敗しました',
    }
  }
}

/**
 * Archive a cash game.
 *
 * Revalidates: store-{storeId}
 */
export async function archiveCashGame(
  input: ArchiveCashGameInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = archiveCashGameSchema.parse(input)

    // Verify ownership
    const existing = await db.query.cashGames.findFirst({
      where: and(
        eq(cashGames.id, validated.id),
        eq(cashGames.userId, session.user.id),
        isNotDeleted(cashGames.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'キャッシュゲームが見つかりません' }
    }

    // Archive cash game
    await db
      .update(cashGames)
      .set({ isArchived: validated.isArchived })
      .where(eq(cashGames.id, validated.id))

    // Revalidate store detail
    revalidateTag(`store-${existing.storeId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to archive cash game:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'キャッシュゲームのアーカイブに失敗しました',
    }
  }
}

/**
 * Delete a cash game (soft delete).
 *
 * Revalidates: store-{storeId}
 */
export async function deleteCashGame(
  input: DeleteCashGameInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = deleteCashGameSchema.parse(input)

    // Verify ownership
    const existing = await db.query.cashGames.findFirst({
      where: and(
        eq(cashGames.id, validated.id),
        eq(cashGames.userId, session.user.id),
        isNotDeleted(cashGames.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'キャッシュゲームが見つかりません' }
    }

    // Soft delete cash game
    await db
      .update(cashGames)
      .set({ deletedAt: softDelete() })
      .where(eq(cashGames.id, validated.id))

    // Revalidate store detail
    revalidateTag(`store-${existing.storeId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to delete cash game:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'キャッシュゲームの削除に失敗しました',
    }
  }
}
