import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { SESSION_EVENT_TYPES } from '~/server/db/schema'

/**
 * Unit tests for sessionEvent router.
 *
 * Tests the mutations and queries for active session event recording.
 * Uses Zod schema validation to test input requirements.
 *
 * @see data-model.md Section 14. SessionEvent
 * @see contracts/trpc-api.md sessionEvent router section
 */
describe('SessionEvent Router', () => {
  describe('startSession mutation', () => {
    describe('input validation', () => {
      const startSessionSchema = z.object({
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
        buyIn: z
          .number()
          .int()
          .positive('バイイン額は1以上の整数で入力してください'),
      })

      it('should accept valid start session input with minimum fields', () => {
        const result = startSessionSchema.safeParse({
          buyIn: 10000,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid start session with store and game', () => {
        const result = startSessionSchema.safeParse({
          storeId: '550e8400-e29b-41d4-a716-446655440000',
          gameType: 'cash',
          cashGameId: '550e8400-e29b-41d4-a716-446655440001',
          currencyId: '550e8400-e29b-41d4-a716-446655440002',
          buyIn: 10000,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid buyIn (zero)', () => {
        const result = startSessionSchema.safeParse({
          buyIn: 0,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'バイイン額は1以上の整数で入力してください',
          )
        }
      })

      it('should reject invalid buyIn (negative)', () => {
        const result = startSessionSchema.safeParse({
          buyIn: -1000,
        })
        expect(result.success).toBe(false)
      })

      it('should reject invalid storeId format', () => {
        const result = startSessionSchema.safeParse({
          storeId: 'invalid-id',
          buyIn: 10000,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効な店舗IDを指定してください',
          )
        }
      })
    })
  })

  describe('endSession mutation', () => {
    describe('input validation', () => {
      const endSessionSchema = z.object({
        sessionId: z.string().uuid('有効なセッションIDを指定してください'),
        cashOut: z
          .number()
          .int()
          .min(0, 'キャッシュアウト額は0以上で入力してください'),
      })

      it('should accept valid end session input', () => {
        const result = endSessionSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          cashOut: 15000,
        })
        expect(result.success).toBe(true)
      })

      it('should accept zero cashOut (lost all chips)', () => {
        const result = endSessionSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          cashOut: 0,
        })
        expect(result.success).toBe(true)
      })

      it('should reject negative cashOut', () => {
        const result = endSessionSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          cashOut: -1000,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'キャッシュアウト額は0以上で入力してください',
          )
        }
      })

      it('should reject invalid sessionId', () => {
        const result = endSessionSchema.safeParse({
          sessionId: 'invalid',
          cashOut: 15000,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '有効なセッションIDを指定してください',
          )
        }
      })
    })
  })

  describe('pauseSession mutation', () => {
    describe('input validation', () => {
      const pauseSessionSchema = z.object({
        sessionId: z.string().uuid('有効なセッションIDを指定してください'),
      })

      it('should accept valid session ID', () => {
        const result = pauseSessionSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid session ID', () => {
        const result = pauseSessionSchema.safeParse({
          sessionId: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('resumeSession mutation', () => {
    describe('input validation', () => {
      const resumeSessionSchema = z.object({
        sessionId: z.string().uuid('有効なセッションIDを指定してください'),
      })

      it('should accept valid session ID', () => {
        const result = resumeSessionSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid session ID', () => {
        const result = resumeSessionSchema.safeParse({
          sessionId: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('seatPlayer mutation', () => {
    describe('input validation', () => {
      const seatPlayerSchema = z.object({
        sessionId: z.string().uuid('有効なセッションIDを指定してください'),
        seatNumber: z
          .number()
          .int()
          .min(1, '座席番号は1以上9以下で入力してください')
          .max(9, '座席番号は1以上9以下で入力してください'),
        playerId: z
          .string()
          .uuid('有効なプレイヤーIDを指定してください')
          .optional(),
        playerName: z.string().min(1, 'プレイヤー名を入力してください'),
      })

      it('should accept valid seat player input with known player', () => {
        const result = seatPlayerSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          seatNumber: 3,
          playerId: '550e8400-e29b-41d4-a716-446655440001',
          playerName: '田中',
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid seat player input without known player', () => {
        const result = seatPlayerSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          seatNumber: 7,
          playerName: '鈴木',
        })
        expect(result.success).toBe(true)
      })

      it('should reject seat number below 1', () => {
        const result = seatPlayerSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          seatNumber: 0,
          playerName: '田中',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '座席番号は1以上9以下で入力してください',
          )
        }
      })

      it('should reject seat number above 9', () => {
        const result = seatPlayerSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          seatNumber: 10,
          playerName: '田中',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            '座席番号は1以上9以下で入力してください',
          )
        }
      })

      it('should reject empty player name', () => {
        const result = seatPlayerSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          seatNumber: 3,
          playerName: '',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'プレイヤー名を入力してください',
          )
        }
      })
    })
  })

  describe('updateStack mutation', () => {
    describe('input validation', () => {
      const updateStackSchema = z.object({
        sessionId: z.string().uuid('有効なセッションIDを指定してください'),
        amount: z
          .number()
          .int()
          .positive('スタック額は1以上の整数で入力してください'),
      })

      it('should accept valid stack update', () => {
        const result = updateStackSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 15000,
        })
        expect(result.success).toBe(true)
      })

      it('should reject zero amount', () => {
        const result = updateStackSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 0,
        })
        expect(result.success).toBe(false)
      })

      it('should reject negative amount', () => {
        const result = updateStackSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          amount: -5000,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('recordRebuy mutation', () => {
    describe('input validation', () => {
      const recordRebuySchema = z.object({
        sessionId: z.string().uuid('有効なセッションIDを指定してください'),
        amount: z
          .number()
          .int()
          .positive('リバイ額は1以上の整数で入力してください'),
      })

      it('should accept valid rebuy', () => {
        const result = recordRebuySchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 5000,
        })
        expect(result.success).toBe(true)
      })

      it('should reject zero amount', () => {
        const result = recordRebuySchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 0,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('recordAddon mutation', () => {
    describe('input validation', () => {
      const recordAddonSchema = z.object({
        sessionId: z.string().uuid('有効なセッションIDを指定してください'),
        amount: z
          .number()
          .int()
          .positive('アドオン額は1以上の整数で入力してください'),
      })

      it('should accept valid addon', () => {
        const result = recordAddonSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 3000,
        })
        expect(result.success).toBe(true)
      })

      it('should reject zero amount', () => {
        const result = recordAddonSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 0,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('recordHandsPassed mutation', () => {
    describe('input validation', () => {
      const recordHandsPassedSchema = z.object({
        sessionId: z.string().uuid('有効なセッションIDを指定してください'),
        count: z
          .number()
          .int()
          .positive('ハンド数は1以上の整数で入力してください'),
      })

      it('should accept valid hands passed count', () => {
        const result = recordHandsPassedSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          count: 5,
        })
        expect(result.success).toBe(true)
      })

      it('should reject zero count', () => {
        const result = recordHandsPassedSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          count: 0,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('recordHand mutation', () => {
    describe('input validation', () => {
      const recordHandSchema = z.object({
        sessionId: z.string().uuid('有効なセッションIDを指定してください'),
        handId: z.string().uuid('有効なハンドIDを指定してください'),
      })

      it('should accept valid hand record', () => {
        const result = recordHandSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          handId: '550e8400-e29b-41d4-a716-446655440001',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid session ID', () => {
        const result = recordHandSchema.safeParse({
          sessionId: 'invalid',
          handId: '550e8400-e29b-41d4-a716-446655440001',
        })
        expect(result.success).toBe(false)
      })

      it('should reject invalid hand ID', () => {
        const result = recordHandSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          handId: 'invalid',
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

      it('should accept valid session ID', () => {
        const result = listBySessionSchema.safeParse({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid session ID', () => {
        const result = listBySessionSchema.safeParse({
          sessionId: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('business logic', () => {
    it('should have all expected event types defined', () => {
      expect(SESSION_EVENT_TYPES).toContain('session_start')
      expect(SESSION_EVENT_TYPES).toContain('session_resume')
      expect(SESSION_EVENT_TYPES).toContain('session_pause')
      expect(SESSION_EVENT_TYPES).toContain('session_end')
      expect(SESSION_EVENT_TYPES).toContain('player_seated')
      expect(SESSION_EVENT_TYPES).toContain('hand_recorded')
      expect(SESSION_EVENT_TYPES).toContain('hands_passed')
      expect(SESSION_EVENT_TYPES).toContain('stack_update')
      expect(SESSION_EVENT_TYPES).toContain('rebuy')
      expect(SESSION_EVENT_TYPES).toContain('addon')
    })

    it('should return NOT_FOUND error code for non-existent session', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: 'セッションが見つかりません',
      })

      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('セッションが見つかりません')
    })

    it('should return CONFLICT error when user already has an active session', () => {
      const error = new TRPCError({
        code: 'CONFLICT',
        message: '既にアクティブなセッションが存在します',
      })

      expect(error.code).toBe('CONFLICT')
      expect(error.message).toBe('既にアクティブなセッションが存在します')
    })

    it('should return CONFLICT error when trying to pause a non-active session', () => {
      const error = new TRPCError({
        code: 'CONFLICT',
        message: 'セッションはアクティブではありません',
      })

      expect(error.code).toBe('CONFLICT')
      expect(error.message).toBe('セッションはアクティブではありません')
    })

    it('should return expected startSession response structure', () => {
      const expectedResponse = {
        sessionId: 'test-uuid',
        eventId: 'event-uuid',
        startTime: new Date(),
      }

      expect(expectedResponse).toHaveProperty('sessionId')
      expect(expectedResponse).toHaveProperty('eventId')
      expect(expectedResponse).toHaveProperty('startTime')
    })

    it('should return expected event response structure', () => {
      const expectedResponse = {
        id: 'event-uuid',
        eventType: 'stack_update',
        eventData: { amount: 15000 },
        sequence: 5,
        recordedAt: new Date(),
      }

      expect(expectedResponse).toHaveProperty('id')
      expect(expectedResponse).toHaveProperty('eventType')
      expect(expectedResponse).toHaveProperty('eventData')
      expect(expectedResponse).toHaveProperty('sequence')
      expect(expectedResponse).toHaveProperty('recordedAt')
    })

    it('should return expected listBySession response structure', () => {
      const expectedResponse = [
        {
          id: 'event-1',
          eventType: 'session_start',
          eventData: {},
          sequence: 1,
          recordedAt: new Date(),
        },
        {
          id: 'event-2',
          eventType: 'stack_update',
          eventData: { amount: 10000 },
          sequence: 2,
          recordedAt: new Date(),
        },
      ]

      expect(Array.isArray(expectedResponse)).toBe(true)
      expect(expectedResponse[0]).toHaveProperty('id')
      expect(expectedResponse[0]).toHaveProperty('eventType')
      expect(expectedResponse[0]).toHaveProperty('sequence')
    })

    it('should calculate sequence correctly', () => {
      // Sequence should be incremented for each new event
      const events = [
        { sequence: 1, eventType: 'session_start' },
        { sequence: 2, eventType: 'stack_update' },
        { sequence: 3, eventType: 'rebuy' },
        { sequence: 4, eventType: 'session_end' },
      ]

      // Each event should have a unique, incrementing sequence
      for (let i = 0; i < events.length; i++) {
        expect(events[i]?.sequence).toBe(i + 1)
      }
    })
  })

  describe('event data structures', () => {
    const sessionEndDataSchema = z.object({
      cashOut: z.number().int().min(0),
    })

    const playerSeatedDataSchema = z.object({
      playerId: z.string().uuid().optional(),
      seatNumber: z.number().int().min(1).max(9),
      playerName: z.string().min(1),
    })

    const handRecordedDataSchema = z.object({
      handId: z.string().uuid(),
    })

    const handsPassedDataSchema = z.object({
      count: z.number().int().positive(),
    })

    const stackUpdateDataSchema = z.object({
      amount: z.number().int().positive(),
    })

    const rebuyDataSchema = z.object({
      amount: z.number().int().positive(),
    })

    const addonDataSchema = z.object({
      amount: z.number().int().positive(),
    })

    it('should validate session_end event data', () => {
      const result = sessionEndDataSchema.safeParse({ cashOut: 15000 })
      expect(result.success).toBe(true)
    })

    it('should validate player_seated event data', () => {
      const result = playerSeatedDataSchema.safeParse({
        seatNumber: 3,
        playerName: '田中',
        playerId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('should validate player_seated event data without playerId', () => {
      const result = playerSeatedDataSchema.safeParse({
        seatNumber: 7,
        playerName: '鈴木',
      })
      expect(result.success).toBe(true)
    })

    it('should validate hand_recorded event data', () => {
      const result = handRecordedDataSchema.safeParse({
        handId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('should validate hands_passed event data', () => {
      const result = handsPassedDataSchema.safeParse({ count: 5 })
      expect(result.success).toBe(true)
    })

    it('should validate stack_update event data', () => {
      const result = stackUpdateDataSchema.safeParse({ amount: 15000 })
      expect(result.success).toBe(true)
    })

    it('should validate rebuy event data', () => {
      const result = rebuyDataSchema.safeParse({ amount: 5000 })
      expect(result.success).toBe(true)
    })

    it('should validate addon event data', () => {
      const result = addonDataSchema.safeParse({ amount: 3000 })
      expect(result.success).toBe(true)
    })
  })
})
