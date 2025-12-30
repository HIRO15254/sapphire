'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import {
  archiveStoreSchema,
  type CreateStoreInput,
  createStoreSchema,
  type DeleteStoreInput,
  deleteStoreSchema,
  type UpdateStoreInput,
  updateStoreSchema,
} from '~/server/api/schemas/store.schema'
import { auth } from '~/server/auth'
import { db } from '~/server/db'
import { isNotDeleted, softDelete, stores } from '~/server/db/schema'

/**
 * Standard result type for Server Actions
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

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
