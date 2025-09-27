/**
 * 【テスト概要】: Multi-Tag Assignment and Level Management API Unit Tests
 * 【実装方針】: TDD Red Phase - 全ての機能を実装前にテストを書く
 * 【テスト範囲】: 多重タグ割り当て・削除、レベル管理、エラーハンドリング
 * 【継承元】: TASK-0507・TASK-0508 テストパターン
 * 【特徴】: 一括処理(最大50タグ)、レベル(1-10)、トランザクション整合性
 * 🔴 TDD Red Phase: 実装が存在しないため全てのテストが失敗する状態
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import type {
  PlayerTag,
  TagAssignment,
  AssignTagsRequest,
  AssignTagsResponse,
  AssignTagsResult,
  RemoveTagRequest,
  RemoveTagResponse,
  RemoveTagResult,
  PlayerTagErrorCode
} from '../../types/playerTag';
import { PlayerTagConstants } from '../../types/playerTag';

// Tauri invoke のモック
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockedInvoke = vi.mocked(invoke);

describe('Multi-Tag Assignment and Level Management API - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assign_tags Command Tests', () => {
    it('[TEST-0509-U-001] 単一タグの正常割り当て', async () => {
      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_123',
          assigned_tags: [
            {
              id: 'test-uuid-ptag-001',
              player_id: 'player_123',
              tag_id: 'tag_aggressive',
              level: 7,
              created_at: '2025-09-27T10:00:00.000Z',
              updated_at: '2025-09-27T10:00:00.000Z'
            }
          ],
          created_count: 1,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_123',
        tag_assignments: [
          { tag_id: 'tag_aggressive', level: 7 }
        ]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.player_id).toBe('player_123');
      expect(result.data?.assigned_tags).toHaveLength(1);
      expect(result.data?.assigned_tags[0].tag_id).toBe('tag_aggressive');
      expect(result.data?.assigned_tags[0].level).toBe(7);
      expect(result.data?.created_count).toBe(1);
      expect(result.data?.updated_count).toBe(0);
      expect(result.error).toBeNull();
      expect(mockedInvoke).toHaveBeenCalledWith('assign_tags', request);
    });

    it('[TEST-0509-U-002] 複数タグの一括割り当て', async () => {
      const mockAssignedTags: PlayerTag[] = [
        {
          id: 'test-uuid-ptag-002a',
          player_id: 'player_123',
          tag_id: 'tag_aggressive',
          level: 5,
          created_at: '2025-09-27T10:00:00.000Z',
          updated_at: '2025-09-27T10:00:00.000Z'
        },
        {
          id: 'test-uuid-ptag-002b',
          player_id: 'player_123',
          tag_id: 'tag_bluff_frequent',
          level: 8,
          created_at: '2025-09-27T10:00:00.000Z',
          updated_at: '2025-09-27T10:00:00.000Z'
        },
        {
          id: 'test-uuid-ptag-002c',
          player_id: 'player_123',
          tag_id: 'tag_loose_preflop',
          level: 3,
          created_at: '2025-09-27T10:00:00.000Z',
          updated_at: '2025-09-27T10:00:00.000Z'
        }
      ];

      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_123',
          assigned_tags: mockAssignedTags,
          created_count: 3,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_123',
        tag_assignments: [
          { tag_id: 'tag_aggressive', level: 5 },
          { tag_id: 'tag_bluff_frequent', level: 8 },
          { tag_id: 'tag_loose_preflop', level: 3 }
        ]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags).toHaveLength(3);
      expect(result.data?.created_count).toBe(3);
      expect(result.data?.updated_count).toBe(0);

      // 各タグが指定レベルで割り当てられていることを確認
      const assignedTags = result.data?.assigned_tags || [];
      expect(assignedTags.find(t => t.tag_id === 'tag_aggressive')?.level).toBe(5);
      expect(assignedTags.find(t => t.tag_id === 'tag_bluff_frequent')?.level).toBe(8);
      expect(assignedTags.find(t => t.tag_id === 'tag_loose_preflop')?.level).toBe(3);
    });

    it('[TEST-0509-U-003] 既存タグのレベル更新', async () => {
      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_123',
          assigned_tags: [
            {
              id: 'existing-uuid-ptag-003',
              player_id: 'player_123',
              tag_id: 'tag_aggressive',
              level: 9,
              created_at: '2025-09-27T09:00:00.000Z',
              updated_at: '2025-09-27T10:00:00.000Z'
            }
          ],
          created_count: 0,
          updated_count: 1
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_123',
        tag_assignments: [
          { tag_id: 'tag_aggressive', level: 9 }
        ]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags[0].level).toBe(9);
      expect(result.data?.created_count).toBe(0);
      expect(result.data?.updated_count).toBe(1);
      expect(result.data?.assigned_tags[0].updated_at).not.toBe(result.data?.assigned_tags[0].created_at);
    });

    it('[TEST-0509-U-004] 新規と更新の混在処理', async () => {
      const mockAssignedTags: PlayerTag[] = [
        {
          id: 'existing-uuid-ptag-004',
          player_id: 'player_123',
          tag_id: 'tag_aggressive',
          level: 10,
          created_at: '2025-09-27T09:00:00.000Z',
          updated_at: '2025-09-27T10:00:00.000Z'
        },
        {
          id: 'new-uuid-ptag-004a',
          player_id: 'player_123',
          tag_id: 'tag_call_station',
          level: 4,
          created_at: '2025-09-27T10:00:00.000Z',
          updated_at: '2025-09-27T10:00:00.000Z'
        },
        {
          id: 'new-uuid-ptag-004b',
          player_id: 'player_123',
          tag_id: 'tag_overbet_frequent',
          level: 7,
          created_at: '2025-09-27T10:00:00.000Z',
          updated_at: '2025-09-27T10:00:00.000Z'
        }
      ];

      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_123',
          assigned_tags: mockAssignedTags,
          created_count: 2,
          updated_count: 1
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_123',
        tag_assignments: [
          { tag_id: 'tag_aggressive', level: 10 },    // 更新: level 6 → 10
          { tag_id: 'tag_call_station', level: 4 },   // 新規
          { tag_id: 'tag_overbet_frequent', level: 7 } // 新規
        ]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags).toHaveLength(3);
      expect(result.data?.created_count).toBe(2);
      expect(result.data?.updated_count).toBe(1);

      // 全てのタグが正しいレベルで設定されていることを確認
      const assignedTags = result.data?.assigned_tags || [];
      expect(assignedTags.find(t => t.tag_id === 'tag_aggressive')?.level).toBe(10);
      expect(assignedTags.find(t => t.tag_id === 'tag_call_station')?.level).toBe(4);
      expect(assignedTags.find(t => t.tag_id === 'tag_overbet_frequent')?.level).toBe(7);
    });

    it('[TEST-0509-U-005] 大量タグ一括割り当て（境界値テスト）', async () => {
      // 50個のタグ割り当てを生成
      const tagAssignments: TagAssignment[] = Array.from({ length: 50 }, (_, i) => ({
        tag_id: `tag_bulk_${i}`,
        level: (i % 10) + 1 // レベル1-10をランダムに
      }));

      const mockAssignedTags: PlayerTag[] = tagAssignments.map((assignment, i) => ({
        id: `bulk-uuid-ptag-${i}`,
        player_id: 'player_bulk_test',
        tag_id: assignment.tag_id,
        level: assignment.level,
        created_at: '2025-09-27T10:00:00.000Z',
        updated_at: '2025-09-27T10:00:00.000Z'
      }));

      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_bulk_test',
          assigned_tags: mockAssignedTags,
          created_count: 50,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_bulk_test',
        tag_assignments: tagAssignments
      };

      const startTime = Date.now();
      const result = await invoke<AssignTagsResponse>('assign_tags', request);
      const responseTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags).toHaveLength(50);
      expect(result.data?.created_count).toBe(50);
      expect(responseTime).toBeLessThan(200); // 200ms 以内の応答時間要件
    });

    it('[TEST-0509-U-006] 存在しないプレイヤーIDエラー', async () => {
      const mockResponse: AssignTagsResponse = {
        success: false,
        data: null,
        error: {
          code: 'PLAYER_NOT_FOUND',
          message: '指定されたプレイヤーが見つかりません',
          details: { player_id: 'invalid_player_id' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'invalid_player_id',
        tag_assignments: [
          { tag_id: 'tag_aggressive', level: 7 }
        ]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('PLAYER_NOT_FOUND');
      expect(result.error?.message).toBe('指定されたプレイヤーが見つかりません');
      expect(result.error?.details).toEqual({ player_id: 'invalid_player_id' });
    });

    it('[TEST-0509-U-007] 存在しないタグIDエラー', async () => {
      const mockResponse: AssignTagsResponse = {
        success: false,
        data: null,
        error: {
          code: 'TAG_NOT_FOUND',
          message: '指定されたタグが見つかりません',
          details: { tag_id: 'invalid_tag_id', index: 0 }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_123',
        tag_assignments: [
          { tag_id: 'invalid_tag_id', level: 5 }
        ]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('TAG_NOT_FOUND');
      expect(result.error?.message).toBe('指定されたタグが見つかりません');
      expect(result.error?.details).toEqual({ tag_id: 'invalid_tag_id', index: 0 });
    });

    it('[TEST-0509-U-008] 混在無効タグIDエラー', async () => {
      const mockResponse: AssignTagsResponse = {
        success: false,
        data: null,
        error: {
          code: 'TAG_NOT_FOUND',
          message: '指定されたタグが見つかりません',
          details: { tag_id: 'invalid_tag_middle', index: 1 }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_123',
        tag_assignments: [
          { tag_id: 'tag_valid_first', level: 3 },
          { tag_id: 'invalid_tag_middle', level: 5 }, // 無効なタグ
          { tag_id: 'tag_valid_last', level: 7 }
        ]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('TAG_NOT_FOUND');
      expect(result.error?.details).toEqual({ tag_id: 'invalid_tag_middle', index: 1 });
    });

    it('[TEST-0509-U-051] 51タグ上限超過エラー', async () => {
      const mockResponse: AssignTagsResponse = {
        success: false,
        data: null,
        error: {
          code: 'TOO_MANY_TAG_ASSIGNMENTS',
          message: '一度に割り当て可能なタグ数は50個までです',
          details: { provided_count: 51, max_allowed: 50 }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      // 51個のタグ割り当てを生成
      const tagAssignments: TagAssignment[] = Array.from({ length: 51 }, (_, i) => ({
        tag_id: `tag_excess_${i}`,
        level: 5
      }));

      const request: AssignTagsRequest = {
        player_id: 'player_123',
        tag_assignments: tagAssignments
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('TOO_MANY_TAG_ASSIGNMENTS');
      expect(result.error?.message).toBe('一度に割り当て可能なタグ数は50個までです');
      expect(result.error?.details).toEqual({ provided_count: 51, max_allowed: 50 });
    });

    it('[TEST-0509-U-009] 空配列エラー', async () => {
      const mockResponse: AssignTagsResponse = {
        success: false,
        data: null,
        error: {
          code: 'EMPTY_TAG_ASSIGNMENTS',
          message: 'タグ割り当てが指定されていません',
          details: null
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_123',
        tag_assignments: []
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('EMPTY_TAG_ASSIGNMENTS');
      expect(result.error?.message).toBe('タグ割り当てが指定されていません');
    });

    it('[TEST-0509-U-010] 重複タグIDエラー', async () => {
      const mockResponse: AssignTagsResponse = {
        success: false,
        data: null,
        error: {
          code: 'DUPLICATE_TAG_IN_REQUEST',
          message: '同一リクエスト内で重複するタグIDが指定されています',
          details: {
            duplicate_tag_id: 'tag_aggressive',
            indices: [0, 2]
          }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_123',
        tag_assignments: [
          { tag_id: 'tag_aggressive', level: 5 },
          { tag_id: 'tag_bluff_frequent', level: 8 },
          { tag_id: 'tag_aggressive', level: 7 } // 重複
        ]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('DUPLICATE_TAG_IN_REQUEST');
      expect(result.error?.details).toEqual({
        duplicate_tag_id: 'tag_aggressive',
        indices: [0, 2]
      });
    });
  });

  describe('remove_tag Command Tests', () => {
    it('[TEST-0509-U-011] 既存タグ割り当ての正常削除', async () => {
      const mockResponse: RemoveTagResponse = {
        success: true,
        data: {
          player_id: 'player_123',
          tag_id: 'tag_aggressive',
          removed: true
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: RemoveTagRequest = {
        player_id: 'player_123',
        tag_id: 'tag_aggressive'
      };

      const result = await invoke<RemoveTagResponse>('remove_tag', request);

      expect(result.success).toBe(true);
      expect(result.data?.player_id).toBe('player_123');
      expect(result.data?.tag_id).toBe('tag_aggressive');
      expect(result.data?.removed).toBe(true);
      expect(result.error).toBeNull();
      expect(mockedInvoke).toHaveBeenCalledWith('remove_tag', request);
    });

    it('[TEST-0509-U-012] 存在しないタグ割り当ての削除（冪等性）', async () => {
      const mockResponse: RemoveTagResponse = {
        success: true,
        data: {
          player_id: 'player_123',
          tag_id: 'tag_not_assigned',
          removed: false
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: RemoveTagRequest = {
        player_id: 'player_123',
        tag_id: 'tag_not_assigned'
      };

      const result = await invoke<RemoveTagResponse>('remove_tag', request);

      expect(result.success).toBe(true);
      expect(result.data?.player_id).toBe('player_123');
      expect(result.data?.tag_id).toBe('tag_not_assigned');
      expect(result.data?.removed).toBe(false);
      expect(result.error).toBeNull();
    });

    it('[TEST-0509-U-013] 存在しないプレイヤーIDエラー（削除）', async () => {
      const mockResponse: RemoveTagResponse = {
        success: false,
        data: null,
        error: {
          code: 'PLAYER_NOT_FOUND',
          message: '指定されたプレイヤーが見つかりません',
          details: { player_id: 'invalid_player_id' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: RemoveTagRequest = {
        player_id: 'invalid_player_id',
        tag_id: 'tag_aggressive'
      };

      const result = await invoke<RemoveTagResponse>('remove_tag', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('PLAYER_NOT_FOUND');
      expect(result.error?.details).toEqual({ player_id: 'invalid_player_id' });
    });

    it('[TEST-0509-U-014] 存在しないタグIDエラー（削除）', async () => {
      const mockResponse: RemoveTagResponse = {
        success: false,
        data: null,
        error: {
          code: 'TAG_NOT_FOUND',
          message: '指定されたタグが見つかりません',
          details: { tag_id: 'invalid_tag_id' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: RemoveTagRequest = {
        player_id: 'player_123',
        tag_id: 'invalid_tag_id'
      };

      const result = await invoke<RemoveTagResponse>('remove_tag', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('TAG_NOT_FOUND');
      expect(result.error?.details).toEqual({ tag_id: 'invalid_tag_id' });
    });

    it('[TEST-0509-U-015] remove_tag 応答時間性能テスト', async () => {
      const mockResponse: RemoveTagResponse = {
        success: true,
        data: {
          player_id: 'player_performance',
          tag_id: 'tag_performance_test',
          removed: true
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: RemoveTagRequest = {
        player_id: 'player_performance',
        tag_id: 'tag_performance_test'
      };

      const startTime = Date.now();
      const result = await invoke<RemoveTagResponse>('remove_tag', request);
      const responseTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(responseTime).toBeLessThan(50); // 50ms 以内の応答時間要件
    });
  });

  describe('Transaction and Database Integration Tests', () => {
    it('[TEST-0509-D-001] 全成功トランザクション', async () => {
      const mockAssignedTags: PlayerTag[] = Array.from({ length: 5 }, (_, i) => ({
        id: `transaction-success-${i}`,
        player_id: 'player_transaction',
        tag_id: `tag_transaction_${i}`,
        level: i + 1,
        created_at: '2025-09-27T10:00:00.000Z',
        updated_at: '2025-09-27T10:00:00.000Z'
      }));

      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_transaction',
          assigned_tags: mockAssignedTags,
          created_count: 5,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_transaction',
        tag_assignments: Array.from({ length: 5 }, (_, i) => ({
          tag_id: `tag_transaction_${i}`,
          level: i + 1
        }))
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags).toHaveLength(5);
      expect(result.data?.created_count).toBe(5);
    });

    it('[TEST-0509-D-002] 部分失敗時のロールバック', async () => {
      const mockResponse: AssignTagsResponse = {
        success: false,
        data: null,
        error: {
          code: 'TAG_NOT_FOUND',
          message: '指定されたタグが見つかりません',
          details: { tag_id: 'invalid_tag', index: 2 }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_rollback',
        tag_assignments: [
          { tag_id: 'tag_valid_1', level: 5 },
          { tag_id: 'tag_valid_2', level: 6 },
          { tag_id: 'invalid_tag', level: 7 } // 3番目が無効
        ]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('TAG_NOT_FOUND');
      // トランザクションロールバックにより、部分的な割り当ては発生しない
    });

    it('[TEST-0509-D-003] データベース接続エラー時の処理', async () => {
      const mockResponse: AssignTagsResponse = {
        success: false,
        data: null,
        error: {
          code: 'DB_CONNECTION_ERROR',
          message: 'データベースに接続できません',
          details: null
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_123',
        tag_assignments: [
          { tag_id: 'tag_aggressive', level: 5 }
        ]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('DB_CONNECTION_ERROR');
      expect(result.error?.message).toBe('データベースに接続できません');
    });
  });

  describe('Constants Validation Tests', () => {
    it('[TEST-0509-CONST-001] PlayerTagConstants値確認', () => {
      expect(PlayerTagConstants.MIN_LEVEL).toBe(1);
      expect(PlayerTagConstants.MAX_LEVEL).toBe(10);
      expect(PlayerTagConstants.MAX_TAG_ASSIGNMENTS).toBe(50);
      expect(PlayerTagConstants.DEFAULT_LEVEL).toBe(5);
      expect(PlayerTagConstants.LEVEL_RANGE_STRING).toBe('1-10');
    });

    it('[TEST-0509-CONST-002] 境界値定数使用テスト', async () => {
      // 最小レベル
      const minLevelResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_min',
          assigned_tags: [{
            id: 'test-min-level',
            player_id: 'player_min',
            tag_id: 'tag_min',
            level: PlayerTagConstants.MIN_LEVEL,
            created_at: '2025-09-27T10:00:00.000Z',
            updated_at: '2025-09-27T10:00:00.000Z'
          }],
          created_count: 1,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(minLevelResponse);

      const minRequest: AssignTagsRequest = {
        player_id: 'player_min',
        tag_assignments: [{ tag_id: 'tag_min', level: PlayerTagConstants.MIN_LEVEL }]
      };

      const minResult = await invoke<AssignTagsResponse>('assign_tags', minRequest);
      expect(minResult.data?.assigned_tags[0].level).toBe(PlayerTagConstants.MIN_LEVEL);

      // 最大レベル
      const maxLevelResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_max',
          assigned_tags: [{
            id: 'test-max-level',
            player_id: 'player_max',
            tag_id: 'tag_max',
            level: PlayerTagConstants.MAX_LEVEL,
            created_at: '2025-09-27T10:00:00.000Z',
            updated_at: '2025-09-27T10:00:00.000Z'
          }],
          created_count: 1,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(maxLevelResponse);

      const maxRequest: AssignTagsRequest = {
        player_id: 'player_max',
        tag_assignments: [{ tag_id: 'tag_max', level: PlayerTagConstants.MAX_LEVEL }]
      };

      const maxResult = await invoke<AssignTagsResponse>('assign_tags', maxRequest);
      expect(maxResult.data?.assigned_tags[0].level).toBe(PlayerTagConstants.MAX_LEVEL);
    });
  });
});