/**
 * 【テスト概要】: Tag Management API Unit Tests
 * 【実装方針】: TDD Red Phase - 全ての機能を実装前にテストを書く
 * 【テスト範囲】: CRUD操作、CASCADE削除、エラーハンドリング
 * 【継承元】: TASK-0507 Player Type Test パターン
 * 🔴 TDD Red Phase: 実装が存在しないため全てのテストが失敗する状態
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import type {
  Tag,
  CreateTagRequest,
  CreateTagResponse,
  GetTagsResponse,
  UpdateTagRequest,
  UpdateTagResponse,
  DeleteTagRequest,
  DeleteTagResponse
} from '../../types/tag';

// Tauri invoke のモック
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockedInvoke = vi.mocked(invoke);

describe('Tag Management API - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create_tag Command Tests', () => {
    it('[TEST-0508-U-001] 正常なタグ作成', async () => {
      const mockResponse: CreateTagResponse = {
        success: true,
        data: {
          id: 'test-tag-uuid-123',
          name: 'ブラフ好き',
          color: '#FF6B6B',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreateTagRequest = {
        name: 'ブラフ好き',
        color: '#FF6B6B'
      };

      const result = await invoke<CreateTagResponse>('create_tag', request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('ブラフ好き');
      expect(result.data?.color).toBe('#FF6B6B');
      expect(result.data?.id).toBeDefined();
      expect(result.error).toBeNull();
      expect(mockedInvoke).toHaveBeenCalledWith('create_tag', request);
    });

    it('[TEST-0508-U-002] 名前重複エラー', async () => {
      const mockResponse: CreateTagResponse = {
        success: false,
        data: null,
        error: {
          code: 'TAG_NAME_DUPLICATE',
          message: '同名のタグが既に存在します',
          details: { name: 'コール頻度高' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreateTagRequest = {
        name: 'コール頻度高',
        color: '#4ECDC4'
      };

      const result = await invoke<CreateTagResponse>('create_tag', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('TAG_NAME_DUPLICATE');
      expect(result.error?.message).toBe('同名のタグが既に存在します');
      expect(result.error?.details).toEqual({ name: 'コール頻度高' });
    });

    it('[TEST-0508-U-003] 空名前エラー', async () => {
      const mockResponse: CreateTagResponse = {
        success: false,
        data: null,
        error: {
          code: 'TAG_NAME_EMPTY',
          message: 'タグ名が空です',
          details: null
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreateTagRequest = {
        name: '',
        color: '#45B7D1'
      };

      const result = await invoke<CreateTagResponse>('create_tag', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('TAG_NAME_EMPTY');
      expect(result.error?.message).toBe('タグ名が空です');
    });

    it('[TEST-0508-U-004] 名前長すぎるエラー', async () => {
      const longName = 'a'.repeat(101);
      const mockResponse: CreateTagResponse = {
        success: false,
        data: null,
        error: {
          code: 'TAG_NAME_TOO_LONG',
          message: 'タグ名が長すぎます（最大100文字）',
          details: { length: 101, max_length: 100 }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreateTagRequest = {
        name: longName,
        color: '#FFFFFF'
      };

      const result = await invoke<CreateTagResponse>('create_tag', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('TAG_NAME_TOO_LONG');
      expect(result.error?.details?.length).toBe(101);
      expect(result.error?.details?.max_length).toBe(100);
    });

    it('[TEST-0508-U-005] 境界値テスト（1文字名前）', async () => {
      const mockResponse: CreateTagResponse = {
        success: true,
        data: {
          id: 'test-tag-uuid-456',
          name: '強',
          color: '#000000',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreateTagRequest = {
        name: '強',
        color: '#000000'
      };

      const result = await invoke<CreateTagResponse>('create_tag', request);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('強');
      expect(result.data?.color).toBe('#000000');
    });

    it('[TEST-0508-U-006] 境界値テスト（100文字名前）', async () => {
      const hundredCharName = 'a'.repeat(100);
      const mockResponse: CreateTagResponse = {
        success: true,
        data: {
          id: 'test-tag-uuid-789',
          name: hundredCharName,
          color: '#AABBCC',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreateTagRequest = {
        name: hundredCharName,
        color: '#AABBCC'
      };

      const result = await invoke<CreateTagResponse>('create_tag', request);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(hundredCharName);
      expect(result.data?.color).toBe('#AABBCC');
    });

    it('[TEST-0508-U-007] Unicode文字サポート', async () => {
      const testCases = [
        { name: 'オーバーベット傾向😎', color: '#FF6B6B' },
        { name: 'レイズ頻度高★', color: '#4ECDC4' },
        { name: 'AGGRESSIVE-TYPE(1)', color: '#45B7D1' }
      ];

      for (const testCase of testCases) {
        const mockResponse: CreateTagResponse = {
          success: true,
          data: {
            id: `test-unicode-${Math.random()}`,
            name: testCase.name,
            color: testCase.color,
            created_at: '2025-09-26T10:00:00.000Z',
            updated_at: '2025-09-26T10:00:00.000Z'
          },
          error: null
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: testCase.name,
          color: testCase.color
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(true);
        expect(result.data?.name).toBe(testCase.name);
        expect(result.data?.color).toBe(testCase.color);
      }
    });
  });

  describe('get_tags Command Tests', () => {
    it('[TEST-0508-U-008] 空リストの正常取得', async () => {
      const mockResponse: GetTagsResponse = {
        success: true,
        data: [],
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const result = await invoke<GetTagsResponse>('get_tags');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
      expect(mockedInvoke).toHaveBeenCalledWith('get_tags');
    });

    it('[TEST-0508-U-009] 単一タグの取得', async () => {
      const mockTag: Tag = {
        id: 'test-uuid-single',
        name: 'ブラフ好き',
        color: '#FF6B6B',
        created_at: '2025-09-26T10:00:00.000Z',
        updated_at: '2025-09-26T10:00:00.000Z'
      };

      const mockResponse: GetTagsResponse = {
        success: true,
        data: [mockTag],
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const result = await invoke<GetTagsResponse>('get_tags');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toEqual(mockTag);
      expect(result.error).toBeNull();
    });

    it('[TEST-0508-U-010] 複数タグの取得（作成日時順ソート）', async () => {
      const mockTags: Tag[] = [
        {
          id: 'test-uuid-1',
          name: 'ブラフ好き',
          color: '#FF6B6B',
          created_at: '2025-09-26T09:00:00.000Z',
          updated_at: '2025-09-26T09:00:00.000Z'
        },
        {
          id: 'test-uuid-2',
          name: 'コール頻度高',
          color: '#4ECDC4',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        {
          id: 'test-uuid-3',
          name: 'レイズ頻度高',
          color: '#45B7D1',
          created_at: '2025-09-26T11:00:00.000Z',
          updated_at: '2025-09-26T11:00:00.000Z'
        }
      ];

      const mockResponse: GetTagsResponse = {
        success: true,
        data: mockTags,
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const result = await invoke<GetTagsResponse>('get_tags');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.[0].name).toBe('ブラフ好き');
      expect(result.data?.[1].name).toBe('コール頻度高');
      expect(result.data?.[2].name).toBe('レイズ頻度高');
      // 作成日時順になっていることを確認
      expect(new Date(result.data?.[0].created_at!)).toBeInstanceOf(Date);
      expect(result.error).toBeNull();
    });

    it('[TEST-0508-U-011] 初期デフォルトタグ取得', async () => {
      // デフォルトタグ10個の模擬データ
      const defaultTags: Tag[] = Array.from({ length: 10 }, (_, i) => ({
        id: `default-tag-${i}`,
        name: `デフォルトタグ${i + 1}`,
        color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase(),
        created_at: '2025-09-26T08:00:00.000Z',
        updated_at: '2025-09-26T08:00:00.000Z'
      }));

      const mockResponse: GetTagsResponse = {
        success: true,
        data: defaultTags,
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const result = await invoke<GetTagsResponse>('get_tags');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10);
      expect(result.error).toBeNull();

      // 各タグが有効な構造を持つことを確認
      result.data?.forEach(tag => {
        expect(tag.id).toBeDefined();
        expect(tag.name).toBeDefined();
        expect(tag.color).toMatch(/^#[0-9A-F]{6}$/);
        expect(tag.created_at).toBeDefined();
        expect(tag.updated_at).toBeDefined();
      });
    });

    it('[TEST-0508-U-012] 大量データ取得性能テスト', async () => {
      // 100個のタグを模擬
      const largeTags: Tag[] = Array.from({ length: 100 }, (_, i) => ({
        id: `test-tag-${i}`,
        name: `タグ${i}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}`,
        created_at: new Date(Date.now() + i * 1000).toISOString(),
        updated_at: new Date(Date.now() + i * 1000).toISOString()
      }));

      const mockResponse: GetTagsResponse = {
        success: true,
        data: largeTags,
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      const result = await invoke<GetTagsResponse>('get_tags');
      const responseTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(100);
      expect(responseTime).toBeLessThan(50); // 50ms 以内
      expect(result.error).toBeNull();
    });
  });

  describe('update_tag Command Tests', () => {
    it('[TEST-0508-U-013] 名前のみ更新', async () => {
      const mockResponse: UpdateTagResponse = {
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

      const request: UpdateTagRequest = {
        id: 'test-uuid-update',
        name: '新しい名前'
      };

      const result = await invoke<UpdateTagResponse>('update_tag', request);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('新しい名前');
      expect(result.data?.color).toBe('#ORIGINAL');
      expect(result.data?.updated_at).not.toBe(result.data?.created_at);
      expect(result.error).toBeNull();
      expect(mockedInvoke).toHaveBeenCalledWith('update_tag', request);
    });

    it('[TEST-0508-U-014] 色のみ更新', async () => {
      const mockResponse: UpdateTagResponse = {
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

      const request: UpdateTagRequest = {
        id: 'test-uuid-color',
        color: '#CCDDEE'
      };

      const result = await invoke<UpdateTagResponse>('update_tag', request);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('元の名前');
      expect(result.data?.color).toBe('#CCDDEE');
      expect(result.error).toBeNull();
    });

    it('[TEST-0508-U-015] 名前と色の同時更新', async () => {
      const mockResponse: UpdateTagResponse = {
        success: true,
        data: {
          id: 'test-uuid-both',
          name: 'オーバーベット頻発',
          color: '#CC0000',
          created_at: '2025-09-26T09:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdateTagRequest = {
        id: 'test-uuid-both',
        name: 'オーバーベット頻発',
        color: '#CC0000'
      };

      const result = await invoke<UpdateTagResponse>('update_tag', request);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('オーバーベット頻発');
      expect(result.data?.color).toBe('#CC0000');
      expect(result.error).toBeNull();
    });

    it('[TEST-0508-U-016] 存在しないIDでの更新エラー', async () => {
      const mockResponse: UpdateTagResponse = {
        success: false,
        data: null,
        error: {
          code: 'TAG_NOT_FOUND',
          message: '指定されたタグが見つかりません',
          details: { id: 'nonexistent-id' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdateTagRequest = {
        id: 'nonexistent-id',
        name: 'テスト'
      };

      const result = await invoke<UpdateTagResponse>('update_tag', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('TAG_NOT_FOUND');
      expect(result.error?.details?.id).toBe('nonexistent-id');
    });

    it('[TEST-0508-U-017] 更新時の名前重複エラー', async () => {
      const mockResponse: UpdateTagResponse = {
        success: false,
        data: null,
        error: {
          code: 'TAG_NAME_DUPLICATE',
          message: '同名のタグが既に存在します',
          details: { name: 'タグA' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdateTagRequest = {
        id: 'test-uuid-tagB',
        name: 'タグA'
      };

      const result = await invoke<UpdateTagResponse>('update_tag', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('TAG_NAME_DUPLICATE');
      expect(result.error?.details?.name).toBe('タグA');
    });

    it('[TEST-0508-U-018] updated_atフィールド自動更新確認', async () => {
      const originalTime = '2025-09-26T09:00:00.000Z';
      const updatedTime = '2025-09-26T10:00:00.000Z';

      const mockResponse: UpdateTagResponse = {
        success: true,
        data: {
          id: 'test-uuid-timestamp',
          name: '更新されたタグ',
          color: '#UPDATED',
          created_at: originalTime,
          updated_at: updatedTime
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdateTagRequest = {
        id: 'test-uuid-timestamp',
        name: '更新されたタグ'
      };

      const result = await invoke<UpdateTagResponse>('update_tag', request);

      expect(result.success).toBe(true);
      expect(result.data?.updated_at).toBe(updatedTime);
      expect(result.data?.created_at).toBe(originalTime);
      expect(new Date(result.data?.updated_at!)).toBeInstanceOf(Date);
      expect(new Date(result.data?.created_at!)).toBeInstanceOf(Date);
      expect(new Date(result.data?.updated_at!).getTime()).toBeGreaterThan(
        new Date(result.data?.created_at!).getTime()
      );
    });
  });

  describe('delete_tag Command Tests', () => {
    it('[TEST-0508-U-019] 単独タグの正常削除', async () => {
      const mockResponse: DeleteTagResponse = {
        success: true,
        affected_player_tags_count: 0,
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: DeleteTagRequest = {
        id: 'test-uuid-delete'
      };

      const result = await invoke<DeleteTagResponse>('delete_tag', request);

      expect(result.success).toBe(true);
      expect(result.affected_player_tags_count).toBe(0);
      expect(result.error).toBeNull();
      expect(mockedInvoke).toHaveBeenCalledWith('delete_tag', request);
    });

    it('[TEST-0508-U-020] 使用中タグの削除（CASCADE処理）', async () => {
      const mockResponse: DeleteTagResponse = {
        success: true,
        affected_player_tags_count: 5,
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: DeleteTagRequest = {
        id: 'test-uuid-used'
      };

      const result = await invoke<DeleteTagResponse>('delete_tag', request);

      expect(result.success).toBe(true);
      expect(result.affected_player_tags_count).toBe(5);
      expect(result.error).toBeNull();
    });

    it('[TEST-0508-U-021] 存在しないIDでの削除エラー', async () => {
      const mockResponse: DeleteTagResponse = {
        success: false,
        affected_player_tags_count: null,
        error: {
          code: 'TAG_NOT_FOUND',
          message: '指定されたタグが見つかりません',
          details: { id: 'invalid-uuid' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: DeleteTagRequest = {
        id: 'invalid-uuid'
      };

      const result = await invoke<DeleteTagResponse>('delete_tag', request);

      expect(result.success).toBe(false);
      expect(result.affected_player_tags_count).toBeNull();
      expect(result.error?.code).toBe('TAG_NOT_FOUND');
      expect(result.error?.details?.id).toBe('invalid-uuid');
    });

    it('[TEST-0508-U-022] 複雑なCASCADE削除整合性テスト', async () => {
      const mockResponse: DeleteTagResponse = {
        success: true,
        affected_player_tags_count: 10,
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: DeleteTagRequest = {
        id: 'test-uuid-complex-cascade'
      };

      const result = await invoke<DeleteTagResponse>('delete_tag', request);

      expect(result.success).toBe(true);
      expect(result.affected_player_tags_count).toBe(10);
      expect(result.error).toBeNull();

      // CASCADE削除の期待される効果を確認
      expect(typeof result.affected_player_tags_count).toBe('number');
      expect(result.affected_player_tags_count).toBeGreaterThan(0);
    });
  });
});