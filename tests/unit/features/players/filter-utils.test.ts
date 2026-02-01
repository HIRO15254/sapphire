import { describe, expect, it } from 'vitest'

/**
 * Unit tests for player filter utilities.
 *
 * Tests filterPlayers and hasActivePlayerFilters functions:
 * - Search filter (case-insensitive partial match)
 * - Tag filter (AND logic — must have ALL selected tags)
 * - Combined filters
 * - Edge cases (empty input, special characters)
 *
 * @see features/players/lib/filter-utils.ts
 */

const mockPlayers = [
  {
    name: 'Alice',
    tags: [
      { id: 'tag-1', name: 'Aggressive' },
      { id: 'tag-2', name: 'Regular' },
    ],
  },
  {
    name: 'Bob',
    tags: [{ id: 'tag-1', name: 'Aggressive' }],
  },
  {
    name: 'Charlie',
    tags: [
      { id: 'tag-2', name: 'Regular' },
      { id: 'tag-3', name: 'Tight' },
    ],
  },
  {
    name: 'alice smith',
    tags: [],
  },
]

describe('filterPlayers', () => {
  describe('with no filters', () => {
    it('should return all players when no filters are active', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers(mockPlayers, { search: '', tagIds: [] })

      expect(result).toHaveLength(4)
    })
  })

  describe('search filter', () => {
    it('should filter by name (case-insensitive)', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers(mockPlayers, {
        search: 'alice',
        tagIds: [],
      })

      expect(result).toHaveLength(2)
      expect(result.map((p) => p.name)).toEqual(['Alice', 'alice smith'])
    })

    it('should match partial names', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers(mockPlayers, {
        search: 'li',
        tagIds: [],
      })

      expect(result).toHaveLength(3)
      expect(result.map((p) => p.name)).toEqual([
        'Alice',
        'Charlie',
        'alice smith',
      ])
    })

    it('should return empty array when no match', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers(mockPlayers, {
        search: 'xyz',
        tagIds: [],
      })

      expect(result).toHaveLength(0)
    })
  })

  describe('tag filter', () => {
    it('should filter by single tag', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers(mockPlayers, {
        search: '',
        tagIds: ['tag-1'],
      })

      expect(result).toHaveLength(2)
      expect(result.map((p) => p.name)).toEqual(['Alice', 'Bob'])
    })

    it('should use AND logic for multiple tags', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers(mockPlayers, {
        search: '',
        tagIds: ['tag-1', 'tag-2'],
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Alice')
    })

    it('should return empty when no player has all tags', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers(mockPlayers, {
        search: '',
        tagIds: ['tag-1', 'tag-3'],
      })

      expect(result).toHaveLength(0)
    })

    it('should exclude players with no tags when filtering by tag', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers(mockPlayers, {
        search: '',
        tagIds: ['tag-2'],
      })

      expect(result).toHaveLength(2)
      expect(result.map((p) => p.name)).toEqual(['Alice', 'Charlie'])
    })
  })

  describe('combined filters', () => {
    it('should apply both search and tag filters', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers(mockPlayers, {
        search: 'ali',
        tagIds: ['tag-1'],
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Alice')
    })

    it('should return empty when filters are mutually exclusive', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers(mockPlayers, {
        search: 'bob',
        tagIds: ['tag-2'],
      })

      expect(result).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('should handle empty player list', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers([], { search: 'test', tagIds: ['tag-1'] })

      expect(result).toHaveLength(0)
    })

    it('should handle non-existent tag ID', async () => {
      const { filterPlayers } = await import(
        '~/features/players/lib/filter-utils'
      )

      const result = filterPlayers(mockPlayers, {
        search: '',
        tagIds: ['non-existent'],
      })

      expect(result).toHaveLength(0)
    })
  })
})

describe('hasActivePlayerFilters', () => {
  it('should return false for default filters', async () => {
    const { hasActivePlayerFilters } = await import(
      '~/features/players/lib/filter-utils'
    )

    expect(hasActivePlayerFilters({ search: '', tagIds: [] })).toBe(false)
  })

  it('should return true when search is active', async () => {
    const { hasActivePlayerFilters } = await import(
      '~/features/players/lib/filter-utils'
    )

    expect(hasActivePlayerFilters({ search: 'test', tagIds: [] })).toBe(true)
  })

  it('should return true when tags are active', async () => {
    const { hasActivePlayerFilters } = await import(
      '~/features/players/lib/filter-utils'
    )

    expect(hasActivePlayerFilters({ search: '', tagIds: ['tag-1'] })).toBe(
      true,
    )
  })

  it('should return true when both are active', async () => {
    const { hasActivePlayerFilters } = await import(
      '~/features/players/lib/filter-utils'
    )

    expect(
      hasActivePlayerFilters({ search: 'test', tagIds: ['tag-1'] }),
    ).toBe(true)
  })
})
