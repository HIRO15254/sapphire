/**
 * 【共通バリデーション】: Shared Validation Utilities for API Management
 * 【実装方針】: TASK-0507・TASK-0508・TASK-0509 共通バリデーションロジック抽出
 * 【目的】: コード重複削除、一貫性向上、保守性向上
 * 🔧 Refactor Phase: 共通バリデーションロジックの統合とパフォーマンス最適化
 */

// ===== Common Types =====

/**
 * 共通APIエラー
 * @description 全API共通のエラー形式
 */
export interface ApiError {
  /** エラーコード */
  code: string;
  /** エラーメッセージ (日本語) */
  message: string;
  /** エラー詳細情報 */
  details?: unknown;
}

/**
 * バリデーション結果の基底型
 * @description 全バリデーション関数の共通返り値型
 */
export interface BaseValidationResult {
  /** バリデーション成功フラグ */
  valid: boolean;
  /** エラーメッセージ（失敗時） */
  error?: string;
  /** エラーコード（失敗時） */
  errorCode?: string;
  /** 詳細情報（失敗時） */
  details?: unknown;
}

// ===== Common Error Codes =====

/**
 * 共通エラーコード定数
 * @description 全API共通で使用されるエラーコード
 */
export const CommonErrorCodes = {
  // バリデーションエラー
  INVALID_COLOR_FORMAT: 'INVALID_COLOR_FORMAT',

  // データエラー
  ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',

  // システムエラー
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_OPERATION_FAILED: 'DB_OPERATION_FAILED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

// ===== HEX Color Validation =====

/**
 * HEXカラーバリデーション結果
 * @description TASK-0507・TASK-0508・TASK-0509 共通HEXカラー検証
 */
export interface HexColorValidationResult extends BaseValidationResult {
  /** エラーコード（失敗時） */
  errorCode?: string;
  /** 詳細情報 */
  details?: {
    provided_color: string;
    valid_format: string;
  };
}

/**
 * HEXカラー形式バリデーション
 * @description #RRGGBB 形式の検証（大文字小文字混在対応）
 * @param color 検証対象のカラー文字列
 * @returns バリデーション結果
 */
export function validateHexColor(color: string): HexColorValidationResult {
  // 基本的な型チェック
  if (typeof color !== 'string') {
    return {
      valid: false,
      error: '色コードは文字列で入力してください',
      errorCode: CommonErrorCodes.INVALID_COLOR_FORMAT,
      details: {
        provided_color: String(color),
        valid_format: '#RRGGBB'
      }
    };
  }

  // 空文字チェック
  if (!color || color.length === 0) {
    return {
      valid: false,
      error: '色コードが入力されていません',
      errorCode: CommonErrorCodes.INVALID_COLOR_FORMAT,
      details: {
        provided_color: color,
        valid_format: '#RRGGBB'
      }
    };
  }

  // # 開始チェック
  if (!color.startsWith('#')) {
    return {
      valid: false,
      error: '色は # で始まるHEXカラーコードで入力してください',
      errorCode: CommonErrorCodes.INVALID_COLOR_FORMAT,
      details: {
        provided_color: color,
        valid_format: '#RRGGBB'
      }
    };
  }

  // 長さチェック（#RRGGBB = 7文字）
  if (color.length !== 7) {
    return {
      valid: false,
      error: '色は #RRGGBB 形式の6桁で入力してください',
      errorCode: CommonErrorCodes.INVALID_COLOR_FORMAT,
      details: {
        provided_color: color,
        valid_format: '#RRGGBB'
      }
    };
  }

  // HEX文字チェック（0-9, A-F, a-f）
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  if (!hexPattern.test(color)) {
    return {
      valid: false,
      error: '色には0-9とA-Fの文字のみ使用できます',
      errorCode: CommonErrorCodes.INVALID_COLOR_FORMAT,
      details: {
        provided_color: color,
        valid_format: '#RRGGBB'
      }
    };
  }

  // 全てのチェックを通過
  return {
    valid: true
  };
}

// ===== Name Validation =====

/**
 * 名前バリデーション結果
 * @description プレイヤータイプ名・タグ名共通バリデーション
 */
export interface NameValidationResult extends BaseValidationResult {
  /** エラーコード（失敗時） */
  errorCode?: string;
  /** 詳細情報 */
  details?: {
    provided_name: string;
    max_length: number;
    current_length: number;
  };
}

/**
 * 名前バリデーション設定
 * @description 名前バリデーションの設定値
 */
export interface NameValidationConfig {
  /** 最大文字数 */
  maxLength: number;
  /** エラーコード（空文字時） */
  emptyErrorCode: string;
  /** エラーコード（長すぎる時） */
  tooLongErrorCode: string;
  /** エンティティ名（エラーメッセージ用） */
  entityName: string;
}

/**
 * 名前バリデーション
 * @description 1-100文字の名前バリデーション（プレイヤータイプ・タグ共通）
 * @param name 検証対象の名前文字列
 * @param config バリデーション設定
 * @returns バリデーション結果
 */
export function validateName(name: string, config: NameValidationConfig): NameValidationResult {
  // 基本的な型チェック
  if (typeof name !== 'string') {
    return {
      valid: false,
      error: `${config.entityName}名は文字列で入力してください`,
      errorCode: config.emptyErrorCode,
      details: {
        provided_name: String(name),
        max_length: config.maxLength,
        current_length: 0
      }
    };
  }

  // 空文字・空白のみチェック
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return {
      valid: false,
      error: `${config.entityName}名が空です`,
      errorCode: config.emptyErrorCode,
      details: {
        provided_name: name,
        max_length: config.maxLength,
        current_length: name.length
      }
    };
  }

  // 長さチェック
  if (trimmedName.length > config.maxLength) {
    return {
      valid: false,
      error: `${config.entityName}名は${config.maxLength}文字以内で入力してください`,
      errorCode: config.tooLongErrorCode,
      details: {
        provided_name: name,
        max_length: config.maxLength,
        current_length: trimmedName.length
      }
    };
  }

  // 全てのチェックを通過
  return {
    valid: true
  };
}

