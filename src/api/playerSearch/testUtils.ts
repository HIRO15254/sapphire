// Test utilities for Player Search API
// Created for TASK-0510: プレイヤー検索API実装

import { vi } from 'vitest';
import {
  SearchPlayersRequest,
  SearchPlayersResponse,
  PlayerSearchResult,
  SortOption,
  generateMockSearchResponse,
  generateMockPlayer,
} from '../../types/playerSearch';

// Mock Tauri invoke function
export const mockTauriInvoke = vi.fn();

// Setup Tauri mock
export function setupTauriMock() {
  (globalThis as never).__TAURI_INVOKE__ = mockTauriInvoke;
}

// Reset all mocks
export function resetMocks() {
  mockTauriInvoke.mockReset();
}

// Test data generators
export function createTestPlayers(count: number = 5): PlayerSearchResult[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `test-player-${index + 1}`,
    name: `Test Player ${index + 1}`,
    tag_count: index,
    has_notes: index % 2 === 0,
    created_at: new Date(2025, 0, index + 1).toISOString(),
    updated_at: new Date(2025, 0, index + 10).toISOString(),
  }));
}

export function createJapaneseTestPlayers(): PlayerSearchResult[] {
  return [
    {
      id: 'jp-player-1',
      name: '田中太郎',
      tag_count: 2,
      has_notes: true,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-10T00:00:00.000Z',
    },
    {
      id: 'jp-player-2',
      name: '田中花子',
      tag_count: 1,
      has_notes: false,
      created_at: '2025-01-02T00:00:00.000Z',
      updated_at: '2025-01-11T00:00:00.000Z',
    },
    {
      id: 'jp-player-3',
      name: 'ポーカープレイヤー',
      tag_count: 3,
      has_notes: true,
      created_at: '2025-01-03T00:00:00.000Z',
      updated_at: '2025-01-12T00:00:00.000Z',
    },
  ];
}

export function createPlayersWithTypes(): PlayerSearchResult[] {
  return [
    {
      id: 'typed-player-1',
      name: 'Aggressive Player',
      player_type_id: 'type-1',
      player_type: {
        id: 'type-1',
        name: 'Aggressive',
        color: '#FF0000',
      },
      tag_count: 2,
      has_notes: true,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-10T00:00:00.000Z',
    },
    {
      id: 'typed-player-2',
      name: 'Conservative Player',
      player_type_id: 'type-2',
      player_type: {
        id: 'type-2',
        name: 'Conservative',
        color: '#00FF00',
      },
      tag_count: 1,
      has_notes: false,
      created_at: '2025-01-02T00:00:00.000Z',
      updated_at: '2025-01-11T00:00:00.000Z',
    },
  ];
}

export function createRelevanceTestPlayers(query: string): PlayerSearchResult[] {
  return [
    {
      id: 'exact-match',
      name: query, // Exact match (score: 100)
      tag_count: 0,
      has_notes: false,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-10T00:00:00.000Z',
      relevance_score: 100,
    },
    {
      id: 'prefix-match',
      name: `${query}123`, // Prefix match (score: 90)
      tag_count: 1,
      has_notes: true,
      created_at: '2025-01-02T00:00:00.000Z',
      updated_at: '2025-01-11T00:00:00.000Z',
      relevance_score: 90,
    },
    {
      id: 'suffix-match',
      name: `prefix${query}`, // Suffix match (score: 80)
      tag_count: 2,
      has_notes: false,
      created_at: '2025-01-03T00:00:00.000Z',
      updated_at: '2025-01-12T00:00:00.000Z',
      relevance_score: 80,
    },
    {
      id: 'partial-match',
      name: `prefix${query}suffix`, // Partial match (score: 70)
      tag_count: 3,
      has_notes: true,
      created_at: '2025-01-04T00:00:00.000Z',
      updated_at: '2025-01-13T00:00:00.000Z',
      relevance_score: 70,
    },
  ];
}

