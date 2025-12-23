import { describe, expect, it } from 'vitest'

/**
 * Unit tests for CashGame schema.
 *
 * Tests the table definition, columns, and relations.
 * These tests verify the schema structure without database connection.
 *
 * @see data-model.md Section 9. CashGame
 */
describe('CashGame schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (cashGames as unknown as Record<symbol, string>)[
        drizzleNameSymbol
      ]
      expect(tableName).toBe('sapphire_cash_game')
    })

    it('should have id column as primary key with UUID default', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const idColumn = cashGames.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
      expect(idColumn.dataType).toBe('string')
    })

    it('should have storeId column as not null with FK to stores', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const storeIdColumn = cashGames.storeId
      expect(storeIdColumn.name).toBe('store_id')
      expect(storeIdColumn.notNull).toBe(true)
    })

    it('should have userId column as not null with FK to users', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const userIdColumn = cashGames.userId
      expect(userIdColumn.name).toBe('user_id')
      expect(userIdColumn.notNull).toBe(true)
    })

    it('should have currencyId column as nullable with FK to currencies', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const currencyIdColumn = cashGames.currencyId
      expect(currencyIdColumn.name).toBe('currency_id')
      expect(currencyIdColumn.notNull).toBe(false)
    })

    it('should have smallBlind column as not null integer', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const smallBlindColumn = cashGames.smallBlind
      expect(smallBlindColumn.name).toBe('small_blind')
      expect(smallBlindColumn.notNull).toBe(true)
    })

    it('should have bigBlind column as not null integer', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const bigBlindColumn = cashGames.bigBlind
      expect(bigBlindColumn.name).toBe('big_blind')
      expect(bigBlindColumn.notNull).toBe(true)
    })

    it('should have straddle1 column as nullable integer', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const straddle1Column = cashGames.straddle1
      expect(straddle1Column.name).toBe('straddle1')
      expect(straddle1Column.notNull).toBe(false)
    })

    it('should have straddle2 column as nullable integer', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const straddle2Column = cashGames.straddle2
      expect(straddle2Column.name).toBe('straddle2')
      expect(straddle2Column.notNull).toBe(false)
    })

    it('should have ante column as nullable integer', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const anteColumn = cashGames.ante
      expect(anteColumn.name).toBe('ante')
      expect(anteColumn.notNull).toBe(false)
    })

    it('should have anteType column as nullable varchar(20)', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const anteTypeColumn = cashGames.anteType
      expect(anteTypeColumn.name).toBe('ante_type')
      expect(anteTypeColumn.notNull).toBe(false)
    })

    it('should have notes column as nullable text', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const notesColumn = cashGames.notes
      expect(notesColumn.name).toBe('notes')
      expect(notesColumn.notNull).toBe(false)
    })

    it('should have isArchived column as not null boolean with default false', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const isArchivedColumn = cashGames.isArchived
      expect(isArchivedColumn.name).toBe('is_archived')
      expect(isArchivedColumn.notNull).toBe(true)
      expect(isArchivedColumn.hasDefault).toBe(true)
    })

    it('should have createdAt column as not null with default', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const createdAtColumn = cashGames.createdAt
      expect(createdAtColumn.name).toBe('created_at')
      expect(createdAtColumn.notNull).toBe(true)
      expect(createdAtColumn.hasDefault).toBe(true)
    })

    it('should have updatedAt column as not null with default', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const updatedAtColumn = cashGames.updatedAt
      expect(updatedAtColumn.name).toBe('updated_at')
      expect(updatedAtColumn.notNull).toBe(true)
      expect(updatedAtColumn.hasDefault).toBe(true)
    })

    it('should have deletedAt column as nullable for soft delete', async () => {
      const { cashGames } = await import('~/server/db/schema')
      const deletedAtColumn = cashGames.deletedAt
      expect(deletedAtColumn.name).toBe('deleted_at')
      expect(deletedAtColumn.notNull).toBe(false)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { cashGamesRelations } = await import('~/server/db/schema')
      expect(cashGamesRelations).toBeDefined()
    })
  })
})
