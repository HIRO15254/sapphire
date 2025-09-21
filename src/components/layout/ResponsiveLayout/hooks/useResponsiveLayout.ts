import { useMediaQuery } from "@mantine/hooks";
import { useCallback, useMemo, useState } from "react";
import { isMediaQuerySupported } from "../utils/validation";

/**
 * レスポンシブレイアウトのロジックを管理するカスタムフック
 * 【機能概要】: モバイル/デスクトップ判定とハンバーガーメニュー状態管理
 * 【実装方針】: MediaQuery API失敗時のフォールバック機能付き
 * 【パフォーマンス】: useCallback でメモ化されたイベントハンドラー
 * 【エラーハンドリング】: 詳細なブラウザサポート検出と安全なフォールバック
 * 🟢 信頼性レベル: EARS要件REQ-101, REQ-102から直接確認済み
 */
export const useResponsiveLayout = () => {
  // 【ブラウザサポート検証】: MediaQuery APIの利用可能性を事前チェック
  const isSupported = useMemo(() => isMediaQuerySupported(), []);

  // 【レスポンシブ検知】: useMediaQueryでモバイル/デスクトップ判定を実行 🟢
  // 【実装内容】: 768px (48em) 境界での画面サイズ判定、TC-001, TC-002テスト対応
  // 【エラーハンドリング】: TC-102対応 - MediaQuery APIが利用できない環境での処理
  let isMobile = false;

  if (isSupported) {
    try {
      isMobile = useMediaQuery("(max-width: 48em)");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("MediaQuery hook failed:", error);
      } else {
        console.warn("MediaQuery API not supported");
      }
      // フォールバック: デスクトップレイアウトをデフォルトとする
      isMobile = false;
    }
  } else {
    // MediaQuery APIが利用できない環境でのフォールバック
    if (process.env.NODE_ENV === "development") {
      console.warn("MediaQuery API not supported in this environment");
    } else {
      console.warn("MediaQuery API not supported");
    }
    isMobile = false;
  }

  // 【状態管理】: ハンバーガーメニューの開閉状態を管理 🟢
  // 【実装内容】: モバイルレイアウトでのDrawer表示制御、TC-001テスト対応
  const [hamburgerOpened, setHamburgerOpened] = useState(false);

  // 【パフォーマンス最適化】: メモ化されたイベントハンドラー
  const toggleHamburger = useCallback(() => {
    setHamburgerOpened((prev) => !prev);
  }, []);

  const closeHamburger = useCallback(() => {
    setHamburgerOpened(false);
  }, []);

  // 【デバッグ情報】: 開発環境でのレスポンシブ状態ログ
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMemo(() => {
      console.log(`📱 Responsive Layout State: ${isMobile ? "Mobile" : "Desktop"}`);
    }, [isMobile]);
  }

  return {
    isMobile,
    hamburgerOpened,
    toggleHamburger,
    closeHamburger,
    isMediaQuerySupported: isSupported,
  };
};

export type UseResponsiveLayoutReturn = ReturnType<typeof useResponsiveLayout>;
