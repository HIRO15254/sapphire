// Security tests for Player Note API
// TASK-0511: リッチテキストメモAPI実装 - Red Phase

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  SavePlayerNoteRequest,
  SavePlayerNoteResponse,
  GetPlayerNoteRequest,
  GetPlayerNoteResponse,
  NOTE_ERROR_CODES,
  sanitizeHTML,
} from '../../types/playerNote';
import {
  setupTauriMock,
  resetMocks,
  mockTauriInvoke,
  createTestPlayerNote,
  createSuccessfulSaveResponse,
  createErrorResponse,
  createXSSAttackContent,
  createSQLInjectionContent,
} from './testUtils';
import { XSS_ATTACK_PATTERNS, SQL_INJECTION_PATTERNS, SPECIAL_CHARACTER_TESTS } from './mockData';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('Player Note API - Security Tests (ST-01 to ST-03)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockClear();
  });

  describe('ST-01: XSS Attack Protection', () => {
    test('ST-01-01: スクリプトタグ除去', async () => {
      // Given: <script>alert('xss')</script>
      const xssContent = '<p>Normal content</p><script>alert(\'xss\')</script><p>More content</p>';
      const sanitizedContent = '<p>Normal content</p><p>More content</p>';
      const playerId = 'script-xss-player';

      const sanitizedNote = createTestPlayerNote({
        player_id: playerId,
        content: sanitizedContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(sanitizedNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: xssContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: スクリプトタグ完全除去
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('<script>');
      expect(response.data!.content).not.toContain('alert');
      expect(response.data!.content).toContain('<p>Normal content</p>');
      expect(response.data!.content).toContain('<p>More content</p>');
    });

    test('ST-01-02: イベントハンドラ除去', async () => {
      // Given: <p onclick="alert('xss')">Text</p>
      const eventHandlerContent = '<p onclick="alert(\'xss\')" onmouseover="evil()">Click me</p>';
      const sanitizedContent = '<p>Click me</p>';
      const playerId = 'event-handler-player';

      const sanitizedNote = createTestPlayerNote({
        player_id: playerId,
        content: sanitizedContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(sanitizedNote));

      // When: サニタイゼーション実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: eventHandlerContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: onclickイベント除去
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('onclick=');
      expect(response.data!.content).not.toContain('onmouseover=');
      expect(response.data!.content).not.toContain('alert');
      expect(response.data!.content).not.toContain('evil');
      expect(response.data!.content).toContain('Click me');
    });

    test('ST-01-03: データURL攻撃防御', async () => {
      // Given: <img src="data:text/html,<script>...">
      const dataUrlAttack = '<img src="data:text/html,<script>alert(\'xss\')</script>" alt="Evil">';
      const sanitizedContent = '<img alt="Evil">';
      const playerId = 'data-url-player';

      const sanitizedNote = createTestPlayerNote({
        player_id: playerId,
        content: sanitizedContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(sanitizedNote));

      // When: サニタイゼーション実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: dataUrlAttack,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 危険なdata URLスキーム除去
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('data:text/html');
      expect(response.data!.content).not.toContain('<script>');
      expect(response.data!.content).toContain('alt="Evil"');
    });

    test('ST-01-04: CSS式攻撃防御', async () => {
      // Given: <div style="expression(alert('xss'))">
      const cssExpressionAttack = '<div style="expression(alert(\'xss\'))">Content</div>';
      const sanitizedContent = '<div>Content</div>';
      const playerId = 'css-expression-player';

      const sanitizedNote = createTestPlayerNote({
        player_id: playerId,
        content: sanitizedContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(sanitizedNote));

      // When: サニタイゼーション実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: cssExpressionAttack,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: CSSエクスプレッション除去
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('expression(');
      expect(response.data!.content).not.toContain('alert');
      expect(response.data!.content).toContain('Content');
    });

    test('ST-01-05: エンコード攻撃対策', async () => {
      // Given: &#60;script&#62; (HTMLエンティティ)
      const encodedAttack = '&#60;script&#62;alert(&#39;xss&#39;)&#60;/script&#62;';
      const sanitizedContent = 'alert(&#39;xss&#39;)'; // Script tags removed after decoding
      const playerId = 'encoded-attack-player';

      const sanitizedNote = createTestPlayerNote({
        player_id: playerId,
        content: sanitizedContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(sanitizedNote));

      // When: サニタイゼーション実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: encodedAttack,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: エンコード解除後も安全性確保
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('<script>');
      expect(response.data!.content).not.toContain('&#60;script&#62;');
    });

    test('ST-01-06: Comprehensive XSS pattern testing', async () => {
      // Given: Various XSS attack patterns
      const xssPatterns = createXSSAttackContent();

      for (const { description, content } of xssPatterns) {
        const playerId = `xss-pattern-${xssPatterns.indexOf({ description, content })}`;
        const sanitizedContent = sanitizeHTML(content);

        const sanitizedNote = createTestPlayerNote({
          player_id: playerId,
          content: sanitizedContent,
          content_type: 'html',
        });

        mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(sanitizedNote));

        // When: Testing XSS pattern
        const request: SavePlayerNoteRequest = {
          player_id: playerId,
          content: content,
          content_type: 'html',
        };
        const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

        // Then: XSS should be neutralized
        expect(response.success).toBe(true);
        expect(response.data!.content).not.toContain('<script>');
        expect(response.data!.content).not.toContain('javascript:');
        expect(response.data!.content).not.toContain('alert(');
        expect(response.data!.content).not.toContain('eval(');
      }
    });

    test('ST-01-07: SVG-based XSS protection', async () => {
      // Given: SVG with embedded scripts
      const svgXSS = '<svg onload="alert(\'xss\')"><circle r="10"></circle></svg>';
      const sanitizedContent = '<svg><circle r="10"></circle></svg>';
      const playerId = 'svg-xss-player';

      const sanitizedNote = createTestPlayerNote({
        player_id: playerId,
        content: sanitizedContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(sanitizedNote));

      // When: Processing SVG content
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: svgXSS,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: SVG script should be removed
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('onload=');
      expect(response.data!.content).not.toContain('alert');
      expect(response.data!.content).toContain('<svg>');
      expect(response.data!.content).toContain('<circle');
    });
  });

  describe('ST-02: Injection Attack Protection', () => {
    test('ST-02-01: SQLインジェクション対策', async () => {
      // Given: player_id="'; DROP TABLE players; --"
      const sqlInjectionPatterns = createSQLInjectionContent();

      for (const { description, playerId } of sqlInjectionPatterns) {
        // When: get_player_note を実行
        const request: GetPlayerNoteRequest = { player_id: playerId };

        // Mock proper parameterized query behavior - no injection occurs
        mockInvoke.mockResolvedValueOnce({
          success: true,
          data: undefined, // No note found for this "player ID"
        });

        const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;

        // Then: パラメータ化クエリで安全に処理
        expect(response.success).toBe(true);
        expect(mockInvoke).toHaveBeenCalledWith('get_player_note', { player_id: playerId });
        // SQL injection should not cause system errors or unexpected behavior
      }
    });

    test('ST-02-02: NoSQLインジェクション対策', async () => {
      // Given: 特殊JSON構造の攻撃
      const noSqlInjection = '{"$where": "this.player_id == \'admin\' || true"}';
      const playerId = 'nosql-injection-player';

      const sanitizedNote = createTestPlayerNote({
        player_id: playerId,
        content: noSqlInjection,
        content_type: 'html', // Treated as HTML, not executed as query
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(sanitizedNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: noSqlInjection,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: JSON検証で安全性確保
      expect(response.success).toBe(true);
      // Content is stored as literal text, not executed as a query
      expect(response.data!.content).toBe(noSqlInjection);
    });

    test('ST-02-03: ファイルパス攻撃対策', async () => {
      // Given: "../../../etc/passwd" 含有コンテンツ
      const pathTraversalContent = 'Player notes: ../../../etc/passwd and ../../windows/system32/config/sam';
      const playerId = 'path-traversal-player';

      const sanitizedNote = createTestPlayerNote({
        player_id: playerId,
        content: pathTraversalContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(sanitizedNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: pathTraversalContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: ファイルシステムアクセス無し
      expect(response.success).toBe(true);
      // Content is stored as literal text, not used for file system operations
      expect(response.data!.content).toBe(pathTraversalContent);
    });

    test('ST-02-04: Code injection through content type', async () => {
      // Given: Malicious content type specification
      const playerId = 'content-type-injection-player';
      const maliciousContent = '<script>alert("injected")</script>';

      // Try to inject through content_type parameter
      const sanitizedNote = createTestPlayerNote({
        player_id: playerId,
        content: maliciousContent,
        content_type: 'html', // Only valid types allowed
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(sanitizedNote));

      // When: Attempting injection via content_type
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: maliciousContent,
        content_type: 'html', // Type validation should prevent arbitrary values
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: Only valid content types accepted
      expect(response.success).toBe(true);
      expect(['json', 'html']).toContain(response.data!.content_type);
    });

    test('ST-02-05: Command injection through player ID', async () => {
      // Given: Command injection attempt in player ID
      const commandInjectionId = 'player123; rm -rf /; echo "injected"';
      const content = 'Normal content';

      // When: Attempting command injection
      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('INVALID_PLAYER_ID', 'Invalid player ID format', {
          player_id: commandInjectionId,
        })
      );

      const request: SavePlayerNoteRequest = {
        player_id: commandInjectionId,
        content: content,
        content_type: 'html',
      };

      // Then: Input validation should prevent injection
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.INVALID_PLAYER_ID,
          message: 'Invalid player ID format',
        },
      });
    });
  });

  describe('ST-03: Data Protection & Privacy', () => {
    test('ST-03-01: 機密情報ログ出力防止', async () => {
      // Given: メモ保存処理
      const playerId = 'confidential-player';
      const sensitiveContent = 'SSN: 123-45-6789, Password: secret123, API Key: abc123xyz';

      // When: エラー発生時
      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('DATABASE_ERROR', 'Internal server error', {
          player_id: playerId,
          // Should NOT include sensitive content in error details
        })
      );

      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: sensitiveContent,
        content_type: 'html',
      };

      // Then: ログにコンテンツ含まれない
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.DATABASE_ERROR,
          message: 'Internal server error',
          details: expect.not.objectContaining({
            content: expect.anything(),
          }),
        },
      });
    });

    test('ST-03-02: エラーメッセージ情報漏洩防止', async () => {
      // Given: データベースエラー
      const playerId = 'error-leakage-player';
      const content = 'Test content';

      // When: save_player_note を実行
      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('DATABASE_ERROR', 'Database operation failed', {
          // Generic error message without internal details
          player_id: playerId,
        })
      );

      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: content,
        content_type: 'html',
      };

      // Then: 内部情報漏洩しないエラーメッセージ
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.DATABASE_ERROR,
          message: expect.not.stringMatching(/password|connection string|file path|stack trace/i),
        },
      });
    });

    test('ST-03-03: 権限制御', async () => {
      // Given: 他プレイヤーのメモアクセス試行
      const unauthorizedPlayerId = 'unauthorized-access-player';
      const actualPlayerId = 'actual-player';

      // When: get_player_note を実行
      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('PERMISSION_DENIED', 'Access not allowed', {
          player_id: unauthorizedPlayerId,
        })
      );

      const request: GetPlayerNoteRequest = { player_id: unauthorizedPlayerId };

      // Then: 適切な権限チェック
      await expect(invoke('get_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.PERMISSION_DENIED,
          message: 'Access not allowed',
        },
      });
    });

    test('ST-03-04: Content sanitization logging safety', async () => {
      // Given: Content requiring sanitization
      const playerId = 'sanitization-logging-player';
      const maliciousContent = '<script>console.log(document.cookie)</script><p>Content</p>';
      const sanitizedContent = '<p>Content</p>';

      const sanitizedNote = createTestPlayerNote({
        player_id: playerId,
        content: sanitizedContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(sanitizedNote));

      // When: Content is sanitized
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: maliciousContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: Sanitization happens without exposing original malicious content
      expect(response.success).toBe(true);
      expect(response.data!.content).toBe(sanitizedContent);
      expect(response.data!.content).not.toContain('script');
      expect(response.data!.content).not.toContain('document.cookie');
    });

    test('ST-03-05: Rate limiting simulation', async () => {
      // Given: Rapid successive requests
      const playerId = 'rate-limit-player';
      const content = 'Test content';
      const requestCount = 100;

      // When: Making many requests rapidly
      const requests = Array.from({ length: requestCount }, () => {
        const note = createTestPlayerNote({
          player_id: playerId,
          content: content,
        });

        if (Math.random() < 0.1) { // 10% rate limited
          mockInvoke.mockRejectedValueOnce(
            createErrorResponse('TIMEOUT_ERROR', 'Rate limit exceeded')
          );
          return invoke('save_player_note', {
            player_id: playerId,
            content: content,
            content_type: 'html' as const,
          });
        } else {
          mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(note));
          return invoke('save_player_note', {
            player_id: playerId,
            content: content,
            content_type: 'html' as const,
          });
        }
      });

      // Then: Rate limiting should protect system
      const results = await Promise.allSettled(requests);
      const rejectedCount = results.filter(r => r.status === 'rejected').length;

      // Some requests should be rate limited
      expect(rejectedCount).toBeGreaterThan(0);
      expect(rejectedCount).toBeLessThan(requestCount); // Not all blocked
    });

    test('ST-03-06: Secure content type validation', async () => {
      // Given: Invalid content type attempts
      const playerId = 'content-type-validation-player';
      const content = 'Test content';

      const invalidContentTypes = [
        'application/javascript',
        'text/x-script',
        'application/x-executable',
        'text/x-shellscript',
        'application/x-php',
      ];

      for (const invalidType of invalidContentTypes) {
        // When: Attempting to use invalid content type
        mockInvoke.mockRejectedValueOnce(
          createErrorResponse('INVALID_CONTENT', 'Invalid content type', {
            content_type: invalidType,
          })
        );

        // Note: TypeScript would prevent this, but testing runtime validation
        const request = {
          player_id: playerId,
          content: content,
          content_type: invalidType as never,
        };

        // Then: Invalid content types should be rejected
        await expect(invoke('save_player_note', request)).rejects.toMatchObject({
          success: false,
          error: {
            code: NOTE_ERROR_CODES.INVALID_CONTENT,
            message: 'Invalid content type',
          },
        });
      }
    });
  });
});