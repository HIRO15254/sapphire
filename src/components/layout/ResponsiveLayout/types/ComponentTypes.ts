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
}
