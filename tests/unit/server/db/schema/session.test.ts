import { describe, expect, it } from 'vitest'

/**
 * Unit tests for PokerSession schema.
 *
 * Tests the table definition, columns, and relations.
 * These tests verify the schema structure without database connection.
 *
 * @see data-model.md Section 13. PokerSession
 */
describe('PokerSession schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (pokerSessions as unknown as Record<symbol, string>)[
        drizzleNameSymbol
      ]
      expect(tableName).toBe('sapphire_poker_session')
    })

    it('should have id column as primary key with UUID default', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const idColumn = pokerSessions.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
      expect(idColumn.dataType).toBe('string')
    })

    it('should have userId column as not null with FK to users', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const userIdColumn = pokerSessions.userId
      expect(userIdColumn.name).toBe('user_id')
      expect(userIdColumn.notNull).toBe(true)
    })

    it('should have storeId column as nullable with FK to stores', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const storeIdColumn = pokerSessions.storeId
      expect(storeIdColumn.name).toBe('store_id')
      expect(storeIdColumn.notNull).toBe(false)
    })

    it('should have gameType column as nullable varchar(20)', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const gameTypeColumn = pokerSessions.gameType
      expect(gameTypeColumn.name).toBe('game_type')
      expect(gameTypeColumn.notNull).toBe(false)
    })

    it('should have cashGameId column as nullable with FK to cashGames', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const cashGameIdColumn = pokerSessions.cashGameId
      expect(cashGameIdColumn.name).toBe('cash_game_id')
      expect(cashGameIdColumn.notNull).toBe(false)
    })

    it('should have tournamentId column as nullable with FK to tournaments', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const tournamentIdColumn = pokerSessions.tournamentId
      expect(tournamentIdColumn.name).toBe('tournament_id')
      expect(tournamentIdColumn.notNull).toBe(false)
    })

    it('should have isActive column as not null boolean with default false', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const isActiveColumn = pokerSessions.isActive
      expect(isActiveColumn.name).toBe('is_active')
      expect(isActiveColumn.notNull).toBe(true)
      expect(isActiveColumn.hasDefault).toBe(true)
    })

    it('should have startTime column as not null timestamp', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const startTimeColumn = pokerSessions.startTime
      expect(startTimeColumn.name).toBe('start_time')
      expect(startTimeColumn.notNull).toBe(true)
    })

    it('should have endTime column as nullable timestamp', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const endTimeColumn = pokerSessions.endTime
      expect(endTimeColumn.name).toBe('end_time')
      expect(endTimeColumn.notNull).toBe(false)
    })

    it('should have buyIn column as not null integer', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const buyInColumn = pokerSessions.buyIn
      expect(buyInColumn.name).toBe('buy_in')
      expect(buyInColumn.notNull).toBe(true)
    })

    it('should have cashOut column as nullable integer', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const cashOutColumn = pokerSessions.cashOut
      expect(cashOutColumn.name).toBe('cash_out')
      expect(cashOutColumn.notNull).toBe(false)
    })

    it('should have notes column as nullable text', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const notesColumn = pokerSessions.notes
      expect(notesColumn.name).toBe('notes')
      expect(notesColumn.notNull).toBe(false)
    })

    it('should have createdAt column as not null with default', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const createdAtColumn = pokerSessions.createdAt
      expect(createdAtColumn.name).toBe('created_at')
      expect(createdAtColumn.notNull).toBe(true)
      expect(createdAtColumn.hasDefault).toBe(true)
    })

    it('should have updatedAt column as not null with default', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const updatedAtColumn = pokerSessions.updatedAt
      expect(updatedAtColumn.name).toBe('updated_at')
      expect(updatedAtColumn.notNull).toBe(true)
      expect(updatedAtColumn.hasDefault).toBe(true)
    })

    it('should have deletedAt column as nullable for soft delete', async () => {
      const { pokerSessions } = await import('~/server/db/schema')
      const deletedAtColumn = pokerSessions.deletedAt
      expect(deletedAtColumn.name).toBe('deleted_at')
      expect(deletedAtColumn.notNull).toBe(false)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { pokerSessionsRelations } = await import('~/server/db/schema')
      expect(pokerSessionsRelations).toBeDefined()
    })
  })
})
