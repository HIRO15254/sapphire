import {
  ActionIcon,
  Burger,
  Group,
  rem,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { memo, useCallback, useMemo, useRef } from "react";
import { useKeyboardNavigation } from "../../../../hooks/accessibility/useKeyboardNavigation";
import type { NavigationItem } from "../types";

/**
 * 【アクセシビリティ定数】: WCAG 2.1 AA準拠のタップ領域サイズ
 * 【根拠】: iOS/Android HIG準拠の最小タップ領域44px
 * 🟢 信頼性レベル: 国際的なアクセシビリティ基準に基づく
 */
const MINIMUM_TAP_TARGET_SIZE = "44px";

/**
 * 【アイコンサイズ定数】: 視認性とデザイン一貫性のためのアイコンサイズ
 * 【設計方針】: Mantineのデザインシステムと調和する16pxサイズ
 * 🟢 信頼性レベル: Mantineデザインシステムガイドラインに基づく
 */
const NAVIGATION_ICON_SIZE = 16;

/**
 * 【テーマアイコンサイズ定数】: テーマ切り替えボタンの視認性確保
 * 【アクセシビリティ】: 44pxタップ領域内で適切な視認性を保つサイズ
 * 🟢 信頼性レベル: デザインシステムとアクセシビリティ要件のバランス
 */
const THEME_ICON_SIZE = 18;

export interface HeaderNavigationProps {
  /** ナビゲーション項目配列 */
  items: NavigationItem[];
  /** モバイルレイアウト判定フラグ */
  isMobile: boolean;
  /** ハンバーガーメニューの開閉状態 */
  hamburgerOpened: boolean;
  /** ハンバーガーメニュー開閉ハンドラ */
  onHamburgerToggle: () => void;
}

/**
 * 【機能概要】: レスポンシブ対応ヘッダーナビゲーションコンポーネント
 * 【改善内容】:
 *   - マジックナンバーの定数化によるメンテナンス性向上
 *   - useMemoによるスタイル最適化
 *   - 詳細な日本語コメントによる可読性向上
 *   - アクセシビリティ強化（WCAG 2.1 AA準拠）
 * 【設計方針】:
 *   - モバイルファーストデザイン
 *   - 条件付きレンダリングによる効率的なDOM操作
 *   - Mantineデザインシステムとの統合
 * 【パフォーマンス】:
 *   - React.memo による不要な再レンダリング防止
 *   - useMemoによるスタイルオブジェクトの最適化
 * 【保守性】:
 *   - 定数の外部定義による変更容易性
 *   - 構造化コメントによる理解促進
 * 🟢 信頼性レベル: EARS要件とMantineガイドラインに基づく改善
 */
export const HeaderNavigation = memo<HeaderNavigationProps>(
  ({ items, isMobile, hamburgerOpened, onHamburgerToggle }) => {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const currentFocusIndex = useRef<number>(0);

    // キーボードナビゲーション関数
    const focusMenuItem = useCallback((index: number) => {
      const menuItems = menuItemsRef.current.filter(Boolean);
      if (menuItems[index]) {
        menuItems[index]?.focus();
        currentFocusIndex.current = index;
      }
    }, []);

    const handleArrowDown = useCallback(() => {
      const menuItems = menuItemsRef.current.filter(Boolean);
      const nextIndex = (currentFocusIndex.current + 1) % menuItems.length;
      focusMenuItem(nextIndex);
    }, [focusMenuItem]);

    const handleArrowUp = useCallback(() => {
      const menuItems = menuItemsRef.current.filter(Boolean);
      const prevIndex =
        currentFocusIndex.current === 0 ? menuItems.length - 1 : currentFocusIndex.current - 1;
      focusMenuItem(prevIndex);
    }, [focusMenuItem]);

    const handleHome = useCallback(() => {
      focusMenuItem(0);
    }, [focusMenuItem]);

    const handleEnd = useCallback(() => {
      const menuItems = menuItemsRef.current.filter(Boolean);
      focusMenuItem(menuItems.length - 1);
    }, [focusMenuItem]);

    // キーボードナビゲーションフック
    const navigationRef = useKeyboardNavigation({
      onArrowDown: handleArrowDown,
      onArrowUp: handleArrowUp,
      onHome: handleHome,
      onEnd: handleEnd,
    });

    /**
     * 【スタイル最適化】: アクセシビリティ準拠のタップ領域スタイル
     * 【パフォーマンス】: useMemoによる再計算防止
     * 【アクセシビリティ】: 44px最小タップ領域の確保
     * 🟢 信頼性レベル: WCAG 2.1 AA基準準拠
     */
    const accessibleButtonStyle = useMemo(
      () => ({
        minHeight: MINIMUM_TAP_TARGET_SIZE,
        height: MINIMUM_TAP_TARGET_SIZE,
      }),
      []
    );

    /**
     * 【ナビゲーションスタイル最適化】: デスクトップナビゲーション項目のスタイル
     * 【設計方針】: Mantineのデザイントークンを活用した一貫性確保
     * 【パフォーマンス】: 静的なスタイルオブジェクトによる最適化
     * 🟢 信頼性レベル: Mantineデザインシステムガイドライン準拠
     */
    const navigationItemStyles = useMemo(
      () => ({
        root: {
          borderRadius: "var(--mantine-radius-md)",
          padding: `${rem(8)} ${rem(12)}`,
        },
      }),
      []
    );

    return (
      <Group h="100%" px="md" justify="space-between">
        {/* 【左側セクション】: ブランドアイデンティティとモバイルナビゲーション制御 */}
        <Group>
          {/* 【ハンバーガーメニュー】: モバイル専用ナビゲーション制御
               【実装詳細】: Burgerコンポーネントによる標準的なハンバーガーメニュー
               【アクセシビリティ】: 適切なARIA属性とタップ領域の確保
               【条件表示】: isMobileフラグによる適切なレスポンシブ表示
               🟢 信頼性レベル: Mantineベストプラクティス準拠 */}
          {isMobile && (
            <Burger
              opened={hamburgerOpened}
              onClick={onHamburgerToggle}
              size="sm"
              aria-label="ナビゲーションメニューを開く"
              style={accessibleButtonStyle}
            />
          )}

          {/* 【ブランドロゴセクション】: アプリケーションのブランドアイデンティティ表示
               【設計方針】: シンプルなテキストベースのブランド表示
               【将来拡張】: 画像ロゴやより複雑なブランディングに対応可能
               🟢 信頼性レベル: 基本的なブランディング要件準拠 */}
          <Group gap="xs">
            <Text size="lg" fw={600}>
              アプリ名
            </Text>
          </Group>
        </Group>

        {/* 【中央セクション】: デスクトップ専用水平ナビゲーション
             【実装詳細】: デスクトップ環境での効率的なナビゲーション提供
             【条件表示】: モバイル環境では非表示による適切なレスポンシブ対応
             【アクセシビリティ】: navigation roleとaria-labelによる支援技術対応 */}
        {!isMobile && (
          <nav aria-label="メインナビゲーション" ref={navigationRef}>
            <Group gap="xs" role="menubar">
              {items.map((item, index) => (
                <UnstyledButton
                  key={item.id}
                  ref={(el) => {
                    menuItemsRef.current[index] = el;
                  }}
                  style={navigationItemStyles.root}
                  role="menuitem"
                  aria-label={item.label}
                  aria-current={item.path === window?.location?.pathname ? "page" : undefined}
                  tabIndex={index === 0 ? 0 : -1}
                  onFocus={() => {
                    currentFocusIndex.current = index;
                  }}
                >
                  <Group gap="xs" wrap="nowrap">
                    {item.icon && <item.icon size={NAVIGATION_ICON_SIZE} />}
                    <Text size="sm">{item.label}</Text>
                  </Group>
                </UnstyledButton>
              ))}
            </Group>
          </nav>
        )}

        {/* 【右側セクション】: テーマ制御とアプリケーション設定
             【機能詳細】: ライト/ダークテーマの切り替え機能
             【ユーザビリティ】: 視覚的に分かりやすいアイコン表示
             【アクセシビリティ】: 適切なaria-labelとタップ領域確保 */}
        <ActionIcon
          variant="subtle"
          onClick={() => toggleColorScheme()}
          size="lg"
          aria-label="テーマを切り替える"
          style={accessibleButtonStyle}
        >
          {/* 【テーマアイコン動的表示】: 現在のテーマ状態に応じた適切なアイコン表示
               【視覚的フィードバック】: ユーザーの操作結果を即座に反映
               【アイコン選択】: 直感的な太陽（ライト）/月（ダーク）アイコン */}
          {colorScheme === "dark" ? (
            <IconSun size={THEME_ICON_SIZE} />
          ) : (
            <IconMoon size={THEME_ICON_SIZE} />
          )}
        </ActionIcon>
      </Group>
    );
  }
);

HeaderNavigation.displayName = "HeaderNavigation";
