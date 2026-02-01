import { describe, expect, it } from 'vitest'

/**
 * Unit tests for player format utilities.
 *
 * Tests formatPlayerDate function:
 * - Standard date formatting (YYYY/MM/DD)
 * - Zero-padding for single-digit months and days
 * - Year boundary dates
 *
 * @see features/players/lib/format-utils.ts
 */

describe('formatPlayerDate', () => {
  it('should format date as YYYY/MM/DD', async () => {
    const { formatPlayerDate } = await import(
      '~/features/players/lib/format-utils'
    )

    const result = formatPlayerDate(new Date(2025, 11, 29))

    expect(result).toBe('2025/12/29')
  })

  it('should zero-pad single-digit month', async () => {
    const { formatPlayerDate } = await import(
      '~/features/players/lib/format-utils'
    )

    const result = formatPlayerDate(new Date(2025, 0, 15))

    expect(result).toBe('2025/01/15')
  })

  it('should zero-pad single-digit day', async () => {
    const { formatPlayerDate } = await import(
      '~/features/players/lib/format-utils'
    )

    const result = formatPlayerDate(new Date(2025, 5, 1))

    expect(result).toBe('2025/06/01')
  })

  it('should handle New Year date', async () => {
    const { formatPlayerDate } = await import(
      '~/features/players/lib/format-utils'
    )

    const result = formatPlayerDate(new Date(2026, 0, 1))

    expect(result).toBe('2026/01/01')
  })

  it('should handle end of year date', async () => {
    const { formatPlayerDate } = await import(
      '~/features/players/lib/format-utils'
    )

    const result = formatPlayerDate(new Date(2025, 11, 31))

    expect(result).toBe('2025/12/31')
  })

  it('should handle Date object passed as-is', async () => {
    const { formatPlayerDate } = await import(
      '~/features/players/lib/format-utils'
    )

    const date = new Date('2025-06-15T12:00:00Z')
    const result = formatPlayerDate(date)

    expect(result).toMatch(/^2025\/06\/1[45]$/)
  })
})
