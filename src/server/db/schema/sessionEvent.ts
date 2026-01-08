import { index } from 'drizzle-orm/pg-core'

import { createTable } from './common'
import { pokerSessions } from './session'
import { users } from './user'

/**
 * Valid event types for session events.
 *
 * @see data-model.md Section 14. SessionEvent
 */
export const SESSION_EVENT_TYPES = [
  'session_start',
  'session_resume',
  'session_pause',
  'session_end',
  'player_seated',
  'hand_recorded',
  'hands_passed',
  'hand_complete',
  'stack_update',
  'rebuy',
  'addon',
] as const

/**
 * SessionEventType type.
 * Union of all valid event types.
 */
export type SessionEventType = (typeof SESSION_EVENT_TYPES)[number]

/**
 * SessionEvent schema for active session recording.
 *
 * Extensible event log for active session recording.
 * Uses JSONB for event data following the recommended PostgreSQL event sourcing pattern.
 *
 * Event Types:
 * - session_start: Session begins - eventData: {}
 * - session_resume: Session resumes after pause - eventData: {}
 * - session_pause: Session paused - eventData: {}
 * - session_end: Session completed - eventData: { cashOut: number }
 * - player_seated: Player sits at seat - eventData: { playerId?: string, seatNumber: number, playerName: string }
 * - hand_recorded: Hand with full history - eventData: { handId: string }
 * - hands_passed: Hands without full history - eventData: { count: number }
 * - hand_complete: Single hand completed (for counting) - eventData: {} (NOT shown in timeline)
 * - stack_update: Stack amount changed - eventData: { amount: number }
 * - rebuy: Rebuy performed - eventData: { amount: number }
 * - addon: Add-on performed - eventData: { amount: number }
 *
 * @see data-model.md Section 14. SessionEvent
 */
export const sessionEvents = createTable(
  'session_event',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Parent session for this event.
     * Cascades on delete to remove all session's events.
     */
    sessionId: d
      .varchar('session_id', { length: 255 })
      .notNull()
      .references(() => pokerSessions.id, { onDelete: 'cascade' }),
    /**
     * Owner user - enforces data isolation.
     * Cascades on delete to remove all user's events.
     */
    userId: d
      .varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Event type discriminator.
     * One of: session_start, session_resume, session_pause, session_end,
     * player_seated, hand_recorded, hands_passed, stack_update, rebuy, addon
     */
    eventType: d.varchar('event_type', { length: 50 }).notNull(),
    /**
     * Type-specific payload stored as JSONB.
     * Schema varies by eventType (validated at application layer via Zod).
     */
    eventData: d.jsonb('event_data'),
    /**
     * Order within session.
     * Used to reconstruct event sequence.
     */
    sequence: d.integer('sequence').notNull(),
    /**
     * When the event occurred.
     * May differ from createdAt if events are recorded retroactively.
     */
    recordedAt: d
      .timestamp('recorded_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    /**
     * When the record was created.
     */
    createdAt: d
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    index('session_event_session_id_idx').on(t.sessionId),
    index('session_event_event_type_idx').on(t.eventType),
    index('session_event_sequence_idx').on(t.sequence),
    index('session_event_recorded_at_idx').on(t.recordedAt),
  ],
)

// Type exports
export type SessionEvent = typeof sessionEvents.$inferSelect
export type NewSessionEvent = typeof sessionEvents.$inferInsert
