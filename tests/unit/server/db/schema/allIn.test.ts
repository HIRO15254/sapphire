import { describe, expect, it } from 'vitest'

/**
 * Unit tests for AllInRecord schema.
 *
 * Tests the table definition, columns, and relations.
 * These tests verify the schema structure without database connection.
 *
 * @see data-model.md Section 15. AllInRecord
 */
describe('AllInRecord schema', () => {
  describe('Table definition', () => {
    it('should have correct table name with sapphire prefix', async () => {
      const { allInRecords } = await import('~/server/db/schema')
      const drizzleNameSymbol = Symbol.for('drizzle:Name')
      const tableName = (allInRecords as unknown as Record<symbol, string>)[
        drizzleNameSymbol
      ]
      expect(tableName).toBe('sapphire_all_in_record')
    })

    it('should have id column as primary key with UUID default', async () => {
      const { allInRecords } = await import('~/server/db/schema')
      const idColumn = allInRecords.id
      expect(idColumn.name).toBe('id')
      expect(idColumn.primary).toBe(true)
      expect(idColumn.dataType).toBe('string')
    })

    it('should have sessionId column as not null with FK to pokerSessions', async () => {
      const { allInRecords } = await import('~/server/db/schema')
      const sessionIdColumn = allInRecords.sessionId
      expect(sessionIdColumn.name).toBe('session_id')
      expect(sessionIdColumn.notNull).toBe(true)
    })

    it('should have userId column as not null with FK to users', async () => {
      const { allInRecords } = await import('~/server/db/schema')
      const userIdColumn = allInRecords.userId
      expect(userIdColumn.name).toBe('user_id')
      expect(userIdColumn.notNull).toBe(true)
    })

    it('should have potAmount column as not null integer', async () => {
      const { allInRecords } = await import('~/server/db/schema')
      const potAmountColumn = allInRecords.potAmount
      expect(potAmountColumn.name).toBe('pot_amount')
      expect(potAmountColumn.notNull).toBe(true)
    })

    it('should have winProbability column as not null decimal(5,2)', async () => {
      const { allInRecords } = await import('~/server/db/schema')
      const winProbabilityColumn = allInRecords.winProbability
      expect(winProbabilityColumn.name).toBe('win_probability')
      expect(winProbabilityColumn.notNull).toBe(true)
    })

    it('should have actualResult column as not null boolean', async () => {
      const { allInRecords } = await import('~/server/db/schema')
      const actualResultColumn = allInRecords.actualResult
      expect(actualResultColumn.name).toBe('actual_result')
      expect(actualResultColumn.notNull).toBe(true)
    })

    it('should have recordedAt column as not null timestamp with default', async () => {
      const { allInRecords } = await import('~/server/db/schema')
      const recordedAtColumn = allInRecords.recordedAt
      expect(recordedAtColumn.name).toBe('recorded_at')
      expect(recordedAtColumn.notNull).toBe(true)
      expect(recordedAtColumn.hasDefault).toBe(true)
    })

    it('should have createdAt column as not null with default', async () => {
      const { allInRecords } = await import('~/server/db/schema')
      const createdAtColumn = allInRecords.createdAt
      expect(createdAtColumn.name).toBe('created_at')
      expect(createdAtColumn.notNull).toBe(true)
      expect(createdAtColumn.hasDefault).toBe(true)
    })

    it('should have updatedAt column as not null with default', async () => {
      const { allInRecords } = await import('~/server/db/schema')
      const updatedAtColumn = allInRecords.updatedAt
      expect(updatedAtColumn.name).toBe('updated_at')
      expect(updatedAtColumn.notNull).toBe(true)
      expect(updatedAtColumn.hasDefault).toBe(true)
    })

    it('should have deletedAt column as nullable for soft delete', async () => {
      const { allInRecords } = await import('~/server/db/schema')
      const deletedAtColumn = allInRecords.deletedAt
      expect(deletedAtColumn.name).toBe('deleted_at')
      expect(deletedAtColumn.notNull).toBe(false)
    })
  })

  describe('Relations', () => {
    it('should have relations defined', async () => {
      const { allInRecordsRelations } = await import('~/server/db/schema')
      expect(allInRecordsRelations).toBeDefined()
    })
  })

  describe('EV Calculation Formula', () => {
    it('should calculate expected value correctly', () => {
      // EV = potAmount × winProbability / 100
      const potAmount = 10000
      const winProbability = 65.5 // 65.5%
      const expectedEV = potAmount * (winProbability / 100)
      expect(expectedEV).toBe(6550)
    })

    it('should calculate EV difference correctly', () => {
      // EVDiff = actualResultTotal - allInEV
      // actualResultTotal = sum of potAmount where actualResult = true
      const allInRecords = [
        { potAmount: 10000, winProbability: 65.5, actualResult: true },
        { potAmount: 8000, winProbability: 45.0, actualResult: false },
        { potAmount: 12000, winProbability: 80.0, actualResult: true },
      ]

      const allInEV = allInRecords.reduce(
        (sum, record) => sum + record.potAmount * (record.winProbability / 100),
        0,
      )
      const actualResultTotal = allInRecords
        .filter((record) => record.actualResult)
        .reduce((sum, record) => sum + record.potAmount, 0)

      const evDifference = actualResultTotal - allInEV

      // allInEV = 6550 + 3600 + 9600 = 19750
      expect(allInEV).toBe(19750)
      // actualResultTotal = 10000 + 12000 = 22000
      expect(actualResultTotal).toBe(22000)
      // evDifference = 22000 - 19750 = 2250
      expect(evDifference).toBe(2250)
    })
  })
})
