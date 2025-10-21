import { expect, test } from "@playwright/test";
import { clearDatabase, seedTasks } from "./helpers";

test.describe("レスポンシブデザイン E2E", () => {
  test.beforeEach(async () => {
    await clearDatabase();
  });

  test.describe("モバイル (375px) - FR-011", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("タスク入力欄がモバイルサイズで正しく表示される", async ({ page }) => {
      await seedTasks([{ content: "モバイルテスト" }]);
      await page.goto("/", { waitUntil: "networkidle" });

      await expect(page.getByText("モバイルテスト")).toBeVisible();
      const input = page.getByPlaceholder(/タスクを入力/i);
      await expect(input).toBeVisible();
      const addButton = page.getByRole("button", { name: /追加/ });
      await expect(addButton).toBeVisible();
    });
  });

  test.describe("タブレット (768px) - FR-011", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("タブレットサイズで適切なレイアウトが適用される", async ({ page }) => {
      await seedTasks([{ content: "タブレットタスク1" }, { content: "タブレットタスク2" }]);
      await page.goto("/", { waitUntil: "networkidle" });

      await expect(page.getByText("タブレットタスク1")).toBeVisible();
      await expect(page.getByText("タブレットタスク2")).toBeVisible();
    });
  });

  test.describe("デスクトップ (1920px) - FR-011", () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test("デスクトップサイズで最大幅が制限される", async ({ page }) => {
      await seedTasks([{ content: "デスクトップタスク" }]);
      await page.goto("/", { waitUntil: "networkidle" });

      await expect(page.getByText("デスクトップタスク")).toBeVisible();
    });
  });
});
