'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import {
  type AddPurchaseInput,
  addPurchaseSchema,
} from '~/server/api/schemas/currency.schema'
import { auth } from '~/server/auth'
import { db } from '~/server/db'
import {
  currencies,
  isNotDeleted,
  purchaseTransactions,
} from '~/server/db/schema'

import type { ActionResult } from './currency'

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
