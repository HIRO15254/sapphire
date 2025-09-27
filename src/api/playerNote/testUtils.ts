// Test utilities for Player Note API
// Created for TASK-0511: リッチテキストメモAPI実装

import { vi } from 'vitest';
import {
  GetPlayerNoteRequest,
  SavePlayerNoteRequest,
  GetPlayerNoteResponse,
  SavePlayerNoteResponse,
  PlayerNote,
  ContentType,
  TipTapDocument,
  NoteError,
  NOTE_ERROR_CODES,
  generateMockPlayerNote,
  generateMockTipTapJSON,
  generateComplexMockTipTapJSON,
  generateMockHTML,
  generateLargeContent,
  PerformanceTracker,
  startPerformanceTracking,
  endPerformanceTracking,
} from '../../types/playerNote';

// Mock Tauri invoke function
export const mockTauriInvoke = vi.fn();

// Setup Tauri mock
export function setupTauriMock() {
  vi.mock('@tauri-apps/api/core', () => ({
    invoke: mockTauriInvoke,
  }));
  (globalThis as never).__TAURI_INVOKE__ = mockTauriInvoke;
}

// Reset all mocks
export function resetMocks() {
  mockTauriInvoke.mockReset();
}

// Test data generators
export function createTestPlayerNote(overrides: Partial<PlayerNote> = {}): PlayerNote {
  return generateMockPlayerNote({
    id: 'test-note-1',
    player_id: 'test-player-1',
    content: generateMockTipTapJSON('Test note content'),
    content_type: 'json',
    content_hash: 'test-hash-123',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z',
    ...overrides,
  });
}

export function createTestPlayerNotes(count: number = 3): PlayerNote[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `test-note-${index + 1}`,
    player_id: `test-player-${index + 1}`,
    content: generateMockTipTapJSON(`Test note content ${index + 1}`),
    content_type: 'json' as ContentType,
    content_hash: `test-hash-${index + 1}`,
    created_at: new Date(2025, 0, index + 1).toISOString(),
    updated_at: new Date(2025, 0, index + 10).toISOString(),
  }));
}

export function createJapanesePlayerNotes(): PlayerNote[] {
  return [
    {
      id: 'jp-note-1',
      player_id: 'jp-player-1',
      content: generateMockTipTapJSON('田中太郎は積極的なプレイヤーです'),
      content_type: 'json',
      content_hash: 'jp-hash-1',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-10T00:00:00.000Z',
    },
    {
      id: 'jp-note-2',
      player_id: 'jp-player-2',
      content: generateMockHTML('田中花子は保守的なプレイヤーです'),
      content_type: 'html',
      content_hash: 'jp-hash-2',
      created_at: '2025-01-02T00:00:00.000Z',
      updated_at: '2025-01-11T00:00:00.000Z',
    },
  ];
}

export function createHTMLPlayerNotes(): PlayerNote[] {
  return [
    {
      id: 'html-note-1',
      player_id: 'html-player-1',
      content: '<p><strong>Aggressive player</strong> - watch for <em>bluffs</em></p>',
      content_type: 'html',
      content_hash: 'html-hash-1',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-10T00:00:00.000Z',
    },
    {
      id: 'html-note-2',
      player_id: 'html-player-2',
      content: '<p>Conservative player with good <a href="https://example.com">reference</a></p>',
      content_type: 'html',
      content_hash: 'html-hash-2',
      created_at: '2025-01-02T00:00:00.000Z',
      updated_at: '2025-01-11T00:00:00.000Z',
    },
  ];
}

export function createComplexTipTapNotes(): PlayerNote[] {
  return [
    {
      id: 'complex-note-1',
      player_id: 'complex-player-1',
      content: generateComplexMockTipTapJSON(),
      content_type: 'json',
      content_hash: 'complex-hash-1',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-10T00:00:00.000Z',
    },
  ];
}

export function createLargeContentNotes(): PlayerNote[] {
  return [
    {
      id: 'large-note-1',
      player_id: 'large-player-1',
      content: generateLargeContent(1), // 1MB
      content_type: 'html',
      content_hash: 'large-hash-1',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-10T00:00:00.000Z',
    },
    {
      id: 'large-note-2',
      player_id: 'large-player-2',
      content: generateLargeContent(5), // 5MB
      content_type: 'html',
      content_hash: 'large-hash-2',
      created_at: '2025-01-02T00:00:00.000Z',
      updated_at: '2025-01-11T00:00:00.000Z',
    },
  ];
}

