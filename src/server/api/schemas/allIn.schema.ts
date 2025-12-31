import { z } from 'zod'

/**
 * Zod schemas for all-in record validations.
 *
 * All error messages are in Japanese per constitution.
 *
 * @see data-model.md Section 15. AllInRecord
 */

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('有効なIDを指定してください')

// ============================================================================
// AllIn Record Schemas
// ============================================================================

/**
 * Schema for creating a new all-in record
 */
export const createAllInSchema = z
  .object({
    sessionId: z.string().uuid('有効なセッションIDを指定してください'),
    potAmount: z
      .number()
      .int('ポット額は整数で入力してください')
      .positive('ポット額は1以上の整数で入力してください'),
    winProbability: z
      .number()
      .min(0, '勝率は0〜100の範囲で入力してください')
      .max(100, '勝率は0〜100の範囲で入力してください'),
    actualResult: z.boolean(),
    runItTimes: z
      .number()
      .int()
      .min(1, 'Run it回数は1以上で入力してください')
      .max(10, 'Run it回数は10以下で入力してください')
      .optional()
      .nullable(),
    winsInRunout: z
      .number()
      .int()
      .min(0, '勝利回数は0以上で入力してください')
      .optional()
      .nullable(),
    recordedAt: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      // If runItTimes is set, winsInRunout must be <= runItTimes
      if (data.runItTimes != null && data.winsInRunout != null) {
        return data.winsInRunout <= data.runItTimes
      }
      return true
    },
    {
      message: '勝利回数はRun it回数以下で入力してください',
      path: ['winsInRunout'],
    },
  )

/**
 * Schema for updating an existing all-in record
 */
export const updateAllInSchema = z
  .object({
    id: uuidSchema,
    potAmount: z.number().int().positive().optional(),
    winProbability: z.number().min(0).max(100).optional(),
    actualResult: z.boolean().optional(),
    runItTimes: z.number().int().min(1).max(10).optional().nullable(),
    winsInRunout: z.number().int().min(0).optional().nullable(),
    recordedAt: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.runItTimes != null && data.winsInRunout != null) {
        return data.winsInRunout <= data.runItTimes
      }
      return true
    },
    {
      message: '勝利回数はRun it回数以下で入力してください',
      path: ['winsInRunout'],
    },
  )

/**
 * Schema for deleting an all-in record (soft delete)
 */
export const deleteAllInSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for listing all-in records by session
 */
export const listBySessionSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CreateAllInInput = z.infer<typeof createAllInSchema>
export type UpdateAllInInput = z.infer<typeof updateAllInSchema>
export type DeleteAllInInput = z.infer<typeof deleteAllInSchema>
export type ListBySessionInput = z.infer<typeof listBySessionSchema>
