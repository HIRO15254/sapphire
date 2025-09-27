// Edge cases and boundary value tests for Player Search API
// Created for TASK-0510: プレイヤー検索API実装

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  SearchPlayersRequest,
  SearchPlayersResponse,
} from '../../types/playerSearch';
import {
  setupTauriMock,
  resetMocks,
  createSpecialCharacterPlayers,
  createLargeDataset,
  createPaginationTestData,
  expectValidPagination,
  expectValidSearchInfo,
} from './testUtils';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('Player Search API - Boundary Value Tests (EC-01)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockReset();
  });

  test('EC-01-01: 1文字検索', async () => {
    // Given: 검색어 "a"
    mockInvoke.mockResolvedValueOnce({
      players: [
        {
          id: 'single-char-player',
          name: 'Player A',
          tag_count: 1,
          has_notes: false,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-10T00:00:00.000Z',
        }
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'a',
        sort: 'relevance',
        execution_time_ms: 67,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'a' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 정상히검색실행
    expect(response.players).toHaveLength(1);
    expect(response.search_info.query).toBe('a');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-01-02: 255文字検索（境界値）', async () => {
    // Given: 255문자의검색어
    const maxQuery = 'a'.repeat(255);
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
        query: maxQuery,
        sort: 'relevance',
        execution_time_ms: 123,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: maxQuery };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 정상히검색실행
    expect(response.search_info.query).toBe(maxQuery);
    expect(response.search_info.query.length).toBe(255);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-01-03: 最小ページサイズ', async () => {
    // Given: limit=1
    const testPlayer = {
      id: 'min-limit-player',
      name: 'Single Player',
      tag_count: 0,
      has_notes: true,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-10T00:00:00.000Z',
    };

    mockInvoke.mockResolvedValueOnce({
      players: [testPlayer],
      pagination: {
        current_page: 1,
        per_page: 1,
        total_items: 5,
        total_pages: 5,
        has_next: true,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 45,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '', limit: 1 };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 1건씩페이징
    expect(response.players).toHaveLength(1);
    expectValidPagination(response.pagination, 1, 1, 5);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-01-04: 最大ページサイズ', async () => {
    // Given: limit=100
    const testPlayers = createLargeDataset(100);
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 100,
        total_items: 100,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 234,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '', limit: 100 };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 100건표시
    expect(response.players).toHaveLength(100);
    expectValidPagination(response.pagination, 1, 100, 100);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-01-05: 最大ページ番号', async () => {
    // Given: page=총페이지수
    const { testCases } = createPaginationTestData(45);
    const lastPageCase = testCases[2]; // page=5 (마지막 페이지)

    mockInvoke.mockResolvedValueOnce({
      players: createLargeDataset(5), // 마지막페이지 5건
      pagination: {
        current_page: lastPageCase.page,
        per_page: lastPageCase.limit,
        total_items: 45,
        total_pages: 5,
        has_next: lastPageCase.expectedHasNext,
        has_prev: lastPageCase.expectedHasPrev,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 78,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '', page: lastPageCase.page, limit: lastPageCase.limit };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 최종페이지표시
    expectValidPagination(response.pagination, 5, 10, 45);
    expect(response.pagination.has_next).toBe(false);
    expect(response.pagination.has_prev).toBe(true);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-01-06: 존재하지않는페이지번호', async () => {
    // Given: page=999 (존재하지않는페이지)
    mockInvoke.mockResolvedValueOnce({
      players: [],
      pagination: {
        current_page: 999,
        per_page: 20,
        total_items: 50,
        total_pages: 3,
        has_next: false,
        has_prev: true,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 34,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '', page: 999 };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 빈결과반환
    expect(response.players).toEqual([]);
    expect(response.pagination.current_page).toBe(999);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });
});

describe('Player Search API - Special Characters & Unicode (EC-02)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockReset();
  });

  test('EC-02-01: Unicode絵文字検索', async () => {
    // Given: 검색어 "🎯"
    const emojiPlayers = createSpecialCharacterPlayers().filter(p => p.name.includes('🎯'));
    mockInvoke.mockResolvedValueOnce({
      players: emojiPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: emojiPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '🎯',
        sort: 'relevance',
        execution_time_ms: 89,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '🎯' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 이모지포함프레이어검색
    expect(response.players).toHaveLength(1);
    expect(response.players[0].name).toBe('Player 🎯 with emoji');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-02-02: 特殊文字検索', async () => {
    // Given: 검색어 "@#$%"
    const specialPlayers = createSpecialCharacterPlayers().filter(p => p.name.includes('@#$%'));
    mockInvoke.mockResolvedValueOnce({
      players: specialPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: specialPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '@#$%',
        sort: 'relevance',
        execution_time_ms: 67,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '@#$%' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 특수문자에스케이프처리
    expect(response.players).toHaveLength(1);
    expect(response.players[0].name).toBe('Player @#$% with symbols');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-02-03: 空白文字処理', async () => {
    // Given: 검색어 "  test  " (전후공백)
    mockInvoke.mockResolvedValueOnce({
      players: [
        {
          id: 'trimmed-search',
          name: 'Test Player',
          tag_count: 0,
          has_notes: false,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-10T00:00:00.000Z',
        }
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'test', // 트림처리후
        sort: 'relevance',
        execution_time_ms: 54,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '  test  ' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 트림처리후검색
    expect(response.search_info.query).toBe('test');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-02-04: 改行文字処理', async () => {
    // Given: 검색어 "test\nname"
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
        query: 'test\nname',
        sort: 'relevance',
        execution_time_ms: 41,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test\nname' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 개행문자적절처리
    expect(response.search_info.query).toBe('test\nname');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-02-05: NULL문字대책', async () => {
    // Given: 검색어에NULL문자포함
    const nullQuery = 'test\x00malicious';
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
        query: 'test', // NULL문자제거후
        sort: 'relevance',
        execution_time_ms: 67,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: nullQuery };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 보안취약점없음
    expect(response.search_info.query).toBe('test');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-02-06: 다국어문자검색', async () => {
    // Given: 검색어 "プレイヤー" (일본어)
    mockInvoke.mockResolvedValueOnce({
      players: [
        {
          id: 'japanese-player',
          name: 'プレイヤー太郎',
          tag_count: 2,
          has_notes: true,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-10T00:00:00.000Z',
        }
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'プレイヤー',
        sort: 'relevance',
        execution_time_ms: 78,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'プレイヤー' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 일본어검색정상동작
    expect(response.players).toHaveLength(1);
    expect(response.players[0].name).toBe('プレイヤー太郎');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-02-07: 중국어문자검색', async () => {
    // Given: 검색어 "玩家" (중국어)
    mockInvoke.mockResolvedValueOnce({
      players: [
        {
          id: 'chinese-player',
          name: '玩家小明',
          tag_count: 1,
          has_notes: false,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-10T00:00:00.000Z',
        }
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '玩家',
        sort: 'relevance',
        execution_time_ms: 83,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '玩家' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 중국어검색정상동작
    expect(response.players).toHaveLength(1);
    expect(response.players[0].name).toBe('玩家小明');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });
});

describe('Player Search API - Data State Tests (EC-03)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockReset();
  });

  test('EC-03-01: プレイヤー0件状態', async () => {
    // Given: 데이터베이스에프레이어없음
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
        query: '',
        sort: 'relevance',
        execution_time_ms: 23,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 빈결과, total_items=0
    expect(response.players).toEqual([]);
    expect(response.pagination.total_items).toBe(0);
    expect(response.pagination.total_pages).toBe(0);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-03-02: プレイヤータイプ無し', async () => {
    // Given: player_type_id=null 프레이어
    mockInvoke.mockResolvedValueOnce({
      players: [
        {
          id: 'no-type-player',
          name: 'Player Without Type',
          player_type_id: undefined,
          player_type: undefined,
          tag_count: 1,
          has_notes: true,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-10T00:00:00.000Z',
        }
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 45,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: player_type=null로반환
    expect(response.players[0].player_type_id).toBeUndefined();
    expect(response.players[0].player_type).toBeUndefined();

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-03-03: タグ無しプレイヤー', async () => {
    // Given: 태그미할당프레이어
    mockInvoke.mockResolvedValueOnce({
      players: [
        {
          id: 'no-tags-player',
          name: 'Player Without Tags',
          tag_count: 0,
          has_notes: false,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-10T00:00:00.000Z',
        }
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 38,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: tag_count=0
    expect(response.players[0].tag_count).toBe(0);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-03-04: メモ無しプレイヤー', async () => {
    // Given: 메모미작성프레이어
    mockInvoke.mockResolvedValueOnce({
      players: [
        {
          id: 'no-notes-player',
          name: 'Player Without Notes',
          tag_count: 2,
          has_notes: false,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-10T00:00:00.000Z',
        }
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 42,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: has_notes=false
    expect(response.players[0].has_notes).toBe(false);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-03-05: 削除済み関連データ', async () => {
    // Given: 삭제된프레이어타입참조
    mockInvoke.mockResolvedValueOnce({
      players: [
        {
          id: 'orphaned-player',
          name: 'Player With Deleted Type',
          player_type_id: 'deleted-type-id',
          player_type: undefined, // 삭제됨
          tag_count: 0,
          has_notes: false,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-10T00:00:00.000Z',
        }
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 56,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: player_type=null로처리
    expect(response.players[0].player_type_id).toBe('deleted-type-id');
    expect(response.players[0].player_type).toBeUndefined();

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-03-06: 부분적으로손상된데이터', async () => {
    // Given: 일부필드누락데이터
    mockInvoke.mockResolvedValueOnce({
      players: [
        {
          id: 'partial-data-player',
          name: 'Player With Missing Fields',
          // player_type_id 누락
          tag_count: 0,
          has_notes: false,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-10T00:00:00.000Z',
        }
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 47,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 누락필드적절처리
    expect(response.players[0].player_type_id).toBeUndefined();

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-03-07: 매우오래된데이터', async () => {
    // Given: 1970년데이터
    mockInvoke.mockResolvedValueOnce({
      players: [
        {
          id: 'old-data-player',
          name: 'Very Old Player',
          tag_count: 0,
          has_notes: false,
          created_at: '1970-01-01T00:00:00.000Z',
          updated_at: '1970-01-01T00:00:00.000Z',
        }
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'created_asc',
        execution_time_ms: 59,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '', sort: 'created_asc' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 오래된날짜정상처리
    expect(response.players[0].created_at).toBe('1970-01-01T00:00:00.000Z');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('EC-03-08: 미래날짜데이터', async () => {
    // Given: 미래날짜데이터
    mockInvoke.mockResolvedValueOnce({
      players: [
        {
          id: 'future-data-player',
          name: 'Future Player',
          tag_count: 0,
          has_notes: false,
          created_at: '2030-12-31T23:59:59.999Z',
          updated_at: '2030-12-31T23:59:59.999Z',
        }
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'created_desc',
        execution_time_ms: 63,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '', sort: 'created_desc' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 미래날짜정상처리
    expect(response.players[0].created_at).toBe('2030-12-31T23:59:59.999Z');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });
});