// ===== Level Validation (TASK-0509) =====

/**
 * レベルバリデーション結果
 * @description TASK-0509 レベル値(1-10)バリデーション
 */
export interface LevelValidationResult extends BaseValidationResult {
  /** エラーコード（失敗時） */
  errorCode?: string;
  /** 詳細情報 */
  details?: {
    provided_level: number;
    valid_range: string;
    tag_index?: number;
  };
}

/**
 * レベル値定数
 * @description レベル値の制約定数
 */
export const LevelConstants = {
  MIN_LEVEL: 1,
  MAX_LEVEL: 10,
  DEFAULT_LEVEL: 5,
  RANGE_STRING: '1-10'
} as const;

/**
 * レベル値バリデーション
 * @description 1-10の範囲でレベル値を検証
 * @param level 検証対象のレベル値
 * @param tagIndex タグのインデックス（一括操作時の特定用）
 * @returns バリデーション結果
 */
export function validateLevel(level: number, tagIndex?: number): LevelValidationResult {
  // 基本的な型チェック
  if (typeof level !== 'number' || isNaN(level)) {
    return {
      valid: false,
      error: 'レベルは数値で入力してください',
      errorCode: 'INVALID_LEVEL_RANGE',
      details: {
        provided_level: level,
        valid_range: LevelConstants.RANGE_STRING,
        tag_index: tagIndex
      }
    };
  }

  // 整数チェック
  if (!Number.isInteger(level)) {
    return {
      valid: false,
      error: 'レベルは整数で入力してください',
      errorCode: 'INVALID_LEVEL_RANGE',
      details: {
        provided_level: level,
        valid_range: LevelConstants.RANGE_STRING,
        tag_index: tagIndex
      }
    };
  }

  // 範囲チェック
  if (level < LevelConstants.MIN_LEVEL || level > LevelConstants.MAX_LEVEL) {
    return {
      valid: false,
      error: `レベルは${LevelConstants.RANGE_STRING}の範囲で入力してください`,
      errorCode: 'INVALID_LEVEL_RANGE',
      details: {
        provided_level: level,
        valid_range: LevelConstants.RANGE_STRING,
        tag_index: tagIndex
      }
    };
  }

  // 全てのチェックを通過
  return {
    valid: true
  };
}

// ===== Array Validation Utilities =====

/**
 * 配列重複チェック結果
 * @description 配列内の重複要素検出結果
 */
export interface DuplicateCheckResult<T> {
  /** 重複が存在するか */
  hasDuplicates: boolean;
  /** 重複した値 */
  duplicateValue?: T;
  /** 重複したインデックス */
  duplicateIndices?: number[];
}

/**
 * 配列重複チェック
 * @description 配列内の重複要素を検出
 * @param array 検証対象の配列
 * @param keyExtractor 比較キー抽出関数
 * @returns 重複チェック結果
 */
