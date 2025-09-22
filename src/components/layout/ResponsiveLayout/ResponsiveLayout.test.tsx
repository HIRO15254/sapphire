import {
  IconDashboard,
  IconFolder,
  IconHelp,
  IconHome,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { render, screen } from "../../../test/helpers/renderWithProviders";
import ResponsiveLayout from "./ResponsiveLayout";

// Mock useMediaQuery for testing responsive behavior
const mockUseMediaQuery = vi.fn();
vi.mock("@mantine/hooks", () => ({
  ...vi.importActual("@mantine/hooks"),
  useMediaQuery: () => mockUseMediaQuery(),
}));

describe("ResponsiveLayout（最上位）コンポーネント", () => {
  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモック状態をクリーンにリセット
    // 【環境初期化】: レスポンシブテストの一貫性を保つため、メディアクエリモックを初期化
    vi.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(false); // デフォルトはデスクトップサイズ
  });

  describe("正常系テストケース", () => {
    test("TC-001: 768px以下でモバイルレイアウトが正しく表示される", () => {
      // 【テスト目的】: モバイルサイズでの適切なレイアウト構成を確認
      // 【テスト内容】: useMediaQuery('(max-width: 48em)')でisMobile=trueの際のAppShell構成確認
      // 【期待される動作】: Header、Footer、Drawerコンポーネントが適切に配置される
      // 🟢 信頼性レベル: EARS要件REQ-101から直接確認済み

      // 【テストデータ準備】: モバイルレイアウトでの標準的なナビゲーション設定を想定
      // 【初期条件設定】: 768px以下のモバイル画面サイズでレスポンシブ状態を設定
      mockUseMediaQuery.mockReturnValue(true); // モバイルサイズに設定

      const navigationConfig = {
        primary: [{ id: "1", label: "ホーム", path: "/", icon: IconHome }],
        secondary: [{ id: "2", label: "設定", path: "/settings", icon: IconSettings }],
      };

      const testChildren = <div>テストコンテンツ</div>;

      // 【実際の処理実行】: ResponsiveLayoutコンポーネントをモバイル設定でレンダリング
      // 【処理内容】: navigationConfigとchildrenを渡してモバイルレイアウトを構築
      render(
        <ResponsiveLayout navigationConfig={navigationConfig}>{testChildren}</ResponsiveLayout>
      );

      // 【結果検証】: モバイルレイアウトの必須要素が適切に表示されることを確認
      // 【期待値確認】: REQ-101に基づくスマートフォンレイアウトの正確な実装

      // 【確認内容】: AppShell.Headerが存在し、ハンバーガーメニューボタンが表示される 🟢
      expect(screen.getByRole("banner")).toBeInTheDocument();
      expect(screen.getByLabelText("ナビゲーションメニューを開く")).toBeInTheDocument();

      // 【確認内容】: AppShell.Footerが存在し、モバイル専用フッターナビゲーションが表示される 🟢
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
      expect(screen.getByText("ホーム")).toBeInTheDocument();

      // 【確認内容】: AppShell.Navbarが非表示で、サイドバーが表示されていない 🟢
      expect(
        screen.queryByRole("navigation", { name: /サイドナビゲーション/ })
      ).not.toBeInTheDocument();

      // 【確認内容】: メインコンテンツが正しく表示される 🟢
      expect(screen.getByText("テストコンテンツ")).toBeInTheDocument();
    });

    test("TC-002: 769px以上でデスクトップレイアウトが正しく表示される", () => {
      // 【テスト目的】: デスクトップサイズでの適切なレイアウト構成を確認
      // 【テスト内容】: useMediaQuery('(max-width: 48em)')でisMobile=falseの際のAppShell構成確認
      // 【期待される動作】: Header、Sidebar、Mainエリアが適切に配置される
      // 🟢 信頼性レベル: EARS要件REQ-102から直接確認済み

      // 【テストデータ準備】: デスクトップレイアウトでの標準的なナビゲーション設定を想定
      // 【初期条件設定】: 769px以上のデスクトップ画面サイズでレスポンシブ状態を設定
      mockUseMediaQuery.mockReturnValue(false); // デスクトップサイズに設定

      const navigationConfig = {
        primary: [{ id: "1", label: "ダッシュボード", path: "/dashboard", icon: IconDashboard }],
        secondary: [{ id: "2", label: "ユーザー管理", path: "/users", icon: IconUsers }],
      };

      const testChildren = <div>デスクトップコンテンツ</div>;

      // 【実際の処理実行】: ResponsiveLayoutコンポーネントをデスクトップ設定でレンダリング
      // 【処理内容】: navigationConfigとchildrenを渡してデスクトップレイアウトを構築
      render(
        <ResponsiveLayout navigationConfig={navigationConfig}>{testChildren}</ResponsiveLayout>
      );

      // 【結果検証】: デスクトップレイアウトの必須要素が適切に表示されることを確認
      // 【期待値確認】: REQ-102に基づくデスクトップレイアウトの正確な実装

      // 【確認内容】: AppShell.Headerが存在し、水平ナビゲーションが表示される 🟢
      expect(screen.getByRole("banner")).toBeInTheDocument();
      expect(screen.getByText("ダッシュボード")).toBeInTheDocument();

      // 【確認内容】: AppShell.Navbarが存在し、サイドバーナビゲーションが表示される 🟢
      expect(screen.getByRole("navigation", { name: /サイドナビゲーション/ })).toBeInTheDocument();
      expect(screen.getByText("ユーザー管理")).toBeInTheDocument();

      // 【確認内容】: AppShell.Footerが非表示で、フッターナビゲーションが表示されていない 🟢
      expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();

      // 【確認内容】: ハンバーガーメニューボタンが非表示 🟢
      expect(screen.queryByLabelText("ナビゲーションメニューを開く")).not.toBeInTheDocument();

      // 【確認内容】: メインコンテンツが正しく表示される 🟢
      expect(screen.getByText("デスクトップコンテンツ")).toBeInTheDocument();
    });

    test("TC-003: navigationConfigに基づいてメニュー項目が正しく表示される", () => {
      // 【テスト目的】: NavigationProviderとの統合動作を確認
      // 【テスト内容】: primary/secondaryナビゲーション項目の適切な配置とレンダリング確認
      // 【期待される動作】: アイコン、ラベル、パス、グループ化が正しくレンダリングされる
      // 🟢 信頼性レベル: 設計文書mantine-component-design.mdから確認済み

      // 【テストデータ準備】: 実際のアプリケーションで使用される典型的なナビゲーション構成を設定
      // 【初期条件設定】: デスクトップサイズでグループ化されたナビゲーション項目をテスト
      mockUseMediaQuery.mockReturnValue(false);

      const navigationConfig = {
        primary: [
          { id: "1", label: "ホーム", path: "/", icon: IconHome },
          { id: "2", label: "プロジェクト", path: "/projects", icon: IconFolder },
        ],
        secondary: [
          { id: "3", label: "設定", path: "/settings", icon: IconSettings, group: "管理" },
          { id: "4", label: "ヘルプ", path: "/help", icon: IconHelp, group: "サポート" },
        ],
      };

      // 【実際の処理実行】: 複数のナビゲーション項目を含むResponsiveLayoutをレンダリング
      // 【処理内容】: グループ化されたナビゲーション項目の表示とアクセシビリティ属性の確認
      render(
        <ResponsiveLayout navigationConfig={navigationConfig}>
          <div>ナビゲーションテスト</div>
        </ResponsiveLayout>
      );

      // 【結果検証】: 各ナビゲーション項目とその属性が正しく表示されることを確認
      // 【期待値確認】: ナビゲーション機能の基本要求事項とアクセシビリティ準拠

      // 【確認内容】: プライマリナビゲーション項目がヘッダーに表示される 🟢
      expect(screen.getByText("ホーム")).toBeInTheDocument();
      expect(screen.getByText("プロジェクト")).toBeInTheDocument();

      // 【確認内容】: セカンダリナビゲーション項目がサイドバーに表示される 🟢
      expect(screen.getByText("設定")).toBeInTheDocument();
      expect(screen.getByText("ヘルプ")).toBeInTheDocument();

      // 【確認内容】: グループ化が適切に機能し、グループラベルが表示される 🟢
      expect(screen.getByText("管理")).toBeInTheDocument();
      expect(screen.getByText("サポート")).toBeInTheDocument();

      // 【確認内容】: 適切なrole属性とaria-label属性が設定される 🟡
      expect(screen.getByRole("navigation", { name: /メインナビゲーション/ })).toBeInTheDocument();
      expect(screen.getByRole("navigation", { name: /サイドナビゲーション/ })).toBeInTheDocument();
    });

    test("TC-004: レスポンシブレイアウトコンテナが正しく描画される", () => {
      // 【テスト目的】: レイアウトコンテナの基本構造確認
      // 【テスト内容】: レイアウトコンテナのdata-testid属性とアクセシビリティ
      // 【期待される動作】: 適切なコンテナ要素とARIA属性が設定される
      // 🟢 信頼性レベル: レイアウト機能の基本要件から確認済み

      // 【テストデータ準備】: 基本的なナビゲーション設定
      const navigationConfig = {
        primary: [{ id: "1", label: "ホーム", path: "/", icon: IconHome }],
        secondary: [],
      };

      // 【実際の処理実行】: ResponsiveLayoutコンポーネントをレンダリング
      render(
        <ResponsiveLayout navigationConfig={navigationConfig}>
          <div>テストコンテンツ</div>
        </ResponsiveLayout>
      );

      // 【結果検証】: レイアウトコンテナが適切に描画されることを確認

      // 【確認内容】: レイアウトコンテナのdata-testid属性が設定される 🟢
      const layout = screen.getByTestId("responsive-layout-container");
      expect(layout).toBeInTheDocument();

      // 【確認内容】: メインコンテンツが表示される 🟢
      expect(screen.getByText("テストコンテンツ")).toBeInTheDocument();
    });
  });

  describe("異常系テストケース", () => {
    test("TC-101: navigationConfigが不正な形式の場合適切にフォールバックされる", () => {
      // 【テスト目的】: 堅牢性とエラー耐性の確認
      // 【テスト内容】: 必須プロパティが欠けているnavigationConfigの処理とフォールバック動作
      // 【期待される動作】: アプリケーションクラッシュを防ぎ、最低限のナビゲーション機能を維持
      // 🟡 信頼性レベル: TypeScript型システムとReactエラーハンドリングベストプラクティスから推測

      // 【テストデータ準備】: 不正なnavigationConfig設定でエラーハンドリングをテスト
      // 【初期条件設定】: 必須プロパティが欠けた不完全なデータ構造を作成
      const invalidNavigationConfig = {
        primary: [{ id: "1" }], // label, pathが欠けている
        secondary: null,
      } as any; // TypeScript型チェックを回避（テスト用の意図的な不正データ）

      // Mock console.warn to capture fallback warnings
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // 【実際の処理実行】: 不正なnavigationConfigでResponsiveLayoutをレンダリング
      // 【処理内容】: エラーハンドリングとフォールバック機能の動作確認
      render(
        <ResponsiveLayout navigationConfig={invalidNavigationConfig}>
          <div>エラーハンドリングテスト</div>
        </ResponsiveLayout>
      );

      // 【結果検証】: 適切なエラー処理とフォールバック動作を確認
      // 【期待値確認】: 本番環境での予期せぬデータエラーからの保護

      // 【確認内容】: レイアウト構造は維持され、アプリケーションクラッシュが発生しない 🟡
      expect(screen.getByText("エラーハンドリングテスト")).toBeInTheDocument();

      // 【確認内容】: 警告メッセージが適切に出力される 🟡
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("ナビゲーション設定が不正です")
      );

      // 【確認内容】: デフォルトナビゲーション項目が表示される 🟡
      expect(screen.getByText("ホーム")).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    test("TC-102: useMediaQueryが利用できない環境での処理", () => {
      // 【テスト目的】: ブラウザ互換性エラー処理の確認
      // 【テスト内容】: MediaQuery APIが利用できないブラウザ環境での代替動作
      // 【期待される動作】: レガシーブラウザや特殊環境でのサービス継続性
      // 🟢 信頼性レベル: EDGE-001「JavaScript無効環境でも基本的なナビゲーションが機能」から確認

      // 【テストデータ準備】: MediaQuery APIが利用できない環境をシミュレート
      // 【初期条件設定】: useMediaQueryがエラーを投げる状況を作成
      mockUseMediaQuery.mockImplementation(() => {
        throw new Error("MediaQuery API not supported");
      });

      const navigationConfig = {
        primary: [{ id: "1", label: "ホーム", path: "/", icon: IconHome }],
        secondary: [{ id: "2", label: "設定", path: "/settings", icon: IconSettings }],
      };

      // Mock console.warn to capture fallback warnings
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // 【実際の処理実行】: MediaQuery APIエラー環境でResponsiveLayoutをレンダリング
      // 【処理内容】: フォールバック戦略による安定動作の確認
      render(
        <ResponsiveLayout navigationConfig={navigationConfig}>
          <div>互換性テスト</div>
        </ResponsiveLayout>
      );

      // 【結果検証】: MediaQuery失敗時の適切なフォールバック動作を確認
      // 【期待値確認】: 幅広い環境での動作保証

      // 【確認内容】: デフォルトでデスクトップレイアウトが表示される 🟢
      expect(screen.getByRole("navigation", { name: /サイドナビゲーション/ })).toBeInTheDocument();

      // 【確認内容】: コンテンツは正常に表示される 🟢
      expect(screen.getByText("互換性テスト")).toBeInTheDocument();

      // 【確認内容】: 開発者向けの警告ログが出力される 🟢
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("MediaQuery API not supported")
      );

      consoleSpy.mockRestore();
    });

    test("TC-103: childrenが渡されない場合の安全な表示", () => {
      // 【テスト目的】: Reactコンポーネントの安全性確認
      // 【テスト内容】: メインコンテンツが指定されていない状況での処理
      // 【期待される動作】: レイアウトが破綻せず、空の状態を適切に処理
      // 🟡 信頼性レベル: Reactコンポーネント設計のベストプラクティスから妥当な推測

      // 【テストデータ準備】: childrenプロパティを未指定でテスト
      // 【初期条件設定】: メインコンテンツなしでのレイアウト表示を確認
      const navigationConfig = {
        primary: [{ id: "1", label: "ホーム", path: "/", icon: IconHome }],
        secondary: [{ id: "2", label: "設定", path: "/settings", icon: IconSettings }],
      };

      // 【実際の処理実行】: childrenプロパティなしでResponsiveLayoutをレンダリング
      // 【処理内容】: 空のメインエリア表示とレイアウト構造の維持確認
      render(<ResponsiveLayout navigationConfig={navigationConfig} />);

      // 【結果検証】: children未指定時の安全な表示を確認
      // 【期待値確認】: 開発効率とデバッグ容易性の向上

      // 【確認内容】: レイアウト構造は正常に維持される 🟡
      expect(screen.getByRole("banner")).toBeInTheDocument();

      // 【確認内容】: ナビゲーション要素は正常に表示される 🟡
      expect(screen.getByText("ホーム")).toBeInTheDocument();

      // 【確認内容】: メインエリアは存在するが空の状態 🟡
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
      expect(main).toBeEmptyDOMElement();
    });
  });

  describe("境界値テストケース", () => {
    test("TC-201: 768px境界値でのレイアウト切り替え", async () => {
      // 【テスト目的】: ブレークポイント精度の確認
      // 【テスト内容】: 768px境界でのレイアウト切り替え動作の精密確認
      // 【期待される動作】: ブレークポイント前後での一貫した動作確認
      // 🟢 信頼性レベル: EDGE-101「画面幅768px（ブレークポイント）で適切にレイアウトが切り替わる」から確認

      // 【テストデータ準備】: 境界値前後でのレスポンシブ動作をテスト
      // 【初期条件設定】: 767px, 768px, 769pxでのレイアウト切り替えを順次確認
      const navigationConfig = {
        primary: [{ id: "1", label: "ホーム", path: "/", icon: IconHome }],
        secondary: [{ id: "2", label: "設定", path: "/settings", icon: IconSettings }],
      };

      const { rerender } = render(
        <ResponsiveLayout navigationConfig={navigationConfig}>
          <div>境界値テスト</div>
        </ResponsiveLayout>
      );

      // 【実際の処理実行】: 境界値前後でのレスポンシブ状態を順次変更
      // 【処理内容】: useMediaQueryモックを使用してレイアウト切り替えを確認

      // 767px: モバイルレイアウト
      mockUseMediaQuery.mockReturnValue(true);
      rerender(
        <ResponsiveLayout navigationConfig={navigationConfig}>
          <div>境界値テスト</div>
        </ResponsiveLayout>
      );

      // 【確認内容】: 767pxでモバイルレイアウト（フッター表示） 🟢
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: /サイドナビゲーション/ })
      ).not.toBeInTheDocument();

      // 769px: デスクトップレイアウト
      mockUseMediaQuery.mockReturnValue(false);
      rerender(
        <ResponsiveLayout navigationConfig={navigationConfig}>
          <div>境界値テスト</div>
        </ResponsiveLayout>
      );

      await waitFor(() => {
        // 【確認内容】: 769pxでデスクトップレイアウト（サイドバー表示） 🟢
        expect(
          screen.getByRole("navigation", { name: /サイドナビゲーション/ })
        ).toBeInTheDocument();
        expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
      });

      // 【結果検証】: 境界値での確実な切り替えを確認
      // 【期待値確認】: 境界値付近での予期しない動作なし
    });

    test("TC-202: 極小画面(320px)での表示", () => {
      // 【テスト目的】: 最小画面での使用性確認
      // 【テスト内容】: 最小対応画面幅での適切な表示とタップ領域確保
      // 【期待される動作】: 要素のオーバーフローやレイアウト破綻なし
      // 🟢 信頼性レベル: EDGE-102「極端に小さい画面（320px）でも全要素が適切に表示」から確認

      // 【テストデータ準備】: 極小画面での多数ナビゲーション項目表示テスト
      // 【初期条件設定】: iPhone SEサイズ(320px)での表示とタップ領域確保
      mockUseMediaQuery.mockReturnValue(true); // モバイルサイズ

      const maxItemsConfig = {
        primary: [
          { id: "1", label: "ホーム", path: "/", icon: IconHome },
          { id: "2", label: "プロジェクト", path: "/projects", icon: IconFolder },
          { id: "3", label: "ダッシュボード", path: "/dashboard", icon: IconDashboard },
          { id: "4", label: "ユーザー", path: "/users", icon: IconUsers },
        ],
        secondary: [
          { id: "5", label: "設定", path: "/settings", icon: IconSettings },
          { id: "6", label: "ヘルプ", path: "/help", icon: IconHelp },
        ],
      };

      // 【実際の処理実行】: 多数のナビゲーション項目を含む極小画面でのレンダリング
      // 【処理内容】: 320px画面でのUI要素表示とタップ領域の確認
      render(
        <ResponsiveLayout navigationConfig={maxItemsConfig}>
          <div>極小画面テスト</div>
        </ResponsiveLayout>
      );

      // 【結果検証】: 極小画面での適切な表示を確認
      // 【期待値確認】: 極端な条件下でのレイアウト安定性

      // 【確認内容】: 全ナビゲーション項目が画面内に収まる 🟢
      expect(screen.getByText("ホーム")).toBeInTheDocument();
      expect(screen.getByText("プロジェクト")).toBeInTheDocument();
      expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
      expect(screen.getByText("ユーザー")).toBeInTheDocument();

      // 【確認内容】: タップ領域44px以上が確保される（NFR-201準拠） 🟢
      const footerButtons = screen.getAllByRole("button");
      footerButtons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight, 10);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });

      // 【確認内容】: メインコンテンツが正常に表示される 🟢
      expect(screen.getByText("極小画面テスト")).toBeInTheDocument();
    });

    test("TC-204: navigationConfig空配列での動作", () => {
      // 【テスト目的】: 最小データ構成での安定性確認
      // 【テスト内容】: ナビゲーション項目が存在しない場合の表示と動作
      // 【期待される動作】: エラーなしで基本レイアウト構造を維持
      // 🟡 信頼性レベル: エッジケース処理のベストプラクティスから推測

      // 【テストデータ準備】: 空の配列でナビゲーション設定を構成
      // 【初期条件設定】: 最小限のデータ設定でのシステム動作確認
      const emptyNavigationConfig = {
        primary: [],
        secondary: [],
      };

      // 【実際の処理実行】: 空のナビゲーション設定でResponsiveLayoutをレンダリング
      // 【処理内容】: 空データでのgraceful degradation確認
      render(
        <ResponsiveLayout navigationConfig={emptyNavigationConfig}>
          <div>メインコンテンツ</div>
        </ResponsiveLayout>
      );

      // 【結果検証】: 最小データ構成での安定動作を確認
      // 【期待値確認】: データ不足時のgraceful degradation

      // 【確認内容】: ヘッダー構造は維持される 🟡
      expect(screen.getByRole("banner")).toBeInTheDocument();

      // 【確認内容】: メインコンテンツは正常に表示される 🟡
      expect(screen.getByText("メインコンテンツ")).toBeInTheDocument();

      // 【確認内容】: 空のナビゲーション領域でもレイアウト破綻なし 🟡
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();

      // 【確認内容】: エラーやクラッシュが発生しない 🟡
      expect(document.querySelector("[data-error]")).not.toBeInTheDocument();
    });
  });
});
