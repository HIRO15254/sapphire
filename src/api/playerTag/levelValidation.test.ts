/**
 * 【テスト概要】: Level Validation (1-10) Tests for Multi-Tag Assignment API
 * 【実装方針】: TDD Red Phase - レベル値バリデーション専用テスト
 * 【テスト範囲】: レベル範囲(1-10)検証、境界値、無効値、混在パターン
 * 【継承元】: TASK-0507・TASK-0508 バリデーションテストパターン
 * 【特徴】: 詳細なエラー情報、境界値テスト、複数レベル組み合わせ
 * 🔴 TDD Red Phase: 実装が存在しないため全てのテストが失敗する状態
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import type {
  AssignTagsRequest,
  AssignTagsResponse
} from '../../types/playerTag';
import { PlayerTagConstants } from '../../types/playerTag';

// Tauri invoke のモック
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockedInvoke = vi.mocked(invoke);

describe('Level Validation Tests - Multi-Tag Assignment API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid Level Range Tests (1-10)', () => {
    it('[TEST-0509-L-001] 最小レベル値（1）', async () => {
      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_level_test',
          assigned_tags: [{
            id: 'test-level-1',
            player_id: 'player_level_test',
            tag_id: 'tag_level_min',
            level: 1,
            created_at: '2025-09-27T10:00:00.000Z',
            updated_at: '2025-09-27T10:00:00.000Z'
          }],
          created_count: 1,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_level_test',
        tag_assignments: [{ tag_id: 'tag_level_min', level: 1 }]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags[0].level).toBe(1);
      expect(result.error).toBeNull();
    });

    it('[TEST-0509-L-002] 最大レベル値（10）', async () => {
      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_level_test',
          assigned_tags: [{
            id: 'test-level-10',
            player_id: 'player_level_test',
            tag_id: 'tag_level_max',
            level: 10,
            created_at: '2025-09-27T10:00:00.000Z',
            updated_at: '2025-09-27T10:00:00.000Z'
          }],
          created_count: 1,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_level_test',
        tag_assignments: [{ tag_id: 'tag_level_max', level: 10 }]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags[0].level).toBe(10);
      expect(result.error).toBeNull();
    });

    it('[TEST-0509-L-003] 中間レベル値（5）', async () => {
      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_level_test',
          assigned_tags: [{
            id: 'test-level-5',
            player_id: 'player_level_test',
            tag_id: 'tag_level_middle',
            level: 5,
            created_at: '2025-09-27T10:00:00.000Z',
            updated_at: '2025-09-27T10:00:00.000Z'
          }],
          created_count: 1,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_level_test',
        tag_assignments: [{ tag_id: 'tag_level_middle', level: 5 }]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags[0].level).toBe(5);
      expect(result.error).toBeNull();
    });

    it('[TEST-0509-L-004] 全レベル値範囲テスト（1-10）', async () => {
      const validLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      for (const level of validLevels) {
        const mockResponse: AssignTagsResponse = {
          success: true,
          data: {
            player_id: 'player_all_levels',
            assigned_tags: [{
              id: `test-level-${level}`,
              player_id: 'player_all_levels',
              tag_id: `tag_level_${level}`,
              level: level,
              created_at: '2025-09-27T10:00:00.000Z',
              updated_at: '2025-09-27T10:00:00.000Z'
            }],
            created_count: 1,
            updated_count: 0
          },
          error: null
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: AssignTagsRequest = {
          player_id: 'player_all_levels',
          tag_assignments: [{ tag_id: `tag_level_${level}`, level: level }]
        };

        const result = await invoke<AssignTagsResponse>('assign_tags', request);

        expect(result.success).toBe(true);
        expect(result.data?.assigned_tags[0].level).toBe(level);
        expect(result.error).toBeNull();
      }
    });
  });

  describe('Invalid Level Range Tests', () => {
    it('[TEST-0509-L-005] レベル0エラー', async () => {
      const mockResponse: AssignTagsResponse = {
        success: false,
        data: null,
        error: {
          code: 'INVALID_LEVEL_RANGE',
          message: 'レベルは1-10の範囲で入力してください',
          details: {
            provided_level: 0,
            valid_range: '1-10',
            tag_index: 0
          }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_invalid_level',
        tag_assignments: [{ tag_id: 'tag_invalid', level: 0 }]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_LEVEL_RANGE');
      expect(result.error?.message).toBe('レベルは1-10の範囲で入力してください');
      expect(result.error?.details).toEqual({
        provided_level: 0,
        valid_range: '1-10',
        tag_index: 0
      });
    });

    it('[TEST-0509-L-006] レベル11エラー', async () => {
      const mockResponse: AssignTagsResponse = {
        success: false,
        data: null,
        error: {
          code: 'INVALID_LEVEL_RANGE',
          message: 'レベルは1-10の範囲で入力してください',
          details: {
            provided_level: 11,
            valid_range: '1-10',
            tag_index: 0
          }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_invalid_level',
        tag_assignments: [{ tag_id: 'tag_invalid', level: 11 }]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_LEVEL_RANGE');
      expect(result.error?.details).toEqual({
        provided_level: 11,
        valid_range: '1-10',
        tag_index: 0
      });
    });

    it('[TEST-0509-L-007] 負のレベルエラー', async () => {
      const negativeLevels = [-1, -5, -10];

      for (const level of negativeLevels) {
        const mockResponse: AssignTagsResponse = {
          success: false,
          data: null,
          error: {
            code: 'INVALID_LEVEL_RANGE',
            message: 'レベルは1-10の範囲で入力してください',
            details: {
              provided_level: level,
              valid_range: '1-10',
              tag_index: 0
            }
          }
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: AssignTagsRequest = {
          player_id: 'player_negative_level',
          tag_assignments: [{ tag_id: 'tag_negative', level: level }]
        };

        const result = await invoke<AssignTagsResponse>('assign_tags', request);

        expect(result.success).toBe(false);
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe('INVALID_LEVEL_RANGE');
        expect(result.error?.details).toEqual({
          provided_level: level,
          valid_range: '1-10',
          tag_index: 0
        });
      }
    });

    it('[TEST-0509-L-008] 極端に大きなレベルエラー', async () => {
      const largeLevels = [100, 999, 2147483647];

      for (const level of largeLevels) {
        const mockResponse: AssignTagsResponse = {
          success: false,
          data: null,
          error: {
            code: 'INVALID_LEVEL_RANGE',
            message: 'レベルは1-10の範囲で入力してください',
            details: {
              provided_level: level,
              valid_range: '1-10',
              tag_index: 0
            }
          }
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: AssignTagsRequest = {
          player_id: 'player_large_level',
          tag_assignments: [{ tag_id: 'tag_large', level: level }]
        };

        const result = await invoke<AssignTagsResponse>('assign_tags', request);

        expect(result.success).toBe(false);
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe('INVALID_LEVEL_RANGE');
        expect(result.error?.details).toEqual({
          provided_level: level,
          valid_range: '1-10',
          tag_index: 0
        });
      }
    });
  });

  describe('Boundary Value and Special Case Tests', () => {
    it('[TEST-0509-L-009] 複数タグの異なるレベル組み合わせ', async () => {
      const mockAssignedTags = Array.from({ length: 10 }, (_, i) => ({
        id: `test-combo-${i}`,
        player_id: 'player_combo',
        tag_id: `tag_combo_${i}`,
        level: i + 1,
        created_at: '2025-09-27T10:00:00.000Z',
        updated_at: '2025-09-27T10:00:00.000Z'
      }));

      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_combo',
          assigned_tags: mockAssignedTags,
          created_count: 10,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_combo',
        tag_assignments: Array.from({ length: 10 }, (_, i) => ({
          tag_id: `tag_combo_${i}`,
          level: i + 1 // レベル1-10を全て使用
        }))
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags).toHaveLength(10);
      expect(result.data?.created_count).toBe(10);

      // 各レベルが正しく設定されていることを確認
      result.data?.assigned_tags.forEach((tag, index) => {
        expect(tag.level).toBe(index + 1);
      });
    });

    it('[TEST-0509-L-010] 混在無効レベルエラー', async () => {
      const mockResponse: AssignTagsResponse = {
        success: false,
        data: null,
        error: {
          code: 'INVALID_LEVEL_RANGE',
          message: 'レベルは1-10の範囲で入力してください',
          details: {
            provided_level: 11,
            valid_range: '1-10',
            tag_index: 1
          }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_mixed_invalid',
        tag_assignments: [
          { tag_id: 'tag_valid_1', level: 5 },    // 有効
          { tag_id: 'tag_invalid', level: 11 },   // 無効（index: 1）
          { tag_id: 'tag_valid_2', level: 7 }     // 有効
        ]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_LEVEL_RANGE');
      expect(result.error?.details).toEqual({
        provided_level: 11,
        valid_range: '1-10',
        tag_index: 1
      });
    });

    it('[TEST-0509-L-011] 境界値近接テスト', async () => {
      const boundaryTestCases = [
        { level: 1, description: '最小境界値' },
        { level: 2, description: '最小境界値+1' },
        { level: 9, description: '最大境界値-1' },
        { level: 10, description: '最大境界値' }
      ];

      for (const testCase of boundaryTestCases) {
        const mockResponse: AssignTagsResponse = {
          success: true,
          data: {
            player_id: 'player_boundary',
            assigned_tags: [{
              id: `test-boundary-${testCase.level}`,
              player_id: 'player_boundary',
              tag_id: `tag_boundary_${testCase.level}`,
              level: testCase.level,
              created_at: '2025-09-27T10:00:00.000Z',
              updated_at: '2025-09-27T10:00:00.000Z'
            }],
            created_count: 1,
            updated_count: 0
          },
          error: null
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: AssignTagsRequest = {
          player_id: 'player_boundary',
          tag_assignments: [{ tag_id: `tag_boundary_${testCase.level}`, level: testCase.level }]
        };

        const result = await invoke<AssignTagsResponse>('assign_tags', request);

        expect(result.success).toBe(true);
        expect(result.data?.assigned_tags[0].level).toBe(testCase.level);
        expect(result.error).toBeNull();
      }
    });

    it('[TEST-0509-L-012] 境界値違反テスト', async () => {
      const invalidBoundaryTestCases = [
        { level: 0, description: '最小境界値-1' },
        { level: 11, description: '最大境界値+1' }
      ];

      for (const testCase of invalidBoundaryTestCases) {
        const mockResponse: AssignTagsResponse = {
          success: false,
          data: null,
          error: {
            code: 'INVALID_LEVEL_RANGE',
            message: 'レベルは1-10の範囲で入力してください',
            details: {
              provided_level: testCase.level,
              valid_range: '1-10',
              tag_index: 0
            }
          }
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: AssignTagsRequest = {
          player_id: 'player_invalid_boundary',
          tag_assignments: [{ tag_id: `tag_invalid_${testCase.level}`, level: testCase.level }]
        };

        const result = await invoke<AssignTagsResponse>('assign_tags', request);

        expect(result.success).toBe(false);
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe('INVALID_LEVEL_RANGE');
        expect(result.error?.details).toEqual({
          provided_level: testCase.level,
          valid_range: '1-10',
          tag_index: 0
        });
      }
    });
  });

  describe('Constants-based Level Validation Tests', () => {
    it('[TEST-0509-L-013] 定数を使用した最小レベルテスト', async () => {
      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_const_min',
          assigned_tags: [{
            id: 'test-const-min',
            player_id: 'player_const_min',
            tag_id: 'tag_const_min',
            level: PlayerTagConstants.MIN_LEVEL,
            created_at: '2025-09-27T10:00:00.000Z',
            updated_at: '2025-09-27T10:00:00.000Z'
          }],
          created_count: 1,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_const_min',
        tag_assignments: [{ tag_id: 'tag_const_min', level: PlayerTagConstants.MIN_LEVEL }]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags[0].level).toBe(PlayerTagConstants.MIN_LEVEL);
      expect(PlayerTagConstants.MIN_LEVEL).toBe(1);
    });

    it('[TEST-0509-L-014] 定数を使用した最大レベルテスト', async () => {
      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_const_max',
          assigned_tags: [{
            id: 'test-const-max',
            player_id: 'player_const_max',
            tag_id: 'tag_const_max',
            level: PlayerTagConstants.MAX_LEVEL,
            created_at: '2025-09-27T10:00:00.000Z',
            updated_at: '2025-09-27T10:00:00.000Z'
          }],
          created_count: 1,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_const_max',
        tag_assignments: [{ tag_id: 'tag_const_max', level: PlayerTagConstants.MAX_LEVEL }]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags[0].level).toBe(PlayerTagConstants.MAX_LEVEL);
      expect(PlayerTagConstants.MAX_LEVEL).toBe(10);
    });

    it('[TEST-0509-L-015] 定数を使用したデフォルトレベルテスト', async () => {
      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_const_default',
          assigned_tags: [{
            id: 'test-const-default',
            player_id: 'player_const_default',
            tag_id: 'tag_const_default',
            level: PlayerTagConstants.DEFAULT_LEVEL,
            created_at: '2025-09-27T10:00:00.000Z',
            updated_at: '2025-09-27T10:00:00.000Z'
          }],
          created_count: 1,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_const_default',
        tag_assignments: [{ tag_id: 'tag_const_default', level: PlayerTagConstants.DEFAULT_LEVEL }]
      };

      const result = await invoke<AssignTagsResponse>('assign_tags', request);

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags[0].level).toBe(PlayerTagConstants.DEFAULT_LEVEL);
      expect(PlayerTagConstants.DEFAULT_LEVEL).toBe(5);
    });

    it('[TEST-0509-L-016] レベル範囲文字列定数確認', () => {
      expect(PlayerTagConstants.LEVEL_RANGE_STRING).toBe('1-10');

      // レベル範囲文字列がMIN_LEVEL-MAX_LEVELと一致することを確認
      const expectedRangeString = `${PlayerTagConstants.MIN_LEVEL}-${PlayerTagConstants.MAX_LEVEL}`;
      expect(PlayerTagConstants.LEVEL_RANGE_STRING).toBe(expectedRangeString);
    });
  });

  describe('Performance Tests with Level Validation', () => {
    it('[TEST-0509-L-017] 大量レベル組み合わせ性能テスト', async () => {
      // 50個のタグにランダムなレベルを設定
      const tagAssignments = Array.from({ length: 50 }, (_, i) => ({
        tag_id: `tag_perf_${i}`,
        level: (i % 10) + 1 // 1-10のレベルをサイクル
      }));

      const mockAssignedTags = tagAssignments.map((assignment, i) => ({
        id: `perf-level-${i}`,
        player_id: 'player_perf_level',
        tag_id: assignment.tag_id,
        level: assignment.level,
        created_at: '2025-09-27T10:00:00.000Z',
        updated_at: '2025-09-27T10:00:00.000Z'
      }));

      const mockResponse: AssignTagsResponse = {
        success: true,
        data: {
          player_id: 'player_perf_level',
          assigned_tags: mockAssignedTags,
          created_count: 50,
          updated_count: 0
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: AssignTagsRequest = {
        player_id: 'player_perf_level',
        tag_assignments: tagAssignments
      };

      const startTime = Date.now();
      const result = await invoke<AssignTagsResponse>('assign_tags', request);
      const responseTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data?.assigned_tags).toHaveLength(50);
      expect(responseTime).toBeLessThan(200); // 200ms以内

      // 全てのレベルが有効範囲内であることを確認
      result.data?.assigned_tags.forEach(tag => {
        expect(tag.level).toBeGreaterThanOrEqual(PlayerTagConstants.MIN_LEVEL);
        expect(tag.level).toBeLessThanOrEqual(PlayerTagConstants.MAX_LEVEL);
      });
    });
  });
});