import { z } from 'zod'

export const newCurrencyFormSchema = z.object({
  name: z
    .string()
    .min(1, '通貨名を入力してください')
    .max(255, '通貨名は255文字以下で入力してください'),
  initialBalance: z
    .number()
    .int('初期残高は整数で入力してください')
    .min(0, '初期残高は0以上で入力してください'),
})

export type NewCurrencyFormInput = z.infer<typeof newCurrencyFormSchema>