// Mock response generators
export function mockSuccessfulSearch(
  players: PlayerSearchResult[] = createTestPlayers(),
  request: Partial<SearchPlayersRequest> = {}
): void {
  const {
    query = '',
    page = 1,
    limit = 20,
    sort = 'relevance' as SortOption,
  } = request;

  const response = generateMockSearchResponse(
    players.length,
    page,
    limit,
    query,
    sort
  );

  response.players = players.slice(0, limit);

  mockTauriInvoke.mockResolvedValueOnce(response);
}

export function mockErrorResponse(
  errorCode: string,
  errorMessage: string,
  details?: Record<string, unknown>
): void {
  const error = {
    code: errorCode,
    message: errorMessage,
    details,
  };

  mockTauriInvoke.mockRejectedValueOnce(error);
}

export function mockTimeoutError(): void {
  mockErrorResponse(
    'SEARCH_TIMEOUT_ERROR',
    'Search operation timed out',
    { timeout_ms: 5000 }
  );
}

export function mockDatabaseError(): void {
  mockErrorResponse(
    'SEARCH_DATABASE_ERROR',
    'Database connection failed',
    { database: 'sqlite' }
  );
}

// Performance testing helpers
export class PerformanceTracker {
  private startTime: number = 0;
  private endTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  end(): number {
    this.endTime = performance.now();
    return this.getElapsedTime();
  }

  getElapsedTime(): number {
    return this.endTime - this.startTime;
  }
}

export function expectResponseTime(
  actualMs: number,
  expectedMs: number,
  tolerance: number = 50
): void {
  expect(actualMs).toBeLessThanOrEqual(expectedMs + tolerance);
}

// Memory usage helpers (for performance tests)
export function getMemoryUsage(): NodeJS.MemoryUsage {
  return process.memoryUsage();
}

export function expectMemoryUsage(
  beforeMemory: NodeJS.MemoryUsage,
  afterMemory: NodeJS.MemoryUsage,
  maxIncreaseMB: number = 5
): void {
  const heapIncrease = (afterMemory.heapUsed - beforeMemory.heapUsed) / 1024 / 1024;
  expect(heapIncrease).toBeLessThanOrEqual(maxIncreaseMB);
}

// Large dataset generators for performance testing
export function createLargeDataset(size: number): PlayerSearchResult[] {
  return Array.from({ length: size }, (_, index) =>
    generateMockPlayer({
      id: `perf-player-${index + 1}`,
      name: `Performance Test Player ${index + 1}`,
      tag_count: index % 10,
      has_notes: index % 3 === 0,
      created_at: new Date(2025, 0, (index % 30) + 1).toISOString(),
      updated_at: new Date(2025, 0, (index % 30) + 15).toISOString(),
    })
  );
}

// Special character test data
export function createSpecialCharacterPlayers(): PlayerSearchResult[] {
  return [
    {
      id: 'emoji-player',
      name: 'Player 🎯 with emoji',
      tag_count: 1,
      has_notes: true,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-10T00:00:00.000Z',
    },
    {
      id: 'special-char-player',
      name: 'Player @#$% with symbols',
      tag_count: 2,
      has_notes: false,
      created_at: '2025-01-02T00:00:00.000Z',
      updated_at: '2025-01-11T00:00:00.000Z',
    },
    {
      id: 'whitespace-player',
      name: '  Player with spaces  ',
      tag_count: 0,
      has_notes: true,
      created_at: '2025-01-03T00:00:00.000Z',
      updated_at: '2025-01-12T00:00:00.000Z',
    },
  ];
}

// Pagination test helpers
export function createPaginationTestData(totalItems: number = 45): {
  players: PlayerSearchResult[];
  testCases: Array<{
    page: number;
    limit: number;
    expectedStart: number;
    expectedEnd: number;
    expectedHasNext: boolean;
    expectedHasPrev: boolean;
  }>;
} {
  const players = createLargeDataset(totalItems);

  const testCases = [
    {
      page: 1,
      limit: 10,
      expectedStart: 0,
      expectedEnd: 10,
      expectedHasNext: true,
      expectedHasPrev: false,
    },
    {
      page: 2,
      limit: 10,
      expectedStart: 10,
      expectedEnd: 20,
      expectedHasNext: true,
      expectedHasPrev: true,
    },
    {
      page: 5,
      limit: 10,
      expectedStart: 40,
      expectedEnd: 45,
      expectedHasNext: false,
      expectedHasPrev: true,
    },
  ];

  return { players, testCases };
}

