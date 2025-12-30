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
