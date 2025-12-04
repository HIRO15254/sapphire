# Data Model: プロジェクト品質向上・リファクタリング

**Feature**: 005-refactor-auth-testing
**Date**: 2025-12-02

## Overview

このフィーチャーでは、既存のデータモデルに最小限の変更を加えて、メールアドレス/パスワード認証をサポートします。

## Entity Changes

### 1. users テーブル（変更）

既存の`sapphire_user`テーブルにパスワードフィールドを追加。

| Column | Type | Nullable | Description | Change |
|--------|------|----------|-------------|--------|
| id | VARCHAR(255) | NOT NULL | ユーザーID (UUID) | 既存 |
| name | VARCHAR(255) | NULL | 表示名 | 既存 |
| email | VARCHAR(255) | NOT NULL | メールアドレス | 既存 |
| emailVerified | TIMESTAMP WITH TZ | NULL | メール確認日時 | 既存 |
| image | VARCHAR(255) | NULL | プロフィール画像URL | 既存 |
| **password** | **VARCHAR(255)** | **NULL** | **パスワードハッシュ (bcrypt)** | **追加** |

**Notes**:
- `password`はNULL許容（OAuthユーザーはパスワードを持たない）
- パスワードはbcryptjsでハッシュ化（コストファクター12）
- 既存のOAuthユーザーは`password = NULL`のまま

### 2. accounts テーブル（変更なし）

既存の`sapphire_account`テーブルは変更なし。Credentials認証はaccountsテーブルにエントリを作成しない（NextAuth.js v5の仕様）。

| Column | Type | Description |
|--------|------|-------------|
| userId | VARCHAR(255) | ユーザーID (FK → users.id) |
| type | VARCHAR(255) | アカウントタイプ |
| provider | VARCHAR(255) | プロバイダー名 (google, github) |
| providerAccountId | VARCHAR(255) | プロバイダー側のアカウントID |
| ... | ... | その他のOAuthトークン情報 |

**Notes**:
- Credentials認証ユーザーはaccountsにエントリなし
- OAuthユーザーのみaccountsにエントリあり
- 同一メールでOAuth + Credentialsを使用する場合、usersに1レコード、accountsにOAuthプロバイダー分のレコード

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                          users                               │
│  id, name, email, emailVerified, image, password (NEW)      │
└─────────────────────────────────────────────────────────────┘
           │
           │ 1:N (OAuthユーザーのみ)
           ▼
┌─────────────────────────────────────────────────────────────┐
│                         accounts                             │
│  userId, type, provider, providerAccountId, ...             │
└─────────────────────────────────────────────────────────────┘
```

## Account Linking Logic

### シナリオ別の動作

| シナリオ | 結果 |
|---------|------|
| 新規メールでCredentials登録 | users: 新規作成 (password有り), accounts: なし |
| 新規メールでOAuth登録 | users: 新規作成 (password=NULL), accounts: 新規作成 |
| OAuth既存メールでCredentials登録 | users: password追加, accounts: 変更なし |
| Credentials既存メールでOAuth登録 | users: 変更なし, accounts: 新規作成 |
| 同一メールで複数OAuth | users: 既存使用, accounts: 追加作成 |

## Validation Rules

### パスワード

| Rule | Value | Error Message |
|------|-------|---------------|
| 最小長 | 8文字 | パスワードは8文字以上で入力してください |
| 最大長 | 128文字 | パスワードは128文字以内で入力してください |
| 必須 | Credentials登録時 | パスワードを入力してください |

### メールアドレス

| Rule | Value | Error Message |
|------|-------|---------------|
| 形式 | RFC 5322準拠 | 有効なメールアドレスを入力してください |
| 一意性 | users.email UNIQUE | このメールアドレスは既に登録されています |
| 必須 | 常に | メールアドレスを入力してください |

## Migration Strategy

### Step 1: スキーマ変更

```sql
-- 既存usersテーブルにpasswordカラムを追加
ALTER TABLE sapphire_user
ADD COLUMN password VARCHAR(255) NULL;
```

### Step 2: データ移行

既存データの移行は不要（既存ユーザーは全てOAuth、password=NULL）。

### Step 3: インデックス

追加のインデックスは不要（emailは既存のNOT NULL制約でユニーク性を保証）。

## Test Data Fixtures

E2Eテスト用のテストユーザー定義：

```typescript
// tests/e2e/fixtures/test-user.ts
export const TEST_USER = {
  email: "test@example.com",
  password: "TestPassword123!",
  name: "Test User",
};
```

**Notes**:
- テストユーザーはE2Eテストのセットアップ時に作成
- テスト終了時にクリーンアップ
- 本番環境とは別のテスト用データベースを使用
