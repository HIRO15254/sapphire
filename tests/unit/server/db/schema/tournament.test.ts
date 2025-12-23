import { describe, expect, it } from 'vitest'

/**
 * Unit tests for Tournament schema and related tables.
 *
 * Tests the table definition, columns, and relations.
 * These tests verify the schema structure without database connection.
 *
 * @see data-model.md Section 10-12. Tournament, TournamentPrizeLevel, TournamentBlindLevel
 */
describe('Tournament schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (tournaments as unknown as Record<symbol, string>)[
        drizzleNameSymbol
      ]
      expect(tableName).toBe('sapphire_tournament')
    })

    it('should have id column as primary key with UUID default', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const idColumn = tournaments.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
      expect(idColumn.dataType).toBe('string')
    })

    it('should have storeId column as not null with FK to stores', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const storeIdColumn = tournaments.storeId
      expect(storeIdColumn.name).toBe('store_id')
      expect(storeIdColumn.notNull).toBe(true)
    })

    it('should have userId column as not null with FK to users', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const userIdColumn = tournaments.userId
      expect(userIdColumn.name).toBe('user_id')
      expect(userIdColumn.notNull).toBe(true)
    })

    it('should have currencyId column as nullable with FK to currencies', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const currencyIdColumn = tournaments.currencyId
      expect(currencyIdColumn.name).toBe('currency_id')
      expect(currencyIdColumn.notNull).toBe(false)
    })

    it('should have name column as nullable varchar(255)', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const nameColumn = tournaments.name
      expect(nameColumn.name).toBe('name')
      expect(nameColumn.notNull).toBe(false)
    })

    it('should have buyIn column as not null integer', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const buyInColumn = tournaments.buyIn
      expect(buyInColumn.name).toBe('buy_in')
      expect(buyInColumn.notNull).toBe(true)
    })

    it('should have startingStack column as nullable integer', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const startingStackColumn = tournaments.startingStack
      expect(startingStackColumn.name).toBe('starting_stack')
      expect(startingStackColumn.notNull).toBe(false)
    })

    it('should have notes column as nullable text', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const notesColumn = tournaments.notes
      expect(notesColumn.name).toBe('notes')
      expect(notesColumn.notNull).toBe(false)
    })

    it('should have isArchived column as not null boolean with default false', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const isArchivedColumn = tournaments.isArchived
      expect(isArchivedColumn.name).toBe('is_archived')
      expect(isArchivedColumn.notNull).toBe(true)
      expect(isArchivedColumn.hasDefault).toBe(true)
    })

    it('should have createdAt column as not null with default', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const createdAtColumn = tournaments.createdAt
      expect(createdAtColumn.name).toBe('created_at')
      expect(createdAtColumn.notNull).toBe(true)
      expect(createdAtColumn.hasDefault).toBe(true)
    })

    it('should have updatedAt column as not null with default', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const updatedAtColumn = tournaments.updatedAt
      expect(updatedAtColumn.name).toBe('updated_at')
      expect(updatedAtColumn.notNull).toBe(true)
      expect(updatedAtColumn.hasDefault).toBe(true)
    })

    it('should have deletedAt column as nullable for soft delete', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const deletedAtColumn = tournaments.deletedAt
      expect(deletedAtColumn.name).toBe('deleted_at')
      expect(deletedAtColumn.notNull).toBe(false)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { tournamentsRelations } = await import('~/server/db/schema')
      expect(tournamentsRelations).toBeDefined()
    })
  })
})

