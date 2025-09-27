// Rich Text Processing tests for Player Note API
// TASK-0511: リッチテキストメモAPI実装 - Red Phase

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  SavePlayerNoteRequest,
  SavePlayerNoteResponse,
  isValidTipTapJSON,
  isValidTipTapDocument,
  isValidTipTapNode,
  isValidTipTapMark,
  sanitizeHTML,
  detectContentType,
} from '../../types/playerNote';
import {
  setupTauriMock,
  resetMocks,
  mockTauriInvoke,
  createTestPlayerNote,
  createSuccessfulSaveResponse,
  expectValidSaveResponse,
  createTipTapJSONSamples,
  createSpecialCharacterContent,
} from './testUtils';
import {
  SAMPLE_TIPTAP_DOCUMENTS,
  SAMPLE_HTML_CONTENT,
  XSS_ATTACK_PATTERNS,
  SPECIAL_CHARACTER_TESTS,
} from './mockData';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('Rich Text Processing Tests', () => {
  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockClear();
  });

  describe('TipTap JSON Validation and Processing', () => {
    test('should validate basic TipTap document structure', () => {
      // Given: Basic TipTap document
      const basicDoc = SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH;

      // When: Validating structure
      const isValid = isValidTipTapDocument(basicDoc);

      // Then: Should be valid
      expect(isValid).toBe(true);
      expect(basicDoc.type).toBe('doc');
      expect(Array.isArray(basicDoc.content)).toBe(true);
    });

    test('should validate complex nested TipTap structures', () => {
      // Given: Complex nested structure
      const complexDoc = SAMPLE_TIPTAP_DOCUMENTS.NESTED_LISTS;

      // When: Validating structure
      const isValid = isValidTipTapDocument(complexDoc);

      // Then: Should be valid
      expect(isValid).toBe(true);
      expect(complexDoc.content![0].type).toBe('ordered_list');
      expect(complexDoc.content![0].content![0].type).toBe('list_item');
    });

    test('should validate TipTap nodes with marks', () => {
      // Given: Node with marks
      const nodeWithMarks = {
        type: 'text',
        text: 'Bold text',
        marks: [{ type: 'bold' }],
      };

      // When: Validating node
      const isValid = isValidTipTapNode(nodeWithMarks);

      // Then: Should be valid
      expect(isValid).toBe(true);
    });

    test('should validate TipTap marks with attributes', () => {
      // Given: Mark with attributes
      const markWithAttrs = {
        type: 'link',
        attrs: {
          href: 'https://example.com',
          target: '_blank',
        },
      };

      // When: Validating mark
      const isValid = isValidTipTapMark(markWithAttrs);

      // Then: Should be valid
      expect(isValid).toBe(true);
    });

    test('should reject invalid TipTap document structures', () => {
      const invalidCases = [
        { type: 'paragraph' }, // Not 'doc'
        { type: 'doc', content: 'not-array' }, // Content not array
        { content: [] }, // Missing type
        null,
        undefined,
        'string',
        123,
      ];

      invalidCases.forEach((invalidCase) => {
        expect(isValidTipTapDocument(invalidCase)).toBe(false);
      });
    });

    test('should handle JSON parsing and validation', () => {
      // Given: Various JSON strings
      const testCases = createTipTapJSONSamples();

      testCases.forEach(({ description, content, expectedType }) => {
        // When: Parsing and validating
        const detectedType = detectContentType(content);

        // Then: Should match expected type
        expect(detectedType).toBe(expectedType);

        if (expectedType === 'json') {
          expect(isValidTipTapJSON(content)).toBe(true);
        }
      });
    });

    test('should preserve complex TipTap structure through save/load', async () => {
      // Given: Complex TipTap document
      const complexDoc = SAMPLE_TIPTAP_DOCUMENTS.COMPLEX_STRUCTURE;
      const complexDocString = JSON.stringify(complexDoc);
      const playerId = 'complex-structure-player';

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: complexDocString,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: Saving complex structure
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: complexDocString,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: Structure should be preserved
      expect(response.success).toBe(true);
      const parsedBack = JSON.parse(response.data!.content);
      expect(parsedBack.type).toBe('doc');
      expect(parsedBack.content[0].type).toBe('heading');
      expect(parsedBack.content[0].attrs.level).toBe(1);
      expect(parsedBack.content[2].type).toBe('bullet_list');
      expect(parsedBack.content[3].type).toBe('blockquote');
    });

    test('should handle empty TipTap documents', async () => {
      // Given: Empty TipTap document
      const emptyDoc = SAMPLE_TIPTAP_DOCUMENTS.EMPTY_DOCUMENT;
      const emptyDocString = JSON.stringify(emptyDoc);
      const playerId = 'empty-doc-player';

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: emptyDocString,
        content_type: 'json',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: Saving empty document
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: emptyDocString,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: Should be handled correctly
      expect(response.success).toBe(true);
      const parsedBack = JSON.parse(response.data!.content);
      expect(parsedBack.type).toBe('doc');
      expect(parsedBack.content).toEqual([]);
    });
  });

  describe('HTML Processing and Sanitization', () => {
    test('should preserve safe HTML content', async () => {
      // Given: Safe HTML content
      const safeHTML = SAMPLE_HTML_CONTENT.MIXED_CONTENT;
      const playerId = 'safe-html-player';

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: safeHTML,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: Saving safe HTML
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: safeHTML,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: Safe tags should be preserved
      expect(response.success).toBe(true);
      expect(response.data!.content).toContain('<h1>');
      expect(response.data!.content).toContain('<p>');
      expect(response.data!.content).toContain('<strong>');
      expect(response.data!.content).toContain('<em>');
      expect(response.data!.content).toContain('<ul>');
      expect(response.data!.content).toContain('<li>');
      expect(response.data!.content).toContain('<blockquote>');
    });

    test('should remove XSS attack vectors', async () => {
      // Given: Various XSS attack patterns
      for (const xssPattern of XSS_ATTACK_PATTERNS.slice(0, 10)) { // Test first 10 patterns
        const playerId = `xss-test-${XSS_ATTACK_PATTERNS.indexOf(xssPattern)}`;
        const sanitizedContent = sanitizeHTML(xssPattern);

        const savedNote = createTestPlayerNote({
          player_id: playerId,
          content: sanitizedContent,
          content_type: 'html',
        });

        mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

        // When: Saving potentially malicious content
        const request: SavePlayerNoteRequest = {
          player_id: playerId,
          content: xssPattern,
          content_type: 'html',
        };
        const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

        // Then: XSS should be removed
        expect(response.success).toBe(true);
        expect(response.data!.content).not.toContain('<script>');
        expect(response.data!.content).not.toContain('javascript:');
        expect(response.data!.content).not.toContain('onerror=');
        expect(response.data!.content).not.toContain('onload=');
        expect(response.data!.content).not.toContain('onclick=');
      }
    });

    test('should handle special characters and Unicode', async () => {
      // Given: Content with special characters
      for (const testCase of SPECIAL_CHARACTER_TESTS) {
        const playerId = `unicode-test-${SPECIAL_CHARACTER_TESTS.indexOf(testCase)}`;

        const savedNote = createTestPlayerNote({
          player_id: playerId,
          content: testCase.content,
          content_type: 'html',
        });

        mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

        // When: Saving content with special characters
        const request: SavePlayerNoteRequest = {
          player_id: playerId,
          content: testCase.content,
          content_type: 'html',
        };
        const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

        // Then: Special characters should be preserved
        expect(response.success).toBe(true);
        expect(response.data!.content).toBeDefined();
        // Content should maintain encoding integrity
        expect(Buffer.byteLength(response.data!.content, 'utf8')).toBeGreaterThan(0);
      }
    });

    test('should handle HTML entities correctly', async () => {
      // Given: Content with HTML entities
      const htmlWithEntities = '&lt;p&gt;&amp;nbsp;Player &quot;Hero&quot; &#39;analysis&#39;&lt;/p&gt;';
      const playerId = 'entities-player';

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: htmlWithEntities,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: Saving content with entities
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: htmlWithEntities,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: Entities should be handled appropriately
      expect(response.success).toBe(true);
      expect(response.data!.content).toBeDefined();
    });

    test('should remove dangerous attributes from safe tags', async () => {
      // Given: Safe tags with dangerous attributes
      const dangerousAttrsHTML = `
        <p onclick="alert('xss')">Paragraph with onclick</p>
        <a href="javascript:alert('xss')" onmouseover="evil()">Link</a>
        <img src="valid.jpg" onerror="alert('xss')" alt="Image">
        <div style="expression(alert('xss'))">Div with CSS expression</div>
      `;

      const playerId = 'dangerous-attrs-player';
      const sanitizedContent = sanitizeHTML(dangerousAttrsHTML);

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: sanitizedContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: Saving content with dangerous attributes
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: dangerousAttrsHTML,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: Dangerous attributes should be removed
      expect(response.success).toBe(true);
      expect(response.data!.content).not.toContain('onclick=');
      expect(response.data!.content).not.toContain('javascript:');
      expect(response.data!.content).not.toContain('onerror=');
      expect(response.data!.content).not.toContain('onmouseover=');
      expect(response.data!.content).not.toContain('expression(');
    });

    test('should preserve allowed attributes on safe tags', async () => {
      // Given: Safe tags with allowed attributes
      const safeAttrsHTML = `
        <a href="https://example.com" title="Example Site">Safe Link</a>
        <img src="image.jpg" alt="Description" title="Image Title">
        <p title="Paragraph title">Paragraph with title</p>
      `;

      const playerId = 'safe-attrs-player';

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: safeAttrsHTML,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: Saving content with safe attributes
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: safeAttrsHTML,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;

      // Then: Safe attributes should be preserved
      expect(response.success).toBe(true);
      expect(response.data!.content).toContain('href="https://example.com"');
      expect(response.data!.content).toContain('title="Example Site"');
      expect(response.data!.content).toContain('alt="Description"');
    });
  });

  describe('Content Type Detection and Processing', () => {
    test('should correctly detect TipTap JSON format', () => {
      // Given: Various TipTap JSON formats
      const testCases = [
        JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH),
        JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.EMPTY_DOCUMENT),
        JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.COMPLEX_STRUCTURE),
        '  \n  ' + JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.FORMATTED_TEXT) + '  \n  ',
      ];

      testCases.forEach((content) => {
        // When: Detecting content type
        const detectedType = detectContentType(content);

        // Then: Should be detected as JSON
        expect(detectedType).toBe('json');
        expect(isValidTipTapJSON(content)).toBe(true);
      });
    });

    test('should correctly detect HTML format', () => {
      // Given: Various HTML formats
      const testCases = [
        '<p>Simple paragraph</p>',
        SAMPLE_HTML_CONTENT.FORMATTED,
        SAMPLE_HTML_CONTENT.MIXED_CONTENT,
        '<div><span>Nested elements</span></div>',
        'Plain text without any markup',
      ];

      testCases.forEach((content) => {
        // When: Detecting content type
        const detectedType = detectContentType(content);

        // Then: Should be detected as HTML
        expect(detectedType).toBe('html');
      });
    });

    test('should handle edge cases in content type detection', () => {
      // Given: Edge cases
      const edgeCases = [
        { content: '', expected: 'html' },
        { content: '   ', expected: 'html' },
        { content: '\n\t\r', expected: 'html' },
        { content: '{"invalid":"json"}', expected: 'html' },
        { content: '{"type":"not-doc"}', expected: 'html' },
        { content: 'starts with { but not json', expected: 'html' },
      ];

      edgeCases.forEach(({ content, expected }) => {
        // When: Detecting content type
        const detectedType = detectContentType(content);

        // Then: Should match expected type
        expect(detectedType).toBe(expected);
      });
    });

    test('should handle malformed JSON gracefully', () => {
      // Given: Malformed JSON strings
      const malformedJSON = [
        '{"type":"doc","content":}', // Missing array
        '{"type":"doc",}', // Trailing comma
        '{type:"doc","content":[]}', // Unquoted key
        '{"type":"doc""content":[]}', // Missing comma
        '{"type":"doc","content":[}', // Unclosed array
      ];

      malformedJSON.forEach((content) => {
        // When: Detecting content type and validating
        const detectedType = detectContentType(content);
        const isValidJSON = isValidTipTapJSON(content);

        // Then: Should fall back to HTML and be invalid JSON
        expect(detectedType).toBe('html');
        expect(isValidJSON).toBe(false);
      });
    });
  });
});