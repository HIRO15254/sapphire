"use server";

import { signIn, signOut } from "@/server/auth";

/**
 * Googleでログイン
 * NextAuth.js v5公式パターン: Server ActionでsignIn()を呼び出し
 */
export async function signInWithGoogle() {
  await signIn("google");
}

/**
 * GitHubでログイン
 * NextAuth.js v5公式パターン: Server ActionでsignIn()を呼び出し
 */
export async function signInWithGitHub() {
  await signIn("github");
}

/**
 * ログアウト処理
 * NextAuth.js v5のsignOut()をServer Actionでラップ
 */
export async function doSignOut() {
  await signOut();
}
