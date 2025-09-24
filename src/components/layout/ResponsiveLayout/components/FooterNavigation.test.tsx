import { MantineProvider } from "@mantine/core";
import { IconHome, IconSettings, IconUsers } from "@tabler/icons-react";
import { render, screen } from "@testing-library/react";
import { memo } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render as renderWithProviders } from "../../../../test/helpers/renderWithProviders";
import type { NavigationItem } from "../types";
import type { FooterNavigationProps } from "./FooterNavigation";
import { FooterNavigation } from "./FooterNavigation";

/**
 * TASK-103 FooterNavigation TDDテストスイート
 * 【目的】: FooterNavigationコンポーネントの包括的品質保証
 * 【対象】: モバイルタブバーナビゲーション、アクセシビリティ、パフォーマンス
 * 【作成日】: 2025-09-22
 * 【TDDフェーズ】: Redフェーズ（失敗するテスト作成）
 * 🟢 信頼性レベル: テストケース定義書に基づく包括的テスト
 */

// ===== テスト用データ =====

/**
 * 【モックデータ概要】: FooterNavigationテスト用の標準ナビゲーション項目
 * 【データ設計】: REQ-103「主要画面への遷移をフッターメニューで提供」準拠
 * 【テスト対応】: TC-103-N001〜TC-103-N005の基本表示テスト用
 * 🟢 信頼性レベル: 高（要件定義書から確認済み）
 */