// Security test data generators
export function createXSSAttackContent(): { description: string; content: string }[] {
  return [
    {
      description: 'Basic script tag',
      content: '<script>alert("xss")</script><p>Normal content</p>',
    },
    {
      description: 'Event handler onclick',
      content: '<p onclick="alert(\'xss\')">Click me</p>',
    },
    {
      description: 'Event handler onload',
      content: '<img onload="alert(\'xss\')" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">',
    },
    {
      description: 'JavaScript URL',
      content: '<a href="javascript:alert(\'xss\')">Click me</a>',
    },
    {
      description: 'Data URL attack',
      content: '<iframe src="data:text/html,<script>alert(\'xss\')</script>"></iframe>',
    },
    {
      description: 'CSS expression attack',
      content: '<div style="expression(alert(\'xss\'))">Content</div>',
    },
    {
      description: 'HTML entity encoded script',
      content: '&#60;script&#62;alert(&#39;xss&#39;)&#60;/script&#62;',
    },
    {
      description: 'SVG script injection',
      content: '<svg onload="alert(\'xss\')"><circle r="10"></circle></svg>',
    },
    {
      description: 'Meta refresh redirect',
      content: '<meta http-equiv="refresh" content="0;url=javascript:alert(\'xss\')">',
    },
    {
      description: 'Form action javascript',
      content: '<form action="javascript:alert(\'xss\')"><input type="submit" value="Submit"></form>',
    },
  ];
}

export function createSQLInjectionContent(): { description: string; playerId: string }[] {
  return [
    {
      description: 'Basic SQL injection',
      playerId: "'; DROP TABLE player_notes; --",
    },
    {
      description: 'Union-based injection',
      playerId: "' UNION SELECT * FROM users --",
    },
    {
      description: 'Boolean-based injection',
      playerId: "' OR 1=1 --",
    },
    {
      description: 'Time-based injection',
      playerId: "'; WAITFOR DELAY '00:00:10' --",
    },
    {
      description: 'Comment injection',
      playerId: 'admin/**/OR/**/1=1',
    },
  ];
}

export function createSpecialCharacterContent(): { description: string; content: string }[] {
  return [
    {
      description: 'Unicode emojis',
      content: '🎯📝✨ Player analysis with emojis 🃏♠️♥️♦️♣️',
    },
    {
      description: 'Japanese characters',
      content: 'プレイヤー分析：田中太郎さんは保守的なプレイスタイル',
    },
    {
      description: 'Chinese characters',
      content: '玩家分析：这个玩家很保守，很少虚张声势',
    },
    {
      description: 'Korean characters',
      content: '플레이어 분석: 이 플레이어는 보수적이고 블러핑을 거의 하지 않습니다',
    },
    {
      description: 'Mixed multibyte characters',
      content: '🎯 Player: 田中太郎 (中国名: 田中) 🎯 Style: 保守的',
    },
    {
      description: 'HTML entities',
      content: '&lt;p&gt;Escaped &amp; formatted &quot;content&quot; with &#39;quotes&#39;&lt;/p&gt;',
    },
    {
      description: 'Control characters',
      content: 'Line1\nLine2\tTabbed\rCarriage\0Null',
    },
    {
      description: 'Special symbols',
      content: '¡¿»«¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ',
    },
  ];
}

// Mock response generators
export function createSuccessfulGetResponse(note?: PlayerNote): GetPlayerNoteResponse {
  return {
    success: true,
    data: note || createTestPlayerNote(),
  };
}

export function createEmptyGetResponse(): GetPlayerNoteResponse {
  return {
    success: true,
    data: undefined, // No note found
  };
}

export function createSuccessfulSaveResponse(note?: PlayerNote): SavePlayerNoteResponse {
  return {
    success: true,
    data: note || createTestPlayerNote(),
  };
}

export function createErrorResponse(
  code: keyof typeof NOTE_ERROR_CODES,
  message: string,
  details?: NoteError['details']
): GetPlayerNoteResponse | SavePlayerNoteResponse {
  return {
    success: false,
    error: {
      code: NOTE_ERROR_CODES[code],
      message,
      details,
    },
  };
}

// Performance testing utilities
export class PerformanceTestHelper {
  private trackers: Map<string, PerformanceTracker> = new Map();

  start(testName: string): void {
    this.trackers.set(testName, startPerformanceTracking());
  }

  end(testName: string): number {
    const tracker = this.trackers.get(testName);
    if (!tracker) {
      throw new Error(`No performance tracker found for test: ${testName}`);
    }
    const duration = endPerformanceTracking(tracker);
    this.trackers.delete(testName);
    return duration;
  }

  expectResponseTime(testName: string, maxMs: number): boolean {
    const tracker = this.trackers.get(testName);
    if (!tracker || !tracker.duration) {
      throw new Error(`No completed performance tracker found for test: ${testName}`);
    }
    return tracker.duration <= maxMs;
  }
}

// Database state helpers
export function createCleanDatabaseState(): void {
  // Mock function to simulate clean database state
  // In real implementation, this would clear test data
}

export function createDatabaseWithExistingNotes(notes: PlayerNote[]): void {
  // Mock function to simulate database with existing notes
  // In real implementation, this would seed test data
}

