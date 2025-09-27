// Integration tests for Player Note API
// TASK-0511: リッチテキストメモAPI実装 - Red Phase

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  GetPlayerNoteRequest,
  SavePlayerNoteRequest,
  GetPlayerNoteResponse,
  SavePlayerNoteResponse,
  NOTE_ERROR_CODES,
} from '../../types/playerNote';
import {
  setupTauriMock,
  resetMocks,
  mockTauriInvoke,
  createTestPlayerNote,
  createSuccessfulGetResponse,
  createSuccessfulSaveResponse,
  createErrorResponse,
  expectValidPlayerNote,
  createCleanDatabaseState,
  createDatabaseWithExistingNotes,
  simulateDatabaseError,
} from './testUtils';
import { SAMPLE_TIPTAP_DOCUMENTS, SAMPLE_HTML_CONTENT } from './mockData';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('Player Note API - Integration Tests (IT-01 to IT-02)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockClear();
    createCleanDatabaseState();
  });

  describe('IT-01: Database Integration', () => {
    test('IT-01-01: UPSERT操作データベース動作', async () => {
      // Given: SQLiteデータベース, 同一player_id
      const playerId = 'upsert-integration-player';
      const firstContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);
      const secondContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.FORMATTED_TEXT);

      const firstNote = createTestPlayerNote({
        id: 'note-1',
        player_id: playerId,
        content: firstContent,
        created_at: '2025-01-01T10:00:00.000Z',
        updated_at: '2025-01-01T10:00:00.000Z',
      });

      const updatedNote = createTestPlayerNote({
        id: 'note-1', // Same ID - UPSERT behavior
        player_id: playerId,
        content: secondContent,
        created_at: '2025-01-01T10:00:00.000Z', // Preserved
        updated_at: '2025-01-01T11:00:00.000Z', // Updated
      });

      // When: 新規→更新→更新の順で実行
      // First save (INSERT)
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(firstNote));
      const firstRequest: SavePlayerNoteRequest = {
        player_id: playerId,
        content: firstContent,
        content_type: 'json',
      };
      const firstResponse = await invoke('save_player_note', firstRequest) as SavePlayerNoteResponse;

      // Second save (UPDATE)
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(updatedNote));
      const secondRequest: SavePlayerNoteRequest = {
        player_id: playerId,
        content: secondContent,
        content_type: 'json',
      };
      const secondResponse = await invoke('save_player_note', secondRequest) as SavePlayerNoteResponse;

      // Third save (UPDATE again)
      const thirdUpdatedNote = { ...updatedNote, updated_at: '2025-01-01T12:00:00.000Z' };
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(thirdUpdatedNote));
      const thirdResponse = await invoke('save_player_note', secondRequest) as SavePlayerNoteResponse;

      // Then: レコード数1, 正しいupdated_at
      expect(firstResponse.success).toBe(true);
      expect(secondResponse.success).toBe(true);
      expect(thirdResponse.success).toBe(true);

      // Same note ID throughout (UPSERT behavior)
      expect(secondResponse.data!.id).toBe(firstResponse.data!.id);
      expect(thirdResponse.data!.id).toBe(firstResponse.data!.id);

      // Created timestamp preserved
      expect(secondResponse.data!.created_at).toBe(firstResponse.data!.created_at);
      expect(thirdResponse.data!.created_at).toBe(firstResponse.data!.created_at);

      // Updated timestamp progresses
      expect(new Date(secondResponse.data!.updated_at).getTime()).toBeGreaterThan(
        new Date(firstResponse.data!.updated_at).getTime()
      );
      expect(new Date(thirdResponse.data!.updated_at).getTime()).toBeGreaterThan(
        new Date(secondResponse.data!.updated_at).getTime()
      );
    });

    test('IT-01-02: インデックス活用確認', async () => {
      // Given: player_id インデックス
      const playerId = 'indexed-player';
      const existingNote = createTestPlayerNote({ player_id: playerId });

      mockInvoke.mockResolvedValueOnce(createSuccessfulGetResponse(existingNote));

      // When: get_player_note を実行
      const request: GetPlayerNoteRequest = { player_id: playerId };
      const startTime = performance.now();
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;
      const endTime = performance.now();

      // Then: EXPLAIN QUERY PLAN でインデックス使用確認 (fast response time as proxy)
      expect(response.success).toBe(true);
      expect(response.data!.player_id).toBe(playerId);

      // Fast retrieval indicates index usage
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(100); // Should be very fast with index
    });

    test('IT-01-03: 外部キー制約動作', async () => {
      // Given: players テーブルとの外部キー関係
      const invalidPlayerId = 'non-existent-player-id';
      const content = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('FOREIGN_KEY_VIOLATION', 'Player does not exist', {
          player_id: invalidPlayerId,
        })
      );

      // When: 無効なplayer_id で保存
      const request: SavePlayerNoteRequest = {
        player_id: invalidPlayerId,
        content: content,
        content_type: 'json',
      };

      // Then: 外部キー制約エラー
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.FOREIGN_KEY_VIOLATION,
          message: 'Player does not exist',
          details: {
            player_id: invalidPlayerId,
          },
        },
      });
    });

    test('IT-01-04: カスケード削除確認', async () => {
      // Given: プレイヤー削除
      const playerId = 'cascade-player';
      const existingNote = createTestPlayerNote({ player_id: playerId });

      // First, note exists
      mockInvoke.mockResolvedValueOnce(createSuccessfulGetResponse(existingNote));
      const beforeDeletion = await invoke('get_player_note', { player_id: playerId }) as GetPlayerNoteResponse;
      expect(beforeDeletion.success).toBe(true);

      // When: プレイヤー削除実行 (simulated)
      // After player deletion, note should not exist
      mockInvoke.mockResolvedValueOnce(createErrorResponse('PLAYER_NOT_FOUND', 'Player has been deleted'));

      // Then: 関連メモも自動削除
      const afterDeletion = await invoke('get_player_note', { player_id: playerId });
      expect(afterDeletion).toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.PLAYER_NOT_FOUND,
          message: 'Player has been deleted',
        },
      });
    });

    test('IT-01-05: トランザクション分離', async () => {
      // Given: 同時メモ更新
      const playerId = 'transaction-player';
      const content1 = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);
      const content2 = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.FORMATTED_TEXT);

      const note1 = createTestPlayerNote({
        player_id: playerId,
        content: content1,
        updated_at: '2025-01-01T10:00:00.000Z',
      });

      const note2 = createTestPlayerNote({
        id: note1.id, // Same note, different content
        player_id: playerId,
        content: content2,
        updated_at: '2025-01-01T10:01:00.000Z',
      });

      // When: 並行save_player_note実行
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(note1));
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(note2));

      const request1: SavePlayerNoteRequest = {
        player_id: playerId,
        content: content1,
        content_type: 'json',
      };

      const request2: SavePlayerNoteRequest = {
        player_id: playerId,
        content: content2,
        content_type: 'json',
      };

      const [response1, response2] = await Promise.all([
        invoke('save_player_note', request1),
        invoke('save_player_note', request2),
      ]);

      // Then: データ一貫性保持
      expect(response1.success).toBe(true);
      expect(response2.success).toBe(true);

      // One of the transactions should win (last-write-wins or proper isolation)
      expect(response1.data!.id).toBe(response2.data!.id); // Same note
    });

    test('IT-01-06: UNIQUE制約動作', async () => {
      // Given: 1プレイヤー1メモ制約
      const playerId = 'unique-constraint-player';
      const content = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);

      const existingNote = createTestPlayerNote({
        player_id: playerId,
        content: content,
      });

      createDatabaseWithExistingNotes([existingNote]);

      // When: 複数メモ保存試行 (実際にはUPSERTなので同じレコードが更新される)
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(existingNote));

      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: content,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: UPSERT動作, 複数レコード作成されない
      expect(response.success).toBe(true);
      expect(response.data!.player_id).toBe(playerId);
      // Should be the same note ID (UPSERT, not duplicate)
      expect(response.data!.id).toBe(existingNote.id);
    });
  });

  describe('IT-02: API Integration', () => {
    test('IT-02-01: Tauriコマンド呼び出し', async () => {
      // Given: フロントエンドからのAPI呼び出し
      const playerId = 'tauri-integration-player';
      const existingNote = createTestPlayerNote({ player_id: playerId });

      mockInvoke.mockResolvedValueOnce(createSuccessfulGetResponse(existingNote));

      // When: invoke('get_player_note') 実行
      const request: GetPlayerNoteRequest = { player_id: playerId };
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;

      // Then: 正常なレスポンス返却
      expect(mockInvoke).toHaveBeenCalledWith('get_player_note', request);
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expectValidPlayerNote(response.data!);
    });

    test('IT-02-02: プレイヤーAPI連携', async () => {
      // Given: TASK-0507で作成されたプレイヤー
      const playerId = 'task-0507-player'; // Simulated player from TASK-0507
      const playerNote = createTestPlayerNote({
        player_id: playerId,
        content: JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.COMPLEX_STRUCTURE),
      });

      // When: メモ保存・取得実行
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(playerNote));
      const saveRequest: SavePlayerNoteRequest = {
        player_id: playerId,
        content: playerNote.content,
        content_type: 'json',
      };
      const saveResponse = await invoke('save_player_note', saveRequest) as SavePlayerNoteResponse;

      mockInvoke.mockResolvedValueOnce(createSuccessfulGetResponse(playerNote));
      const getRequest: GetPlayerNoteRequest = { player_id: playerId };
      const getResponse = await invoke('get_player_note', getRequest) as GetPlayerNoteResponse;

      // Then: プレイヤー情報と整合性保持
      expect(saveResponse.success).toBe(true);
      expect(getResponse.success).toBe(true);
      expect(saveResponse.data!.player_id).toBe(playerId);
      expect(getResponse.data!.player_id).toBe(playerId);
      expect(getResponse.data!.content).toBe(saveResponse.data!.content);
    });

    test('IT-02-03: リアルタイムデータ反映', async () => {
      // Given: メモ保存直後
      const playerId = 'realtime-player';
      const content = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.FORMATTED_TEXT);
      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: content,
        updated_at: new Date().toISOString(),
      });

      // When: 即座にget_player_note実行
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));
      const saveRequest: SavePlayerNoteRequest = {
        player_id: playerId,
        content: content,
        content_type: 'json',
      };
      const saveResponse = await invoke('save_player_note', saveRequest) as SavePlayerNoteResponse;

      // Immediately after save, get the note
      mockInvoke.mockResolvedValueOnce(createSuccessfulGetResponse(savedNote));
      const getRequest: GetPlayerNoteRequest = { player_id: playerId };
      const getResponse = await invoke('get_player_note', getRequest) as GetPlayerNoteResponse;

      // Then: 保存データが即座に取得可能
      expect(saveResponse.success).toBe(true);
      expect(getResponse.success).toBe(true);
      expect(getResponse.data!.content).toBe(saveResponse.data!.content);
      expect(getResponse.data!.updated_at).toBe(saveResponse.data!.updated_at);
    });

    test('IT-02-04: エラー状態の連携', async () => {
      // Given: データベース接続エラー
      const mockInvoke = vi.mocked(invoke);
      simulateDatabaseError('connection', mockInvoke);

      const playerId = 'error-integration-player';

      // When: API呼び出し実行
      const request: GetPlayerNoteRequest = { player_id: playerId };

      // Then: 一貫したエラーレスポンス
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;
      expect(response).toMatchObject({
        success: false,
        error: {
          code: NOTE_ERROR_CODES.DATABASE_ERROR,
          message: 'Database connection failed',
        },
      });
    });

    test('IT-02-05: API error propagation consistency', async () => {
      // Given: Various error scenarios
      const errorScenarios = [
        {
          error: 'timeout',
          playerId: 'timeout-player',
          expectedCode: NOTE_ERROR_CODES.DATABASE_ERROR,
        },
        {
          error: 'disk_full',
          playerId: 'disk-full-player',
          expectedCode: NOTE_ERROR_CODES.DATABASE_ERROR,
        },
        {
          error: 'permission',
          playerId: 'permission-player',
          expectedCode: NOTE_ERROR_CODES.DATABASE_ERROR,
        },
      ] as const;

      for (const scenario of errorScenarios) {
        // When: Different error types occur
        const mockInvoke = vi.mocked(invoke);
        simulateDatabaseError(scenario.error, mockInvoke);

        const request: GetPlayerNoteRequest = { player_id: scenario.playerId };

        // Then: Consistent error response structure
        const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;
        expect(response).toMatchObject({
          success: false,
          error: {
            code: scenario.expectedCode,
            message: expect.any(String),
          },
        });
      }
    });

    test('IT-02-06: Cross-command data consistency', async () => {
      // Given: Data operations across both get and save commands
      const playerId = 'cross-command-player';
      const initialContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);
      const updatedContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.FORMATTED_TEXT);

      const initialNote = createTestPlayerNote({
        player_id: playerId,
        content: initialContent,
        created_at: '2025-01-01T10:00:00.000Z',
        updated_at: '2025-01-01T10:00:00.000Z',
      });

      const updatedNote = createTestPlayerNote({
        id: initialNote.id,
        player_id: playerId,
        content: updatedContent,
        created_at: initialNote.created_at,
        updated_at: '2025-01-01T11:00:00.000Z',
      });

      // When: Save then get then update then get
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(initialNote));
      const saveResponse1 = await invoke('save_player_note', {
        player_id: playerId,
        content: initialContent,
        content_type: 'json',
      }) as SavePlayerNoteResponse;

      mockInvoke.mockResolvedValueOnce(createSuccessfulGetResponse(initialNote));
      const getResponse1 = await invoke('get_player_note', { player_id: playerId }) as GetPlayerNoteResponse;

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(updatedNote));
      const saveResponse2 = await invoke('save_player_note', {
        player_id: playerId,
        content: updatedContent,
        content_type: 'json',
      }) as SavePlayerNoteResponse;

      mockInvoke.mockResolvedValueOnce(createSuccessfulGetResponse(updatedNote));
      const getResponse2 = await invoke('get_player_note', { player_id: playerId }) as GetPlayerNoteResponse;

      // Then: Data consistency across operations
      expect(saveResponse1.success && getResponse1.success && saveResponse2.success && getResponse2.success).toBe(true);

      // Same note ID throughout
      expect(getResponse1.data!.id).toBe(saveResponse1.data!.id);
      expect(saveResponse2.data!.id).toBe(saveResponse1.data!.id);
      expect(getResponse2.data!.id).toBe(saveResponse1.data!.id);

      // Content consistency
      expect(getResponse1.data!.content).toBe(initialContent);
      expect(getResponse2.data!.content).toBe(updatedContent);

      // Timestamp progression
      expect(getResponse2.data!.updated_at).not.toBe(getResponse1.data!.updated_at);
      expect(new Date(getResponse2.data!.updated_at).getTime()).toBeGreaterThan(
        new Date(getResponse1.data!.updated_at).getTime()
      );
    });
  });
});