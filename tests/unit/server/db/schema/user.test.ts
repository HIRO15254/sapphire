import { describe, expect, it } from 'vitest'
import { users, usersRelations } from '~/server/db/schema'

describe('User schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', () => {
      // Drizzle tables have a Symbol for the table name
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (users as unknown as Record<symbol, string>)[
        drizzleNameSymbol
      ]
      expect(tableName).toBe('sapphire_user')
    })

    it('should have id column as primary key with UUID default', () => {
      const idColumn = users.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
      expect(idColumn.dataType).toBe('string')
    })

    it('should have name column as nullable varchar(255)', () => {
      const nameColumn = users.name
      expect(nameColumn.name).toBe('name')
      expect(nameColumn.notNull).toBe(false)
    })

    it('should have email column as not null', () => {
      const emailColumn = users.email
      expect(emailColumn.name).toBe('email')
      expect(emailColumn.notNull).toBe(true)
    })

    it('should have emailVerified column as nullable timestamp', () => {
      const emailVerifiedColumn = users.emailVerified
      expect(emailVerifiedColumn.name).toBe('email_verified')
      expect(emailVerifiedColumn.notNull).toBe(false)
    })

    it('should have image column as nullable varchar', () => {
      const imageColumn = users.image
      expect(imageColumn.name).toBe('image')
      expect(imageColumn.notNull).toBe(false)
    })

    it('should have passwordHash column as nullable varchar for credentials auth', () => {
      const passwordHashColumn = users.passwordHash
      expect(passwordHashColumn.name).toBe('password_hash')
      expect(passwordHashColumn.notNull).toBe(false)
    })

    it('should have createdAt column as not null with default', () => {
      const createdAtColumn = users.createdAt
      expect(createdAtColumn.name).toBe('created_at')
      expect(createdAtColumn.notNull).toBe(true)
      expect(createdAtColumn.hasDefault).toBe(true)
    })

    it('should have updatedAt column as not null with default', () => {
      const updatedAtColumn = users.updatedAt
      expect(updatedAtColumn.name).toBe('updated_at')
      expect(updatedAtColumn.notNull).toBe(true)
      expect(updatedAtColumn.hasDefault).toBe(true)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', () => {
      expect(usersRelations).toBeDefined()
    })
  })
})
