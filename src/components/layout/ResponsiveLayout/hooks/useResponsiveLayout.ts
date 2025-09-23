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
  // 【実装内容】: 992px (62em) 境界での画面サイズ判定、Mantineのmdブレークポイントと統一
  // 【エラーハンドリング】: TC-102対応 - MediaQuery APIが利用できない環境での処理

  // React Hook Rules準拠: useMediaQueryを無条件で呼び出し
  // Mantineのmdブレークポイント(62em = 992px)と統一
  const mediaQueryResult = useMediaQuery("(max-width: 62em)", false, {
    getInitialValueInEffect: false,
  });

  // MediaQuery結果の安全な取得（フォールバック処理）
  const isMobile = mediaQueryResult ?? false;

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

  // 【デバッグ情報】: 開発環境でのレスポンシブ状態ログ（フック呼び出しルール準拠）
  useMemo(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(`📱 Responsive Layout State: ${isMobile ? "Mobile" : "Desktop"}`);
    }
  }, [isMobile]);

  return {
    isMobile,
    hamburgerOpened,
    toggleHamburger,
    closeHamburger,
    isMediaQuerySupported: isSupported,
  };
};

export type UseResponsiveLayoutReturn = ReturnType<typeof useResponsiveLayout>;
