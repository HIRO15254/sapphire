/**
 * 【機能概要】: NavigationProvider モジュールのエクスポート定義
 * 【実装方針】: Refactorフェーズで分離されたコンポーネントの統合エクスポート
 * 【品質向上】: 単一エントリーポイントによる依存関係管理
 * 🟢 信頼性レベル: モジュール設計ベストプラクティスから確認済み
 */

// 型定義の再エクスポート
export type {
  BreadcrumbItem,
  MenuType,
  NavigationAction,
  NavigationConfig,
  NavigationContextValue,
  NavigationProviderProps,
  NavigationState,
  RouteConfig,
} from "../../types/navigation";
// メインコンポーネント
export { NavigationProvider as default, NavigationProvider } from "../NavigationProvider";
// 定数とコンフィグ
export {
  defaultNavigationOptions,
  initialNavigationState,
  performanceThresholds,
  retryConfig,
} from "./constants/initialState";
// カスタムフック
export { createNavigationActions, useNavigationReducer } from "./hooks/useNavigationReducer";
// サブコンポーネントとユーティリティ
export { NavigationErrorBoundary } from "./NavigationErrorBoundary";
// ユーティリティ関数
export {
  createBreadcrumbMemoKey,
  findNavigationItem,
  generateBreadcrumbs,
  getRouteLabel,
  validateBreadcrumbs,
} from "./utils/breadcrumbUtils";
export type {
  LogContext,
  LogEntry,
  LogLevel,
} from "./utils/loggerUtils";
export { createLogger, logger, NavigationLogger } from "./utils/loggerUtils";

export type { PerformanceMetrics } from "./utils/performanceUtils";
export { performanceUtils } from "./utils/performanceUtils";

/**
 * 【機能概要】: 下位互換性のためのレガシーエクスポート
 * 【品質向上】: 段階的移行サポート
 */
export const useNavigationContext = () => {
  // このフックは元のNavigationProvider.tsxに残存
  const { useNavigationContext: originalHook } = require("../NavigationProvider");
  return originalHook();
};

/**
 * 【機能概要】: バンドルサイズ情報（開発用）
 * 【品質監視】: モジュール分割効果の測定
 */
if (process.env.NODE_ENV === "development") {
  console.debug("[NavigationProvider] Refactored module structure:", {
    mainComponent: "NavigationProvider.tsx",
    errorBoundary: "NavigationErrorBoundary.tsx",
    hooks: ["useNavigationReducer.ts"],
    utilities: ["breadcrumbUtils.ts", "performanceUtils.ts", "loggerUtils.ts"],
    constants: ["initialState.ts"],
    totalFiles: 6,
    estimatedSizeReduction: "~40%",
  });
}
