/**
 * 【エラーハンドリング統一】: Enhanced Error Handling and Consistency
 * 【実装方針】: TASK-0507・TASK-0508・TASK-0509 統一エラーハンドリング
 * 【目的】: エラーメッセージの一貫性、ログ記録、エラー分類、回復戦略
 * 🔧 Refactor Phase: エラーハンドリングの統合と品質向上
 */

import { ApiError, CommonErrorCodes } from './validation';

// ===== Error Classification =====

/**
 * エラーカテゴリ
 * @description エラーの分類と処理方針
 */
export enum ErrorCategory {
  /** バリデーションエラー（ユーザー入力起因） */
  VALIDATION = 'validation',
  /** ビジネスロジックエラー（業務ルール違反） */
  BUSINESS_LOGIC = 'business_logic',
  /** データアクセスエラー（DB関連） */
  DATA_ACCESS = 'data_access',
  /** システムエラー（予期しない例外） */
  SYSTEM = 'system',
  /** 外部サービスエラー（API通信など） */
  EXTERNAL = 'external'
}

/**
 * エラー重要度
 * @description エラーの重要度レベル
 */
export enum ErrorSeverity {
  /** 情報（記録のみ） */
  INFO = 'info',
  /** 警告（処理続行可能） */
  WARNING = 'warning',
  /** エラー（処理中断） */
  ERROR = 'error',
  /** 致命的（システム停止） */
  CRITICAL = 'critical'
}

/**
 * 拡張エラー情報
 * @description 詳細なエラー分類と追跡情報
 */
export interface EnhancedError extends ApiError {
  /** エラーカテゴリ */
  category: ErrorCategory;
  /** エラー重要度 */
  severity: ErrorSeverity;
  /** 発生タイムスタンプ */
  timestamp: string;
  /** スタックトレース */
  stackTrace?: string;
  /** コンテキスト情報 */
  context?: Record<string, unknown>;
  /** 相関ID（リクエスト追跡用） */
  correlationId?: string;
  /** 回復可能フラグ */
  recoverable: boolean;
  /** 推奨アクション */
  suggestedAction?: string;
}

// ===== Error Templates =====

/**
 * エラーテンプレート定義
 * @description 統一されたエラーメッセージテンプレート
 */
