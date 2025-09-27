/**
 * 【一括操作最適化】: Bulk Operations Performance Optimization Utilities
 * 【実装方針】: TASK-0509 大量データ処理の性能最適化とメモリ効率化
 * 【目的】: バッチ処理、並列実行、メモリ管理、トランザクション最適化
 * 🔧 Refactor Phase: 大量データ処理の性能向上とスケーラビリティ対応
 */

import { PerformanceMetrics, BatchConfig, DEFAULT_BATCH_CONFIG, chunkArray } from './validation';

// ===== Transaction Management =====

/**
 * トランザクション管理設定
 * @description 大量データ処理時のトランザクション制御
 */
export interface TransactionConfig {
  /** トランザクションタイムアウト（ミリ秒） */
  timeoutMs: number;
  /** 自動コミット間隔（操作数） */
  autoCommitInterval: number;
  /** エラー時のロールバック戦略 */
  rollbackStrategy: 'immediate' | 'batch-level' | 'defer';
  /** リトライ設定 */
  retryConfig: {
    maxRetries: number;
    backoffMs: number;
    exponentialBackoff: boolean;
  };
}

/**
 * デフォルトトランザクション設定
 */
export const DEFAULT_TRANSACTION_CONFIG: TransactionConfig = {
  timeoutMs: 60000,  // 60秒
  autoCommitInterval: 100,  // 100操作ごと
  rollbackStrategy: 'batch-level',
  retryConfig: {
    maxRetries: 3,
    backoffMs: 1000,
    exponentialBackoff: true
  }
};

/**
 * トランザクション結果
 * @description トランザクション実行結果の詳細情報
 */
export interface TransactionResult<T> {
  /** 成功フラグ */
  success: boolean;
  /** 結果データ */
  results: T[];
  /** 失敗したアイテム */
  failures: TransactionFailure[];
  /** 性能情報 */
  performance: PerformanceMetrics;
  /** トランザクション統計 */
  statistics: TransactionStatistics;
}

/**
 * トランザクション失敗情報
 */
export interface TransactionFailure {
  /** 失敗したアイテムのインデックス */
  index: number;
  /** 失敗したアイテム */
  item: unknown;
  /** エラー情報 */
  error: Error;
  /** リトライ回数 */
  retryCount: number;
}

/**
 * トランザクション統計
 */
export interface TransactionStatistics {
  /** 総処理数 */
  totalItems: number;
  /** 成功数 */
  successCount: number;
  /** 失敗数 */
  failureCount: number;
  /** スキップ数 */
  skippedCount: number;
  /** バッチ数 */
  batchCount: number;
  /** 平均バッチ処理時間（ミリ秒） */
  averageBatchTimeMs: number;
  /** リトライ総数 */
  totalRetries: number;
}

// ===== Memory Management =====

/**
 * メモリ管理設定
 * @description 大量データ処理時のメモリ使用量制御
 */
export interface MemoryConfig {
  /** メモリ使用量上限（MB） */
  maxMemoryMb: number;
  /** メモリチェック間隔（操作数） */
  checkInterval: number;
  /** ガベージコレクション強制実行閾値（MB） */
  gcThresholdMb: number;
  /** メモリ不足時の動作 */
  onMemoryLimit: 'pause' | 'reduce-batch' | 'abort';
}

/**
 * デフォルトメモリ設定
 */
export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxMemoryMb: 500,  // 500MB
  checkInterval: 50,  // 50操作ごと
  gcThresholdMb: 400,  // 400MB
  onMemoryLimit: 'reduce-batch'
};

/**
 * メモリ監視情報
 */
export interface MemoryMonitorInfo {
  /** 現在のメモリ使用量（MB） */
  currentMb: number;
  /** 最大メモリ使用量（MB） */
  maxMb: number;
  /** メモリ使用率（%） */
  usagePercent: number;
  /** 警告レベル */
  warningLevel: 'safe' | 'warning' | 'critical';
}

/**
 * メモリ使用量監視
 * @description 現在のメモリ使用状況を監視
 * @param config メモリ設定
 * @returns メモリ監視情報
 */
