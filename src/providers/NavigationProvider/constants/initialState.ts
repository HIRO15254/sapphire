/**
 * 【機能概要】: NavigationProvider初期状態定義
 * 【実装方針】: 型安全な初期値設定と設定可能性
 * 【品質向上】: Refactorフェーズで定数の分離と再利用性向上
 * 🟢 信頼性レベル: TypeScript型定義から確認済み
 */

import type { NavigationState } from "../../../types/navigation";

/**
 * 【機能概要】: NavigationProvider の初期状態
 * 【テスト対応】: TC-201-N001 基本統合テスト用
 * 【品質向上】: イミュータブルな初期状態保証
 */
export const initialNavigationState: NavigationState = {
  currentRoute: {
    path: "/",
    params: {},
    search: "",
    hash: "",
  },
  previousRoute: null,
  breadcrumbs: [],
  loadingStates: {
    pageTransition: false,
    dataLoading: false,
  },
  menuStates: {
    hamburger: true, // TC-201-N005: モバイルページ遷移後メニュー自動クローズ用
    side: false,
  },
  pageMetadata: {
    title: "",
    description: "",
    keywords: [],
  },
};

/**
 * 【機能概要】: デフォルト設定値
 * 【品質向上】: 設定オプションの標準化
 */
export const defaultNavigationOptions = {
  enableBreadcrumbs: true,
  enableLoadingStates: true,
  enableRouter: false, // テスト環境では外部Router使用
  performanceThreshold: 50, // ms
  maxBreadcrumbLength: 10,
  logLevel: process.env.NODE_ENV === "development" ? "debug" : "warn",
} as const;

/**
 * 【機能概要】: パフォーマンス閾値設定
 * 【NFR対応】: NFR-004「50ms以内で完了」要件準拠
 */
export const performanceThresholds = {
  breadcrumbGeneration: 50, // ms
  stateUpdate: 10, // ms
  routeChange: 100, // ms
  contextValueConstruction: 5, // ms
  menuToggle: 16, // ms (60fps対応)
} as const;

/**
 * 【機能概要】: エラーリトライ設定
 * 【品質向上】: エラー復旧戦略の標準化
 */
export const retryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  exponentialBackoff: true,
} as const;

export default {
  initialNavigationState,
  defaultNavigationOptions,
  performanceThresholds,
  retryConfig,
};
