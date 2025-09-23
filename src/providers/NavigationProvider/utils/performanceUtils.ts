/**
 * 【機能概要】: パフォーマンス監視ユーティリティ
 * 【実装方針】: ブラウザ環境でのPerformance API安全使用
 * 【品質向上】: Refactorフェーズで共通化・再利用可能化
 * 🟢 信頼性レベル: Performance API標準仕様から確認済み
 */

export interface PerformanceMetrics {
  duration: number;
  startTime: number;
  endTime: number;
  label: string;
}

/**
 * 【機能概要】: ブラウザ環境でのPerformance API安全ラッパー
 * 【パフォーマンス】: SSR対応とエラー安全性を両立
 * 【品質向上】: 統一されたパフォーマンス測定インターフェース
 */
export const performanceUtils = {
  /**
   * パフォーマンスマークを設定
   * 【機能概要】: 測定開始点をマーク
   * 【エラー安全性】: ブラウザ環境チェックとエラーハンドリング
   */
  mark: (name: string): void => {
    if (typeof window !== "undefined" && "performance" in window) {
      try {
        window.performance?.mark?.(name);
      } catch (error) {
        console.warn(`[Performance] Failed to mark ${name}:`, error);
      }
    }
  },

  /**
   * パフォーマンス測定を実行
   * 【機能概要】: 開始マークから終了マークまでの時間を測定
   * 【エラー安全性】: 測定失敗時の適切なフォールバック
   */
  measure: (name: string, startMark: string, endMark?: string): PerformanceEntry | null => {
    if (typeof window !== "undefined" && "performance" in window) {
      try {
        return window.performance?.measure?.(name, startMark, endMark) || null;
      } catch (error) {
        console.warn(`[Performance] Failed to measure ${name}:`, error);
        return null;
      }
    }
    return null;
  },

  /**
   * 現在の高精度時刻を取得
   * 【機能概要】: performance.now()のフォールバック付き実装
   * 【品質向上】: クロスプラットフォーム対応
   */
  now: (): number => {
    if (typeof window !== "undefined" && "performance" in window) {
      return window.performance?.now?.() || Date.now();
    }
    return Date.now();
  },

  /**
   * 【機能概要】: 関数実行時間の自動測定ヘルパー
   * 【使用例】: measureExecutionTime(() => heavyFunction(), 'heavy-computation')
   * 【品質向上】: 実行時間測定の標準化とログ自動化
   */
  measureExecutionTime: <T>(
    fn: () => T,
    label: string,
    warningThreshold: number = 50
  ): T & { metrics?: PerformanceMetrics } => {
    const startTime = performanceUtils.now();
    performanceUtils.mark(`${label}-start`);

    const result = fn();

    const endTime = performanceUtils.now();
    performanceUtils.mark(`${label}-end`);
    performanceUtils.measure(label, `${label}-start`, `${label}-end`);

    const duration = endTime - startTime;

    // パフォーマンス警告の出力
    if (duration > warningThreshold) {
      console.warn(
        `[Performance] ${label} exceeded ${warningThreshold}ms threshold: ${duration.toFixed(2)}ms`
      );
    }

    const metrics: PerformanceMetrics = {
      duration,
      startTime,
      endTime,
      label,
    };

    // 結果にメトリクスを付加（デバッグ用）
    if (process.env.NODE_ENV === "development" && typeof result === "object" && result !== null) {
      (result as Record<string, unknown>).metrics = metrics;
    }

    return result as T & { metrics?: PerformanceMetrics };
  },

  /**
   * 【機能概要】: 非同期関数の実行時間測定
   * 【使用例】: await measureAsyncExecutionTime(async () => await apiCall(), 'api-fetch')
   * 【品質向上】: Promise対応の実行時間測定
   */
  measureAsyncExecutionTime: async <T>(
    fn: () => Promise<T>,
    label: string,
    warningThreshold: number = 100
  ): Promise<T & { metrics?: PerformanceMetrics }> => {
    const startTime = performanceUtils.now();
    performanceUtils.mark(`${label}-start`);

    try {
      const result = await fn();

      const endTime = performanceUtils.now();
      performanceUtils.mark(`${label}-end`);
      performanceUtils.measure(label, `${label}-start`, `${label}-end`);

      const duration = endTime - startTime;

      if (duration > warningThreshold) {
        console.warn(
          `[Performance] Async ${label} exceeded ${warningThreshold}ms threshold: ${duration.toFixed(2)}ms`
        );
      }

      const metrics: PerformanceMetrics = {
        duration,
        startTime,
        endTime,
        label,
      };

      if (process.env.NODE_ENV === "development" && typeof result === "object" && result !== null) {
        (result as Record<string, unknown>).metrics = metrics;
      }

      return result as T & { metrics?: PerformanceMetrics };
    } catch (error) {
      // エラー発生時も測定完了
      const endTime = performanceUtils.now();
      const duration = endTime - startTime;
      console.error(`[Performance] ${label} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },
};

export default performanceUtils;