export function monitorMemoryUsage(config: MemoryConfig = DEFAULT_MEMORY_CONFIG): MemoryMonitorInfo {
  const currentMb = getCurrentMemoryUsageMb();
  const usagePercent = (currentMb / config.maxMemoryMb) * 100;

  let warningLevel: 'safe' | 'warning' | 'critical' = 'safe';
  if (usagePercent > 90) {
    warningLevel = 'critical';
  } else if (usagePercent > 70) {
    warningLevel = 'warning';
  }

  return {
    currentMb,
    maxMb: config.maxMemoryMb,
    usagePercent,
    warningLevel
  };
}

/**
 * 現在のメモリ使用量取得
 * @description Node.js環境でのメモリ使用量を取得
 * @returns メモリ使用量（MB）
 */
function getCurrentMemoryUsageMb(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }
  return 0;  // ブラウザ環境など
}

/**
 * ガベージコレクション実行
 * @description 手動でガベージコレクションを実行（可能な場合）
 */
export function forceGarbageCollection(): void {
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
  }
}

// ===== Parallel Processing =====

/**
 * 並列処理設定
 * @description 並列バッチ処理の設定
 */
export interface ParallelConfig {
  /** 最大並列数 */
  maxConcurrency: number;
  /** タスクタイムアウト（ミリ秒） */
  taskTimeoutMs: number;
  /** 失敗時の動作 */
  onTaskFailure: 'continue' | 'abort-batch' | 'abort-all';
  /** 進捗報告間隔（操作数） */
  progressReportInterval: number;
}

/**
 * デフォルト並列処理設定
 */
export const DEFAULT_PARALLEL_CONFIG: ParallelConfig = {
  maxConcurrency: 3,
  taskTimeoutMs: 30000,
  onTaskFailure: 'continue',
  progressReportInterval: 10
};

/**
 * 進捗情報
 */
export interface ProgressInfo {
  /** 処理済み数 */
  completed: number;
  /** 総数 */
  total: number;
  /** 進捗率（%） */
  percentage: number;
  /** 推定残り時間（ミリ秒） */
  estimatedRemainingMs: number;
}

/**
 * 並列バッチ処理実行
 * @description 大量データを並列バッチで処理
 * @param items 処理対象アイテム配列
 * @param processor バッチ処理関数
 * @param batchConfig バッチ設定
 * @param parallelConfig 並列処理設定
 * @param progressCallback 進捗コールバック
 * @returns 処理結果
 */
export async function executeParallelBatches<TInput, TOutput>(
  items: TInput[],
  processor: (batch: TInput[]) => Promise<TOutput[]>,
  batchConfig: BatchConfig = DEFAULT_BATCH_CONFIG,
  parallelConfig: ParallelConfig = DEFAULT_PARALLEL_CONFIG,
  progressCallback?: (progress: ProgressInfo) => void
): Promise<TransactionResult<TOutput>> {
  const startTime = Date.now();
  const chunks = chunkArray(items, batchConfig.batchSize);
  const results: TOutput[] = [];
  const failures: TransactionFailure[] = [];
  let completedBatches = 0;
  const batchTimes: number[] = [];

  // 並列処理用のセマフォ
  const semaphore = new ParallelSemaphore(parallelConfig.maxConcurrency);

  // 全バッチを並列処理
  const batchPromises = chunks.map(async (chunk, batchIndex) => {
    return semaphore.execute(async () => {
      const batchStartTime = Date.now();

      try {
        // タイムアウト付きでバッチを処理
        const batchResults = await Promise.race([
          processor(chunk),
          new Promise<TOutput[]>((_, reject) =>
            setTimeout(() => reject(new Error('Batch timeout')), parallelConfig.taskTimeoutMs)
          )
        ]);

        results.push(...batchResults);
        completedBatches++;

        const batchTime = Date.now() - batchStartTime;
        batchTimes.push(batchTime);

        // 進捗報告
        if (progressCallback && completedBatches % parallelConfig.progressReportInterval === 0) {
          const progress = calculateProgress(completedBatches, chunks.length, startTime);
          progressCallback(progress);
        }

      } catch (error) {
        // バッチ失敗時の処理
        chunk.forEach((item, itemIndex) => {
          failures.push({
            index: batchIndex * batchConfig.batchSize + itemIndex,
            item,
            error: error as Error,
            retryCount: 0
          });
        });

        if (parallelConfig.onTaskFailure === 'abort-all') {
          throw error;
        }
      }
    });
  });

  try {
    await Promise.all(batchPromises);
  } catch (error) {
    // 全体失敗時はここで処理を終了
  }

  const endTime = Date.now();
  const statistics: TransactionStatistics = {
    totalItems: items.length,
    successCount: results.length,
    failureCount: failures.length,
    skippedCount: 0,
    batchCount: chunks.length,
    averageBatchTimeMs: batchTimes.length > 0 ? batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length : 0,
    totalRetries: 0
  };

  const performance: PerformanceMetrics = {
    start_time: new Date(startTime).toISOString(),
    end_time: new Date(endTime).toISOString(),
    duration_ms: endTime - startTime,
    item_count: items.length,
    created_records: results.length,
    updated_records: 0,
    memory_usage_mb: getCurrentMemoryUsageMb()
  };

  return {
    success: failures.length === 0,
    results,
    failures,
    performance,
    statistics
  };
}

