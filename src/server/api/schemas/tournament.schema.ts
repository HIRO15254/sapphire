import { z } from 'zod'

/**
 * Zod schemas for tournament-related validations.
 *
 * All error messages are in Japanese per constitution.
 *
 * @see data-model.md Section 10-12. Tournament, TournamentPrizeLevel, TournamentBlindLevel
 */

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('有効なIDを指定してください')

// ============================================================================
// Prize Structure Schemas (Hierarchical: Structure -> Level -> Item)
// ============================================================================

/**
 * Prize type enum values
 * - percentage: プライズプールの何%が得られるか
 * - fixed_amount: バイインと同じ仮想通貨の特定数量
 * - custom_prize: カスタムプライズ（説明文と換算価値）
 */
export const prizeTypeSchema = z.enum([
  'percentage',
  'fixed_amount',
  'custom_prize',
])
export type PrizeTypeInput = z.infer<typeof prizeTypeSchema>

/**
 * Schema for a single prize item (individual prize within a position range)
 */
export const prizeItemSchema = z
  .object({
    prizeType: prizeTypeSchema,
    percentage: z.number().min(0).max(100).optional().nullable(),
    fixedAmount: z.number().int().positive().optional().nullable(),
    customPrizeLabel: z.string().min(1).optional().nullable(),
    customPrizeValue: z.number().int().min(0).optional().nullable(),
    sortOrder: z.number().int().min(0).default(0),
  })
  .refine(
    (data) => {
      switch (data.prizeType) {
        case 'percentage':
          return data.percentage != null
        case 'fixed_amount':
          return data.fixedAmount != null
        case 'custom_prize':
          return (
            data.customPrizeLabel != null && data.customPrizeLabel.length > 0
          )
        default:
          return false
      }
    },
    {
      message: 'プライズタイプに応じた値を入力してください',
      path: ['prizeType'],
    },
  )

/**
 * Schema for a prize level (position range with multiple prize items)
 */
export const prizeLevelSchema = z.object({
  minPosition: z.number().int().min(1, '順位の開始は1以上で入力してください'),
  maxPosition: z.number().int().min(1, '順位の終了は1以上で入力してください'),
  sortOrder: z.number().int().min(0).default(0),
  prizeItems: z
    .array(prizeItemSchema)
    .min(1, '少なくとも1つのプライズを設定してください'),
})

/**
 * Schema for a prize structure (entry count range with multiple prize levels)
 */
export const prizeStructureSchema = z.object({
  minEntrants: z
    .number()
    .int()
    .min(1, '参加人数の下限は1以上で入力してください'),
  maxEntrants: z
    .number()
    .int()
    .min(1, '参加人数の上限は1以上で入力してください')
    .optional()
    .nullable(),
  sortOrder: z.number().int().min(0).default(0),
  prizeLevels: z.array(prizeLevelSchema),
})

// ============================================================================
// Blind Level Schemas
// ============================================================================

/**
 * Schema for a single blind level (supports breaks)
 *
 * When isBreak=true, smallBlind/bigBlind are optional (break time only)
 */
export const blindLevelSchema = z
  .object({
    level: z.number().int().min(1, 'レベルは1以上で入力してください'),
    isBreak: z.boolean().default(false),
    smallBlind: z
      .number()
      .int()
      .positive('SBは正の数で入力してください')
      .optional()
      .nullable(),
    bigBlind: z
      .number()
      .int()
      .positive('BBは正の数で入力してください')
      .optional()
      .nullable(),
    ante: z.number().int().positive().optional().nullable(),
    durationMinutes: z
      .number()
      .int()
      .positive('時間は正の数で入力してください'),
  })
  .refine(
    (data) => {
      // If it's a break, no need to validate SB/BB
      if (data.isBreak) return true
      // If not a break, SB and BB are required
      return data.smallBlind != null && data.bigBlind != null
    },
    {
      message: 'ブレイク以外ではSB/BBは必須です',
      path: ['smallBlind'],
    },
  )
  .refine(
    (data) => {
      // If it's a break, skip BB > SB check
      if (data.isBreak) return true
      // Check BB > SB only when both are present
      if (data.smallBlind != null && data.bigBlind != null) {
        return data.bigBlind > data.smallBlind
      }
      return true
    },
    {
      message: 'BBはSBより大きくしてください',
      path: ['bigBlind'],
    },
  )

// ============================================================================
// Tournament Schemas
// ============================================================================

/**
 * Schema for creating a new tournament
 */
export const createTournamentSchema = z.object({
  storeId: z.string().uuid('有効な店舗IDを指定してください'),
  name: z.string().max(255).optional(),
  currencyId: z.string().uuid('有効な通貨IDを指定してください').optional(),
  buyIn: z
    .number()
    .int('バイインは整数で入力してください')
    .positive('バイインは正の数で入力してください'),
  rake: z
    .number()
    .int()
    .positive('レーキは正の数で入力してください')
    .optional(),
  startingStack: z.number().int().positive().optional(),
  prizeStructures: z.array(prizeStructureSchema).optional(),
  blindLevels: z.array(blindLevelSchema).optional(),
  notes: z.string().optional(),
})

/**
 * Schema for updating an existing tournament
 */
export const updateTournamentSchema = z.object({
  id: uuidSchema,
  name: z.string().max(255).optional().nullable(),
  currencyId: z.string().uuid().optional().nullable(),
  buyIn: z.number().int().positive().optional(),
  rake: z.number().int().positive().optional().nullable(),
  startingStack: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * Schema for archiving a tournament
 */
export const archiveTournamentSchema = z.object({
  id: uuidSchema,
  isArchived: z.boolean(),
})

/**
 * Schema for deleting a tournament (soft delete)
 */
export const deleteTournamentSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for getting a tournament by ID
 */
export const getTournamentByIdSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for listing tournaments by store
 */
export const listTournamentsByStoreSchema = z.object({
  storeId: z.string().uuid('有効な店舗IDを指定してください'),
  includeArchived: z.boolean().default(false),
})

/**
 * Schema for setting prize structures (hierarchical)
 */
export const setPrizeStructuresSchema = z.object({
  tournamentId: z.string().uuid('有効なトーナメントIDを指定してください'),
  structures: z.array(prizeStructureSchema),
})

/**
 * Schema for setting blind levels
 */
export const setBlindLevelsSchema = z.object({
  tournamentId: z.string().uuid('有効なトーナメントIDを指定してください'),
  levels: z.array(blindLevelSchema),
})

// ============================================================================
// Type Exports
// ============================================================================

export type PrizeItemInput = z.infer<typeof prizeItemSchema>
export type PrizeLevelInput = z.infer<typeof prizeLevelSchema>
export type PrizeStructureInput = z.infer<typeof prizeStructureSchema>
export type BlindLevelInput = z.infer<typeof blindLevelSchema>

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>
export type ArchiveTournamentInput = z.infer<typeof archiveTournamentSchema>
export type DeleteTournamentInput = z.infer<typeof deleteTournamentSchema>
export type GetTournamentByIdInput = z.infer<typeof getTournamentByIdSchema>
export type ListTournamentsByStoreInput = z.infer<
  typeof listTournamentsByStoreSchema
>
export type SetPrizeStructuresInput = z.infer<typeof setPrizeStructuresSchema>
export type SetBlindLevelsInput = z.infer<typeof setBlindLevelsSchema>
