import type { FullConfig } from "@playwright/test";

/**
 * グローバルテアダウン
 *
 * テスト実行後のクリーンアップを行います。
 * 注: テストユーザーの削除はデータベースの外部キー制約により
 *     複雑になる可能性があるため、テスト環境ではユーザーを残すことを推奨します。
 *     定期的にテストDBをリセットする運用を推奨します。
 */
async function globalTeardown(_config: FullConfig) {
  console.log("✓ E2Eテストが完了しました");
}

export default globalTeardown;
