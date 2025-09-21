import type {
  NavigationItem,
  NavigationItemValidator,
  NavigationValidationResult,
  SafeNavigationConfig,
} from "../types/NavigationTypes";

/**
 * ナビゲーション項目の単体バリデーション関数
 * 【機能概要】: 単一のナビゲーション項目の形式チェック
 * 【型安全性】: type predicateによる型ガード機能
 * 【エラーハンドリング】: 詳細なエラーメッセージ生成
 * 🟢 信頼性レベル: TypeScript型システムから確認済み
 */
export const isValidNavigationItem: NavigationItemValidator = (
  item: unknown
): item is NavigationItem => {
  if (!item || typeof item !== "object") {
    return false;
  }

  const obj = item as Record<string, unknown>;

  // 必須フィールドのチェック
  if (typeof obj.id !== "string" || obj.id.trim() === "") {
    return false;
  }

  if (typeof obj.label !== "string" || obj.label.trim() === "") {
    return false;
  }

  if (typeof obj.path !== "string" || obj.path.trim() === "") {
    return false;
  }

  // オプションフィールドのチェック
  if (obj.icon !== undefined && typeof obj.icon !== "function") {
    return false;
  }

  if (obj.group !== undefined && typeof obj.group !== "string") {
    return false;
  }

  if (obj.badge !== undefined && typeof obj.badge !== "string" && typeof obj.badge !== "number") {
    return false;
  }

  if (obj.hasNotification !== undefined && typeof obj.hasNotification !== "boolean") {
    return false;
  }

  if (obj.description !== undefined && typeof obj.description !== "string") {
    return false;
  }

  return true;
};

/**
 * ナビゲーション項目配列のバリデーション
 * 【機能概要】: ナビゲーション項目配列の形式と内容チェック
 * 【エラーハンドリング】: 詳細なエラー位置と内容の特定
 */
export const validateNavigationItems = (
  items: unknown,
  context: "primary" | "secondary"
): { valid: NavigationItem[]; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const valid: NavigationItem[] = [];

  if (!Array.isArray(items)) {
    errors.push(`${context}配列が配列形式ではありません`);
    return { valid, errors, warnings };
  }

  items.forEach((item, index) => {
    if (!isValidNavigationItem(item)) {
      const itemObj = item as Record<string, unknown>;

      if (!item || typeof item !== "object") {
        errors.push(`${context}[${index}]: 項目がオブジェクト形式ではありません`);
        return;
      }

      // 詳細なエラーメッセージ
      if (!itemObj.id || typeof itemObj.id !== "string" || itemObj.id.trim() === "") {
        errors.push(`${context}[${index}]: idフィールドが必須です（空でない文字列）`);
      }

      if (!itemObj.label || typeof itemObj.label !== "string" || itemObj.label.trim() === "") {
        errors.push(`${context}[${index}]: labelフィールドが必須です（空でない文字列）`);
      }

      if (!itemObj.path || typeof itemObj.path !== "string" || itemObj.path.trim() === "") {
        errors.push(`${context}[${index}]: pathフィールドが必須です（空でない文字列）`);
      }

      return;
    }

    valid.push(item);
  });

  // 重複IDの検査
  const ids = valid.map((item) => item.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    warnings.push(`${context}配列に重複するIDがあります: ${[...new Set(duplicateIds)].join(", ")}`);
  }

  return { valid, errors, warnings };
};

/**
 * ナビゲーション設定全体のバリデーション
 * 【機能概要】: NavigationConfigの包括的な検証と安全な設定生成
 * 【エラーハンドリング】: 段階的フォールバック機能
 * 【パフォーマンス】: 一度の処理で全項目を検証
 */
export const validateNavigationConfig = (config: unknown): NavigationValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 基本構造の検証
  if (!config || typeof config !== "object") {
    return {
      isValid: false,
      config: {
        primary: [{ id: "default", label: "ホーム", path: "/" }],
        secondary: [],
      },
      errors: ["navigationConfigがオブジェクト形式ではありません"],
      warnings: ["デフォルトのナビゲーション設定を使用します"],
    };
  }

  const obj = config as Record<string, unknown>;

  // primary配列の検証
  const primaryResult = validateNavigationItems(obj.primary, "primary");
  errors.push(...primaryResult.errors);
  warnings.push(...primaryResult.warnings);

  // secondary配列の検証
  const secondaryResult = validateNavigationItems(obj.secondary, "secondary");
  errors.push(...secondaryResult.errors);
  warnings.push(...secondaryResult.warnings);

  // 最小限の項目確保 - primaryが完全に空の場合のみフォールバック
  const finalPrimary =
    primaryResult.valid.length > 0
      ? primaryResult.valid
      : [{ id: "default", label: "ホーム", path: "/" }];

  // primary配列が存在するが有効な項目がない場合のみ警告
  if (Array.isArray(obj.primary) && obj.primary.length > 0 && primaryResult.valid.length === 0) {
    warnings.push("primary項目がすべて不正なため、デフォルトのホーム項目を追加しました");
  } else if (!Array.isArray(obj.primary) && primaryResult.valid.length === 0) {
    warnings.push("primary配列が未定義のため、デフォルトのホーム項目を追加しました");
  }

  const safeConfig: SafeNavigationConfig = {
    primary: finalPrimary,
    secondary: secondaryResult.valid,
  };

  return {
    isValid: errors.length === 0,
    config: safeConfig,
    errors,
    warnings,
  };
};

/**
 * MediaQuery APIのサポート検出
 * 【機能概要】: ブラウザの機能サポート状況確認
 * 【エラーハンドリング】: 安全なフォールバック提供
 */
export const isMediaQuerySupported = (): boolean => {
  try {
    return (
      typeof window !== "undefined" &&
      "matchMedia" in window &&
      typeof window.matchMedia === "function"
    );
  } catch {
    return false;
  }
};

/**
 * 開発環境での詳細ログ出力
 * 【機能概要】: デバッグ情報の構造化出力
 * 【パフォーマンス】: 本番環境では無効化
 */
export const logValidationResult = (result: NavigationValidationResult): void => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (result.errors.length > 0) {
    console.group("🔴 ナビゲーション設定エラー");
    result.errors.forEach((error) => console.error(error));
    console.groupEnd();
  }

  if (result.warnings.length > 0) {
    console.group("🟡 ナビゲーション設定警告");
    result.warnings.forEach((warning) => console.warn(warning));
    console.groupEnd();
  }

  if (result.isValid && result.errors.length === 0 && result.warnings.length === 0) {
    console.log("✅ ナビゲーション設定は正常です");
  }
};
