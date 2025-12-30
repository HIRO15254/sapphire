import { z } from 'zod'

import type { RouterOutputs } from '~/trpc/react'

export type Currency = RouterOutputs['currency']['getById']

// Schemas for forms
export const updateCurrencyFormSchema = z.object({
  name: z
    .string()
    .min(1, '通貨名を入力してください')
    .max(255, '通貨名は255文字以下で入力してください'),
  initialBalance: z
    .number()
    .int('初期残高は整数で入力してください')
    .min(0, '初期残高は0以上で入力してください'),
})

export const addBonusFormSchema = z.object({
  amount: z
    .number()
    .int('金額は整数で入力してください')
    .positive('金額は正の数で入力してください'),
  source: z
    .string()
    .max(255, '取得元は255文字以下で入力してください')
    .optional(),
})

export const addPurchaseFormSchema = z.object({
  amount: z
    .number()
    .int('金額は整数で入力してください')
    .positive('金額は正の数で入力してください'),
  note: z.string().optional(),
})

export type UpdateCurrencyFormValues = z.infer<typeof updateCurrencyFormSchema>
export type AddBonusFormValues = z.infer<typeof addBonusFormSchema>
export type AddPurchaseFormValues = z.infer<typeof addPurchaseFormSchema>

// Unified transaction type for transaction history
export type UnifiedTransaction =
  | {
      type: 'session'
      id: string
      date: Date
      amount: number
      detail: string
      storeId: string
    }
  | {
      type: 'bonus'
      id: string
      date: Date
      amount: number
      detail: string
    }
  | {
      type: 'purchase'
      id: string
      date: Date
      amount: number
      detail: string
    }

/**
 * Merge all transaction types into a unified, chronologically sorted list.
 */
export function buildUnifiedTransactions(
  currency: Currency,
): UnifiedTransaction[] {
  const transactions: UnifiedTransaction[] = []

  // Add sessions
  for (const session of currency.relatedSessions) {
    const profit = (session.cashOut ?? 0) - session.buyIn
    transactions.push({
      type: 'session',
      id: session.id,
      date: new Date(session.startTime),
      amount: profit,
      detail: session.storeName,
      storeId: session.storeId,
    })
  }

  // Add bonuses
  for (const bonus of currency.bonusTransactions) {
    transactions.push({
      type: 'bonus',
      id: bonus.id,
      date: new Date(bonus.transactionDate),
      amount: bonus.amount,
      detail: bonus.source ?? '',
    })
  }

  // Add purchases
  for (const purchase of currency.purchaseTransactions) {
    transactions.push({
      type: 'purchase',
      id: purchase.id,
      date: new Date(purchase.transactionDate),
      amount: purchase.amount,
      detail: purchase.note ?? '',
    })
  }

  // Sort by date descending (newest first)
  transactions.sort((a, b) => b.date.getTime() - a.date.getTime())

  return transactions
}