export function simulateDatabaseError(
  errorType: 'connection' | 'timeout' | 'disk_full' | 'permission',
  mockFunction?: any
): void {
  const errorMessages = {
    connection: 'Database connection failed',
    timeout: 'Query timeout exceeded',
    disk_full: 'Disk space insufficient',
    permission: 'Permission denied',
  };

  // Our backend returns success responses with error field instead of rejecting
  const errorResponse = createErrorResponse('DATABASE_ERROR', errorMessages[errorType]);

  // Use the provided mock function or fallback to mockTauriInvoke
  if (mockFunction && typeof mockFunction.mockResolvedValueOnce === 'function') {
    mockFunction.mockResolvedValueOnce(errorResponse);
  } else {
    mockTauriInvoke.mockResolvedValueOnce(errorResponse);
  }
}

// Validation test helpers
export function expectValidPlayerNote(note: PlayerNote): void {
  expect(note).toHaveProperty('id');
  expect(note).toHaveProperty('player_id');
  expect(note).toHaveProperty('content');
  expect(note).toHaveProperty('content_type');
  expect(note).toHaveProperty('content_hash');
  expect(note).toHaveProperty('created_at');
  expect(note).toHaveProperty('updated_at');

  expect(typeof note.id).toBe('string');
  expect(typeof note.player_id).toBe('string');
  expect(typeof note.content).toBe('string');
  expect(['json', 'html']).toContain(note.content_type);
  expect(typeof note.content_hash).toBe('string');
  expect(typeof note.created_at).toBe('string');
  expect(typeof note.updated_at).toBe('string');

  // Validate ISO 8601 date format
  expect(new Date(note.created_at).toISOString()).toBe(note.created_at);
  expect(new Date(note.updated_at).toISOString()).toBe(note.updated_at);
}

export function expectValidGetResponse(response: GetPlayerNoteResponse): void {
  expect(response).toHaveProperty('success');
  expect(typeof response.success).toBe('boolean');

  if (response.success) {
    if (response.data) {
      expectValidPlayerNote(response.data);
    }
  } else {
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');
    expect(typeof response.error!.code).toBe('string');
    expect(typeof response.error!.message).toBe('string');
  }
}

export function expectValidSaveResponse(response: SavePlayerNoteResponse): void {
  expectValidGetResponse(response); // Same validation structure
}

// Content type detection helpers
export function createTipTapJSONSamples(): { description: string; content: string; expectedType: ContentType }[] {
  return [
    {
      description: 'Basic TipTap JSON',
      content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Test"}]}]}',
      expectedType: 'json',
    },
    {
      description: 'Empty TipTap document',
      content: '{"type":"doc","content":[]}',
      expectedType: 'json',
    },
    {
      description: 'Complex TipTap with marks',
      content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Bold","marks":[{"type":"bold"}]}]}]}',
      expectedType: 'json',
    },
    {
      description: 'TipTap with whitespace',
      content: '  \n  {"type":"doc","content":[]}  \n  ',
      expectedType: 'json',
    },
    {
      description: 'Plain text',
      content: 'Just plain text content',
      expectedType: 'html',
    },
    {
      description: 'HTML content',
      content: '<p>HTML <strong>content</strong></p>',
      expectedType: 'html',
    },
    {
      description: 'Invalid JSON',
      content: '{"type":"doc","content":}',
      expectedType: 'html',
    },
    {
      description: 'JSON without doc type',
      content: '{"type":"paragraph","content":[]}',
      expectedType: 'html',
    },
  ];
}

// Concurrent testing helpers
export function createConcurrentRequests(
  count: number,
  requestFactory: () => GetPlayerNoteRequest | SavePlayerNoteRequest
): (GetPlayerNoteRequest | SavePlayerNoteRequest)[] {
  return Array.from({ length: count }, () => requestFactory());
}

export async function executeConcurrentTests<T>(
  promises: Promise<T>[],
  maxConcurrency: number = 5
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < promises.length; i += maxConcurrency) {
    const batch = promises.slice(i, i + maxConcurrency);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  return results;
}

// Memory monitoring helpers (mock implementations)
export function getMemoryUsage(): number {
  // Mock implementation
  return Math.random() * 100; // Random value between 0-100MB
}

export function expectMemoryUsage(actualMB: number, maxMB: number): boolean {
  return actualMB <= maxMB;
}

export function monitorMemoryDuringTest<T>(testFunction: () => Promise<T>): Promise<{ result: T; memoryUsage: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      const initialMemory = getMemoryUsage();
      const result = await testFunction();
      const finalMemory = getMemoryUsage();
      const memoryUsage = Math.max(finalMemory - initialMemory, 0);

      resolve({ result, memoryUsage });
    } catch (error) {
      reject(error);
    }
  });
}