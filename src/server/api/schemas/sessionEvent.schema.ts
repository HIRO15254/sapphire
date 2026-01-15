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
 * - cost: currency paid (added to buyIn total)
 * - chips: stack received (for tournaments)
 * - amount: legacy field (equals cost for backwards compatibility)
 */
export const rebuyDataSchema = z.object({
  amount: z
    .number()
    .int('リバイ額は整数で入力してください')
    .positive('リバイ額は1以上の整数で入力してください'),
  cost: z
    .number()
    .int('支払い額は整数で入力してください')
    .positive('支払い額は1以上の整数で入力してください')
    .optional(),
  chips: z
    .number()
    .int('チップ数は整数で入力してください')
    .positive('チップ数は1以上の整数で入力してください')
    .optional(),
})

/**
 * addon event data
 * - cost: currency paid (added to buyIn total)
 * - chips: stack received (for tournaments)
 * - amount: legacy field (equals cost for backwards compatibility)
 */
export const addonDataSchema = z.object({
  amount: z
    .number()
    .int('アドオン額は整数で入力してください')
    .positive('アドオン額は1以上の整数で入力してください'),
  cost: z
    .number()
    .int('支払い額は整数で入力してください')
    .positive('支払い額は1以上の整数で入力してください')
    .optional(),
  chips: z
    .number()
    .int('チップ数は整数で入力してください')
    .positive('チップ数は1以上の整数で入力してください')
    .optional(),
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
  /** Tournament initial stack (optional, for tournaments) */
  initialStack: z
    .number()
    .int('初期スタックは整数で入力してください')
    .positive('初期スタックは1以上の整数で入力してください')
    .optional()
    .nullable(),
  /** Tournament blind timer start time (optional) */
  timerStartedAt: z.date().optional().nullable(),
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
  /** Tournament final position (optional, for tournaments only) */
  finalPosition: z
    .number()
    .int('順位は整数で入力してください')
    .min(1, '順位は1以上で入力してください')
    .optional()
    .nullable(),
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
 * - cost: currency paid (required, added to buyIn total)
 * - chips: stack received (optional, for tournaments)
 */
export const recordRebuySchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  cost: z
    .number()
    .int('支払い額は整数で入力してください')
    .positive('支払い額は1以上の整数で入力してください'),
  chips: z
    .number()
    .int('チップ数は整数で入力してください')
    .positive('チップ数は1以上の整数で入力してください')
    .optional()
    .nullable(),
  recordedAt: z.date().optional(),
})

/**
 * Schema for recording an addon
 * - cost: currency paid (required, added to buyIn total)
 * - chips: stack received (optional, for tournaments)
 */
export const recordAddonSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  cost: z
    .number()
    .int('支払い額は整数で入力してください')
    .positive('支払い額は1以上の整数で入力してください'),
  chips: z
    .number()
    .int('チップ数は整数で入力してください')
    .positive('チップ数は1以上の整数で入力してください')
    .optional()
    .nullable(),
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
 * All valid positions for recording hand completion (9-max)
 */
export const POKER_POSITIONS = [
  'SB',
  'BB',
  'UTG',
  '+1',
  '+2',
  'LJ',
  'HJ',
  'CO',
  'BTN',
] as const

export type PokerPosition = (typeof POKER_POSITIONS)[number]

/**
 * Get available positions based on player count.
 * Positions are removed from middle positions as player count decreases.
 */
export function getPositionsForPlayerCount(playerCount: number): PokerPosition[] {
  switch (playerCount) {
    case 2:
      return ['SB', 'BB'] // Heads-up: SB is also BTN
    case 3:
      return ['SB', 'BB', 'BTN']
    case 4:
      return ['SB', 'BB', 'CO', 'BTN']
    case 5:
      return ['SB', 'BB', 'UTG', 'CO', 'BTN']
    case 6:
      return ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN']
    case 7:
      return ['SB', 'BB', 'UTG', 'LJ', 'HJ', 'CO', 'BTN']
    case 8:
      return ['SB', 'BB', 'UTG', '+1', 'LJ', 'HJ', 'CO', 'BTN']
    default:
      // 9 players or more
      return ['SB', 'BB', 'UTG', '+1', '+2', 'LJ', 'HJ', 'CO', 'BTN']
  }
}