export const ErrorTemplates = {
  // バリデーションエラー
  validation: {
    invalidColorFormat: (color: string): EnhancedError => ({
      code: CommonErrorCodes.INVALID_COLOR_FORMAT,
      message: '色は #RRGGBB 形式の6桁で入力してください',
      details: { provided_color: color, valid_format: '#RRGGBB' },
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: '正しいHEXカラー形式で再入力してください'
    }),

    invalidColorChars: (color: string): EnhancedError => ({
      code: CommonErrorCodes.INVALID_COLOR_FORMAT,
      message: '色には0-9とA-Fの文字のみ使用できます',
      details: { provided_color: color, valid_chars: '0-9, A-F' },
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: '有効なHEX文字（0-9, A-F）のみを使用してください'
    }),

    invalidColorStart: (color: string): EnhancedError => ({
      code: CommonErrorCodes.INVALID_COLOR_FORMAT,
      message: '色は # で始まるHEXカラーコードで入力してください',
      details: { provided_color: color, required_prefix: '#' },
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: 'カラーコードの先頭に # を付けてください'
    }),

    nameEmpty: (entityType: string): EnhancedError => ({
      code: `${entityType.toUpperCase()}_NAME_EMPTY`,
      message: `${entityType}名が空です`,
      details: { entity_type: entityType },
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: `${entityType}名を入力してください`
    }),

    nameTooLong: (entityType: string, name: string, maxLength: number): EnhancedError => ({
      code: `${entityType.toUpperCase()}_NAME_TOO_LONG`,
      message: `${entityType}名は${maxLength}文字以内で入力してください`,
      details: { entity_type: entityType, name, max_length: maxLength, current_length: name.length },
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: `${entityType}名を${maxLength}文字以内に短縮してください`
    }),

    levelOutOfRange: (level: number, tagIndex?: number): EnhancedError => ({
      code: 'INVALID_LEVEL_RANGE',
      message: 'レベルは1-10の範囲で入力してください',
      details: { provided_level: level, valid_range: '1-10', tag_index: tagIndex },
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: 'レベル値を1-10の範囲で設定してください'
    })
  },

  // ビジネスロジックエラー
  businessLogic: {
    duplicateName: (entityType: string, name: string): EnhancedError => ({
      code: `${entityType.toUpperCase()}_NAME_DUPLICATE`,
      message: `同名の${entityType}が既に存在します`,
      details: { entity_type: entityType, name },
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: '別の名前を使用してください'
    }),

    entityNotFound: (entityType: string, id: string): EnhancedError => ({
      code: `${entityType.toUpperCase()}_NOT_FOUND`,
      message: `指定された${entityType}が見つかりません`,
      details: { entity_type: entityType, id },
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      recoverable: false,
      suggestedAction: '正しいIDを指定するか、エンティティが存在することを確認してください'
    }),

    entityInUse: (entityType: string, id: string, usageCount: number): EnhancedError => ({
      code: `${entityType.toUpperCase()}_IN_USE`,
      message: `${entityType}は他の場所で使用されているため削除できません`,
      details: { entity_type: entityType, id, usage_count: usageCount },
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      recoverable: false,
      suggestedAction: '使用している箇所を先に削除してからこのエンティティを削除してください'
    }),

    tooManyTags: (providedCount: number, maxAllowed: number): EnhancedError => ({
      code: 'TOO_MANY_TAG_ASSIGNMENTS',
      message: `タグ割り当ては最大${maxAllowed}個までです`,
      details: { provided_count: providedCount, max_allowed: maxAllowed },
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: `タグ数を${maxAllowed}個以下に削減してください`
    }),

    duplicateTagInRequest: (tagId: string, indices: number[]): EnhancedError => ({
      code: 'DUPLICATE_TAG_IN_REQUEST',
      message: 'リクエスト内に重複するタグが含まれています',
      details: { duplicate_tag_id: tagId, indices },
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: '重複するタグを削除してください'
    })
  },

  // データアクセスエラー
  dataAccess: {
    connectionError: (): EnhancedError => ({
      code: CommonErrorCodes.DB_CONNECTION_ERROR,
      message: 'データベースに接続できません',
      details: null,
      category: ErrorCategory.DATA_ACCESS,
      severity: ErrorSeverity.CRITICAL,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: 'しばらく時間をおいてから再試行してください'
    }),

    operationFailed: (operation: string, error?: string): EnhancedError => ({
      code: CommonErrorCodes.DB_OPERATION_FAILED,
      message: `データベース操作が失敗しました: ${operation}`,
      details: { operation, error },
      category: ErrorCategory.DATA_ACCESS,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: '操作を再試行してください'
    }),

    transactionFailed: (details?: unknown): EnhancedError => ({
      code: CommonErrorCodes.TRANSACTION_FAILED,
      message: 'トランザクション処理が失敗しました',
      details,
      category: ErrorCategory.DATA_ACCESS,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: '操作を最初からやり直してください'
    })
  },

  // システムエラー
  system: {
    internalError: (error?: string, details?: unknown): EnhancedError => ({
      code: CommonErrorCodes.INTERNAL_ERROR,
      message: '内部エラーが発生しました',
      details: { error, ...details },
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      timestamp: new Date().toISOString(),
      recoverable: false,
      suggestedAction: 'システム管理者に連絡してください'
    }),

    timeout: (operation: string, timeoutMs: number): EnhancedError => ({
      code: 'OPERATION_TIMEOUT',
      message: `操作がタイムアウトしました: ${operation}`,
      details: { operation, timeout_ms: timeoutMs },
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: 'より小さなバッチサイズで再試行してください'
    }),

    memoryLimit: (currentMb: number, limitMb: number): EnhancedError => ({
      code: 'MEMORY_LIMIT_EXCEEDED',
      message: 'メモリ使用量が上限を超えました',
      details: { current_mb: currentMb, limit_mb: limitMb },
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      timestamp: new Date().toISOString(),
      recoverable: true,
      suggestedAction: 'バッチサイズを小さくして再試行してください'
    })
  }
};

// ===== Error Handler =====

/**
 * エラーハンドラー設定
 */
export interface ErrorHandlerConfig {
  /** ログ出力レベル */
  logLevel: ErrorSeverity;
  /** エラー詳細情報をログに含めるか */
  includeDetails: boolean;
  /** スタックトレースをログに含めるか */
  includeStackTrace: boolean;
  /** 相関IDの自動生成 */
  generateCorrelationId: boolean;
}

/**
 * デフォルトエラーハンドラー設定
 */
export const DEFAULT_ERROR_HANDLER_CONFIG: ErrorHandlerConfig = {
  logLevel: ErrorSeverity.WARNING,
  includeDetails: true,
  includeStackTrace: false,
  generateCorrelationId: true
};

/**
 * 統一エラーハンドラー
 * @description 全API共通のエラーハンドリング
 */
export class UnifiedErrorHandler {
  private config: ErrorHandlerConfig;
  private errorLog: EnhancedError[] = [];

  constructor(config: ErrorHandlerConfig = DEFAULT_ERROR_HANDLER_CONFIG) {
    this.config = config;
  }

  /**
   * エラーを処理
   * @param error 処理対象のエラー
   * @param context 追加のコンテキスト情報
   * @returns 処理されたエラー
   */
  handleError(error: Error | EnhancedError, context?: Record<string, unknown>): EnhancedError {
    let enhancedError: EnhancedError;

    if (this.isEnhancedError(error)) {
      enhancedError = error;
    } else {
      enhancedError = this.enhanceError(error, context);
    }

    // 相関ID生成
    if (this.config.generateCorrelationId && !enhancedError.correlationId) {
      enhancedError.correlationId = this.generateCorrelationId();
    }

    // コンテキスト情報追加
    if (context) {
      enhancedError.context = { ...enhancedError.context, ...context };
    }

    // ログ記録
    this.logError(enhancedError);

    // エラー履歴に保存
    this.errorLog.push(enhancedError);

    return enhancedError;
  }

