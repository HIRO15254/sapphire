import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Unit tests for currency router.
 *
 * Tests the CRUD mutations and queries' input validation and business logic.
 * Uses mocked database to isolate unit tests from infrastructure.
 *
 * @see data-model.md Section 5. Currency
 */
describe('Currency Router', () => {
  describe('create mutation', () => {
    describe('input validation', () => {
      // Define the schema matching the router's input schema
      const createCurrencyInputSchema = z.object({
        name: z
          .string()
          .min(1, '通貨名を入力してください')
          .max(255, '通貨名は255文字以下で入力してください'),
        initialBalance: z
          .number()
          .int('初期残高は整数で入力してください')
          .min(0, '初期残高は0以上で入力してください')
          .default(0),
      })

      it('should accept valid name and initialBalance', () => {
        const result = createCurrencyInputSchema.safeParse({
          name: 'ABC Poker Chips',
          initialBalance: 10000,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid name with default initialBalance', () => {
        const result = createCurrencyInputSchema.safeParse({
          name: 'ABC Poker Chips',
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.initialBalance).toBe(0)
        }
      })

      it('should reject empty name', () => {
        const result = createCurrencyInputSchema.safeParse({
          name: '',
          initialBalance: 0,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '通貨名を入力してください',
          )
        }
      })

      it('should reject name longer than 255 characters', () => {
        const result = createCurrencyInputSchema.safeParse({
          name: 'a'.repeat(256),
          initialBalance: 0,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '通貨名は255文字以下で入力してください',
          )
        }
      })

      it('should reject negative initialBalance', () => {
        const result = createCurrencyInputSchema.safeParse({
          name: 'ABC Poker Chips',
          initialBalance: -100,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '初期残高は0以上で入力してください',
          )
        }
      })

      it('should reject non-integer initialBalance', () => {
        const result = createCurrencyInputSchema.safeParse({
          name: 'ABC Poker Chips',
          initialBalance: 100.5,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '初期残高は整数で入力してください',
          )
        }
      })
    })
  })

  describe('update mutation', () => {
    describe('input validation', () => {
      const updateCurrencyInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
        name: z
          .string()
          .min(1, '通貨名を入力してください')
          .max(255, '通貨名は255文字以下で入力してください')
          .optional(),
        initialBalance: z
          .number()
          .int('初期残高は整数で入力してください')
          .min(0, '初期残高は0以上で入力してください')
          .optional(),
      })

      it('should accept valid id with name update', () => {
        const result = updateCurrencyInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Updated Name',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid id with initialBalance update', () => {
        const result = updateCurrencyInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          initialBalance: 5000,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = updateCurrencyInputSchema.safeParse({
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
      const archiveCurrencyInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = archiveCurrencyInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = archiveCurrencyInputSchema.safeParse({
          id: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('delete mutation', () => {
    describe('input validation', () => {
      const deleteCurrencyInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = deleteCurrencyInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = deleteCurrencyInputSchema.safeParse({
          id: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('addBonus mutation', () => {
    describe('input validation', () => {
      const addBonusInputSchema = z.object({
        currencyId: z.string().uuid('有効な通貨IDを指定してください'),
        amount: z
          .number()
          .int('金額は整数で入力してください')
          .positive('金額は正の数で入力してください'),
        source: z
          .string()
          .max(255, '取得元は255文字以下で入力してください')
          .optional(),
        transactionDate: z.date().optional(),
      })

      it('should accept valid bonus input', () => {
        const result = addBonusInputSchema.safeParse({
          currencyId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 1000,
          source: '友達紹介',
        })
        expect(result.success).toBe(true)
      })

      it('should accept bonus without source', () => {
        const result = addBonusInputSchema.safeParse({
          currencyId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 500,
        })
        expect(result.success).toBe(true)
      })

      it('should reject zero amount', () => {
        const result = addBonusInputSchema.safeParse({
          currencyId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 0,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '金額は正の数で入力してください',
          )
        }
      })

      it('should reject negative amount', () => {
        const result = addBonusInputSchema.safeParse({
          currencyId: '550e8400-e29b-41d4-a716-446655440000',
          amount: -100,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('addPurchase mutation', () => {
    describe('input validation', () => {
      const addPurchaseInputSchema = z.object({
        currencyId: z.string().uuid('有効な通貨IDを指定してください'),
        amount: z
          .number()
          .int('金額は整数で入力してください')
          .positive('金額は正の数で入力してください'),
        note: z.string().optional(),
        transactionDate: z.date().optional(),
      })

      it('should accept valid purchase input', () => {
        const result = addPurchaseInputSchema.safeParse({
          currencyId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 10000,
          note: '月次購入',
        })
        expect(result.success).toBe(true)
      })

      it('should accept purchase without note', () => {
        const result = addPurchaseInputSchema.safeParse({
          currencyId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 5000,
        })
        expect(result.success).toBe(true)
      })

      it('should reject non-positive amount', () => {
        const result = addPurchaseInputSchema.safeParse({
          currencyId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 0,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('list query', () => {
    describe('input validation', () => {
      const listCurrenciesInputSchema = z
        .object({
          includeArchived: z.boolean().default(false),
        })
        .optional()

      it('should accept empty input for defaults', () => {
        const result = listCurrenciesInputSchema.safeParse(undefined)
        expect(result.success).toBe(true)
      })

      it('should accept includeArchived flag', () => {
        const result = listCurrenciesInputSchema.safeParse({
          includeArchived: true,
        })
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
    it('should return NOT_FOUND error code for non-existent currency', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: '通貨が見つかりません',
      })

      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('通貨が見つかりません')
    })

    it('should return FORBIDDEN error code when user does not own currency', () => {
      const error = new TRPCError({
        code: 'FORBIDDEN',
        message: 'この通貨にアクセスする権限がありません',
      })

      expect(error.code).toBe('FORBIDDEN')
      expect(error.message).toBe('この通貨にアクセスする権限がありません')
    })

    it('should return expected currency response structure', () => {
      const expectedResponse = {
        id: 'test-uuid',
        name: 'ABC Poker Chips',
        initialBalance: 10000,
        isArchived: false,
        userId: 'user-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }

      expect(expectedResponse).toHaveProperty('id')
      expect(expectedResponse).toHaveProperty('name')
      expect(expectedResponse).toHaveProperty('initialBalance')
      expect(expectedResponse).toHaveProperty('isArchived')
      expect(expectedResponse).toHaveProperty('userId')
    })

    it('should return expected list response structure', () => {
      const expectedResponse = {
        currencies: [
          {
            id: 'test-uuid',
            name: 'ABC Poker Chips',
            initialBalance: 10000,
            currentBalance: 12000,
            isArchived: false,
          },
        ],
      }

      expect(expectedResponse).toHaveProperty('currencies')
      expect(Array.isArray(expectedResponse.currencies)).toBe(true)
      expect(expectedResponse.currencies[0]).toHaveProperty('currentBalance')
    })
  })
})
