import { type Page, test as base, expect } from "@playwright/test";
import { TEST_USER } from "./test-user";

/**
 * 認証済みテスト用のカスタムフィクスチャ
 *
 * このフィクスチャを使用すると、認証済み状態でテストを開始できます。
 */
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // storageStateから認証状態を読み込むため、追加のログイン不要
    await use(page);
  },
});

export { expect, TEST_USER };

/**
 * 認証フローのヘルパー関数
 */
export async function signIn(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto("/auth/signin");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();
}

export async function signUp(page: Page, email: string, password: string, name?: string) {
  await page.goto("/auth/signup");
  if (name) {
    await page.getByLabel("表示名").fill(name);
  }
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "アカウントを作成" }).click();
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "ログアウト" }).click();
}
