import { z } from "zod/v4";

/**
 * 認証関連のバリデーションスキーマ
 *
 * NextAuth.js Credentials認証とサインアップのためのZodスキーマを定義します。
 */

/**
 * サインアップ用スキーマ
 */
export const signupSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .max(128, "パスワードは128文字以内で入力してください"),
  name: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * サインイン用スキーマ
 */
export const signinSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export type SigninInput = z.infer<typeof signinSchema>;
