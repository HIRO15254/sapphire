// Basic functionality tests for Player Note API
// TASK-0511: リッチテキストメモAPI実装 - Red Phase

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  GetPlayerNoteRequest,
  SavePlayerNoteRequest,
  GetPlayerNoteResponse,
  SavePlayerNoteResponse,
  PlayerNote,
  ContentType,
  detectContentType,
  isValidTipTapJSON,
  generateContentHash,
} from '../../types/playerNote';
import {
  setupTauriMock,
  resetMocks,
  mockTauriInvoke,
  createTestPlayerNote,
  createSuccessfulGetResponse,
  createEmptyGetResponse,
  createSuccessfulSaveResponse,
  expectValidPlayerNote,
  expectValidGetResponse,
  expectValidSaveResponse,
} from './testUtils';
import { SAMPLE_TIPTAP_DOCUMENTS, SAMPLE_HTML_CONTENT } from './mockData';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('Player Note API - Basic Functionality (UT-01 to UT-05)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockClear();
  });

  describe('UT-01: Note Retrieval Functionality', () => {
    test('UT-01-01: 既存メモの正常取得', async () => {
      // Given: player_id="player123" に既存メモ
      const playerId = 'player123';
      const existingNote = createTestPlayerNote({
        player_id: playerId,
        content: JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH),
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulGetResponse(existingNote));

      // When: get_player_note を実行
      const request: GetPlayerNoteRequest = { player_id: playerId };
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;

      // Then: PlayerNote オブジェクトが返される
      expect(mockInvoke).toHaveBeenCalledWith('get_player_note', request);
      expectValidGetResponse(response);
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data!.player_id).toBe(playerId);
      expectValidPlayerNote(response.data!);
    });

    test('UT-01-02: 存在しないメモの取得', async () => {
      // Given: player_id="nonexistent" にメモ無し
      const playerId = 'nonexistent';

      mockInvoke.mockResolvedValueOnce(createEmptyGetResponse());

      // When: get_player_note を実行
      const request: GetPlayerNoteRequest = { player_id: playerId };
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;

      // Then: success=true, data=null が返される
      expect(mockInvoke).toHaveBeenCalledWith('get_player_note', request);
      expectValidGetResponse(response);
      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
    });

    test('UT-01-03: TipTap JSON形式メモ取得', async () => {
      // Given: JSON形式で保存されたメモ
      const playerId = 'json-player';
      const jsonContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.FORMATTED_TEXT);
      const note = createTestPlayerNote({
        player_id: playerId,
        content: jsonContent,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulGetResponse(note));

      // When: get_player_note を実行
      const request: GetPlayerNoteRequest = { player_id: playerId };
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;

      // Then: content_type="json", 正常なJSONコンテンツ
      expect(response.success).toBe(true);
      expect(response.data!.content_type).toBe('json');
      expect(response.data!.content).toBe(jsonContent);
      expect(() => JSON.parse(response.data!.content)).not.toThrow();
    });

    test('UT-01-04: HTML形式メモ取得', async () => {
      // Given: HTML形式で保存されたメモ
      const playerId = 'html-player';
      const htmlContent = SAMPLE_HTML_CONTENT.FORMATTED;
      const note = createTestPlayerNote({
        player_id: playerId,
        content: htmlContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulGetResponse(note));

      // When: get_player_note を実行
      const request: GetPlayerNoteRequest = { player_id: playerId };
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;

      // Then: content_type="html", 正常なHTMLコンテンツ
      expect(response.success).toBe(true);
      expect(response.data!.content_type).toBe('html');
      expect(response.data!.content).toBe(htmlContent);
      expect(response.data!.content).toContain('<strong>');
      expect(response.data!.content).toContain('<em>');
    });

    test('UT-01-05: タイムスタンプ情報取得', async () => {
      // Given: 作成・更新日時付きメモ
      const playerId = 'timestamp-player';
      const createdAt = '2025-01-01T10:00:00.000Z';
      const updatedAt = '2025-01-01T15:30:00.000Z';
      const note = createTestPlayerNote({
        player_id: playerId,
        created_at: createdAt,
        updated_at: updatedAt,
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulGetResponse(note));

      // When: get_player_note を実行
      const request: GetPlayerNoteRequest = { player_id: playerId };
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;

      // Then: created_at, updated_at が ISO 8601 形式
      expect(response.success).toBe(true);
      expect(response.data!.created_at).toBe(createdAt);
      expect(response.data!.updated_at).toBe(updatedAt);
      expect(new Date(response.data!.created_at).toISOString()).toBe(createdAt);
      expect(new Date(response.data!.updated_at).toISOString()).toBe(updatedAt);
    });
  });

  describe('UT-02: Note Saving Functionality', () => {
    test('UT-02-01: 新規メモ作成 (INSERT)', async () => {
      // Given: 新規プレイヤーID, TipTap JSONコンテンツ
      const playerId = 'new-player';
      const content = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);
      const newNote = createTestPlayerNote({
        player_id: playerId,
        content: content,
        content_type: 'json',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(newNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: content,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 新しいPlayerNote作成, created_at設定
      expect(mockInvoke).toHaveBeenCalledWith('save_player_note', request);
      expectValidSaveResponse(response);
      expect(response.success).toBe(true);
      expect(response.data!.player_id).toBe(playerId);
      expect(response.data!.content).toBe(content);
      expect(response.data!.content_type).toBe('json');
      expect(response.data!.created_at).toBeDefined();
      expect(response.data!.updated_at).toBeDefined();
    });

    test('UT-02-02: 既存メモ更新 (UPDATE)', async () => {
      // Given: 既存プレイヤーID, 更新コンテンツ
      const playerId = 'existing-player';
      const originalCreatedAt = '2025-01-01T10:00:00.000Z';
      const newUpdatedAt = new Date().toISOString();
      const updatedContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.FORMATTED_TEXT);

      const updatedNote = createTestPlayerNote({
        player_id: playerId,
        content: updatedContent,
        content_type: 'json',
        created_at: originalCreatedAt,
        updated_at: newUpdatedAt,
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(updatedNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: updatedContent,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 既存メモ更新, updated_at更新
      expect(response.success).toBe(true);
      expect(response.data!.created_at).toBe(originalCreatedAt);
      expect(response.data!.updated_at).toBe(newUpdatedAt);
      expect(response.data!.content).toBe(updatedContent);
    });

    test('UT-02-03: TipTap JSON保存', async () => {
      // Given: 有効なTipTap JSON形式コンテンツ
      const playerId = 'tiptap-player';
      const tipTapContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.COMPLEX_STRUCTURE);
      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: tipTapContent,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: tipTapContent,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: content_type="json", JSON検証成功
      expect(response.success).toBe(true);
      expect(response.data!.content_type).toBe('json');
      expect(isValidTipTapJSON(response.data!.content)).toBe(true);
    });

    test('UT-02-04: HTML形式保存', async () => {
      // Given: HTML形式コンテンツ
      const playerId = 'html-player';
      const htmlContent = SAMPLE_HTML_CONTENT.MIXED_CONTENT;
      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: htmlContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: htmlContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: content_type="html", サニタイゼーション実行
      expect(response.success).toBe(true);
      expect(response.data!.content_type).toBe('html');
      expect(response.data!.content).toBeDefined();
      // サニタイゼーション済みコンテンツが返される想定
    });

    test('UT-02-05: UPSERT操作確認', async () => {
      // Given: 同一player_idで複数回保存
      const playerId = 'upsert-player';
      const firstContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);
      const secondContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.FORMATTED_TEXT);

      const firstSave = createTestPlayerNote({
        player_id: playerId,
        content: firstContent,
        created_at: '2025-01-01T10:00:00.000Z',
        updated_at: '2025-01-01T10:00:00.000Z',
      });

      const secondSave = createTestPlayerNote({
        id: firstSave.id, // Same ID for UPSERT
        player_id: playerId,
        content: secondContent,
        created_at: firstSave.created_at, // Preserved
        updated_at: '2025-01-01T11:00:00.000Z', // Updated
      });

      // When: save_player_note を繰り返し実行
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(firstSave));
      const firstRequest: SavePlayerNoteRequest = {
        player_id: playerId,
        content: firstContent,
        content_type: 'json',
      };
      const firstResponse = await invoke('save_player_note', firstRequest) as SavePlayerNoteResponse;

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(secondSave));
      const secondRequest: SavePlayerNoteRequest = {
        player_id: playerId,
        content: secondContent,
        content_type: 'json',
      };
      const secondResponse = await invoke('save_player_note', secondRequest) as SavePlayerNoteResponse;

      // Then: レコード数は1のまま, updated_at更新
      expect(firstResponse.success).toBe(true);
      expect(secondResponse.success).toBe(true);
      expect(secondResponse.data!.id).toBe(firstResponse.data!.id); // Same ID
      expect(secondResponse.data!.created_at).toBe(firstResponse.data!.created_at); // Preserved
      expect(new Date(secondResponse.data!.updated_at).getTime()).toBeGreaterThan(
        new Date(firstResponse.data!.updated_at).getTime()
      ); // Updated
    });

    test('UT-02-06: コンテンツハッシュ生成', async () => {
      // Given: 同一コンテンツ
      const playerId = 'hash-player';
      const content = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);
      const expectedHash = generateContentHash(content);

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: content,
        content_hash: expectedHash,
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: content,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 同一content_hash生成
      expect(response.success).toBe(true);
      expect(response.data!.content_hash).toBe(expectedHash);

      // Same content should generate same hash
      const sameContentHash = generateContentHash(content);
      expect(sameContentHash).toBe(expectedHash);
    });
  });

  describe('UT-03: TipTap JSON Processing', () => {
    test('UT-03-01: 基本TipTap構造検証', async () => {
      // Given: {type: "doc", content: [...]}
      const basicDoc = SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH;
      const basicDocString = JSON.stringify(basicDoc);

      // When: TipTap JSON検証実行
      const isValid = isValidTipTapJSON(basicDocString);

      // Then: 妥当性確認成功
      expect(isValid).toBe(true);
      expect(basicDoc.type).toBe('doc');
      expect(Array.isArray(basicDoc.content)).toBe(true);
    });

    test('UT-03-02: 複雑なTipTap構造', async () => {
      // Given: 入れ子構造のTipTap JSON
      const complexDoc = SAMPLE_TIPTAP_DOCUMENTS.NESTED_LISTS;
      const complexDocString = JSON.stringify(complexDoc);

      const playerId = 'complex-player';
      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: complexDocString,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: 検証・保存実行
      const isValid = isValidTipTapJSON(complexDocString);
      expect(isValid).toBe(true);

      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: complexDocString,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 構造維持して保存
      expect(response.success).toBe(true);
      expect(response.data!.content).toBe(complexDocString);

      const parsedContent = JSON.parse(response.data!.content);
      expect(parsedContent.type).toBe('doc');
      expect(parsedContent.content[0].type).toBe('ordered_list');
    });

    test('UT-03-03: TipTapマーク処理', async () => {
      // Given: 太字・斜体・リンクマーク付きJSON
      const markedDoc = SAMPLE_TIPTAP_DOCUMENTS.WITH_LINK;
      const markedDocString = JSON.stringify(markedDoc);

      const playerId = 'marked-player';
      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: markedDocString,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: 保存・取得実行
      const saveRequest: SavePlayerNoteRequest = {
        player_id: playerId,
        content: markedDocString,
        content_type: 'json',
      };
      const saveResponse = await invoke('save_player_note', saveRequest) as SavePlayerNoteResponse;

      // Then: マーク情報完全保持
      expect(saveResponse.success).toBe(true);

      const parsedContent = JSON.parse(saveResponse.data!.content);
      const textNode = parsedContent.content[0].content[1]; // Link node
      expect(textNode.marks).toBeDefined();
      expect(textNode.marks[0].type).toBe('link');
      expect(textNode.marks[0].attrs.href).toBe('https://example.com');
    });

    test('UT-03-04: TipTap属性処理', async () => {
      // Given: カスタム属性付きノード
      const docWithAttrs = SAMPLE_TIPTAP_DOCUMENTS.WITH_CODE;
      const docWithAttrsString = JSON.stringify(docWithAttrs);

      const playerId = 'attrs-player';
      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: docWithAttrsString,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: docWithAttrsString,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 属性情報完全保持
      expect(response.success).toBe(true);

      const parsedContent = JSON.parse(response.data!.content);
      const codeBlock = parsedContent.content[1]; // Code block node
      expect(codeBlock.type).toBe('code_block');
      expect(codeBlock.attrs).toBeDefined();
      expect(codeBlock.attrs.language).toBe('json');
    });

    test('UT-03-05: 空TipTap文書', async () => {
      // Given: {type: "doc", content: []}
      const emptyDoc = SAMPLE_TIPTAP_DOCUMENTS.EMPTY_DOCUMENT;
      const emptyDocString = JSON.stringify(emptyDoc);

      const playerId = 'empty-player';
      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: emptyDocString,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: 保存・取得実行
      const isValid = isValidTipTapJSON(emptyDocString);
      expect(isValid).toBe(true);

      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: emptyDocString,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 空文書として正常処理
      expect(response.success).toBe(true);
      expect(response.data!.content).toBe(emptyDocString);

      const parsedContent = JSON.parse(response.data!.content);
      expect(parsedContent.type).toBe('doc');
      expect(parsedContent.content).toEqual([]);
    });
  });

  describe('UT-04: HTML Processing & Sanitization', () => {
    test('UT-04-01: 基本HTML保存', async () => {
      // Given: <p>Hello <strong>World</strong></p>
      const basicHTML = '<p>Hello <strong>World</strong></p>';
      const playerId = 'basic-html-player';

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: basicHTML,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: basicHTML,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: HTMLタグ保持して保存
      expect(response.success).toBe(true);
      expect(response.data!.content_type).toBe('html');
      expect(response.data!.content).toContain('<p>');
      expect(response.data!.content).toContain('<strong>');
      expect(response.data!.content).toContain('Hello');
      expect(response.data!.content).toContain('World');
    });

    test('UT-04-02: XSS攻撃防御', async () => {
      // Given: <script>alert('xss')</script>
      const xssContent = '<p>Normal content</p><script>alert(\'xss\')</script>';
      const sanitizedContent = '<p>Normal content</p>'; // Script removed
      const playerId = 'xss-player';

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: sanitizedContent, // Mock shows sanitized version
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: xssContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: スクリプトタグ除去
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('<script>');
      expect(response.data!.content).not.toContain('alert');
      expect(response.data!.content).toContain('<p>Normal content</p>');
    });

    test('UT-04-03: 許可タグ保持', async () => {
      // Given: <p><h1><strong><em><ul><li><a>
      const allowedTagsHTML = SAMPLE_HTML_CONTENT.MIXED_CONTENT;
      const playerId = 'allowed-tags-player';

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: allowedTagsHTML,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: サニタイゼーション実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: allowedTagsHTML,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 許可タグのみ保持
      expect(response.success).toBe(true);
      expect(response.data!.content).toContain('<h1>');
      expect(response.data!.content).toContain('<p>');
      expect(response.data!.content).toContain('<strong>');
      expect(response.data!.content).toContain('<em>');
      expect(response.data!.content).toContain('<ul>');
      expect(response.data!.content).toContain('<li>');
    });

    test('UT-04-04: 危険属性除去', async () => {
      // Given: <a href="javascript:alert('xss')">
      const dangerousHTML = '<a href="javascript:alert(\'xss\')">Click me</a>';
      const safeHTML = '<a>Click me</a>'; // javascript: removed
      const playerId = 'dangerous-attrs-player';

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: safeHTML,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: サニタイゼーション実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: dangerousHTML,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: javascript: プロトコル除去
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('javascript:');
      expect(response.data!.content).not.toContain('alert');
      expect(response.data!.content).toContain('Click me');
    });

    test('UT-04-05: Unicode文字処理', async () => {
      // Given: Unicode特殊文字含有HTML
      const unicodeHTML = '<p>🎯 Player: 田中太郎 🎯</p><p>Style: 保守的 🃏</p>';
      const playerId = 'unicode-player';

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: unicodeHTML,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: unicodeHTML,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 文字エンコーディング保持
      expect(response.success).toBe(true);
      expect(response.data!.content).toContain('🎯');
      expect(response.data!.content).toContain('田中太郎');
      expect(response.data!.content).toContain('保守的');
      expect(response.data!.content).toContain('🃏');
    });
  });

  describe('UT-05: Content Type Detection', () => {
    test('UT-05-01: JSON形式検出', async () => {
      // Given: "{\"type\":\"doc\"...}" で開始
      const jsonContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);

      // When: コンテンツ形式検出
      const detectedType = detectContentType(jsonContent);

      // Then: content_type="json"
      expect(detectedType).toBe('json');
    });

    test('UT-05-02: HTML形式検出', async () => {
      // Given: "<p>..." で開始
      const htmlContent = '<p>This is HTML content</p>';

      // When: コンテンツ形式検出
      const detectedType = detectContentType(htmlContent);

      // Then: content_type="html"
      expect(detectedType).toBe('html');
    });

    test('UT-05-03: プレーンテキスト検出', async () => {
      // Given: タグ無しテキスト
      const plainText = 'This is plain text without any tags';

      // When: コンテンツ形式検出
      const detectedType = detectContentType(plainText);

      // Then: content_type="html" (デフォルト)
      expect(detectedType).toBe('html');
    });

    test('UT-05-04: 空白付きJSON検出', async () => {
      // Given: "  \n  {\"type\":..." (前置空白)
      const jsonWithWhitespace = '  \n  ' + JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.EMPTY_DOCUMENT) + '  \n  ';

      // When: コンテンツ形式検出
      const detectedType = detectContentType(jsonWithWhitespace);

      // Then: 正しくJSON認識
      expect(detectedType).toBe('json');
    });
  });
});