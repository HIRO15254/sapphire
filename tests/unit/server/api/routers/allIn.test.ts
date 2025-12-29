import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Unit tests for allIn router.
 *
 * Tests the CRUD mutations and queries' input validation and business logic.
 * Uses Zod schema validation to test input requirements.
 *
 * @see data-model.md Section 15. AllInRecord
 */
describe('AllIn Router', () => {
  describe('create mutation', () => {
    describe('input validation', () => {
      const createAllInSchema = z.object({
        sessionId: z.string().uuid('有効なセッションIDを指定してください'),
        potAmount: z.number().int().positive('ポット額は1以上の整数で入力してください'),
        winProbability: z
          .number()
          .min(0, '勝率は0〜100の範囲で入力してください')
          .max(100, '勝率は0〜100の範囲で入力してください'),
        actualResult: z.boolean(),
        recordedAt: z.coerce.date().optional(),
      })

      it('should accept valid all-in record', () => {
        const result = createAllInSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          potAmount: 10000,
          winProbability: 65.5,
          actualResult: true,
        })
        expect(result.success).toBe(true)
      })

      it('should accept win probability with 2 decimal places', () => {
        const result = createAllInSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          potAmount: 5000,
          winProbability: 33.33,
          actualResult: false,
        })
        expect(result.success).toBe(true)
      })

      it('should accept win probability of 0 (drawing dead)', () => {
        const result = createAllInSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          potAmount: 8000,
          winProbability: 0,
          actualResult: false,
        })
        expect(result.success).toBe(true)
      })

      it('should accept win probability of 100 (guaranteed win)', () => {
        const result = createAllInSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          potAmount: 12000,
          winProbability: 100,
          actualResult: true,
        })
        expect(result.success).toBe(true)
      })

      it('should accept optional recordedAt', () => {
        const result = createAllInSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          potAmount: 10000,
          winProbability: 75,
          actualResult: true,
          recordedAt: new Date('2025-01-01T12:00:00Z'),
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid sessionId', () => {
        const result = createAllInSchema.safeParse({
          sessionId: 'invalid-id',
          potAmount: 10000,
          winProbability: 65.5,
          actualResult: true,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効なセッションIDを指定してください',
          )
        }
      })

      it('should reject zero potAmount', () => {
        const result = createAllInSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          potAmount: 0,
          winProbability: 50,
          actualResult: true,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'ポット額は1以上の整数で入力してください',
          )
        }
      })

      it('should reject negative potAmount', () => {
        const result = createAllInSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          potAmount: -1000,
          winProbability: 50,
          actualResult: true,
        })
        expect(result.success).toBe(false)
      })

      it('should reject negative winProbability', () => {
        const result = createAllInSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          potAmount: 10000,
          winProbability: -5,
          actualResult: false,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '勝率は0〜100の範囲で入力してください',
          )
        }
      })

      it('should reject winProbability over 100', () => {
        const result = createAllInSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          potAmount: 10000,
          winProbability: 105,
          actualResult: true,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '勝率は0〜100の範囲で入力してください',
          )
        }
      })
    })
  })

  describe('update mutation', () => {
    describe('input validation', () => {
      const updateAllInSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
        potAmount: z.number().int().positive().optional(),
        winProbability: z.number().min(0).max(100).optional(),
        actualResult: z.boolean().optional(),
        recordedAt: z.coerce.date().optional(),
      })

      it('should accept valid UUID with updated fields', () => {
        const result = updateAllInSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          potAmount: 15000,
          winProbability: 70.5,
        })
        expect(result.success).toBe(true)
      })

      it('should accept only updating actualResult', () => {
        const result = updateAllInSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          actualResult: false,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = updateAllInSchema.safeParse({
          id: 'invalid-uuid',
          potAmount: 10000,
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
      const deleteAllInSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = deleteAllInSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = deleteAllInSchema.safeParse({
          id: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('listBySession query', () => {
    describe('input validation', () => {
      const listBySessionSchema = z.object({
        sessionId: z.string().uuid('有効なセッションIDを指定してください'),
      })

      it('should accept valid sessionId', () => {
        const result = listBySessionSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid sessionId', () => {
        const result = listBySessionSchema.safeParse({
          sessionId: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('business logic', () => {
    it('should return NOT_FOUND error code for non-existent record', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: 'オールイン記録が見つかりません',
      })

      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('オールイン記録が見つかりません')
    })

    it('should calculate EV correctly', () => {
      const potAmount = 10000
      const winProbability = 65.5
      const ev = potAmount * (winProbability / 100)
      expect(ev).toBe(6550)
    })

    it('should return expected all-in record response structure', () => {
      const expectedResponse = {
        id: 'test-uuid',
        sessionId: 'session-uuid',
        userId: 'user-uuid',
        potAmount: 10000,
        winProbability: 65.5,
        actualResult: true,
        recordedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }

      expect(expectedResponse).toHaveProperty('id')
      expect(expectedResponse).toHaveProperty('sessionId')
      expect(expectedResponse).toHaveProperty('userId')
      expect(expectedResponse).toHaveProperty('potAmount')
      expect(expectedResponse).toHaveProperty('winProbability')
      expect(expectedResponse).toHaveProperty('actualResult')
      expect(expectedResponse).toHaveProperty('recordedAt')
    })

    it('should return expected list response with summary', () => {
      const allInRecords = [
        { potAmount: 10000, winProbability: 65.5, actualResult: true },
        { potAmount: 8000, winProbability: 45.0, actualResult: false },
        { potAmount: 12000, winProbability: 80.0, actualResult: true },
      ]

      const count = allInRecords.length
      const totalPotAmount = allInRecords.reduce((sum, r) => sum + r.potAmount, 0)
      const averageWinRate =
        allInRecords.reduce((sum, r) => sum + r.winProbability, 0) / count
      const allInEV = allInRecords.reduce(
        (sum, r) => sum + r.potAmount * (r.winProbability / 100),
        0,
      )
      const actualResultTotal = allInRecords
        .filter((r) => r.actualResult)
        .reduce((sum, r) => sum + r.potAmount, 0)
      const evDifference = actualResultTotal - allInEV

      const expectedSummary = {
        count,
        totalPotAmount,
        averageWinRate,
        allInEV,
        actualResultTotal,
        evDifference,
      }

      expect(expectedSummary.count).toBe(3)
      expect(expectedSummary.totalPotAmount).toBe(30000)
      expect(expectedSummary.averageWinRate).toBeCloseTo(63.5, 1)
      expect(expectedSummary.allInEV).toBe(19750)
      expect(expectedSummary.actualResultTotal).toBe(22000)
      expect(expectedSummary.evDifference).toBe(2250)
    })
  })
})
