import { describe, expect, it } from 'vitest'

/**
 * Unit tests for Player schema.
 *
 * Tests the table definition, columns, and relations.
 * These tests verify the schema structure without database connection.
 *
 * @see data-model.md Section 16. Player
 */
describe('Player schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', async () => {
      const { players } = await import('~/server/db/schema')
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (players as unknown as Record<symbol, string>)[
        drizzleNameSymbol
      ]
      expect(tableName).toBe('sapphire_player')
    })

    it('should have id column as primary key with UUID default', async () => {
      const { players } = await import('~/server/db/schema')
      const idColumn = players.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
      expect(idColumn.dataType).toBe('string')
    })

    it('should have userId column as not null with FK to users', async () => {
      const { players } = await import('~/server/db/schema')
      const userIdColumn = players.userId
      expect(userIdColumn.name).toBe('user_id')
      expect(userIdColumn.notNull).toBe(true)
    })

    it('should have name column as not null varchar(255)', async () => {
      const { players } = await import('~/server/db/schema')
      const nameColumn = players.name
      expect(nameColumn.name).toBe('name')
      expect(nameColumn.notNull).toBe(true)
    })

    it('should have generalNotes column as nullable text', async () => {
      const { players } = await import('~/server/db/schema')
      const generalNotesColumn = players.generalNotes
      expect(generalNotesColumn.name).toBe('general_notes')
      expect(generalNotesColumn.notNull).toBe(false)
    })

    it('should have createdAt column as not null with default', async () => {
      const { players } = await import('~/server/db/schema')
      const createdAtColumn = players.createdAt
      expect(createdAtColumn.name).toBe('created_at')
      expect(createdAtColumn.notNull).toBe(true)
      expect(createdAtColumn.hasDefault).toBe(true)
    })

    it('should have updatedAt column as not null with default', async () => {
      const { players } = await import('~/server/db/schema')
      const updatedAtColumn = players.updatedAt
      expect(updatedAtColumn.name).toBe('updated_at')
      expect(updatedAtColumn.notNull).toBe(true)
      expect(updatedAtColumn.hasDefault).toBe(true)
    })

    it('should have deletedAt column as nullable for soft delete', async () => {
      const { players } = await import('~/server/db/schema')
      const deletedAtColumn = players.deletedAt
      expect(deletedAtColumn.name).toBe('deleted_at')
      expect(deletedAtColumn.notNull).toBe(false)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { playersRelations } = await import('~/server/db/schema')
      expect(playersRelations).toBeDefined()
    })
  })
})
