import { z } from 'zod'

/**
 * Zod schemas for session event related validations.
 *
 * All error messages are in Japanese per constitution.
 *
 * @see data-model.md Section 14. SessionEvent
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
// Event Data Schemas (for JSONB eventData field)
// ============================================================================

/**
 * session_start event data (empty object)
 */
export const sessionStartDataSchema = z.object({}).strict()

/**
 * session_resume event data (empty object)
 */
export const sessionResumeDataSchema = z.object({}).strict()

/**
 * session_pause event data (empty object)
 */
export const sessionPauseDataSchema = z.object({}).strict()

/**
 * session_end event data
 */
export const sessionEndDataSchema = z.object({
  cashOut: z
    .number()
    .int('キャッシュアウト額は整数で入力してください')
    .min(0, 'キャッシュアウト額は0以上で入力してください'),
})

/**
 * player_seated event data
 */
export const playerSeatedDataSchema = z.object({
  playerId: z.string().uuid('有効なプレイヤーIDを指定してください').optional(),
  seatNumber: z
    .number()
    .int('座席番号は整数で入力してください')
    .min(1, '座席番号は1以上9以下で入力してください')
    .max(9, '座席番号は1以上9以下で入力してください'),
  playerName: z.string().min(1, 'プレイヤー名を入力してください'),
})

/**
 * hand_recorded event data
 */
export const handRecordedDataSchema = z.object({
  handId: z.string().uuid('有効なハンドIDを指定してください'),
})

/**
 * hands_passed event data
 */
export const handsPassedDataSchema = z.object({
  count: z
    .number()
    .int('ハンド数は整数で入力してください')
    .positive('ハンド数は1以上の整数で入力してください'),
})

/**
 * stack_update event data
 */
export const stackUpdateDataSchema = z.object({
  amount: z
    .number()
    .int('スタック額は整数で入力してください')
    .positive('スタック額は1以上の整数で入力してください'),
})

/**
 * rebuy event data
 */
export const rebuyDataSchema = z.object({
  amount: z
    .number()
    .int('リバイ額は整数で入力してください')
    .positive('リバイ額は1以上の整数で入力してください'),
})

/**
 * addon event data
 */
export const addonDataSchema = z.object({
  amount: z
    .number()
    .int('アドオン額は整数で入力してください')
    .positive('アドオン額は1以上の整数で入力してください'),
})

// ============================================================================
// Mutation Input Schemas
// ============================================================================

/**
 * Schema for starting a new active session
 */
export const startSessionSchema = z.object({
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
  buyIn: z
    .number()
    .int('バイイン額は整数で入力してください')
    .positive('バイイン額は1以上の整数で入力してください'),
})

/**
 * Schema for ending an active session
 */
export const endSessionSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  cashOut: z
    .number()
    .int('キャッシュアウト額は整数で入力してください')
    .min(0, 'キャッシュアウト額は0以上で入力してください'),
  recordedAt: z.date().optional(),
})

/**
 * Schema for pausing an active session
 */
export const pauseSessionSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
})

/**
 * Schema for resuming a paused session
 */
export const resumeSessionSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
})

/**
 * Schema for seating a player at the table
 */
export const seatPlayerSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  seatNumber: z
    .number()
    .int('座席番号は整数で入力してください')
    .min(1, '座席番号は1以上9以下で入力してください')
    .max(9, '座席番号は1以上9以下で入力してください'),
  playerId: z.string().uuid('有効なプレイヤーIDを指定してください').optional(),
  playerName: z.string().min(1, 'プレイヤー名を入力してください'),
})

/**
 * Schema for updating stack amount
 */
export const updateStackSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  amount: z
    .number()
    .int('スタック額は整数で入力してください')
    .positive('スタック額は1以上の整数で入力してください'),
  recordedAt: z.date().optional(),
})

/**
 * Schema for recording a rebuy
 */
export const recordRebuySchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  amount: z
    .number()
    .int('リバイ額は整数で入力してください')
    .positive('リバイ額は1以上の整数で入力してください'),
  recordedAt: z.date().optional(),
})

/**
 * Schema for recording an addon
 */
export const recordAddonSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  amount: z
    .number()
    .int('アドオン額は整数で入力してください')
    .positive('アドオン額は1以上の整数で入力してください'),
  recordedAt: z.date().optional(),
})

/**
 * Schema for recording hands passed (without full history)
 */
export const recordHandsPassedSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  count: z
    .number()
    .int('ハンド数は整数で入力してください')
    .positive('ハンド数は1以上の整数で入力してください'),
})

/**
 * Schema for recording a hand with full history
 */
export const recordHandSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  handId: z.string().uuid('有効なハンドIDを指定してください'),
})

/**
 * Schema for recording a single hand completion (for hand counting)
 */
export const recordHandCompleteSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
})

/**
 * Schema for deleting the latest hand_complete event
 */
export const deleteLatestHandCompleteSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
})

// ============================================================================
// Query Input Schemas
// ============================================================================

/**
 * Schema for getting active session
 */
export const getActiveSessionSchema = z.object({}).optional()

/**
 * Schema for listing events by session
 */
export const listBySessionSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
})

/**
 * Schema for deleting an event
 */
export const deleteEventSchema = z.object({
  eventId: z.string().uuid('有効なイベントIDを指定してください'),
})

/**
 * Schema for updating an event's amount (stack_update, rebuy, addon) and/or time
 */
export const updateEventSchema = z.object({
  eventId: z.string().uuid('有効なイベントIDを指定してください'),
  amount: z
    .number()
    .int('金額は整数で入力してください')
    .min(0, '金額は0以上で入力してください')
    .optional(),
  recordedAt: z.date().optional(),
})

// ============================================================================
// Type Exports
// ============================================================================

export type SessionStartData = z.infer<typeof sessionStartDataSchema>
export type SessionResumeData = z.infer<typeof sessionResumeDataSchema>
export type SessionPauseData = z.infer<typeof sessionPauseDataSchema>
export type SessionEndData = z.infer<typeof sessionEndDataSchema>
export type PlayerSeatedData = z.infer<typeof playerSeatedDataSchema>
export type HandRecordedData = z.infer<typeof handRecordedDataSchema>
export type HandsPassedData = z.infer<typeof handsPassedDataSchema>
export type StackUpdateData = z.infer<typeof stackUpdateDataSchema>
export type RebuyData = z.infer<typeof rebuyDataSchema>
export type AddonData = z.infer<typeof addonDataSchema>

export type StartSessionInput = z.infer<typeof startSessionSchema>
export type EndSessionInput = z.infer<typeof endSessionSchema>
export type PauseSessionInput = z.infer<typeof pauseSessionSchema>
export type ResumeSessionInput = z.infer<typeof resumeSessionSchema>
export type SeatPlayerInput = z.infer<typeof seatPlayerSchema>
export type UpdateStackInput = z.infer<typeof updateStackSchema>
export type RecordRebuyInput = z.infer<typeof recordRebuySchema>
export type RecordAddonInput = z.infer<typeof recordAddonSchema>
export type RecordHandsPassedInput = z.infer<typeof recordHandsPassedSchema>
export type RecordHandInput = z.infer<typeof recordHandSchema>
export type RecordHandCompleteInput = z.infer<typeof recordHandCompleteSchema>
export type DeleteLatestHandCompleteInput = z.infer<
  typeof deleteLatestHandCompleteSchema
>
export type GetActiveSessionInput = z.infer<typeof getActiveSessionSchema>
export type ListBySessionInput = z.infer<typeof listBySessionSchema>
export type DeleteEventInput = z.infer<typeof deleteEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