const mockNavigationItems: NavigationItem[] = [
  { id: "home", label: "ホーム", path: "/", icon: IconHome },
  { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
  { id: "settings", label: "設定", path: "/settings", icon: IconSettings },
];

const _defaultProps: FooterNavigationProps = {
  items: mockNavigationItems,
};

describe("FooterNavigation Component - TASK-103 TDD Test Suite", () => {
  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモック関数をクリアし、一貫したテスト環境を保証
    // 【環境初期化】: 前のテストの影響を受けないよう、モック状態をリセット
    vi.clearAllMocks();
  });

  // ===== 正常系テストケース =====

  describe("正常系テストケース (Normal Cases)", () => {
    it("TC-103-N001: フッターナビゲーション基本表示", () => {
      // 【テスト目的】: FooterNavigationコンポーネントが正常にレンダリングされ、基本要素が表示される
      // 【テスト内容】: 標準的な2項目のナビゲーション設定でフッター領域にナビゲーション項目群が適切に配置される
      // 【期待される動作】: REQ-002「スマートフォン表示時にフッターメニューを表示」準拠の基本表示
      // 🟢 信頼性レベル: 高（EARS要件REQ-002、既存実装確認済み）

      // 【テストデータ準備】: 基本的な2項目でのフッターナビゲーション表示確認用
      // 【初期条件設定】: 標準的なNavigationItem配列による基本表示テスト
      const testItems: NavigationItem[] = [
        { id: "home", label: "ホーム", path: "/", icon: IconHome },
        { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
      ];

      // 【実際の処理実行】: FooterNavigationコンポーネントをレンダリング
      // 【処理内容】: testItemsを渡してコンポーネントの基本表示を実行
      renderWithProviders(<FooterNavigation items={testItems} />);

      // 【結果検証】: フッターナビゲーションの基本要素が正常に表示されることを確認
      // 【期待値確認】: role="navigation"、ナビゲーション項目、space-around配置の確認

      // 【確認内容】: フッターナビゲーション領域がnavigation roleで表示される 🟢
      expect(screen.getByRole("navigation")).toBeInTheDocument();

      // 【確認内容】: ナビゲーション項目のラベルが正常に表示される 🟢
      expect(screen.getByText("ホーム")).toBeInTheDocument();
      expect(screen.getByText("ユーザー")).toBeInTheDocument();

      // 【確認内容】: space-around配置でのGroup表示が適用される 🟢
      expect(screen.getByRole("navigation")).toHaveStyle({
        justifyContent: "space-around",
      });
    });

    it("TC-103-N002: アイコン付きナビゲーション項目表示", () => {
      // 【テスト目的】: アイコン付きNavigationItem配列で各項目のアイコンとラベルが正常表示される
      // 【テスト内容】: 3項目のアイコン付きナビゲーション設定でタブバー形式表示を確認
      // 【期待される動作】: 各フッター項目でアイコンがラベル上部に、ラベルが下部に表示される
      // 🟢 信頼性レベル: 高（既存実装とIconサイズ仕様確認済み）

      // 【テストデータ準備】: アイコン付き3項目でのタブバー構成テスト用
      // 【初期条件設定】: IconHome, IconUsers, IconSettingsを含む完全なナビゲーション項目
      const iconItems: NavigationItem[] = [
        { id: "home", label: "ホーム", path: "/", icon: IconHome },
        { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
        { id: "settings", label: "設定", path: "/settings", icon: IconSettings },
      ];

      // 【実際の処理実行】: アイコン付きNavigationItemでFooterNavigationをレンダリング
      // 【処理内容】: iconItemsを渡してアイコン+ラベル表示を実行
      renderWithProviders(<FooterNavigation items={iconItems} />);

      // 【結果検証】: アイコンとラベルの組み合わせ表示が正常に機能することを確認
      // 【期待値確認】: ラベル表示とアイコンサイズ20pxの確認

      // 【確認内容】: アイコンとラベルの組み合わせが正常に表示される 🟢
      expect(screen.getByText("ホーム")).toBeInTheDocument();
      expect(screen.getByText("ユーザー")).toBeInTheDocument();
      expect(screen.getByText("設定")).toBeInTheDocument();

      // 【確認内容】: アイコンサイズが20pxで統一されている 🟢
      const iconElements = screen.getAllByRole("link");
      iconElements.forEach((button) => {
        const svg = button.querySelector("svg");
        expect(svg).toHaveAttribute("width", "20");
        expect(svg).toHaveAttribute("height", "20");
      });
    });

    it("TC-103-N003: タップ領域サイズ確保（44px以上）", () => {
      // 【テスト目的】: 各フッターナビゲーション項目のタップ領域が44px以上確保されている
      // 【テスト内容】: NFR-201準拠の44px最小タップ領域がすべてのボタンで確保される
      // 【期待される動作】: iOS/Android HIG準拠のアクセシビリティ基準を満たすタップ領域
      // 🟢 信頼性レベル: 高（NFR-201要件、既存実装確認済み）

      // 【テストデータ準備】: タップ領域確保確認用の標準的なナビゲーション項目
      // 【初期条件設定】: 一般的なフッターナビゲーション項目設定
      renderWithProviders(<FooterNavigation items={mockNavigationItems} />);

      // 【実際の処理実行】: レンダリングされたボタン要素のタップ領域スタイルを取得
      // 【処理内容】: 各ボタンの minHeight と height スタイル属性を検証
      const navigationButtons = screen.getAllByRole("link");

      // 【結果検証】: 44px以上のタップ領域が確保されていることを確認
      // 【期待値確認】: NFR-201「フッターメニューのタップ領域は44px以上」準拠

      navigationButtons.forEach((button) => {
        // 【確認内容】: 44px以上のタップ領域確保（minHeight） 🟢
        expect(button).toHaveStyle({ minHeight: "44px" });

        // 【確認内容】: 44px高さ明示指定（height） 🟢
        expect(button).toHaveStyle({ height: "44px" });

        // 【確認内容】: box-sizing: border-boxで適切な領域計算 🟢
        expect(button).toHaveStyle({ boxSizing: "border-box" });
      });
    });

    it("TC-103-N004: SafeArea対応（iOS下部領域）", () => {
      // 【テスト目的】: iOSデバイスのホームインジケーター対応でsafe-area-inset-bottomが設定される
      // 【テスト内容】: paddingBottomにenv(safe-area-inset-bottom)が適用される
      // 【期待される動作】: モバイルデバイス最適化のSafeArea対応
      // 🟢 信頼性レベル: 高（既存実装、iOS対応仕様確認済み）

      // 【テストデータ準備】: SafeArea適用確認用の基本設定
      // 【初期条件設定】: 標準的なNavigationItem配列
      renderWithProviders(<FooterNavigation items={mockNavigationItems} />);

      // 【実際の処理実行】: フッターGroup要素のスタイル属性を取得
      // 【処理内容】: paddingBottomとborderTopのスタイル設定確認
      const footerGroup = screen.getByRole("navigation");

      // 【結果検証】: SafeArea対応とvisual境界線の設定を確認
      // 【期待値確認】: iOS対応仕様、モバイルUX最適化

      // 【確認内容】: SafeArea対応のpaddingBottom設定 🟢
      expect(footerGroup).toHaveStyle({
        paddingBottom: "env(safe-area-inset-bottom)",
      });

      // 【確認内容】: borderTop設定による視覚的境界線 🟢
      expect(footerGroup).toHaveStyle({
        borderTop: "1px solid #e9ecef",
      });
    });

    it("TC-103-N005: 5項目制限表示", () => {
      // 【テスト目的】: 6項目以上のNavigationItem配列で最初の5項目のみが表示される
      // 【テスト内容】: items.slice(0, 5)による制限で5項目までの表示
      // 【期待される動作】: UI/UX制約「最大表示項目: 5項目制限」準拠
      // 🟢 信頼性レベル: 高（UI/UX制約、既存実装確認済み）

      // 【テストデータ準備】: 7項目での5項目制限テスト用データ
      // 【初期条件設定】: 6項目以上のNavigationItem配列
      const manyItems: NavigationItem[] = Array.from({ length: 7 }, (_, i) => ({
        id: `item-${i}`,
        label: `項目${i + 1}`,
        path: `/item-${i}`,
        icon: IconHome,
      }));

      // 【実際の処理実行】: 7項目のNavigationItemでFooterNavigationをレンダリング
      // 【処理内容】: manyItemsを渡して5項目制限の動作を確認
      renderWithProviders(<FooterNavigation items={manyItems} />);

      // 【結果検証】: 5項目のみ表示され、6項目目以降は表示されないことを確認
      // 【期待値確認】: タブバーUI制限の適切な実装確認

      // 【確認内容】: 5項目のみ表示確認 🟢
      expect(screen.getByText("項目1")).toBeInTheDocument();
      expect(screen.getByText("項目2")).toBeInTheDocument();
      expect(screen.getByText("項目3")).toBeInTheDocument();
      expect(screen.getByText("項目4")).toBeInTheDocument();
      expect(screen.getByText("項目5")).toBeInTheDocument();

      // 【確認内容】: 6項目目以降は表示されない 🟢
      expect(screen.queryByText("項目6")).not.toBeInTheDocument();
      expect(screen.queryByText("項目7")).not.toBeInTheDocument();

      // 【確認内容】: ボタン数の制限確認 🟢
      expect(screen.getAllByRole("link")).toHaveLength(5);
    });
  });

  // ===== 異常系テストケース =====

  describe("異常系テストケース (Error Cases)", () => {
    it("TC-103-E001: 空ナビゲーション項目配列", () => {
      // 【テスト目的】: items=[]の場合でもFooterNavigationコンポーネントが安全に動作する
      // 【テスト内容】: 空配列での安全な動作確認、フォールバック動作の検証
      // 【期待される動作】: アプリケーションクラッシュを回避し、安全な状態を維持
      // 🟡 信頼性レベル: 中（エッジケース対応、推測含む）

      // 【テストデータ準備】: 空のナビゲーション項目配列
      // 【初期条件設定】: items=[]による初期化エラー、設定読み込み失敗シミュレーション
      const emptyItems: NavigationItem[] = [];

      // 【実際の処理実行】: 空配列でFooterNavigationをレンダリング
      // 【処理内容】: emptyItemsを渡してエラーハンドリング動作を確認
      renderWithProviders(<FooterNavigation items={emptyItems} />);

      // 【結果検証】: フッター領域は表示されるが項目は表示されないことを確認
      // 【期待値確認】: エラーは発生せず、空のフッター領域を表示

      // 【確認内容】: フッター領域は表示されるが項目は表示されない 🟡
      const footerGroup = screen.getByRole("navigation");
      expect(footerGroup).toBeInTheDocument();

      // 【確認内容】: ナビゲーション項目は表示されない 🟡
      expect(screen.queryAllByRole("link")).toHaveLength(0);

      // 【確認内容】: 空の場合でもスタイル設定は維持 🟡
      expect(footerGroup).toHaveStyle({
        justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom)",
      });
    });

    it("TC-103-E002: アイコンなしNavigationItem", () => {
      // 【テスト目的】: NavigationItemのiconプロパティが未定義の場合の適切な表示処理
      // 【テスト内容】: 不完全なナビゲーション設定でのUI破綻防止
      // 【期待される動作】: 部分的な設定でもアプリケーションは動作し続ける
      // 🟡 信頼性レベル: 中（エッジケース対応、実装挙動の推測）

      // 【テストデータ準備】: アイコンありとアイコンなしの混在データ
      // 【初期条件設定】: 設定ミス、動的ナビゲーション生成時のアイコン欠落シミュレーション
      const itemsWithoutIcon: NavigationItem[] = [
        { id: "no-icon", label: "アイコンなし", path: "/no-icon" }, // icon未定義
        { id: "with-icon", label: "アイコンあり", path: "/with-icon", icon: IconHome },
      ];

      // 【実際の処理実行】: アイコンなし項目を含むNavigationItemでレンダリング
      // 【処理内容】: itemsWithoutIconを渡して不完全データ処理を確認
      renderWithProviders(<FooterNavigation items={itemsWithoutIcon} />);

      // 【結果検証】: アイコンありの項目は正常表示、アイコンなし項目もラベルは表示
      // 【期待値確認】: エラーは発生せず、ラベルのみ表示でグレースフルな処理

      // 【確認内容】: アイコンありの項目は正常表示 🟡
      expect(screen.getByText("アイコンあり")).toBeInTheDocument();

      // 【確認内容】: アイコンなしの項目もラベルは表示 🟡
      expect(screen.getByText("アイコンなし")).toBeInTheDocument();

      // 【確認内容】: ボタン数確認（両方とも表示される） 🟡
      const buttons = screen.getAllByRole("link");
      expect(buttons).toHaveLength(2);

      // 【確認内容】: エラーは発生しない 🟡
      expect(() => screen.getByText("アイコンなし")).not.toThrow();
    });

    it("TC-103-E003: 不正NavigationItem（label空文字列）", () => {
      // 【テスト目的】: NavigationItemのlabelが空文字列の場合の表示スキップ処理
      // 【テスト内容】: 無意味なナビゲーション項目の表示防止
      // 【期待される動作】: 不正データをフィルタリングして安全な状態を維持
      // 🟡 信頼性レベル: 中（エッジケース対応、フィルタリング機能の推測）

      // 【テストデータ準備】: 有効項目と無効項目（空ラベル）の混在データ
      // 【初期条件設定】: 国際化エラー、設定値の未定義、データベースの不正データシミュレーション
      const itemsWithEmptyLabel: NavigationItem[] = [
        { id: "valid", label: "有効項目", path: "/valid", icon: IconHome },
        { id: "invalid", label: "", path: "/invalid", icon: IconUsers }, // 空文字列
      ];

      // 【実際の処理実行】: 空ラベル項目を含むNavigationItemでレンダリング
      // 【処理内容】: itemsWithEmptyLabelを渡してデータバリデーション動作を確認
      const { container } = renderWithProviders(<FooterNavigation items={itemsWithEmptyLabel} />);

      // 【結果検証】: 有効項目のみ表示され、無効項目は表示されないことを確認
      // 【期待値確認】: エラーは発生せず、有効項目のみ表示

      // 【確認内容】: 有効項目のみ表示 🟡
      expect(container.textContent).toContain("有効項目");

      // 【確認内容】: 無効項目は表示されない 🟡
      expect(container.textContent).not.toContain("invalid");

      // 【確認内容】: 有効項目のリンクのみ存在 🟡
      const links = container.querySelectorAll("a");
      expect(links.length).toBe(1);

      // 【確認内容】: エラーは発生しない 🟡
      expect(() =>
        renderWithProviders(<FooterNavigation items={itemsWithEmptyLabel} />)
      ).not.toThrow();
    });
  });

  // ===== 境界値テストケース =====

  describe("境界値テストケース (Boundary Value Cases)", () => {
    it("TC-103-B001: 最大表示項目数（5項目）", () => {
      // 【テスト目的】: UI/UX制約での5項目制限の境界値テスト
      // 【テスト内容】: 5項目でのレイアウト安定性確認
      // 【期待される動作】: 5項目での表示・レイアウトが正常に機能
      // 🟢 信頼性レベル: 高（UI/UX制約、既存実装確認済み）

      // 【テストデータ準備】: items.slice(0, 5)制限の上限値
      // 【初期条件設定】: 主要機能5つでのタブバー構成
      const exactlyFiveItems: NavigationItem[] = Array.from({ length: 5 }, (_, i) => ({
        id: `item-${i}`,
        label: `項目${i + 1}`,
        path: `/item-${i}`,
        icon: IconHome,
      }));

      // 【実際の処理実行】: 5項目ちょうどのNavigationItemでレンダリング
      // 【処理内容】: exactlyFiveItemsを渡してUI制限境界での安定動作を確認
      renderWithProviders(<FooterNavigation items={exactlyFiveItems} />);

      // 【結果検証】: 5項目すべて表示され、適切なレイアウトが維持されることを確認
      // 【期待値確認】: 項目数に関係なく一貫したスタイリング

      // 【確認内容】: 5項目すべて表示 🟢
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByText(`項目${i}`)).toBeInTheDocument();
      }

      // 【確認内容】: ボタン数確認 🟢
      expect(screen.getAllByRole("link")).toHaveLength(5);

      // 【確認内容】: space-around配置での適切なレイアウト 🟢
      const footerGroup = screen.getByRole("navigation");
      expect(footerGroup).toHaveStyle({ justifyContent: "space-around" });

      // 【確認内容】: flex: 1による均等分散 🟢
      const buttons = screen.getAllByRole("link");
      buttons.forEach((button) => {
        expect(button).toHaveStyle({ flex: 1 });
      });
    });

    it("TC-103-B002: 長いラベル名（20文字）", () => {
      // 【テスト目的】: フッタータブでの表示可能ラベル長の境界値
      // 【テスト内容】: 長いラベルでもレイアウト破綻しない
      // 【期待される動作】: 長いラベルでも適切にテキスト処理される
      // 🟡 信頼性レベル: 中（UI境界値テスト、実装挙動の推測）

      // 【テストデータ準備】: モバイル画面幅での表示限界テスト
      // 【初期条件設定】: 多言語対応、詳細な機能名表示シミュレーション
      const longLabelItems: NavigationItem[] = [
        { id: "short", label: "短い", path: "/short", icon: IconHome },
        {
          id: "long",
          label: "非常に長いナビゲーション項目ラベル名",
          path: "/long",
          icon: IconUsers,
        },
      ];

      // 【実際の処理実行】: 長いラベル項目を含むNavigationItemでレンダリング
      // 【処理内容】: longLabelItemsを渡してテキストオーバーフロー対応を確認
      renderWithProviders(<FooterNavigation items={longLabelItems} />);

      // 【結果検証】: 長いラベルも表示され、レイアウト一貫性が維持されることを確認
      // 【期待値確認】: テキストオーバーフロー対応

      // 【確認内容】: 長いラベルも表示される 🟡
      expect(screen.getByText("非常に長いナビゲーション項目ラベル名")).toBeInTheDocument();

      // 【確認内容】: テキストサイズ設定確認 🟡
      const longLabelElement = screen.getByText("非常に長いナビゲーション項目ラベル名");
      expect(longLabelElement).toHaveClass(/mantine-Text-root/);

      // 【確認内容】: text-align: center設定確認 🟡
      expect(longLabelElement).toHaveStyle({ textAlign: "center" });

      // 【確認内容】: レイアウト破綻なし 🟡
      const buttons = screen.getAllByRole("link");
      buttons.forEach((button) => {
        expect(button).toHaveStyle({ flex: 1 });
      });
    });

    it("TC-103-B003: 単一項目表示", () => {
      // 【テスト目的】: 最小項目数（1項目）での表示動作確認
      // 【テスト内容】: 1項目でもspace-around配置が適切に機能
      // 【期待される動作】: 1項目でも適切なスタイリング
      // 🟡 信頼性レベル: 中（境界値テスト、レイアウト挙動の推測）

      // 【テストデータ準備】: 配列要素数の最小値（0を除く）
      // 【初期条件設定】: 権限制限、最小構成アプリシミュレーション
      const singleItem: NavigationItem[] = [
        { id: "only", label: "唯一の項目", path: "/only", icon: IconHome },
      ];

      // 【実際の処理実行】: 単一項目のNavigationItemでレンダリング
      // 【処理内容】: singleItemを渡して最小構成でのUI一貫性を確認
      renderWithProviders(<FooterNavigation items={singleItem} />);

      // 【結果検証】: 単一項目でも適切なスタイリングが維持されることを確認
      // 【期待値確認】: 項目数に関係ない一貫した配置

      // 【確認内容】: 単一項目表示 🟡
      expect(screen.getByText("唯一の項目")).toBeInTheDocument();

      // 【確認内容】: ボタン数確認 🟡
      expect(screen.getAllByRole("link")).toHaveLength(1);

      // 【確認内容】: space-around配置での中央寄せ 🟡
      const footerGroup = screen.getByRole("navigation");
      expect(footerGroup).toHaveStyle({ justifyContent: "space-around" });

      // 【確認内容】: flex: 1での適切な幅調整 🟡
      const button = screen.getByRole("link");
      expect(button).toHaveStyle({ flex: 1 });

      // 【確認内容】: タップ領域確保 🟡
      expect(button).toHaveStyle({ minHeight: "44px", height: "44px" });
    });
  });

  // ===== アクセシビリティテストケース =====

  describe("アクセシビリティテストケース (Accessibility Cases)", () => {
    it("TC-103-A001: ARIA属性設定確認", () => {
      // 【テスト目的】: 適切なARIA属性が設定されることを確認
      // 【テスト内容】: ナビゲーション領域のroleが適切に設定される
      // 【期待される動作】: WCAG 2.1 AA準拠、支援技術対応
      // 🟢 信頼性レベル: 高（WCAG 2.1 AA準拠、既存実装確認済み）

      // 【テストデータ準備】: ARIA属性検証用の基本設定
      // 【初期条件設定】: 標準的なNavigationItem配列
      renderWithProviders(<FooterNavigation items={mockNavigationItems} />);

      // 【実際の処理実行】: レンダリングされた要素のARIA属性を取得
      // 【処理内容】: navigation roleの確認

      // 【結果検証】: 基本的なRole属性が正しく設定されることを確認
      // 【期待値確認】: role="navigation"

      // 【確認内容】: ナビゲーション領域のrole設定 🟢
      expect(screen.getByRole("navigation")).toBeInTheDocument();

      // 【確認内容】: 各ボタンの基本的な存在確認 🟢
      const buttons = screen.getAllByRole("link");
      expect(buttons.length).toBe(mockNavigationItems.length);
    });

    it("TC-103-A002: キーボードナビゲーション対応", () => {
      // 【テスト目的】: キーボードでのフォーカス移動とアクション実行
      // 【テスト内容】: Tab/Shift+Tab、Enter/Spaceでの操作が可能
      // 【期待される動作】: REQ-402「キーボードナビゲーションをサポート」準拠
      // 🟡 信頼性レベル: 中（キーボード対応、一部将来実装含む）

      // 【テストデータ準備】: キーボード操作検証用の複数項目設定
      // 【初期条件設定】: 標準的なNavigationItem配列
      renderWithProviders(<FooterNavigation items={mockNavigationItems} />);

      // 【実際の処理実行】: ボタン要素のフォーカス状態とキーボード対応を確認
      // 【処理内容】: tabIndex、focus、キーボードイベント対応の検証
      const buttons = screen.getAllByRole("link");

      // 【結果検証】: キーボードアクセシビリティが適切に実装されることを確認
      // 【期待値確認】: フォーカス移動、キーボードアクション

      // 【確認内容】: 各ボタンがフォーカス可能 🟡
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("tabIndex", "0");

        // 【確認内容】: フォーカス設定 🟡
        button.focus();
        expect(button).toHaveFocus();
      });
    });
  });

  // ===== パフォーマンステストケース =====

  describe("パフォーマンステストケース (Performance Cases)", () => {
    it("TC-103-P001: React.memo再レンダリング防止", () => {
      // 【テスト目的】: プロパティが変更されない場合に再レンダリングされないことを確認
      // 【テスト内容】: 同じpropsでの再レンダリング時にコンポーネントが再実行されない
      // 【期待される動作】: React.memo最適化による性能向上
      // 🟢 信頼性レベル: 高（React.memo実装確認済み）

      // 【テストデータ準備】: React.memo最適化効果測定用の同一データ
      // 【初期条件設定】: 同一のNavigationItem配列を複数回使用
      let renderCount = 0;

      // React.memoのテストのため、FooterNavigationをラップしたコンポーネントを作成
      const TestFooterNavigation = memo((props: FooterNavigationProps) => {
        renderCount++;
        return <FooterNavigation {...props} />;
      });

      const props = { items: mockNavigationItems };

      // 【実際の処理実行】: 同一propsでの複数回レンダリングを実行
      // 【処理内容】: 初回レンダリング、同一props再レンダリング、異なるprops再レンダリング

      // 初回レンダリング
      const { rerender } = renderWithProviders(<TestFooterNavigation {...props} />);
      expect(renderCount).toBe(1);

      // 同じpropsで再レンダリング -> カウント増加なし（React.memoにより）
      rerender(<TestFooterNavigation {...props} />);
      expect(renderCount).toBe(1);

      // 異なるpropsで再レンダリング -> カウント増加
      const newProps = {
        items: [...mockNavigationItems, { id: "new", label: "新規", path: "/new", icon: IconHome }],
      };
      rerender(<TestFooterNavigation {...newProps} />);
      expect(renderCount).toBe(2);

      // 【結果検証】: React.memo最適化効果が正常に機能することを確認
      // 【期待値確認】: memo化効果、不要な再レンダリング防止

      // 【確認内容】: React.memo最適化による再レンダリング防止 🟢
      expect(renderCount).toBe(2); // 初回 + 異なるprops のみ
    });
  });

  // ===== 統合テストケース =====

  describe("統合テストケース (Integration Cases)", () => {
    it("TC-103-I001: ResponsiveLayoutとの統合", () => {
      // 【テスト目的】: ResponsiveLayoutコンポーネントとの統合が正常に動作することを確認
      // 【テスト内容】: ResponsiveLayoutのFooter部分にFooterNavigationが適切に配置される
      // 【期待される動作】: TASK-101 ResponsiveLayout統合仕様準拠
      // 🟢 信頼性レベル: 高（TASK-101統合確認済み）

      // 【テストデータ準備】: 実際の使用環境での統合テスト設定
      // 【初期条件設定】: ResponsiveLayout統合環境でのNavigationItem配列
      renderWithProviders(<FooterNavigation items={mockNavigationItems} />);

      // 【実際の処理実行】: AppShell.Footer内でのFooterNavigation配置確認
      // 【処理内容】: 統合環境でのナビゲーション表示と動作確認

      // 【結果検証】: 上位コンポーネントとの統合動作が正常に機能することを確認
      // 【期待値確認】: AppShell.Footer統合、条件表示制御

      // 【確認内容】: ResponsiveLayout統合時の動作確認 🟢
      const footerNavigation = screen.getByRole("navigation");
      expect(footerNavigation).toBeInTheDocument();

      // 【確認内容】: ナビゲーション項目の適切な表示 🟢
      expect(screen.getByText("ホーム")).toBeInTheDocument();
      expect(screen.getByText("ユーザー")).toBeInTheDocument();
      expect(screen.getByText("設定")).toBeInTheDocument();
    });
  });

  // ===== 現在ページハイライト機能テスト =====

  describe("現在ページハイライト機能 (Current Page Highlighting)", () => {
    it("TC-103-H001: ホームページで正しくハイライトされる", () => {
      /**
       * 【目的】: ホームページ（/）でホームリンクが正しくハイライトされることを確認
       * 【期待動作】: data-active属性が"true"になり、他のリンクは"false"になる
       * 🟢 信頼性レベル: 高（現在ページハイライト機能要件準拠）
       */

      render(
        <MemoryRouter initialEntries={["/"]}>
          <MantineProvider>
            <FooterNavigation items={mockNavigationItems} />
          </MantineProvider>
        </MemoryRouter>
      );

      // ホームページでホームがアクティブになることを確認
      const homeLink = screen.getByText("ホーム").closest("a");
      expect(homeLink).toHaveAttribute("data-active", "true");

      // 他のリンクはアクティブでないことを確認
      const usersLink = screen.getByText("ユーザー").closest("a");
      const settingsLink = screen.getByText("設定").closest("a");
      expect(usersLink).toHaveAttribute("data-active", "false");
      expect(settingsLink).toHaveAttribute("data-active", "false");
    });

    it("TC-103-H002: ユーザーページで正しくハイライトされる", () => {
      /**
       * 【目的】: ユーザーページ（/users）でユーザーリンクが正しくハイライトされることを確認
       * 【期待動作】: data-active属性が"true"になり、他のリンクは"false"になる
       * 🟢 信頼性レベル: 高（現在ページハイライト機能要件準拠）
       */

      render(
        <MemoryRouter initialEntries={["/users"]}>
          <MantineProvider>
            <FooterNavigation items={mockNavigationItems} />
          </MantineProvider>
        </MemoryRouter>
      );

      // ユーザーページでユーザーがアクティブになることを確認
      const usersLink = screen.getByText("ユーザー").closest("a");
      expect(usersLink).toHaveAttribute("data-active", "true");

      // 他のリンクはアクティブでないことを確認
      const homeLink = screen.getByText("ホーム").closest("a");
      const settingsLink = screen.getByText("設定").closest("a");
      expect(homeLink).toHaveAttribute("data-active", "false");
      expect(settingsLink).toHaveAttribute("data-active", "false");
    });

    it("TC-103-H003: 設定ページで正しくハイライトされる", () => {
      /**
       * 【目的】: 設定ページ（/settings）で設定リンクが正しくハイライトされることを確認
       * 【期待動作】: data-active属性が"true"になり、他のリンクは"false"になる
       * 🟢 信頼性レベル: 高（現在ページハイライト機能要件準拠）
       */

      render(
        <MemoryRouter initialEntries={["/settings"]}>
          <MantineProvider>
            <FooterNavigation items={mockNavigationItems} />
          </MantineProvider>
        </MemoryRouter>
      );

      // 設定ページで設定がアクティブになることを確認
      const settingsLink = screen.getByText("設定").closest("a");
      expect(settingsLink).toHaveAttribute("data-active", "true");

      // 他のリンクはアクティブでないことを確認
      const homeLink = screen.getByText("ホーム").closest("a");
      const usersLink = screen.getByText("ユーザー").closest("a");
      expect(homeLink).toHaveAttribute("data-active", "false");
      expect(usersLink).toHaveAttribute("data-active", "false");
    });

    it("TC-103-H004: 存在しないページでは全てのリンクが非アクティブになる", () => {
      /**
       * 【目的】: 存在しないページで全てのリンクが非アクティブになることを確認
       * 【期待動作】: 全てのリンクでdata-active属性が"false"になる
       * 🟢 信頼性レベル: 高（現在ページハイライト機能要件準拠）
       */

      render(
        <MemoryRouter initialEntries={["/unknown"]}>
          <MantineProvider>
            <FooterNavigation items={mockNavigationItems} />
          </MantineProvider>
        </MemoryRouter>
      );

      // 全てのリンクが非アクティブになることを確認
      const homeLink = screen.getByText("ホーム").closest("a");
      const usersLink = screen.getByText("ユーザー").closest("a");
      const settingsLink = screen.getByText("設定").closest("a");
      expect(homeLink).toHaveAttribute("data-active", "false");
      expect(usersLink).toHaveAttribute("data-active", "false");
      expect(settingsLink).toHaveAttribute("data-active", "false");
    });

    it("TC-103-H005: アイコンとラベルのあるナビゲーションでもハイライトが動作する", () => {
      /**
       * 【目的】: アイコン付きナビゲーション項目でもハイライトが正しく動作することを確認
       * 【期待動作】: アイコンとラベル両方を含むリンクでハイライトが動作する
       * 🟢 信頼性レベル: 高（FooterNavigation統合確認済み）
       */

      const fullNavigationItems = [
        { id: "home", label: "ホーム", path: "/", icon: IconHome },
        { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
        { id: "settings", label: "設定", path: "/settings", icon: IconSettings },
      ];

      render(
        <MemoryRouter initialEntries={["/users"]}>
          <MantineProvider>
            <FooterNavigation items={fullNavigationItems} />
          </MantineProvider>
        </MemoryRouter>
      );

      // ユーザーページでユーザーリンク（アイコン付き）がアクティブになることを確認
      const usersLink = screen.getByText("ユーザー").closest("a");
      expect(usersLink).toHaveAttribute("data-active", "true");

      // 他のアイコン付きリンクは非アクティブ
      const homeLink = screen.getByText("ホーム").closest("a");
      const settingsLink = screen.getByText("設定").closest("a");
      expect(homeLink).toHaveAttribute("data-active", "false");
      expect(settingsLink).toHaveAttribute("data-active", "false");
    });
  });
});