/**
 * 進捗計算
 * @description 現在の進捗情報を計算
 * @param completed 完了数
 * @param total 総数
 * @param startTime 開始時刻
 * @returns 進捗情報
 */
function calculateProgress(completed: number, total: number, startTime: number): ProgressInfo {
  const percentage = (completed / total) * 100;
  const elapsedMs = Date.now() - startTime;
  const estimatedTotalMs = total > 0 ? (elapsedMs / completed) * total : 0;
  const estimatedRemainingMs = Math.max(0, estimatedTotalMs - elapsedMs);

  return {
    completed,
    total,
    percentage,
    estimatedRemainingMs
  };
}

// ===== Semaphore Implementation =====

/**
 * 並列処理用セマフォ
 * @description 並列実行数を制御するセマフォ実装
 */
class ParallelSemaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(maxConcurrency: number) {
    this.permits = maxConcurrency;
  }

  /**
   * セマフォ制御下でタスクを実行
   * @param task 実行するタスク
   * @returns タスクの実行結果
   */
  async execute<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }

  /**
   * セマフォを取得
   */
  private async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  /**
   * セマフォを解放
   */
  private release(): void {
    this.permits++;
    const next = this.waitQueue.shift();
    if (next) {
      this.permits--;
      next();
    }
  }
}

// ===== Adaptive Batch Sizing =====

/**
 * 適応的バッチサイズ調整
 * @description 性能とメモリ使用量に基づいてバッチサイズを動的調整
 */
export class AdaptiveBatchProcessor<TInput, TOutput> {
  private initialBatchSize: number;
  private minBatchSize: number;
  private maxBatchSize: number;
  private currentBatchSize: number;
  private memoryConfig: MemoryConfig;
  private performanceHistory: number[] = [];

  constructor(
    initialBatchSize: number = 10,
    minBatchSize: number = 1,
    maxBatchSize: number = 100,
    memoryConfig: MemoryConfig = DEFAULT_MEMORY_CONFIG
  ) {
    this.initialBatchSize = initialBatchSize;
    this.minBatchSize = minBatchSize;
    this.maxBatchSize = maxBatchSize;
    this.currentBatchSize = initialBatchSize;
    this.memoryConfig = memoryConfig;
  }

