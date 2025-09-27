/**
 * 【テストユーティリティ】: Common Test Utilities for API Testing
 * 【実装方針】: TASK-0507・TASK-0508・TASK-0509 共通テストパターン抽出
 * 【目的】: テストコード重複削除、モック設定の統一化、保守性向上
 * 🔧 Refactor Phase: 共通テストロジックの統合と効率化
 */

import { vi } from 'vitest';
import type { ApiError } from './validation';

// ===== Common Mock Types =====

/**
 * 基本的なエンティティ構造
 * @description 全エンティティ共通の基本フィールド
 */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * 名前付きエンティティ
 * @description 名前を持つエンティティの基本構造
 */
export interface NamedEntity extends BaseEntity {
  name: string;
  color: string;
}

/**
 * 基本的なAPIレスポンス構造
 * @description 全APIレスポンス共通の基本構造
 */
export interface BaseApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

// ===== Mock Data Factories =====

/**
 * テスト用タイムスタンプ生成
 * @description 一貫したテスト用のタイムスタンプを生成
 * @param offsetMinutes 基準時間からのオフセット（分）
 * @returns ISO 8601フォーマットのタイムスタンプ
 */
export function createTestTimestamp(offsetMinutes: number = 0): string {
  const baseTime = new Date('2025-09-27T10:00:00.000Z');
  baseTime.setMinutes(baseTime.getMinutes() + offsetMinutes);
  return baseTime.toISOString();
}

/**
 * 基本エンティティ作成
 * @description テスト用の基本エンティティを作成
 * @param id エンティティID
 * @param createdOffsetMinutes 作成時間のオフセット
 * @param updatedOffsetMinutes 更新時間のオフセット
 * @returns 基本エンティティ
 */
export function createBaseEntity(
  id: string,
  createdOffsetMinutes: number = 0,
  updatedOffsetMinutes: number = 0
): BaseEntity {
  return {
    id,
    created_at: createTestTimestamp(createdOffsetMinutes),
    updated_at: createTestTimestamp(updatedOffsetMinutes)
  };
}

/**
 * 名前付きエンティティ作成
 * @description テスト用の名前付きエンティティを作成
 * @param id エンティティID
 * @param name エンティティ名
 * @param color HEXカラーコード
 * @param createdOffsetMinutes 作成時間のオフセット
 * @param updatedOffsetMinutes 更新時間のオフセット
 * @returns 名前付きエンティティ
 */
export function createNamedEntity(
  id: string,
  name: string,
  color: string,
  createdOffsetMinutes: number = 0,
  updatedOffsetMinutes: number = 0
): NamedEntity {
  return {
    ...createBaseEntity(id, createdOffsetMinutes, updatedOffsetMinutes),
    name,
    color
  };
}

// ===== Common Error Responses =====

/**
 * 共通エラーレスポンステンプレート
 * @description よく使用されるエラーパターンのテンプレート
 */
export const CommonErrorTemplates = {
  /**
   * HEXカラー形式エラー
   */
  invalidColorFormat: (providedColor: string): ApiError => ({
    code: 'INVALID_COLOR_FORMAT',
    message: '色は #RRGGBB 形式の6桁で入力してください',
    details: { provided_color: providedColor }
  }),

  /**
   * HEX文字無効エラー
   */
  invalidColorChars: (providedColor: string): ApiError => ({
    code: 'INVALID_COLOR_FORMAT',
    message: '色には0-9とA-Fの文字のみ使用できます',
    details: { provided_color: providedColor }
  }),

  /**
   * HEX開始文字エラー
   */
  invalidColorStart: (providedColor: string): ApiError => ({
    code: 'INVALID_COLOR_FORMAT',
    message: '色は # で始まるHEXカラーコードで入力してください',
    details: { provided_color: providedColor }
  }),

  /**
   * 名前重複エラー
   */
  nameDuplicate: (entityType: string, name: string): ApiError => ({
    code: `${entityType.toUpperCase()}_NAME_DUPLICATE`,
    message: `同名の${entityType}が既に存在します`,
    details: { name }
  }),

  /**
   * 名前空エラー
   */
  nameEmpty: (entityType: string): ApiError => ({
    code: `${entityType.toUpperCase()}_NAME_EMPTY`,
    message: `${entityType}名が空です`,
    details: null
  }),

  /**
   * 名前長すぎるエラー
   */
  nameTooLong: (entityType: string, name: string, maxLength: number): ApiError => ({
    code: `${entityType.toUpperCase()}_NAME_TOO_LONG`,
    message: `${entityType}名は${maxLength}文字以内で入力してください`,
    details: { name, max_length: maxLength, current_length: name.length }
  }),

  /**
   * エンティティ未発見エラー
   */
  entityNotFound: (entityType: string, id: string): ApiError => ({
    code: `${entityType.toUpperCase()}_NOT_FOUND`,
    message: `指定された${entityType}が見つかりません`,
    details: { id }
  }),

  /**
   * レベル範囲エラー
   */
  invalidLevelRange: (providedLevel: number, tagIndex?: number): ApiError => ({
    code: 'INVALID_LEVEL_RANGE',
    message: 'レベルは1-10の範囲で入力してください',
    details: {
      provided_level: providedLevel,
      valid_range: '1-10',
      tag_index: tagIndex
    }
  }),

  /**
   * データベース接続エラー
   */
  dbConnectionError: (): ApiError => ({
    code: 'DB_CONNECTION_ERROR',
    message: 'データベースに接続できません',
    details: null
  }),

  /**
   * データベース操作失敗エラー
   */
  dbOperationFailed: (operation: string): ApiError => ({
    code: 'DB_OPERATION_FAILED',
    message: `データベース操作が失敗しました: ${operation}`,
    details: { operation }
  }),

  /**
   * 内部エラー
   */
  internalError: (details?: unknown): ApiError => ({
    code: 'INTERNAL_ERROR',
    message: '内部エラーが発生しました',
    details
  })
};

