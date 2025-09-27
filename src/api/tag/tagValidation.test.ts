/**
 * 【テスト概要】: Tag Management API Validation Tests
 * 【実装方針】: TDD Red Phase - バリデーション機能を実装前にテストを書く
 * 【テスト範囲】: タグ名バリデーション、HEXカラーバリデーション
 * 【継承元】: TASK-0507 Player Type Validation パターン
 * 🔴 TDD Red Phase: バリデーション実装が存在しないため全てのテストが失敗する状態
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import type {
  CreateTagRequest,
  CreateTagResponse,
  UpdateTagRequest,
  UpdateTagResponse
} from '../../types/tag';

// Tauri invoke のモック
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockedInvoke = vi.mocked(invoke);

describe('Tag Management API - Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tag Name Validation Tests', () => {
    describe('有効な名前パターン', () => {
      it('[TEST-0508-N-001] 基本的な日本語名', async () => {
        const testNames = [
          'アグレッシブ',
          'パッシブ',
          'ブラフ好き',
          'コール頻度高',
          'レイズ頻度高'
        ];

        for (const name of testNames) {
          const mockResponse: CreateTagResponse = {
            success: true,
            data: {
              id: `test-japanese-${Math.random()}`,
              name: name,
              color: '#FF6B6B',
              created_at: '2025-09-26T10:00:00.000Z',
              updated_at: '2025-09-26T10:00:00.000Z'
            },
            error: null
          };

          mockedInvoke.mockResolvedValue(mockResponse);

          const request: CreateTagRequest = {
            name: name,
            color: '#FF6B6B'
          };

          const result = await invoke<CreateTagResponse>('create_tag', request);

          expect(result.success).toBe(true);
          expect(result.data?.name).toBe(name);
          expect(result.error).toBeNull();
        }
      });

      it('[TEST-0508-N-002] 英数字混在名', async () => {
        const testNames = [
          'Type-A',
          'Strategy1',
          'Level-10-Player',
          'ABC123',
          'スタイル_V2'
        ];

        for (const name of testNames) {
          const mockResponse: CreateTagResponse = {
            success: true,
            data: {
              id: `test-alphanumeric-${Math.random()}`,
              name: name,
              color: '#4ECDC4',
              created_at: '2025-09-26T10:00:00.000Z',
              updated_at: '2025-09-26T10:00:00.000Z'
            },
            error: null
          };

          mockedInvoke.mockResolvedValue(mockResponse);

          const request: CreateTagRequest = {
            name: name,
            color: '#4ECDC4'
          };

          const result = await invoke<CreateTagResponse>('create_tag', request);

          expect(result.success).toBe(true);
          expect(result.data?.name).toBe(name);
          expect(result.error).toBeNull();
        }
      });

      it('[TEST-0508-N-003] 特殊文字・記号名', async () => {
        const testNames = [
          '強い★',
          'レベル(高)',
          'タイプ【A】',
          'スタイル♠',
          'Player-Type_1'
        ];

        for (const name of testNames) {
          const mockResponse: CreateTagResponse = {
            success: true,
            data: {
              id: `test-special-${Math.random()}`,
              name: name,
              color: '#45B7D1',
              created_at: '2025-09-26T10:00:00.000Z',
              updated_at: '2025-09-26T10:00:00.000Z'
            },
            error: null
          };

          mockedInvoke.mockResolvedValue(mockResponse);

          const request: CreateTagRequest = {
            name: name,
            color: '#45B7D1'
          };

          const result = await invoke<CreateTagResponse>('create_tag', request);

          expect(result.success).toBe(true);
          expect(result.data?.name).toBe(name);
          expect(result.error).toBeNull();
        }
      });

      it('[TEST-0508-N-004] 絵文字・Unicode名', async () => {
        const testNames = [
          '強い😎',
          'ブラフ🎭',
          'アグレッシブ💪',
          'お金持ち💰',
          '初心者🔰'
        ];

        for (const name of testNames) {
          const mockResponse: CreateTagResponse = {
            success: true,
            data: {
              id: `test-emoji-${Math.random()}`,
              name: name,
              color: '#96CEB4',
              created_at: '2025-09-26T10:00:00.000Z',
              updated_at: '2025-09-26T10:00:00.000Z'
            },
            error: null
          };

          mockedInvoke.mockResolvedValue(mockResponse);

          const request: CreateTagRequest = {
            name: name,
            color: '#96CEB4'
          };

          const result = await invoke<CreateTagResponse>('create_tag', request);

          expect(result.success).toBe(true);
          expect(result.data?.name).toBe(name);
          expect(result.error).toBeNull();
        }
      });
    });

    describe('無効な名前パターン', () => {
      it('[TEST-0508-N-005] 空文字列名エラー', async () => {
        const testCases = [
          { name: '', description: '空文字列' },
          { name: '   ', description: '空白のみ' }
        ];

        for (const testCase of testCases) {
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
            name: testCase.name,
            color: '#FECA57'
          };

          const result = await invoke<CreateTagResponse>('create_tag', request);

          expect(result.success).toBe(false);
          expect(result.data).toBeNull();
          expect(result.error?.code).toBe('TAG_NAME_EMPTY');
          expect(result.error?.message).toBe('タグ名が空です');
        }
      });

      it('[TEST-0508-N-006] 長すぎる名前エラー', async () => {
        const testCases = [
          { name: 'あ'.repeat(101), length: 101, description: '101文字の日本語文字列' },
          { name: 'a'.repeat(150), length: 150, description: '150文字の英数字文字列' },
          { name: '🎭'.repeat(67), length: 200, description: '200文字のUnicode文字列（概算）' }
        ];

        for (const testCase of testCases) {
          const mockResponse: CreateTagResponse = {
            success: false,
            data: null,
            error: {
              code: 'TAG_NAME_TOO_LONG',
              message: 'タグ名が長すぎます（最大100文字）',
              details: {
                length: testCase.name.length,
                max_length: 100
              }
            }
          };

          mockedInvoke.mockResolvedValue(mockResponse);

          const request: CreateTagRequest = {
            name: testCase.name,
            color: '#FF6B6B'
          };

          const result = await invoke<CreateTagResponse>('create_tag', request);

          expect(result.success).toBe(false);
          expect(result.data).toBeNull();
          expect(result.error?.code).toBe('TAG_NAME_TOO_LONG');
          expect(result.error?.message).toBe('タグ名が長すぎます（最大100文字）');
          expect(result.error?.details?.max_length).toBe(100);
        }
      });
    });

    describe('境界値・重複テスト', () => {
      it('[TEST-0508-N-007] 長さ境界値テスト', async () => {
        const testCases = [
          { name: '強', length: 1, shouldSucceed: true, description: '1文字' },
          { name: 'a'.repeat(50), length: 50, shouldSucceed: true, description: '50文字' },
          { name: 'a'.repeat(100), length: 100, shouldSucceed: true, description: '100文字' },
          { name: 'a'.repeat(101), length: 101, shouldSucceed: false, description: '101文字' }
        ];

        for (const testCase of testCases) {
          if (testCase.shouldSucceed) {
            const mockResponse: CreateTagResponse = {
              success: true,
              data: {
                id: `test-boundary-${Math.random()}`,
                name: testCase.name,
                color: '#000000',
                created_at: '2025-09-26T10:00:00.000Z',
                updated_at: '2025-09-26T10:00:00.000Z'
              },
              error: null
            };

            mockedInvoke.mockResolvedValue(mockResponse);

            const request: CreateTagRequest = {
              name: testCase.name,
              color: '#000000'
            };

            const result = await invoke<CreateTagResponse>('create_tag', request);

            expect(result.success).toBe(true);
            expect(result.data?.name).toBe(testCase.name);
            expect(result.error).toBeNull();
          } else {
            const mockResponse: CreateTagResponse = {
              success: false,
              data: null,
              error: {
                code: 'TAG_NAME_TOO_LONG',
                message: 'タグ名が長すぎます（最大100文字）',
                details: { length: testCase.length, max_length: 100 }
              }
            };

            mockedInvoke.mockResolvedValue(mockResponse);

            const request: CreateTagRequest = {
              name: testCase.name,
              color: '#000000'
            };

            const result = await invoke<CreateTagResponse>('create_tag', request);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('TAG_NAME_TOO_LONG');
          }
        }
      });

      it('[TEST-0508-N-008] 大文字小文字重複テスト', async () => {
        // 1回目: "aggressive" を作成（成功）
        const firstMockResponse: CreateTagResponse = {
          success: true,
          data: {
            id: 'test-lowercase',
            name: 'aggressive',
            color: '#FF6B6B',
            created_at: '2025-09-26T10:00:00.000Z',
            updated_at: '2025-09-26T10:00:00.000Z'
          },
          error: null
        };

        mockedInvoke.mockResolvedValueOnce(firstMockResponse);

        const firstRequest: CreateTagRequest = {
          name: 'aggressive',
          color: '#FF6B6B'
        };

        const firstResult = await invoke<CreateTagResponse>('create_tag', firstRequest);
        expect(firstResult.success).toBe(true);

        // 2回目: "AGGRESSIVE" を作成（別タグとして成功）
        const secondMockResponse: CreateTagResponse = {
          success: true,
          data: {
            id: 'test-uppercase',
            name: 'AGGRESSIVE',
            color: '#4ECDC4',
            created_at: '2025-09-26T10:01:00.000Z',
            updated_at: '2025-09-26T10:01:00.000Z'
          },
          error: null
        };

        mockedInvoke.mockResolvedValueOnce(secondMockResponse);

        const secondRequest: CreateTagRequest = {
          name: 'AGGRESSIVE',
          color: '#4ECDC4'
        };

        const secondResult = await invoke<CreateTagResponse>('create_tag', secondRequest);
        expect(secondResult.success).toBe(true);
        expect(secondResult.data?.name).toBe('AGGRESSIVE');
      });

      it('[TEST-0508-N-009] 前後空白の正規化テスト', async () => {
        const mockResponse: CreateTagResponse = {
          success: true,
          data: {
            id: 'test-trimmed',
            name: 'ブラフ好き', // トリム後の値
            color: '#45B7D1',
            created_at: '2025-09-26T10:00:00.000Z',
            updated_at: '2025-09-26T10:00:00.000Z'
          },
          error: null
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: '  ブラフ好き  ', // 前後に空白
          color: '#45B7D1'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(true);
        expect(result.data?.name).toBe('ブラフ好き'); // トリムされた値
        expect(result.error).toBeNull();
      });
    });
  });

  describe('HEX Color Validation Tests', () => {
    describe('有効なHEXカラーフォーマット（TASK-0507パターン継承）', () => {
      it('[TEST-0508-H-001] 大文字HEXカラー', async () => {
        const mockResponse: CreateTagResponse = {
          success: true,
          data: {
            id: 'test-uppercase-hex',
            name: 'テスト大文字',
            color: '#FFFFFF',
            created_at: '2025-09-26T10:00:00.000Z',
            updated_at: '2025-09-26T10:00:00.000Z'
          },
          error: null
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: 'テスト大文字',
          color: '#FFFFFF'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(true);
        expect(result.data?.color).toBe('#FFFFFF');
        expect(result.error).toBeNull();
      });

      it('[TEST-0508-H-002] 小文字HEXカラー', async () => {
        const mockResponse: CreateTagResponse = {
          success: true,
          data: {
            id: 'test-lowercase-hex',
            name: 'テスト小文字',
            color: '#abcdef',
            created_at: '2025-09-26T10:00:00.000Z',
            updated_at: '2025-09-26T10:00:00.000Z'
          },
          error: null
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: 'テスト小文字',
          color: '#abcdef'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(true);
        expect(result.data?.color).toBe('#abcdef');
        expect(result.error).toBeNull();
      });

      it('[TEST-0508-H-003] 混在HEXカラー', async () => {
        const mockResponse: CreateTagResponse = {
          success: true,
          data: {
            id: 'test-mixed-hex',
            name: 'テスト混在',
            color: '#aBc123',
            created_at: '2025-09-26T10:00:00.000Z',
            updated_at: '2025-09-26T10:00:00.000Z'
          },
          error: null
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: 'テスト混在',
          color: '#aBc123'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(true);
        expect(result.data?.color).toBe('#aBc123');
        expect(result.error).toBeNull();
      });

      it('[TEST-0508-H-004] 境界値HEXカラー（黒）', async () => {
        const mockResponse: CreateTagResponse = {
          success: true,
          data: {
            id: 'test-black',
            name: 'テスト黒',
            color: '#000000',
            created_at: '2025-09-26T10:00:00.000Z',
            updated_at: '2025-09-26T10:00:00.000Z'
          },
          error: null
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: 'テスト黒',
          color: '#000000'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(true);
        expect(result.data?.color).toBe('#000000');
        expect(result.error).toBeNull();
      });

      it('[TEST-0508-H-005] 境界値HEXカラー（白）', async () => {
        const mockResponse: CreateTagResponse = {
          success: true,
          data: {
            id: 'test-white',
            name: 'テスト白',
            color: '#FFFFFF',
            created_at: '2025-09-26T10:00:00.000Z',
            updated_at: '2025-09-26T10:00:00.000Z'
          },
          error: null
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: 'テスト白',
          color: '#FFFFFF'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(true);
        expect(result.data?.color).toBe('#FFFFFF');
        expect(result.error).toBeNull();
      });

      it('[TEST-0508-H-006] タグ特有カラーパレット', async () => {
        const tagColors = [
          { name: 'ピンクレッド', color: '#FF6B6B' },
          { name: 'ティール', color: '#4ECDC4' },
          { name: 'ブルー', color: '#45B7D1' },
          { name: 'ミントグリーン', color: '#96CEB4' },
          { name: 'イエロー', color: '#FECA57' }
        ];

        for (const tagColor of tagColors) {
          const mockResponse: CreateTagResponse = {
            success: true,
            data: {
              id: `test-palette-${Math.random()}`,
              name: tagColor.name,
              color: tagColor.color,
              created_at: '2025-09-26T10:00:00.000Z',
              updated_at: '2025-09-26T10:00:00.000Z'
            },
            error: null
          };

          mockedInvoke.mockResolvedValue(mockResponse);

          const request: CreateTagRequest = {
            name: tagColor.name,
            color: tagColor.color
          };

          const result = await invoke<CreateTagResponse>('create_tag', request);

          expect(result.success).toBe(true);
          expect(result.data?.color).toBe(tagColor.color);
          expect(result.error).toBeNull();
        }
      });
    });

    describe('無効なHEXカラーフォーマット（TASK-0507パターン継承）', () => {
      it('[TEST-0508-H-007] ハッシュなしエラー', async () => {
        const mockResponse: CreateTagResponse = {
          success: false,
          data: null,
          error: {
            code: 'INVALID_COLOR_FORMAT',
            message: '色は # で始まるHEXカラーコードで入力してください',
            details: { provided_color: 'FF6B6B' }
          }
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: 'ハッシュなしテスト',
          color: 'FF6B6B'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(false);
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
        expect(result.error?.message).toBe('色は # で始まるHEXカラーコードで入力してください');
      });

      it('[TEST-0508-H-008] 短すぎるカラーコードエラー', async () => {
        const mockResponse: CreateTagResponse = {
          success: false,
          data: null,
          error: {
            code: 'INVALID_COLOR_FORMAT',
            message: '色は #RRGGBB 形式の6桁で入力してください',
            details: { provided_color: '#FF6B' }
          }
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: '短すぎるテスト',
          color: '#FF6B'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(false);
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
        expect(result.error?.message).toBe('色は #RRGGBB 形式の6桁で入力してください');
      });

      it('[TEST-0508-H-009] 長すぎるカラーコードエラー', async () => {
        const mockResponse: CreateTagResponse = {
          success: false,
          data: null,
          error: {
            code: 'INVALID_COLOR_FORMAT',
            message: '色は #RRGGBB 形式の6桁で入力してください',
            details: { provided_color: '#FF6B6BAA' }
          }
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: '長すぎるテスト',
          color: '#FF6B6BAA'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(false);
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
        expect(result.error?.message).toBe('色は #RRGGBB 形式の6桁で入力してください');
      });

      it('[TEST-0508-H-010] 無効文字エラー', async () => {
        const mockResponse: CreateTagResponse = {
          success: false,
          data: null,
          error: {
            code: 'INVALID_COLOR_FORMAT',
            message: '色には0-9とA-Fの文字のみ使用できます',
            details: { provided_color: '#GGHHII' }
          }
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: '無効文字テスト',
          color: '#GGHHII'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(false);
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
        expect(result.error?.message).toBe('色には0-9とA-Fの文字のみ使用できます');
      });

      it('[TEST-0508-H-011] CSS色名エラー', async () => {
        const mockResponse: CreateTagResponse = {
          success: false,
          data: null,
          error: {
            code: 'INVALID_COLOR_FORMAT',
            message: '色は # で始まるHEXカラーコードで入力してください',
            details: { provided_color: 'red' }
          }
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: 'CSS色名テスト',
          color: 'red'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(false);
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
        expect(result.error?.message).toBe('色は # で始まるHEXカラーコードで入力してください');
      });

      it('[TEST-0508-H-012] RGB形式エラー', async () => {
        const mockResponse: CreateTagResponse = {
          success: false,
          data: null,
          error: {
            code: 'INVALID_COLOR_FORMAT',
            message: '色は # で始まるHEXカラーコードで入力してください',
            details: { provided_color: 'rgb(255,107,107)' }
          }
        };

        mockedInvoke.mockResolvedValue(mockResponse);

        const request: CreateTagRequest = {
          name: 'RGB形式テスト',
          color: 'rgb(255,107,107)'
        };

        const result = await invoke<CreateTagResponse>('create_tag', request);

        expect(result.success).toBe(false);
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
        expect(result.error?.message).toBe('色は # で始まるHEXカラーコードで入力してください');
      });
    });
  });

  describe('Update Validation Tests', () => {
    it('[TEST-0508-V-001] 更新時のバリデーション - 名前のみ', async () => {
      const mockResponse: UpdateTagResponse = {
        success: false,
        data: null,
        error: {
          code: 'TAG_NAME_TOO_LONG',
          message: 'タグ名が長すぎます（最大100文字）',
          details: { length: 101, max_length: 100 }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdateTagRequest = {
        id: 'test-uuid-update',
        name: 'a'.repeat(101) // 長すぎる名前
      };

      const result = await invoke<UpdateTagResponse>('update_tag', request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TAG_NAME_TOO_LONG');
    });

    it('[TEST-0508-V-002] 更新時のバリデーション - 色のみ', async () => {
      const mockResponse: UpdateTagResponse = {
        success: false,
        data: null,
        error: {
          code: 'INVALID_COLOR_FORMAT',
          message: '色は #RRGGBB 形式の6桁で入力してください',
          details: { provided_color: '#FF' }
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdateTagRequest = {
        id: 'test-uuid-update',
        color: '#FF' // 短すぎる色
      };

      const result = await invoke<UpdateTagResponse>('update_tag', request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
    });

    it('[TEST-0508-V-003] 更新時のバリデーション - 名前と色の両方', async () => {
      const mockResponse: UpdateTagResponse = {
        success: false,
        data: null,
        error: {
          code: 'TAG_NAME_EMPTY',
          message: 'タグ名が空です',
          details: null
        }
      };

      mockedInvoke.mockResolvedValue(mockResponse);

      const request: UpdateTagRequest = {
        id: 'test-uuid-update',
        name: '', // 空の名前
        color: 'invalid-color' // 無効な色
      };

      const result = await invoke<UpdateTagResponse>('update_tag', request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TAG_NAME_EMPTY');
    });
  });
});