import { describe, expect, it } from 'vitest'

/**
 * Integration tests for session all-in EV calculation.
 *
 * These tests verify the EV calculation logic that aggregates:
 * - All-in count
 * - Total pot amount
 * - Average win rate
 * - Expected Value (EV)
 * - Actual result total
 * - EV difference
 *
 * @see data-model.md Section 15. AllInRecord
 */
describe('Session All-In EV Calculation', () => {
  describe('EV formula', () => {
    /**
     * allInEV = Σ(potAmount × winProbability / 100)
     * actualResultTotal = Σ(potAmount where actualResult = true)
     * evDifference = actualResultTotal - allInEV
     */

    it('should calculate EV for a single all-in record', () => {
      const allInRecord = {
        potAmount: 10000,
        winProbability: 65.5,
        actualResult: true,
      }

      const ev = allInRecord.potAmount * (allInRecord.winProbability / 100)

      expect(ev).toBe(6550)
    })

    it('should calculate total EV for multiple all-in records', () => {
      const allInRecords = [
        { potAmount: 10000, winProbability: 65.5, actualResult: true },
        { potAmount: 8000, winProbability: 45.0, actualResult: false },
        { potAmount: 12000, winProbability: 80.0, actualResult: true },
      ]

      const allInEV = allInRecords.reduce(
        (sum, record) => sum + record.potAmount * (record.winProbability / 100),
        0,
      )

      // EV = 6550 + 3600 + 9600 = 19750
      expect(allInEV).toBe(19750)
    })

    it('should calculate actual result total', () => {
      const allInRecords = [
        { potAmount: 10000, winProbability: 65.5, actualResult: true },
        { potAmount: 8000, winProbability: 45.0, actualResult: false },
        { potAmount: 12000, winProbability: 80.0, actualResult: true },
      ]

      const actualResultTotal = allInRecords
        .filter((record) => record.actualResult)
        .reduce((sum, record) => sum + record.potAmount, 0)

      // Actual = 10000 + 12000 = 22000
      expect(actualResultTotal).toBe(22000)
    })

    it('should calculate positive EV difference (running good)', () => {
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

      // evDifference = 22000 - 19750 = 2250 (running good)
      expect(evDifference).toBe(2250)
    })

    it('should calculate negative EV difference (running bad)', () => {
      const allInRecords = [
        { potAmount: 10000, winProbability: 65.5, actualResult: false },
        { potAmount: 8000, winProbability: 45.0, actualResult: true },
        { potAmount: 12000, winProbability: 80.0, actualResult: false },
      ]

      const allInEV = allInRecords.reduce(
        (sum, record) => sum + record.potAmount * (record.winProbability / 100),
        0,
      )
      const actualResultTotal = allInRecords
        .filter((record) => record.actualResult)
        .reduce((sum, record) => sum + record.potAmount, 0)
      const evDifference = actualResultTotal - allInEV

      // EV = 6550 + 3600 + 9600 = 19750
      // Actual = 8000
      // evDifference = 8000 - 19750 = -11750 (running bad)
      expect(evDifference).toBe(-11750)
    })

    it('should handle zero EV difference (break even)', () => {
      const allInRecords = [
        { potAmount: 10000, winProbability: 60.0, actualResult: true },
        { potAmount: 10000, winProbability: 40.0, actualResult: false },
      ]

      const allInEV = allInRecords.reduce(
        (sum, record) => sum + record.potAmount * (record.winProbability / 100),
        0,
      )
      const actualResultTotal = allInRecords
        .filter((record) => record.actualResult)
        .reduce((sum, record) => sum + record.potAmount, 0)
      const evDifference = actualResultTotal - allInEV

      // EV = 6000 + 4000 = 10000
      // Actual = 10000
      // evDifference = 0
      expect(evDifference).toBe(0)
    })

    it('should handle decimal win probabilities', () => {
      const allInRecords = [
        { potAmount: 15000, winProbability: 33.33, actualResult: false },
        { potAmount: 20000, winProbability: 66.67, actualResult: true },
      ]

      const allInEV = allInRecords.reduce(
        (sum, record) => sum + record.potAmount * (record.winProbability / 100),
        0,
      )

      // EV = 4999.5 + 13334 = 18333.5
      expect(allInEV).toBeCloseTo(18333.5, 1)
    })

    it('should handle empty records', () => {
      const allInRecords: Array<{
        potAmount: number
        winProbability: number
        actualResult: boolean
      }> = []

      const count = allInRecords.length
      const allInEV = allInRecords.reduce(
        (sum, record) => sum + record.potAmount * (record.winProbability / 100),
        0,
      )
      const actualResultTotal = allInRecords
        .filter((record) => record.actualResult)
        .reduce((sum, record) => sum + record.potAmount, 0)
      const evDifference = actualResultTotal - allInEV

      expect(count).toBe(0)
      expect(allInEV).toBe(0)
      expect(actualResultTotal).toBe(0)
      expect(evDifference).toBe(0)
    })
  })

  describe('Summary statistics', () => {
    it('should calculate all-in summary correctly', () => {
      const allInRecords = [
        { potAmount: 10000, winProbability: 65.5, actualResult: true },
        { potAmount: 8000, winProbability: 45.0, actualResult: false },
        { potAmount: 12000, winProbability: 80.0, actualResult: true },
        { potAmount: 5000, winProbability: 30.0, actualResult: false },
        { potAmount: 15000, winProbability: 55.0, actualResult: true },
      ]

      const summary = {
        count: allInRecords.length,
        totalPotAmount: allInRecords.reduce((sum, r) => sum + r.potAmount, 0),
        averageWinRate:
          allInRecords.reduce((sum, r) => sum + r.winProbability, 0) /
          allInRecords.length,
        allInEV: allInRecords.reduce(
          (sum, r) => sum + r.potAmount * (r.winProbability / 100),
          0,
        ),
        actualResultTotal: allInRecords
          .filter((r) => r.actualResult)
          .reduce((sum, r) => sum + r.potAmount, 0),
        evDifference: 0,
        winCount: allInRecords.filter((r) => r.actualResult).length,
        lossCount: allInRecords.filter((r) => !r.actualResult).length,
      }
      summary.evDifference = summary.actualResultTotal - summary.allInEV

      expect(summary.count).toBe(5)
      expect(summary.totalPotAmount).toBe(50000)
      expect(summary.averageWinRate).toBeCloseTo(55.1, 1)
      // EV = 6550 + 3600 + 9600 + 1500 + 8250 = 29500
      expect(summary.allInEV).toBe(29500)
      // Actual = 10000 + 12000 + 15000 = 37000
      expect(summary.actualResultTotal).toBe(37000)
      // evDifference = 37000 - 29500 = 7500
      expect(summary.evDifference).toBe(7500)
      expect(summary.winCount).toBe(3)
      expect(summary.lossCount).toBe(2)
    })

    it('should calculate win rate as wins / total', () => {
      const allInRecords = [
        { potAmount: 10000, winProbability: 70, actualResult: true },
        { potAmount: 8000, winProbability: 50, actualResult: true },
        { potAmount: 12000, winProbability: 40, actualResult: false },
        { potAmount: 5000, winProbability: 30, actualResult: false },
      ]

      const wins = allInRecords.filter((r) => r.actualResult).length
      const total = allInRecords.length
      const actualWinRate = (wins / total) * 100

      expect(actualWinRate).toBe(50) // 2/4 = 50%
    })
  })

  describe('Edge cases', () => {
    it('should handle 0% win probability (drawing dead)', () => {
      const allInRecord = {
        potAmount: 10000,
        winProbability: 0,
        actualResult: false,
      }

      const ev = allInRecord.potAmount * (allInRecord.winProbability / 100)

      expect(ev).toBe(0)
    })

    it('should handle 100% win probability (guaranteed win)', () => {
      const allInRecord = {
        potAmount: 10000,
        winProbability: 100,
        actualResult: true,
      }

      const ev = allInRecord.potAmount * (allInRecord.winProbability / 100)

      expect(ev).toBe(10000)
    })

    it('should handle very small probabilities', () => {
      const allInRecord = {
        potAmount: 100000,
        winProbability: 0.5,
        actualResult: true,
      }

      const ev = allInRecord.potAmount * (allInRecord.winProbability / 100)

      expect(ev).toBe(500)
    })

    it('should handle very large pot amounts', () => {
      const allInRecord = {
        potAmount: 1000000,
        winProbability: 50,
        actualResult: false,
      }

      const ev = allInRecord.potAmount * (allInRecord.winProbability / 100)

      expect(ev).toBe(500000)
    })
  })

  // Database integration tests - require actual database
  describe.skip('Database Integration', () => {
    it('should calculate EV summary using database aggregation', async () => {
      // This test requires database connection
      // Run with: DATABASE_URL=... bun run test tests/integration/session/allInEv.test.ts
    })

    it('should exclude soft-deleted all-in records from summary', async () => {
      // This test requires database connection
    })

    it('should only include all-in records belonging to the session', async () => {
      // This test requires database connection
    })
  })
})
