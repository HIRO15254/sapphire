# クイックスタート: プロジェクト品質向上・リファクタリング

**Feature**: 005-refactor-auth-testing
**Date**: 2025-12-02

## 概要

このガイドでは、メールアドレス/パスワード認証の使い方、E2Eテストの実行方法、UIリデザイン後の操作方法を説明します。

---

## 1. メールアドレス/パスワード認証

### 新規アカウント作成

1. アプリケーションを開く（http://localhost:3000）
2. 「アカウント作成」ボタンをクリック
3. 以下の情報を入力：
   - **メールアドレス**: 有効なメールアドレス
   - **パスワード**: 8文字以上
   - **表示名**: 任意
4. 「登録」ボタンをクリック
5. 自動的にログインされ、ホーム画面に遷移

### ログイン

1. アプリケーションを開く
2. 「メールアドレスでログイン」を選択
3. 登録済みのメールアドレスとパスワードを入力
4. 「ログイン」ボタンをクリック

### OAuth認証との併用

同じメールアドレスで、OAuthとメール/パスワードの両方を使用できます：

- **Google/GitHubでログイン後**: 設定画面でパスワードを追加可能
- **メール/パスワードで登録後**: Google/GitHubアカウントをリンク可能

---

## 2. E2Eテストの実行

### 前提条件

- 開発環境がセットアップ済み（`bun install`完了）
- PostgreSQLが起動中（`docker compose up -d`）
- テスト用データベースにスキーマ適用済み（`bun run db:push:test`）

### テストの実行

```bash
# E2Eテストを実行
bun run test:e2e

# 特定のテストファイルを実行
bun run test:e2e tests/e2e/auth.spec.ts

# UIモードで実行（デバッグ用）
bunx playwright test --ui

# ヘッドフルモードで実行（ブラウザを表示）
bunx playwright test --headed
```

### テスト構成

```
tests/e2e/
├── auth.spec.ts        # 認証テスト（ログイン、登録、ログアウト）
├── sessions.spec.ts    # セッションCRUDテスト
└── fixtures/
    └── test-user.ts    # テストユーザー定義
```

### テストレポート

```bash
# HTMLレポートを表示
bunx playwright show-report
```

---

## 3. コンポーネントテストの実行

### テストの実行

```bash
# すべてのテストを実行
bun run test

# コンポーネントテストのみ実行
bun run test tests/components/

# 特定のコンポーネントをテスト
bun run test tests/components/SessionCard.test.tsx

# ウォッチモードで実行
bun run test:watch
```

### テスト対象コンポーネント

| コンポーネント | テストファイル | 説明 |
|--------------|--------------|------|
| SessionCard | SessionCard.test.tsx | セッション表示カード |
| SessionForm | SessionForm.test.tsx | セッション入力フォーム |
| SessionList | SessionList.test.tsx | セッション一覧 |
| SessionStats | SessionStats.test.tsx | 統計表示 |
| SessionFilters | SessionFilters.test.tsx | フィルターUI |
| SignInForm | SignInForm.test.tsx | ログインフォーム |
| SignUpForm | SignUpForm.test.tsx | 新規登録フォーム |

---

## 4. 画面操作ガイド

### ホーム画面

- **ログイン前**: Google/GitHub/メールアドレスでのログイン選択
- **ログイン後**: ユーザー情報と「セッション管理」ボタンを表示

### セッション一覧画面

1. **統計表示**: 合計収支、セッション数、平均収支
2. **場所別統計**: 場所ごとのパフォーマンス
3. **フィルター**: 場所、タグ、日付範囲でフィルタリング
4. **セッション一覧**: カード形式でセッションを表示

### セッション作成

1. 「新規セッション」ボタンをクリック
2. モーダルで情報を入力：
   - 日時
   - 場所（既存から選択または新規追加）
   - バイイン額
   - キャッシュアウト額
   - プレイ時間
   - タグ（任意）
   - メモ（リッチテキスト対応）
3. 「保存」をクリック

### セッション編集・削除

- **編集**: セッションカードの編集ボタンをクリック
- **削除**: 削除ボタンをクリック後、確認ダイアログで「削除」を選択

---

## 5. トラブルシューティング

### E2Eテストが失敗する

1. **開発サーバーが起動していない**
   ```bash
   bun run dev
   ```

2. **テスト用データベースが準備されていない**
   ```bash
   bun run db:push:test
   ```

3. **テストユーザーの競合**
   - テストは自動クリーンアップを行いますが、手動でクリーンアップが必要な場合：
   ```bash
   docker exec sapphire-postgres psql -U postgres -d sapphire_test -c "DELETE FROM sapphire_user WHERE email = 'test@example.com';"
   ```

### ログインできない

1. **パスワードを忘れた**
   - 現在、パスワードリセット機能は未実装
   - OAuth（Google/GitHub）でログインを試してください

2. **「認証に失敗しました」エラー**
   - メールアドレスとパスワードを確認
   - Caps Lockがオフか確認

### コンポーネントテストが失敗する

1. **依存関係の問題**
   ```bash
   bun install
   ```

2. **モックの問題**
   - `tests/mocks/`ディレクトリのモック定義を確認

---

## 6. 開発者向け情報

### 環境変数

認証機能に必要な環境変数（`.env`）：

```env
# NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (既存)
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."

# Database
DATABASE_URL="postgresql://..."
```

### ファイル構成

```
src/
├── app/auth/
│   ├── signin/page.tsx   # ログインページ
│   └── signup/page.tsx   # 新規登録ページ
├── features/auth/
│   ├── components/       # SignInForm, SignUpForm
│   └── containers/       # フォームコンテナ
└── server/auth/
    └── config.ts         # NextAuth設定（Credentials追加）
```

---

## 参考リンク

- [仕様書](./spec.md)
- [実装計画](./plan.md)
- [リサーチ](./research.md)
- [データモデル](./data-model.md)
- [認証API契約](./contracts/auth-api.md)