/**
 * Schema for recording a single hand completion (for hand counting)
 */
export const recordHandCompleteSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  position: z.enum(POKER_POSITIONS).optional(),
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
// Tournament Override Schemas
// ============================================================================

/**
 * Schema for tournament basic info override
 */
export const tournamentBasicOverrideSchema = z.object({
  name: z.string().max(255).nullable().optional(),
  buyIn: z.number().int().positive(),
  rake: z.number().int().positive().nullable().optional(),
  startingStack: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
})

/**
 * Schema for blind level in override
 */
export const blindLevelSchema = z.object({
  level: z.number().int().positive(),
  isBreak: z.boolean().default(false),
  smallBlind: z.number().int().positive().nullable().optional(),
  bigBlind: z.number().int().positive().nullable().optional(),
  ante: z.number().int().positive().nullable().optional(),
  durationMinutes: z.number().int().positive(),
})

/**
 * Schema for prize item in override
 */
export const prizeItemSchema = z.object({
  prizeType: z.enum(['percentage', 'fixed_amount', 'custom_prize']),
  percentage: z.number().nullable().optional(),
  fixedAmount: z.number().int().nullable().optional(),
  customPrizeLabel: z.string().nullable().optional(),
  customPrizeValue: z.number().int().nullable().optional(),
  sortOrder: z.number().int().default(0),
})

/**
 * Schema for prize level in override
 */
export const prizeLevelSchema = z.object({
  minPosition: z.number().int().positive(),
  maxPosition: z.number().int().positive(),
  sortOrder: z.number().int().default(0),
  prizeItems: z.array(prizeItemSchema),
})

/**
 * Schema for prize structure in override
 */
export const prizeStructureSchema = z.object({
  minEntrants: z.number().int().positive(),
  maxEntrants: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().default(0),
  prizeLevels: z.array(prizeLevelSchema),
})

/**
 * Schema for updating tournament basic info override
 */
export const updateTournamentOverrideBasicSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  data: tournamentBasicOverrideSchema,
})

/**
 * Schema for updating tournament blind levels override
 */
export const updateTournamentOverrideBlindsSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  blindLevels: z.array(blindLevelSchema),
})

/**
 * Schema for updating tournament prize structures override
 */
export const updateTournamentOverridePrizesSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  prizeStructures: z.array(prizeStructureSchema),
})

/**
 * Schema for clearing tournament overrides
 */
export const clearTournamentOverridesSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  clearBasic: z.boolean().optional(),
  clearBlinds: z.boolean().optional(),
  clearPrizes: z.boolean().optional(),
})

/**
 * Schema for updating tournament timer start time
 */
export const updateTimerStartedAtSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  timerStartedAt: z.date().nullable(),
})

/**
 * Schema for updating tournament entries and remaining players
 */
export const updateTournamentFieldSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  entries: z.number().int().min(1).optional().nullable(),
  remaining: z.number().int().min(1).optional().nullable(),
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

export type TournamentBasicOverride = z.infer<typeof tournamentBasicOverrideSchema>
export type BlindLevel = z.infer<typeof blindLevelSchema>
export type PrizeItem = z.infer<typeof prizeItemSchema>
export type PrizeLevel = z.infer<typeof prizeLevelSchema>
export type PrizeStructure = z.infer<typeof prizeStructureSchema>
export type UpdateTournamentOverrideBasicInput = z.infer<typeof updateTournamentOverrideBasicSchema>
export type UpdateTournamentOverrideBlindsInput = z.infer<typeof updateTournamentOverrideBlindsSchema>
export type UpdateTournamentOverridePrizesInput = z.infer<typeof updateTournamentOverridePrizesSchema>
export type ClearTournamentOverridesInput = z.infer<typeof clearTournamentOverridesSchema>
export type UpdateTimerStartedAtInput = z.infer<typeof updateTimerStartedAtSchema>
export type UpdateTournamentFieldInput = z.infer<typeof updateTournamentFieldSchema>
