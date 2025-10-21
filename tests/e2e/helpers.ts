import { db } from "@/server/db";
import { tasks } from "@/server/db/schema";

/**
 * E2Eテスト用ヘルパー関数
 * APIエンドポイント経由ではなく、直接DBにアクセスしてテストデータを管理
 */

export async function clearDatabase() {
  console.log("[E2E Helper] Clearing database...");
  const result = await db.delete(tasks);
  console.log("[E2E Helper] Database cleared");
  return result;
}

export async function seedTasks(taskData: Array<{ content: string; completed?: boolean }>) {
  console.log("[E2E Helper] Seeding tasks:", taskData);
  const result = await db.insert(tasks).values(taskData).returning();
  console.log("[E2E Helper] Seeded tasks:", result);
  return result;
}
