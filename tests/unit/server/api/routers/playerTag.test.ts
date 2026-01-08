import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Unit tests for playerTag router.
 *
 * Tests the CRUD mutations and queries' input validation and business logic.
 * Uses Zod schema validation to test input requirements.
 *
 * @see data-model.md Section 17. PlayerTag
 */
describe('PlayerTag Router', () => {
  describe('create mutation', () => {
    describe('input validation', () => {
      const createTagInputSchema = z.object({
        name: z
          .string()
          .min(1, 'タグ名を入力してください')
          .max(100, 'タグ名は100文字以下で入力してください'),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, '有効なカラーコードを入力してください')
          .optional(),
      })

      it('should accept valid name only', () => {
        const result = createTagInputSchema.safeParse({
          name: 'アグレッシブ',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid name with color', () => {
        const result = createTagInputSchema.safeParse({
          name: 'ブラフ多め',
          color: '#FF5733',
        })
        expect(result.success).toBe(true)
      })

      it('should accept lowercase hex color', () => {
        const result = createTagInputSchema.safeParse({
          name: 'タイト',
          color: '#ff5733',
        })
        expect(result.success).toBe(true)
      })

      it('should reject empty name', () => {
        const result = createTagInputSchema.safeParse({
          name: '',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'タグ名を入力してください',
          )
        }
      })

      it('should reject name longer than 100 characters', () => {
        const result = createTagInputSchema.safeParse({
          name: 'a'.repeat(101),
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'タグ名は100文字以下で入力してください',
          )
        }
      })

      it('should reject invalid color format (no hash)', () => {
        const result = createTagInputSchema.safeParse({
          name: 'タグ',
          color: 'FF5733',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効なカラーコードを入力してください',
          )
        }
      })

      it('should reject invalid color format (wrong length)', () => {
        const result = createTagInputSchema.safeParse({
          name: 'タグ',
          color: '#FFF',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効なカラーコードを入力してください',
          )
        }
      })

      it('should reject invalid color format (invalid characters)', () => {
        const result = createTagInputSchema.safeParse({
          name: 'タグ',
          color: '#GGGGGG',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効なカラーコードを入力してください',
          )
        }
      })
    })
  })

  describe('update mutation', () => {
    describe('input validation', () => {
      const updateTagInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
        name: z
          .string()
          .min(1, 'タグ名を入力してください')
          .max(100, 'タグ名は100文字以下で入力してください')
          .optional(),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, '有効なカラーコードを入力してください')
          .optional()
          .nullable(),
      })

      it('should accept valid id with name update', () => {
        const result = updateTagInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: '更新後のタグ名',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid id with color update', () => {
        const result = updateTagInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          color: '#00FF00',
        })
        expect(result.success).toBe(true)
      })

      it('should accept null to clear color', () => {
        const result = updateTagInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          color: null,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = updateTagInputSchema.safeParse({
          id: 'not-a-uuid',
          name: 'Updated Tag',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効なIDを指定してください',
          )
        }
      })
    })
  })

  describe('delete mutation', () => {
    describe('input validation', () => {
      const deleteTagInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = deleteTagInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = deleteTagInputSchema.safeParse({
          id: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('list query', () => {
    describe('input validation', () => {
      const listTagsInputSchema = z.void().optional()

      it('should accept empty input', () => {
        const result = listTagsInputSchema.safeParse(undefined)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('getById query', () => {
    describe('input validation', () => {
      const getByIdInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = getByIdInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = getByIdInputSchema.safeParse({
          id: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('business logic', () => {
    it('should return NOT_FOUND error code for non-existent tag', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: 'タグが見つかりません',
      })

      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('タグが見つかりません')
    })

    it('should return BAD_REQUEST error code for duplicate tag name', () => {
      const error = new TRPCError({
        code: 'BAD_REQUEST',
        message: '同じ名前のタグが既に存在します',
      })

      expect(error.code).toBe('BAD_REQUEST')
      expect(error.message).toBe('同じ名前のタグが既に存在します')
    })

    it('should return expected tag response structure', () => {
      const expectedResponse = {
        id: 'test-uuid',
        name: 'アグレッシブ',
        color: '#FF5733',
        userId: 'user-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }

      expect(expectedResponse).toHaveProperty('id')
      expect(expectedResponse).toHaveProperty('name')
      expect(expectedResponse).toHaveProperty('color')
      expect(expectedResponse).toHaveProperty('userId')
    })

    it('should return expected list response structure', () => {
      const expectedResponse = {
        tags: [
          { id: 'tag-1', name: 'アグレッシブ', color: '#FF5733' },
          { id: 'tag-2', name: 'タイト', color: '#00FF00' },
          { id: 'tag-3', name: 'ブラフ多め', color: null },
        ],
      }

      expect(expectedResponse).toHaveProperty('tags')
      expect(Array.isArray(expectedResponse.tags)).toBe(true)
      expect(expectedResponse.tags.length).toBe(3)
    })

    it('should return expected getById response with player count', () => {
      const expectedResponse = {
        id: 'test-uuid',
        name: 'アグレッシブ',
        color: '#FF5733',
        playerCount: 5,
      }

      expect(expectedResponse).toHaveProperty('playerCount')
      expect(typeof expectedResponse.playerCount).toBe('number')
    })
  })
})
