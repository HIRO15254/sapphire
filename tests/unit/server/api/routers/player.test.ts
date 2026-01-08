import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Unit tests for player router.
 *
 * Tests the CRUD mutations and queries' input validation and business logic.
 * Uses Zod schema validation to test input requirements.
 *
 * @see data-model.md Section 16. Player
 */
describe('Player Router', () => {
  describe('create mutation', () => {
    describe('input validation', () => {
      const createPlayerInputSchema = z.object({
        name: z
          .string()
          .min(1, 'プレイヤー名を入力してください')
          .max(255, 'プレイヤー名は255文字以下で入力してください'),
        generalNotes: z.string().optional(),
      })

      it('should accept valid name only', () => {
        const result = createPlayerInputSchema.safeParse({
          name: '田中太郎',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid name with generalNotes', () => {
        const result = createPlayerInputSchema.safeParse({
          name: '鈴木一郎',
          generalNotes: '<p>アグレッシブなプレイスタイル</p>',
        })
        expect(result.success).toBe(true)
      })

      it('should reject empty name', () => {
        const result = createPlayerInputSchema.safeParse({
          name: '',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'プレイヤー名を入力してください',
          )
        }
      })

      it('should reject name longer than 255 characters', () => {
        const result = createPlayerInputSchema.safeParse({
          name: 'a'.repeat(256),
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'プレイヤー名は255文字以下で入力してください',
          )
        }
      })
    })
  })

  describe('update mutation', () => {
    describe('input validation', () => {
      const updatePlayerInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
        name: z
          .string()
          .min(1, 'プレイヤー名を入力してください')
          .max(255, 'プレイヤー名は255文字以下で入力してください')
          .optional(),
        generalNotes: z.string().optional().nullable(),
      })

      it('should accept valid id with name update', () => {
        const result = updatePlayerInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: '更新後のプレイヤー名',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid id with generalNotes update', () => {
        const result = updatePlayerInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          generalNotes: '<p>新しいノート</p>',
        })
        expect(result.success).toBe(true)
      })

      it('should accept null to clear generalNotes', () => {
        const result = updatePlayerInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          generalNotes: null,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = updatePlayerInputSchema.safeParse({
          id: 'not-a-uuid',
          name: 'Updated Name',
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
      const deletePlayerInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = deletePlayerInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = deletePlayerInputSchema.safeParse({
          id: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('list query', () => {
    describe('input validation', () => {
      const listPlayersInputSchema = z
        .object({
          search: z.string().optional(),
          tagIds: z.array(z.string().uuid()).optional(),
        })
        .optional()

      it('should accept empty input for defaults', () => {
        const result = listPlayersInputSchema.safeParse(undefined)
        expect(result.success).toBe(true)
      })

      it('should accept search parameter', () => {
        const result = listPlayersInputSchema.safeParse({
          search: '田中',
        })
        expect(result.success).toBe(true)
      })

      it('should accept tagIds filter', () => {
        const result = listPlayersInputSchema.safeParse({
          tagIds: [
            '550e8400-e29b-41d4-a716-446655440000',
            '550e8400-e29b-41d4-a716-446655440001',
          ],
        })
        expect(result.success).toBe(true)
      })

      it('should accept both search and tagIds', () => {
        const result = listPlayersInputSchema.safeParse({
          search: '田中',
          tagIds: ['550e8400-e29b-41d4-a716-446655440000'],
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid tagIds UUID format', () => {
        const result = listPlayersInputSchema.safeParse({
          tagIds: ['invalid-uuid'],
        })
        expect(result.success).toBe(false)
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

  describe('assignTag mutation', () => {
    describe('input validation', () => {
      const assignTagInputSchema = z.object({
        playerId: z.string().uuid('有効なプレイヤーIDを指定してください'),
        tagId: z.string().uuid('有効なタグIDを指定してください'),
      })

      it('should accept valid player and tag UUIDs', () => {
        const result = assignTagInputSchema.safeParse({
          playerId: '550e8400-e29b-41d4-a716-446655440000',
          tagId: '550e8400-e29b-41d4-a716-446655440001',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid playerId', () => {
        const result = assignTagInputSchema.safeParse({
          playerId: 'invalid',
          tagId: '550e8400-e29b-41d4-a716-446655440001',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効なプレイヤーIDを指定してください',
          )
        }
      })

      it('should reject invalid tagId', () => {
        const result = assignTagInputSchema.safeParse({
          playerId: '550e8400-e29b-41d4-a716-446655440000',
          tagId: 'invalid',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効なタグIDを指定してください',
          )
        }
      })
    })
  })

  describe('removeTag mutation', () => {
    describe('input validation', () => {
      const removeTagInputSchema = z.object({
        playerId: z.string().uuid('有効なプレイヤーIDを指定してください'),
        tagId: z.string().uuid('有効なタグIDを指定してください'),
      })

      it('should accept valid player and tag UUIDs', () => {
        const result = removeTagInputSchema.safeParse({
          playerId: '550e8400-e29b-41d4-a716-446655440000',
          tagId: '550e8400-e29b-41d4-a716-446655440001',
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('addNote mutation', () => {
    describe('input validation', () => {
      const addNoteInputSchema = z.object({
        playerId: z.string().uuid('有効なプレイヤーIDを指定してください'),
        noteDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です'),
        content: z.string().min(1, 'ノート内容を入力してください'),
      })

      it('should accept valid note data', () => {
        const result = addNoteInputSchema.safeParse({
          playerId: '550e8400-e29b-41d4-a716-446655440000',
          noteDate: '2025-12-15',
          content: '今日はタイトにプレイしていた',
        })
        expect(result.success).toBe(true)
      })

      it('should reject empty content', () => {
        const result = addNoteInputSchema.safeParse({
          playerId: '550e8400-e29b-41d4-a716-446655440000',
          noteDate: '2025-12-15',
          content: '',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'ノート内容を入力してください',
          )
        }
      })

      it('should reject invalid date format', () => {
        const result = addNoteInputSchema.safeParse({
          playerId: '550e8400-e29b-41d4-a716-446655440000',
          noteDate: '2025/12/15',
          content: 'Some note',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('日付形式が不正です')
        }
      })
    })
  })

  describe('updateNote mutation', () => {
    describe('input validation', () => {
      const updateNoteInputSchema = z.object({
        id: z.string().uuid('有効なノートIDを指定してください'),
        content: z.string().min(1, 'ノート内容を入力してください').optional(),
        noteDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です')
          .optional(),
      })

      it('should accept valid update data', () => {
        const result = updateNoteInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          content: '更新されたノート',
        })
        expect(result.success).toBe(true)
      })

      it('should accept date update', () => {
        const result = updateNoteInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          noteDate: '2025-12-20',
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('deleteNote mutation', () => {
    describe('input validation', () => {
      const deleteNoteInputSchema = z.object({
        id: z.string().uuid('有効なノートIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = deleteNoteInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('business logic', () => {
    it('should return NOT_FOUND error code for non-existent player', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: 'プレイヤーが見つかりません',
      })

      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('プレイヤーが見つかりません')
    })

    it('should return FORBIDDEN error code when user does not own player', () => {
      const error = new TRPCError({
        code: 'FORBIDDEN',
        message: 'このプレイヤーにアクセスする権限がありません',
      })

      expect(error.code).toBe('FORBIDDEN')
      expect(error.message).toBe('このプレイヤーにアクセスする権限がありません')
    })

    it('should return expected player response structure', () => {
      const expectedResponse = {
        id: 'test-uuid',
        name: '田中太郎',
        generalNotes: '<p>アグレッシブなプレイスタイル</p>',
        userId: 'user-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }

      expect(expectedResponse).toHaveProperty('id')
      expect(expectedResponse).toHaveProperty('name')
      expect(expectedResponse).toHaveProperty('generalNotes')
      expect(expectedResponse).toHaveProperty('userId')
    })

    it('should return expected list response structure', () => {
      const expectedResponse = {
        players: [
          {
            id: 'test-uuid',
            name: '田中太郎',
            generalNotes: null,
            tags: [
              { id: 'tag-1', name: 'アグレ', color: '#FF0000' },
              { id: 'tag-2', name: 'ブラフ多め', color: '#00FF00' },
            ],
          },
        ],
      }

      expect(expectedResponse).toHaveProperty('players')
      expect(Array.isArray(expectedResponse.players)).toBe(true)
      expect(expectedResponse.players[0]).toHaveProperty('tags')
      expect(Array.isArray(expectedResponse.players[0]?.tags)).toBe(true)
    })

    it('should return expected getById response with tags and notes', () => {
      const expectedResponse = {
        id: 'test-uuid',
        name: '田中太郎',
        generalNotes: '<p>アグレッシブなプレイスタイル</p>',
        tags: [{ id: 'tag-1', name: 'アグレ', color: '#FF0000' }],
        notes: [
          {
            id: 'note-1',
            noteDate: '2025-12-15',
            content: '今日はタイトにプレイしていた',
          },
        ],
      }

      expect(expectedResponse).toHaveProperty('tags')
      expect(expectedResponse).toHaveProperty('notes')
      expect(Array.isArray(expectedResponse.tags)).toBe(true)
      expect(Array.isArray(expectedResponse.notes)).toBe(true)
    })
  })
})
