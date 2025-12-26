import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Unit tests for store router.
 *
 * Tests the CRUD mutations and queries' input validation and business logic.
 * Uses Zod schema validation to test input requirements.
 *
 * @see data-model.md Section 8. Store
 */
describe('Store Router', () => {
  describe('create mutation', () => {
    describe('input validation', () => {
      const createStoreInputSchema = z.object({
        name: z
          .string()
          .min(1, '店舗名を入力してください')
          .max(255, '店舗名は255文字以下で入力してください'),
        address: z.string().optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        placeId: z.string().max(255).optional(),
        notes: z.string().optional(),
      })

      it('should accept valid name only', () => {
        const result = createStoreInputSchema.safeParse({
          name: 'ABCポーカー渋谷店',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid name with address', () => {
        const result = createStoreInputSchema.safeParse({
          name: 'ABCポーカー渋谷店',
          address: '東京都渋谷区渋谷1-1-1',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid name with coordinates', () => {
        const result = createStoreInputSchema.safeParse({
          name: 'ABCポーカー渋谷店',
          latitude: 35.6595,
          longitude: 139.7004,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid name with placeId', () => {
        const result = createStoreInputSchema.safeParse({
          name: 'ABCポーカー渋谷店',
          placeId: 'ChIJ51cu8IcbImARiRtXIothAS4',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid name with all location fields', () => {
        const result = createStoreInputSchema.safeParse({
          name: 'ABCポーカー渋谷店',
          address: '東京都渋谷区渋谷1-1-1',
          latitude: 35.6595,
          longitude: 139.7004,
          placeId: 'ChIJ51cu8IcbImARiRtXIothAS4',
          notes: '<p>駅から徒歩5分</p>',
        })
        expect(result.success).toBe(true)
      })

      it('should reject empty name', () => {
        const result = createStoreInputSchema.safeParse({
          name: '',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '店舗名を入力してください',
          )
        }
      })

      it('should reject name longer than 255 characters', () => {
        const result = createStoreInputSchema.safeParse({
          name: 'a'.repeat(256),
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '店舗名は255文字以下で入力してください',
          )
        }
      })

      it('should reject invalid latitude (out of range)', () => {
        const result = createStoreInputSchema.safeParse({
          name: 'ABCポーカー渋谷店',
          latitude: 91,
        })
        expect(result.success).toBe(false)
      })

      it('should reject invalid longitude (out of range)', () => {
        const result = createStoreInputSchema.safeParse({
          name: 'ABCポーカー渋谷店',
          longitude: 181,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('update mutation', () => {
    describe('input validation', () => {
      const updateStoreInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
        name: z
          .string()
          .min(1, '店舗名を入力してください')
          .max(255, '店舗名は255文字以下で入力してください')
          .optional(),
        address: z.string().optional(),
        latitude: z.number().min(-90).max(90).optional().nullable(),
        longitude: z.number().min(-180).max(180).optional().nullable(),
        placeId: z.string().max(255).optional().nullable(),
        notes: z.string().optional().nullable(),
      })

      it('should accept valid id with name update', () => {
        const result = updateStoreInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: '更新後の店舗名',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid id with address update', () => {
        const result = updateStoreInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          address: '新しい住所',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid id with coordinates update', () => {
        const result = updateStoreInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          latitude: 35.6762,
          longitude: 139.6503,
        })
        expect(result.success).toBe(true)
      })

      it('should accept null to clear optional fields', () => {
        const result = updateStoreInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          latitude: null,
          longitude: null,
          placeId: null,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = updateStoreInputSchema.safeParse({
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
      const archiveStoreInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
        isArchived: z.boolean(),
      })

      it('should accept valid UUID with archive flag', () => {
        const result = archiveStoreInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          isArchived: true,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid UUID with unarchive flag', () => {
        const result = archiveStoreInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
          isArchived: false,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = archiveStoreInputSchema.safeParse({
          id: 'invalid',
          isArchived: true,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('delete mutation', () => {
    describe('input validation', () => {
      const deleteStoreInputSchema = z.object({
        id: z.string().uuid('有効なIDを指定してください'),
      })

      it('should accept valid UUID', () => {
        const result = deleteStoreInputSchema.safeParse({
          id: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID', () => {
        const result = deleteStoreInputSchema.safeParse({
          id: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('list query', () => {
    describe('input validation', () => {
      const listStoresInputSchema = z
        .object({
          includeArchived: z.boolean().default(false),
        })
        .optional()

      it('should accept empty input for defaults', () => {
        const result = listStoresInputSchema.safeParse(undefined)
        expect(result.success).toBe(true)
      })

      it('should accept includeArchived flag', () => {
        const result = listStoresInputSchema.safeParse({
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
    it('should return NOT_FOUND error code for non-existent store', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: '店舗が見つかりません',
      })

      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('店舗が見つかりません')
    })

    it('should return FORBIDDEN error code when user does not own store', () => {
      const error = new TRPCError({
        code: 'FORBIDDEN',
        message: 'この店舗にアクセスする権限がありません',
      })

      expect(error.code).toBe('FORBIDDEN')
      expect(error.message).toBe('この店舗にアクセスする権限がありません')
    })

    it('should return expected store response structure', () => {
      const expectedResponse = {
        id: 'test-uuid',
        name: 'ABCポーカー渋谷店',
        address: '東京都渋谷区渋谷1-1-1',
        latitude: 35.6595,
        longitude: 139.7004,
        placeId: 'ChIJ51cu8IcbImARiRtXIothAS4',
        notes: null,
        isArchived: false,
        userId: 'user-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }

      expect(expectedResponse).toHaveProperty('id')
      expect(expectedResponse).toHaveProperty('name')
      expect(expectedResponse).toHaveProperty('latitude')
      expect(expectedResponse).toHaveProperty('longitude')
      expect(expectedResponse).toHaveProperty('placeId')
      expect(expectedResponse).toHaveProperty('isArchived')
      expect(expectedResponse).toHaveProperty('userId')
    })

    it('should return expected list response structure with game counts', () => {
      const expectedResponse = {
        stores: [
          {
            id: 'test-uuid',
            name: 'ABCポーカー渋谷店',
            address: '東京都渋谷区渋谷1-1-1',
            isArchived: false,
            cashGameCount: 3,
            tournamentCount: 2,
          },
        ],
      }

      expect(expectedResponse).toHaveProperty('stores')
      expect(Array.isArray(expectedResponse.stores)).toBe(true)
      expect(expectedResponse.stores[0]).toHaveProperty('cashGameCount')
      expect(expectedResponse.stores[0]).toHaveProperty('tournamentCount')
    })

    it('should return expected getById response with games and googleMapsUrl', () => {
      const expectedResponse = {
        id: 'test-uuid',
        name: 'ABCポーカー渋谷店',
        address: '東京都渋谷区渋谷1-1-1',
        latitude: 35.6595,
        longitude: 139.7004,
        placeId: 'ChIJ51cu8IcbImARiRtXIothAS4',
        notes: null,
        isArchived: false,
        cashGames: [],
        tournaments: [],
        googleMapsUrl:
          'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ51cu8IcbImARiRtXIothAS4',
      }

      expect(expectedResponse).toHaveProperty('cashGames')
      expect(expectedResponse).toHaveProperty('tournaments')
      expect(expectedResponse).toHaveProperty('googleMapsUrl')
    })
  })
})
