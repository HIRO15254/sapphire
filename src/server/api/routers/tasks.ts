import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tasks } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const tasksRouter = createTRPCRouter({
  // すべてのタスクを作成日時降順で取得
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }),

  // 新しいタスクを作成
  create: publicProcedure
    .input(
      z.object({
        content: z
          .string()
          .min(1, { message: "タスク内容を入力してください" })
          .max(500, { message: "タスク内容は500文字以内で入力してください" })
          .refine((val) => val.trim().length > 0, {
            message: "タスク内容を入力してください",
          }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db
        .insert(tasks)
        .values({
          content: input.content,
        })
        .returning();

      return task!;
    }),

  // タスクの完了状態を切り替え
  toggleComplete: publicProcedure
    .input(
      z.object({
        id: z.string().uuid({ message: "無効なタスクIDです" }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // タスクを取得
      const [task] = await ctx.db.select().from(tasks).where(eq(tasks.id, input.id));

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "タスクが見つかりません",
        });
      }

      // 完了状態を切り替え
      const [updatedTask] = await ctx.db
        .update(tasks)
        .set({
          completed: !task.completed,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, input.id))
        .returning();

      return updatedTask!;
    }),

  // タスクを削除
  delete: publicProcedure
    .input(
      z.object({
        id: z.string().uuid({ message: "無効なタスクIDです" }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // タスクを削除
      const result = await ctx.db.delete(tasks).where(eq(tasks.id, input.id)).returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "タスクが見つかりません",
        });
      }

      return { success: true };
    }),
});
