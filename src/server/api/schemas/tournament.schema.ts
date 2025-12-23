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
// Prize Level Schemas
// ============================================================================

/**
 * Schema for a single prize level
 */
export const prizeLevelSchema = z.object({
  position: z.number().int().min(1, '順位は1以上で入力してください'),
  percentage: z.number().min(0).max(100).optional(),
  fixedAmount: z.number().int().positive().optional(),
})

// ============================================================================
// Blind Level Schemas
// ============================================================================

/**
 * Schema for a single blind level
 */
export const blindLevelSchema = z
  .object({
    level: z.number().int().min(1, 'レベルは1以上で入力してください'),
    smallBlind: z.number().int().positive('SBは正の数で入力してください'),
    bigBlind: z.number().int().positive('BBは正の数で入力してください'),
    ante: z.number().int().positive().optional(),
    durationMinutes: z
      .number()
      .int()
      .positive('時間は正の数で入力してください'),
  })
  .refine((data) => data.bigBlind > data.smallBlind, {
    message: 'BBはSBより大きくしてください',
    path: ['bigBlind'],
  })

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
  prizeLevels: z.array(prizeLevelSchema).optional(),
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
 * Schema for setting prize levels
 */
export const setPrizeLevelsSchema = z.object({
  tournamentId: z.string().uuid('有効なトーナメントIDを指定してください'),
  levels: z.array(prizeLevelSchema),
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

export type PrizeLevelInput = z.infer<typeof prizeLevelSchema>
export type BlindLevelInput = z.infer<typeof blindLevelSchema>

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>
export type ArchiveTournamentInput = z.infer<typeof archiveTournamentSchema>
export type DeleteTournamentInput = z.infer<typeof deleteTournamentSchema>
export type GetTournamentByIdInput = z.infer<typeof getTournamentByIdSchema>
export type ListTournamentsByStoreInput = z.infer<
  typeof listTournamentsByStoreSchema
>
export type SetPrizeLevelsInput = z.infer<typeof setPrizeLevelsSchema>
export type SetBlindLevelsInput = z.infer<typeof setBlindLevelsSchema>