  /**
   * エラーがEnhancedErrorかチェック
   */
  private isEnhancedError(error: Error | EnhancedError): error is EnhancedError {
    return 'category' in error && 'severity' in error;
  }

  /**
   * 通常のErrorをEnhancedErrorに変換
   */
  private enhanceError(error: Error, context?: Record<string, unknown>): EnhancedError {
    return {
      code: CommonErrorCodes.INTERNAL_ERROR,
      message: error.message || '予期しないエラーが発生しました',
      details: { originalError: error.message },
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      stackTrace: error.stack,
      context,
      recoverable: false,
      suggestedAction: 'システム管理者に連絡してください'
    };
  }

  /**
   * エラーをログに記録
   */
  private logError(error: EnhancedError): void {
    if (this.shouldLog(error.severity)) {
      const logEntry = this.formatLogEntry(error);
      console.error(logEntry);
    }
  }

  /**
   * ログ出力すべきかチェック
   */
  private shouldLog(severity: ErrorSeverity): boolean {
    const severityLevels = {
      [ErrorSeverity.INFO]: 0,
      [ErrorSeverity.WARNING]: 1,
      [ErrorSeverity.ERROR]: 2,
      [ErrorSeverity.CRITICAL]: 3
    };

    return severityLevels[severity] >= severityLevels[this.config.logLevel];
  }

  /**
   * ログエントリーをフォーマット
   */
  private formatLogEntry(error: EnhancedError): string {
    const parts = [
      `[${error.severity.toUpperCase()}]`,
      `[${error.category}]`,
      `[${error.code}]`,
      error.message
    ];

    if (error.correlationId) {
      parts.push(`[ID: ${error.correlationId}]`);
    }

    if (this.config.includeDetails && error.details) {
      parts.push(`Details: ${JSON.stringify(error.details)}`);
    }

    if (this.config.includeStackTrace && error.stackTrace) {
      parts.push(`Stack: ${error.stackTrace}`);
    }

    return parts.join(' ');
  }

  /**
   * 相関ID生成
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * エラー統計取得
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: EnhancedError[];
  } {
    const errorsByCategory = Object.values(ErrorCategory).reduce((acc, category) => {
      acc[category] = this.errorLog.filter(e => e.category === category).length;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = this.errorLog.filter(e => e.severity === severity).length;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    // 過去1時間のエラー
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentErrors = this.errorLog.filter(e => e.timestamp > oneHourAgo);

    return {
      totalErrors: this.errorLog.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors
    };
  }

  /**
   * エラーログをクリア
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * エラーをAPIエラー形式に変換
   */
  toApiError(error: EnhancedError): ApiError {
    return {
      code: error.code,
      message: error.message,
      details: error.details
    };
  }
}

// ===== Global Error Handler Instance =====

/**
 * グローバルエラーハンドラーインスタンス
 */
export const globalErrorHandler = new UnifiedErrorHandler();

// ===== Helper Functions =====

/**
 * エラーを安全に処理して APIエラー形式で返す
 * @param error 処理対象のエラー
 * @param context 追加のコンテキスト情報
 * @returns APIエラー
 */
export function handleApiError(error: Error | EnhancedError, context?: Record<string, unknown>): ApiError {
  const enhancedError = globalErrorHandler.handleError(error, context);
  return globalErrorHandler.toApiError(enhancedError);
}

/**
 * バリデーションエラーを作成
 * @param field フィールド名
 * @param value 無効な値
 * @param message エラーメッセージ
 * @returns 拡張エラー
 */
export function createValidationError(field: string, value: unknown, message: string): EnhancedError {
  return {
    code: CommonErrorCodes.INVALID_COLOR_FORMAT,
    message,
    details: { field, value },
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
    timestamp: new Date().toISOString(),
    recoverable: true,
    suggestedAction: '正しい値を入力してください'
  };
}

/**
 * 複数エラーを統合
 * @param errors エラー配列
 * @returns 統合されたエラー
 */
export function combineErrors(errors: EnhancedError[]): EnhancedError {
  if (errors.length === 0) {
    return ErrorTemplates.system.internalError('No errors provided');
  }

  if (errors.length === 1) {
    return errors[0];
  }

  const highestSeverity = errors.reduce((max, error) => {
    const severityLevels = {
      [ErrorSeverity.INFO]: 0,
      [ErrorSeverity.WARNING]: 1,
      [ErrorSeverity.ERROR]: 2,
      [ErrorSeverity.CRITICAL]: 3
    };
    return severityLevels[error.severity] > severityLevels[max.severity] ? error : max;
  }).severity;

  return {
    code: 'MULTIPLE_ERRORS',
    message: `複数のエラーが発生しました (${errors.length}件)`,
    details: { errors: errors.map(e => ({ code: e.code, message: e.message })) },
    category: ErrorCategory.VALIDATION,
    severity: highestSeverity,
    timestamp: new Date().toISOString(),
    recoverable: errors.every(e => e.recoverable),
    suggestedAction: '各エラーを個別に修正してください'
  };
}