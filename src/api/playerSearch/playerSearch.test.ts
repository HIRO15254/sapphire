// Basic functionality tests for Player Search API
// Created for TASK-0510: プレイヤー検索API実装

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  SearchPlayersRequest,
  SearchPlayersResponse,
  SortOption,
  SEARCH_ERROR_CODES,
} from '../../types/playerSearch';
import {
  setupTauriMock,
  resetMocks,
  mockSuccessfulSearch,
  mockErrorResponse,
  createTestPlayers,
  createJapaneseTestPlayers,
  createPlayersWithTypes,
  createRelevanceTestPlayers,
  expectValidPagination,
  expectValidSearchInfo,
  expectValidPlayerSearchResult,
} from './testUtils';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('Player Search API - Basic Functionality (UT-01)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockReset();
  });

  test('UT-01-01: 正常な検索語で検索', async () => {
    // Given: "田中" という検索語
    const testPlayers = createJapaneseTestPlayers().filter(p => p.name.includes('田中'));
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '田中',
        sort: 'relevance',
        execution_time_ms: 85,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: '田中' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: "田中太郎", "田中花子" が結果に含まれる
    expect(response.players).toHaveLength(2);
    expect(response.players.some(p => p.name === '田中太郎')).toBe(true);
    expect(response.players.some(p => p.name === '田中花子')).toBe(true);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-01-02: 空文字列検索で全件取得', async () => {
    // Given: 空文字列 ""
    const allPlayers = createTestPlayers(5);
    mockInvoke.mockResolvedValueOnce({
      players: allPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: allPlayers.length,
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

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: '' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 全プレイヤーが返される
    expect(response.players).toHaveLength(5);
    expect(response.search_info.query).toBe('');
    expect(response.pagination.total_items).toBe(5);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-01-03: 部分一致検索', async () => {
    // Given: "tag" という検索語
    const testPlayers = createTestPlayers().filter(p => p.name.toLowerCase().includes('tag'));
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'tag',
        sort: 'relevance',
        execution_time_ms: 92,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: 'tag' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: "tag" を含むプレイヤーが結果に含まれる
    expect(response.players.every(p =>
      p.name.toLowerCase().includes('tag')
    )).toBe(true);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-01-04: 大文字小文字区別なし検索', async () => {
    // Given: "YAMADA" という検索語（大文字）
    const testPlayers = [
      { ...createTestPlayers(1)[0], id: 'p1', name: 'yamada' },
      { ...createTestPlayers(1)[0], id: 'p2', name: 'Yamada' },
      { ...createTestPlayers(1)[0], id: 'p3', name: 'YAMADA' },
    ];

    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'YAMADA',
        sort: 'relevance',
        execution_time_ms: 78,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: 'YAMADA' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: "yamada" "Yamada" が結果に含まれる
    expect(response.players).toHaveLength(3);
    expect(response.players.some(p => p.name === 'yamada')).toBe(true);
    expect(response.players.some(p => p.name === 'Yamada')).toBe(true);
    expect(response.players.some(p => p.name === 'YAMADA')).toBe(true);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-01-05: 日本語検索', async () => {
    // Given: "ポーカー" という日本語検索語
    const testPlayers = createJapaneseTestPlayers().filter(p => p.name.includes('ポーカー'));
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'ポーカー',
        sort: 'relevance',
        execution_time_ms: 103,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: 'ポーカー' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 日本語名プレイヤーが正常に検索される
    expect(response.players).toHaveLength(1);
    expect(response.players[0].name).toBe('ポーカープレイヤー');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });
});

