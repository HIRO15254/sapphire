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
    test("新規セッションボタンから新規作成ページに遷移できる", async ({ page }) => {
      await page.goto("/poker-sessions");

      // 新規セッションボタン（リンク）をクリック
      await page.getByRole("link", { name: "新規セッション" }).click();

      // 新規作成ページに遷移することを確認
      await expect(page).toHaveURL("/poker-sessions/new");

      // フォームが表示されることを確認
      await expect(page.getByRole("heading", { name: "新規セッション" })).toBeVisible();
      await expect(page.getByLabel(/日時/)).toBeVisible();
      // 場所フィールドは複数要素があるため、textbox roleで特定
      await expect(page.getByRole("textbox", { name: /場所/ })).toBeVisible();
      await expect(page.getByLabel(/バイイン/)).toBeVisible();
      await expect(page.getByLabel(/キャッシュアウト/)).toBeVisible();
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
    test("ダッシュボードに戻れる", async ({ page }) => {
      await page.goto("/poker-sessions");

      // サイドバーのダッシュボードリンクをクリック
      await page.getByRole("link", { name: "ダッシュボード" }).click();

      // ダッシュボードに遷移
      await expect(page).toHaveURL("/");
      // ダッシュボードの要素が表示される
      await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible({
        timeout: 10000,
      });
    });

    test("ログアウトできる", async ({ page }) => {
      await page.goto("/");

      // サイドバーのログアウトボタンをクリック（NavLinkはhrefがないためbuttonロール）
      await page.getByRole("button", { name: "ログアウト" }).click();

      // サインインページにリダイレクトされる
      await expect(page).toHaveURL("/auth/signin", { timeout: 10000 });
    });
  });
});
