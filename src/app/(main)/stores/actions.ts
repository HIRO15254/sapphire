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
import {
  archiveStoreSchema,
  type CreateStoreInput,
  createStoreSchema,
  type DeleteStoreInput,
  deleteStoreSchema,
  type UpdateStoreInput,
  updateStoreSchema,
} from '~/server/api/schemas/store.schema'
import {
  type ArchiveTournamentInput,
  archiveTournamentSchema,
  type BlindLevelInput,
  blindLevelSchema,
  type CreateTournamentInput,
  createTournamentSchema,
  type DeleteTournamentInput,
  deleteTournamentSchema,
  type PrizeLevelInput,
  prizeLevelSchema,
  type UpdateTournamentInput,
  updateTournamentSchema,
} from '~/server/api/schemas/tournament.schema'
import { auth } from '~/server/auth'
import { db } from '~/server/db'
import {
  cashGames,
  isNotDeleted,
  softDelete,
  stores,
  tournamentBlindLevels,
  tournamentPrizeLevels,
  tournaments,
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
// Store CRUD Actions
// ============================================================================

/**
 * Create a new store.
 *
 * Revalidates: store-list
 */
export async function createStore(
  input: CreateStoreInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = createStoreSchema.parse(input)

    // Create store
    const [store] = await db
      .insert(stores)
      .values({
        userId: session.user.id,
        name: validated.name,
        address: validated.address,
        latitude: validated.latitude?.toString(),
        longitude: validated.longitude?.toString(),
        placeId: validated.placeId,
        customMapUrl: validated.customMapUrl,
        notes: validated.notes,
      })
      .returning({ id: stores.id })

    if (!store) {
      throw new Error('店舗の作成に失敗しました')
    }

    // Revalidate store list
    revalidateTag('store-list')

    return { success: true, data: { id: store.id } }
  } catch (error) {
    console.error('Failed to create store:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '店舗の作成に失敗しました',
    }
  }
}

/**
 * Update an existing store.
 *
 * Revalidates: store-{id}, store-list
 */
export async function updateStore(
  input: UpdateStoreInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = updateStoreSchema.parse(input)

    // Verify ownership
    const existing = await db.query.stores.findFirst({
      where: and(
        eq(stores.id, validated.id),
        eq(stores.userId, session.user.id),
        isNotDeleted(stores.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: '店舗が見つかりません' }
    }

    // Build update data
    const updateData: Partial<typeof stores.$inferInsert> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.address !== undefined) updateData.address = validated.address
    if (validated.latitude !== undefined)
      updateData.latitude = validated.latitude?.toString() ?? null
    if (validated.longitude !== undefined)
      updateData.longitude = validated.longitude?.toString() ?? null
    if (validated.placeId !== undefined) updateData.placeId = validated.placeId
    if (validated.customMapUrl !== undefined)
      updateData.customMapUrl = validated.customMapUrl
    if (validated.notes !== undefined) updateData.notes = validated.notes

    // Update store
    await db.update(stores).set(updateData).where(eq(stores.id, validated.id))

    // Revalidate specific store and list
    revalidateTag(`store-${validated.id}`)
    revalidateTag('store-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to update store:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '店舗の更新に失敗しました',
    }
  }
}

/**
 * Archive a store.
 *
 * Revalidates: store-{id}, store-list
 */
export async function archiveStore(input: {
  id: string
}): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = archiveStoreSchema.parse({
      id: input.id,
      isArchived: true,
    })

    // Verify ownership
    const existing = await db.query.stores.findFirst({
      where: and(
        eq(stores.id, validated.id),
        eq(stores.userId, session.user.id),
        isNotDeleted(stores.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: '店舗が見つかりません' }
    }

    // Archive store
    await db
      .update(stores)
      .set({ isArchived: true })
      .where(eq(stores.id, validated.id))

    // Revalidate specific store and list
    revalidateTag(`store-${validated.id}`)
    revalidateTag('store-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to archive store:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '店舗のアーカイブに失敗しました',
    }
  }
}

/**
 * Unarchive a store.
 *
 * Revalidates: store-{id}, store-list
 */
