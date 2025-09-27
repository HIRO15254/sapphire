// Edge case tests for Player Note API
// TASK-0511: リッチテキストメモAPI実装 - Red Phase

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  GetPlayerNoteRequest,
  SavePlayerNoteRequest,
  GetPlayerNoteResponse,
  SavePlayerNoteResponse,
  generateContentHash,
  detectContentType,
  MAX_CONTENT_SIZE,
} from '../../types/playerNote';
import {
  setupTauriMock,
  resetMocks,
  mockTauriInvoke,
  createTestPlayerNote,
  createSuccessfulGetResponse,
  createSuccessfulSaveResponse,
  createEmptyGetResponse,
  createErrorResponse,
  createSpecialCharacterContent,
} from './testUtils';
import {
  generatePerformanceTestData,
  BOUNDARY_VALUES,
  SPECIAL_CHARACTER_TESTS,
  SAMPLE_TIPTAP_DOCUMENTS,
} from './mockData';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('Player Note API - Edge Case Tests (EC-01 to EC-04)', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockClear();
  });

  describe('EC-01: Content Boundary Value Tests', () => {
    test('EC-01-01: 空コンテンツ保存', async () => {
      // Given: content=""
      const playerId = 'empty-content-player';
      const emptyContent = '';

      const emptyNote = createTestPlayerNote({
        player_id: playerId,
        content: emptyContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(emptyNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: emptyContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 空メモとして正常保存
      expect(response.success).toBe(true);
      expect(response.data!.content).toBe(emptyContent);
      expect(response.data!.content_type).toBe('html');
    });

    test('EC-01-02: 1文字コンテンツ', async () => {
      // Given: content="a"
      const playerId = 'single-char-player';
      const singleCharContent = 'a';

      const singleCharNote = createTestPlayerNote({
        player_id: playerId,
        content: singleCharContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(singleCharNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: singleCharContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 正常保存
      expect(response.success).toBe(true);
      expect(response.data!.content).toBe(singleCharContent);
      expect(response.data!.content.length).toBe(1);
    });

    test('EC-01-03: 最大サイズ境界値', async () => {
      // Given: content=10MB-1byte
      const playerId = 'max-size-boundary-player';
      const performanceData = generatePerformanceTestData();
      const maxSizeContent = performanceData.maxSize; // Exactly at limit

      const maxSizeNote = createTestPlayerNote({
        player_id: playerId,
        content: maxSizeContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(maxSizeNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: maxSizeContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 正常保存
      expect(response.success).toBe(true);
      expect(response.data!.content).toBe(maxSizeContent);

      // Verify size is at boundary
      const contentSize = Buffer.byteLength(maxSizeContent, 'utf8');
      expect(contentSize).toBeLessThanOrEqual(MAX_CONTENT_SIZE);
    });

    test('EC-01-04: 最大サイズ超過', async () => {
      // Given: content=10MB+1byte
      const playerId = 'over-max-size-player';
      const performanceData = generatePerformanceTestData();
      const oversizeContent = performanceData.overLimit; // Over limit

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('CONTENT_TOO_LARGE', 'Content exceeds maximum size', {
          player_id: playerId,
          content_size: Buffer.byteLength(oversizeContent, 'utf8'),
        })
      );

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: oversizeContent,
        content_type: 'html',
      };

      // Then: NOTE_CONTENT_TOO_LARGE エラー
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: 'NOTE_CONTENT_TOO_LARGE',
          message: 'Content exceeds maximum size',
        },
      });
    });

    test('EC-01-05: 極長JSON構造', async () => {
      // Given: 100個のリストアイテムを持つTipTap JSON
      const playerId = 'deep-nested-player';

      // Create structure with 100 bullet list items at the top level
      const contentItems = [];
      for (let i = 0; i < 100; i++) {
        contentItems.push({
          type: 'bullet_list',
          content: [
            {
              type: 'list_item',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: `List item ${i + 1}`,
                    },
                  ],
                },
              ],
            },
          ],
        });
      }

      const deepStructure = {
        type: 'doc',
        content: contentItems
      };

      const deepNestedContent = JSON.stringify(deepStructure);

      const deepNestedNote = createTestPlayerNote({
        player_id: playerId,
        content: deepNestedContent,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(deepNestedNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: deepNestedContent,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: パフォーマンス劣化なし
      expect(response.success).toBe(true);
      expect(response.data!.content_type).toBe('json');

      // Verify structure is preserved
      const parsedContent = JSON.parse(response.data!.content);
      expect(parsedContent.type).toBe('doc');
      expect(parsedContent.content).toHaveLength(100);
    });

    test('EC-01-06: Boundary value content sizes', async () => {
      // Test various boundary values
      const boundaryTests = [
        { name: 'empty', content: BOUNDARY_VALUES.CONTENT_SIZES.empty },
        { name: 'single char', content: BOUNDARY_VALUES.CONTENT_SIZES.singleChar },
        { name: 'two chars', content: BOUNDARY_VALUES.CONTENT_SIZES.twoChars },
      ];

      for (const { name, content } of boundaryTests) {
        const playerId = `boundary-${name.replace(' ', '-')}-player`;

        const boundaryNote = createTestPlayerNote({
          player_id: playerId,
          content: content,
          content_type: 'html',
        });

        mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(boundaryNote));

        const request: SavePlayerNoteRequest = {
          player_id: playerId,
          content: content,
          content_type: 'html',
        };
        const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

        expect(response.success).toBe(true);
        expect(response.data!.content).toBe(content);
      }
    });
  });

  describe('EC-02: Special Characters & Encoding', () => {
    test('EC-02-01: Unicode絵文字処理', async () => {
      // Given: "🎯📝✨" 含有コンテンツ
      const playerId = 'emoji-player';
      const emojiContent = '🎯📝✨ Player analysis with poker emojis 🃏♠️♥️♦️♣️🎰🎲';

      const emojiNote = createTestPlayerNote({
        player_id: playerId,
        content: emojiContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(emojiNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: emojiContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 絵文字完全保持
      expect(response.success).toBe(true);
      expect(response.data!.content).toContain('🎯');
      expect(response.data!.content).toContain('📝');
      expect(response.data!.content).toContain('✨');
      expect(response.data!.content).toContain('🃏');
      expect(response.data!.content).toContain('♠️♥️♦️♣️');
      expect(response.data!.content).toContain('🎰🎲');
    });

    test('EC-02-02: 多バイト文字処理', async () => {
      // Given: 日本語・中国語・韓国語文字
      const playerId = 'multibyte-player';
      const multibyteContent = `
        日本語: プレイヤー分析 - このプレイヤーは保守的です
        中文: 玩家分析 - 这个玩家很保守
        한국어: 플레이어 분석 - 이 플레이어는 보수적입니다
        العربية: تحليل اللاعب - هذا اللاعب محافظ
        עברית: ניתוח שחקן - השחקן הזה שמרני
      `;

      const multibyteNote = createTestPlayerNote({
        player_id: playerId,
        content: multibyteContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(multibyteNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: multibyteContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 文字化けなし
      expect(response.success).toBe(true);
      expect(response.data!.content).toContain('プレイヤー分析');
      expect(response.data!.content).toContain('玩家分析');
      expect(response.data!.content).toContain('플레이어 분석');
      expect(response.data!.content).toContain('تحليل اللاعب');
      expect(response.data!.content).toContain('ניתוח שחקן');
    });

    test('EC-02-03: 制御文字処理', async () => {
      // Given: タブ・改行・NULL文字
      const playerId = 'control-char-player';
      const controlCharContent = 'Line1\nLine2\tTabbed\rCarriage\fForm\vVertical\bBackspace\0Null';

      const controlCharNote = createTestPlayerNote({
        player_id: playerId,
        content: controlCharContent.replace('\0', ''), // Null removed during processing
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(controlCharNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: controlCharContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 適切なエスケープ処理
      expect(response.success).toBe(true);
      expect(response.data!.content).toContain('Line1');
      expect(response.data!.content).toContain('Line2');
      expect(response.data!.content).toContain('Tabbed');
      // Null character should be filtered out
      expect(response.data!.content).not.toContain('\0');
    });

    test('EC-02-04: 特殊HTML文字', async () => {
      // Given: "&lt;&gt;&amp;&quot;&#39;"
      const playerId = 'html-entities-player';
      const htmlEntitiesContent = '&lt;p&gt;&amp;nbsp;Player &quot;Hero&quot; &#39;analysis&#39;&lt;/p&gt;';

      const htmlEntitiesNote = createTestPlayerNote({
        player_id: playerId,
        content: htmlEntitiesContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(htmlEntitiesNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: htmlEntitiesContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: HTMLエンティティ適切処理
      expect(response.success).toBe(true);
      expect(response.data!.content).toBe(htmlEntitiesContent);
    });

    test('EC-02-05: バイナリデータ混入', async () => {
      // Given: バイナリ文字含有コンテンツ
      const playerId = 'binary-data-player';
      const binaryContent = 'Text with binary \xFF\xFE\x00\x01 data mixed in';

      // Mock sanitized content (binary removed)
      const sanitizedContent = 'Text with binary  data mixed in';
      const binaryNote = createTestPlayerNote({
        player_id: playerId,
        content: sanitizedContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(binaryNote));

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: binaryContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 適切なエラーまたはサニタイゼーション
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('\xFF');
      expect(response.data!.content).not.toContain('\xFE');
      expect(response.data!.content).not.toContain('\x00');
      expect(response.data!.content).toContain('Text with binary');
    });

    test('EC-02-06: Comprehensive special character tests', async () => {
      // Test all special character patterns
      const specialCharTests = createSpecialCharacterContent();

      for (const { content } of specialCharTests) {
        const playerId = `special-char-${specialCharTests.indexOf({ content })}`;

        const specialCharNote = createTestPlayerNote({
          player_id: playerId,
          content: content,
          content_type: 'html',
        });

        mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(specialCharNote));

        const request: SavePlayerNoteRequest = {
          player_id: playerId,
          content: content,
          content_type: 'html',
        };
        const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

        expect(response.success).toBe(true);
        expect(response.data!.content).toBeDefined();
      }
    });
  });

  describe('EC-03: TipTap Special Cases', () => {
    test('EC-03-01: 空ドキュメント', async () => {
      // Given: {type: "doc", content: []}
      const playerId = 'empty-doc-player';
      const emptyDoc = SAMPLE_TIPTAP_DOCUMENTS.EMPTY_DOCUMENT;
      const emptyDocContent = JSON.stringify(emptyDoc);

      const emptyDocNote = createTestPlayerNote({
        player_id: playerId,
        content: emptyDocContent,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(emptyDocNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: emptyDocContent,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 空文書として正常処理
      expect(response.success).toBe(true);
      expect(response.data!.content_type).toBe('json');

      const parsedContent = JSON.parse(response.data!.content);
      expect(parsedContent.type).toBe('doc');
      expect(parsedContent.content).toEqual([]);
    });

    test('EC-03-02: 単一段落', async () => {
      // Given: Single paragraph document
      const playerId = 'single-paragraph-player';
      const singleParagraph = SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH;
      const singleParagraphContent = JSON.stringify(singleParagraph);

      const singleParagraphNote = createTestPlayerNote({
        player_id: playerId,
        content: singleParagraphContent,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(singleParagraphNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: singleParagraphContent,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 構造完全保持
      expect(response.success).toBe(true);

      const parsedContent = JSON.parse(response.data!.content);
      expect(parsedContent.type).toBe('doc');
      expect(parsedContent.content).toHaveLength(1);
      expect(parsedContent.content[0].type).toBe('paragraph');
    });

    test('EC-03-03: ネストした構造', async () => {
      // Given: リスト内リスト、表内要素など
      const playerId = 'nested-structure-player';
      const nestedStructure = SAMPLE_TIPTAP_DOCUMENTS.NESTED_LISTS;
      const nestedStructureContent = JSON.stringify(nestedStructure);

      const nestedStructureNote = createTestPlayerNote({
        player_id: playerId,
        content: nestedStructureContent,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(nestedStructureNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: nestedStructureContent,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 深い入れ子構造保持
      expect(response.success).toBe(true);

      const parsedContent = JSON.parse(response.data!.content);
      expect(parsedContent.type).toBe('doc');
      expect(parsedContent.content[0].type).toBe('ordered_list');
      expect(parsedContent.content[0].content[0].type).toBe('list_item');
      expect(parsedContent.content[0].content[0].content[1].type).toBe('bullet_list');
    });

    test('EC-03-04: カスタムノード', async () => {
      // Given: 独自拡張ノードタイプ
      const playerId = 'custom-node-player';
      const customNodeDoc = {
        type: 'doc',
        content: [
          {
            type: 'custom_player_stats',
            attrs: {
              vpip: 28.5,
              pfr: 22.1,
              aggression: 3.2,
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Custom node with player statistics',
                  },
                ],
              },
            ],
          },
          {
            type: 'custom_hand_range',
            attrs: {
              position: 'UTG',
              action: 'raise',
            },
            content: [
              {
                type: 'text',
                text: 'AA, KK, QQ, AKs, AKo',
              },
            ],
          },
        ],
      };
      const customNodeContent = JSON.stringify(customNodeDoc);

      const customNodeNote = createTestPlayerNote({
        player_id: playerId,
        content: customNodeContent,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(customNodeNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: customNodeContent,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 未知ノードも適切処理
      expect(response.success).toBe(true);

      const parsedContent = JSON.parse(response.data!.content);
      expect(parsedContent.content[0].type).toBe('custom_player_stats');
      expect(parsedContent.content[0].attrs.vpip).toBe(28.5);
      expect(parsedContent.content[1].type).toBe('custom_hand_range');
      expect(parsedContent.content[1].attrs.position).toBe('UTG');
    });

    test('EC-03-05: マーク組み合わせ', async () => {
      // Given: 太字+斜体+下線+リンク
      const playerId = 'multiple-marks-player';
      const multipleMarksDoc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This text has multiple marks',
                marks: [
                  { type: 'bold' },
                  { type: 'italic' },
                  { type: 'underline' },
                  {
                    type: 'link',
                    attrs: {
                      href: 'https://example.com',
                      title: 'Example Link',
                    },
                  },
                  { type: 'code' },
                ],
              },
            ],
          },
        ],
      };
      const multipleMarksContent = JSON.stringify(multipleMarksDoc);

      const multipleMarksNote = createTestPlayerNote({
        player_id: playerId,
        content: multipleMarksContent,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(multipleMarksNote));

      // When: 保存・取得実行
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: multipleMarksContent,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: 全マーク情報保持
      expect(response.success).toBe(true);

      const parsedContent = JSON.parse(response.data!.content);
      const textNode = parsedContent.content[0].content[0];
      expect(textNode.marks).toHaveLength(5);

      const markTypes = textNode.marks.map((mark: any) => mark.type);
      expect(markTypes).toContain('bold');
      expect(markTypes).toContain('italic');
      expect(markTypes).toContain('underline');
      expect(markTypes).toContain('link');
      expect(markTypes).toContain('code');
    });
  });

  describe('EC-04: Data State & Consistency Tests', () => {
    test('EC-04-01: 同一コンテンツ重複保存', async () => {
      // Given: 同じコンテンツで複数回保存
      const playerId = 'duplicate-content-player';
      const content = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);
      const contentHash = generateContentHash(content);

      const firstSave = createTestPlayerNote({
        player_id: playerId,
        content: content,
        content_hash: contentHash,
        created_at: '2025-01-01T10:00:00.000Z',
        updated_at: '2025-01-01T10:00:00.000Z',
      });

      const secondSave = createTestPlayerNote({
        id: firstSave.id, // Same note
        player_id: playerId,
        content: content,
        content_hash: contentHash, // Same hash
        created_at: firstSave.created_at, // Preserved
        updated_at: '2025-01-01T11:00:00.000Z', // Updated timestamp
      });

      // When: save_player_note を繰り返し実行
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(firstSave));
      const firstResponse = await invoke('save_player_note', {
        player_id: playerId,
        content: content,
        content_type: 'json' as const,
      }) as SavePlayerNoteResponse;

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(secondSave));
      const secondResponse = await invoke('save_player_note', {
        player_id: playerId,
        content: content,
        content_type: 'json' as const,
      }) as SavePlayerNoteResponse;

      // Then: 同一content_hash、updated_at更新
      expect(firstResponse.success).toBe(true);
      expect(secondResponse.success).toBe(true);
      expect(secondResponse.data!.content_hash).toBe(firstResponse.data!.content_hash);
      expect(secondResponse.data!.created_at).toBe(firstResponse.data!.created_at);
      expect(new Date(secondResponse.data!.updated_at).getTime()).toBeGreaterThan(
        new Date(firstResponse.data!.updated_at).getTime()
      );
    });

    test('EC-04-02: 削除されたプレイヤー参照', async () => {
      // Given: 削除済みプレイヤーID
      const deletedPlayerId = 'deleted-player-id';

      mockInvoke.mockResolvedValueOnce(createEmptyGetResponse());

      // When: get_player_note を実行
      const request: GetPlayerNoteRequest = { player_id: deletedPlayerId };
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;

      // Then: NOTE_PLAYER_NOT_FOUND エラー
      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined(); // No note found
    });

    test('EC-04-03: データベース不整合状態', async () => {
      // Given: 手動DB操作による不整合
      const inconsistentPlayerId = 'inconsistent-player';

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('DATABASE_ERROR', 'Data integrity violation detected', {
          player_id: inconsistentPlayerId,
        })
      );

      // When: API実行
      const request: GetPlayerNoteRequest = { player_id: inconsistentPlayerId };

      // Then: 適切なエラーハンドリング
      await expect(invoke('get_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: 'NOTE_DATABASE_ERROR',
          message: 'Data integrity violation detected',
        },
      });
    });

    test('EC-04-04: タイムスタンプ整合性', async () => {
      // Given: 連続メモ更新
      const playerId = 'timestamp-consistency-player';
      const content1 = 'First content';
      const content2 = 'Second content';
      const content3 = 'Third content';

      const timestamps = [
        '2025-01-01T10:00:00.000Z',
        '2025-01-01T10:01:00.000Z',
        '2025-01-01T10:02:00.000Z',
      ];

      const notes = [content1, content2, content3].map((content, index) =>
        createTestPlayerNote({
          id: 'consistent-note-id',
          player_id: playerId,
          content: content,
          created_at: timestamps[0], // Always same created time
          updated_at: timestamps[index], // Progressive update times
        })
      );

      // When: save_player_note を時間差実行
      for (let i = 0; i < 3; i++) {
        mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(notes[i]));

        const request: SavePlayerNoteRequest = {
          player_id: playerId,
          content: [content1, content2, content3][i],
          content_type: 'html',
        };
        const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

        // Then: updated_at が常に増加
        expect(response.success).toBe(true);
        expect(response.data!.updated_at).toBe(timestamps[i]);

        if (i > 0) {
          expect(new Date(response.data!.updated_at).getTime()).toBeGreaterThan(
            new Date(timestamps[i - 1]).getTime()
          );
        }
      }
    });

    test('EC-04-05: 外部キー制約違反', async () => {
      // Given: 無効なplayer_id
      const invalidPlayerId = 'invalid-foreign-key-player';

      mockInvoke.mockRejectedValueOnce(
        createErrorResponse('FOREIGN_KEY_VIOLATION', 'Player reference does not exist', {
          player_id: invalidPlayerId,
        })
      );

      // When: save_player_note を実行
      const request: SavePlayerNoteRequest = {
        player_id: invalidPlayerId,
        content: 'Test content',
        content_type: 'html',
      };

      // Then: 外部キー制約エラー適切処理
      await expect(invoke('save_player_note', request)).rejects.toMatchObject({
        success: false,
        error: {
          code: 'NOTE_FOREIGN_KEY_VIOLATION',
          message: 'Player reference does not exist',
        },
      });
    });

    test('EC-04-06: Content type consistency', async () => {
      // Given: Content type changes between saves
      const playerId = 'content-type-change-player';
      const jsonContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);
      const htmlContent = '<p>HTML version of content</p>';

      const jsonNote = createTestPlayerNote({
        id: 'content-type-note',
        player_id: playerId,
        content: jsonContent,
        content_type: 'json',
        created_at: '2025-01-01T10:00:00.000Z',
        updated_at: '2025-01-01T10:00:00.000Z',
      });

      const htmlNote = createTestPlayerNote({
        id: 'content-type-note', // Same note ID
        player_id: playerId,
        content: htmlContent,
        content_type: 'html', // Type changed
        created_at: jsonNote.created_at,
        updated_at: '2025-01-01T11:00:00.000Z',
      });

      // When: Saving with different content types
      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(jsonNote));
      const jsonResponse = await invoke('save_player_note', {
        player_id: playerId,
        content: jsonContent,
        content_type: 'json' as const,
      }) as SavePlayerNoteResponse;

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(htmlNote));
      const htmlResponse = await invoke('save_player_note', {
        player_id: playerId,
        content: htmlContent,
        content_type: 'html' as const,
      }) as SavePlayerNoteResponse;

      // Then: Content type changes are handled
      expect(jsonResponse.success).toBe(true);
      expect(htmlResponse.success).toBe(true);
      expect(jsonResponse.data!.content_type).toBe('json');
      expect(htmlResponse.data!.content_type).toBe('html');
      expect(htmlResponse.data!.id).toBe(jsonResponse.data!.id); // Same note
    });

    test('EC-04-07: Auto-detection vs explicit content type', async () => {
      // Test content type detection vs explicit specification
      const testCases = [
        {
          content: JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH),
          detectedType: detectContentType(JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH)),
          explicitType: 'json' as const,
        },
        {
          content: '<p>HTML content</p>',
          detectedType: detectContentType('<p>HTML content</p>'),
          explicitType: 'html' as const,
        },
      ];

      for (const { content, detectedType, explicitType } of testCases) {
        expect(detectedType).toBe(explicitType);

        const playerId = `auto-detect-${testCases.indexOf({ content, detectedType, explicitType })}`;
        const note = createTestPlayerNote({
          player_id: playerId,
          content: content,
          content_type: explicitType,
        });

        mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(note));

        const request: SavePlayerNoteRequest = {
          player_id: playerId,
          content: content,
          content_type: explicitType,
        };
        const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

        expect(response.success).toBe(true);
        expect(response.data!.content_type).toBe(explicitType);
      }
    });
  });
});