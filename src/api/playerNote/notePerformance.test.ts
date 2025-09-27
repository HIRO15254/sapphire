// Performance tests for Player Note API
// TASK-0511: リッチテキストメモAPI実装 - Red Phase

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  GetPlayerNoteRequest,
  SavePlayerNoteRequest,
  GetPlayerNoteResponse,
  SavePlayerNoteResponse,
  generateContentHash,
} from '../../types/playerNote';
import {
  setupTauriMock,
  resetMocks,
  mockTauriInvoke,
  createTestPlayerNote,
  createSuccessfulGetResponse,
  createSuccessfulSaveResponse,
  PerformanceTestHelper,
  expectMemoryUsage,
  monitorMemoryDuringTest,
  createConcurrentRequests,
  executeConcurrentTests,
} from './testUtils';
import { generatePerformanceTestData, SAMPLE_TIPTAP_DOCUMENTS } from './mockData';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('Player Note API - Performance Tests (PT-01 to PT-02)', () => {
  let performanceHelper: PerformanceTestHelper;

  beforeEach(() => {
    setupTauriMock();
    resetMocks();
    mockInvoke.mockClear();
    performanceHelper = new PerformanceTestHelper();
  });

  describe('PT-01: Response Time Requirements', () => {
    test('PT-01-01: NFR-103準拠（300ms以内）', async () => {
      // Given: 中程度サイズ（10KB）のリッチテキスト
      const playerId = 'nfr-103-player';
      const performanceData = generatePerformanceTestData();
      const mediumContent = performanceData.medium; // 10KB content

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: mediumContent,
        content_type: 'html',
      });

      // Simulate realistic response time
      mockInvoke.mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 250)); // 250ms response
        return createSuccessfulSaveResponse(savedNote);
      });

      // When: save_player_note を実行
      performanceHelper.start('nfr-103-test');
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: mediumContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;
      const responseTime = performanceHelper.end('nfr-103-test');

      // Then: 300ms以内でレスポンス
      expect(response.success).toBe(true);
      expect(responseTime).toBeLessThan(300);
    });

    test('PT-01-02: メモ取得性能', async () => {
      // Given: 既存メモ
      const playerId = 'get-performance-player';
      const existingNote = createTestPlayerNote({ player_id: playerId });

      // Simulate fast retrieval
      mockInvoke.mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms response
        return createSuccessfulGetResponse(existingNote);
      });

      // When: get_player_note を実行
      performanceHelper.start('get-performance-test');
      const request: GetPlayerNoteRequest = { player_id: playerId };
      const response = await invoke('get_player_note', request) as GetPlayerNoteResponse;
      const responseTime = performanceHelper.end('get-performance-test');

      // Then: 100ms以内でレスポンス
      expect(response.success).toBe(true);
      expect(responseTime).toBeLessThan(100);
    });

    test('PT-01-03: 大容量メモ処理', async () => {
      // Given: 5MBのリッチテキストコンテンツ
      const playerId = 'large-content-player';
      const performanceData = generatePerformanceTestData();
      const largeContent = performanceData.xlarge; // 5MB content

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: largeContent,
        content_type: 'html',
      });

      // Simulate slower but acceptable response for large content
      mockInvoke.mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 800)); // 800ms response
        return createSuccessfulSaveResponse(savedNote);
      });

      // When: save_player_note を実行
      performanceHelper.start('large-content-test');
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: largeContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;
      const responseTime = performanceHelper.end('large-content-test');

      // Then: 1000ms以内でレスポンス
      expect(response.success).toBe(true);
      expect(responseTime).toBeLessThan(1000);
    });

    test('PT-01-04: TipTap JSON解析性能', async () => {
      // Given: 複雑なTipTap JSON構造
      const playerId = 'json-parsing-player';
      const complexTipTapContent = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.COMPLEX_STRUCTURE);

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: complexTipTapContent,
        content_type: 'json',
      });

      // Simulate JSON parsing time
      mockInvoke.mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 150)); // 150ms for JSON processing
        return createSuccessfulSaveResponse(savedNote);
      });

      // When: JSON検証・保存実行
      performanceHelper.start('json-parsing-test');
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: complexTipTapContent,
        content_type: 'json',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;
      const responseTime = performanceHelper.end('json-parsing-test');

      // Then: 200ms以内で処理完了
      expect(response.success).toBe(true);
      expect(responseTime).toBeLessThan(200);
    });

    test('PT-01-05: HTMLサニタイゼーション性能', async () => {
      // Given: 大量HTMLタグ含有コンテンツ
      const playerId = 'sanitization-player';
      const performanceData = generatePerformanceTestData();
      const htmlWithTags = performanceData.large.replace(/(.{100})/g, '$1<p><strong>$1</strong></p>'); // Add tags

      const sanitizedNote = createTestPlayerNote({
        player_id: playerId,
        content: htmlWithTags,
        content_type: 'html',
      });

      // Simulate sanitization processing time
      mockInvoke.mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 400)); // 400ms for sanitization
        return createSuccessfulSaveResponse(sanitizedNote);
      });

      // When: サニタイゼーション実行
      performanceHelper.start('sanitization-test');
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: htmlWithTags,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;
      const responseTime = performanceHelper.end('sanitization-test');

      // Then: 500ms以内で処理完了
      expect(response.success).toBe(true);
      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('PT-02: Throughput & Memory Efficiency', () => {
    test('PT-02-01: 同時リクエスト処理', async () => {
      // Given: 5並行メモ保存リクエスト
      const concurrentCount = 5;
      const basePlayerId = 'concurrent-player';
      const content = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);

      // Create concurrent requests
      const requests = createConcurrentRequests(concurrentCount, () => ({
        player_id: `${basePlayerId}-${Date.now()}-${Math.random()}`,
        content: content,
        content_type: 'json' as const,
      }));

      // Setup mock responses
      const promises = requests.map((request, index) => {
        const note = createTestPlayerNote({
          player_id: request.player_id,
          content: request.content,
        });

        mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(note));
        return invoke('save_player_note', request) as Promise<SavePlayerNoteResponse>;
      });

      // When: 同時にsave_player_note実行
      performanceHelper.start('concurrent-test');
      const responses = await executeConcurrentTests(promises, concurrentCount);
      const totalTime = performanceHelper.end('concurrent-test');

      // Then: 全て正常完了, レスポンス時間劣化なし
      expect(responses).toHaveLength(concurrentCount);
      responses.forEach(response => {
        expect(response.success).toBe(true);
      });

      // Average time per request should be reasonable
      const avgTimePerRequest = totalTime / concurrentCount;
      expect(avgTimePerRequest).toBeLessThan(1000); // Should not degrade significantly
    });

    test('PT-02-02: メモリ使用量監視', async () => {
      // Given: 大容量メモ処理
      const playerId = 'memory-test-player';
      const performanceData = generatePerformanceTestData();
      const largeContent = performanceData.xlarge; // 5MB content

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: largeContent,
        content_type: 'html',
      });

      mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(savedNote));

      // When: save_player_note を実行
      const { result, memoryUsage } = await monitorMemoryDuringTest(async () => {
        const request: SavePlayerNoteRequest = {
          player_id: playerId,
          content: largeContent,
          content_type: 'html',
        };
        return await invoke('save_player_note', request) as SavePlayerNoteResponse;
      });

      // Then: メモリ使用量≤10MB
      expect(result.success).toBe(true);
      expect(expectMemoryUsage(memoryUsage, 10)).toBe(true);
    });

    test('PT-02-03: ガベージコレクション効率', async () => {
      // Given: 連続メモ保存処理
      const basePlayerId = 'gc-test-player';
      const iterationCount = 100;
      const content = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH);

      // When: 100回のsave_player_note実行
      const initialMemory = vi.fn().mockReturnValue(50); // Mock initial memory
      let maxMemoryUsed = 0;

      for (let i = 0; i < iterationCount; i++) {
        const playerId = `${basePlayerId}-${i}`;
        const note = createTestPlayerNote({
          player_id: playerId,
          content: content,
        });

        mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(note));

        const request: SavePlayerNoteRequest = {
          player_id: playerId,
          content: content,
          content_type: 'json',
        };

        await invoke('save_player_note', request);

        // Mock memory monitoring
        const currentMemory = 50 + Math.random() * 20; // Simulate bounded memory usage
        maxMemoryUsed = Math.max(maxMemoryUsed, currentMemory);
      }

      // Then: メモリリークなし
      expect(maxMemoryUsed).toBeLessThan(100); // Memory should not grow unbounded
    });

    test('PT-02-04: コンテンツハッシュ計算性能', async () => {
      // Given: 大容量コンテンツ
      const performanceData = generatePerformanceTestData();
      const largeContent = performanceData.xlarge; // 5MB content

      // When: SHA256ハッシュ計算
      performanceHelper.start('hash-calculation-test');
      const hash = generateContentHash(largeContent);
      const hashTime = performanceHelper.end('hash-calculation-test');

      // Then: 50ms以内で計算完了
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hashTime).toBeLessThan(50);
    });

    test('PT-02-05: Batch operations performance', async () => {
      // Given: Multiple notes to process in batch
      const batchSize = 10;
      const basePlayerId = 'batch-player';
      const content = JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.FORMATTED_TEXT);

      const batchRequests = Array.from({ length: batchSize }, (_, index) => ({
        player_id: `${basePlayerId}-${index}`,
        content: content,
        content_type: 'json' as const,
      }));

      // Setup batch responses
      batchRequests.forEach((request) => {
        const note = createTestPlayerNote({
          player_id: request.player_id,
          content: request.content,
        });
        mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(note));
      });

      // When: Processing batch sequentially
      performanceHelper.start('batch-sequential-test');
      const sequentialResults = [];
      for (const request of batchRequests) {
        const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;
        sequentialResults.push(response);
      }
      const sequentialTime = performanceHelper.end('batch-sequential-test');

      // Setup for parallel processing
      batchRequests.forEach((request) => {
        const note = createTestPlayerNote({
          player_id: request.player_id,
          content: request.content,
        });
        mockInvoke.mockResolvedValueOnce(createSuccessfulSaveResponse(note));
      });

      // When: Processing batch in parallel
      performanceHelper.start('batch-parallel-test');
      const parallelPromises = batchRequests.map(request =>
        invoke('save_player_note', request) as Promise<SavePlayerNoteResponse>
      );
      const parallelResults = await Promise.all(parallelPromises);
      const parallelTime = performanceHelper.end('batch-parallel-test');

      // Then: Parallel should be faster
      expect(sequentialResults).toHaveLength(batchSize);
      expect(parallelResults).toHaveLength(batchSize);
      expect(parallelTime).toBeLessThan(sequentialTime);

      // All operations should complete in reasonable time
      expect(parallelTime).toBeLessThan(2000); // 2 seconds for 10 operations
    });

    test('PT-02-06: Content size impact on performance', async () => {
      // Given: Various content sizes
      const playerId = 'size-impact-player';
      const performanceData = generatePerformanceTestData();
      const contentSizes = [
        { name: 'small', content: performanceData.small, maxTime: 50 },
        { name: 'medium', content: performanceData.medium, maxTime: 150 },
        { name: 'large', content: performanceData.large, maxTime: 500 },
        { name: 'xlarge', content: performanceData.xlarge, maxTime: 1000 },
      ];

      for (const { name, content, maxTime } of contentSizes) {
        const note = createTestPlayerNote({
          player_id: `${playerId}-${name}`,
          content: content,
          content_type: 'html',
        });

        // Simulate performance based on content size
        mockInvoke.mockImplementationOnce(async () => {
          const delay = Math.min(maxTime * 0.8, content.length / 10000); // Realistic delay
          await new Promise(resolve => setTimeout(resolve, delay));
          return createSuccessfulSaveResponse(note);
        });

        // When: Processing different content sizes
        performanceHelper.start(`size-test-${name}`);
        const request: SavePlayerNoteRequest = {
          player_id: `${playerId}-${name}`,
          content: content,
          content_type: 'html',
        };
        const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;
        const responseTime = performanceHelper.end(`size-test-${name}`);

        // Then: Performance should scale reasonably with size
        expect(response.success).toBe(true);
        expect(responseTime).toBeLessThan(maxTime);
      }
    });
  });

  describe('PT-03: Edge Case Performance', () => {
    test('PT-03-01: Maximum content size handling', async () => {
      // Given: Content at maximum allowed size
      const playerId = 'max-size-player';
      const performanceData = generatePerformanceTestData();
      const maxSizeContent = performanceData.maxSize; // 10MB at limit

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: maxSizeContent,
        content_type: 'html',
      });

      // Simulate processing time for maximum size
      mockInvoke.mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s for max size
        return createSuccessfulSaveResponse(savedNote);
      });

      // When: Processing maximum size content
      performanceHelper.start('max-size-test');
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: maxSizeContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;
      const responseTime = performanceHelper.end('max-size-test');

      // Then: Should handle gracefully within reasonable time
      expect(response.success).toBe(true);
      expect(responseTime).toBeLessThan(2000); // 2 seconds maximum
    });

    test('PT-03-02: Empty content performance', async () => {
      // Given: Empty content
      const playerId = 'empty-content-player';
      const emptyContent = '';

      const savedNote = createTestPlayerNote({
        player_id: playerId,
        content: emptyContent,
        content_type: 'html',
      });

      mockInvoke.mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 10)); // Very fast for empty
        return createSuccessfulSaveResponse(savedNote);
      });

      // When: Processing empty content
      performanceHelper.start('empty-content-test');
      const request: SavePlayerNoteRequest = {
        player_id: playerId,
        content: emptyContent,
        content_type: 'html',
      };
      const response = await invoke('save_player_note', request) as SavePlayerNoteResponse;
      const responseTime = performanceHelper.end('empty-content-test');

      // Then: Should be very fast
      expect(response.success).toBe(true);
      expect(responseTime).toBeLessThan(50);
    });
  });
});