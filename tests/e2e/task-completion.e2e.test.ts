import { expect, test } from "@playwright/test";
import { clearDatabase, seedTasks } from "./helpers";

test.describe("タスク完了 E2E", () => {
  test.beforeEach(async () => {
    // データベースをクリーンアップ
    await clearDatabase();
  });

  test("タスクをクリックして完了状態に変更できる", async ({ page }) => {
    // 1. テストデータをシード
    await seedTasks([{ content: "牛乳を買う" }]);

    // 2. ページに移動
    await page.goto("/", { waitUntil: "networkidle" });

    // 3. タスクが表示されるまで待機
    await expect(page.getByText("牛乳を買う")).toBeVisible();

    // 4. チェックボックスをクリック
    const checkbox = page.getByRole("checkbox", { name: /牛乳を買う/ });
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();

    // 5. 完了状態に更新されることを確認
    await expect(checkbox).toBeChecked();

    // 6. 取り消し線スタイルが適用されていることを確認
    const taskText = page.getByText("牛乳を買う");
    await expect(taskText).toHaveCSS("text-decoration", /line-through/);
  });

  test("完了タスクをクリックして未完了状態に戻せる", async ({ page }) => {
    // 1. 完了済みタスクをシード
    await seedTasks([{ content: "レポートを書く", completed: true }]);

    // 2. ページに移動
    await page.goto("/", { waitUntil: "networkidle" });

    // 3. 完了タスクが表示されるまで待機
    await expect(page.getByText("レポートを書く")).toBeVisible();

    // 4. チェックボックスがチェック済みであることを確認
    const checkbox = page.getByRole("checkbox", { name: /レポートを書く/ });
    await expect(checkbox).toBeChecked();

    // 5. チェックボックスをクリックして未完了に戻す
    await checkbox.click();

    // 6. 未完了状態に更新されることを確認
    await expect(checkbox).not.toBeChecked();

    // 7. 取り消し線スタイルが解除されていることを確認
    const taskText = page.getByText("レポートを書く");
    await expect(taskText).not.toHaveCSS("text-decoration", /line-through/);
  });

  test("複数のタスクの完了状態を個別に管理できる", async ({ page }) => {
    // 1. 複数のタスクをシード
    await seedTasks([{ content: "タスク1" }, { content: "タスク2" }, { content: "タスク3" }]);

    // 2. ページに移動
    await page.goto("/", { waitUntil: "networkidle" });

    // 3. すべてのタスクが表示されるまで待機
    await expect(page.getByText("タスク1")).toBeVisible();
    await expect(page.getByText("タスク2")).toBeVisible();
    await expect(page.getByText("タスク3")).toBeVisible();

    // 4. タスク2のみを完了状態にする
    const checkbox2 = page.getByRole("checkbox", { name: /タスク2/ });
    await checkbox2.click();

    // 5. タスク2のみが完了状態になることを確認
    await expect(page.getByRole("checkbox", { name: /タスク1/ })).not.toBeChecked();
    await expect(checkbox2).toBeChecked();
    await expect(page.getByRole("checkbox", { name: /タスク3/ })).not.toBeChecked();
  });

  test("完了状態の視覚的区別が明確である（FR-006）", async ({ page }) => {
    // 1. 未完了と完了のタスクをシード
    await seedTasks([
      { content: "未完了タスク", completed: false },
      { content: "完了タスク", completed: true },
    ]);

    // 2. ページに移動
    await page.goto("/", { waitUntil: "networkidle" });

    // 3. タスクが表示されるまで待機
    await expect(page.getByText("未完了タスク", { exact: true })).toBeVisible();
    await expect(page.getByText("完了タスク", { exact: true })).toBeVisible();

    // 4. 視覚的区別を確認
    const incompleteTask = page.getByText("未完了タスク", { exact: true });
    const completedTask = page.getByText("完了タスク", { exact: true });

    // 完了タスクは取り消し線がある
    await expect(completedTask).toHaveCSS("text-decoration", /line-through/);

    // 未完了タスクは取り消し線がない
    await expect(incompleteTask).not.toHaveCSS("text-decoration", /line-through/);
  });
});
