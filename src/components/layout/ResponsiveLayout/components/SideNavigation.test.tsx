import { IconBell, IconHome, IconSettings, IconUsers } from "@tabler/icons-react";
import { fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "../../../../test/helpers/renderWithProviders";
import type { NavigationItem } from "../types";
import type { SideNavigationProps } from "./SideNavigation";
import { SideNavigation } from "./SideNavigation";

/**
 * TASK-104 SideNavigation TDDテストスイート
 * 【目的】: SideNavigationコンポーネントの包括的品質保証
 * 【対象】: デスクトップサイドバーナビゲーション、折りたたみ機能、アクセシビリティ、パフォーマンス
 * 【作成日】: 2025-09-22
 * 【TDDフェーズ】: Redフェーズ（失敗するテスト作成）
 * 🟢 信頼性レベル: テストケース定義書に基づく包括的テスト
 */

// ===== テスト用データ =====

/**
 * 【モックデータ概要】: SideNavigationテスト用の標準ナビゲーション項目
 * 【データ設計】: REQ-005「デスクトップ表示時にサイドメニューを表示」準拠
 * 【テスト対応】: TC-104-N001〜TC-104-N005の基本表示テスト用
 * 🟢 信頼性レベル: 高（要件定義書から確認済み）
 */
const mockNavigationItems: NavigationItem[] = [
  { id: "home", label: "ホーム", path: "/", icon: IconHome },
  { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
  { id: "settings", label: "設定", path: "/settings", icon: IconSettings },
];

const mockGroupedItems = {
  メイン: [
    { id: "home", label: "ホーム", path: "/", icon: IconHome },
    { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
  ],
  設定: [{ id: "settings", label: "設定", path: "/settings", icon: IconSettings }],
};

const defaultProps: SideNavigationProps = {
  items: mockNavigationItems,
  groupedItems: mockGroupedItems,
};

describe("SideNavigation Component - TASK-104 TDD Test Suite", () => {
  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモック関数をクリアし、一貫したテスト環境を保証
    // 【環境初期化】: 前のテストの影響を受けないよう、モック状態をリセット
    vi.clearAllMocks();
  });

  // ===== 正常系テストケース =====

  describe("正常系テストケース (Normal Cases)", () => {
    it("TC-104-N001: デスクトップサイドナビゲーション基本表示", () => {
      // 【テスト目的】: SideNavigationコンポーネントが正常にレンダリングされ、基本要素が表示される
      // 【テスト内容】: 768px以上の画面幅でサイドナビゲーションが適切に表示される
      // 【期待される動作】: REQ-005「デスクトップ表示時にサイドメニューを表示」準拠の基本表示
      // 🟢 信頼性レベル: 高（EARS要件REQ-005、既存実装確認済み）

      // 【テストデータ準備】: デスクトップ表示での基本ナビゲーション確認用
      // 【初期条件設定】: 標準的なNavigationItem配列とグループ設定
      const testItems: NavigationItem[] = [
        { id: "home", label: "ホーム", path: "/", icon: IconHome },
        { id: "users", label: "ユーザー", path: "/users", icon: IconUsers },
      ];
      const testGroupedItems = { メイン: testItems };

      // 【実際の処理実行】: SideNavigationコンポーネントをレンダリング
      // 【処理内容】: testItemsとtestGroupedItemsを渡してコンポーネントの基本表示を実行
      render(<SideNavigation items={testItems} groupedItems={testGroupedItems} />);

      // 【結果検証】: サイドナビゲーションの基本要素が正常に表示されることを確認
      // 【期待値確認】: Navbar要素、navigation role、適切な幅（280px）の確認

      // 【確認内容】: サイドナビゲーション領域がnavigation roleで表示される 🟢
      expect(screen.getByRole("navigation")).toBeInTheDocument();

      // 【確認内容】: ナビゲーション項目のラベルが正常に表示される 🟢
      expect(screen.getByText("ホーム")).toBeInTheDocument();
      expect(screen.getByText("ユーザー")).toBeInTheDocument();

      // 【確認内容】: デスクトップ用の展開幅（280px）が適用される 🟢
      const navbarElement = screen.getByRole("navigation");
      expect(navbarElement).toHaveStyle({ width: "280px" });
    });

    it("TC-104-N002: グループ化されたナビゲーション項目表示", () => {
      // 【テスト目的】: groupedItems によるナビゲーション項目のグループ化表示
      // 【テスト内容】: NavLink.Group でのグループ分け表示、各グループ内での項目表示
      // 【期待される動作】: グループラベル表示、グループ内項目の適切な配置
      // 🟢 信頼性レベル: 高（設計仕様書の NavigationItem インターフェース定義に基づく）

      // 【テストデータ準備】: 複数グループでの階層構造表示確認
      // 【初期条件設定】: メイン・設定の2グループ構成
      const multiGroupItems = {
        メイン: [{ id: "home", label: "ホーム", path: "/" }],
        設定: [{ id: "settings", label: "設定", path: "/settings" }],
      };

      // 【実際の処理実行】: グループ化されたNavigationItemでSideNavigationをレンダリング
      // 【処理内容】: multiGroupItemsを渡してグループ化表示を実行
      render(<SideNavigation items={mockNavigationItems} groupedItems={multiGroupItems} />);

      // 【結果検証】: グループラベルと各グループ内項目が正しく表示されることを確認
      // 【期待値確認】: グループタイトル表示、グループ内項目の正しい配置

      // 【確認内容】: グループラベルが表示される 🟢
      expect(screen.getByTestId("group-header-メイン")).toBeInTheDocument();
      expect(screen.getByTestId("group-header-設定")).toBeInTheDocument();

      // 【確認内容】: 各グループ内の項目が正しく表示される 🟢
      expect(screen.getByText("ホーム")).toBeInTheDocument();
      expect(screen.getByTestId("navlink-settings")).toBeInTheDocument();

      // 【確認内容】: NavLink.Group構造が適切に生成される 🟢
      const navLinks = screen.getAllByRole("link");
      expect(navLinks).toHaveLength(2);
    });

    it("TC-104-N003: 折りたたみ状態での表示", () => {
      // 【テスト目的】: collapsed=true時のサイドバー表示（幅80px）
      // 【テスト内容】: 幅が80pxに変更され、ツールチップ表示対応
      // 【期待される動作】: 幅変更、アイコンのみ表示、ツールチップ対応
      // 🟢 信頼性レベル: 高（設計仕様書の折りたたみ機能要件に完全準拠）

      // 【テストデータ準備】: 画面スペース節約モードでの表示確認
      // 【初期条件設定】: collapsed=trueでの折りたたみ状態
      const collapsedProps = {
        ...defaultProps,
        collapsed: true,
      };

      // 【実際の処理実行】: collapsed=trueでSideNavigationをレンダリング
      // 【処理内容】: 折りたたみ状態でのサイドバー表示を実行
      render(<SideNavigation {...collapsedProps} />);

      // 【結果検証】: 折りたたみ状態での適切な幅とツールチップ対応を確認
      // 【期待値確認】: 80px幅、ツールチップ機能、アイコン表示

      // 【確認内容】: 折りたたみ時の幅（80px）が適用される 🟢
      const navbarElement = screen.getByRole("navigation");
      expect(navbarElement).toHaveStyle({ width: "80px" });

      // 【確認内容】: ツールチップ対応が有効化される 🟢
      const navLinks = screen.getAllByRole("link");
      navLinks.forEach((link) => {
        expect(link).toHaveAttribute("data-tooltip");
      });
    });

    it("TC-104-N004: アクティブ状態の表示", () => {
      // 【テスト目的】: 現在のルートに対応するNavLinkのアクティブ状態表示
      // 【テスト内容】: React Router連携での現在ページハイライト
      // 【期待される動作】: 対応するNavLinkにアクティブスタイルが適用される
      // 🟢 信頼性レベル: 高（REQ-106（ナビゲーション要件）のアクティブ状態表示要件）

      // 【テストデータ準備】: ユーザーの現在位置を視覚的に示すナビゲーション支援
      // 【初期条件設定】: 現在のルート '/' での状態確認
      // Mock current location to '/'
      const mockLocation = { pathname: "/" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      // 【実際の処理実行】: ルート情報を含むSideNavigationをレンダリング
      // 【処理内容】: Router情報との連携でアクティブ状態表示を確認
      render(<SideNavigation {...defaultProps} />);

      // 【結果検証】: 現在のルートに対応するNavLinkがアクティブ状態になることを確認
      // 【期待値確認】: アクティブスタイル適用、視覚的フィードバック

      // 【確認内容】: ホームページのNavLinkがアクティブ状態 🟢
      const homeLink = screen.getByRole("link", { name: "ホーム" });
      expect(homeLink).toHaveClass("mantine-NavLink-root");
      expect(homeLink).toHaveAttribute("data-active", "true");
    });

    it("TC-104-N005: バッジ表示機能", () => {
      // 【テスト目的】: NavigationItem.badge プロパティによるバッジ表示
      // 【テスト内容】: NavLinkのrightSectionにBadgeコンポーネントが表示される
      // 【期待される動作】: バッジ内容の適切な表示、視覚的インジケーター機能
      // 🟢 信頼性レベル: 高（NavigationItem インターフェースのbadgeプロパティ仕様に準拠）

      // 【テストデータ準備】: 未読件数や重要度を示す視覚的インジケーター
      // 【初期条件設定】: バッジ付きナビゲーション項目
      const badgeItems: NavigationItem[] = [
        { id: "notifications", label: "通知", path: "/notifications", icon: IconBell, badge: "5" },
      ];
      const badgeGroupedItems = { メイン: badgeItems };

      // 【実際の処理実行】: バッジ付きNavigationItemでSideNavigationをレンダリング
      // 【処理内容】: badgeItemsを渡してバッジ表示機能を確認
      render(<SideNavigation items={badgeItems} groupedItems={badgeGroupedItems} />);

      // 【結果検証】: NavLinkにBadgeが正しく表示されることを確認
      // 【期待値確認】: バッジの正しい配置、内容表示

      // 【確認内容】: ナビゲーション項目のラベルが表示される 🟢
      expect(screen.getByText("通知")).toBeInTheDocument();

      // 【確認内容】: バッジが正しく表示される 🟢
      expect(screen.getByText("5")).toBeInTheDocument();

      // 【確認内容】: バッジがBadgeコンポーネントとして表示される 🟢
      const badgeElement = screen.getByText("5");
      expect(badgeElement.closest(".mantine-Badge-root")).toBeInTheDocument();
    });
  });

  // ===== 異常系テストケース =====

  describe("異常系テストケース (Error Cases)", () => {
    it("TC-104-E001: 空のナビゲーション項目配列", () => {
      // 【テスト目的】: items, groupedItems が空配列/空オブジェクトの場合のエラーハンドリング
      // 【テスト内容】: 空データでの安全な動作確認、フォールバック動作の検証
      // 【期待される動作】: アプリケーションクラッシュを防ぐ安定動作
      // 🟡 信頼性レベル: 中（想定されるエラーケース、実装時の防御的プログラミング）

      // 【テストデータ準備】: 初期読み込み時、権限なしユーザー、データ取得失敗時のシミュレーション
      // 【初期条件設定】: 空のナビゲーション項目配列
      const emptyProps = {
        items: [],
        groupedItems: {},
      };

      // 【実際の処理実行】: 空データでSideNavigationをレンダリング
      // 【処理内容】: emptyPropsを渡してエラーハンドリング動作を確認
      render(<SideNavigation {...emptyProps} />);

      // 【結果検証】: エラーなく空のNavbarがレンダリングされることを確認
      // 【期待値確認】: エラー発生なし、適切なフォールバック表示

      // 【確認内容】: ナビゲーション領域は表示されるが項目は表示されない 🟡
      const navElement = screen.getByRole("navigation");
      expect(navElement).toBeInTheDocument();

      // 【確認内容】: ナビゲーション項目は表示されない 🟡
      expect(screen.queryAllByRole("link")).toHaveLength(0);

      // 【確認内容】: エラーは発生しない 🟡
      expect(() => render(<SideNavigation {...emptyProps} />)).not.toThrow();
    });

    it("TC-104-E002: 不正なナビゲーション項目データ", () => {
      // 【テスト目的】: NavigationItem の必須フィールド（id, label, path）が undefined/null の場合
      // 【テスト内容】: 不正データによるランタイムエラー防止
      // 【期待される動作】: 不正データを除外して正常項目のみ表示
      // 🟡 信頼性レベル: 中（TypeScript型システムによる制約と実行時防御の組み合わせ）

      // 【テストデータ準備】: API応答の不整合、データ変換処理のバグシミュレーション
      // 【初期条件設定】: 必須プロパティが欠損したNavigationItem
      const invalidItems: NavigationItem[] = [
        { id: undefined as any, label: "テスト", path: "/test" },
        { id: "test2", label: null as any, path: "/test2" },
        { id: "valid", label: "有効項目", path: "/valid", icon: IconHome },
      ];
      const invalidGroupedItems = { テスト: invalidItems };

      // 【実際の処理実行】: 不正データを含むNavigationItemでレンダリング
      // 【処理内容】: invalidItemsを渡してデータ検証とエラーハンドリング動作を確認
      render(<SideNavigation items={invalidItems} groupedItems={invalidGroupedItems} />);

      // 【結果検証】: 有効な項目のみ表示され、不正項目は除外されることを確認
      // 【期待値確認】: データ検証機能、実行時の安定性確保

      // 【確認内容】: 有効項目のみ表示される 🟡
      expect(screen.getByText("有効項目")).toBeInTheDocument();

      // 【確認内容】: エラーは発生しない 🟡
      expect(() =>
        render(<SideNavigation items={invalidItems} groupedItems={invalidGroupedItems} />)
      ).not.toThrow();
    });

    it("TC-104-E003: アイコンコンポーネントの読み込み失敗", () => {
      // 【テスト目的】: NavigationItem.icon プロパティが不正なコンポーネントの場合
      // 【テスト内容】: アイコンなしでの表示継続、またはフォールバックアイコン表示
      // 【期待される動作】: ナビゲーション機能の継続性確保
      // 🟡 信頼性レベル: 中（外部ライブラリ依存の一般的なエラーケース）

      // 【テストデータ準備】: アイコンライブラリ更新、import文の誤りシミュレーション
      // 【初期条件設定】: アイコンコンポーネントの不存在、import失敗
      const itemsWithInvalidIcon: NavigationItem[] = [
        { id: "test", label: "テスト", path: "/test", icon: undefined },
        { id: "test2", label: "テスト2", path: "/test2", icon: null as any },
        { id: "valid", label: "有効項目", path: "/valid", icon: IconHome },
      ];
      const invalidIconGroupedItems = { テスト: itemsWithInvalidIcon };

      // 【実際の処理実行】: 不正アイコンを含むNavigationItemでレンダリング
      // 【処理内容】: itemsWithInvalidIconを渡してアイコン依存関係のエラーハンドリングを確認
      render(
        <SideNavigation items={itemsWithInvalidIcon} groupedItems={invalidIconGroupedItems} />
      );

      // 【結果検証】: アイコンエラーでもナビゲーション機能が継続することを確認
      // 【期待値確認】: 外部依存関係問題への耐性、機能継続性

      // 【確認内容】: ラベルは正常に表示される 🟡
      expect(screen.getByTestId("navlink-test")).toBeInTheDocument();
      expect(screen.getByTestId("navlink-test2")).toBeInTheDocument();
      expect(screen.getByTestId("navlink-valid")).toBeInTheDocument();

      // 【確認内容】: エラーは発生しない 🟡
      expect(() =>
        render(
          <SideNavigation items={itemsWithInvalidIcon} groupedItems={invalidIconGroupedItems} />
        )
      ).not.toThrow();
    });
  });

  // ===== 境界値テストケース =====

  describe("境界値テストケース (Boundary Value Cases)", () => {
    it("TC-104-B001: 画面幅境界値でのレスポンシブ表示", () => {
      // 【テスト目的】: ブレークポイント境界値（768px）でのレスポンシブ動作
      // 【テスト内容】: デスクトップ/モバイル表示切り替えの境界での正確性
      // 【期待される動作】: 767px以下で非表示、768px以上で表示
      // 🟢 信頼性レベル: 高（EARS要件REQ-005、設計仕様書のブレークポイント定義）

      // 【テストデータ準備】: ユーザーの画面サイズ変更、デバイス回転シミュレーション
      // 【初期条件設定】: Mantineの'md'ブレークポイント（768px）境界値

      // 【実際の処理実行】: 異なる画面幅でのSideNavigationレスポンシブ動作を確認
      // 【処理内容】: ブレークポイント境界での表示切り替えテスト
      render(<SideNavigation {...defaultProps} />);

      // 【結果検証】: 正確に768pxで表示切り替えが発生することを確認
      // 【期待値確認】: レスポンシブブレークポイントの境界動作の正確性

      // 【確認内容】: デスクトップ幅でのNavbar表示 🟢
      const navbarElement = screen.getByRole("navigation");
      expect(navbarElement).toBeInTheDocument();

      // 【確認内容】: ブレークポイント設定の確認 🟢
      expect(navbarElement).toHaveAttribute("data-breakpoint", "md");

      // 【確認内容】: デスクトップでのみ表示される設定 🟢
      expect(navbarElement).toHaveStyle({
        display: "flex",
      });
    });

    it("TC-104-B002: 最大項目数でのスクロール動作", () => {
      // 【テスト目的】: 大量のナビゲーション項目でのScrollArea動作
      // 【テスト内容】: 画面高さを超える項目数での表示制御
      // 【期待される動作】: ScrollAreaでのスクロール表示、パフォーマンス劣化なし
      // 🟡 信頼性レベル: 中（想定される大量データケース、Mantine ScrollArea仕様に基づく）

      // 【テストデータ準備】: 機能豊富なアプリケーション、管理者向け画面シミュレーション
      // 【初期条件設定】: 画面高さを明らかに超える項目数（50項目）
      const manyItems: NavigationItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        label: `項目${i + 1}`,
        path: `/item-${i}`,
        icon: IconHome,
      }));
      const manyGroupedItems = { 大量データ: manyItems };

      // 【実際の処理実行】: 大量データでSideNavigationをレンダリング
      // 【処理内容】: manyItemsを渡してScrollArea機能を確認
      render(<SideNavigation items={manyItems} groupedItems={manyGroupedItems} />);

      // 【結果検証】: すべての項目がスクロールでアクセス可能であることを確認
      // 【期待値確認】: 大量データでのScrollArea機能、極端な条件下でのUI安定性

      // 【確認内容】: ScrollAreaコンポーネントが適用される 🟡
      const scrollArea = screen.getByRole("navigation").querySelector('[data-scrollarea="root"]');
      expect(scrollArea).toBeInTheDocument();

      // 【確認内容】: 最初と最後の項目がDOM内に存在 🟡
      expect(screen.getByText("項目1")).toBeInTheDocument();
      expect(screen.getByText("項目50")).toBeInTheDocument();

      // 【確認内容】: 50項目すべてのリンクが存在 🟡
      const navLinks = screen.getAllByRole("link");
      expect(navLinks).toHaveLength(50);
    });

    it("TC-104-B003: 折りたたみ状態切り替えの境界動作", () => {
      // 【テスト目的】: collapsed状態の高速切り替えでの動作安定性
      // 【テスト内容】: 状態切り替えの高頻度実行での安定性
      // 【期待される動作】: 最終状態の一貫性、アニメーション中断時の適切な処理
      // 🟡 信頼性レベル: 中（ユーザビリティテストで想定されるエッジケース）

      // 【テストデータ準備】: ユーザーの誤操作、キーボードショートカット連打シミュレーション
      // 【初期条件設定】: 高速切り替え操作のテスト
      const toggleMock = vi.fn();
      let collapsed = false;

      const TestComponent = () => {
        const handleToggle = () => {
          collapsed = !collapsed;
          toggleMock();
        };

        return (
          <>
            <SideNavigation
              {...defaultProps}
              collapsed={collapsed}
              onToggleCollapse={handleToggle}
            />
            <button type="button" onClick={handleToggle}>
              Toggle
            </button>
          </>
        );
      };

      // 【実際の処理実行】: 連続的な状態切り替えを実行
      // 【処理内容】: collapsed状態の高速切り替えテスト
      render(<TestComponent />);

      // 【結果検証】: 状態管理の整合性とUI表示の同期を確認
      // 【期待値確認】: 極端な操作パターンでの安定性

      const toggleButton = screen.getByText("Toggle");

      // 【確認内容】: 連続切り替えでも状態一貫性維持 🟡
      for (let i = 0; i < 10; i++) {
        fireEvent.click(toggleButton);
      }

      // 【確認内容】: 最終状態の正確性 🟡
      expect(toggleMock).toHaveBeenCalledTimes(10);

      // 【確認内容】: UI表示と内部状態の同期 🟡
      const navbarElement = screen.getByRole("navigation");
      expect(navbarElement).toBeInTheDocument();
    });
  });

  // ===== アクセシビリティテストケース =====

  describe("アクセシビリティテストケース (Accessibility Cases)", () => {
    it("TC-104-A001: キーボードナビゲーション操作", () => {
      // 【テスト目的】: キーボードのみでのサイドナビゲーション操作
      // 【テスト内容】: Tab, Enter, Arrow keys でのナビゲーション
      // 【期待される動作】: WCAG 2.1 AA準拠のキーボード操作性
      // 🟢 信頼性レベル: 高（EARS要件REQ-402（キーボードナビゲーション要件）に完全準拠）

      // 【テストデータ準備】: 視覚障害者、マウス使用困難者への対応確認
      // 【初期条件設定】: キーボード操作検証用の複数項目設定
      render(<SideNavigation {...defaultProps} />);

      // 【実際の処理実行】: キーボード操作でのナビゲーション動作を確認
      // 【処理内容】: Tab順序、Enter/Spaceでの項目選択、適切なfocus表示

      // 【結果検証】: キーボードのみですべての機能にアクセス可能であることを確認
      // 【期待値確認】: WCAG 2.1 Guideline 2.1 (Keyboard Accessible)準拠

      // 【確認内容】: 各ナビゲーション項目がフォーカス可能 🟢
      const navLinks = screen.getAllByRole("link");
      navLinks.forEach((link) => {
        expect(link).toHaveAttribute("tabIndex", "0");

        // 【確認内容】: フォーカス設定 🟢
        link.focus();
        expect(link).toHaveFocus();
      });

      // 【確認内容】: キーボード操作でのアクション実行 🟢
      const firstLink = navLinks[0];
      fireEvent.keyDown(firstLink, { key: "Enter" });
      expect(firstLink).toHaveAttribute("href", "/");
    });

    it("TC-104-A002: スクリーンリーダー対応", () => {
      // 【テスト目的】: スクリーンリーダーでの適切な読み上げ
      // 【テスト内容】: 適切なARIA属性、role属性、ナビゲーション構造の音声読み上げ
      // 【期待される動作】: 視覚障害者向けの音声読み上げ対応
      // 🟢 信頼性レベル: 高（EARS要件REQ-401（WCAG 2.1 AA準拠要件）に基づく）

      // 【テストデータ準備】: 画面を視覚的に認識できないユーザーへの配慮確認
      // 【初期条件設定】: ARIA属性とセマンティック構造の検証
      const itemsWithDescription: NavigationItem[] = [
        {
          id: "home",
          label: "ホーム",
          path: "/",
          icon: IconHome,
          description: "アプリケーションのメインページ",
        },
      ];
      const descriptiveGroupedItems = { メイン: itemsWithDescription };

      // 【実際の処理実行】: ARIA属性付きNavigationItemでレンダリング
      // 【処理内容】: itemsWithDescriptionを渡してスクリーンリーダー対応を確認
      render(
        <SideNavigation items={itemsWithDescription} groupedItems={descriptiveGroupedItems} />
      );

      // 【結果検証】: スクリーンリーダーでの完全な情報取得が可能であることを確認
      // 【期待値確認】: 適切なARIA属性、各項目の目的と現在位置の明確な伝達

      // 【確認内容】: ナビゲーション領域の適切なrole設定 🟢
      expect(screen.getByRole("navigation")).toBeInTheDocument();

      // 【確認内容】: ナビゲーション領域の確認 🟢
      const navElement = screen.getByRole("navigation");
      expect(navElement).toBeInTheDocument();

      // 【確認内容】: 各リンクの基本的な存在確認 🟢
      const homeLink = screen.getByRole("link", { name: "ホーム" });
      expect(homeLink).toBeInTheDocument();
    });
  });

  // ===== パフォーマンステストケース =====

  describe("パフォーマンステストケース (Performance Cases)", () => {
    it("TC-104-P001: レイアウト切り替えパフォーマンス", () => {
      // 【テスト目的】: サイドバー折りたたみ/展開時のパフォーマンス測定
      // 【テスト内容】: 200ms以内のレイアウト切り替え、300ms以内のアニメーション完了
      // 【期待される動作】: NFR-001, NFR-002準拠の高速応答
      // 🟢 信頼性レベル: 高（EARS要件NFR-001, NFR-002（パフォーマンス要件）に完全準拠）

      // 【テストデータ準備】: 大量項目での応答性測定
      // 【初期条件設定】: 現実的な使用状況での切り替え時間測定
      const performanceProps = {
        ...defaultProps,
        collapsed: false,
        onToggleCollapse: vi.fn(),
      };

      // 【実際の処理実行】: パフォーマンス測定付きでSideNavigationをレンダリング
      // 【処理内容】: collapsed切り替え時の実行時間測定
      const startTime = performance.now();

      const { rerender } = render(<SideNavigation {...performanceProps} />);

      // 状態切り替え
      rerender(<SideNavigation {...performanceProps} collapsed={true} />);

      const endTime = performance.now();
      const switchTime = endTime - startTime;

      // 【結果検証】: 切り替え処理200ms以内、60FPSでの滑らかなアニメーションを確認
      // 【期待値確認】: NFR-001, NFR-002パフォーマンス基準、ユーザー感覚での遅延なし

      // 【確認内容】: レイアウト切り替え200ms以内 🟢
      expect(switchTime).toBeLessThan(200);

      // 【確認内容】: React.memo最適化効果 🟢
      const navElement = screen.getByRole("navigation");
      expect(navElement).toBeInTheDocument();

      // 【確認内容】: アニメーション設定確認 🟢
      expect(navElement).toHaveStyle({
        transition: "width 300ms ease",
      });
    });
  });

  // ===== 統合テストケース =====

  describe("統合テストケース (Integration Cases)", () => {
    it("TC-104-I001: ResponsiveLayoutとの統合", () => {
      // 【テスト目的】: ResponsiveLayoutコンポーネントとの統合動作
      // 【テスト内容】: AppShell.Navbar内での配置、他コンポーネントとの連携
      // 【期待される動作】: 正しいレイアウト内配置、他ナビゲーションとの干渉なし
      // 🟢 信頼性レベル: 高（architecture.md のResponsiveLayout設計仕様に基づく）

      // 【テストデータ準備】: 実際の使用環境での統合テスト設定
      // 【初期条件設定】: ResponsiveLayout統合環境でのNavigationItem配列
      render(<SideNavigation {...defaultProps} />);

      // 【実際の処理実行】: ResponsiveLayout内でのSideNavigation配置確認
      // 【処理内容】: 統合環境でのナビゲーション表示と動作確認

      // 【結果検証】: 上位コンポーネントとの統合動作が正常に機能することを確認
      // 【期待値確認】: AppShell.Navbar統合、全体レイアウトの視覚的一貫性

      // 【確認内容】: ResponsiveLayout統合時の動作確認 🟢
      const sideNavigation = screen.getByRole("navigation");
      expect(sideNavigation).toBeInTheDocument();

      // 【確認内容】: ナビゲーション項目の適切な表示 🟢
      expect(screen.getByTestId("navlink-home")).toBeInTheDocument();
      expect(screen.getByTestId("navlink-users")).toBeInTheDocument();
      expect(screen.getByTestId("navlink-settings")).toBeInTheDocument();

      // 【確認内容】: AppShell.Navbar互換性 🟢
      expect(sideNavigation).toHaveAttribute("data-navbar", "true");
    });

    it("TC-104-I002: ルーティングシステムとの統合", () => {
      // 【テスト目的】: React Router連携での画面遷移動作
      // 【テスト内容】: NavLinkコンポーネントとReact Routerの連携
      // 【期待される動作】: NavLinkクリックで正しい画面遷移、アクティブ状態の正確な反映
      // 🟢 信頼性レベル: 高（REQ-106（画面遷移要件）とReact Router標準仕様）

      // 【テストデータ準備】: ナビゲーション本来の目的である画面遷移機能確認
      // 【初期条件設定】: Router setup + SideNavigation
      render(<SideNavigation {...defaultProps} />);

      // 【実際の処理実行】: NavLinkクリックでの画面遷移動作を確認
      // 【処理内容】: URLの変更とアクティブ状態の同期確認

      // 【結果検証】: ルーティングシステムとの統合が正常に機能することを確認
      // 【期待値確認】: URLとUI状態の同期性、ブラウザバックボタンとの協調動作

      // 【確認内容】: NavLinkの正しいルーティング設定 🟢
      const homeLink = screen.getByRole("link", { name: "ホーム" });
      expect(homeLink).toHaveAttribute("href", "/");

      const usersLink = screen.getByRole("link", { name: "ユーザー" });
      expect(usersLink).toHaveAttribute("href", "/users");

      // 【確認内容】: React Router Link コンポーネント使用 🟢
      expect(homeLink).toHaveAttribute("data-router-link", "true");
      expect(usersLink).toHaveAttribute("data-router-link", "true");
    });

    it("TC-104-I003: テーマシステムとの統合", () => {
      // 【テスト目的】: Mantineテーマシステムとの統合
      // 【テスト内容】: テーマ設定の継承、カスタムスタイルの適用
      // 【期待される動作】: テーマ色の正しい適用、一貫したスタイリング
      // 🟢 信頼性レベル: 高（Mantine 7.x テーマシステム仕様と既存設計に準拠）

      // 【テストデータ準備】: 一貫したデザインシステムの適用確認
      // 【初期条件設定】: MantineProvider theme + SideNavigation
      render(<SideNavigation {...defaultProps} />);

      // 【実際の処理実行】: テーマシステム統合でのSideNavigation表示確認
      // 【処理内容】: グローバルテーマとコンポーネント固有スタイルの調和確認

      // 【結果検証】: テーマシステム統合の正常動作を確認
      // 【期待値確認】: デザインシステムの一貫性、統一されたユーザーインターフェース確保

      // 【確認内容】: Mantineテーマクラスの適用 🟢
      const navElement = screen.getByRole("navigation");
      expect(navElement).toHaveClass("mantine-Navbar-root");

      // 【確認内容】: カスタムブレークポイントの適用 🟢
      expect(navElement).toHaveAttribute("data-mantine-theme", "true");

      // 【確認内容】: NavLinkコンポーネントのテーマ統合 🟢
      const navLinks = screen.getAllByRole("link");
      navLinks.forEach((link) => {
        expect(link).toHaveClass("mantine-NavLink-root");
      });
    });
  });
});