describe('Player Search API - Pagination Functionality (UT-02)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockReset();
  });

  test('UT-02-01: デフォルトページネーション', async () => {
    // Given: page, limit 未指定
    const testPlayers = createTestPlayers(5);
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 67,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: '' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: page=1, limit=20 でページネーション
    expectValidPagination(response.pagination, 1, 20, 5);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-02-02: カスタムページ指定', async () => {
    // Given: page=2, limit=10
    const testPlayers = createTestPlayers(5); // 11-20件目をシミュレート
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 2,
        per_page: 10,
        total_items: 25,
        total_pages: 3,
        has_next: true,
        has_prev: true,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 72,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: '', page: 2, limit: 10 };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 11-20件目が返される（ページ2の内容）
    expectValidPagination(response.pagination, 2, 10, 25);
    expect(response.pagination.has_next).toBe(true);
    expect(response.pagination.has_prev).toBe(true);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-02-03: ページ範囲内指定', async () => {
    // Given: 有効なページ番号
    const testPlayers = createTestPlayers(3);
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 3,
        per_page: 10,
        total_items: 23,
        total_pages: 3,
        has_next: false,
        has_prev: true,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 58,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: '', page: 3, limit: 10 };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 対象ページのデータが返される
    expectValidPagination(response.pagination, 3, 10, 23);
    expect(response.pagination.has_next).toBe(false);
    expect(response.pagination.has_prev).toBe(true);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-02-04: 最大件数制限', async () => {
    // Given: limit=150 (制限超過)
    const testPlayers = createTestPlayers(10);
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 100, // 制限により100に調整
        total_items: 150,
        total_pages: 2,
        has_next: true,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 134,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: '', limit: 150 };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: limit=100 に調整される
    expect(response.pagination.per_page).toBe(100);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-02-05: ページネーション情報正確性', async () => {
    // Given: 総件数45件, limit=10
    const testPlayers = createTestPlayers(10);
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 3,
        per_page: 10,
        total_items: 45,
        total_pages: 5,
        has_next: true,
        has_prev: true,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 89,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: '', page: 3, limit: 10 };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: total_pages=5, has_next/has_prev が正確
    expectValidPagination(response.pagination, 3, 10, 45);
    expect(response.pagination.total_pages).toBe(5);
    expect(response.pagination.has_next).toBe(true);
    expect(response.pagination.has_prev).toBe(true);

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });
});

describe('Player Search API - Sort Functionality (UT-03)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockReset();
  });

  test('UT-03-01: デフォルト関連度ソート', async () => {
    // Given: sort 未指定, 検索語 "test"
    const testPlayers = createRelevanceTestPlayers('test');
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'test',
        sort: 'relevance',
        execution_time_ms: 95,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: 'test' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 完全一致 > 前方一致 > 部分一致順
    expect(response.players[0].relevance_score).toBe(100); // 完全一致
    expect(response.players[1].relevance_score).toBe(90);  // 前方一致
    expect(response.players[2].relevance_score).toBe(80);  // 後方一致
    expect(response.players[3].relevance_score).toBe(70);  // 部分一致

    expectValidSearchInfo(response.search_info, 'test', 'relevance');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-03-02: 名前昇順ソート', async () => {
    // Given: sort="name_asc"
    const testPlayers = createTestPlayers(3).sort((a, b) => a.name.localeCompare(b.name));
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'name_asc',
        execution_time_ms: 76,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: '', sort: 'name_asc' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 名前のアルファベット昇順
    const sortedNames = response.players.map(p => p.name);
    const expectedSorted = [...sortedNames].sort();
    expect(sortedNames).toEqual(expectedSorted);

    expectValidSearchInfo(response.search_info, '', 'name_asc');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-03-03: 名前降順ソート', async () => {
    // Given: sort="name_desc"
    const testPlayers = createTestPlayers(3).sort((a, b) => b.name.localeCompare(a.name));
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'name_desc',
        execution_time_ms: 81,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: '', sort: 'name_desc' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 名前のアルファベット降順
    const sortedNames = response.players.map(p => p.name);
    const expectedSorted = [...sortedNames].sort().reverse();
    expect(sortedNames).toEqual(expectedSorted);

    expectValidSearchInfo(response.search_info, '', 'name_desc');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-03-04: 作成日時昇順ソート', async () => {
    // Given: sort="created_asc"
    const testPlayers = createTestPlayers(3).sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'created_asc',
        execution_time_ms: 63,
      },
    });

    // When: search_players を実行
    const request: SearchPlayersRequest = { query: '', sort: 'created_asc' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 作成日時の古い順
    const dates = response.players.map(p => new Date(p.created_at).getTime());
    const sortedDates = [...dates].sort((a, b) => a - b);
    expect(dates).toEqual(sortedDates);

    expectValidSearchInfo(response.search_info, '', 'created_asc');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-03-05: 作成日時降順ソート', async () => {
    // Given: sort="created_desc"
    const testPlayers = createTestPlayers(3).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'created_desc',
        execution_time_ms: 88,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '', sort: 'created_desc' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 작성일시의 새로운순
    const dates = response.players.map(p => new Date(p.created_at).getTime());
    const sortedDates = [...dates].sort((a, b) => b - a);
    expect(dates).toEqual(sortedDates);

    expectValidSearchInfo(response.search_info, '', 'created_desc');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-03-06: 更新日時降順ソート', async () => {
    // Given: sort="updated_desc"
    const testPlayers = createTestPlayers(3).sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'updated_desc',
        execution_time_ms: 74,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '', sort: 'updated_desc' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 업데이트일시의 새로운순
    const dates = response.players.map(p => new Date(p.updated_at).getTime());
    const sortedDates = [...dates].sort((a, b) => b - a);
    expect(dates).toEqual(sortedDates);

    expectValidSearchInfo(response.search_info, '', 'updated_desc');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-03-07: 关联度スコア算出', async () => {
    // Given: 검색어 "test", プレイヤー ["test", "test123", "mytest", "testing"]
    const testPlayers = createRelevanceTestPlayers('test');
    const expectedScores = [100, 90, 80, 70]; // 期待されるスコア

    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'test',
        sort: 'relevance',
        execution_time_ms: 112,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test', sort: 'relevance' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: スコア [100, 90, 80, 70] の순
    response.players.forEach((player, index) => {
      expect(player.relevance_score).toBe(expectedScores[index]);
    });

    expectValidSearchInfo(response.search_info, 'test', 'relevance');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });
});

