// Player Search API Type Definitions
// Created for TASK-0510: プレイヤー検索API実装

export interface SearchPlayersRequest {
  query: string;
  page?: number;
  limit?: number;
  sort?: SortOption;
}

export type SortOption =
  | 'relevance'
  | 'name_asc'
  | 'name_desc'
  | 'created_asc'
  | 'created_desc'
  | 'updated_desc';

export interface SearchPlayersResponse {
  players: PlayerSearchResult[];
  pagination: Pagination;
  search_info: SearchInfo;
}

export interface PlayerSearchResult {
  id: string;
  name: string;
  player_type_id?: string;
  player_type?: {
    id: string;
    name: string;
    color: string;
  };
  tag_count: number;
  has_notes: boolean;
  created_at: string;
  updated_at: string;
  relevance_score?: number;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SearchInfo {
  query: string;
  sort: SortOption;
  execution_time_ms: number;
}

// Error type definitions
export const SEARCH_ERROR_CODES = {
  INVALID_PAGE: 'SEARCH_INVALID_PAGE',
  INVALID_LIMIT: 'SEARCH_INVALID_LIMIT',
  INVALID_SORT: 'SEARCH_INVALID_SORT',
  QUERY_TOO_LONG: 'SEARCH_QUERY_TOO_LONG',
  DATABASE_ERROR: 'SEARCH_DATABASE_ERROR',
  TIMEOUT_ERROR: 'SEARCH_TIMEOUT_ERROR',
} as const;

export type SearchErrorCode = typeof SEARCH_ERROR_CODES[keyof typeof SEARCH_ERROR_CODES];

export interface SearchError {
  code: SearchErrorCode;
  message: string;
  details?: {
    query?: string;
    page?: number;
    limit?: number;
    sort?: string;
  };
}

// Constants
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const MAX_QUERY_LENGTH = 255;
export const DEFAULT_SORT: SortOption = 'relevance';

// Validation helpers
export function isValidSortOption(sort: string): sort is SortOption {
  const validOptions: SortOption[] = [
    'relevance',
    'name_asc',
    'name_desc',
    'created_asc',
    'created_desc',
    'updated_desc',
  ];
  return validOptions.includes(sort as SortOption);
}

export function validateSearchRequest(request: SearchPlayersRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Query length validation
  if (request.query.length > MAX_QUERY_LENGTH) {
    errors.push(`Query too long. Maximum ${MAX_QUERY_LENGTH} characters allowed.`);
  }

  // Page validation
  if (request.page !== undefined && (request.page < 1 || !Number.isInteger(request.page))) {
    errors.push('Page must be a positive integer starting from 1.');
  }

  // Limit validation
  if (request.limit !== undefined && (request.limit < 1 || request.limit > MAX_LIMIT || !Number.isInteger(request.limit))) {
    errors.push(`Limit must be between 1 and ${MAX_LIMIT}.`);
  }

  // Sort validation
  if (request.sort !== undefined && !isValidSortOption(request.sort)) {
    errors.push('Invalid sort option.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Helper functions for response building
export function calculatePagination(
  currentPage: number,
  perPage: number,
  totalItems: number
): Pagination {
  const totalPages = Math.ceil(totalItems / perPage);

  return {
    current_page: currentPage,
    per_page: perPage,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: currentPage < totalPages,
    has_prev: currentPage > 1,
  };
}

export function calculateRelevanceScore(
  query: string,
  playerName: string
): number {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedName = playerName.toLowerCase();

  if (normalizedName === normalizedQuery) {
    return 100; // Exact match
  } else if (normalizedName.startsWith(normalizedQuery)) {
    return 90; // Prefix match
  } else if (normalizedName.endsWith(normalizedQuery)) {
    return 80; // Suffix match
  } else if (normalizedName.includes(normalizedQuery)) {
    return 70; // Partial match
  } else {
    return 0; // No match
  }
}

// Mock data generator for testing
export function generateMockPlayer(overrides: Partial<PlayerSearchResult> = {}): PlayerSearchResult {
  const basePlayer: PlayerSearchResult = {
    id: `player-${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Player ${Math.floor(Math.random() * 1000)}`,
    tag_count: Math.floor(Math.random() * 10),
    has_notes: Math.random() > 0.5,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };

  return basePlayer;
}

export function generateMockSearchResponse(
  playerCount: number = 5,
  page: number = 1,
  limit: number = 20,
  query: string = '',
  sort: SortOption = 'relevance'
): SearchPlayersResponse {
  const players = Array.from({ length: Math.min(playerCount, limit) }, (_, index) =>
    generateMockPlayer({
      name: query ? `${query} Player ${index + 1}` : `Player ${(page - 1) * limit + index + 1}`,
      relevance_score: sort === 'relevance' ? 90 - index * 5 : undefined,
    })
  );

  return {
    players,
    pagination: calculatePagination(page, limit, playerCount),
    search_info: {
      query,
      sort,
      execution_time_ms: Math.floor(Math.random() * 100) + 50,
    },
  };
}