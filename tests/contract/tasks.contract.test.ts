import { appRouter } from "@/server/api/root";
import { createCallerFactory } from "@/server/api/trpc";
import { db } from "@/server/db";
import { tasks } from "@/server/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("Tasks tRPC Contract", () => {
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({
    db,
    session: null,
    headers: new Headers(),
  });

  // テスト前にデータをクリア
  beforeAll(async () => {
    await db.delete(tasks);
  });

  // テスト後にデータをクリア
  afterAll(async () => {
    await db.delete(tasks);
  });

  describe("tasks.getAll", () => {
    it("空配列を返す（タスクが存在しない場合）", async () => {
      const result = await caller.tasks.getAll();
      expect(result).toEqual([]);
    });

    it("すべてのタスクを作成日時降順で返す", async () => {
      // テストデータを作成
      const task1 = await caller.tasks.create({ content: "最初のタスク" });
      const task2 = await caller.tasks.create({ content: "2番目のタスク" });

      const result = await caller.tasks.getAll();

      expect(result).toHaveLength(2);
      // 新しい順に並んでいることを確認
      expect(result[0]?.id).toBe(task2.id);
      expect(result[1]?.id).toBe(task1.id);

      // クリーンアップ
      await db.delete(tasks);
    });
  });

  describe("tasks.create", () => {
    afterAll(async () => {
      await db.delete(tasks);
    });

    it("正常にタスクを作成する", async () => {
      const result = await caller.tasks.create({ content: "牛乳を買う" });

      expect(result).toMatchObject({
        id: expect.any(String),
        content: "牛乳を買う",
        completed: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("空文字列でバリデーションエラー", async () => {
      await expect(caller.tasks.create({ content: "" })).rejects.toThrow();
    });

    it("空白のみでバリデーションエラー", async () => {
      await expect(caller.tasks.create({ content: "   " })).rejects.toThrow();
    });

    it("501文字でバリデーションエラー", async () => {
      const longContent = "あ".repeat(501);
      await expect(caller.tasks.create({ content: longContent })).rejects.toThrow();
    });

    it("500文字は正常に作成できる", async () => {
      const content500 = "あ".repeat(500);
      const result = await caller.tasks.create({ content: content500 });

      expect(result.content).toBe(content500);
    });

    it("絵文字と特殊文字を正しく保存できる", async () => {
      const content = "タスク📝🎯 - 重要！";
      const result = await caller.tasks.create({ content });

      expect(result.content).toBe(content);
    });
  });

  describe("tasks.toggleComplete", () => {
    afterAll(async () => {
      await db.delete(tasks);
    });

    it("未完了タスクを完了状態に切り替える", async () => {
      const task = await caller.tasks.create({ content: "テストタスク" });
      expect(task.completed).toBe(false);

      const result = await caller.tasks.toggleComplete({ id: task.id });

      expect(result).toMatchObject({
        id: task.id,
        content: "テストタスク",
        completed: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // updatedAtが更新されていることを確認
      expect(result.updatedAt.getTime()).toBeGreaterThan(task.updatedAt.getTime());
    });

    it("完了タスクを未完了状態に切り替える", async () => {
      const task = await caller.tasks.create({ content: "完了予定タスク" });
      const completedTask = await caller.tasks.toggleComplete({ id: task.id });
      expect(completedTask.completed).toBe(true);

      const result = await caller.tasks.toggleComplete({ id: completedTask.id });

      expect(result).toMatchObject({
        id: task.id,
        completed: false,
      });
    });

    it("存在しないIDでNOT_FOUNDエラー", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      await expect(caller.tasks.toggleComplete({ id: nonExistentId })).rejects.toThrow();
    });

    it("無効なUUID形式でバリデーションエラー", async () => {
      await expect(caller.tasks.toggleComplete({ id: "invalid-uuid" })).rejects.toThrow();
    });
  });

  describe("tasks.delete", () => {
    afterAll(async () => {
      await db.delete(tasks);
    });

    it("タスクを正常に削除する", async () => {
      const task = await caller.tasks.create({ content: "削除対象タスク" });

      const result = await caller.tasks.delete({ id: task.id });

      expect(result).toEqual({ success: true });

      // タスクが実際に削除されていることを確認
      const allTasks = await caller.tasks.getAll();
      expect(allTasks.find((t) => t.id === task.id)).toBeUndefined();
    });

    it("存在しないIDでNOT_FOUNDエラー", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      await expect(caller.tasks.delete({ id: nonExistentId })).rejects.toThrow();
    });

    it("無効なUUID形式でバリデーションエラー", async () => {
      await expect(caller.tasks.delete({ id: "invalid-uuid" })).rejects.toThrow();
    });

    it("削除後に他のタスクは残っている", async () => {
      const task1 = await caller.tasks.create({ content: "タスク1" });
      const task2 = await caller.tasks.create({ content: "タスク2" });
      const task3 = await caller.tasks.create({ content: "タスク3" });

      await caller.tasks.delete({ id: task2.id });

      const remainingTasks = await caller.tasks.getAll();
      expect(remainingTasks).toHaveLength(2);
      expect(remainingTasks.find((t) => t.id === task1.id)).toBeDefined();
      expect(remainingTasks.find((t) => t.id === task3.id)).toBeDefined();
      expect(remainingTasks.find((t) => t.id === task2.id)).toBeUndefined();
    });
  });
});
