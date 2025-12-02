import { type FullConfig, chromium } from "@playwright/test";
import { TEST_USER } from "./fixtures/test-user";

/**
 * グローバルセットアップ
 *
 * テスト実行前にテストユーザーを作成し、認証状態を保存します。
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // サインアップページに移動
    await page.goto(`${baseURL}/auth/signup`);

    // テストユーザーを作成
    await page.getByLabel("表示名").fill(TEST_USER.name);
    await page.getByLabel("メールアドレス").fill(TEST_USER.email);
    await page.getByLabel("パスワード").fill(TEST_USER.password);
    await page.getByRole("button", { name: "アカウントを作成" }).click();

    // ホームページにリダイレクトされるまで待機
    await page.waitForURL(`${baseURL}/`, { timeout: 10000 });

    // 認証状態を保存
    await context.storageState({ path: "playwright/.auth/user.json" });

    console.log("✓ テストユーザーを作成し、認証状態を保存しました");
  } catch (error) {
    // ユーザーが既に存在する場合はサインインを試みる
    console.log("サインアップに失敗しました。サインインを試みます...");

    await page.goto(`${baseURL}/auth/signin`);
    await page.getByLabel("メールアドレス").fill(TEST_USER.email);
    await page.getByLabel("パスワード").fill(TEST_USER.password);
    await page.getByRole("button", { name: "ログイン", exact: true }).click();

    // ホームページにリダイレクトされるまで待機
    await page.waitForURL(`${baseURL}/`, { timeout: 10000 });

    // 認証状態を保存
    await context.storageState({ path: "playwright/.auth/user.json" });

    console.log("✓ 既存ユーザーでサインインし、認証状態を保存しました");
  }

  await browser.close();
}

export default globalSetup;
