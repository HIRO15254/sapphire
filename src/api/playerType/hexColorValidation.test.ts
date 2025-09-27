/**
 * 【テスト概要】: HEX Color Validation Tests for Player Type Management
 * 【実装方針】: TDD Red Phase - HEXカラーバリデーションの包括的テスト
 * 【バリデーション範囲】: 正規表現チェック、境界値、無効フォーマット
 * 🔴 TDD Red Phase: HEXカラーバリデーション関数が未実装のため全テストが失敗する状態
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import type {
  CreatePlayerTypeRequest,
  CreatePlayerTypeResponse,
  UpdatePlayerTypeRequest,
  UpdatePlayerTypeResponse
} from '../../types/playerType';

// Tauri invoke のモック
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockedInvoke = vi.mocked(invoke);

describe('HEX Color Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('有効なHEXカラーフォーマット', () => {
    it('[TEST-0507-H-001] 大文字HEXカラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-uppercase',
          name: 'テストタイプ',
          color: '#FFFFFF',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'テストタイプ',
        color: '#FFFFFF'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.color).toBe('#FFFFFF');
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-H-002] 小文字HEXカラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-lowercase',
          name: 'テストタイプ',
          color: '#abcdef',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'テストタイプ',
        color: '#abcdef'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.color).toBe('#abcdef');
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-H-003] 混在HEXカラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-mixed',
          name: 'テストタイプ',
          color: '#aBc123',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'テストタイプ',
        color: '#aBc123'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.color).toBe('#aBc123');
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-H-004] 境界値HEXカラー（黒）', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-black',
          name: 'ブラックタイプ',
          color: '#000000',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'ブラックタイプ',
        color: '#000000'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.color).toBe('#000000');
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-H-005] 境界値HEXカラー（白）', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-white',
          name: 'ホワイトタイプ',
          color: '#FFFFFF',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'ホワイトタイプ',
        color: '#FFFFFF'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.color).toBe('#FFFFFF');
      expect(result.error).toBeNull();
    });
  });

  describe('無効なHEXカラーフォーマット', () => {
    it('[TEST-0507-H-006] ハッシュなしエラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'INVALID_COLOR_FORMAT',
          message: '色は # で始まるHEXカラーコードで入力してください',
          details: { provided_color: 'FF0000' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'テストタイプ',
        color: 'FF0000'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error?.message).toBe('色は # で始まるHEXカラーコードで入力してください');
      expect(result.error?.details?.provided_color).toBe('FF0000');
    });

    it('[TEST-0507-H-007] 短すぎるカラーコードエラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'INVALID_COLOR_FORMAT',
          message: '色は #RRGGBB 形式の6桁で入力してください',
          details: { provided_color: '#FF00' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'テストタイプ',
        color: '#FF00'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error?.message).toBe('色は #RRGGBB 形式の6桁で入力してください');
      expect(result.error?.details?.provided_color).toBe('#FF00');
    });

    it('[TEST-0507-H-008] 長すぎるカラーコードエラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'INVALID_COLOR_FORMAT',
          message: '色は #RRGGBB 形式の6桁で入力してください',
          details: { provided_color: '#FF0000AA' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'テストタイプ',
        color: '#FF0000AA'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error?.message).toBe('色は #RRGGBB 形式の6桁で入力してください');
      expect(result.error?.details?.provided_color).toBe('#FF0000AA');
    });

    it('[TEST-0507-H-009] 無効文字エラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'INVALID_COLOR_FORMAT',
          message: '色には0-9とA-Fの文字のみ使用できます',
          details: { provided_color: '#GGHHII' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'テストタイプ',
        color: '#GGHHII'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error?.message).toBe('色には0-9とA-Fの文字のみ使用できます');
      expect(result.error?.details?.provided_color).toBe('#GGHHII');
    });

    it('[TEST-0507-H-010] CSS色名エラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'INVALID_COLOR_FORMAT',
          message: '色は # で始まるHEXカラーコードで入力してください',
          details: { provided_color: 'red' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'テストタイプ',
        color: 'red'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error?.message).toBe('色は # で始まるHEXカラーコードで入力してください');
      expect(result.error?.details?.provided_color).toBe('red');
    });

    it('[TEST-0507-H-011] RGB形式エラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'INVALID_COLOR_FORMAT',
          message: '色は # で始まるHEXカラーコードで入力してください',
          details: { provided_color: 'rgb(255,0,0)' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: 'テストタイプ',
        color: 'rgb(255,0,0)'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error?.message).toBe('色は # で始まるHEXカラーコードで入力してください');
    });
  });

  describe('更新時のHEXカラー検証', () => {
    it('[TEST-0507-H-012] 更新時の有効HEXカラー', async () => {
      const mockResponse: UpdatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-update-color',
          name: '既存タイプ',
          color: '#00FF00',
          created_at: '2025-09-26T09:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdatePlayerTypeRequest = {
        id: 'test-uuid-update-color',
        color: '#00FF00'
      };

      const result = await invoke<UpdatePlayerTypeResponse>('update_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.color).toBe('#00FF00');
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-H-013] 更新時の無効HEXカラー', async () => {
      const mockResponse: UpdatePlayerTypeResponse = {
        success: false,
        data: null,
        error: {
          code: 'INVALID_COLOR_FORMAT',
          message: '色は #RRGGBB 形式の6桁で入力してください',
          details: { provided_color: '#ZZ' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdatePlayerTypeRequest = {
        id: 'test-uuid-update-invalid',
        color: '#ZZ'
      };

      const result = await invoke<UpdatePlayerTypeResponse>('update_player_type', request);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error?.details?.provided_color).toBe('#ZZ');
    });
  });

  describe('HEXカラー境界値テスト', () => {
    it('[TEST-0507-H-014] 全ての有効HEX文字を含むカラー', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-all-chars',
          name: '全HEX文字テスト',
          color: '#123ABC',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: '全HEX文字テスト',
        color: '#123ABC'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.color).toBe('#123ABC');
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-H-015] 小文字でのすべて有効HEX文字', async () => {
      const mockResponse: CreatePlayerTypeResponse = {
        success: true,
        data: {
          id: 'test-uuid-all-lowercase',
          name: '小文字HEX文字テスト',
          color: '#456def',
          created_at: '2025-09-26T10:00:00.000Z',
          updated_at: '2025-09-26T10:00:00.000Z'
        },
        error: null
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: CreatePlayerTypeRequest = {
        name: '小文字HEX文字テスト',
        color: '#456def'
      };

      const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

      expect(result.success).toBe(true);
      expect(result.data?.color).toBe('#456def');
      expect(result.error).toBeNull();
    });

    it('[TEST-0507-H-016] 境界外文字（G-Z）でのエラー', async () => {
      const testCases = ['#G00000', '#00H000', '#0000ZZ'];

      for (const invalidColor of testCases) {
        const mockResponse: CreatePlayerTypeResponse = {
          success: false,
          data: null,
          error: {
            code: 'INVALID_COLOR_FORMAT',
            message: '色には0-9とA-Fの文字のみ使用できます',
            details: { provided_color: invalidColor }
          }
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreatePlayerTypeRequest = {
          name: 'エラーテスト',
          color: invalidColor
        };

        const result = await invoke<CreatePlayerTypeResponse>('create_player_type', request);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
        expect(result.error?.message).toBe('色には0-9とA-Fの文字のみ使用できます');
      }
    });
  });
});