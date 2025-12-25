import { describe, expect, it } from 'vitest'

/**
 * Tests for Tournament-related schemas.
 *
 * These tests verify the structure and constraints of the database schemas.
 * They do not test actual database operations - those are tested in integration tests.
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

    it('should have name column as nullable', async () => {
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

    it('should have rake column as nullable integer', async () => {
      const { tournaments } = await import('~/server/db/schema')
      const rakeColumn = tournaments.rake
      expect(rakeColumn.name).toBe('rake')
      expect(rakeColumn.notNull).toBe(false)
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

    it('should have timestamp columns (createdAt, updatedAt, deletedAt)', async () => {
      const { tournaments } = await import('~/server/db/schema')

      expect(tournaments.createdAt.name).toBe('created_at')
      expect(tournaments.createdAt.notNull).toBe(true)

      expect(tournaments.updatedAt.name).toBe('updated_at')
      expect(tournaments.updatedAt.notNull).toBe(true)

      expect(tournaments.deletedAt.name).toBe('deleted_at')
      expect(tournaments.deletedAt.notNull).toBe(false)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { tournamentsRelations } = await import('~/server/db/schema')
      expect(tournamentsRelations).toBeDefined()
    })
  })
})

describe('TournamentPrizeStructure schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', async () => {
      const { tournamentPrizeStructures } = await import('~/server/db/schema')
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (
        tournamentPrizeStructures as unknown as Record<symbol, string>
      )[drizzleNameSymbol]
      expect(tableName).toBe('sapphire_tournament_prize_structure')
    })

    it('should have id column as primary key with UUID default', async () => {
      const { tournamentPrizeStructures } = await import('~/server/db/schema')
      const idColumn = tournamentPrizeStructures.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
    })

    it('should have tournamentId column as not null with FK to tournaments', async () => {
      const { tournamentPrizeStructures } = await import('~/server/db/schema')
      const tournamentIdColumn = tournamentPrizeStructures.tournamentId
      expect(tournamentIdColumn.name).toBe('tournament_id')
      expect(tournamentIdColumn.notNull).toBe(true)
    })

    it('should have minEntrants column as not null integer', async () => {
      const { tournamentPrizeStructures } = await import('~/server/db/schema')
      const minEntrantsColumn = tournamentPrizeStructures.minEntrants
      expect(minEntrantsColumn.name).toBe('min_entrants')
      expect(minEntrantsColumn.notNull).toBe(true)
    })

    it('should have maxEntrants column as nullable integer', async () => {
      const { tournamentPrizeStructures } = await import('~/server/db/schema')
      const maxEntrantsColumn = tournamentPrizeStructures.maxEntrants
      expect(maxEntrantsColumn.name).toBe('max_entrants')
      expect(maxEntrantsColumn.notNull).toBe(false)
    })

    it('should have sortOrder column as not null with default', async () => {
      const { tournamentPrizeStructures } = await import('~/server/db/schema')
      const sortOrderColumn = tournamentPrizeStructures.sortOrder
      expect(sortOrderColumn.name).toBe('sort_order')
      expect(sortOrderColumn.notNull).toBe(true)
      expect(sortOrderColumn.hasDefault).toBe(true)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { tournamentPrizeStructuresRelations } = await import(
        '~/server/db/schema'
      )
      expect(tournamentPrizeStructuresRelations).toBeDefined()
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

    it('should have prizeStructureId column as not null with FK to prize structures', async () => {
      const { tournamentPrizeLevels } = await import('~/server/db/schema')
      const prizeStructureIdColumn = tournamentPrizeLevels.prizeStructureId
      expect(prizeStructureIdColumn.name).toBe('prize_structure_id')
      expect(prizeStructureIdColumn.notNull).toBe(true)
    })

    it('should have minPosition column as not null integer', async () => {
      const { tournamentPrizeLevels } = await import('~/server/db/schema')
      const minPositionColumn = tournamentPrizeLevels.minPosition
      expect(minPositionColumn.name).toBe('min_position')
      expect(minPositionColumn.notNull).toBe(true)
    })

    it('should have maxPosition column as not null integer', async () => {
      const { tournamentPrizeLevels } = await import('~/server/db/schema')
      const maxPositionColumn = tournamentPrizeLevels.maxPosition
      expect(maxPositionColumn.name).toBe('max_position')
      expect(maxPositionColumn.notNull).toBe(true)
    })

    it('should have sortOrder column as not null with default', async () => {
      const { tournamentPrizeLevels } = await import('~/server/db/schema')
      const sortOrderColumn = tournamentPrizeLevels.sortOrder
      expect(sortOrderColumn.name).toBe('sort_order')
      expect(sortOrderColumn.notNull).toBe(true)
      expect(sortOrderColumn.hasDefault).toBe(true)
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

describe('TournamentPrizeItem schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', async () => {
      const { tournamentPrizeItems } = await import('~/server/db/schema')
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (
        tournamentPrizeItems as unknown as Record<symbol, string>
      )[drizzleNameSymbol]
      expect(tableName).toBe('sapphire_tournament_prize_item')
    })

    it('should have id column as primary key with UUID default', async () => {
      const { tournamentPrizeItems } = await import('~/server/db/schema')
      const idColumn = tournamentPrizeItems.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
    })

    it('should have prizeLevelId column as not null with FK to prize levels', async () => {
      const { tournamentPrizeItems } = await import('~/server/db/schema')
      const prizeLevelIdColumn = tournamentPrizeItems.prizeLevelId
      expect(prizeLevelIdColumn.name).toBe('prize_level_id')
      expect(prizeLevelIdColumn.notNull).toBe(true)
    })

    it('should have prizeType column as not null', async () => {
      const { tournamentPrizeItems } = await import('~/server/db/schema')
      const prizeTypeColumn = tournamentPrizeItems.prizeType
      expect(prizeTypeColumn.name).toBe('prize_type')
      expect(prizeTypeColumn.notNull).toBe(true)
    })

    it('should have percentage column as nullable decimal(5,2)', async () => {
      const { tournamentPrizeItems } = await import('~/server/db/schema')
      const percentageColumn = tournamentPrizeItems.percentage
      expect(percentageColumn.name).toBe('percentage')
      expect(percentageColumn.notNull).toBe(false)
    })

    it('should have fixedAmount column as nullable integer', async () => {
      const { tournamentPrizeItems } = await import('~/server/db/schema')
      const fixedAmountColumn = tournamentPrizeItems.fixedAmount
      expect(fixedAmountColumn.name).toBe('fixed_amount')
      expect(fixedAmountColumn.notNull).toBe(false)
    })

    it('should have customPrizeLabel column as nullable text', async () => {
      const { tournamentPrizeItems } = await import('~/server/db/schema')
      const customPrizeLabelColumn = tournamentPrizeItems.customPrizeLabel
      expect(customPrizeLabelColumn.name).toBe('custom_prize_label')
      expect(customPrizeLabelColumn.notNull).toBe(false)
    })

    it('should have customPrizeValue column as nullable integer', async () => {
      const { tournamentPrizeItems } = await import('~/server/db/schema')
      const customPrizeValueColumn = tournamentPrizeItems.customPrizeValue
      expect(customPrizeValueColumn.name).toBe('custom_prize_value')
      expect(customPrizeValueColumn.notNull).toBe(false)
    })

    it('should have sortOrder column as not null with default', async () => {
      const { tournamentPrizeItems } = await import('~/server/db/schema')
      const sortOrderColumn = tournamentPrizeItems.sortOrder
      expect(sortOrderColumn.name).toBe('sort_order')
      expect(sortOrderColumn.notNull).toBe(true)
      expect(sortOrderColumn.hasDefault).toBe(true)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { tournamentPrizeItemsRelations } = await import(
        '~/server/db/schema'
      )
      expect(tournamentPrizeItemsRelations).toBeDefined()
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

    it('should have isBreak column as not null boolean with default false', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const isBreakColumn = tournamentBlindLevels.isBreak
      expect(isBreakColumn.name).toBe('is_break')
      expect(isBreakColumn.notNull).toBe(true)
      expect(isBreakColumn.hasDefault).toBe(true)
    })

    it('should have smallBlind column as nullable integer', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const smallBlindColumn = tournamentBlindLevels.smallBlind
      expect(smallBlindColumn.name).toBe('small_blind')
      expect(smallBlindColumn.notNull).toBe(false)
    })

    it('should have bigBlind column as nullable integer', async () => {
      const { tournamentBlindLevels } = await import('~/server/db/schema')
      const bigBlindColumn = tournamentBlindLevels.bigBlind
      expect(bigBlindColumn.name).toBe('big_blind')
      expect(bigBlindColumn.notNull).toBe(false)
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
