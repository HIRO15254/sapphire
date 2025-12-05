import { expect, test } from "@playwright/test";

/**
 * サイドバーナビゲーションのE2Eテスト
 *
 * User Story 1: サイドバーナビゲーションによるページ移動
 * - ユーザーがどのページからでもサイドバーを使って主要機能へ1クリックで移動できる
 */

test.describe("サイドバーナビゲーション", () => {
  // 認証済みの状態でテストを実行（authenticated プロジェクトを使用）
  test.use({ storageState: "playwright/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    // ダッシュボードに移動
    await page.goto("/");
    // サイドバーが表示されるまで待機
    await expect(page.getByRole("navigation")).toBeVisible({ timeout: 10000 });
  });

  test.describe("ダッシュボードからの遷移", () => {
    test("サイドバーからセッション一覧に遷移できる", async ({ page }) => {
      // セッション一覧リンクをクリック
      await page.getByRole("link", { name: "セッション一覧" }).click();

      // URLが変更されることを確認
      await expect(page).toHaveURL("/poker-sessions");
    });
  });

  test.describe("セッション一覧からの遷移", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/poker-sessions");
    });

    test("サイドバーからダッシュボードに遷移できる", async ({ page }) => {
      // ダッシュボードリンクをクリック
      await page.getByRole("link", { name: "ダッシュボード" }).click();

      // URLが変更されることを確認
      await expect(page).toHaveURL("/");
    });
  });

  test.describe("アクティブ状態のハイライト", () => {
    test("現在のページがサイドバーでハイライトされる", async ({ page }) => {
      // ダッシュボードにいるとき
      await page.goto("/");
      const dashboardLink = page.getByRole("link", { name: "ダッシュボード" });
      await expect(dashboardLink).toHaveAttribute("data-active", "true");

      // セッション一覧に移動
      await page.goto("/poker-sessions");
      const sessionsLink = page.getByRole("link", { name: "セッション一覧" });
      await expect(sessionsLink).toHaveAttribute("data-active", "true");
    });
  });

  test.describe("ログアウト", () => {
    test("サイドバーからログアウトできる", async ({ page }) => {
      // ログアウトボタンをクリック（NavLinkはhrefがないためbuttonロール）
      await page.getByRole("button", { name: "ログアウト" }).click();

      // サインインページにリダイレクトされることを確認
      await expect(page).toHaveURL("/auth/signin", { timeout: 10000 });
    });
  });
});

test.describe("モバイルナビゲーション", () => {
  test.use({
    storageState: "playwright/.auth/user.json",
    viewport: { width: 375, height: 667 }, // iPhone SE サイズ
  });

  test("モバイルでハンバーガーメニューが表示される", async ({ page }) => {
    await page.goto("/");

    // ハンバーガーメニューが表示されることを確認
    const burger = page.getByLabel("ナビゲーションメニューを開く");
    await expect(burger).toBeVisible({ timeout: 5000 });
  });

  test("モバイルでナビゲーションができる", async ({ page }) => {
    await page.goto("/");

    // ハンバーガーメニューをクリック
    const burger = page.getByLabel("ナビゲーションメニューを開く");
    await burger.click();

    // サイドバーのアニメーション完了を待機
    await page.waitForTimeout(300);

    // セッション一覧リンクをクリック
    const sessionsLink = page.getByRole("link", { name: "セッション一覧" });
    await expect(sessionsLink).toBeVisible({ timeout: 5000 });
    await sessionsLink.click();

    // URLが変更される
    await expect(page).toHaveURL("/poker-sessions");
  });
});
