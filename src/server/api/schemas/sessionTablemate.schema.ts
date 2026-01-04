import { z } from 'zod'

/**
 * Schema for creating a session tablemate.
 */
export const createSessionTablemateSchema = z.object({
  sessionId: z.string().min(1, 'セッションIDは必須です'),
  nickname: z
    .string()
    .min(1, 'ニックネームを入力してください')
    .max(100, 'ニックネームは100文字以下で入力してください'),
  seatNumber: z.number().int().min(1).max(10).optional(),
  sessionNotes: z.string().optional(),
  playerId: z.string().optional(),
})

export type CreateSessionTablemateInput = z.infer<
  typeof createSessionTablemateSchema
>

/**
 * Schema for updating a session tablemate.
 */
export const updateSessionTablemateSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
  nickname: z
    .string()
    .min(1, 'ニックネームを入力してください')
    .max(100, 'ニックネームは100文字以下で入力してください')
    .optional(),
  seatNumber: z.number().int().min(1).max(10).nullable().optional(),
  sessionNotes: z.string().nullable().optional(),
  playerId: z.string().nullable().optional(),
})

export type UpdateSessionTablemateInput = z.infer<
  typeof updateSessionTablemateSchema
>

/**
 * Schema for deleting a session tablemate.
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
 * Schema for linking a tablemate to a player.
 */
export const linkTablemateToPlayerSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
  playerId: z.string().min(1, 'プレイヤーIDは必須です'),
})

export type LinkTablemateToPlayerInput = z.infer<
  typeof linkTablemateToPlayerSchema
>

/**
 * Schema for converting a tablemate to a new player.
 */
export const convertToPlayerSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
  playerName: z
    .string()
    .min(1, 'プレイヤー名を入力してください')
    .max(255, 'プレイヤー名は255文字以下で入力してください'),
  generalNotes: z.string().optional(),
})

export type ConvertToPlayerInput = z.infer<typeof convertToPlayerSchema>
