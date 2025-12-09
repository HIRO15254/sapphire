import { expect, test } from "./fixtures/auth";

/**
 * ゲーム管理機能のE2Eテスト
 *
 * 注: これらのテストは認証済み状態で実行されます（storageStateを使用）
 */

test.describe("ゲーム管理機能", () => {
  test.describe("ページアクセス", () => {
    test("認証済みユーザーがゲーム管理ページにアクセスできる", async ({ page }) => {
      await page.goto("/settings/games");

      // ページが正しく表示されることを確認
      await expect(page.getByRole("heading", { name: "ゲーム管理" })).toBeVisible({
        timeout: 10000,
      });
    });

    test("サイドバーからゲーム管理ページに遷移できる", async ({ page }) => {
      await page.goto("/");

      // サイドバーのゲーム管理リンクをクリック
      await page.getByRole("link", { name: "ゲーム管理" }).click();

      // ゲーム管理ページに遷移することを確認
      await expect(page).toHaveURL("/settings/games");
      await expect(page.getByRole("heading", { name: "ゲーム管理" })).toBeVisible();
    });
  });

  test.describe("ゲームCRUD操作", () => {
    // テスト用の通貨と店舗を事前に作成するヘルパー
    async function createTestCurrencyAndLocation(page: import("@playwright/test").Page) {
      const timestamp = Date.now();
      const currencyName = `テスト通貨${timestamp}`;
      const locationName = `テスト店舗${timestamp}`;

      // 通貨を作成
      await page.goto("/settings/currencies");
      await page.getByRole("button", { name: "通貨を追加" }).click();
      await page.getByLabel("通貨名").fill(currencyName);
      await page.getByRole("button", { name: "追加", exact: true }).click();
      await expect(page.getByText("通貨を追加しました")).toBeVisible({ timeout: 10000 });

      // 店舗を作成（セッション作成フローで）
      await page.goto("/poker-sessions/new");
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);
      await page.getByRole("textbox", { name: "場所" }).click();
      await page.getByPlaceholder("例: ポーカースタジアム渋谷").fill(locationName);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1000);

      return { currencyName, locationName, timestamp };
    }

    // TODO: 店舗作成フロー追加後に有効化
    test.skip("新しいゲームを作成できる", async ({ page }) => {
      const { currencyName, locationName, timestamp } = await createTestCurrencyAndLocation(page);
      const gameName = `1/2 NL テスト${timestamp}`;

      await page.goto("/settings/games");
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);

      // ゲームを追加ボタンをクリック
      await page.getByRole("button", { name: "ゲームを追加" }).click();

      // モーダルが表示されることを確認
      await expect(page.getByRole("dialog")).toBeVisible();

      // フォームに入力（Mantine Selectは textbox role を使用）
      await page.getByRole("textbox", { name: "店舗" }).click();
      await page.waitForTimeout(500);
      await page.getByRole("option", { name: locationName }).click();

      await page.getByRole("textbox", { name: "通貨" }).click();
      await page.waitForTimeout(500);
      await page.getByRole("option", { name: currencyName }).click();

      await page.getByLabel("ゲーム名").fill(gameName);
      await page.getByLabel("スモールブラインド (SB)").fill("1");
      await page.getByLabel("ビッグブラインド (BB)").fill("2");
      await page.getByLabel("最小バイイン (BB単位)").fill("40");
      await page.getByLabel("最大バイイン (BB単位)").fill("200");

      // 作成ボタンをクリック
      await page.getByRole("button", { name: "作成" }).click();

      // 成功通知が表示されることを確認
      await expect(page.getByText("ゲームを作成しました")).toBeVisible({ timeout: 10000 });

      // ページをリロードして確認
      await page.reload();
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);

      // 作成したゲームがリストに表示されることを確認
      await expect(page.getByText(gameName, { exact: true })).toBeVisible({ timeout: 10000 });
    });

    // TODO: 店舗作成フロー追加後に有効化
    test.skip("ゲームをアーカイブできる", async ({ page }) => {
      const { currencyName, locationName, timestamp } = await createTestCurrencyAndLocation(page);
      const gameName = `アーカイブテスト${timestamp}`;

      await page.goto("/settings/games");
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);

      // ゲームを作成
      await page.getByRole("button", { name: "ゲームを追加" }).click();
      await page.getByRole("textbox", { name: "店舗" }).click();
      await page.waitForTimeout(500);
      await page.getByRole("option", { name: locationName }).click();
      await page.getByRole("textbox", { name: "通貨" }).click();
      await page.waitForTimeout(500);
      await page.getByRole("option", { name: currencyName }).click();
      await page.getByLabel("ゲーム名").fill(gameName);
      await page.getByLabel("スモールブラインド (SB)").fill("1");
      await page.getByLabel("ビッグブラインド (BB)").fill("2");
      await page.getByLabel("最小バイイン (BB単位)").fill("40");
      await page.getByLabel("最大バイイン (BB単位)").fill("200");
      await page.getByRole("button", { name: "作成" }).click();
      await expect(page.getByText("ゲームを作成しました")).toBeVisible({ timeout: 10000 });

      // ページをリロードして確認
      await page.reload();
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);

      // ゲームカードを見つけてメニューを開く
      const gameCard = page.locator(".mantine-Card-root").filter({ hasText: gameName });
      await gameCard.getByRole("button").first().click();

      // アーカイブをクリック
      await page.getByRole("menuitem", { name: "アーカイブ" }).click();

      // 成功通知が表示されることを確認
      await expect(page.getByText("ゲームをアーカイブしました")).toBeVisible({ timeout: 10000 });

      // アーカイブ済みバッジが表示されることを確認
      await expect(page.getByText("アーカイブ済み")).toBeVisible();
    });

    // TODO: 店舗作成フロー追加後に有効化
    test.skip("使用されていないゲームを削除できる", async ({ page }) => {
      const { currencyName, locationName, timestamp } = await createTestCurrencyAndLocation(page);
      const gameName = `削除テスト${timestamp}`;

      await page.goto("/settings/games");
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);

      // ゲームを作成
      await page.getByRole("button", { name: "ゲームを追加" }).click();
      await page.getByRole("textbox", { name: "店舗" }).click();
      await page.waitForTimeout(500);
      await page.getByRole("option", { name: locationName }).click();
      await page.getByRole("textbox", { name: "通貨" }).click();
      await page.waitForTimeout(500);
      await page.getByRole("option", { name: currencyName }).click();
      await page.getByLabel("ゲーム名").fill(gameName);
      await page.getByLabel("スモールブラインド (SB)").fill("1");
      await page.getByLabel("ビッグブラインド (BB)").fill("2");
      await page.getByLabel("最小バイイン (BB単位)").fill("40");
      await page.getByLabel("最大バイイン (BB単位)").fill("200");
      await page.getByRole("button", { name: "作成" }).click();
      await expect(page.getByText("ゲームを作成しました")).toBeVisible({ timeout: 10000 });

      // ページをリロードして確認
      await page.reload();
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);

      // ゲームカードを見つけてメニューを開く
      const gameCard = page.locator(".mantine-Card-root").filter({ hasText: gameName });
      await gameCard.getByRole("button").first().click();

      // 削除をクリック
      await page.getByRole("menuitem", { name: "削除" }).click();

      // 削除確認モーダルが表示されることを確認
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText(`「${gameName}」を削除しますか？`)).toBeVisible();

      // 削除ボタンをクリック
      await page.getByRole("dialog").getByRole("button", { name: "削除" }).click();

      // 成功通知が表示されることを確認
      await expect(page.getByText("ゲームを削除しました")).toBeVisible({ timeout: 10000 });

      // 削除したゲームがリストから消えることを確認
      await expect(page.getByText(gameName, { exact: true })).not.toBeVisible();
    });
  });

  test.describe("フィルター機能", () => {
    test("アーカイブ済みの表示/非表示を切り替えられる", async ({ page }) => {
      await page.goto("/settings/games");

      // チェックボックスが表示されることを確認
      const checkbox = page.getByLabel("アーカイブ済みも表示");
      await expect(checkbox).toBeVisible();

      // デフォルトでチェックされていることを確認
      await expect(checkbox).toBeChecked();

      // チェックを外す
      await checkbox.uncheck();
      await expect(checkbox).not.toBeChecked();
    });
  });
});
