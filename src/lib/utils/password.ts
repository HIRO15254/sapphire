import bcrypt from "bcryptjs";

/**
 * パスワードハッシュ化ユーティリティ
 *
 * bcryptjsを使用してパスワードをハッシュ化・検証します。
 * コストファクター12でセキュリティとパフォーマンスのバランスを取ります。
 */

const SALT_ROUNDS = 12;

/**
 * パスワードをbcryptでハッシュ化
 * @param password - 平文パスワード
 * @returns ハッシュ化されたパスワード
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * パスワードとハッシュを比較
 * @param password - 平文パスワード
 * @param hash - ハッシュ化されたパスワード
 * @returns パスワードが一致すればtrue
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