// ===== Success Response Builders =====

/**
 * 成功レスポンス作成
 * @description 成功時のレスポンスを作成
 * @param data レスポンスデータ
 * @returns 成功レスポンス
 */
export function createSuccessResponse<T>(data: T): BaseApiResponse<T> {
  return {
    success: true,
    data,
    error: null
  };
}

/**
 * エラーレスポンス作成
 * @description エラー時のレスポンスを作成
 * @param error エラー情報
 * @returns エラーレスポンス
 */
export function createErrorResponse<T>(error: ApiError): BaseApiResponse<T> {
  return {
    success: false,
    data: null,
    error
  };
}

// ===== Mock Setup Utilities =====

/**
 * Tauri invoke モック設定
 * @description 統一されたTauri invokeモック設定
 * @param mockedInvoke モック対象のinvoke関数
 * @param response モックレスポンス
 */
export function setupMockInvoke<T>(
  mockedInvoke: ReturnType<typeof vi.mocked>,
  response: T
): void {
  mockedInvoke.mockResolvedValue(response);
}

/**
 * 複数モックレスポンス設定
 * @description 複数の連続したモックレスポンスを設定
 * @param mockedInvoke モック対象のinvoke関数
 * @param responses モックレスポンス配列
 */
export function setupMultipleMockInvokes<T>(
  mockedInvoke: ReturnType<typeof vi.mocked>,
  responses: T[]
): void {
  responses.forEach(response => {
    mockedInvoke.mockResolvedValueOnce(response);
  });
}

/**
 * エラーモック設定
 * @description エラーを投げるモックを設定
 * @param mockedInvoke モック対象のinvoke関数
 * @param error エラーオブジェクト
 */
export function setupMockInvokeError(
  mockedInvoke: ReturnType<typeof vi.mocked>,
  error: Error
): void {
  mockedInvoke.mockRejectedValue(error);
}

// ===== Test Data Generators =====

/**
 * テスト用UUID生成
 * @description テスト用の一意なUUIDを生成
 * @param prefix プレフィックス
 * @param suffix サフィックス
 * @returns テスト用UUID
 */
export function generateTestUuid(prefix: string = 'test', suffix: string = ''): string {
  const randomPart = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  const parts = [prefix, timestamp, randomPart, suffix].filter(Boolean);
  return parts.join('-');
}

/**
 * テスト用プレイヤータグ生成
 * @description TASK-0509用のテストプレイヤータグを生成
 * @param playerId プレイヤーID
 * @param tagId タグID
 * @param level レベル値
 * @param createdOffsetMinutes 作成時間オフセット
 * @param updatedOffsetMinutes 更新時間オフセット
 * @returns テスト用プレイヤータグ
 */
