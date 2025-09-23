/**
 * 【機能概要】: NavigationProvider専用エラーバウンダリ
 * 【実装方針】: 包括的エラー処理と自動復旧機能
 * 【品質向上】: Refactorフェーズで分離・強化されたエラーハンドリング
 * 🟢 信頼性レベル: React ErrorBoundary APIから確認済み
 */

import React from "react";
import { retryConfig } from "./constants/initialState";
import { logger } from "./utils/loggerUtils";

export interface NavigationErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
}

export interface NavigationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  retryCount: number;
  lastErrorTime: number;
}

/**
 * 【機能概要】: エラーID生成
 * 【品質向上】: 一意なエラー識別子でデバッグ支援
 */
const generateErrorId = (): string => {
  return `nav-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 【機能概要】: 高度なエラーバウンダリコンポーネント
 * 【品質向上】: 自動復旧、エラー報告、詳細ログ機能
 * 【テスト対応】: TC-201-E001エラー処理要件準拠
 */
export class NavigationErrorBoundary extends React.Component<
  NavigationErrorBoundaryProps,
  NavigationErrorBoundaryState
> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: NavigationErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      lastErrorTime: 0,
    };
  }

  /**
   * 【機能概要】: エラー発生時の状態更新
   * 【品質向上】: エラー情報の構造化と一意ID付与
   */
  static getDerivedStateFromError(error: Error): Partial<NavigationErrorBoundaryState> {
    const errorId = generateErrorId();
    const now = Date.now();

    logger.error("Navigation error caught by boundary", {
      error: error.message,
      stack: error.stack,
      errorId,
      timestamp: now,
    });

    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: now,
    };
  }

  /**
   * 【機能概要】: エラー詳細情報の処理と報告
   * 【品質向上】: 包括的エラー情報収集と外部報告
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { onError } = this.props;
    const { errorId, retryCount } = this.state;

    const enhancedContext = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: "NavigationErrorBoundary",
      retryCount,
      errorId,
      timestamp: Date.now(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    };

    logger.error("Navigation component error details", enhancedContext);

    // カスタムエラーハンドラの実行
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        logger.error("Error in custom error handler", { handlerError });
      }
    }

    // 本番環境でのエラー報告
    if (process.env.NODE_ENV === "production") {
      this.reportErrorToService(error, enhancedContext);
    }
  }

  /**
   * 【機能概要】: 外部エラー監視サービスへの報告
   * 【品質向上】: プロダクション環境での障害監視
   */
  private async reportErrorToService(
    _error: Error,
    context: {
      error: string;
      stack?: string;
      componentStack: string;
      errorBoundary: string;
      retryCount: number;
      errorId?: string;
      timestamp: number;
      userAgent: string;
      url: string;
    }
  ): Promise<void> {
    try {
      // 実際のエラー報告サービス統合ポイント
      // 例: Sentry, Bugsnag, LogRocket など
      logger.info("Error reported to monitoring service", {
        errorId: context.errorId,
        service: "placeholder",
      });
    } catch (reportError) {
      logger.warn("Failed to report error to service", { reportError });
    }
  }

  /**
   * 【機能概要】: 自動リトライ処理
   * 【品質向上】: 指数バックオフによる適応的リトライ
   */
  private handleRetry = (): void => {
    const { enableRetry = true, maxRetries = retryConfig.maxRetries } = this.props;
    const { retryCount, errorId } = this.state;

    if (!enableRetry || retryCount >= maxRetries) {
      logger.warn("Retry not available", { retryCount, maxRetries, enableRetry });
      return;
    }

    logger.info("Attempting error recovery", {
      retryCount,
      errorId,
      maxRetries,
    });

    // 指数バックオフによる遅延
    const delay = retryConfig.retryDelay * 2 ** retryCount;

    const timeout = setTimeout(() => {
      this.setState((prevState) => ({
        hasError: false,
        error: undefined,
        errorId: undefined,
        retryCount: prevState.retryCount + 1,
      }));
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  /**
   * 【機能概要】: ページリロード処理
   * 【品質向上】: 最終手段としての完全リセット
   */
  private handleReload = (): void => {
    const { errorId, retryCount } = this.state;

    logger.info("Full page reload requested", {
      errorId,
      retryCount,
      reason: "user_action",
    });

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  /**
   * 【機能概要】: コンポーネントアンマウント時のクリーンアップ
   * 【品質向上】: メモリリーク防止
   */
  componentWillUnmount(): void {
    // タイムアウトのクリーンアップ
    this.retryTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.retryTimeouts = [];
  }

  /**
   * 【機能概要】: エラー状態のレンダリング
   * 【品質向上】: ユーザーフレンドリーなエラー表示
   */
  render(): React.ReactNode {
    const { children, fallback } = this.props;
    const { hasError, retryCount, errorId, error } = this.state;

    if (hasError) {
      const maxRetries = this.props.maxRetries || retryConfig.maxRetries;
      const canRetry = this.props.enableRetry !== false && retryCount < maxRetries;

      // カスタムフォールバックUIが提供されている場合
      if (fallback) {
        return fallback;
      }

      // デフォルトエラーUI
      return (
        <div data-testid="navigation-error-fallback" className="navigation-error-boundary">
          <div className="error-content">
            <h2>ナビゲーションエラーが発生しました</h2>
            <p>申し訳ありませんが、ナビゲーション機能でエラーが発生しました。</p>

            {/* 開発環境でのエラー詳細表示 */}
            {process.env.NODE_ENV === "development" && (
              <details className="error-details">
                <summary>エラー詳細 (開発モード)</summary>
                <div className="error-info">
                  <p>
                    <strong>Error ID:</strong> {errorId}
                  </p>
                  <p>
                    <strong>Retry Count:</strong> {retryCount}
                  </p>
                  <p>
                    <strong>Error:</strong> {error?.message}
                  </p>
                  {error?.stack && <pre className="error-stack">{error.stack}</pre>}
                </div>
              </details>
            )}

            {/* アクションボタン */}
            <div className="error-actions">
              {canRetry && (
                <button
                  type="button"
                  onClick={this.handleRetry}
                  data-testid="retry-button"
                  className="retry-button"
                >
                  再試行 ({maxRetries - retryCount}回まで可能)
                </button>
              )}
              <button
                type="button"
                onClick={this.handleReload}
                data-testid="reload-button"
                className="reload-button"
              >
                ページを再読み込み
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default NavigationErrorBoundary;
