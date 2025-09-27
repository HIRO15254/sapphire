/**
 * 【テスト概要】: Player Type Management API Unit Tests
 * 【実装方針】: TDD Red Phase - 全ての機能を実装前にテストを書く
 * 【テスト範囲】: CRUD操作、HEXカラー検証、エラーハンドリング
 * 🔴 TDD Red Phase: 実装が存在しないため全てのテストが失敗する状態
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import type {
  PlayerType,
  CreatePlayerTypeRequest,
  CreatePlayerTypeResponse,
  GetPlayerTypesResponse,
  UpdatePlayerTypeRequest,
  UpdatePlayerTypeResponse,
  DeletePlayerTypeRequest,
  DeletePlayerTypeResponse
} from '../../types/playerType';

// Tauri invoke のモック
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockedInvoke = vi.mocked(invoke);

describe('Player Type Management API - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create_player_type Command Tests', () => {
    it('[TEST-0507-U-001] 正常なプレイヤータイプ作成', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-123',
          name: 'アグレッシブ',
          color: '#FF4444',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'アグレッシブ',
        color: '#FF4444'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('アグレッシブ');
      expect(result.data?.color).toBe('#FF4444');
      expect(result.data?.id).toBeDefined();
      expect(result.error).toBeNull();
      expect(mockedInvoke).toHaveBeenCalledWith('create_player_type', request);
    });

    it('[TEST-0507-U-002] 名前重複エラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'PLAYER_TYPE_NAME_DUPLICATE',
          message: '同名のプレイヤータイプが既に存在します',
          details: { name: 'タイト' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'タイト',
        color: '#00AA33'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('PLAYER_TYPE_NAME_DUPLICATE');
      expect(result.error?.message).toBe('同名のプレイヤータイプが既に存在します');
      expect(result.error?.details).toEqual({ name: 'タイト' });
    });

    it('[TEST-0507-U-003] 空名前エラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'PLAYER_TYPE_NAME_EMPTY',
          message: 'プレイヤータイプ名が空です',
          details: null
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: '',
        color: '#0066CC'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('PLAYER_TYPE_NAME_EMPTY');
      expect(result.error?.message).toBe('プレイヤータイプ名が空です');
    });

    it('[TEST-0507-U-004] 名前長すぎるエラー', async () => {
      const longName = 'a'.repeat(101);
      const mockResponse: CreatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'PLAYER_TYPE_NAME_TOO_LONG',
          message: 'プレイヤータイプ名が長すぎます（最大100文字）',
          details: { length: 101, max_length: 100 }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: longName,
        color: '#FFFFFF'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('PLAYER_TYPE_NAME_TOO_LONG');
      expect(result.error?.details?.length).toBe(101);
    });

    it('[TEST-0507-U-005] 境界値テスト（1文字名前）', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-456',
          name: 'A',
          color: '#000000',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'A',
        color: '#000000'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('A');
      expect(result.data?.color).toBe('#000000');
    });

    it('[TEST-0507-U-006] 境界値テスト（100文字名前）', async () => {
      const hundredCharName = 'a'.repeat(100);
      const mockResponse: CreatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-789',
          name: hundredCharName,
          color: '#AABBCC',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: hundredCharName,
        color: '#AABBCC'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(hundredCharName);
      expect(result.data?.color).toBe('#AABBCC');
    });
  });

  describe('get_player_types Command Tests', () => {
    it('[TEST-0507-U-007] 空リストの正常取得', async () => {
      const mockResponse: GetPlayerTypesResponse = {
        success: true,
        data: [],
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const result = await invoke<GetPlayerTypesResponse>('get_player_types');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
      expect(mockedInvoke).toHaveBeenCalledWith('get_player_types');
    });

    it('[TEST-0507-U-008] 単一タイプの取得', async () => {
      const mockPlayerType: PlayerType = {
        id: 'test-uuid-single',
        name: 'タイト',
        color: '#00AA33',
        created_at: '2025-09-26T10:00:00.000Z',
        updated_at: '2025-09-26T10:00:00.000Z'
      };

      const mockResponse: GetPlayerTypesResponse = {
        success: true,
        data: [mockPlayerType],
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const result = await invoke<GetPlayerTypesResponse>('get_player_types');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toEqual(mockPlayerType);
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-U-009] 複数タイプの取得（作成日時順ソート）', async () => {
      const mockPlayerTypes: PlayerType[] = [
        {
          id: 'test-uuid-1',
          name: 'アグレッシブ',
          color: '#FF0000',
          created_at: '2025-09-26T09:00:00.000Z',
          updated_at: '2025-09-26T09:00:00.000Z'
        },
        {
          id: 'test-uuid-2',
          name: 'タイト',
          color: '#00AA33',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        {
          id: 'test-uuid-3',
          name: 'ルーズ',
          color: '#0066CC',
          created_at: '2025-09-26T11:00:00.000Z',
          updated_at: '2025-09-26T11:00:00.000Z'
        }
      ];

      const mockResponse: GetPlayerTypesResponse = {
        success: true,
        data: mockPlayerTypes,
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const result = await invoke<GetPlayerTypesResponse>('get_player_types');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.[0].name).toBe('アグレッシブ');
      expect(result.data?.[1].name).toBe('タイト');
      expect(result.data?.[2].name).toBe('ルーズ');
      // 作成日時順になっていることを確認
      expect(new Date(result.data?.[0].created_at!)).toBeInstanceOf(Date);
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-U-010] 大量データ取得性能テスト', async () => {
      // 100個のプレイヤータイプを模擬
      const mockPlayerTypes: PlayerType[] = Array.from({ length: 100 }, (_, i) => ({
        id: `test-uuid-${i}`,
        name: `タイプ${i}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}`,
        created_at: new Date(Date.now() + i * 1000).toISOString(),
        updated_at: new Date(Date.now() + i * 1000).toISOString()
      }));

      const mockResponse: GetPlayerTypesResponse = {
        success: true,
        data: mockPlayerTypes,
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      const result = await invoke<GetPlayerTypesResponse>('get_player_types');
      const responseTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(100);
      expect(responseTime).toBeLessThan(50); // 50ms 以内
      expect(result.error).toBeNull();
    });
  });

  describe('update_player_type Command Tests', () => {
    it('[TEST-0507-U-011] 名前のみ更新', async () => {
      const mockResponse: UpdatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-update',
          name: '新しい名前',
          color: '#ORIGINAL',
          created_at: '2025-09-26T09:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdatePlayerTypeRequest = {
        id: 'test-uuid-update',
        name: '新しい名前'
      };

      const result = await invoke<UpdatePlayerTypeResponse>('update_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('新しい名前');
      expect(result.data?.color).toBe('#ORIGINAL');
      expect(result.data?.updated_at).not.toBe(result.data?.created_at);
      expect(result.error).toBeNull();
      expect(mockedInvoke).toHaveBeenCalledWith('update_player_type', request);
    });

    it('[TEST-0507-U-012] 色のみ更新', async () => {
      const mockResponse: UpdatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-color',
          name: '元の名前',
          color: '#CCDDEE',
          created_at: '2025-09-26T09:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdatePlayerTypeRequest = {
        id: 'test-uuid-color',
        color: '#CCDDEE'
      };

      const result = await invoke<UpdatePlayerTypeResponse>('update_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('元の名前');
      expect(result.data?.color).toBe('#CCDDEE');
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-U-013] 名前と色の同時更新', async () => {
      const mockResponse: UpdatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-both',
          name: '更新名前',
          color: '#ABCDEF',
          created_at: '2025-09-26T09:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdatePlayerTypeRequest = {
        id: 'test-uuid-both',
        name: '更新名前',
        color: '#ABCDEF'
      };

      const result = await invoke<UpdatePlayerTypeResponse>('update_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('更新名前');
      expect(result.data?.color).toBe('#ABCDEF');
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-U-014] 存在しないIDでの更新エラー', async () => {
      const mockResponse: UpdatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'PLAYER_TYPE_NOT_FOUND',
          message: '指定されたプレイヤータイプが見つかりません',
          details: { id: 'nonexistent-id' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdatePlayerTypeRequest = {
        id: 'nonexistent-id',
        name: 'テスト'
      };

      const result = await invoke<UpdatePlayerTypeResponse>('update_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('PLAYER_TYPE_NOT_FOUND');
      expect(result.error?.details?.id).toBe('nonexistent-id');
    });

    it('[TEST-0507-U-015] 更新時の名前重複エラー', async () => {
      const mockResponse: UpdatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'PLAYER_TYPE_NAME_DUPLICATE',
          message: '同名のプレイヤータイプが既に存在します',
          details: { name: 'タイプA' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdatePlayerTypeRequest = {
        id: 'test-uuid-typeB',
        name: 'タイプA'
      };

      const result = await invoke<UpdatePlayerTypeResponse>('update_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('PLAYER_TYPE_NAME_DUPLICATE');
      expect(result.error?.details?.name).toBe('タイプA');
    });
  });

  describe('delete_player_type Command Tests', () => {
    it('[TEST-0507-U-016] 単独タイプの正常削除', async () => {
      const mockResponse: DeletePlayerTypeResponse = {
        success: true,
        affected_players_count: 0,
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: DeletePlayerTypeRequest = {
        id: 'test-uuid-delete'
      };

      const result = await invoke<DeletePlayerTypeResponse>('delete_player_type', request);

      expect(result.success).toBe(true);
      expect(result.affected_players_count).toBe(0);
      expect(result.error).toBeNull();
      expect(mockedInvoke).toHaveBeenCalledWith('delete_player_type', request);
    });

    it('[TEST-0507-U-017] 使用中タイプの削除（CASCADE処理）', async () => {
      const mockResponse: DeletePlayerTypeResponse = {
        success: true,
        affected_players_count: 3,
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: DeletePlayerTypeRequest = {
        id: 'test-uuid-used'
      };

      const result = await invoke<DeletePlayerTypeResponse>('delete_player_type', request);

      expect(result.success).toBe(true);
      expect(result.affected_players_count).toBe(3);
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-U-018] 存在しないIDでの削除エラー', async () => {
      const mockResponse: DeletePlayerTypeResponse = {
        success: false,
        affected_players_count: null,
        error: {
          code: 'PLAYER_TYPE_NOT_FOUND',
          message: '指定されたプレイヤータイプが見つかりません',
          details: { id: 'invalid-uuid' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: DeletePlayerTypeRequest = {
        id: 'invalid-uuid'
      };

      const result = await invoke<DeletePlayerTypeResponse>('delete_player_type', request);

      expect(result.success).toBe(false);
      expect(result.affected_players_count).toBeNull();
      expect(result.error?.code).toBe('PLAYER_TYPE_NOT_FOUND');
      expect(result.error?.details?.id).toBe('invalid-uuid');
    });
  });
});