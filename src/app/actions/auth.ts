"use server";

import { signIn as authSignIn, signOut as authSignOut } from "@/server/auth";

/**
 * ログイン処理
 * NextAuth.js v5のsignIn()をServer Actionでラップ
 * redirectToオプションにより、ログイン成功後にホームページへリダイレクト
 * Next.js 15のキャッシュは自動的に無効化される
 */
export async function signIn(provider: "google" | "github") {
  await authSignIn(provider, { redirectTo: "/" });
}

/**
 * ログアウト処理
 * NextAuth.js v5のsignOut()をServer Actionでラップ
 * redirectToオプションにより、ログアウト後にホームページへリダイレクト
 * Next.js 15のキャッシュは自動的に無効化される
 */
export async function signOut() {
  await authSignOut({ redirectTo: "/" });
}
