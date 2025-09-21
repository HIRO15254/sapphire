import type { GroupedNavigationItems, NavigationItem } from "./NavigationTypes";

/**
 * ヘッダーナビゲーションコンポーネントのプロパティ型
 * 【機能概要】: ヘッダー領域のナビゲーション表示制御
 * 【型安全性】: イベントハンドラーの明示的型定義
 * 🟢 信頼性レベル: コンポーネント設計から確認済み
 */
export interface HeaderNavigationProps {
  /** 表示するナビゲーション項目一覧 */
  readonly items: readonly NavigationItem[];
  /** モバイルレイアウト判定フラグ */
  readonly isMobile: boolean;
  /** ハンバーガーメニューの開閉状態 */
  readonly hamburgerOpened: boolean;
  /** ハンバーガーメニュー開閉イベントハンドラー */
  readonly onHamburgerToggle: () => void;
}

/**
 * サイドナビゲーションコンポーネントのプロパティ型
 * 【機能概要】: サイドバー領域のナビゲーション表示制御
 * 【型安全性】: グループ化データの構造化型定義
 * 🟢 信頼性レベル: コンポーネント設計から確認済み
 */
export interface SideNavigationProps {
  /** 表示するナビゲーション項目一覧 */
  readonly items: readonly NavigationItem[];
  /** グループ化されたナビゲーション項目 */
  readonly groupedItems: GroupedNavigationItems;
}

/**
 * フッターナビゲーションコンポーネントのプロパティ型
 * 【機能概要】: フッター領域のナビゲーション表示制御
 * 【型安全性】: 読み取り専用配列による不変性保証
 * 🟢 信頼性レベル: コンポーネント設計から確認済み
 */
export interface FooterNavigationProps {
  /** 表示するナビゲーション項目一覧（最大5項目まで） */
  readonly items: readonly NavigationItem[];
}

/**
 * ハンバーガーメニューコンポーネントのプロパティ型
 * 【機能概要】: モバイル用ドロワーメニューの表示制御
 * 【型安全性】: イベントハンドラーの明示的型定義
 * 🟢 信頼性レベル: コンポーネント設計から確認済み
 */
export interface HamburgerMenuProps {
  /** 表示するナビゲーション項目一覧 */
  readonly items: readonly NavigationItem[];
  /** ドロワーの開閉状態 */
  readonly opened: boolean;
  /** ドロワークローズイベントハンドラー */
  readonly onClose: () => void;
}

/**
 * ナビゲーション項目のスタイル設定型
 * 【機能概要】: 各ナビゲーション項目の見た目カスタマイズ
 * 【型安全性】: CSS-in-JSスタイルオブジェクトの型定義
 */
export interface NavigationItemStyles {
  /** ルート要素のスタイル */
  readonly root?: React.CSSProperties;
  /** ラベル要素のスタイル */
  readonly label?: React.CSSProperties;
  /** 左アイコンのスタイル */
  readonly leftSection?: React.CSSProperties;
  /** 右セクションのスタイル */
  readonly rightSection?: React.CSSProperties;
}

/**
 * ナビゲーション項目のバリアント型
 * 【機能概要】: 事前定義されたスタイルバリエーション
 * 【型安全性】: Mantineサポート済みバリアントのみ許可
 */
export type NavigationItemVariant =
  | "filled"
  | "light"
  | "outline"
  | "subtle"
  | "transparent"
  | "white"
  | "default";

/**
 * アクセシビリティ属性の型定義
 * 【機能概要】: WAI-ARIA準拠のアクセシビリティ設定
 * 【型安全性】: ARIA属性の明示的型定義
 */
export interface AccessibilityProps {
  /** ARIA ラベル */
  readonly "aria-label"?: string;
  /** ARIA 説明参照 */
  readonly "aria-describedby"?: string;
  /** ARIA 展開状態 */
  readonly "aria-expanded"?: boolean;
  /** ARIA 制御対象 */
  readonly "aria-controls"?: string;
  /** ARIA 現在状態 */
  readonly "aria-current"?: "page" | "step" | "location" | "date" | "time" | boolean;
}

/**
 * タップ領域の最小サイズ設定
 * 【機能概要】: アクセシビリティガイドライン準拠のタップ領域確保
 * 【型安全性】: 数値による明示的サイズ指定
 * 🟢 信頼性レベル: WCAG 2.1 AA基準から確認済み
 */
export interface TapTargetSize {
  /** 最小幅（px） */
  readonly minWidth: number;
  /** 最小高さ（px） */
  readonly minHeight: number;
}

/**
 * コンポーネント共通プロパティ型
 * 【機能概要】: 全ナビゲーションコンポーネント共通の設定項目
 * 【型安全性】: 共通インターフェースの統一
 */
export interface BaseComponentProps {
  /** CSS クラス名 */
  readonly className?: string;
  /** インラインスタイル */
  readonly style?: React.CSSProperties;
  /** テストID（テスト用途） */
  readonly "data-testid"?: string;
  /** アクセシビリティ属性 */
  readonly accessibility?: AccessibilityProps;
  /** タップ領域サイズ設定 */
  readonly tapTargetSize?: TapTargetSize;
}