export async function unarchiveStore(input: {
  id: string
}): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = archiveStoreSchema.parse({
      id: input.id,
      isArchived: false,
    })

    // Verify ownership
    const existing = await db.query.stores.findFirst({
      where: and(
        eq(stores.id, validated.id),
        eq(stores.userId, session.user.id),
        isNotDeleted(stores.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: '店舗が見つかりません' }
    }

    // Unarchive store
    await db
      .update(stores)
      .set({ isArchived: false })
      .where(eq(stores.id, validated.id))

    // Revalidate specific store and list
    revalidateTag(`store-${validated.id}`)
    revalidateTag('store-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to unarchive store:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '店舗のアーカイブ解除に失敗しました',
    }
  }
}

/**
 * Delete a store (soft delete).
 *
 * Revalidates: store-list
 */
export async function deleteStore(
  input: DeleteStoreInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = deleteStoreSchema.parse(input)

    // Verify ownership
    const existing = await db.query.stores.findFirst({
      where: and(
        eq(stores.id, validated.id),
        eq(stores.userId, session.user.id),
        isNotDeleted(stores.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: '店舗が見つかりません' }
    }

    // Soft delete store
    await db
      .update(stores)
      .set({ deletedAt: softDelete() })
      .where(eq(stores.id, validated.id))

    // Revalidate list
    revalidateTag('store-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to delete store:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '店舗の削除に失敗しました',
    }
  }
}

// ============================================================================
// Cash Game CRUD Actions
// ============================================================================

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

// ============================================================================
// Tournament CRUD Actions
// ============================================================================

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

// ============================================================================
// Tournament Structure Actions (Blind Levels & Prize Levels)
// ============================================================================

/**
 * Set blind levels for a tournament (replaces all existing).
 *
 * Revalidates: store-{storeId}
 */
export async function setTournamentBlindLevels(input: {
  tournamentId: string
  levels: BlindLevelInput[]
}): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate levels
    const validatedLevels = input.levels.map((level) =>
      blindLevelSchema.parse(level),
    )

    // Verify ownership
    const existing = await db.query.tournaments.findFirst({
      where: and(
        eq(tournaments.id, input.tournamentId),
        eq(tournaments.userId, session.user.id),
        isNotDeleted(tournaments.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'トーナメントが見つかりません' }
    }

    // Delete existing blind levels
    await db
      .delete(tournamentBlindLevels)
      .where(eq(tournamentBlindLevels.tournamentId, input.tournamentId))

    // Insert new blind levels
    if (validatedLevels.length > 0) {
      await db.insert(tournamentBlindLevels).values(
        validatedLevels.map((level) => ({
          tournamentId: input.tournamentId,
          level: level.level,
          smallBlind: level.smallBlind,
          bigBlind: level.bigBlind,
          ante: level.ante,
          durationMinutes: level.durationMinutes,
        })),
      )
    }

    // Revalidate store detail
    revalidateTag(`store-${existing.storeId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to set blind levels:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'ブラインドレベルの設定に失敗しました',
    }
  }
}

/**
 * Set prize levels for a tournament (replaces all existing).
 *
 * Revalidates: store-{storeId}
 */
export async function setTournamentPrizeLevels(input: {
  tournamentId: string
  levels: PrizeLevelInput[]
}): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate levels
    const validatedLevels = input.levels.map((level) =>
      prizeLevelSchema.parse(level),
    )

    // Verify ownership
    const existing = await db.query.tournaments.findFirst({
      where: and(
        eq(tournaments.id, input.tournamentId),
        eq(tournaments.userId, session.user.id),
        isNotDeleted(tournaments.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'トーナメントが見つかりません' }
    }

    // Delete existing prize levels
    await db
      .delete(tournamentPrizeLevels)
      .where(eq(tournamentPrizeLevels.tournamentId, input.tournamentId))

    // Insert new prize levels
    if (validatedLevels.length > 0) {
      await db.insert(tournamentPrizeLevels).values(
        validatedLevels.map((level) => ({
          tournamentId: input.tournamentId,
          position: level.position,
          percentage: level.percentage?.toString(),
          fixedAmount: level.fixedAmount,
        })),
      )
    }

    // Revalidate store detail
    revalidateTag(`store-${existing.storeId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to set prize levels:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'プライズレベルの設定に失敗しました',
    }
  }
}