export function createTestPlayerTag(
  playerId: string,
  tagId: string,
  level: number,
  createdOffsetMinutes: number = 0,
  updatedOffsetMinutes: number = 0
) {
  return {
    id: generateTestUuid('ptag'),
    player_id: playerId,
    tag_id: tagId,
    level,
    created_at: createTestTimestamp(createdOffsetMinutes),
    updated_at: createTestTimestamp(updatedOffsetMinutes)
  };
}

// ===== Validation Test Helpers =====

/**
 * HEXカラーテストケース
 * @description HEXカラーバリデーションのテストケース
 */
export const HexColorTestCases = {
  valid: [
    '#FFFFFF',  // 大文字
    '#abcdef',  // 小文字
    '#aBc123',  // 混在
    '#000000',  // 黒
    '#FF0000',  // 赤
    '#00FF00',  // 緑
    '#0000FF',  // 青
    '#123ABC'   // 混合
  ],
  invalid: {
    withoutHash: ['FFFFFF', 'abcdef'],
    tooShort: ['#FF', '#00', '#ABC'],
    tooLong: ['#FF0000AA', '#ABCDEF12'],
    invalidChars: ['#GGHHII', '#XYZABC', '#123XYZ'],
    notString: [123, null, undefined, true, {}],
    empty: ['', '   '],
    cssColors: ['red', 'blue', 'green'],
    rgbFormat: ['rgb(255,0,0)', 'rgba(255,0,0,1)']
  }
};

/**
 * 名前バリデーションテストケース
 * @description 名前バリデーションのテストケース
 */
export const NameValidationTestCases = {
  valid: [
    'テスト',
    'アグレッシブ',
    'タイト',
    'ルース',
    'A',  // 1文字
    'a'.repeat(100)  // 100文字（最大）
  ],
  invalid: {
    empty: ['', '   ', '\t', '\n'],
    tooLong: ['a'.repeat(101), 'あ'.repeat(101)],
    notString: [123, null, undefined, true, {}, []]
  }
};

/**
 * レベルバリデーションテストケース
 * @description レベルバリデーションのテストケース
 */
export const LevelValidationTestCases = {
  valid: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  invalid: {
    outOfRange: [0, 11, -1, 15, 100],
    notInteger: [1.5, 2.7, 5.1],
    notNumber: ['5', null, undefined, true, {}, [], '1']
  }
};

// ===== Performance Test Utilities =====

/**
 * 性能テスト設定
 * @description 性能テスト用の設定
 */
export interface PerformanceTestConfig {
  /** 実行回数 */
  iterations: number;
  /** タイムアウト（ミリ秒） */
  timeoutMs: number;
  /** 期待最大実行時間（ミリ秒） */
  maxExpectedMs: number;
}

/**
 * デフォルト性能テスト設定
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceTestConfig = {
  iterations: 100,
  timeoutMs: 30000,
  maxExpectedMs: 1000
};

/**
 * 性能測定実行
 * @description 関数の性能を測定
 * @param fn 測定対象の関数
 * @param config 性能テスト設定
 * @returns 性能測定結果
 */
export async function measurePerformance<T>(
  fn: () => Promise<T> | T,
  config: PerformanceTestConfig = DEFAULT_PERFORMANCE_CONFIG
): Promise<{
  averageMs: number;
  minMs: number;
  maxMs: number;
  iterations: number;
}> {
  const times: number[] = [];

  for (let i = 0; i < config.iterations; i++) {
    const startTime = performance.now();
    await fn();
    const endTime = performance.now();
    times.push(endTime - startTime);
  }

  return {
    averageMs: times.reduce((sum, time) => sum + time, 0) / times.length,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    iterations: config.iterations
  };
}

// ===== Bulk Operation Test Utilities =====

/**
 * 大量データテスト生成
 * @description 大量データのテスト用データを生成
 * @param count 生成するデータ数
 * @param factory データファクトリ関数
 * @returns 生成されたテストデータ配列
 */
export function generateBulkTestData<T>(
  count: number,
  factory: (index: number) => T
): T[] {
  return Array.from({ length: count }, (_, index) => factory(index));
}

/**
 * バッチ処理テスト用ヘルパー
 * @description バッチ処理のテスト用ヘルパー
 * @param totalItems 総アイテム数
 * @param batchSize バッチサイズ
 * @returns バッチ情報
 */
export function createBatchTestInfo(totalItems: number, batchSize: number) {
  const expectedBatches = Math.ceil(totalItems / batchSize);
  const lastBatchSize = totalItems % batchSize || batchSize;

  return {
    totalItems,
    batchSize,
    expectedBatches,
    lastBatchSize
  };
}