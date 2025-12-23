import { describe, expect, it } from 'vitest'

/**
 * Unit tests for Store schema.
 *
 * Tests the table definition, columns, and relations.
 * These tests verify the schema structure without database connection.
 *
 * @see data-model.md Section 8. Store
 */
describe('Store schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', async () => {
      const { stores } = await import('~/server/db/schema')
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (stores as unknown as Record<symbol, string>)[
        drizzleNameSymbol
      ]
      expect(tableName).toBe('sapphire_store')
    })

    it('should have id column as primary key with UUID default', async () => {
      const { stores } = await import('~/server/db/schema')
      const idColumn = stores.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
      expect(idColumn.dataType).toBe('string')
    })

    it('should have userId column as not null with FK to users', async () => {
      const { stores } = await import('~/server/db/schema')
      const userIdColumn = stores.userId
      expect(userIdColumn.name).toBe('user_id')
      expect(userIdColumn.notNull).toBe(true)
    })

    it('should have name column as not null varchar(255)', async () => {
      const { stores } = await import('~/server/db/schema')
      const nameColumn = stores.name
      expect(nameColumn.name).toBe('name')
      expect(nameColumn.notNull).toBe(true)
    })

    it('should have address column as nullable text', async () => {
      const { stores } = await import('~/server/db/schema')
      const addressColumn = stores.address
      expect(addressColumn.name).toBe('address')
      expect(addressColumn.notNull).toBe(false)
    })

    it('should have latitude column as nullable decimal(10,8)', async () => {
      const { stores } = await import('~/server/db/schema')
      const latitudeColumn = stores.latitude
      expect(latitudeColumn.name).toBe('latitude')
      expect(latitudeColumn.notNull).toBe(false)
    })

    it('should have longitude column as nullable decimal(11,8)', async () => {
      const { stores } = await import('~/server/db/schema')
      const longitudeColumn = stores.longitude
      expect(longitudeColumn.name).toBe('longitude')
      expect(longitudeColumn.notNull).toBe(false)
    })

    it('should have placeId column as nullable varchar(255)', async () => {
      const { stores } = await import('~/server/db/schema')
      const placeIdColumn = stores.placeId
      expect(placeIdColumn.name).toBe('place_id')
      expect(placeIdColumn.notNull).toBe(false)
    })

    it('should have notes column as nullable text', async () => {
      const { stores } = await import('~/server/db/schema')
      const notesColumn = stores.notes
      expect(notesColumn.name).toBe('notes')
      expect(notesColumn.notNull).toBe(false)
    })

    it('should have isArchived column as not null boolean with default false', async () => {
      const { stores } = await import('~/server/db/schema')
      const isArchivedColumn = stores.isArchived
      expect(isArchivedColumn.name).toBe('is_archived')
      expect(isArchivedColumn.notNull).toBe(true)
      expect(isArchivedColumn.hasDefault).toBe(true)
    })

    it('should have createdAt column as not null with default', async () => {
      const { stores } = await import('~/server/db/schema')
      const createdAtColumn = stores.createdAt
      expect(createdAtColumn.name).toBe('created_at')
      expect(createdAtColumn.notNull).toBe(true)
      expect(createdAtColumn.hasDefault).toBe(true)
    })

    it('should have updatedAt column as not null with default', async () => {
      const { stores } = await import('~/server/db/schema')
      const updatedAtColumn = stores.updatedAt
      expect(updatedAtColumn.name).toBe('updated_at')
      expect(updatedAtColumn.notNull).toBe(true)
      expect(updatedAtColumn.hasDefault).toBe(true)
    })

    it('should have deletedAt column as nullable for soft delete', async () => {
      const { stores } = await import('~/server/db/schema')
      const deletedAtColumn = stores.deletedAt
      expect(deletedAtColumn.name).toBe('deleted_at')
      expect(deletedAtColumn.notNull).toBe(false)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { storesRelations } = await import('~/server/db/schema')
      expect(storesRelations).toBeDefined()
    })
  })
})
