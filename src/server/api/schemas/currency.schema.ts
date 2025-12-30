import { z } from 'zod'

/**
 * Zod schemas for currency-related validations.
 *
 * All error messages are in Japanese per constitution.
 *
 * @see data-model.md Section 5-7 (Currency, BonusTransaction, PurchaseTransaction)
 */

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('有効なIDを指定してください')

// ============================================================================
// Currency Schemas
// ============================================================================

/**
 * Schema for creating a new currency
 */
export const createCurrencySchema = z.object({
  name: z
    .string()
    .min(1, '通貨名を入力してください')
    .max(255, '通貨名は255文字以下で入力してください'),
  initialBalance: z
    .number()
    .int('初期残高は整数で入力してください')
    .min(0, '初期残高は0以上で入力してください')
    .default(0),
})

/**
 * Schema for updating an existing currency
 */
export const updateCurrencySchema = z.object({
  id: uuidSchema,
  name: z
    .string()
    .min(1, '通貨名を入力してください')
    .max(255, '通貨名は255文字以下で入力してください')
    .optional(),
  initialBalance: z
    .number()
    .int('初期残高は整数で入力してください')
    .min(0, '初期残高は0以上で入力してください')
    .optional(),
})

/**
 * Schema for archiving a currency
 */
export const archiveCurrencySchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for deleting a currency (soft delete)
 */
export const deleteCurrencySchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for getting a currency by ID
 */
export const getCurrencyByIdSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for listing currencies with optional filters
 */
export const listCurrenciesSchema = z
  .object({
    includeArchived: z.boolean().default(false),
  })
  .optional()

// ============================================================================
// Bonus Transaction Schemas
// ============================================================================

/**
 * Schema for adding a bonus transaction
 */
export const addBonusSchema = z.object({
  currencyId: z.string().uuid('有効な通貨IDを指定してください'),
  amount: z
    .number()
    .int('金額は整数で入力してください')
    .positive('金額は正の数で入力してください'),
  source: z
    .string()
    .max(255, '取得元は255文字以下で入力してください')
    .optional(),
  transactionDate: z.date().optional(),
})

/**
 * Schema for updating a bonus transaction
 */
export const updateBonusSchema = z.object({
  id: uuidSchema,
  amount: z
    .number()
    .int('金額は整数で入力してください')
    .positive('金額は正の数で入力してください')
    .optional(),
  source: z
    .string()
    .max(255, '取得元は255文字以下で入力してください')
    .nullable()
    .optional(),
  transactionDate: z.date().optional(),
})

/**
 * Schema for deleting a bonus transaction
 */
export const deleteBonusSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for listing bonus transactions by currency
 */
export const listBonusesByCurrencySchema = z.object({
  currencyId: z.string().uuid('有効な通貨IDを指定してください'),
})

// ============================================================================
// Purchase Transaction Schemas
// ============================================================================

/**
 * Schema for adding a purchase transaction
 */
export const addPurchaseSchema = z.object({
  currencyId: z.string().uuid('有効な通貨IDを指定してください'),
  amount: z
    .number()
    .int('金額は整数で入力してください')
    .positive('金額は正の数で入力してください'),
  note: z.string().optional(),
  transactionDate: z.date().optional(),
})

/**
 * Schema for updating a purchase transaction
 */
export const updatePurchaseSchema = z.object({
  id: uuidSchema,
  amount: z
    .number()
    .int('金額は整数で入力してください')
    .positive('金額は正の数で入力してください')
    .optional(),
  note: z.string().nullable().optional(),
  transactionDate: z.date().optional(),
})

/**
 * Schema for deleting a purchase transaction
 */
export const deletePurchaseSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for listing purchase transactions by currency
 */
export const listPurchasesByCurrencySchema = z.object({
  currencyId: z.string().uuid('有効な通貨IDを指定してください'),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>
export type UpdateCurrencyInput = z.infer<typeof updateCurrencySchema>
export type ArchiveCurrencyInput = z.infer<typeof archiveCurrencySchema>
export type DeleteCurrencyInput = z.infer<typeof deleteCurrencySchema>
export type GetCurrencyByIdInput = z.infer<typeof getCurrencyByIdSchema>
export type ListCurrenciesInput = z.infer<typeof listCurrenciesSchema>

export type AddBonusInput = z.infer<typeof addBonusSchema>
export type UpdateBonusInput = z.infer<typeof updateBonusSchema>
export type DeleteBonusInput = z.infer<typeof deleteBonusSchema>
export type ListBonusesByCurrencyInput = z.infer<
  typeof listBonusesByCurrencySchema
>

export type AddPurchaseInput = z.infer<typeof addPurchaseSchema>
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>
export type DeletePurchaseInput = z.infer<typeof deletePurchaseSchema>
export type ListPurchasesByCurrencyInput = z.infer<
  typeof listPurchasesByCurrencySchema
>
