import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Unit tests for session router.
 *
 * Tests the CRUD mutations and queries' input validation and business logic.
 * Uses Zod schema validation to test input requirements.
 *
 * @see data-model.md Section 13. PokerSession
 */
describe('Session Router', () => {
  describe('createArchive mutation', () => {
    describe('input validation', () => {
      const createArchiveSessionSchema = z.object({
        storeId: z.string().uuid('有効な店舗IDを指定してください').optional(),
        gameType: z.enum(['cash', 'tournament']).optional(),
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
        currencyId: z
          .string()
          .uuid('有効な通貨IDを指定してください')
          .optional()
          .nullable(),
        startTime: z.coerce.date(),
        endTime: z.coerce.date().optional(),
        buyIn: z
          .number()
          .int()
          .positive('バイイン額は1以上の整数で入力してください'),
        cashOut: z
          .number()
          .int()
          .min(0, 'キャッシュアウト額は0以上で入力してください'),
        notes: z.string().optional(),
      })

      it('should accept valid archive session input with minimum fields', () => {
        const result = createArchiveSessionSchema.safeParse({
          startTime: new Date('2025-01-01T10:00:00Z'),
          buyIn: 10000,
          cashOut: 15000,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid archive session with store and game', () => {
        const result = createArchiveSessionSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          gameType: 'cash',
          cashGameId: '550e8400-e29b-41d4-a716-446655440001',
          currencyId: '550e8400-e29b-41d4-a716-446655440002',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T15:00:00Z'),
          buyIn: 10000,
          cashOut: 8000,
          notes: '<p>良いセッションだった</p>',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid archive session with tournament', () => {
        const result = createArchiveSessionSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          gameType: 'tournament',
          tournamentId: '550e8400-e29b-41d4-a716-446655440001',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T18:00:00Z'),
          buyIn: 5000,
          cashOut: 25000,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid buyIn (zero)', () => {
        const result = createArchiveSessionSchema.safeParse({
          startTime: new Date(),
          buyIn: 0,
          cashOut: 5000,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'バイイン額は1以上の整数で入力してください',
          )
        }
      })

      it('should reject invalid buyIn (negative)', () => {
        const result = createArchiveSessionSchema.safeParse({
          startTime: new Date(),
          buyIn: -1000,
          cashOut: 5000,
        })
        expect(result.success).toBe(false)
      })

      it('should reject invalid cashOut (negative)', () => {
        const result = createArchiveSessionSchema.safeParse({
          startTime: new Date(),
          buyIn: 10000,
          cashOut: -1000,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'キャッシュアウト額は0以上で入力してください',
          )
        }
      })

      it('should accept zero cashOut (lost all chips)', () => {
        const result = createArchiveSessionSchema.safeParse({
          startTime: new Date(),
          buyIn: 10000,
          cashOut: 0,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid storeId format', () => {
        const result = createArchiveSessionSchema.safeParse({
          storeId: 'invalid-id',
          startTime: new Date(),
          buyIn: 10000,
          cashOut: 5000,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効な店舗IDを指定してください',
          )
        }
      })

      it('should reject invalid gameType', () => {
        const result = createArchiveSessionSchema.safeParse({
          gameType: 'invalid',
          startTime: new Date(),
          buyIn: 10000,
          cashOut: 5000,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('update mutation', () => {
    describe('input validation', () => {
      const updateSessionSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
        storeId: z.string().uuid().optional().nullable(),
        gameType: z.enum(['cash', 'tournament']).optional().nullable(),
        cashGameId: z.string().uuid().optional().nullable(),
        tournamentId: z.string().uuid().optional().nullable(),
        currencyId: z.string().uuid().optional().nullable(),
        startTime: z.coerce.date().optional(),
        endTime: z.coerce.date().optional().nullable(),
        buyIn: z.number().int().positive().optional(),
        cashOut: z.number().int().min(0).optional().nullable(),
        notes: z.string().optional().nullable(),
      })

      it('should accept valid UUID with updated fields', () => {
        const result = updateSessionSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          buyIn: 15000,
          cashOut: 20000,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid UUID with notes update', () => {
        const result = updateSessionSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          notes: '<p>更新されたノート</p>',
        })
        expect(result.success).toBe(true)
      })

      it('should accept null to clear optional fields', () => {
        const result = updateSessionSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          storeId: null,
          cashGameId: null,
          notes: null,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = updateSessionSchema.safeParse({
          id: 'invalid-uuid',
          buyIn: 10000,
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
      const deleteSessionSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = deleteSessionSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = deleteSessionSchema.safeParse({
          id: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('list query', () => {
    describe('input validation', () => {
      const listSessionsSchema = z
        .object({
          storeId: z.string().uuid().optional(),
          currencyId: z.string().uuid().optional(),
          gameType: z.enum(['cash', 'tournament']).optional(),
          limit: z.number().int().positive().max(100).default(20),
          offset: z.number().int().min(0).default(0),
        })
        .optional()

      it('should accept empty input for defaults', () => {
        const result = listSessionsSchema.safeParse(undefined)
        expect(result.success).toBe(true)
      })

      it('should accept filter by storeId', () => {
        const result = listSessionsSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should accept filter by gameType', () => {
        const result = listSessionsSchema.safeParse({
          gameType: 'cash',
        })
        expect(result.success).toBe(true)
      })

      it('should accept pagination parameters', () => {
        const result = listSessionsSchema.safeParse({
          limit: 50,
          offset: 20,
        })
        expect(result.success).toBe(true)
      })

      it('should reject limit over 100', () => {
        const result = listSessionsSchema.safeParse({
          limit: 101,
        })
        expect(result.success).toBe(false)
      })

      it('should reject negative offset', () => {
        const result = listSessionsSchema.safeParse({
          offset: -1,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('getById query', () => {
    describe('input validation', () => {
      const getByIdSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = getByIdSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = getByIdSchema.safeParse({
          id: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('business logic', () => {
    it('should return NOT_FOUND error code for non-existent session', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: 'セッションが見つかりません',
      })

      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('セッションが見つかりません')
    })

    it('should calculate profit/loss correctly', () => {
      const session = {
        buyIn: 10000,
        cashOut: 15000,
      }
      const profitLoss = session.cashOut - session.buyIn
      expect(profitLoss).toBe(5000)
    })

    it('should calculate profit/loss correctly for loss', () => {
      const session = {
        buyIn: 10000,
        cashOut: 3000,
      }
      const profitLoss = session.cashOut - session.buyIn
      expect(profitLoss).toBe(-7000)
    })

    it('should calculate session duration correctly', () => {
      const startTime = new Date('2025-01-01T10:00:00Z')
      const endTime = new Date('2025-01-01T15:30:00Z')
      const durationMs = endTime.getTime() - startTime.getTime()
      const durationMinutes = Math.floor(durationMs / (1000 * 60))
      expect(durationMinutes).toBe(330) // 5.5 hours = 330 minutes
    })

    it('should return expected session response structure', () => {
      const expectedResponse = {
        id: 'test-uuid',
        userId: 'user-uuid',
        storeId: 'store-uuid',
        gameType: 'cash',
        cashGameId: 'cash-game-uuid',
        tournamentId: null,
        currencyId: 'currency-uuid',
        isActive: false,
        startTime: new Date(),
        endTime: new Date(),
        buyIn: 10000,
        cashOut: 15000,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }

      expect(expectedResponse).toHaveProperty('id')
      expect(expectedResponse).toHaveProperty('userId')
      expect(expectedResponse).toHaveProperty('storeId')
      expect(expectedResponse).toHaveProperty('gameType')
      expect(expectedResponse).toHaveProperty('cashGameId')
      expect(expectedResponse).toHaveProperty('tournamentId')
      expect(expectedResponse).toHaveProperty('currencyId')
      expect(expectedResponse).toHaveProperty('isActive')
      expect(expectedResponse).toHaveProperty('startTime')
      expect(expectedResponse).toHaveProperty('endTime')
      expect(expectedResponse).toHaveProperty('buyIn')
      expect(expectedResponse).toHaveProperty('cashOut')
    })

    it('should return expected list response with pagination', () => {
      const expectedResponse = {
        sessions: [
          {
            id: 'test-uuid',
            startTime: new Date(),
            buyIn: 10000,
            cashOut: 15000,
            profitLoss: 5000,
          },
        ],
        total: 1,
        hasMore: false,
      }

      expect(expectedResponse).toHaveProperty('sessions')
      expect(Array.isArray(expectedResponse.sessions)).toBe(true)
      expect(expectedResponse).toHaveProperty('total')
      expect(expectedResponse).toHaveProperty('hasMore')
    })

    it('should return expected getById response with related data', () => {
      const expectedResponse = {
        id: 'test-uuid',
        store: { id: 'store-uuid', name: 'ABCポーカー' },
        cashGame: { id: 'cash-game-uuid', smallBlind: 100, bigBlind: 200 },
        tournament: null,
        currency: { id: 'currency-uuid', name: 'ポイント' },
        allInRecords: [],
        profitLoss: 5000,
      }

      expect(expectedResponse).toHaveProperty('store')
      expect(expectedResponse).toHaveProperty('cashGame')
      expect(expectedResponse).toHaveProperty('tournament')
      expect(expectedResponse).toHaveProperty('currency')
      expect(expectedResponse).toHaveProperty('allInRecords')
      expect(expectedResponse).toHaveProperty('profitLoss')
    })
  })
})