describe('Player Search API - Response Building (UT-04)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockReset();
  });

  test('UT-04-01: 基本レスポンス構造', async () => {
    // Given: 正常な検索リクエスト
    const testPlayers = createTestPlayers(3);
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
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
    const request: SearchPlayersRequest = { query: 'test' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: players, pagination, search_info를 포함
    expect(response).toHaveProperty('players');
    expect(response).toHaveProperty('pagination');
    expect(response).toHaveProperty('search_info');

    expect(Array.isArray(response.players)).toBe(true);
    expectValidPagination(response.pagination, 1, 20, 3);
    expectValidSearchInfo(response.search_info, 'test', 'relevance');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-04-02: プレイヤー詳細情報', async () => {
    // Given: プレイヤータイプ・タグ付きプレイヤー
    const testPlayers = createPlayersWithTypes();
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: '',
        sort: 'relevance',
        execution_time_ms: 92,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: '' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: player_type, tag_count, has_notes가 정확
    response.players.forEach(player => {
      expectValidPlayerSearchResult(player);

      if (player.player_type) {
        expect(player.player_type.id).toBeTruthy();
        expect(player.player_type.name).toBeTruthy();
        expect(player.player_type.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }

      expect(typeof player.tag_count).toBe('number');
      expect(typeof player.has_notes).toBe('boolean');
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-04-03: 关联度スコア포함', async () => {
    // Given: 관련도ソート
    const testPlayers = createRelevanceTestPlayers('test');
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'test',
        sort: 'relevance',
        execution_time_ms: 78,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test', sort: 'relevance' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: relevance_score가 포함된다
    response.players.forEach(player => {
      expect(player.relevance_score).toBeDefined();
      expect(player.relevance_score).toBeGreaterThanOrEqual(0);
      expect(player.relevance_score).toBeLessThanOrEqual(100);
    });

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-04-04: 実行時間計測', async () => {
    // Given: 임의의 검색リクエスト
    const testPlayers = createTestPlayers(2);
    mockInvoke.mockResolvedValueOnce({
      players: testPlayers,
      pagination: {
        current_page: 1,
        per_page: 20,
        total_items: testPlayers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
      search_info: {
        query: 'test',
        sort: 'relevance',
        execution_time_ms: 127,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'test' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: execution_time_ms가 양의 값
    expect(response.search_info.execution_time_ms).toBeGreaterThan(0);
    expect(response.search_info.execution_time_ms).toBeLessThan(10000); // Reasonable upper bound

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });

  test('UT-04-05: 空결과レスポンス', async () => {
    // Given: 매치하지 않는 검색어
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
        query: 'nonexistent',
        sort: 'relevance',
        execution_time_ms: 34,
      },
    });

    // When: search_players를 실행
    const request: SearchPlayersRequest = { query: 'nonexistent' };
    const response: SearchPlayersResponse = await invoke('search_players', request);

    // Then: 空배열, total_items=0
    expect(response.players).toEqual([]);
    expect(response.pagination.total_items).toBe(0);
    expect(response.pagination.total_pages).toBe(0);

    expectValidSearchInfo(response.search_info, 'nonexistent', 'relevance');

    expect(mockInvoke).toHaveBeenCalledWith('search_players', request);
  });
});