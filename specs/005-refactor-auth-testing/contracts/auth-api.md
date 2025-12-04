# API Contract: 認証API

**Feature**: 005-refactor-auth-testing
**Date**: 2025-12-02

## Overview

メールアドレス/パスワード認証のためのAPI契約を定義します。NextAuth.js v5のCredentials Providerを使用するため、標準のNextAuth.jsエンドポイントを活用します。

## Endpoints

### 1. POST /api/auth/signin/credentials

ユーザーのメールアドレス/パスワードでのサインイン。

**Request**:
```typescript
{
  email: string;      // ユーザーのメールアドレス
  password: string;   // パスワード（平文、サーバーでハッシュ比較）
  csrfToken: string;  // CSRFトークン（NextAuthが自動管理）
}
```

**Response (成功)**:
```typescript
{
  url: string;  // リダイレクト先URL
}
```

**Response (失敗)**:
```typescript
{
  error: "CredentialsSignin";  // 認証失敗
  url: string;                  // エラーページURL
}
```

**Validation**:
| Field | Rule | Error |
|-------|------|-------|
| email | 必須、有効な形式 | 有効なメールアドレスを入力してください |
| password | 必須、8文字以上 | パスワードを入力してください |

**Security**:
- パスワードはサーバーサイドでbcryptjs.compare()で検証
- 失敗時は具体的な理由を開示しない（「認証に失敗しました」のみ）
- レート制限を適用（将来対応）

---

### 2. POST /api/auth/signup (tRPC)

新規ユーザー登録。NextAuth.jsの標準エンドポイントではないため、tRPCで実装。

**Procedure**: `auth.signup`

**Input**:
```typescript
{
  email: string;     // メールアドレス
  password: string;  // パスワード（8文字以上）
  name?: string;     // 表示名（任意）
}
```

**Output (成功)**:
```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    name: string | null;
  }
}
```

**Output (失敗)**:
```typescript
// TRPCError thrown
{
  code: "BAD_REQUEST" | "CONFLICT";
  message: string;
}
```

**Error Cases**:
| Code | Condition | Message |
|------|-----------|---------|
| BAD_REQUEST | メール形式不正 | 有効なメールアドレスを入力してください |
| BAD_REQUEST | パスワード短すぎ | パスワードは8文字以上で入力してください |
| CONFLICT | メール重複 | このメールアドレスは既に登録されています |

**Validation Schema (Zod)**:
```typescript
const signupSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  name: z.string().optional(),
});
```

---

### 3. POST /api/auth/signout

ユーザーのサインアウト（NextAuth.js標準）。

**Request**:
```typescript
{
  csrfToken: string;  // CSRFトークン
}
```

**Response**:
```typescript
{
  url: string;  // リダイレクト先URL
}
```

---

### 4. GET /api/auth/session

現在のセッション情報取得（NextAuth.js標準）。

**Response (認証済み)**:
```typescript
{
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  expires: string;  // ISO 8601 日時
}
```

**Response (未認証)**:
```typescript
{}
```

---

### 5. GET /api/auth/providers

利用可能な認証プロバイダー一覧（NextAuth.js標準）。

**Response**:
```typescript
{
  credentials: {
    id: "credentials";
    name: "Credentials";
    type: "credentials";
    signinUrl: "/api/auth/signin/credentials";
    callbackUrl: "/api/auth/callback/credentials";
  };
  google: {
    id: "google";
    name: "Google";
    type: "oauth";
    signinUrl: "/api/auth/signin/google";
    callbackUrl: "/api/auth/callback/google";
  };
  github: {
    id: "github";
    name: "GitHub";
    type: "oauth";
    signinUrl: "/api/auth/signin/github";
    callbackUrl: "/api/auth/callback/github";
  };
}
```

---

## Authentication Flow

### Credentials サインイン

```
┌─────────┐      ┌──────────────┐      ┌─────────────┐
│  User   │      │   Frontend   │      │   Backend   │
└────┬────┘      └──────┬───────┘      └──────┬──────┘
     │                  │                      │
     │ 1. Enter email/password                 │
     │─────────────────>│                      │
     │                  │                      │
     │                  │ 2. POST /api/auth/signin/credentials
     │                  │─────────────────────>│
     │                  │                      │
     │                  │   3. Validate credentials
     │                  │                      │ (bcrypt.compare)
     │                  │                      │
     │                  │ 4. Set JWT cookie    │
     │                  │<─────────────────────│
     │                  │                      │
     │ 5. Redirect to home                     │
     │<─────────────────│                      │
     │                  │                      │
```

### Credentials サインアップ

```
┌─────────┐      ┌──────────────┐      ┌─────────────┐
│  User   │      │   Frontend   │      │   Backend   │
└────┬────┘      └──────┬───────┘      └──────┬──────┘
     │                  │                      │
     │ 1. Enter email/password/name            │
     │─────────────────>│                      │
     │                  │                      │
     │                  │ 2. tRPC auth.signup  │
     │                  │─────────────────────>│
     │                  │                      │
     │                  │   3. Check email uniqueness
     │                  │   4. Hash password (bcrypt)
     │                  │   5. Insert user     │
     │                  │                      │
     │                  │ 6. Return success    │
     │                  │<─────────────────────│
     │                  │                      │
     │                  │ 7. Auto signin       │
     │                  │─────────────────────>│
     │                  │                      │
     │ 8. Redirect to home                     │
     │<─────────────────│                      │
     │                  │                      │
```

---

## Account Linking

### OAuth + Credentials 同一メール

```
Scenario: OAuthユーザーがCredentialsでパスワードを追加

1. ユーザーがGoogle OAuthでサインイン済み
   - users: { id: "abc", email: "user@example.com", password: NULL }
   - accounts: { userId: "abc", provider: "google", ... }

2. 同一メールでCredentials登録を試みる
   - auth.signup({ email: "user@example.com", password: "xxx" })

3. システムは既存ユーザーを検出
   - UPDATE users SET password = $hashedPassword WHERE email = $email

4. 結果
   - users: { id: "abc", email: "user@example.com", password: "$2b$..." }
   - accounts: 変更なし

5. ユーザーはGoogle OAuthまたはCredentialsどちらでもログイン可能
```

---

## Security Considerations

### パスワード保存

- bcryptjsでハッシュ化（コストファクター12）
- 平文パスワードは保存しない
- ハッシュはサーバーサイドでのみ実行

### セッション管理

- JWTセッション（Credentials Providerの要件）
- セッション有効期限: 30日（設定可能）
- Secure cookieを使用（HTTPS環境）

### CSRF保護

- NextAuth.jsの組み込みCSRF保護を使用
- すべてのPOSTリクエストにcsrfTokenが必要

### エラーメッセージ

- 認証失敗時は具体的な理由を開示しない
- 「認証に失敗しました」のみ表示
- メール存在確認攻撃を防止
