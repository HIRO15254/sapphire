import { z } from 'zod'

/**
 * Zod schemas for session-related validations.
 *
 * All error messages are in Japanese per constitution.
 *
 * @see data-model.md Section 13. PokerSession
 */

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('有効なIDを指定してください')

/**
 * Game type enum
 */
export const gameTypeSchema = z.enum(['cash', 'tournament'])

// ============================================================================
// Session Schemas
// ============================================================================

/**
 * Schema for creating an archive session (completed session)
 */
export const createArchiveSessionSchema = z.object({
  storeId: z.string().uuid('有効な店舗IDを指定してください').optional(),
  gameType: gameTypeSchema.optional(),
  cashGameId: z
    .string()
    .uuid('有効なキャッシュゲームIDを指定してください')
    .optional()
    .nullable(),
  tournamentId: z
    .string()
    .uuid('有効なトーナメントIDを指定してください')
    .optional()
    .nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  buyIn: z
    .number()
    .int('バイイン額は整数で入力してください')
    .positive('バイイン額は1以上の整数で入力してください'),
  cashOut: z
    .number()
    .int('キャッシュアウト額は整数で入力してください')
    .min(0, 'キャッシュアウト額は0以上で入力してください'),
  notes: z.string().optional(),
})

/**
 * Schema for updating an existing session
 */
export const updateSessionSchema = z.object({
  id: uuidSchema,
  storeId: z.string().uuid().optional().nullable(),
  gameType: gameTypeSchema.optional().nullable(),
  cashGameId: z.string().uuid().optional().nullable(),
  tournamentId: z.string().uuid().optional().nullable(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional().nullable(),
  buyIn: z.number().int().positive().optional(),
  cashOut: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * Schema for deleting a session (soft delete)
 */
export const deleteSessionSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for getting a session by ID
 */
export const getSessionByIdSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for listing sessions with optional filters and pagination
 */
export const listSessionsSchema = z
  .object({
    storeId: z.string().uuid().optional(),
    gameType: gameTypeSchema.optional(),
    limit: z
      .number()
      .int()
      .positive()
      .max(100, '1回の取得件数は100件以下に設定してください')
      .default(20),
    offset: z.number().int().min(0).default(0),
  })
  .optional()

// ============================================================================
// Type Exports
// ============================================================================

export type CreateArchiveSessionInput = z.infer<
  typeof createArchiveSessionSchema
>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>
export type DeleteSessionInput = z.infer<typeof deleteSessionSchema>
export type GetSessionByIdInput = z.infer<typeof getSessionByIdSchema>
export type ListSessionsInput = z.infer<typeof listSessionsSchema>
export type GameType = z.infer<typeof gameTypeSchema>
