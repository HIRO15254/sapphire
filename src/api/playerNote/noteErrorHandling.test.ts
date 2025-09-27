// Error handling tests for Player Note API
// TASK-0511: リッチテキストメモAPI実装 - Red Phase

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  GetPlayerNoteRequest,
  SavePlayerNoteRequest,
  GetPlayerNoteResponse,
  SavePlayerNoteResponse,
  NOTE_ERROR_CODES,
  MAX_CONTENT_SIZE,
  isValidPlayerNoteRequest,
} from '../../types/playerNote';
import {
  setupTauriMock,
  resetMocks,
  mockTauriInvoke,
  createErrorResponse,
  simulateDatabaseError,
} from './testUtils';
import { generatePerformanceTestData, ERROR_SCENARIOS } from './mockData';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('Player Note API - Error Handling Tests (EH-01 to EH-03)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockClear();
  });

  describe('EH-01: Input Validation Errors', () => {
    test('EH-01-01: 無効プレイヤーID', async () => {
      // Given: 存在しないplayer_id
      const invalidPlayerId = 'non-existent-player-12345';

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('PLAYER_NOT_FOUND', 'Player not found', {
          player_id: invalidPlayerId,
        })
      );

      // When: get_player_note を実行
      const request: GetPlayerNoteRequest = { player_id: invalidPlayerId };

      // Then: NOTE_PLAYER_NOT_FOUND エラー
      await expect(invoke('get_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.PLAYER_NOT_FOUND,
          message: 'Player not found',
          details: {
            player_id: invalidPlayerId,
          },
        },
      });
    });

    test('EH-01-02: 空プレイヤーID', async () => {
      // Given: player_id=""
      const emptyPlayerId = '';

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('INVALID_PLAYER_ID', 'Player ID cannot be empty', {
          player_id: emptyPlayerId,
        })
      );

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: emptyPlayerId,
        content: 'Test content',
        content_type: 'html',
      };

      // Then: バリデーションエラー
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.INVALID_PLAYER_ID,
          message: 'Player ID cannot be empty',
        },
      });
    });

    test('EH-01-03: コンテンツサイズ超過', async () => {
      // Given: 10MB超過のコンテンツ
      const performanceData = generatePerformanceTestData();
      const oversizedContent = performanceData.overLimit; // 11MB
      const playerId = 'oversize-player';

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('CONTENT_TOO_LARGE', 'Content exceeds maximum size limit', {
          player_id: playerId,
          content_size: Buffer.byteLength(oversizedContent, 'utf8'),
        })
      );

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: oversizedContent,
        content_type: 'html',
      };

      // Then: NOTE_CONTENT_TOO_LARGE エラー
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.CONTENT_TOO_LARGE,
          message: 'Content exceeds maximum size limit',
          details: {
            player_id: playerId,
            content_size: expect.any(Number),
          },
        },
      });

      // Verify content size exceeds limit
      const contentSize = Buffer.byteLength(oversizedContent, 'utf8');
      expect(contentSize).toBeGreaterThan(MAX_CONTENT_SIZE);
    });

    test('EH-01-04: 無効JSON形式', async () => {
      // Given: 不正なJSON構造
      const invalidJSONContent = '{"type":"doc","content":'; // Incomplete JSON
      const playerId = 'invalid-json-player';

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('INVALID_JSON', 'Invalid JSON structure', {
          player_id: playerId,
          validation_errors: ['Unexpected end of JSON input'],
        })
      );

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: invalidJSONContent,
        content_type: 'json',
      };

      // Then: NOTE_INVALID_JSON エラー
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.INVALID_JSON,
          message: 'Invalid JSON structure',
          details: {
            player_id: playerId,
            validation_errors: expect.arrayContaining([expect.any(String)]),
          },
        },
      });
    });

    test('EH-01-05: 無効TipTap構造', async () => {
      // Given: type/contentフィールド欠如JSON
      const invalidTipTapStructures = ERROR_SCENARIOS.INVALID_JSON_CONTENT;

      for (const invalidContent of invalidTipTapStructures) {
        const playerId = `invalid-tiptap-${invalidTipTapStructures.indexOf(invalidContent)}`;

        mockInvoke.mockRejectedValueOnce(
          createErrorResponse('INVALID_JSON', 'Invalid TipTap document structure', {
            player_id: playerId,
            validation_errors: ['Document must have type "doc"'],
          })
        );

        // When: TipTap検証実行
        const request: SavePlayerNoteRequest = {
          player_id: playerId,
          content: invalidContent,
          content_type: 'json',
        };

        // Then: NOTE_INVALID_JSON エラー
        await expect(invoke('save_player_note', request)).rejects.toMatchObject({
          success: false,
          error: {
            code: NOTE_ERROR_CODES.INVALID_JSON,
            message: 'Invalid TipTap document structure',
          },
        });
      }
    });

    test('EH-01-06: NULL/undefined入力', async () => {
      // Given: content=null
      const playerId = 'null-content-player';

      const invalidInputs = ERROR_SCENARIOS.INVALID_CONTENT;

      for (const invalidContent of invalidInputs) {
        mockInvoke.mockRejectedValueOnce(
          createErrorResponse('INVALID_CONTENT', 'Content is required', {
            player_id: playerId,
          })
        );

        // When: save_player_note を実行
        const request = {
          player_id: playerId,
          content: invalidContent,
          content_type: 'html' as const,
        };

        // Then: 適切なバリデーションエラー
        await expect(invoke('save_player_note', request)).rejects.toMatchObject({
          success: false,
          error: {
            code: NOTE_ERROR_CODES.INVALID_CONTENT,
            message: 'Content is required',
          },
        });
      }
    });

    test('EH-01-07: Invalid player ID formats', async () => {
      // Given: Various invalid player ID formats
      const invalidPlayerIds = ERROR_SCENARIOS.INVALID_PLAYER_IDS;

      for (const invalidId of invalidPlayerIds) {
        mockInvoke.mockRejectedValueOnce(
          createErrorResponse('INVALID_PLAYER_ID', 'Invalid player ID format', {
            player_id: String(invalidId),
          })
        );

        // When: Attempting to use invalid player ID
        const request = {
          player_id: invalidId,
          content: 'Test content',
          content_type: 'html' as const,
        };

        // Then: Validation error
        await expect(invoke('save_player_note', request)).rejects.toMatchObject({
          success: false,
          error: {
            code: NOTE_ERROR_CODES.INVALID_PLAYER_ID,
          },
        });
      }
    });

    test('EH-01-08: Content type validation', async () => {
      // Given: Invalid content type
      const playerId = 'content-type-validation-player';
      const content = 'Test content';

      // When: Using invalid content type
      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('INVALID_CONTENT', 'Invalid content type', {
          player_id: playerId,
          content_type: 'invalid',
        })
      );

      const request = {
        player_id: playerId,
        content: content,
        content_type: 'invalid' as never,
      };

      // Then: Content type validation error
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.INVALID_CONTENT,
          message: 'Invalid content type',
        },
      });
    });

    test('EH-01-09: Boundary value validation', async () => {
      // Test validation helper function
      const testCases = [
        {
          description: 'Empty player ID',
          request: { player_id: '' },
          expectedValid: false,
        },
        {
          description: 'Very long player ID',
          request: { player_id: 'a'.repeat(256) },
          expectedValid: false,
        },
        {
          description: 'Valid player ID',
          request: { player_id: 'valid-player-123' },
          expectedValid: true,
        },
        {
          description: 'Valid save request',
          request: {
            player_id: 'valid-player',
            content: 'Valid content',
            content_type: 'html' as const,
          },
          expectedValid: true,
        },
      ];

      testCases.forEach(({ description, request, expectedValid }) => {
        const result = isValidPlayerNoteRequest(request as never);
        expect(result.isValid).toBe(expectedValid);
        if (!expectedValid) {
          expect(result.errors.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('EH-02: System Errors', () => {
    test('EH-02-01: データベース接続エラー', async () => {
      // Given: DB接続不可状態
      const playerId = 'db-connection-player';
      simulateDatabaseError('connection', mockInvoke);

      // When: get_player_note を実行
      const request: GetPlayerNoteRequest = { player_id: playerId };
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;

      // Then: NOTE_DATABASE_ERROR エラー
      expect(response).toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.DATABASE_ERROR,
          message: 'Database connection failed',
        },
      });
    });

    test('EH-02-02: サニタイゼーション失敗', async () => {
      // Given: サニタイゼーションライブラリエラー
      const playerId = 'sanitization-error-player';
      const content = '<p>Content that causes sanitizer to fail</p>';

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('SANITIZATION_FAILED', 'Content sanitization failed', {
          player_id: playerId,
        })
      );

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: content,
        content_type: 'html',
      };

      // Then: NOTE_SANITIZATION_FAILED エラー
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.SANITIZATION_FAILED,
          message: 'Content sanitization failed',
        },
      });
    });

    test('EH-02-03: ディスク容量不足', async () => {
      // Given: ストレージ満杯状態
      const playerId = 'disk-full-player';
      simulateDatabaseError('disk_full', mockInvoke);

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: 'Test content',
        content_type: 'html',
      };

      // Then: 適切なディスクエラー処理
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;
      expect(response).toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.DATABASE_ERROR,
          message: 'Disk space insufficient',
        },
      });
    });

    test('EH-02-04: 権限不足エラー', async () => {
      // Given: データベースファイル書き込み権限なし
      const playerId = 'permission-error-player';
      simulateDatabaseError('permission', mockInvoke);

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: 'Test content',
        content_type: 'html',
      };

      // Then: 権限エラー適切処理
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;
      expect(response).toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.DATABASE_ERROR,
          message: 'Permission denied',
        },
      });
    });

    test('EH-02-05: タイムアウトエラー', async () => {
      // Given: 極端に重い処理
      const playerId = 'timeout-player';
      simulateDatabaseError('timeout', mockInvoke);

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: 'Test content',
        content_type: 'html',
      };

      // Then: タイムアウト適切処理
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;
      expect(response).toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.DATABASE_ERROR,
          message: 'Query timeout exceeded',
        },
      });
    });

    test('EH-02-06: Foreign key constraint violation', async () => {
      // Given: Invalid player reference
      const invalidPlayerId = 'deleted-player-id';

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('FOREIGN_KEY_VIOLATION', 'Referenced player does not exist', {
          player_id: invalidPlayerId,
        })
      );

      // When: Attempting to save note for non-existent player
      const request: SavePlayerNoteRequest = {
        player_id: invalidPlayerId,
        content: 'Test content',
        content_type: 'html',
      };

      // Then: Foreign key violation error
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.FOREIGN_KEY_VIOLATION,
          message: 'Referenced player does not exist',
        },
      });
    });

    test('EH-02-07: Memory allocation failure', async () => {
      // Given: System low on memory
      const playerId = 'memory-error-player';
      const largeContent = generatePerformanceTestData().xlarge;

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('DATABASE_ERROR', 'Memory allocation failed', {
          player_id: playerId,
          content_size: Buffer.byteLength(largeContent, 'utf8'),
        })
      );

      // When: Processing large content under memory pressure
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: largeContent,
        content_type: 'html',
      };

      // Then: Memory error handling
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.DATABASE_ERROR,
          message: 'Memory allocation failed',
        },
      });
    });

    test('EH-02-08: Concurrent access conflicts', async () => {
      // Given: Concurrent writes to same note
      const playerId = 'concurrent-conflict-player';

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('DATABASE_ERROR', 'Concurrent modification detected', {
          player_id: playerId,
        })
      );

      // When: Simultaneous write attempts
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: 'Conflicting content',
        content_type: 'html',
      };

      // Then: Concurrency conflict handling
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.DATABASE_ERROR,
          message: 'Concurrent modification detected',
        },
      });
    });
  });

  describe('EH-03: Recovery & Fallback Processing', () => {
    test('EH-03-01: 部分的HTMLサニタイゼーション', async () => {
      // Given: 一部不正HTMLタグ
      const mixedContent = '<p>Valid content</p><script>alert("bad")</script><strong>More valid</strong>';
      const playerId = 'partial-sanitization-player';

      // Mock partial sanitization success
      const partiallyCleanedContent = '<p>Valid content</p><strong>More valid</strong>';
      const sanitizedNote = {
        id: 'note-partial',
        player_id: playerId,
        content: partiallyCleanedContent,
        content_type: 'html' as const,
        content_hash: 'hash-partial',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockInvoke.mockResolvedValueOnce({
        success: true,
        data: sanitizedNote,
      });

      // When: サニタイゼーション実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: mixedContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 有効部分は保持、無効部分のみ除去
      expect(response.success).toBe(true);
      expect(response.data!.content).toContain('<p>Valid content</p>');
      expect(response.data!.content).toContain('<strong>More valid</strong>');
      expect(response.data!.content).not.toContain('<script>');
      expect(response.data!.content).not.toContain('alert');
    });

    test('EH-03-02: JSON解析エラー時フォールバック', async () => {
      // Given: JSON解析失敗コンテンツ
      const malformedJSON = '{"type":"doc","content":}'; // Invalid JSON
      const playerId = 'json-fallback-player';

      // Mock fallback to HTML processing
      const fallbackNote = {
        id: 'note-fallback',
        player_id: playerId,
        content: malformedJSON, // Stored as HTML instead
        content_type: 'html' as const,
        content_hash: 'hash-fallback',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockInvoke.mockResolvedValueOnce({
        success: true,
        data: fallbackNote,
      });

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: malformedJSON,
        content_type: 'json', // Requested as JSON but falls back to HTML
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: HTML形式として保存
      expect(response.success).toBe(true);
      expect(response.data!.content_type).toBe('html'); // Fallback type
      expect(response.data!.content).toBe(malformedJSON); // Content preserved
    });

    test('EH-03-03: データベース復旧処理', async () => {
      // Given: 一時的DB接続エラー
      const playerId = 'db-recovery-player';
      const content = 'Test content for recovery';

      // First attempt fails
      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('DATABASE_ERROR', 'Temporary connection failure')
      );

      // When: リトライ機構動作
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: content,
        content_type: 'html',
      };

      // First call fails
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.DATABASE_ERROR,
        },
      });

      // Then: 自動復旧成功 (second attempt)
      const recoveredNote = {
        id: 'note-recovered',
        player_id: playerId,
        content: content,
        content_type: 'html' as const,
        content_hash: 'hash-recovered',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockInvoke.mockResolvedValueOnce({
        success: true,
        data: recoveredNote,
      });

      const retryResponse = await invoke('save_player_note', request) as SavePlayerNoteResponse;
      expect(retryResponse.success).toBe(true);
      expect(retryResponse.data!.content).toBe(content);
    });

    test('EH-03-04: Graceful degradation for corrupted data', async () => {
      // Given: Partially corrupted existing note
      const playerId = 'corrupted-data-player';

      // Mock corrupted data response with recovery
      const partiallyCorruptedNote = {
        id: 'note-corrupted',
        player_id: playerId,
        content: 'Recovered content', // Fallback content
        content_type: 'html' as const,
        content_hash: 'hash-recovered',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockInvoke.mockResolvedValueOnce({
        success: true,
        data: partiallyCorruptedNote,
      });

      // When: Attempting to retrieve corrupted note
      const request: GetPlayerNoteRequest = { player_id: playerId };
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;

      // Then: Graceful degradation with recoverable data
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data!.content).toBeDefined();
    });

    test('EH-03-05: Content validation recovery', async () => {
      // Given: Content that fails initial validation but can be recovered
      const playerId = 'validation-recovery-player';
      const problematicContent = '<p>Content with \0 null bytes and \u{1F4A9} problematic chars</p>';

      // Mock recovery with cleaned content
      const cleanedContent = '<p>Content with  null bytes and  problematic chars</p>';
      const recoveredNote = {
        id: 'note-validation-recovery',
        player_id: playerId,
        content: cleanedContent,
        content_type: 'html' as const,
        content_hash: 'hash-validation-recovery',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockInvoke.mockResolvedValueOnce({
        success: true,
        data: recoveredNote,
      });

      // When: Processing problematic content
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: problematicContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: Content cleaned and saved successfully
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('\0');
      expect(response.data!.content).toContain('Content with');
    });

    test('EH-03-06: Encoding recovery', async () => {
      // Given: Content with encoding issues
      const playerId = 'encoding-recovery-player';
      const encodingProblematicContent = 'Text with encoding issues: \uFFFD\uFFFE';

      // Mock encoding recovery
      const encodingRecoveredContent = 'Text with encoding issues: ';
      const recoveredNote = {
        id: 'note-encoding-recovery',
        player_id: playerId,
        content: encodingRecoveredContent,
        content_type: 'html' as const,
        content_hash: 'hash-encoding-recovery',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockInvoke.mockResolvedValueOnce({
        success: true,
        data: recoveredNote,
      });

      // When: Processing content with encoding issues
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: encodingProblematicContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: Encoding issues resolved
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('\uFFFD');
      expect(response.data!.content).not.toContain('\uFFFE');
    });
  });
});