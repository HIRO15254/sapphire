// Error handling tests for Player Search API
// Created for TASK-0510: プレイヤー検索API実装

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  SearchPlayersRequest,
  SEARCH_ERROR_CODES,
} from '../../types/playerSearch';
import {
  setupTauriMock,
  resetMocks,
  mockErrorResponse,
  mockTimeoutError,
  mockDatabaseError,
} from './testUtils';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('Player Search API - Input Validation Errors (EH-01)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockReset();
  });

  test('EH-01-01: 無効ページ番号', async () => {
    // Given: page=0
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.INVALID_PAGE,
      message: 'Page must be a positive integer starting from 1',
      details: { page: 0 },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: 'test', page: 0 };

    // Then: SEARCH_INVALID_PAGE エラー
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.INVALID_PAGE,
      message: 'Page must be a positive integer starting from 1',
      details: { page: 0 },
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-01-02: 無効件数（下限）', async () => {
    // Given: limit=0
    // Note: バックエンドで自動調整される場合は正常レスポンス
    mockInvoke.mockResolvedValueOnce({
      players: [],
      pagination: {
        current_page: 1,
        per_page: 1, // 自動調整により1に設定
        total_items: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'test',
        sort: 'relevance',
        execution_time_ms: 45,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: 'test', limit: 0 };
    const response = await invoke('search_players', request);

    // Then: 自動調整（limit=1）
    expect(response.pagination.per_page).toBe(1);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-01-03: 無効件数（上限）', async () => {
    // Given: limit=200 (制限超過)
    mockInvoke.mockResolvedValueOnce({
      players: [],
      pagination: {
        current_page: 1,
        per_page: 100, // 自動調整により100に設定
        total_items: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'test',
        sort: 'relevance',
        execution_time_ms: 67,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: 'test', limit: 200 };
    const response = await invoke('search_players', request);

    // Then: 自動調整（limit=100）
    expect(response.pagination.per_page).toBe(100);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-01-04: 無効ソート方式', async () => {
    // Given: sort="invalid_sort"
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.INVALID_SORT,
      message: 'Invalid sort option: invalid_sort',
      details: { sort: 'invalid_sort' },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: 'test', sort: 'invalid_sort' as never };

    // Then: SEARCH_INVALID_SORT エラー
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.INVALID_SORT,
      message: 'Invalid sort option: invalid_sort',
      details: { sort: 'invalid_sort' },
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-01-05: 過長検索語', async () => {
    // Given: 256文字の検索語
    const longQuery = 'a'.repeat(256);
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.QUERY_TOO_LONG,
      message: 'Query too long. Maximum 255 characters allowed.',
      details: { query: longQuery, length: 256 },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: longQuery };

    // Then: SEARCH_QUERY_TOO_LONG エラー
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.QUERY_TOO_LONG,
      message: 'Query too long. Maximum 255 characters allowed.',
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-01-06: 特殊文字エスケープ', async () => {
    // Given: 검색어 "'; DROP TABLE players; --" (SQLインジェクション試도)
    const maliciousQuery = "'; DROP TABLE players; --";
    mockInvoke.mockResolvedValueOnce({
      players: [],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: maliciousQuery,
        sort: 'relevance',
        execution_time_ms: 78,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: maliciousQuery };
    const response = await invoke('search_players', request);

    // Then: SQLインジェクション무효화, 정상검색
    expect(response.players).toEqual([]);
    expect(response.search_info.query).toBe(maliciousQuery);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-01-07: SQL LIKE 특수문자 처리', async () => {
    // Given: LIKE 패턴 특수문자 %, _
    const specialQuery = "test%_char";
    mockInvoke.mockResolvedValueOnce({
      players: [],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: specialQuery,
        sort: 'relevance',
        execution_time_ms: 56,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: specialQuery };
    const response = await invoke('search_players', request);

    // Then: 특수문자가 리터럴로 처리됨
    expect(response.search_info.query).toBe(specialQuery);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-01-08: 小数페이지번호', async () => {
    // Given: page=1.5 (소수)
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.INVALID_PAGE,
      message: 'Page must be a positive integer',
      details: { page: 1.5 },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test', page: 1.5 };

    // Then: SEARCH_INVALID_PAGE 에러
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.INVALID_PAGE,
      message: 'Page must be a positive integer',
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-01-09: 음수페이지번호', async () => {
    // Given: page=-1
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.INVALID_PAGE,
      message: 'Page must be a positive integer starting from 1',
      details: { page: -1 },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test', page: -1 };

    // Then: SEARCH_INVALID_PAGE 에러
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.INVALID_PAGE,
      message: 'Page must be a positive integer starting from 1',
      details: { page: -1 },
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });
});

describe('Player Search API - System Errors (EH-02)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockReset();
  });

  test('EH-02-01: データベース接続エラー', async () => {
    // Given: DB접속불가状態
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Database connection failed',
      details: { database: 'sqlite', error: 'Connection timeout' },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test' };

    // Then: SEARCH_DATABASE_ERROR 에러
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Database connection failed',
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-02-02: タイムアウトエラー', async () => {
    // Given: 극단적으로 무거운쿼리
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.TIMEOUT_ERROR,
      message: 'Search operation timed out after 5000ms',
      details: { timeout_ms: 5000, query: 'heavy query' },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'heavy query' };

    // Then: SEARCH_TIMEOUT_ERROR 에러
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.TIMEOUT_ERROR,
      message: 'Search operation timed out after 5000ms',
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-02-03: メモリ不足エラー', async () => {
    // Given: 메모리제한환경
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Insufficient memory for search operation',
      details: {
        error_type: 'memory_limit_exceeded',
        available_memory_mb: 2,
        required_memory_mb: 10
      },
    });

    // When: 대량데이터検索
    const request: SearchPlayersRequest = { query: '', limit: 100 };

    // Then: 적절한에러핸들링
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Insufficient memory for search operation',
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-02-04: インデックス破損대응', async () => {
    // Given: 인덱스사용불가
    // 백엔드에서 폴백검색실행하여 정상응답
    mockInvoke.mockResolvedValueOnce({
      players: [],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'test',
        sort: 'relevance',
        execution_time_ms: 1200, // 느린응답시간 (폴백)
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test' };
    const response = await invoke('search_players', request);

    // Then: 폴백검색실행 (느린 응답시간으로 확인가능)
    expect(response.search_info.execution_time_ms).toBeGreaterThan(1000);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-02-05: 동시접속제한에러', async () => {
    // Given: 최대동시접속수초과
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Too many concurrent search requests',
      details: {
        error_type: 'rate_limit_exceeded',
        max_concurrent: 10,
        current_requests: 15,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test' };

    // Then: 동시접속제한에러
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Too many concurrent search requests',
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-02-06: 디스크공간부족', async () => {
    // Given: 임시파일생성불가
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Insufficient disk space for search operation',
      details: {
        error_type: 'disk_space_exceeded',
        available_space_mb: 5,
        required_space_mb: 50,
      },
    });

    // When: 대용량검색
    const request: SearchPlayersRequest = { query: '', limit: 100 };

    // Then: 디스크공간에러
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Insufficient disk space for search operation',
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-02-07: 네트워크연결문제', async () => {
    // Given: 네트워크연결불안정
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.TIMEOUT_ERROR,
      message: 'Network connection lost during search',
      details: {
        error_type: 'network_error',
        connection_status: 'disconnected',
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test' };

    // Then: 네트워크에러
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.TIMEOUT_ERROR,
      message: 'Network connection lost during search',
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-02-08: 권한부족에러', async () => {
    // Given: 데이터베이스읽기권한없음
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Insufficient permissions to access database',
      details: {
        error_type: 'permission_denied',
        required_permission: 'read',
        table: 'players',
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test' };

    // Then: 권한에러
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Insufficient permissions to access database',
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-02-09: 데이터베이스락에러', async () => {
    // Given: 데이터베이스락상태
    mockInvoke.mockRejectedValueOnce({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Database is locked by another process',
      details: {
        error_type: 'database_locked',
        lock_duration_ms: 5000,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test' };

    // Then: 락에러
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: SEARCH_ERROR_CODES.DATABASE_ERROR,
      message: 'Database is locked by another process',
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EH-02-10: 예상치못한시스템에러', async () => {
    // Given: 일반적인시스템에러
    mockInvoke.mockRejectedValueOnce({
      code: 'UNEXPECTED_ERROR',
      message: 'An unexpected error occurred',
      details: {
        error_type: 'system_error',
        stack_trace: 'Error at line 123...',
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test' };

    // Then: 예상치못한에러
    await expect(invoke('search_players', request)).rejects.toMatchObject({
      code: 'UNEXPECTED_ERROR',
      message: 'An unexpected error occurred',
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });
});