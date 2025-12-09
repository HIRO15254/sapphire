import { expect, test } from "@playwright/test";

/**
 * 認証機能のE2Eテスト
 *
 * 注: これらのテストは認証状態なしで実行されます（auth-testsプロジェクト）
 */

test.describe("認証機能", () => {
  test.describe("サインアップ", () => {
    test("新規ユーザーがアカウントを作成できる", async ({ page }) => {
      const timestamp = Date.now();
      const testEmail = `test-signup-${timestamp}@example.com`;

      await page.goto("/auth/signup");

      // フォームに入力
      await page.getByLabel("表示名").fill(`Test User ${timestamp}`);
      await page.getByLabel("メールアドレス").fill(testEmail);
      await page.getByLabel("パスワード").fill("TestPassword123!");

      // 送信
      await page.getByRole("button", { name: "アカウントを作成" }).click();

      // ホームページにリダイレクトされるか、ログイン状態を確認
      // サインアップ→自動サインイン→リダイレクトのフローを待機
      await expect(page).toHaveURL("/", { timeout: 30000 });

      // ログイン状態を確認（ダッシュボードが表示される）
      await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible({
        timeout: 10000,
      });
    });

    test("短すぎるパスワードでエラーが表示される", async ({ page }) => {
      await page.goto("/auth/signup");

      await page.getByLabel("メールアドレス").fill("test@example.com");
      await page.getByLabel("パスワード").fill("short");
      await page.getByRole("button", { name: "アカウントを作成" }).click();

      // バリデーションエラーが表示されることを確認
      await expect(page.getByText("8文字以上")).toBeVisible({ timeout: 5000 });
    });

    test("無効なメールアドレスでエラーが表示される", async ({ page }) => {
      await page.goto("/auth/signup");

      await page.getByLabel("メールアドレス").fill("invalid-email");
      await page.getByLabel("パスワード").fill("TestPassword123!");
      await page.getByRole("button", { name: "アカウントを作成" }).click();

      // バリデーションエラーが表示されることを確認
      await expect(page.getByText(/メールアドレス/)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("サインイン", () => {
    test("登録済みユーザーがログインできる", async ({ page }) => {
      // global-setupで作成したテストユーザーを使用
      // テストユーザー: e2e-test@example.com / TestPassword123!
      await page.goto("/auth/signin");

      // ログイン
      await page.getByLabel("メールアドレス").fill("e2e-test@example.com");
      await page.getByLabel("パスワード").fill("TestPassword123!");
      await page.getByRole("button", { name: "ログイン", exact: true }).click();

      // ホームページにリダイレクトされることを確認
      await expect(page).toHaveURL("/", { timeout: 15000 });
      // ダッシュボードが表示されることを確認
      await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible({
        timeout: 10000,
      });
    });

    test("間違ったパスワードでエラーが表示される", async ({ page }) => {
      await page.goto("/auth/signin");

      await page.getByLabel("メールアドレス").fill("test@example.com");
      await page.getByLabel("パスワード").fill("WrongPassword123!");
      await page.getByRole("button", { name: "ログイン", exact: true }).click();

      // エラーメッセージが表示されることを確認
      await expect(page.getByText("認証に失敗しました")).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("ナビゲーション", () => {
    test("サインインページからサインアップページに遷移できる", async ({ page }) => {
      await page.goto("/auth/signin");

      await page.getByRole("link", { name: "新規登録" }).click();

      await expect(page).toHaveURL("/auth/signup");
    });

    test("サインアップページからサインインページに遷移できる", async ({ page }) => {
      await page.goto("/auth/signup");

      await page.getByRole("link", { name: "ログイン" }).click();

      await expect(page).toHaveURL("/auth/signin");
    });

    test("ホームページからサインインページに遷移できる", async ({ page }) => {
      await page.goto("/");

      // Button component={Link} は link ロールになる
      await page.getByRole("link", { name: "ログイン" }).click();

      await expect(page).toHaveURL("/auth/signin");
    });
  });

  test.describe("レイアウト", () => {
    test("サインインページにはサイドバーが表示されない", async ({ page }) => {
      await page.goto("/auth/signin");

      // AppShellのナビゲーションバーが存在しないことを確認
      const navbar = page.locator("[data-mantine-navbar]");
      await expect(navbar).not.toBeVisible({ timeout: 5000 });
    });

    test("サインアップページにはサイドバーが表示されない", async ({ page }) => {
      await page.goto("/auth/signup");

      // AppShellのナビゲーションバーが存在しないことを確認
      const navbar = page.locator("[data-mantine-navbar]");
      await expect(navbar).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("認証後リダイレクト", () => {
    test("ログイン後はダッシュボード（/）にリダイレクトされる", async ({ page }) => {
      await page.goto("/auth/signin");

      // テストユーザーでログイン
      await page.getByLabel("メールアドレス").fill("e2e-test@example.com");
      await page.getByLabel("パスワード").fill("TestPassword123!");
      await page.getByRole("button", { name: "ログイン", exact: true }).click();

      // ダッシュボード（/）にリダイレクトされることを確認
      await expect(page).toHaveURL("/", { timeout: 15000 });

      // ダッシュボードが表示されていることを確認
      await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
