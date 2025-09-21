import type React from "react";

/**
 * ナビゲーション項目の基本型定義
 * 【機能概要】: 単一のナビゲーション項目を表現
 * 【型安全性】: 必須プロパティとオプショナルプロパティの明確な区別
 * 🟢 信頼性レベル: EARS要件REQ-101, REQ-102から直接確認済み
 */
export interface NavigationItem {
  /** ナビゲーション項目の一意識別子 */
  readonly id: string;
  /** 表示ラベル（空文字列不可） */
  readonly label: string;
  /** 遷移先パス */
  readonly path: string;
  /** アイコンコンポーネント（オプション） */
  readonly icon?: React.ComponentType<{ size?: string | number; stroke?: number }>;
  /** グループ名（サイドバーでの分類用） */
  readonly group?: string;
  /** バッジ表示（数値または文字列） */
  readonly badge?: string | number;
  /** 通知の有無を示すフラグ */
  readonly hasNotification?: boolean;
  /** 項目の説明文（ツールチップ等で使用） */
  readonly description?: string;
}

/**
 * ナビゲーション設定の型定義
 * 【機能概要】: プライマリとセカンダリナビゲーションの全体設定
 * 【型安全性】: 読み取り専用配列による不変性保証
 * 🟢 信頼性レベル: 設計文書から確認済み
 */
export interface NavigationConfig {
  /** プライマリナビゲーション項目（ヘッダー/フッター表示） */
  readonly primary: readonly NavigationItem[];
  /** セカンダリナビゲーション項目（サイドバー/ドロワー表示） */
  readonly secondary: readonly NavigationItem[];
}

/**
 * バリデーション済みナビゲーション設定
 * 【機能概要】: フォールバック処理完了後の安全なナビゲーション設定
 * 【型安全性】: 非nullableな配列による実行時安全性
 */
export interface SafeNavigationConfig {
  /** 検証済みプライマリナビゲーション項目 */
  readonly primary: NavigationItem[];
  /** 検証済みセカンダリナビゲーション項目 */
  readonly secondary: NavigationItem[];
}

/**
 * グループ化されたナビゲーション項目
 * 【機能概要】: サイドバー表示用のグループ別項目マップ
 * 【型安全性】: Record型による構造化データ表現
 */
export type GroupedNavigationItems = Record<string, NavigationItem[]>;

/**
 * ナビゲーション項目のバリデーション関数型
 * 【機能概要】: 単一項目の有効性チェック
 * 【型安全性】: type predicateによる型ガード機能
 */
export type NavigationItemValidator = (item: unknown) => item is NavigationItem;

/**
 * ナビゲーション設定のバリデーション結果
 * 【機能概要】: バリデーション処理の結果と詳細情報
 * 【エラーハンドリング】: 詳細なエラー情報の提供
 */
export interface NavigationValidationResult {
  /** バリデーション成功フラグ */
  readonly isValid: boolean;
  /** 検証済み設定（成功時のみ） */
  readonly config?: SafeNavigationConfig;
  /** エラーメッセージ一覧 */
  readonly errors: readonly string[];
  /** 警告メッセージ一覧 */
  readonly warnings: readonly string[];
}
