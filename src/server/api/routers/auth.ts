import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { hashPassword } from "@/lib/utils/password";
import { signupSchema } from "@/lib/validations/auth";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { users } from "@/server/db/schema";

/**
 * 認証関連のtRPCルーター
 *
 * サインアップ機能を提供します。
 * サインイン/サインアウトはNextAuth.jsの標準エンドポイントを使用します。
 */
export const authRouter = createTRPCRouter({
  /**
   * 新規ユーザー登録
   *
   * - メールアドレスが既存の場合、アカウントリンク（パスワード追加）を行う
   * - 新規メールの場合、新規ユーザーを作成
   */
  signup: publicProcedure.input(signupSchema).mutation(async ({ ctx, input }) => {
    const { email, password, name } = input;

    // メールアドレスで既存ユーザーを検索（大文字小文字を区別しない）
    const existingUser = await ctx.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    // パスワードをハッシュ化
    const hashedPassword = await hashPassword(password);

    if (existingUser) {
      // 既存ユーザーがパスワードを持っている場合はエラー
      if (existingUser.password) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "このメールアドレスは既に登録されています",
        });
      }

      // OAuthユーザーにパスワードを追加（アカウントリンク）
      await ctx.db
        .update(users)
        .set({
          password: hashedPassword,
        })
        .where(eq(users.id, existingUser.id));

      return {
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
        },
      };
    }

    // 新規ユーザーを作成
    const [newUser] = await ctx.db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name ?? null,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    if (!newUser) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "ユーザーの作成に失敗しました",
      });
    }

    return {
      success: true,
      user: newUser,
    };
  }),
});