export function checkDuplicates<T, K>(
  array: T[],
  keyExtractor: (item: T) => K
): DuplicateCheckResult<K> {
  const seen = new Map<K, number[]>();

  array.forEach((item, index) => {
    const key = keyExtractor(item);
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(index);
  });

  // 重複をチェック
  for (const [key, indices] of seen.entries()) {
    if (indices.length > 1) {
      return {
        hasDuplicates: true,
        duplicateValue: key,
        duplicateIndices: indices
      };
    }
  }

  return {
    hasDuplicates: false
  };
}

// ===== Error Response Builders =====

/**
 * 統一エラーレスポンス生成
 * @description 全API共通のエラーレスポンス構築
 * @param code エラーコード
 * @param message エラーメッセージ
 * @param details エラー詳細情報
 * @returns APIエラーオブジェクト
 */
export function createApiError(
  code: string,
  message: string,
  details?: unknown
): ApiError {
  return {
    code,
    message,
    details
  };
}

/**
 * バリデーションエラーからAPIエラーへの変換
 * @description バリデーション結果からAPIエラーを生成
 * @param validationResult バリデーション結果
 * @returns APIエラーオブジェクト（成功時はnull）
 */
export function validationResultToApiError(
  validationResult: BaseValidationResult
): ApiError | null {
  if (validationResult.valid) {
    return null;
  }

  return createApiError(
    validationResult.errorCode || CommonErrorCodes.INTERNAL_ERROR,
    validationResult.error || 'バリデーションエラーが発生しました',
    validationResult.details
  );
}

// ===== Performance Optimization Utilities =====

/**
 * 性能監視情報
 * @description 大量操作時の性能測定用
 */
export interface PerformanceMetrics {
  /** 処理開始時刻 */
  start_time: string;
  /** 処理終了時刻 */
  end_time: string;
  /** 処理時間（ミリ秒） */
  duration_ms: number;
  /** 処理対象アイテム数 */
  item_count: number;
  /** 作成されたレコード数 */
  created_records: number;
  /** 更新されたレコード数 */
  updated_records: number;
  /** メモリ使用量（MB） */
  memory_usage_mb?: number;
}

/**
 * 性能測定開始
 * @description 処理の性能測定を開始
 * @param itemCount 処理対象アイテム数
 * @returns 開始時刻とアイテム数を含むパフォーマンス情報
 */
export function startPerformanceMeasurement(itemCount: number): Pick<PerformanceMetrics, 'start_time' | 'item_count'> {
  return {
    start_time: new Date().toISOString(),
    item_count: itemCount
  };
}

/**
 * 性能測定終了
 * @description 処理の性能測定を終了し結果を計算
 * @param startInfo 開始時の情報
 * @param createdCount 作成されたレコード数
 * @param updatedCount 更新されたレコード数
 * @returns 完全な性能測定結果
 */
export function endPerformanceMeasurement(
  startInfo: Pick<PerformanceMetrics, 'start_time' | 'item_count'>,
  createdCount: number,
  updatedCount: number
): PerformanceMetrics {
  const endTime = new Date().toISOString();
  const startTime = new Date(startInfo.start_time);
  const endTimeObj = new Date(endTime);

  return {
    start_time: startInfo.start_time,
    end_time: endTime,
    duration_ms: endTimeObj.getTime() - startTime.getTime(),
    item_count: startInfo.item_count,
    created_records: createdCount,
    updated_records: updatedCount,
    memory_usage_mb: process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : undefined
  };
}

// ===== Bulk Operation Utilities =====

/**
 * バッチ処理設定
 * @description 大量データ処理時のバッチ設定
 */
export interface BatchConfig {
  /** バッチサイズ */
  batchSize: number;
  /** 最大同時実行数 */
  maxConcurrency: number;
  /** タイムアウト（ミリ秒） */
  timeoutMs: number;
}

/**
 * デフォルトバッチ設定
 */
export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  batchSize: 10,
  maxConcurrency: 3,
  timeoutMs: 30000
};

/**
 * 配列をバッチに分割
 * @description 大きな配列を指定サイズのバッチに分割
 * @param array 分割対象の配列
 * @param batchSize バッチサイズ
 * @returns バッチ配列
 */
export function chunkArray<T>(array: T[], batchSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    chunks.push(array.slice(i, i + batchSize));
  }
  return chunks;
}

/**
 * メモリ使用量チェック
 * @description 現在のメモリ使用量を取得（Node.js環境）
 * @returns メモリ使用量（MB）またはundefined
 */
export function getCurrentMemoryUsage(): number | undefined {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }
  return undefined;
}