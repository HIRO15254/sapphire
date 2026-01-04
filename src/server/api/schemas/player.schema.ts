import { z } from 'zod'

/**
 * Zod schemas for player-related validations.
 *
 * All error messages are in Japanese per constitution.
 *
 * @see data-model.md Sections 16-19
 */

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('有効なIDを指定してください')

/**
 * Date format validation (YYYY-MM-DD)
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です')

/**
 * Hex color code validation (#RRGGBB)
 */
export const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, '有効なカラーコードを入力してください')

// ============================================================================
// Player Schemas
// ============================================================================

/**
 * Schema for creating a new player
 */
export const createPlayerSchema = z.object({
  name: z
    .string()
    .min(1, 'プレイヤー名を入力してください')
    .max(255, 'プレイヤー名は255文字以下で入力してください'),
  generalNotes: z.string().optional(),
})

/**
 * Schema for updating an existing player
 */
export const updatePlayerSchema = z.object({
  id: uuidSchema,
  name: z
    .string()
    .min(1, 'プレイヤー名を入力してください')
    .max(255, 'プレイヤー名は255文字以下で入力してください')
    .optional(),
  generalNotes: z.string().optional().nullable(),
})

/**
 * Schema for deleting a player (soft delete)
 */
export const deletePlayerSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for getting a player by ID
 */
export const getPlayerByIdSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for listing players with optional filters
 */
export const listPlayersSchema = z
  .object({
    search: z.string().optional(),
    tagIds: z.array(uuidSchema).optional(),
  })
  .optional()

// ============================================================================
// PlayerTag Schemas
// ============================================================================

/**
 * Schema for creating a new tag
 */
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'タグ名を入力してください')
    .max(100, 'タグ名は100文字以下で入力してください'),
  color: colorSchema.optional(),
})

/**
 * Schema for updating an existing tag
 */
export const updateTagSchema = z.object({
  id: uuidSchema,
  name: z
    .string()
    .min(1, 'タグ名を入力してください')
    .max(100, 'タグ名は100文字以下で入力してください')
    .optional(),
  color: colorSchema.optional().nullable(),
})

/**
 * Schema for deleting a tag (soft delete)
 */
export const deleteTagSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for getting a tag by ID
 */
export const getTagByIdSchema = z.object({
  id: uuidSchema,
})

// ============================================================================
// Tag Assignment Schemas
// ============================================================================

/**
 * Schema for assigning a tag to a player
 */
export const assignTagSchema = z.object({
  playerId: z.string().uuid('有効なプレイヤーIDを指定してください'),
  tagId: z.string().uuid('有効なタグIDを指定してください'),
})

/**
 * Schema for removing a tag from a player
 */
export const removeTagSchema = z.object({
  playerId: z.string().uuid('有効なプレイヤーIDを指定してください'),
  tagId: z.string().uuid('有効なタグIDを指定してください'),
})

// ============================================================================
// PlayerNote Schemas
// ============================================================================

/**
 * Schema for adding a note to a player
 */
export const addNoteSchema = z.object({
  playerId: z.string().uuid('有効なプレイヤーIDを指定してください'),
  noteDate: dateSchema,
  content: z.string().min(1, 'ノート内容を入力してください'),
})

/**
 * Schema for updating a note
 */
export const updateNoteSchema = z.object({
  id: z.string().uuid('有効なノートIDを指定してください'),
  content: z.string().min(1, 'ノート内容を入力してください').optional(),
  noteDate: dateSchema.optional(),
})

/**
 * Schema for deleting a note (soft delete)
 */
export const deleteNoteSchema = z.object({
  id: z.string().uuid('有効なノートIDを指定してください'),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>
export type DeletePlayerInput = z.infer<typeof deletePlayerSchema>
export type GetPlayerByIdInput = z.infer<typeof getPlayerByIdSchema>
export type ListPlayersInput = z.infer<typeof listPlayersSchema>

export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
export type DeleteTagInput = z.infer<typeof deleteTagSchema>
export type GetTagByIdInput = z.infer<typeof getTagByIdSchema>

export type AssignTagInput = z.infer<typeof assignTagSchema>
export type RemoveTagInput = z.infer<typeof removeTagSchema>

export type AddNoteInput = z.infer<typeof addNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type DeleteNoteInput = z.infer<typeof deleteNoteSchema>