  /**
   * 適応的バッチ処理実行
   * @param items 処理対象アイテム
   * @param processor バッチ処理関数
   * @param progressCallback 進捗コールバック
   * @returns 処理結果
   */
  async processAdaptively(
    items: TInput[],
    processor: (batch: TInput[]) => Promise<TOutput[]>,
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<TransactionResult<TOutput>> {
    const startTime = Date.now();
    const results: TOutput[] = [];
    const failures: TransactionFailure[] = [];
    let processed = 0;

    while (processed < items.length) {
      const batch = items.slice(processed, processed + this.currentBatchSize);
      const batchStartTime = Date.now();

      try {
        // メモリチェック
        const memoryInfo = monitorMemoryUsage(this.memoryConfig);
        if (memoryInfo.warningLevel === 'critical') {
          this.adjustBatchSizeForMemory(memoryInfo);
          continue;
        }

        // バッチ処理実行
        const batchResults = await processor(batch);
        results.push(...batchResults);

        // 性能測定とバッチサイズ調整
        const batchTime = Date.now() - batchStartTime;
        this.recordPerformance(batchTime);
        this.adjustBatchSizeForPerformance();

        processed += batch.length;

        // 進捗報告
        if (progressCallback) {
          const progress = calculateProgress(processed, items.length, startTime);
          progressCallback(progress);
        }

      } catch (error) {
        batch.forEach((item, index) => {
          failures.push({
            index: processed + index,
            item,
            error: error as Error,
            retryCount: 0
          });
        });

        // エラー時はバッチサイズを縮小
        this.reduceBatchSize();
        processed += batch.length;
      }
    }

    const endTime = Date.now();
    const statistics: TransactionStatistics = {
      totalItems: items.length,
      successCount: results.length,
      failureCount: failures.length,
      skippedCount: 0,
      batchCount: Math.ceil(items.length / this.initialBatchSize),
      averageBatchTimeMs: this.getAveragePerformance(),
      totalRetries: 0
    };

    const performance: PerformanceMetrics = {
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      duration_ms: endTime - startTime,
      item_count: items.length,
      created_records: results.length,
      updated_records: 0,
      memory_usage_mb: getCurrentMemoryUsageMb()
    };

    return {
      success: failures.length === 0,
      results,
      failures,
      performance,
      statistics
    };
  }

  /**
   * 性能履歴を記録
   * @param batchTime バッチ処理時間
   */
  private recordPerformance(batchTime: number): void {
    this.performanceHistory.push(batchTime);
    if (this.performanceHistory.length > 10) {
      this.performanceHistory.shift();
    }
  }

  /**
   * 平均性能取得
   * @returns 平均バッチ処理時間
   */
  private getAveragePerformance(): number {
    if (this.performanceHistory.length === 0) return 0;
    return this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
  }

  /**
   * 性能に基づくバッチサイズ調整
   */
  private adjustBatchSizeForPerformance(): void {
    const avgTime = this.getAveragePerformance();

    if (avgTime < 100 && this.currentBatchSize < this.maxBatchSize) {
      // 高速なら増加
      this.currentBatchSize = Math.min(this.maxBatchSize, Math.ceil(this.currentBatchSize * 1.2));
    } else if (avgTime > 1000 && this.currentBatchSize > this.minBatchSize) {
      // 遅いなら減少
      this.currentBatchSize = Math.max(this.minBatchSize, Math.floor(this.currentBatchSize * 0.8));
    }
  }

  /**
   * メモリ使用量に基づくバッチサイズ調整
   * @param memoryInfo メモリ情報
   */
  private adjustBatchSizeForMemory(memoryInfo: MemoryMonitorInfo): void {
    if (memoryInfo.warningLevel === 'critical') {
      this.currentBatchSize = Math.max(this.minBatchSize, Math.floor(this.currentBatchSize * 0.5));
      forceGarbageCollection();
    } else if (memoryInfo.warningLevel === 'warning') {
      this.currentBatchSize = Math.max(this.minBatchSize, Math.floor(this.currentBatchSize * 0.8));
    }
  }

  /**
   * バッチサイズ縮小
   */
  private reduceBatchSize(): void {
    this.currentBatchSize = Math.max(this.minBatchSize, Math.floor(this.currentBatchSize * 0.7));
  }

  /**
   * 現在のバッチサイズ取得
   * @returns 現在のバッチサイズ
   */
  getCurrentBatchSize(): number {
    return this.currentBatchSize;
  }

  /**
   * バッチサイズをリセット
   */
  resetBatchSize(): void {
    this.currentBatchSize = this.initialBatchSize;
    this.performanceHistory = [];
  }
}