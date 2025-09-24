import type { NavigationConfig } from "./NavigationTypes";

/**
 * テーマモードの型定義
 * 【機能概要】: アプリケーションのカラーテーマ設定
 * 【型安全性】: 許可された値のみの受け入れ
 * 🟢 信頼性レベル: Mantineドキュメントから確認済み
 */
export type ThemeMode = "light" | "dark" | "auto";

/**
 * ResponsiveLayoutコンポーネントのプロパティ型定義
 * 【機能概要】: 最上位レイアウトコンポーネントの全設定項目
 * 【型安全性】: 必須・オプション項目の明確な区別とデフォルト値
 * 🟢 信頼性レベル: EARS要件REQ-101, REQ-102から直接確認済み
 */
export interface ResponsiveLayoutProps {
  /** メインコンテンツエリアに表示する子要素 */
  readonly children?: React.ReactNode;
  /** ナビゲーション項目の設定オブジェクト */
  readonly navigationConfig: NavigationConfig;
}

/**
 * レスポンシブレイアウトの状態管理型
 * 【機能概要】: レイアウト制御に必要な状態値の集約
 * 【型安全性】: 読み取り専用プロパティによる状態保護
 */
export interface ResponsiveLayoutState {
  /** モバイルレイアウト判定フラグ */
  readonly isMobile: boolean;
  /** ハンバーガーメニューの開閉状態 */
  readonly hamburgerOpened: boolean;
}

/**
 * レスポンシブレイアウトのコンテキスト型
 * 【機能概要】: 子コンポーネント間での状態共有
 * 【型安全性】: アクション関数の型定義による実行時安全性
 */
export interface ResponsiveLayoutContext extends ResponsiveLayoutState {
  /** ハンバーガーメニューの開閉切り替え */
  readonly toggleHamburger: () => void;
  /** ハンバーガーメニューの強制クローズ */
  readonly closeHamburger: () => void;
}

/**
 * ブレークポイント設定の型定義
 * 【機能概要】: レスポンシブデザインの境界値設定
 * 【型安全性】: CSS単位文字列の明示的型定義
 */
export interface BreakpointConfig {
  /** エクストラスモール（~575px） */
  readonly xs: string;
  /** スモール（576px~767px） */
  readonly sm: string;
  /** ミディアム（768px~991px） */
  readonly md: string;
  /** ラージ（992px~1199px） */
  readonly lg: string;
  /** エクストララージ（1200px~） */
  readonly xl: string;
}

/**
 * レイアウト設定の型定義
 * 【機能概要】: AppShellのレイアウト構成設定
 * 【型安全性】: 各エリアの高さ・幅設定の構造化
 */
export interface LayoutConfiguration {
  /** ヘッダーエリアの設定 */
  readonly header: {
    /** 高さ設定（ブレークポイント別） */
    readonly height: Partial<Record<keyof BreakpointConfig | "base", number>>;
  };
  /** ナビゲーションエリアの設定 */
  readonly navbar: {
    /** 幅設定（ブレークポイント別） */
    readonly width: Partial<Record<keyof BreakpointConfig | "base", number>>;
    /** ブレークポイント */
    readonly breakpoint: keyof BreakpointConfig;
    /** 折りたたみ設定 */
    readonly collapsed: {
      readonly mobile: boolean;
      readonly desktop: boolean;
    };
  };
  /** フッターエリアの設定 */
  readonly footer: {
    /** 高さ設定（ブレークポイント別） */
    readonly height: Partial<Record<keyof BreakpointConfig | "base", number>>;
    /** 折りたたみ設定 */
    readonly collapsed: {
      readonly mobile: boolean;
      readonly desktop: boolean;
    };
  };
  /** パディング設定 */
  readonly padding: Partial<Record<keyof BreakpointConfig | "base", string>>;
}
