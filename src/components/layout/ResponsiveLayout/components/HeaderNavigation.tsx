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
import { memo, useMemo } from "react";
import type { NavigationItem } from "../types";

/**
 * 【アイコンサイズ定数】: 視認性とデザイン一貫性のためのアイコンサイズ
 * 【設計方針】: Mantineのデザインシステムと調和する16pxサイズ
 * 🟢 信頼性レベル: Mantineデザインシステムガイドラインに基づく
 */
const NAVIGATION_ICON_SIZE = 16;

/**
 * 【テーマアイコンサイズ定数】: テーマ切り替えボタンの視認性確保
 * 🟢 信頼性レベル: デザインシステム要件のバランス
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
               【条件表示】: isMobileフラグによる適切なレスポンシブ表示
               🟢 信頼性レベル: Mantineベストプラクティス準拠 */}
          {isMobile && <Burger opened={hamburgerOpened} onClick={onHamburgerToggle} size="sm" />}

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
             【条件表示】: モバイル環境では非表示による適切なレスポンシブ対応 */}
        {!isMobile && (
          <nav>
            <Group gap="xs">
              {items.map((item) => (
                <UnstyledButton key={item.id} style={navigationItemStyles.root}>
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
             【ユーザビリティ】: 視覚的に分かりやすいアイコン表示 */}
        <ActionIcon variant="subtle" onClick={() => toggleColorScheme()} size="lg">
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