// Common test assertions
export function expectValidPagination(
  pagination: SearchPlayersResponse['pagination'],
  expectedPage: number,
  expectedLimit: number,
  expectedTotal: number
): void {
  expect(pagination.current_page).toBe(expectedPage);
  expect(pagination.per_page).toBe(expectedLimit);
  expect(pagination.total_items).toBe(expectedTotal);
  expect(pagination.total_pages).toBe(Math.ceil(expectedTotal / expectedLimit));
  expect(pagination.has_next).toBe(expectedPage < pagination.total_pages);
  expect(pagination.has_prev).toBe(expectedPage > 1);
}

export function expectValidSearchInfo(
  searchInfo: SearchPlayersResponse['search_info'],
  expectedQuery: string,
  expectedSort: SortOption
): void {
  expect(searchInfo.query).toBe(expectedQuery);
  expect(searchInfo.sort).toBe(expectedSort);
  expect(searchInfo.execution_time_ms).toBeGreaterThan(0);
  expect(searchInfo.execution_time_ms).toBeLessThan(10000); // Reasonable upper bound
}

export function expectValidPlayerSearchResult(
  player: PlayerSearchResult
): void {
  expect(player.id).toBeTruthy();
  expect(player.name).toBeTruthy();
  expect(typeof player.tag_count).toBe('number');
  expect(typeof player.has_notes).toBe('boolean');
  expect(player.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  expect(player.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

  if (player.player_type) {
    expect(player.player_type.id).toBeTruthy();
    expect(player.player_type.name).toBeTruthy();
    expect(player.player_type.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  }

  if (player.relevance_score !== undefined) {
    expect(player.relevance_score).toBeGreaterThanOrEqual(0);
    expect(player.relevance_score).toBeLessThanOrEqual(100);
  }
}

// Database setup helpers (for integration tests)
export function createDatabaseTestData(): {
  setupSQL: string[];
  cleanupSQL: string[];
} {
  const setupSQL = [
    // Insert test players
    "INSERT INTO players (id, name, created_at, updated_at) VALUES ('test-1', 'Test Player 1', '2025-01-01', '2025-01-10')",
    "INSERT INTO players (id, name, created_at, updated_at) VALUES ('test-2', 'Another Player', '2025-01-02', '2025-01-11')",
    "INSERT INTO players (id, name, created_at, updated_at) VALUES ('jp-1', '田中太郎', '2025-01-03', '2025-01-12')",

    // Insert test player types
    "INSERT INTO player_types (id, name, color, created_at, updated_at) VALUES ('type-1', 'Aggressive', '#FF0000', '2025-01-01', '2025-01-10')",

    // Insert test tags
    "INSERT INTO tags (id, name, color, created_at, updated_at) VALUES ('tag-1', 'Bluffer', '#00FF00', '2025-01-01', '2025-01-10')",

    // Insert test player tags
    "INSERT INTO player_tags (player_id, tag_id, level) VALUES ('test-1', 'tag-1', 5)",

    // Insert test notes
    "INSERT INTO player_notes (player_id, content, created_at, updated_at) VALUES ('test-1', 'Test note', '2025-01-01', '2025-01-10')",
  ];

  const cleanupSQL = [
    "DELETE FROM player_notes WHERE player_id LIKE 'test-%' OR player_id LIKE 'jp-%'",
    "DELETE FROM player_tags WHERE player_id LIKE 'test-%' OR player_id LIKE 'jp-%'",
    "DELETE FROM tags WHERE id LIKE 'tag-%'",
    "DELETE FROM player_types WHERE id LIKE 'type-%'",
    "DELETE FROM players WHERE id LIKE 'test-%' OR id LIKE 'jp-%'",
  ];

  return { setupSQL, cleanupSQL };
}