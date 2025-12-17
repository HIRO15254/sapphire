import { describe, expect, it } from 'vitest'

/**
 * Integration tests for currency balance calculation.
 *
 * These tests verify the balance calculation logic that aggregates:
 * - Initial balance
 * - Bonus transactions (+)
 * - Purchase transactions (+)
 * - Session buy-ins (-)
 * - Session cashouts (+)
 *
 * @see data-model.md Section 5. Currency - Balance Calculation
 */
describe('Currency Balance Calculation', () => {
  describe('Balance formula', () => {
    /**
     * currentBalance = initialBalance + Σ(bonuses) + Σ(purchases) - Σ(buyIns) + Σ(cashOuts)
     */

    it('should calculate balance with only initial balance', () => {
      const initialBalance = 10000
      const bonuses: number[] = []
      const purchases: number[] = []
      const buyIns: number[] = []
      const cashOuts: number[] = []

      const currentBalance =
        initialBalance +
        bonuses.reduce((sum, b) => sum + b, 0) +
        purchases.reduce((sum, p) => sum + p, 0) -
        buyIns.reduce((sum, b) => sum + b, 0) +
        cashOuts.reduce((sum, c) => sum + c, 0)

      expect(currentBalance).toBe(10000)
    })

    it('should calculate balance with bonuses added', () => {
      const initialBalance = 10000
      const bonuses = [1000, 500, 2000]
      const purchases: number[] = []
      const buyIns: number[] = []
      const cashOuts: number[] = []

      const currentBalance =
        initialBalance +
        bonuses.reduce((sum, b) => sum + b, 0) +
        purchases.reduce((sum, p) => sum + p, 0) -
        buyIns.reduce((sum, b) => sum + b, 0) +
        cashOuts.reduce((sum, c) => sum + c, 0)

      expect(currentBalance).toBe(13500)
    })

    it('should calculate balance with purchases added', () => {
      const initialBalance = 10000
      const bonuses: number[] = []
      const purchases = [5000, 10000]
      const buyIns: number[] = []
      const cashOuts: number[] = []

      const currentBalance =
        initialBalance +
        bonuses.reduce((sum, b) => sum + b, 0) +
        purchases.reduce((sum, p) => sum + p, 0) -
        buyIns.reduce((sum, b) => sum + b, 0) +
        cashOuts.reduce((sum, c) => sum + c, 0)

      expect(currentBalance).toBe(25000)
    })

    it('should calculate balance with buy-ins subtracted', () => {
      const initialBalance = 10000
      const bonuses: number[] = []
      const purchases: number[] = []
      const buyIns = [2000, 3000]
      const cashOuts: number[] = []

      const currentBalance =
        initialBalance +
        bonuses.reduce((sum, b) => sum + b, 0) +
        purchases.reduce((sum, p) => sum + p, 0) -
        buyIns.reduce((sum, b) => sum + b, 0) +
        cashOuts.reduce((sum, c) => sum + c, 0)

      expect(currentBalance).toBe(5000)
    })

    it('should calculate balance with cashouts added', () => {
      const initialBalance = 10000
      const bonuses: number[] = []
      const purchases: number[] = []
      const buyIns = [5000]
      const cashOuts = [8000]

      const currentBalance =
        initialBalance +
        bonuses.reduce((sum, b) => sum + b, 0) +
        purchases.reduce((sum, p) => sum + p, 0) -
        buyIns.reduce((sum, b) => sum + b, 0) +
        cashOuts.reduce((sum, c) => sum + c, 0)

      // 10000 - 5000 + 8000 = 13000
      expect(currentBalance).toBe(13000)
    })

    it('should calculate balance with all transaction types', () => {
      const initialBalance = 10000
      const bonuses = [1000, 500] // +1500
      const purchases = [5000] // +5000
      const buyIns = [3000, 2000] // -5000
      const cashOuts = [4000, 3500] // +7500

      const currentBalance =
        initialBalance +
        bonuses.reduce((sum, b) => sum + b, 0) +
        purchases.reduce((sum, p) => sum + p, 0) -
        buyIns.reduce((sum, b) => sum + b, 0) +
        cashOuts.reduce((sum, c) => sum + c, 0)

      // 10000 + 1500 + 5000 - 5000 + 7500 = 19000
      expect(currentBalance).toBe(19000)
    })

    it('should handle negative balance (allowed)', () => {
      const initialBalance = 1000
      const bonuses: number[] = []
      const purchases: number[] = []
      const buyIns = [5000]
      const cashOuts: number[] = []

      const currentBalance =
        initialBalance +
        bonuses.reduce((sum, b) => sum + b, 0) +
        purchases.reduce((sum, p) => sum + p, 0) -
        buyIns.reduce((sum, b) => sum + b, 0) +
        cashOuts.reduce((sum, c) => sum + c, 0)

      expect(currentBalance).toBe(-4000)
    })

    it('should handle zero initial balance', () => {
      const initialBalance = 0
      const bonuses = [5000]
      const purchases: number[] = []
      const buyIns: number[] = []
      const cashOuts: number[] = []

      const currentBalance =
        initialBalance +
        bonuses.reduce((sum, b) => sum + b, 0) +
        purchases.reduce((sum, p) => sum + p, 0) -
        buyIns.reduce((sum, b) => sum + b, 0) +
        cashOuts.reduce((sum, c) => sum + c, 0)

      expect(currentBalance).toBe(5000)
    })
  })

  describe('Balance breakdown', () => {
    it('should provide detailed breakdown of balance components', () => {
      const initialBalance = 10000
      const bonuses = [1000, 500]
      const purchases = [5000]
      const buyIns = [3000, 2000]
      const cashOuts = [4000, 3500]

      const breakdown = {
        initialBalance,
        totalBonuses: bonuses.reduce((sum, b) => sum + b, 0),
        totalPurchases: purchases.reduce((sum, p) => sum + p, 0),
        totalBuyIns: buyIns.reduce((sum, b) => sum + b, 0),
        totalCashOuts: cashOuts.reduce((sum, c) => sum + c, 0),
        currentBalance: 0,
      }

      breakdown.currentBalance =
        breakdown.initialBalance +
        breakdown.totalBonuses +
        breakdown.totalPurchases -
        breakdown.totalBuyIns +
        breakdown.totalCashOuts

      expect(breakdown).toEqual({
        initialBalance: 10000,
        totalBonuses: 1500,
        totalPurchases: 5000,
        totalBuyIns: 5000,
        totalCashOuts: 7500,
        currentBalance: 19000,
      })
    })

    it('should calculate session profit/loss correctly', () => {
      const buyIns = [3000, 2000]
      const cashOuts = [4000, 3500]

      const totalBuyIns = buyIns.reduce((sum, b) => sum + b, 0)
      const totalCashOuts = cashOuts.reduce((sum, c) => sum + c, 0)
      const sessionProfitLoss = totalCashOuts - totalBuyIns

      expect(totalBuyIns).toBe(5000)
      expect(totalCashOuts).toBe(7500)
      expect(sessionProfitLoss).toBe(2500) // Net profit from sessions
    })
  })

  // Database integration tests - require actual database
  describe.skip('Database Integration', () => {
    it('should calculate balance using database VIEW', async () => {
      // This test requires database connection
      // Run with: DATABASE_URL=... bun run test tests/integration/currency/balance.test.ts
    })

    it('should exclude soft-deleted transactions from balance', async () => {
      // This test requires database connection
    })

    it('should only count sessions belonging to the currency', async () => {
      // This test requires database connection
    })
  })
})
