'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import {
  type CreatePlayerInput,
  type CreateTagInput,
  createPlayerSchema,
  createTagSchema,
  type DeletePlayerInput,
  type DeleteTagInput,
  deletePlayerSchema,
  deleteTagSchema,
  type UpdatePlayerInput,
  type UpdateTagInput,
  updatePlayerSchema,
  updateTagSchema,
} from '~/server/api/schemas/player.schema'
import { auth } from '~/server/auth'
import { db } from '~/server/db'
import {
  isNotDeleted,
  playerTags,
  players,
  softDelete,
} from '~/server/db/schema'

/**
 * Standard result type for Server Actions
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Create a new player.
 *
 * Revalidates: player-list
 */
export async function createPlayer(
  input: CreatePlayerInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = createPlayerSchema.parse(input)

    // Create player
    const [player] = await db
      .insert(players)
      .values({
        userId: session.user.id,
        name: validated.name,
        generalNotes: validated.generalNotes,
      })
      .returning({ id: players.id })

    if (!player) {
      throw new Error('プレイヤーの作成に失敗しました')
    }

    // Revalidate player list
    revalidateTag('player-list')

    return { success: true, data: { id: player.id } }
  } catch (error) {
    console.error('Failed to create player:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'プレイヤーの作成に失敗しました',
    }
  }
}

/**
 * Update an existing player.
 *
 * Revalidates: player-{id}, player-list
 */
export async function updatePlayer(
  input: UpdatePlayerInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = updatePlayerSchema.parse(input)

    // Verify ownership
    const existing = await db.query.players.findFirst({
      where: and(
        eq(players.id, validated.id),
        eq(players.userId, session.user.id),
        isNotDeleted(players.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'プレイヤーが見つかりません' }
    }

    // Build update data
    const updateData: Partial<typeof players.$inferInsert> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.generalNotes !== undefined)
      updateData.generalNotes = validated.generalNotes

    // Update player
    await db.update(players).set(updateData).where(eq(players.id, validated.id))

    // Revalidate specific player and list
    revalidateTag(`player-${validated.id}`)
    revalidateTag('player-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to update player:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'プレイヤーの更新に失敗しました',
    }
  }
}

/**
 * Delete a player (soft delete).
 *
 * Revalidates: player-list
 */
export async function deletePlayer(
  input: DeletePlayerInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = deletePlayerSchema.parse(input)

    // Verify ownership
    const existing = await db.query.players.findFirst({
      where: and(
        eq(players.id, validated.id),
        eq(players.userId, session.user.id),
        isNotDeleted(players.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'プレイヤーが見つかりません' }
    }

    // Soft delete player
    await db
      .update(players)
      .set({ deletedAt: softDelete() })
      .where(eq(players.id, validated.id))

    // Revalidate list
    revalidateTag('player-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to delete player:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'プレイヤーの削除に失敗しました',
    }
  }
}

// ========== Tag Actions ==========

/**
 * Create a new player tag.
 *
 * Revalidates: player-tags, player-list
 */
export async function createTag(
  input: CreateTagInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    const validated = createTagSchema.parse(input)

    const [tag] = await db
      .insert(playerTags)
      .values({
        userId: session.user.id,
        name: validated.name,
        color: validated.color ?? null,
      })
      .returning({ id: playerTags.id })

    if (!tag) {
      throw new Error('タグの作成に失敗しました')
    }

    revalidateTag('player-tags')
    revalidateTag('player-list')

    return { success: true, data: { id: tag.id } }
  } catch (error) {
    console.error('Failed to create tag:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'タグの作成に失敗しました',
    }
  }
}

/**
 * Update an existing player tag.
 *
 * Revalidates: player-tags, player-list
 */
export async function updateTag(
  input: UpdateTagInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    const validated = updateTagSchema.parse(input)

    // Verify ownership
    const existing = await db.query.playerTags.findFirst({
      where: and(
        eq(playerTags.id, validated.id),
        eq(playerTags.userId, session.user.id),
        isNotDeleted(playerTags.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'タグが見つかりません' }
    }

    const updateData: Partial<typeof playerTags.$inferInsert> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.color !== undefined) updateData.color = validated.color

    await db
      .update(playerTags)
      .set(updateData)
      .where(eq(playerTags.id, validated.id))

    revalidateTag('player-tags')
    revalidateTag('player-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to update tag:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'タグの更新に失敗しました',
    }
  }
}

/**
 * Delete a player tag (soft delete).
 *
 * Revalidates: player-tags, player-list
 */
export async function deleteTag(
  input: DeleteTagInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    const validated = deleteTagSchema.parse(input)

    // Verify ownership
    const existing = await db.query.playerTags.findFirst({
      where: and(
        eq(playerTags.id, validated.id),
        eq(playerTags.userId, session.user.id),
        isNotDeleted(playerTags.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'タグが見つかりません' }
    }

    await db
      .update(playerTags)
      .set({ deletedAt: softDelete() })
      .where(eq(playerTags.id, validated.id))

    revalidateTag('player-tags')
    revalidateTag('player-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to delete tag:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'タグの削除に失敗しました',
    }
  }
}
