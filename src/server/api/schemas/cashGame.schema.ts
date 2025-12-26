import { z } from 'zod'

/**
 * Zod schemas for cash game-related validations.
 *
 * All error messages are in Japanese per constitution.
 *
 * @see data-model.md Section 9. CashGame
 */

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('有効なIDを指定してください')

/**
 * Ante type enum
 */
export const anteTypeSchema = z.enum(['all_ante', 'bb_ante'])

// ============================================================================
// Cash Game Schemas
// ============================================================================

/**
 * Schema for creating a new cash game
 */
export const createCashGameSchema = z
  .object({
    storeId: z.string().uuid('有効な店舗IDを指定してください'),
    currencyId: z.string().uuid('有効な通貨IDを指定してください').optional(),
    smallBlind: z
      .number()
      .int('SBは整数で入力してください')
      .positive('SBは正の数で入力してください'),
    bigBlind: z
      .number()
      .int('BBは整数で入力してください')
      .positive('BBは正の数で入力してください'),
    straddle1: z
      .number()
      .int('ストラドル1は整数で入力してください')
      .positive('ストラドル1は正の数で入力してください')
      .optional(),
    straddle2: z
      .number()
      .int('ストラドル2は整数で入力してください')
      .positive('ストラドル2は正の数で入力してください')
      .optional(),
    ante: z
      .number()
      .int('アンティは整数で入力してください')
      .positive('アンティは正の数で入力してください')
      .optional(),
    anteType: anteTypeSchema.optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.bigBlind > data.smallBlind, {
    message: 'BBはSBより大きくしてください',
    path: ['bigBlind'],
  })
  .refine((data) => !data.straddle1 || data.straddle1 > data.bigBlind, {
    message: 'ストラドル1はBBより大きくしてください',
    path: ['straddle1'],
  })
  .refine(
    (data) =>
      !data.straddle2 || (data.straddle1 && data.straddle2 > data.straddle1),
    {
      message: 'ストラドル2はストラドル1より大きくしてください',
      path: ['straddle2'],
    },
  )
  .refine((data) => !data.ante || data.anteType, {
    message: 'アンティを設定する場合はアンティタイプも指定してください',
    path: ['anteType'],
  })

/**
 * Schema for updating an existing cash game
 */
export const updateCashGameSchema = z.object({
  id: uuidSchema,
  currencyId: z.string().uuid().optional().nullable(),
  smallBlind: z.number().int().positive().optional(),
  bigBlind: z.number().int().positive().optional(),
  straddle1: z.number().int().positive().optional().nullable(),
  straddle2: z.number().int().positive().optional().nullable(),
  ante: z.number().int().positive().optional().nullable(),
  anteType: anteTypeSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * Schema for archiving a cash game
 */
export const archiveCashGameSchema = z.object({
  id: uuidSchema,
  isArchived: z.boolean(),
})

/**
 * Schema for deleting a cash game (soft delete)
 */
export const deleteCashGameSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for getting a cash game by ID
 */
export const getCashGameByIdSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for listing cash games by store
 */
export const listCashGamesByStoreSchema = z.object({
  storeId: z.string().uuid('有効な店舗IDを指定してください'),
  includeArchived: z.boolean().default(false),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CreateCashGameInput = z.infer<typeof createCashGameSchema>
export type UpdateCashGameInput = z.infer<typeof updateCashGameSchema>
export type ArchiveCashGameInput = z.infer<typeof archiveCashGameSchema>
export type DeleteCashGameInput = z.infer<typeof deleteCashGameSchema>
export type GetCashGameByIdInput = z.infer<typeof getCashGameByIdSchema>
export type ListCashGamesByStoreInput = z.infer<
  typeof listCashGamesByStoreSchema
>
