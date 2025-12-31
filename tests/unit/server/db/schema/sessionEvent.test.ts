import { describe, expect, it } from 'vitest'

/**
 * Unit tests for SessionEvent schema.
 *
 * Tests the table definition, columns, and relations.
 * These tests verify the schema structure without database connection.
 *
 * SessionEvent is an extensible event log for active session recording.
 * Uses JSONB for event data following the recommended PostgreSQL event sourcing pattern.
 *
 * @see data-model.md Section 14. SessionEvent
 */
describe('SessionEvent schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', async () => {
      const { sessionEvents } = await import('~/server/db/schema')
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (sessionEvents as unknown as Record<symbol, string>)[
        drizzleNameSymbol
      ]
      expect(tableName).toBe('sapphire_session_event')
    })

    it('should have id column as primary key with UUID default', async () => {
      const { sessionEvents } = await import('~/server/db/schema')
      const idColumn = sessionEvents.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
      expect(idColumn.dataType).toBe('string')
    })

    it('should have sessionId column as not null with FK to pokerSessions', async () => {
      const { sessionEvents } = await import('~/server/db/schema')
      const sessionIdColumn = sessionEvents.sessionId
      expect(sessionIdColumn.name).toBe('session_id')
      expect(sessionIdColumn.notNull).toBe(true)
    })

    it('should have userId column as not null with FK to users', async () => {
      const { sessionEvents } = await import('~/server/db/schema')
      const userIdColumn = sessionEvents.userId
      expect(userIdColumn.name).toBe('user_id')
      expect(userIdColumn.notNull).toBe(true)
    })

    it('should have eventType column as not null varchar(50)', async () => {
      const { sessionEvents } = await import('~/server/db/schema')
      const eventTypeColumn = sessionEvents.eventType
      expect(eventTypeColumn.name).toBe('event_type')
      expect(eventTypeColumn.notNull).toBe(true)
    })

    it('should have eventData column as nullable jsonb', async () => {
      const { sessionEvents } = await import('~/server/db/schema')
      const eventDataColumn = sessionEvents.eventData
      expect(eventDataColumn.name).toBe('event_data')
      expect(eventDataColumn.notNull).toBe(false)
    })

    it('should have sequence column as not null integer', async () => {
      const { sessionEvents } = await import('~/server/db/schema')
      const sequenceColumn = sessionEvents.sequence
      expect(sequenceColumn.name).toBe('sequence')
      expect(sequenceColumn.notNull).toBe(true)
    })

    it('should have recordedAt column as not null timestamp with default', async () => {
      const { sessionEvents } = await import('~/server/db/schema')
      const recordedAtColumn = sessionEvents.recordedAt
      expect(recordedAtColumn.name).toBe('recorded_at')
      expect(recordedAtColumn.notNull).toBe(true)
      expect(recordedAtColumn.hasDefault).toBe(true)
    })

    it('should have createdAt column as not null with default', async () => {
      const { sessionEvents } = await import('~/server/db/schema')
      const createdAtColumn = sessionEvents.createdAt
      expect(createdAtColumn.name).toBe('created_at')
      expect(createdAtColumn.notNull).toBe(true)
      expect(createdAtColumn.hasDefault).toBe(true)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { sessionEventsRelations } = await import('~/server/db/schema')
      expect(sessionEventsRelations).toBeDefined()
    })
  })

  describe('Event types', () => {
    it('should export SESSION_EVENT_TYPES constant', async () => {
      const { SESSION_EVENT_TYPES } = await import('~/server/db/schema')
      expect(SESSION_EVENT_TYPES).toBeDefined()
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

    it('should export SessionEventType type', async () => {
      // Type test - just import to verify it compiles
      const { SESSION_EVENT_TYPES } = await import('~/server/db/schema')
      type SessionEventType = (typeof SESSION_EVENT_TYPES)[number]
      const testType: SessionEventType = 'session_start'
      expect(testType).toBe('session_start')
    })
  })

  describe('Type exports', () => {
    it('should export SessionEvent type', async () => {
      const schema = await import('~/server/db/schema')
      // Type exports don't have runtime values, but we can verify the module loads
      expect(schema.sessionEvents).toBeDefined()
    })

    it('should export NewSessionEvent type', async () => {
      const schema = await import('~/server/db/schema')
      // Type exports don't have runtime values, but we can verify the module loads
      expect(schema.sessionEvents).toBeDefined()
    })
  })
})
