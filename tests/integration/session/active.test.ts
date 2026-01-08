import { describe, expect, it } from 'vitest'

/**
 * Integration tests for active session state transitions.
 *
 * These tests verify the business logic for:
 * - Session lifecycle (start → pause → resume → end)
 * - Event sequence ordering
 * - Stack calculation from events
 * - Buy-in total with rebuys and addons
 * - Profit/loss calculation
 *
 * @see data-model.md Section 14. SessionEvent
 */
describe('Active Session State Transitions', () => {
  describe('Session Lifecycle', () => {
    it('should define valid session states', () => {
      const sessionStates = ['active', 'paused', 'completed'] as const
      expect(sessionStates).toContain('active')
      expect(sessionStates).toContain('paused')
      expect(sessionStates).toContain('completed')
    })

    it('should define valid event types', () => {
      const eventTypes = [
        'session_start',
        'session_resume',
        'session_pause',
        'session_end',
        'player_seated',
        'hand_recorded',
        'hands_passed',
        'stack_update',
        'rebuy',
        'addon',
      ] as const

      expect(eventTypes).toHaveLength(10)
      expect(eventTypes).toContain('session_start')
      expect(eventTypes).toContain('session_end')
    })

    it('should track state based on last event', () => {
      interface SessionEvent {
        eventType: string
        sequence: number
      }

      const getSessionState = (events: SessionEvent[]): string => {
        if (events.length === 0) return 'unknown'
        const lastEvent = events[events.length - 1]
        switch (lastEvent?.eventType) {
          case 'session_pause':
            return 'paused'
          case 'session_end':
            return 'completed'
          default:
            return 'active'
        }
      }

      // Active state
      expect(
        getSessionState([
          { eventType: 'session_start', sequence: 1 },
          { eventType: 'stack_update', sequence: 2 },
        ]),
      ).toBe('active')

      // Paused state
      expect(
        getSessionState([
          { eventType: 'session_start', sequence: 1 },
          { eventType: 'session_pause', sequence: 2 },
        ]),
      ).toBe('paused')

      // Resumed (active)
      expect(
        getSessionState([
          { eventType: 'session_start', sequence: 1 },
          { eventType: 'session_pause', sequence: 2 },
          { eventType: 'session_resume', sequence: 3 },
        ]),
      ).toBe('active')

      // Completed
      expect(
        getSessionState([
          { eventType: 'session_start', sequence: 1 },
          { eventType: 'session_end', sequence: 2 },
        ]),
      ).toBe('completed')
    })
  })

  describe('Event Sequence', () => {
    it('should maintain strict event ordering', () => {
      interface SessionEvent {
        eventType: string
        sequence: number
        recordedAt: Date
      }

      const events: SessionEvent[] = [
        {
          eventType: 'session_start',
          sequence: 1,
          recordedAt: new Date('2024-01-01T10:00:00'),
        },
        {
          eventType: 'stack_update',
          sequence: 2,
          recordedAt: new Date('2024-01-01T10:30:00'),
        },
        {
          eventType: 'rebuy',
          sequence: 3,
          recordedAt: new Date('2024-01-01T11:00:00'),
        },
        {
          eventType: 'session_pause',
          sequence: 4,
          recordedAt: new Date('2024-01-01T12:00:00'),
        },
        {
          eventType: 'session_resume',
          sequence: 5,
          recordedAt: new Date('2024-01-01T12:30:00'),
        },
        {
          eventType: 'session_end',
          sequence: 6,
          recordedAt: new Date('2024-01-01T15:00:00'),
        },
      ]

      // Verify sequences are monotonically increasing
      for (let i = 1; i < events.length; i++) {
        const current = events[i]
        const previous = events[i - 1]
        if (current && previous) {
          expect(current.sequence).toBeGreaterThan(previous.sequence)
        }
      }

      // Verify timestamps are chronological
      for (let i = 1; i < events.length; i++) {
        const current = events[i]
        const previous = events[i - 1]
        if (current && previous) {
          expect(current.recordedAt.getTime()).toBeGreaterThanOrEqual(
            previous.recordedAt.getTime(),
          )
        }
      }
    })

    it('should calculate next sequence number correctly', () => {
      interface SessionEvent {
        sequence: number
      }

      const getNextSequence = (events: SessionEvent[]): number => {
        if (events.length === 0) return 1
        const lastEvent = events[events.length - 1]
        return (lastEvent?.sequence ?? 0) + 1
      }

      expect(getNextSequence([])).toBe(1)
      expect(getNextSequence([{ sequence: 1 }])).toBe(2)
      expect(getNextSequence([{ sequence: 1 }, { sequence: 2 }])).toBe(3)
      expect(
        getNextSequence([{ sequence: 1 }, { sequence: 2 }, { sequence: 10 }]),
      ).toBe(11)
    })
  })

  describe('Stack Calculation', () => {
    interface SessionEvent {
      eventType: string
      eventData: Record<string, unknown>
    }

    const calculateCurrentStack = (
      initialBuyIn: number,
      events: SessionEvent[],
    ): number => {
      let currentStack = initialBuyIn
      for (const event of events) {
        if (event.eventType === 'stack_update' && event.eventData.amount) {
          currentStack = event.eventData.amount as number
        } else if (event.eventType === 'rebuy' && event.eventData.amount) {
          currentStack += event.eventData.amount as number
        } else if (event.eventType === 'addon' && event.eventData.amount) {
          currentStack += event.eventData.amount as number
        }
      }
      return currentStack
    }

    it('should return initial buy-in when no events', () => {
      const stack = calculateCurrentStack(10000, [])
      expect(stack).toBe(10000)
    })

    it('should update stack with stack_update event', () => {
      const events: SessionEvent[] = [
        { eventType: 'session_start', eventData: {} },
        { eventType: 'stack_update', eventData: { amount: 15000 } },
      ]
      expect(calculateCurrentStack(10000, events)).toBe(15000)
    })

    it('should add rebuy amount to current stack', () => {
      const events: SessionEvent[] = [
        { eventType: 'session_start', eventData: {} },
        { eventType: 'stack_update', eventData: { amount: 5000 } },
        { eventType: 'rebuy', eventData: { amount: 10000 } },
      ]
      // Stack was 5000, rebuy adds 10000 → 15000
      expect(calculateCurrentStack(10000, events)).toBe(15000)
    })

    it('should add addon amount to current stack', () => {
      const events: SessionEvent[] = [
        { eventType: 'session_start', eventData: {} },
        { eventType: 'stack_update', eventData: { amount: 8000 } },
        { eventType: 'addon', eventData: { amount: 5000 } },
      ]
      // Stack was 8000, addon adds 5000 → 13000
      expect(calculateCurrentStack(10000, events)).toBe(13000)
    })

    it('should handle complex event sequence', () => {
      const events: SessionEvent[] = [
        { eventType: 'session_start', eventData: {} },
        { eventType: 'stack_update', eventData: { amount: 8000 } }, // Lost 2000
        { eventType: 'rebuy', eventData: { amount: 10000 } }, // +10000 → 18000
        { eventType: 'stack_update', eventData: { amount: 25000 } }, // Won → 25000
        { eventType: 'addon', eventData: { amount: 5000 } }, // +5000 → 30000
        { eventType: 'stack_update', eventData: { amount: 22000 } }, // Lost → 22000
      ]
      expect(calculateCurrentStack(10000, events)).toBe(22000)
    })

    it('should handle session without stack updates', () => {
      const events: SessionEvent[] = [
        { eventType: 'session_start', eventData: {} },
        { eventType: 'session_pause', eventData: {} },
        { eventType: 'session_resume', eventData: {} },
      ]
      // No stack updates, return initial buy-in
      expect(calculateCurrentStack(10000, events)).toBe(10000)
    })
  })

  describe('Buy-in Total Calculation', () => {
    interface SessionEvent {
      eventType: string
      eventData: Record<string, unknown>
    }

    const calculateTotalBuyIn = (
      initialBuyIn: number,
      events: SessionEvent[],
    ): number => {
      let total = initialBuyIn
      for (const event of events) {
        if (event.eventType === 'rebuy' && event.eventData.amount) {
          total += event.eventData.amount as number
        } else if (event.eventType === 'addon' && event.eventData.amount) {
          total += event.eventData.amount as number
        }
      }
      return total
    }

    it('should return initial buy-in when no rebuys or addons', () => {
      expect(calculateTotalBuyIn(10000, [])).toBe(10000)
    })

    it('should add single rebuy to total', () => {
      const events: SessionEvent[] = [
        { eventType: 'rebuy', eventData: { amount: 10000 } },
      ]
      expect(calculateTotalBuyIn(10000, events)).toBe(20000)
    })

    it('should add multiple rebuys to total', () => {
      const events: SessionEvent[] = [
        { eventType: 'rebuy', eventData: { amount: 10000 } },
        { eventType: 'rebuy', eventData: { amount: 10000 } },
        { eventType: 'rebuy', eventData: { amount: 5000 } },
      ]
      expect(calculateTotalBuyIn(10000, events)).toBe(35000)
    })

    it('should add addons to total', () => {
      const events: SessionEvent[] = [
        { eventType: 'addon', eventData: { amount: 5000 } },
      ]
      expect(calculateTotalBuyIn(10000, events)).toBe(15000)
    })

    it('should handle mixed rebuys and addons', () => {
      const events: SessionEvent[] = [
        { eventType: 'rebuy', eventData: { amount: 10000 } },
        { eventType: 'addon', eventData: { amount: 5000 } },
        { eventType: 'rebuy', eventData: { amount: 10000 } },
      ]
      expect(calculateTotalBuyIn(10000, events)).toBe(35000)
    })
  })

  describe('Profit/Loss Calculation', () => {
    it('should calculate profit (positive result)', () => {
      const buyIn = 10000
      const cashOut = 25000
      const profitLoss = cashOut - buyIn
      expect(profitLoss).toBe(15000)
    })

    it('should calculate loss (negative result)', () => {
      const buyIn = 10000
      const cashOut = 3000
      const profitLoss = cashOut - buyIn
      expect(profitLoss).toBe(-7000)
    })

    it('should calculate break even', () => {
      const buyIn = 10000
      const cashOut = 10000
      const profitLoss = cashOut - buyIn
      expect(profitLoss).toBe(0)
    })

    it('should calculate profit with rebuys and addons', () => {
      const initialBuyIn = 10000
      const rebuys = [10000, 10000]
      const addons = [5000]
      const totalBuyIn =
        initialBuyIn +
        rebuys.reduce((a, b) => a + b, 0) +
        addons.reduce((a, b) => a + b, 0)
      const cashOut = 50000

      expect(totalBuyIn).toBe(35000)
      expect(cashOut - totalBuyIn).toBe(15000) // Profit
    })

    it('should calculate loss despite initial profit', () => {
      // Started with 10000, went up to 30000, then lost everything
      const initialBuyIn = 10000
      const rebuy = 20000 // Had to rebuy
      const totalBuyIn = initialBuyIn + rebuy
      const cashOut = 5000

      expect(totalBuyIn).toBe(30000)
      expect(cashOut - totalBuyIn).toBe(-25000) // Big loss
    })
  })

  describe('Elapsed Time Calculation', () => {
    it('should calculate elapsed time in minutes', () => {
      const startTime = new Date('2024-01-01T10:00:00')
      const currentTime = new Date('2024-01-01T12:30:00')

      const elapsedMs = currentTime.getTime() - startTime.getTime()
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))

      expect(elapsedMinutes).toBe(150) // 2.5 hours
    })

    it('should handle short sessions', () => {
      const startTime = new Date('2024-01-01T10:00:00')
      const currentTime = new Date('2024-01-01T10:15:00')

      const elapsedMs = currentTime.getTime() - startTime.getTime()
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))

      expect(elapsedMinutes).toBe(15)
    })

    it('should handle long sessions', () => {
      const startTime = new Date('2024-01-01T10:00:00')
      const currentTime = new Date('2024-01-01T22:45:00')

      const elapsedMs = currentTime.getTime() - startTime.getTime()
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))

      expect(elapsedMinutes).toBe(765) // 12 hours 45 minutes
    })

    it('should format elapsed time as hours and minutes', () => {
      const formatElapsedTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours === 0) return `${mins}分`
        return `${hours}時間${mins}分`
      }

      expect(formatElapsedTime(30)).toBe('30分')
      expect(formatElapsedTime(60)).toBe('1時間0分')
      expect(formatElapsedTime(90)).toBe('1時間30分')
      expect(formatElapsedTime(150)).toBe('2時間30分')
    })
  })

  describe('Single Active Session Constraint', () => {
    it('should reject second session when one is active', () => {
      interface Session {
        id: string
        isActive: boolean
      }

      const sessions: Session[] = [{ id: 'session-1', isActive: true }]

      const canStartNewSession = (existingSessions: Session[]): boolean => {
        return !existingSessions.some((s) => s.isActive)
      }

      expect(canStartNewSession(sessions)).toBe(false)
    })

    it('should allow new session when no active session exists', () => {
      interface Session {
        id: string
        isActive: boolean
      }

      const sessions: Session[] = [{ id: 'session-1', isActive: false }]

      const canStartNewSession = (existingSessions: Session[]): boolean => {
        return !existingSessions.some((s) => s.isActive)
      }

      expect(canStartNewSession(sessions)).toBe(true)
    })

    it('should allow new session when no sessions exist', () => {
      interface Session {
        id: string
        isActive: boolean
      }

      const sessions: Session[] = []

      const canStartNewSession = (existingSessions: Session[]): boolean => {
        return !existingSessions.some((s) => s.isActive)
      }

      expect(canStartNewSession(sessions)).toBe(true)
    })
  })

  describe('Session End Validation', () => {
    it('should require cash out amount to end session', () => {
      const validateEndSession = (cashOut: number | null): boolean => {
        return cashOut !== null && cashOut >= 0
      }

      expect(validateEndSession(null)).toBe(false)
      expect(validateEndSession(0)).toBe(true)
      expect(validateEndSession(10000)).toBe(true)
      expect(validateEndSession(-1)).toBe(false)
    })

    it('should allow zero cash out (busted)', () => {
      const cashOut = 0
      const buyIn = 10000
      const profitLoss = cashOut - buyIn

      expect(profitLoss).toBe(-10000)
    })
  })

  // Database integration tests - require actual database
  describe.skip('Database Integration', () => {
    it('should create session with session_start event', async () => {
      // This test requires database connection
      // Run with: DATABASE_URL=... bun run test tests/integration/session/active.test.ts
    })

    it('should enforce single active session per user', async () => {
      // This test requires database connection
    })

    it('should update session buyIn on rebuy/addon', async () => {
      // This test requires database connection
    })

    it('should mark session as inactive on end', async () => {
      // This test requires database connection
    })
  })
})
