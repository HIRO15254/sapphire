import { expect, test } from "@playwright/test";
import { clearDatabase, seedTasks } from "./helpers";

test.describe("タスク削除 E2E", () => {
  test.beforeEach(async () => {
    // データベースをクリーンアップ
    await clearDatabase();
  });

  test("削除ボタンをクリックしてタスクを削除できる（FR-008）", async ({ page }) => {
    // 1. テストデータをシード
    await seedTasks([{ content: "削除予定タスク" }]);

    // 2. ページに移動（シード後、ネットワークアイドルまで待機）
    await page.goto("/", { waitUntil: "networkidle" });

    // 3. タスクが表示されるまで待機
    await expect(page.getByText("削除予定タスク")).toBeVisible();

    // 4. 削除ボタンをクリック
    await page.getByRole("button", { name: /削除/ }).click();

    // 5. 確認ダイアログが表示される
    await expect(page.getByText(/このタスクを削除してもよろしいですか/)).toBeVisible();

    // 6. 「削除する」ボタンをクリック
    await page.getByRole("button", { name: /削除する/ }).click();

    // 7. Modalが閉じるまで待機
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 8. タスクがリストから消えることを確認
    await expect(page.getByText("削除予定タスク")).not.toBeVisible();

    // 9. 空のメッセージが表示される
    await expect(page.getByText("タスクがありません")).toBeVisible();
  });

  test("確認ダイアログでキャンセルすると削除されない（FR-009）", async ({ page }) => {
    // 1. テストデータをシード
    await seedTasks([{ content: "キャンセルテスト" }]);

    // 2. ページに移動（ネットワークアイドルまで待機）
    await page.goto("/", { waitUntil: "networkidle" });

    // 3. タスクが表示されるまで待機
    await expect(page.getByText("キャンセルテスト")).toBeVisible();

    // 4. 削除ボタンをクリック
    await page.getByRole("button", { name: /削除/ }).click();

    // 5. 確認ダイアログが表示される
    await expect(page.getByText(/このタスクを削除してもよろしいですか/)).toBeVisible();

    // 6. 「キャンセル」ボタンをクリック
    await page.getByRole("button", { name: /キャンセル/ }).click();

    // 7. Modalが閉じるまで待機
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 8. タスクが残っていることを確認
    await expect(page.getByText("キャンセルテスト")).toBeVisible();

    // 9. 空のメッセージは表示されない
    await expect(page.getByText("タスクがありません")).not.toBeVisible();
  });

  test("複数のタスクから特定のタスクのみを削除できる", async ({ page }) => {
    // 1. 複数のテストデータをシード
    await seedTasks([
      { content: "タスク1" },
      { content: "タスク2（削除）" },
      { content: "タスク3" },
    ]);

    // 2. ページに移動（ネットワークアイドルまで待機）
    await page.goto("/", { waitUntil: "networkidle" });

    // 3. すべてのタスクが表示されるまで待機
    await expect(page.getByText("タスク1")).toBeVisible();
    await expect(page.getByText("タスク2（削除）")).toBeVisible();
    await expect(page.getByText("タスク3")).toBeVisible();

    // 4. タスク2の削除ボタンをクリック（2番目の削除ボタン）
    const deleteButtons = page.getByRole("button", { name: /削除/ });
    await deleteButtons.nth(1).click();

    // 5. 確認ダイアログで削除を確定
    await page.getByRole("button", { name: /削除する/ }).click();

    // 6. Modalが閉じるまで待機
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 7. タスク2のみが削除され、他のタスクは残っていることを確認
    await expect(page.getByText("タスク1")).toBeVisible();
    await expect(page.getByText("タスク2（削除）")).not.toBeVisible();
    await expect(page.getByText("タスク3")).toBeVisible();
  });

  test("すべてのタスクを削除すると空のメッセージが表示される（FR-010）", async ({ page }) => {
    // 1. テストデータをシード
    await seedTasks([{ content: "最後のタスク" }]);

    // 2. ページに移動（ネットワークアイドルまで待機）
    await page.goto("/", { waitUntil: "networkidle" });

    // 3. タスクが表示されるまで待機
    await expect(page.getByText("最後のタスク")).toBeVisible();

    // 4. 削除ボタンをクリック
    await page.getByRole("button", { name: /削除/ }).click();

    // 5. 確認ダイアログで削除を確定
    await page.getByRole("button", { name: /削除する/ }).click();

    // 6. Modalが閉じるまで待機
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 7. 「タスクがありません」メッセージが表示される
    await expect(page.getByText("タスクがありません")).toBeVisible();
  });
});
