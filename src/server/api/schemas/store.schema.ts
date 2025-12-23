import { z } from 'zod'

/**
 * Zod schemas for store-related validations.
 *
 * All error messages are in Japanese per constitution.
 *
 * @see data-model.md Section 8. Store
 */

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('有効なIDを指定してください')

// ============================================================================
// Store Schemas
// ============================================================================

/**
 * Schema for creating a new store
 */
export const createStoreSchema = z.object({
  name: z
    .string()
    .min(1, '店舗名を入力してください')
    .max(255, '店舗名は255文字以下で入力してください'),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  placeId: z.string().max(255).optional(),
  customMapUrl: z.string().url('有効なURLを入力してください').optional(),
  notes: z.string().optional(),
})

/**
 * Schema for updating an existing store
 */
export const updateStoreSchema = z.object({
  id: uuidSchema,
  name: z
    .string()
    .min(1, '店舗名を入力してください')
    .max(255, '店舗名は255文字以下で入力してください')
    .optional(),
  address: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  placeId: z.string().max(255).optional().nullable(),
  customMapUrl: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * Schema for archiving a store
 */
export const archiveStoreSchema = z.object({
  id: uuidSchema,
  isArchived: z.boolean(),
})

/**
 * Schema for deleting a store (soft delete)
 */
export const deleteStoreSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for getting a store by ID
 */
export const getStoreByIdSchema = z.object({
  id: uuidSchema,
})

/**
 * Schema for listing stores with optional filters
 */
export const listStoresSchema = z
  .object({
    includeArchived: z.boolean().default(false),
  })
  .optional()

// ============================================================================
// Type Exports
// ============================================================================

export type CreateStoreInput = z.infer<typeof createStoreSchema>
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>
export type ArchiveStoreInput = z.infer<typeof archiveStoreSchema>
export type DeleteStoreInput = z.infer<typeof deleteStoreSchema>
export type GetStoreByIdInput = z.infer<typeof getStoreByIdSchema>
export type ListStoresInput = z.infer<typeof listStoresSchema>
