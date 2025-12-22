'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import {
  type AddBonusInput,
  type AddPurchaseInput,
  type ArchiveCurrencyInput,
  addBonusSchema,
  addPurchaseSchema,
  archiveCurrencySchema,
  type CreateCurrencyInput,
  createCurrencySchema,
  type DeleteCurrencyInput,
  deleteCurrencySchema,
  type UpdateCurrencyInput,
  updateCurrencySchema,
} from '~/server/api/schemas/currency.schema'
import { auth } from '~/server/auth'
import { db } from '~/server/db'
import {
  bonusTransactions,
  currencies,
  isNotDeleted,
  purchaseTransactions,
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
// Currency CRUD Actions
// ============================================================================

/**
 * Create a new currency.
 *
 * Revalidates: currency-list
 */
export async function createCurrency(
  input: CreateCurrencyInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = createCurrencySchema.parse(input)

    // Create currency
    const [currency] = await db
      .insert(currencies)
      .values({
        userId: session.user.id,
        name: validated.name,
        initialBalance: validated.initialBalance,
      })
      .returning({ id: currencies.id })

    if (!currency) {
      throw new Error('通貨の作成に失敗しました')
    }

    // Revalidate currency list (affects list page and dashboard)
    revalidateTag('currency-list')

    return { success: true, data: { id: currency.id } }
  } catch (error) {
    console.error('Failed to create currency:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '通貨の作成に失敗しました',
    }
  }
}

/**
 * Update an existing currency.
 *
 * Revalidates: currency-{id}, currency-list
 */
export async function updateCurrency(
  input: UpdateCurrencyInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = updateCurrencySchema.parse(input)

    // Verify ownership
    const existing = await db.query.currencies.findFirst({
      where: and(
        eq(currencies.id, validated.id),
        eq(currencies.userId, session.user.id),
        isNotDeleted(currencies.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: '通貨が見つかりません' }
    }

    // Build update data
    const updateData: Partial<typeof currencies.$inferInsert> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.initialBalance !== undefined)
      updateData.initialBalance = validated.initialBalance

    // Update currency
    await db
      .update(currencies)
      .set(updateData)
      .where(eq(currencies.id, validated.id))

    // Revalidate specific currency and list
    revalidateTag(`currency-${validated.id}`)
    revalidateTag('currency-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to update currency:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '通貨の更新に失敗しました',
    }
  }
}

/**
 * Archive a currency.
 *
 * Revalidates: currency-{id}, currency-list
 */
export async function archiveCurrency(
  input: ArchiveCurrencyInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = archiveCurrencySchema.parse(input)

    // Verify ownership
    const existing = await db.query.currencies.findFirst({
      where: and(
        eq(currencies.id, validated.id),
        eq(currencies.userId, session.user.id),
        isNotDeleted(currencies.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: '通貨が見つかりません' }
    }

    // Archive currency
    await db
      .update(currencies)
      .set({ isArchived: true })
      .where(eq(currencies.id, validated.id))

    // Revalidate specific currency and list
    revalidateTag(`currency-${validated.id}`)
    revalidateTag('currency-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to archive currency:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '通貨のアーカイブに失敗しました',
    }
  }
}

/**
 * Unarchive a currency.
 *
 * Revalidates: currency-{id}, currency-list
 */
export async function unarchiveCurrency(
  input: ArchiveCurrencyInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = archiveCurrencySchema.parse(input)

    // Verify ownership
    const existing = await db.query.currencies.findFirst({
      where: and(
        eq(currencies.id, validated.id),
        eq(currencies.userId, session.user.id),
        isNotDeleted(currencies.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: '通貨が見つかりません' }
    }

    // Unarchive currency
    await db
      .update(currencies)
      .set({ isArchived: false })
      .where(eq(currencies.id, validated.id))

    // Revalidate specific currency and list
    revalidateTag(`currency-${validated.id}`)
    revalidateTag('currency-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to unarchive currency:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '通貨のアーカイブ解除に失敗しました',
    }
  }
}

/**
 * Delete a currency (soft delete).
 *
 * Revalidates: currency-list
 */
export async function deleteCurrency(
  input: DeleteCurrencyInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = deleteCurrencySchema.parse(input)

    // Verify ownership
    const existing = await db.query.currencies.findFirst({
      where: and(
        eq(currencies.id, validated.id),
        eq(currencies.userId, session.user.id),
        isNotDeleted(currencies.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: '通貨が見つかりません' }
    }

    // Soft delete currency
    await db
      .update(currencies)
      .set({ deletedAt: softDelete() })
      .where(eq(currencies.id, validated.id))

    // Revalidate list
    revalidateTag('currency-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to delete currency:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '通貨の削除に失敗しました',
    }
  }
}

// ============================================================================
// Bonus Transaction Actions
// ============================================================================

/**
 * Add a bonus transaction to a currency.
 *
 * Revalidates: currency-{currencyId}, currency-list
 */
export async function addCurrencyBonus(
  input: AddBonusInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = addBonusSchema.parse(input)

    // Verify currency ownership
    const currency = await db.query.currencies.findFirst({
      where: and(
        eq(currencies.id, validated.currencyId),
        eq(currencies.userId, session.user.id),
        isNotDeleted(currencies.deletedAt),
      ),
    })

    if (!currency) {
      return { success: false, error: '通貨が見つかりません' }
    }

    // Add bonus transaction
    await db.insert(bonusTransactions).values({
      currencyId: validated.currencyId,
      userId: session.user.id,
      amount: validated.amount,
      source: validated.source,
      transactionDate: validated.transactionDate ?? new Date(),
    })

    // Revalidate currency detail and list
    revalidateTag(`currency-${validated.currencyId}`)
    revalidateTag('currency-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to add bonus:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'ボーナスの追加に失敗しました',
    }
  }
}

// ============================================================================
// Purchase Transaction Actions
// ============================================================================

/**
 * Add a purchase transaction to a currency.
 *
 * Revalidates: currency-{currencyId}, currency-list
 */
export async function addCurrencyPurchase(
  input: AddPurchaseInput,
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate input
    const validated = addPurchaseSchema.parse(input)

    // Verify currency ownership
    const currency = await db.query.currencies.findFirst({
      where: and(
        eq(currencies.id, validated.currencyId),
        eq(currencies.userId, session.user.id),
        isNotDeleted(currencies.deletedAt),
      ),
    })

    if (!currency) {
      return { success: false, error: '通貨が見つかりません' }
    }

    // Add purchase transaction
    await db.insert(purchaseTransactions).values({
      currencyId: validated.currencyId,
      userId: session.user.id,
      amount: validated.amount,
      note: validated.note,
      transactionDate: validated.transactionDate ?? new Date(),
    })

    // Revalidate currency detail and list
    revalidateTag(`currency-${validated.currencyId}`)
    revalidateTag('currency-list')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to add purchase:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '購入の追加に失敗しました',
    }
  }
}
