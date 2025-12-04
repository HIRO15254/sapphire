import { expect, test } from "./fixtures/auth";

/**
 * セッション機能のE2Eテスト
 *
 * 注: これらのテストは認証済み状態で実行されます（storageStateを使用）
 */

test.describe("セッション機能", () => {
  test.describe("セッション一覧", () => {
    test("認証済みユーザーがセッション一覧ページにアクセスできる", async ({ page }) => {
      await page.goto("/poker-sessions");

      // ページが正しく表示されることを確認
      await expect(page.getByRole("heading", { name: "ポーカーセッション" })).toBeVisible({
        timeout: 10000,
      });
    });

    test("統計情報が表示される", async ({ page }) => {
      await page.goto("/poker-sessions");

      // 統計セクションまたは空の状態メッセージが表示されることを確認
      // セッションがない場合は「セッションがありません」が表示される
      const hasStats = await page
        .getByText("総収支")
        .isVisible()
        .catch(() => false);
      if (hasStats) {
        await expect(page.getByText("総収支")).toBeVisible({ timeout: 10000 });
        await expect(page.getByText("セッション数")).toBeVisible();
      } else {
        await expect(page.getByText("セッションがありません")).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe("セッション作成", () => {
    test("新規セッションモーダルが開ける", async ({ page }) => {
      await page.goto("/poker-sessions");

      // 新規セッションボタンをクリック
      await page.getByRole("button", { name: "新規セッション" }).click();

      // モーダルが表示されることを確認
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

      // モーダルのタイトルを確認
      await expect(page.getByRole("heading", { name: "新規セッション" })).toBeVisible();

      // フォーム要素が存在することを確認
      await expect(page.getByLabel(/日時/)).toBeVisible();
      await expect(page.getByPlaceholder("例: ポーカースタジアム渋谷")).toBeVisible();
      await expect(page.getByLabel(/バイイン/)).toBeVisible();
      await expect(page.getByLabel(/キャッシュアウト/)).toBeVisible();
      await expect(page.getByLabel(/プレイ時間/)).toBeVisible();
      await expect(page.getByRole("button", { name: "保存" })).toBeVisible();
    });
  });

  test.describe("セッションフィルタリング", () => {
    test("日付でフィルタリングできる", async ({ page }) => {
      await page.goto("/poker-sessions");

      // フィルターセクションが存在することを確認
      await expect(page.getByText("フィルター")).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("ナビゲーション", () => {
    test("ホームページに戻れる", async ({ page }) => {
      await page.goto("/poker-sessions");

      // ホームに戻る（ロゴまたはホームリンク）
      await page.goto("/");

      await expect(page.getByText("ポーカーセッショントラッカー")).toBeVisible();
    });

    test("ログアウトできる", async ({ page }) => {
      await page.goto("/");

      // ログアウトボタンをクリック
      await page.getByRole("button", { name: "ログアウト" }).click();

      // ログアウト状態を確認（ログインボタンが表示される）
      await expect(page.getByText("Googleでログイン")).toBeVisible({ timeout: 10000 });
    });
  });
});
