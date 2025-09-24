import { useMemo } from "react";
import type { GroupedNavigationItems, NavigationConfig, SafeNavigationConfig } from "../types";

/**
 * ナビゲーション設定の検証とフォールバック処理を行うカスタムフック
 * 【機能概要】: 不正なnavigationConfig時の安全なフォールバック設定
 * 【実装方針】: TC-101異常系テスト対応、エラー時の安全な代替表示
 * 【パフォーマンス】: useMemo による再計算の最適化
 * 【エラーハンドリング】: 簡潔で互換性の高いバリデーション
 * 🟡 信頼性レベル: エラーハンドリングベストプラクティスから推測
 */
export const useNavigationConfig = (navigationConfig: NavigationConfig) => {
  // 【デフォルトナビゲーション】: 不正なnavigationConfig時のフォールバック設定 🟡
  // 【実装内容】: TC-101異常系テスト対応、エラー時の安全な代替表示
  const safeNavigationConfig: SafeNavigationConfig = useMemo(() => {
    // 基本的なバリデーション（テスト互換性を重視）
    if (!navigationConfig || typeof navigationConfig !== "object") {
      console.warn("ナビゲーション設定が不正です: navigationConfigが未定義または不正な形式です");
      return {
        primary: [{ id: "default", label: "ホーム", path: "/" }],
        secondary: [],
      };
    }

    // primary配列の検証（シンプル版）
    // biome-ignore lint/suspicious/noExplicitAny: navigationConfigの型不明データの処理で必要
    let validPrimary: any[] = [];
    if (Array.isArray(navigationConfig.primary)) {
      const originalLength = navigationConfig.primary.length;
      validPrimary = navigationConfig.primary.filter(
        (item) => item && typeof item === "object" && item.id && item.label && item.path
      );

      if (validPrimary.length !== originalLength) {
        console.warn(
          "ナビゲーション設定が不正です: 一部のprimary項目に必須フィールドが不足しています"
        );
      }
    } else if (navigationConfig.primary && !Array.isArray(navigationConfig.primary)) {
      console.warn("ナビゲーション設定が不正です: primary配列が不正な形式です");
    }

    // secondary配列の検証（シンプル版）
    // biome-ignore lint/suspicious/noExplicitAny: navigationConfigの型不明データの処理で必要
    let validSecondary: any[] = [];
    if (navigationConfig.secondary === null) {
      // null の場合は空配列として処理（警告なし）
      validSecondary = [];
    } else if (Array.isArray(navigationConfig.secondary)) {
      const originalLength = navigationConfig.secondary.length;
      validSecondary = navigationConfig.secondary.filter(
        (item) => item && typeof item === "object" && item.id && item.label && item.path
      );

      if (validSecondary.length !== originalLength) {
        console.warn(
          "ナビゲーション設定が不正です: 一部のsecondary項目に必須フィールドが不足しています"
        );
      }
    } else if (navigationConfig.secondary && !Array.isArray(navigationConfig.secondary)) {
      console.warn("ナビゲーション設定が不正です: secondary配列が不正な形式です");
    }

    // 必要最小限のフォールバック
    const finalPrimary =
      validPrimary.length > 0 ? validPrimary : [{ id: "default", label: "ホーム", path: "/" }];

    return {
      primary: finalPrimary,
      secondary: validSecondary,
    };
  }, [navigationConfig]);

  // 【グループ化処理】: ナビゲーション項目のグループ分け、TC-003テスト対応 🟢
  const groupedSecondaryItems: GroupedNavigationItems = useMemo(() => {
    return safeNavigationConfig.secondary.reduce((acc, item) => {
      const group = item.group || "default";
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {} as GroupedNavigationItems);
  }, [safeNavigationConfig.secondary]);

  return {
    safeNavigationConfig,
    groupedSecondaryItems,
  };
};

export type UseNavigationConfigReturn = ReturnType<typeof useNavigationConfig>;
