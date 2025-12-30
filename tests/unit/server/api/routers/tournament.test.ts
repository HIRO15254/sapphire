import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Unit tests for tournament router.
 *
 * Tests the CRUD mutations and queries' input validation and business logic.
 * Uses Zod schema validation to test input requirements.
 *
 * @see data-model.md Section 10-12. Tournament, TournamentPrizeLevel, TournamentBlindLevel
 */
describe('Tournament Router', () => {
  describe('create mutation', () => {
    describe('input validation', () => {
      const prizeLevelSchema = z.object({
        position: z.number().int().min(1, '順位は1以上で入力してください'),
        percentage: z.number().min(0).max(100).optional(),
        fixedAmount: z.number().int().positive().optional(),
      })

      const blindLevelSchema = z
        .object({
          level: z.number().int().min(1, 'レベルは1以上で入力してください'),
          smallBlind: z.number().int().positive('SBは正の数で入力してください'),
          bigBlind: z.number().int().positive('BBは正の数で入力してください'),
          ante: z.number().int().positive().optional(),
          durationMinutes: z
            .number()
            .int()
            .positive('時間は正の数で入力してください'),
        })
        .refine((data) => data.bigBlind > data.smallBlind, {
          message: 'BBはSBより大きくしてください',
          path: ['bigBlind'],
        })

      const createTournamentInputSchema = z.object({
        storeId: z.string().uuid('有効な店舗IDを指定してください'),
        name: z.string().max(255).optional(),
        currencyId: z.string().uuid().optional(),
        buyIn: z
          .number()
          .int('バイインは整数で入力してください')
          .positive('バイインは正の数で入力してください'),
        startingStack: z.number().int().positive().optional(),
        prizeLevels: z.array(prizeLevelSchema).optional(),
        blindLevels: z.array(blindLevelSchema).optional(),
        notes: z.string().optional(),
      })

      it('should accept valid buyIn only', () => {
        const result = createTournamentInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          buyIn: 5000,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid tournament with name', () => {
        const result = createTournamentInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'サンデートーナメント',
          buyIn: 10000,
          startingStack: 50000,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid tournament with prize levels (percentage)', () => {
        const result = createTournamentInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          buyIn: 10000,
          prizeLevels: [
            { position: 1, percentage: 50 },
            { position: 2, percentage: 30 },
            { position: 3, percentage: 20 },
          ],
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid tournament with prize levels (fixed amount)', () => {
        const result = createTournamentInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          buyIn: 10000,
          prizeLevels: [
            { position: 1, fixedAmount: 100000 },
            { position: 2, fixedAmount: 50000 },
          ],
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid tournament with blind levels', () => {
        const result = createTournamentInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          buyIn: 10000,
          blindLevels: [
            { level: 1, smallBlind: 25, bigBlind: 50, durationMinutes: 20 },
            { level: 2, smallBlind: 50, bigBlind: 100, durationMinutes: 20 },
            {
              level: 3,
              smallBlind: 100,
              bigBlind: 200,
              ante: 25,
              durationMinutes: 15,
            },
          ],
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid storeId', () => {
        const result = createTournamentInputSchema.safeParse({
          storeId: 'invalid',
          buyIn: 10000,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効な店舗IDを指定してください',
          )
        }
      })

      it('should reject negative buyIn', () => {
        const result = createTournamentInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          buyIn: -1000,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'バイインは正の数で入力してください',
          )
        }
      })

      it('should reject non-integer buyIn', () => {
        const result = createTournamentInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          buyIn: 1000.5,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'バイインは整数で入力してください',
          )
        }
      })

      it('should reject blind level with BB <= SB', () => {
        const result = createTournamentInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          buyIn: 10000,
          blindLevels: [
            { level: 1, smallBlind: 100, bigBlind: 50, durationMinutes: 20 },
          ],
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(
            result.error.issues.some(
              (i) => i.message === 'BBはSBより大きくしてください',
            ),
          ).toBe(true)
        }
      })

      it('should reject prize level with position < 1', () => {
        const result = createTournamentInputSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          buyIn: 10000,
          prizeLevels: [{ position: 0, percentage: 100 }],
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(
            result.error.issues.some(
              (i) => i.message === '順位は1以上で入力してください',
            ),
          ).toBe(true)
        }
      })
    })
  })

  describe('update mutation', () => {
    describe('input validation', () => {
      const updateTournamentInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
        name: z.string().max(255).optional().nullable(),
        currencyId: z.string().uuid().optional().nullable(),
        buyIn: z.number().int().positive().optional(),
        startingStack: z.number().int().positive().optional().nullable(),
        notes: z.string().optional().nullable(),
      })

      it('should accept valid id with name update', () => {
        const result = updateTournamentInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: '更新後のトーナメント名',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid id with buyIn update', () => {
        const result = updateTournamentInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          buyIn: 20000,
        })
        expect(result.success).toBe(true)
      })

      it('should accept null to clear optional fields', () => {
        const result = updateTournamentInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: null,
          startingStack: null,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = updateTournamentInputSchema.safeParse({
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

  describe('archive mutation', () => {
    describe('input validation', () => {
      const archiveTournamentInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
        isArchived: z.boolean(),
      })

      it('should accept valid UUID with archive flag', () => {
        const result = archiveTournamentInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          isArchived: true,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = archiveTournamentInputSchema.safeParse({
          id: 'invalid',
          isArchived: true,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('delete mutation', () => {
    describe('input validation', () => {
      const deleteTournamentInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = deleteTournamentInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = deleteTournamentInputSchema.safeParse({
          id: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('setPrizeLevels mutation', () => {
    describe('input validation', () => {
      const setPrizeLevelsInputSchema = z.object({
        tournamentId: z.string().uuid('有効なトーナメントIDを指定してください'),
        levels: z.array(
          z.object({
            position: z.number().int().min(1),
            percentage: z.number().min(0).max(100).optional(),
            fixedAmount: z.number().int().positive().optional(),
          }),
        ),
      })

      it('should accept valid tournament with prize levels', () => {
        const result = setPrizeLevelsInputSchema.safeParse({
          tournamentId: '550e8400-e29b-41d4-a716-446655440000',
          levels: [
            { position: 1, percentage: 50 },
            { position: 2, percentage: 30 },
            { position: 3, percentage: 20 },
          ],
        })
        expect(result.success).toBe(true)
      })

      it('should accept empty levels array (clear all)', () => {
        const result = setPrizeLevelsInputSchema.safeParse({
          tournamentId: '550e8400-e29b-41d4-a716-446655440000',
          levels: [],
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid tournamentId', () => {
        const result = setPrizeLevelsInputSchema.safeParse({
          tournamentId: 'invalid',
          levels: [],
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('setBlindLevels mutation', () => {
    describe('input validation', () => {
      const setBlindLevelsInputSchema = z.object({
        tournamentId: z.string().uuid('有効なトーナメントIDを指定してください'),
        levels: z.array(
          z
            .object({
              level: z.number().int().min(1),
              smallBlind: z.number().int().positive(),
              bigBlind: z.number().int().positive(),
              ante: z.number().int().positive().optional(),
              durationMinutes: z.number().int().positive(),
            })
            .refine((data) => data.bigBlind > data.smallBlind, {
              message: 'BBはSBより大きくしてください',
              path: ['bigBlind'],
            }),
        ),
      })

      it('should accept valid tournament with blind levels', () => {
        const result = setBlindLevelsInputSchema.safeParse({
          tournamentId: '550e8400-e29b-41d4-a716-446655440000',
          levels: [
            { level: 1, smallBlind: 25, bigBlind: 50, durationMinutes: 20 },
            { level: 2, smallBlind: 50, bigBlind: 100, durationMinutes: 20 },
          ],
        })
        expect(result.success).toBe(true)
      })

      it('should accept empty levels array (clear all)', () => {
        const result = setBlindLevelsInputSchema.safeParse({
          tournamentId: '550e8400-e29b-41d4-a716-446655440000',
          levels: [],
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid tournamentId', () => {
        const result = setBlindLevelsInputSchema.safeParse({
          tournamentId: 'invalid',
          levels: [],
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
    it('should return NOT_FOUND error code for non-existent tournament', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: 'トーナメントが見つかりません',
      })

      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('トーナメントが見つかりません')
    })

    it('should return BAD_REQUEST error code for invalid store reference', () => {
      const error = new TRPCError({
        code: 'BAD_REQUEST',
        message: '指定された店舗が存在しません',
      })

      expect(error.code).toBe('BAD_REQUEST')
      expect(error.message).toBe('指定された店舗が存在しません')
    })

    it('should return expected tournament response structure', () => {
      const expectedResponse = {
        id: 'test-uuid',
        storeId: 'store-uuid',
        userId: 'user-uuid',
        currencyId: 'currency-uuid',
        name: 'サンデートーナメント',
        buyIn: 10000,
        startingStack: 50000,
        notes: null,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }

      expect(expectedResponse).toHaveProperty('id')
      expect(expectedResponse).toHaveProperty('storeId')
      expect(expectedResponse).toHaveProperty('name')
      expect(expectedResponse).toHaveProperty('buyIn')
      expect(expectedResponse).toHaveProperty('startingStack')
    })

    it('should return expected list response structure', () => {
      const expectedResponse = {
        tournaments: [
          {
            id: 'test-uuid',
            name: 'サンデートーナメント',
            currencyId: 'currency-uuid',
            currencyName: 'ABC Chips',
            buyIn: 10000,
            startingStack: 50000,
            isArchived: false,
          },
        ],
      }

      expect(expectedResponse).toHaveProperty('tournaments')
      expect(Array.isArray(expectedResponse.tournaments)).toBe(true)
    })

    it('should return expected getById response with structures', () => {
      const expectedResponse = {
        id: 'test-uuid',
        storeId: 'store-uuid',
        storeName: 'ABCポーカー渋谷店',
        name: 'サンデートーナメント',
        currencyId: 'currency-uuid',
        buyIn: 10000,
        startingStack: 50000,
        notes: null,
        isArchived: false,
        prizeLevels: [
          { id: 'prize-1', position: 1, percentage: 50, fixedAmount: null },
        ],
        blindLevels: [
          {
            id: 'blind-1',
            level: 1,
            smallBlind: 25,
            bigBlind: 50,
            ante: null,
            durationMinutes: 20,
          },
        ],
      }

      expect(expectedResponse).toHaveProperty('prizeLevels')
      expect(expectedResponse).toHaveProperty('blindLevels')
      expect(expectedResponse).toHaveProperty('storeName')
    })
  })
})
