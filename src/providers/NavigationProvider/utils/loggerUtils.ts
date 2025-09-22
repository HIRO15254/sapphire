/**
 * 【機能概要】: 統一されたログ出力ユーティリティ
 * 【実装方針】: 環境別ログレベル制御と構造化ログ
 * 【品質向上】: Refactorフェーズでログ機能の標準化
 * 🟢 信頼性レベル: console API標準仕様から確認済み
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: number;
  component: string;
}

/**
 * 【機能概要】: NavigationProvider専用ログユーティリティ
 * 【品質向上】: 構造化ログとパフォーマンス情報の統合
 * 【デバッグ支援】: 開発環境でのデバッグ情報充実
 */
export class NavigationLogger {
  private readonly component: string;
  private readonly isDevelopment: boolean;

  constructor(component: string = "NavigationProvider") {
    this.component = component;
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  /**
   * 【機能概要】: デバッグレベルログ（開発環境のみ）
   * 【使用場面】: 詳細な実行フロー追跡
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log("debug", message, context);
    }
  }

  /**
   * 【機能概要】: 情報レベルログ
   * 【使用場面】: 重要な状態変更や操作完了
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * 【機能概要】: 警告レベルログ
   * 【使用場面】: 潜在的な問題や性能劣化の警告
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * 【機能概要】: エラーレベルログ
   * 【使用場面】: 実行時エラーや予期しない状況
   */
  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  /**
   * 【機能概要】: パフォーマンス測定結果のログ出力
   * 【品質向上】: 統一されたパフォーマンス情報表示
   */
  performance(operation: string, duration: number, threshold: number = 50): void {
    const context: LogContext = {
      operation,
      duration: `${duration.toFixed(2)}ms`,
      threshold: `${threshold}ms`,
    };

    if (duration > threshold) {
      this.warn(`Performance threshold exceeded: ${operation}`, context);
    } else if (this.isDevelopment) {
      this.debug(`Performance measurement: ${operation}`, context);
    }
  }

  /**
   * 【機能概要】: ナビゲーション操作の詳細ログ
   * 【品質向上】: ナビゲーション固有の情報構造化
   */
  navigation(
    action: string,
    details: {
      from?: string;
      to?: string;
      duration?: number;
      success: boolean;
      error?: Error;
    }
  ): void {
    const context: LogContext = {
      action,
      ...details,
      timestamp: Date.now(),
    };

    if (details.error) {
      this.error(`Navigation failed: ${action}`, context);
    } else if (details.success) {
      this.debug(`Navigation completed: ${action}`, context);
    } else {
      this.warn(`Navigation issue: ${action}`, context);
    }
  }

  /**
   * 【機能概要】: 内部ログ実装
   * 【品質向上】: 統一されたログフォーマットと出力制御
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: Date.now(),
      component: this.component,
    };

    const formattedMessage = `[${this.component}] ${message}`;

    switch (level) {
      case "debug":
        console.debug(formattedMessage, context);
        break;
      case "info":
        console.info(formattedMessage, context);
        break;
      case "warn":
        console.warn(formattedMessage, context);
        break;
      case "error":
        console.error(formattedMessage, context);
        break;
    }

    // 開発環境では構造化ログをブラウザ拡張機能用に出力
    if (this.isDevelopment && typeof window !== "undefined") {
      (window as any).__NAVIGATION_LOGS__ = (window as any).__NAVIGATION_LOGS__ || [];
      (window as any).__NAVIGATION_LOGS__.push(entry);

      // ログ履歴が100件を超えたら古いものを削除
      if ((window as any).__NAVIGATION_LOGS__.length > 100) {
        (window as any).__NAVIGATION_LOGS__.shift();
      }
    }
  }
}

/**
 * 【機能概要】: デフォルトロガーインスタンス
 * 【使用方法】: import { logger } from './loggerUtils'; logger.debug(...)
 */
export const logger = new NavigationLogger("NavigationProvider");

/**
 * 【機能概要】: カスタムコンポーネント用ロガー作成
 * 【使用例】: const customLogger = createLogger('CustomComponent');
 */
export const createLogger = (component: string): NavigationLogger => {
  return new NavigationLogger(component);
};

export default logger;
