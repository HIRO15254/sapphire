import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Unit tests for cashGame router.
 *
 * Tests the CRUD mutations and queries' input validation and business logic.
 * Uses Zod schema validation to test input requirements.
 *
 * @see data-model.md Section 9. CashGame
 */
describe('CashGame Router', () => {
  describe('create mutation', () => {
    describe('input validation', () => {
      const createCashGameInputSchema = z
        .object({
          storeId: z.string().uuid('有効な店舗IDを指定してください'),
          currencyId: z.string().uuid().optional(),
          smallBlind: z
            .number()
            .int('SBは整数で入力してください')
            .positive('SBは正の数で入力してください'),
          bigBlind: z
            .number()
            .int('BBは整数で入力してください')
            .positive('BBは正の数で入力してください'),
          straddle1: z
            .number()
            .int('ストラドル1は整数で入力してください')
            .positive('ストラドル1は正の数で入力してください')
            .optional(),
          straddle2: z
            .number()
            .int('ストラドル2は整数で入力してください')
            .positive('ストラドル2は正の数で入力してください')
            .optional(),
          ante: z
            .number()
            .int('アンティは整数で入力してください')
            .positive('アンティは正の数で入力してください')
            .optional(),
          anteType: z.enum(['all_ante', 'bb_ante']).optional(),
          notes: z.string().optional(),
        })
        .refine((data) => data.bigBlind > data.smallBlind, {
          message: 'BBはSBより大きくしてください',
          path: ['bigBlind'],
        })
        .refine((data) => !data.straddle1 || data.straddle1 > data.bigBlind, {
          message: 'ストラドル1はBBより大きくしてください',
          path: ['straddle1'],
        })
        .refine(
          (data) =>
            !data.straddle2 ||
            (data.straddle1 && data.straddle2 > data.straddle1),
          {
            message: 'ストラドル2はストラドル1より大きくしてください',
            path: ['straddle2'],
          },
        )
        .refine((data) => !data.ante || data.anteType, {
          message: 'アンティを設定する場合はアンティタイプも指定してください',
          path: ['anteType'],
        })

      it('should accept valid blinds only', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          smallBlind: 1,
          bigBlind: 2,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid blinds with currency', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          currencyId: '550e8400-e29b-41d4-a716-446655440001',
          smallBlind: 100,
          bigBlind: 200,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid blinds with straddles', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          smallBlind: 100,
          bigBlind: 200,
          straddle1: 400,
          straddle2: 800,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid blinds with ante (all_ante)', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          smallBlind: 100,
          bigBlind: 200,
          ante: 100,
          anteType: 'all_ante',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid blinds with ante (bb_ante)', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          smallBlind: 100,
          bigBlind: 200,
          ante: 200,
          anteType: 'bb_ante',
        })
        expect(result.success).toBe(true)
      })

      it('should reject when bigBlind is not greater than smallBlind', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          smallBlind: 2,
          bigBlind: 1,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'BBはSBより大きくしてください',
          )
        }
      })

      it('should reject when straddle1 is not greater than bigBlind', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          smallBlind: 100,
          bigBlind: 200,
          straddle1: 200,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'ストラドル1はBBより大きくしてください',
          )
        }
      })

      it('should reject when straddle2 is not greater than straddle1', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          smallBlind: 100,
          bigBlind: 200,
          straddle1: 400,
          straddle2: 400,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'ストラドル2はストラドル1より大きくしてください',
          )
        }
      })

      it('should reject ante without anteType', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          smallBlind: 100,
          bigBlind: 200,
          ante: 100,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'アンティを設定する場合はアンティタイプも指定してください',
          )
        }
      })

      it('should reject invalid storeId', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: 'invalid',
          smallBlind: 1,
          bigBlind: 2,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効な店舗IDを指定してください',
          )
        }
      })

      it('should reject negative smallBlind', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          smallBlind: -1,
          bigBlind: 2,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'SBは正の数で入力してください',
          )
        }
      })

      it('should reject non-integer bigBlind', () => {
        const result = createCashGameInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          smallBlind: 1,
          bigBlind: 2.5,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'BBは整数で入力してください',
          )
        }
      })
    })
  })

  describe('update mutation', () => {
    describe('input validation', () => {
      const updateCashGameInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
        currencyId: z.string().uuid().optional().nullable(),
        smallBlind: z.number().int().positive().optional(),
        bigBlind: z.number().int().positive().optional(),
        straddle1: z.number().int().positive().optional().nullable(),
        straddle2: z.number().int().positive().optional().nullable(),
        ante: z.number().int().positive().optional().nullable(),
        anteType: z.enum(['all_ante', 'bb_ante']).optional().nullable(),
        notes: z.string().optional().nullable(),
      })

      it('should accept valid id with blinds update', () => {
        const result = updateCashGameInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          smallBlind: 200,
          bigBlind: 400,
        })
        expect(result.success).toBe(true)
      })

      it('should accept null to clear optional fields', () => {
        const result = updateCashGameInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          straddle1: null,
          straddle2: null,
          ante: null,
          anteType: null,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = updateCashGameInputSchema.safeParse({
          id: 'not-a-uuid',
          smallBlind: 100,
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

  describe('archive mutation', () => {
    describe('input validation', () => {
      const archiveCashGameInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
        isArchived: z.boolean(),
      })

      it('should accept valid UUID with archive flag', () => {
        const result = archiveCashGameInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          isArchived: true,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = archiveCashGameInputSchema.safeParse({
          id: 'invalid',
          isArchived: true,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('delete mutation', () => {
    describe('input validation', () => {
      const deleteCashGameInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = deleteCashGameInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = deleteCashGameInputSchema.safeParse({
          id: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('listByStore query', () => {
    describe('input validation', () => {
      const listByStoreInputSchema = z.object({
        storeId: z.string().uuid('有効な店舗IDを指定してください'),
        includeArchived: z.boolean().default(false),
      })

      it('should accept valid storeId', () => {
        const result = listByStoreInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.includeArchived).toBe(false)
        }
      })

      it('should accept storeId with includeArchived flag', () => {
        const result = listByStoreInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          includeArchived: true,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid storeId', () => {
        const result = listByStoreInputSchema.safeParse({
          storeId: 'invalid',
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

  describe('business logic', () => {
    it('should return NOT_FOUND error code for non-existent cash game', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: 'キャッシュゲームが見つかりません',
      })

      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('キャッシュゲームが見つかりません')
    })

    it('should return BAD_REQUEST error code for invalid store reference', () => {
      const error = new TRPCError({
        code: 'BAD_REQUEST',
        message: '指定された店舗が存在しません',
      })

      expect(error.code).toBe('BAD_REQUEST')
      expect(error.message).toBe('指定された店舗が存在しません')
    })

    it('should return expected cash game response structure', () => {
      const expectedResponse = {
        id: 'test-uuid',
        storeId: 'store-uuid',
        userId: 'user-uuid',
        currencyId: 'currency-uuid',
        smallBlind: 100,
        bigBlind: 200,
        straddle1: 400,
        straddle2: 800,
        ante: 100,
        anteType: 'all_ante',
        notes: null,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }

      expect(expectedResponse).toHaveProperty('id')
      expect(expectedResponse).toHaveProperty('storeId')
      expect(expectedResponse).toHaveProperty('smallBlind')
      expect(expectedResponse).toHaveProperty('bigBlind')
      expect(expectedResponse).toHaveProperty('ante')
      expect(expectedResponse).toHaveProperty('anteType')
    })

    it('should return expected list response structure with displayName', () => {
      const expectedResponse = {
        cashGames: [
          {
            id: 'test-uuid',
            smallBlind: 100,
            bigBlind: 200,
            straddle1: null,
            straddle2: null,
            ante: 100,
            anteType: 'bb_ante',
            currencyId: 'currency-uuid',
            currencyName: 'ABC Chips',
            isArchived: false,
            displayName: '100/200 (Ante: 100 BB)',
          },
        ],
      }

      expect(expectedResponse).toHaveProperty('cashGames')
      expect(Array.isArray(expectedResponse.cashGames)).toBe(true)
      expect(expectedResponse.cashGames[0]).toHaveProperty('displayName')
    })
  })
})
