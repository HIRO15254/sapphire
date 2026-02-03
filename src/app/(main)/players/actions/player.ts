'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import {
  type AddNoteInput,
  type AssignTagInput,
  type CreatePlayerInput,
  type CreateTagInput,
  type DeleteNoteInput,
  type DeletePlayerInput,
  type DeleteTagInput,
  type RemoveTagInput,
  type UpdateNoteInput,
  type UpdatePlayerInput,
  type UpdateTagInput,
  addNoteSchema,
  assignTagSchema,
  createPlayerSchema,
  createTagSchema,
  deleteNoteSchema,
  deletePlayerSchema,
  deleteTagSchema,
  removeTagSchema,
  updateNoteSchema,
  updatePlayerSchema,
  updateTagSchema,
} from '~/server/api/schemas/player.schema'
import { auth } from '~/server/auth'
import { db } from '~/server/db'
import {
  isNotDeleted,
  playerNotes,
  playerTagAssignments,
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

// ========== Tag Assignment Actions ==========

/**
 * Assign a tag to a player.
 *
 * Revalidates: player-list, player-{playerId}
 */
export async function assignTag(
  input: AssignTagInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    const validated = assignTagSchema.parse(input)

    // Verify player ownership
    const player = await db.query.players.findFirst({
      where: and(
        eq(players.id, validated.playerId),
        eq(players.userId, session.user.id),
        isNotDeleted(players.deletedAt),
      ),
    })

    if (!player) {
      return { success: false, error: 'プレイヤーが見つかりません' }
    }

    // Verify tag ownership
    const tag = await db.query.playerTags.findFirst({
      where: and(
        eq(playerTags.id, validated.tagId),
        eq(playerTags.userId, session.user.id),
        isNotDeleted(playerTags.deletedAt),
      ),
    })

    if (!tag) {
      return { success: false, error: 'タグが見つかりません' }
    }

    await db
      .insert(playerTagAssignments)
      .values({
        playerId: validated.playerId,
        tagId: validated.tagId,
      })
      .onConflictDoNothing()

    revalidateTag('player-list')
    revalidateTag(`player-${validated.playerId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to assign tag:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'タグの割り当てに失敗しました',
    }
  }
}

/**
 * Remove a tag from a player.
 *
 * Revalidates: player-list, player-{playerId}
 */
export async function removeTag(
  input: RemoveTagInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    const validated = removeTagSchema.parse(input)

    // Verify player ownership
    const player = await db.query.players.findFirst({
      where: and(
        eq(players.id, validated.playerId),
        eq(players.userId, session.user.id),
        isNotDeleted(players.deletedAt),
      ),
    })

    if (!player) {
      return { success: false, error: 'プレイヤーが見つかりません' }
    }

    await db
      .delete(playerTagAssignments)
      .where(
        and(
          eq(playerTagAssignments.playerId, validated.playerId),
          eq(playerTagAssignments.tagId, validated.tagId),
        ),
      )

    revalidateTag('player-list')
    revalidateTag(`player-${validated.playerId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to remove tag:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'タグの削除に失敗しました',
    }
  }
}

// ========== Note Actions ==========

/**
 * Add a note to a player.
 *
 * Revalidates: player-{playerId}
 */
export async function addNote(
  input: AddNoteInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    const validated = addNoteSchema.parse(input)

    // Verify player ownership
    const player = await db.query.players.findFirst({
      where: and(
        eq(players.id, validated.playerId),
        eq(players.userId, session.user.id),
        isNotDeleted(players.deletedAt),
      ),
    })

    if (!player) {
      return { success: false, error: 'プレイヤーが見つかりません' }
    }

    const [note] = await db
      .insert(playerNotes)
      .values({
        playerId: validated.playerId,
        userId: session.user.id,
        noteDate: validated.noteDate,
        content: validated.content,
      })
      .returning({ id: playerNotes.id })

    if (!note) {
      throw new Error('ノートの作成に失敗しました')
    }

    revalidateTag(`player-${validated.playerId}`)

    return { success: true, data: { id: note.id } }
  } catch (error) {
    console.error('Failed to add note:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'ノートの作成に失敗しました',
    }
  }
}

/**
 * Update an existing player note.
 *
 * Revalidates: player-{playerId}
 */
export async function updateNote(
  input: UpdateNoteInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    const validated = updateNoteSchema.parse(input)

    // Verify ownership
    const existing = await db.query.playerNotes.findFirst({
      where: and(
        eq(playerNotes.id, validated.id),
        eq(playerNotes.userId, session.user.id),
        isNotDeleted(playerNotes.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'ノートが見つかりません' }
    }

    const updateData: Partial<typeof playerNotes.$inferInsert> = {}
    if (validated.content !== undefined) updateData.content = validated.content
    if (validated.noteDate !== undefined) updateData.noteDate = validated.noteDate

    await db
      .update(playerNotes)
      .set(updateData)
      .where(eq(playerNotes.id, validated.id))

    revalidateTag(`player-${existing.playerId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to update note:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'ノートの更新に失敗しました',
    }
  }
}

/**
 * Delete a player note (soft delete).
 *
 * Revalidates: player-{playerId}
 */
export async function deleteNote(
  input: DeleteNoteInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    const validated = deleteNoteSchema.parse(input)

    // Verify ownership
    const existing = await db.query.playerNotes.findFirst({
      where: and(
        eq(playerNotes.id, validated.id),
        eq(playerNotes.userId, session.user.id),
        isNotDeleted(playerNotes.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'ノートが見つかりません' }
    }

    await db
      .update(playerNotes)
      .set({ deletedAt: softDelete() })
      .where(eq(playerNotes.id, validated.id))

    revalidateTag(`player-${existing.playerId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to delete note:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'ノートの削除に失敗しました',
    }
  }
}
