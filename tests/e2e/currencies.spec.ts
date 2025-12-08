import { expect, test } from "./fixtures/auth";

/**
 * 通貨管理機能のE2Eテスト
 *
 * 注: これらのテストは認証済み状態で実行されます（storageStateを使用）
 */

test.describe("通貨管理機能", () => {
  test.describe("ページアクセス", () => {
    test("認証済みユーザーが通貨管理ページにアクセスできる", async ({ page }) => {
      await page.goto("/settings/currencies");

      // ページが正しく表示されることを確認
      await expect(page.getByRole("heading", { name: "通貨管理" })).toBeVisible({
        timeout: 10000,
      });
    });

    test("サイドバーから通貨管理ページに遷移できる", async ({ page }) => {
      await page.goto("/");

      // サイドバーの通貨管理リンクをクリック
      await page.getByRole("link", { name: "通貨管理" }).click();

      // 通貨管理ページに遷移することを確認
      await expect(page).toHaveURL("/settings/currencies");
      await expect(page.getByRole("heading", { name: "通貨管理" })).toBeVisible();
    });
  });

  test.describe("通貨CRUD操作", () => {
    test("新しい通貨を作成できる", async ({ page }) => {
      const timestamp = Date.now();
      const currencyName = `テスト通貨${timestamp}`;

      await page.goto("/settings/currencies");

      // 通貨を追加ボタンをクリック
      await page.getByRole("button", { name: "通貨を追加" }).click();

      // モーダルが表示されることを確認
      await expect(page.getByRole("dialog")).toBeVisible();

      // 通貨名を入力
      await page.getByLabel("通貨名").fill(currencyName);

      // 追加ボタンをクリック
      await page.getByRole("button", { name: "追加", exact: true }).click();

      // 成功通知が表示されることを確認
      await expect(page.getByText("通貨を追加しました")).toBeVisible({ timeout: 10000 });

      // ページをリロードして確認
      await page.reload();
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);

      // 作成した通貨がリストに表示されることを確認
      await expect(page.getByText(currencyName, { exact: true })).toBeVisible({ timeout: 10000 });
    });

    test("通貨を編集できる", async ({ page }) => {
      const timestamp = Date.now();
      const originalName = `編集元通貨${timestamp}`;
      const updatedName = `編集後通貨${timestamp}`;

      await page.goto("/settings/currencies");

      // まず通貨を作成
      await page.getByRole("button", { name: "通貨を追加" }).click();
      await page.getByLabel("通貨名").fill(originalName);
      await page.getByRole("button", { name: "追加", exact: true }).click();
      await expect(page.getByText("通貨を追加しました")).toBeVisible({ timeout: 10000 });

      // ページをリロードして確認
      await page.reload();
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);

      // 通貨名をクリックしてカード内の編集ボタンを探す
      // Mantine Card の構造: div.mantine-Card-root 内の button[aria-label="編集"]
      const cardWithCurrency = page.locator(".mantine-Card-root").filter({ hasText: originalName });
      await cardWithCurrency.getByRole("button", { name: "編集" }).click();

      // 編集モーダルが表示されることを確認
      await expect(page.getByRole("dialog")).toBeVisible();

      // 通貨名を変更
      await page.getByLabel("通貨名").clear();
      await page.getByLabel("通貨名").fill(updatedName);

      // 更新ボタンをクリック
      await page.getByRole("button", { name: "更新" }).click();

      // 成功通知が表示されることを確認
      await expect(page.getByText("通貨を更新しました")).toBeVisible({ timeout: 10000 });

      // ページをリロードして確認
      await page.reload();
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);

      // 更新後の通貨名がリストに表示されることを確認
      await expect(page.getByText(updatedName, { exact: true })).toBeVisible({ timeout: 10000 });
    });

    test.skip("使用されていない通貨を削除できる", async ({ page }) => {
      const timestamp = Date.now();
      const currencyName = `削除対象通貨${timestamp}`;

      await page.goto("/settings/currencies");

      // まず通貨を作成
      await page.getByRole("button", { name: "通貨を追加" }).click();
      await page.getByLabel("通貨名").fill(currencyName);
      await page.getByRole("button", { name: "追加", exact: true }).click();
      await expect(page.getByText("通貨を追加しました")).toBeVisible({ timeout: 10000 });

      // ページをリロードして確認
      await page.reload();
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);

      // 作成した通貨カードを見つけて削除ボタンをクリック
      const cardWithCurrency = page.locator(".mantine-Card-root").filter({ hasText: currencyName });
      await cardWithCurrency.getByRole("button", { name: "削除" }).click();

      // 削除確認モーダルが表示されることを確認
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText(`「${currencyName}」を削除しますか？`)).toBeVisible();

      // 削除ボタンをクリック（モーダル内の削除ボタン）
      await page.getByRole("dialog").getByRole("button", { name: "削除" }).click();

      // 成功通知が表示されることを確認
      await expect(page.getByText("通貨を削除しました")).toBeVisible({ timeout: 10000 });

      // UI更新を待つ
      await page.waitForTimeout(500);

      // 削除した通貨がリストから消えることを確認
      await expect(page.getByText(currencyName, { exact: true })).toBeHidden({ timeout: 10000 });
    });
  });

  test.describe("バリデーション", () => {
    test("空白のみの通貨名では作成できない", async ({ page }) => {
      await page.goto("/settings/currencies");

      // 通貨を追加ボタンをクリック
      await page.getByRole("button", { name: "通貨を追加" }).click();

      // 空白のみの通貨名を入力（HTML5 required を回避）
      await page.getByLabel("通貨名").fill("   ");

      // 追加ボタンをクリック
      await page.getByRole("button", { name: "追加", exact: true }).click();

      // バリデーションエラーが表示されることを確認
      await expect(page.getByText("通貨名は必須です")).toBeVisible();
    });

    test("重複する通貨名では作成できない", async ({ page }) => {
      const timestamp = Date.now();
      const currencyName = `重複通貨${timestamp}`;

      await page.goto("/settings/currencies");

      // 1つ目の通貨を作成
      await page.getByRole("button", { name: "通貨を追加" }).click();
      await page.getByLabel("通貨名").fill(currencyName);
      await page.getByRole("button", { name: "追加", exact: true }).click();
      await expect(page.getByText("通貨を追加しました")).toBeVisible({ timeout: 10000 });

      // モーダルが閉じるのを待つ
      await page.waitForTimeout(500);

      // 同じ名前で2つ目の通貨を作成しようとする
      await page.getByRole("button", { name: "通貨を追加" }).click();
      await page.getByLabel("通貨名").fill(currencyName);
      await page.getByRole("button", { name: "追加", exact: true }).click();

      // エラー通知が表示されることを確認
      await expect(page.getByText("同じ名前の通貨が既に存在します")).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
