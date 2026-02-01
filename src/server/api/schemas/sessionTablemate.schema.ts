import { z } from 'zod'

/**
 * Schema for creating a session tablemate.
 * Creates a temporary player automatically.
 */
export const createSessionTablemateSchema = z.object({
  sessionId: z.string().min(1, 'セッションIDは必須です'),
  seatNumber: z.number().int().min(1).max(10),
})

export type CreateSessionTablemateInput = z.infer<
  typeof createSessionTablemateSchema
>

/**
 * Schema for updating a session tablemate.
 */
export const updateSessionTablemateSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
  sessionNotes: z.string().nullable().optional(),
})

export type UpdateSessionTablemateInput = z.infer<
  typeof updateSessionTablemateSchema
>

/**
 * Schema for deleting a session tablemate.
 * Also deletes the associated temporary player.
 */
export const deleteSessionTablemateSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
})

export type DeleteSessionTablemateInput = z.infer<
  typeof deleteSessionTablemateSchema
>

/**
 * Schema for listing session tablemates.
 */
export const listSessionTablematesSchema = z.object({
  sessionId: z.string().min(1, 'セッションIDは必須です'),
})

export type ListSessionTablematesInput = z.infer<
  typeof listSessionTablematesSchema
>

/**
 * Schema for linking (merging) a tablemate's temp player with an existing player.
 * The temp player data is merged into the target player, then the temp player is deleted.
 */
export const linkTablemateToPlayerSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
  playerId: z.string().min(1, 'プレイヤーIDは必須です'),
})

export type LinkTablemateToPlayerInput = z.infer<
  typeof linkTablemateToPlayerSchema
>

/**
 * Schema for converting a temporary player to a permanent player.
 * Just removes the isTemporary flag.
 */
export const convertToPlayerSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
  playerName: z
    .string()
    .min(1, 'プレイヤー名を入力してください')
    .max(255, 'プレイヤー名は255文字以下で入力してください')
    .optional(),
})

export type ConvertToPlayerInput = z.infer<typeof convertToPlayerSchema>

/**
 * Schema for creating a self-seating tablemate.
 * No player record is created; playerId will be null.
 */
export const createSelfSessionTablemateSchema = z.object({
  sessionId: z.string().min(1, 'セッションIDは必須です'),
  seatNumber: z.number().int().min(1).max(10),
})

export type CreateSelfSessionTablemateInput = z.infer<
  typeof createSelfSessionTablemateSchema
>