describe('TournamentPrizeLevel schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', async () => {
      const { tournamentPrizeLevels } = await import('~/server/db/schema')
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (
        tournamentPrizeLevels as unknown as Record<symbol, string>
      )[drizzleNameSymbol]
      expect(tableName).toBe('sapphire_tournament_prize_level')
    })

    it('should have id column as primary key with UUID default', async () => {
      const { tournamentPrizeLevels } = await import('~/server/db/schema')
      const idColumn = tournamentPrizeLevels.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
    })

    it('should have tournamentId column as not null with FK to tournaments', async () => {
      const { tournamentPrizeLevels } = await import('~/server/db/schema')
      const tournamentIdColumn = tournamentPrizeLevels.tournamentId
      expect(tournamentIdColumn.name).toBe('tournament_id')
      expect(tournamentIdColumn.notNull).toBe(true)
    })

    it('should have position column as not null integer', async () => {
      const { tournamentPrizeLevels } = await import('~/server/db/schema')
      const positionColumn = tournamentPrizeLevels.position
      expect(positionColumn.name).toBe('position')
      expect(positionColumn.notNull).toBe(true)
    })

    it('should have percentage column as nullable decimal(5,2)', async () => {
      const { tournamentPrizeLevels } = await import('~/server/db/schema')
      const percentageColumn = tournamentPrizeLevels.percentage
      expect(percentageColumn.name).toBe('percentage')
      expect(percentageColumn.notNull).toBe(false)
    })

    it('should have fixedAmount column as nullable integer', async () => {
      const { tournamentPrizeLevels } = await import('~/server/db/schema')
      const fixedAmountColumn = tournamentPrizeLevels.fixedAmount
      expect(fixedAmountColumn.name).toBe('fixed_amount')
      expect(fixedAmountColumn.notNull).toBe(false)
    })

    it('should have createdAt column as not null with default', async () => {
      const { tournamentPrizeLevels } = await import('~/server/db/schema')
      const createdAtColumn = tournamentPrizeLevels.createdAt
      expect(createdAtColumn.name).toBe('created_at')
      expect(createdAtColumn.notNull).toBe(true)
      expect(createdAtColumn.hasDefault).toBe(true)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { tournamentPrizeLevelsRelations } = await import(
        '~/server/db/schema'
      )
      expect(tournamentPrizeLevelsRelations).toBeDefined()
    })
  })
})

describe('TournamentBlindLevel schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (
        tournamentBlindLevels as unknown as Record<symbol, string>
      )[drizzleNameSymbol]
      expect(tableName).toBe('sapphire_tournament_blind_level')
    })

    it('should have id column as primary key with UUID default', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const idColumn = tournamentBlindLevels.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
    })

    it('should have tournamentId column as not null with FK to tournaments', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const tournamentIdColumn = tournamentBlindLevels.tournamentId
      expect(tournamentIdColumn.name).toBe('tournament_id')
      expect(tournamentIdColumn.notNull).toBe(true)
    })

    it('should have level column as not null integer', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const levelColumn = tournamentBlindLevels.level
      expect(levelColumn.name).toBe('level')
      expect(levelColumn.notNull).toBe(true)
    })

    it('should have smallBlind column as not null integer', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const smallBlindColumn = tournamentBlindLevels.smallBlind
      expect(smallBlindColumn.name).toBe('small_blind')
      expect(smallBlindColumn.notNull).toBe(true)
    })

    it('should have bigBlind column as not null integer', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const bigBlindColumn = tournamentBlindLevels.bigBlind
      expect(bigBlindColumn.name).toBe('big_blind')
      expect(bigBlindColumn.notNull).toBe(true)
    })

    it('should have ante column as nullable integer', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const anteColumn = tournamentBlindLevels.ante
      expect(anteColumn.name).toBe('ante')
      expect(anteColumn.notNull).toBe(false)
    })

    it('should have durationMinutes column as not null integer', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const durationMinutesColumn = tournamentBlindLevels.durationMinutes
      expect(durationMinutesColumn.name).toBe('duration_minutes')
      expect(durationMinutesColumn.notNull).toBe(true)
    })

    it('should have createdAt column as not null with default', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const createdAtColumn = tournamentBlindLevels.createdAt
      expect(createdAtColumn.name).toBe('created_at')
      expect(createdAtColumn.notNull).toBe(true)
      expect(createdAtColumn.hasDefault).toBe(true)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { tournamentBlindLevelsRelations } = await import(
        '~/server/db/schema'
      )
      expect(tournamentBlindLevelsRelations).toBeDefined()
    })
  })
})
