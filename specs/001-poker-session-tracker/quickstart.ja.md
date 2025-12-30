# クイックスタートガイド: ライブポーカーセッショントラッカー

**作成日**: 2025-12-12（更新: 2025-12-15）
**フィーチャーブランチ**: `001-poker-session-tracker`

本ガイドは開発環境のセットアップとアプリケーション実行の手順を説明します。

---

## 前提条件

- **Node.js**: v20.x以上
- **Bun**: v1.x以上（メインパッケージマネージャー）
- **PostgreSQL**: v15.x以上（またはNeon/Supabaseアカウント）
- **Git**: v2.x

### Bunのインストール

```bash
# macOS, Linux, WSL
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# インストール確認
bun --version
```

---

## 1. プロジェクトセットアップ

### クローンとインストール

```bash
# リポジトリをクローン
git clone <repository-url> sapphire
cd sapphire

# フィーチャーブランチをチェックアウト
git checkout 001-poker-session-tracker

# bunで依存関係をインストール
bun install
```

### 環境設定

テンプレートから`.env`ファイルを作成:

```bash
cp .env.example .env
```

必要な環境変数:

```env
# データベース（PostgreSQL）
DATABASE_URL="postgresql://user:password@localhost:5432/sapphire?schema=public"

# NextAuth.js
AUTH_SECRET="openssl-rand-base64-32で生成"
AUTH_URL="http://localhost:3000"

# OAuthプロバイダー（開発時は任意）
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
```

AUTH_SECRETの生成:

```bash
openssl rand -base64 32
```

---

## 2. データベースセットアップ

### オプションA: ローカルPostgreSQL

```bash
# データベースを作成
createdb sapphire

# マイグレーションを実行
bun run db:migrate

# （任意）開発用データをシード
bun run db:seed
```

### オプションB: Neon（クラウドPostgreSQL）

1. [neon.tech](https://neon.tech)でアカウント作成
2. 新規プロジェクトを作成
3. 接続文字列を`DATABASE_URL`にコピー
4. マイグレーションを実行:

```bash
bun run db:migrate
```

### データベースコマンド

```bash
# スキーマ変更からマイグレーション生成
bun run db:generate

# マイグレーション適用
bun run db:migrate

# スキーマを直接プッシュ（開発のみ）
bun run db:push

# Drizzle Studio（データベースGUI）を開く
bun run db:studio

# データベースリセット（警告: 破壊的）
bun run db:reset
```

---

## 3. アプリケーション実行

### 開発モード

```bash
# 開発サーバーを起動
bun run dev
```

アプリケーションは以下で利用可能: `http://localhost:3000`

### 本番ビルド

```bash
# 本番用ビルド
bun run build

# 本番サーバーを起動
bun run start
```

---

## 4. PWAセットアップ

このプロジェクトは**Next.js公式PWAアプローチ**（サードパーティパッケージなし）を使用。

### キーファイル

- `app/manifest.ts` - Webアプリマニフェスト設定
- `public/sw.js` - キャッシュ用サービスワーカー
- `app/components/ServiceWorkerRegistration.tsx` - SW登録

### PWAテスト

1. 本番用ビルド: `bun run build`
2. 本番サーバーを起動: `bun run start`
3. Chrome DevTools → Application → Service Workersを開く
4. サービスワーカーが登録されていることを確認
5. 「ホーム画面に追加」機能をテスト

---

## 5. テスト

### 単体・統合テスト（Vitest）

```bash
# 全テストを実行
bun run test

# ウォッチモードでテスト実行
bun run test:watch

# カバレッジ付きでテスト実行
bun run test:coverage

# 特定のテストファイルを実行
bun run test src/server/api/routers/session.test.ts
```

### E2Eテスト（Playwright）

```bash
# ブラウザをインストール（初回のみ）
bunx playwright install

# E2Eテストを実行
bun run test:e2e

# UIでE2Eテストを実行
bun run test:e2e:ui

# レコーディングからE2Eテストを生成
bunx playwright codegen localhost:3000
```

### テスト構造

```
tests/
├── unit/                    # 単体テスト
│   └── server/
│       └── api/
│           └── routers/     # tRPCルーターテスト
├── integration/             # 統合テスト
│   └── db/                  # データベーステスト
└── e2e/                     # エンドツーエンドテスト
    ├── auth.spec.ts         # 認証フロー
    ├── session.spec.ts      # セッション記録フロー
    └── ...
```

---

## 6. プロジェクト構造

```
sapphire/
├── .env                     # 環境変数（コミット対象外）
├── .env.example             # 環境テンプレート
├── drizzle/                 # データベースマイグレーション
│   └── migrations/
├── public/                  # 静的アセット
│   ├── sw.js                # サービスワーカー（PWA）
│   └── icons/               # アプリアイコン
├── specs/                   # 機能仕様書
│   └── 001-poker-session-tracker/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── manifest.ts      # PWAマニフェスト
│   │   ├── (auth)/          # 認証必須ルート
│   │   │   ├── dashboard/
│   │   │   ├── sessions/
│   │   │   ├── currencies/
│   │   │   ├── stores/
│   │   │   └── players/
│   │   ├── api/             # APIルート
│   │   │   ├── auth/        # NextAuthハンドラー
│   │   │   └── trpc/        # tRPCハンドラー
│   │   ├── auth/            # 認証ページ（公開）
│   │   │   ├── signin/
│   │   │   └── signup/
│   │   ├── layout.tsx       # ルートレイアウト
│   │   └── page.tsx         # ランディングページ
│   ├── components/          # 共有Reactコンポーネント
│   │   ├── ui/              # 基本UIコンポーネント
│   │   ├── forms/           # フォームコンポーネント
│   │   └── layouts/         # レイアウトコンポーネント
│   ├── lib/                 # 共有ユーティリティ
│   │   ├── utils.ts
│   │   └── google-maps.ts   # Google Maps URL生成
│   ├── server/              # サーバーサイドコード
│   │   ├── api/
│   │   │   ├── routers/     # tRPCルーター
│   │   │   ├── schemas/     # Zodスキーマ
│   │   │   ├── root.ts      # ルートルーター
│   │   │   └── trpc.ts      # tRPCセットアップ
│   │   ├── auth.ts          # NextAuth設定
│   │   └── db/
│   │       ├── index.ts     # Drizzleクライアント
│   │       └── schema/      # Drizzleスキーマ
│   ├── styles/              # グローバルスタイル
│   └── trpc/                # tRPCクライアント
│       ├── react.tsx        # React Queryセットアップ
│       └── server.ts        # サーバーサイド呼び出し
└── tests/                   # テストファイル
```

---

## 7. 開発ワークフロー

### TDDワークフロー（憲章必須）

1. **テスト作成**（Red）
   ```bash
   # テストファイルを作成
   touch tests/unit/server/api/routers/currency.test.ts

   # テストを実行（失敗するはず）
   bun run test tests/unit/server/api/routers/currency.test.ts
   ```

2. **最小実装**（Green）
   ```typescript
   // テストを通すのに必要な最小限のコードを実装
   ```

3. **リファクタリング**（Refactor）
   ```bash
   # テストが引き続き通ることを確認
   bun run test
   ```

### Gitワークフロー

```bash
# devからフィーチャーブランチを作成
git checkout dev
git pull
git checkout -b feature/add-session-notes

# 変更をコミット（頻繁に）
git add .
git commit -m "feat(session): セッションフォームにメモフィールドを追加"

# プッシュしてPR作成
git push -u origin feature/add-session-notes
# devブランチ向けにPR作成
```

### コミットメッセージ形式

```
<type>(<scope>): <description>

タイプ: feat, fix, docs, style, refactor, test, chore
スコープ: session, currency, store, player, auth, ui, db
```

---

## 8. 主要技術

| 技術 | 用途 | ドキュメント |
|------|------|-------------|
| Next.js 15 | Reactフレームワーク | [nextjs.org/docs](https://nextjs.org/docs) |
| tRPC v11 | 型安全API | [trpc.io/docs](https://trpc.io/docs) |
| Drizzle ORM | データベースORM | [orm.drizzle.team](https://orm.drizzle.team) |
| NextAuth.js v5 | 認証 | [authjs.dev](https://authjs.dev) |
| Mantine v8 | UIコンポーネント | [mantine.dev](https://mantine.dev) |
| Vitest | 単体テスト | [vitest.dev](https://vitest.dev) |
| Playwright | E2Eテスト | [playwright.dev](https://playwright.dev) |
| Bun | パッケージマネージャー&ランタイム | [bun.sh](https://bun.sh) |

---

## 9. 一般的なタスク

### 新規tRPCルーターの追加

1. スキーマを作成: `src/server/api/schemas/newEntity.schema.ts`
2. ルーターを作成: `src/server/api/routers/newEntity.ts`
3. ルートに追加: `src/server/api/root.ts`
4. テストを作成: `tests/unit/server/api/routers/newEntity.test.ts`

### 新規データベーステーブルの追加

1. スキーマを定義: `src/server/db/schema/newEntity.ts`
2. indexからエクスポート: `src/server/db/schema/index.ts`
3. マイグレーションを生成: `bun run db:generate`
4. マイグレーションを適用: `bun run db:migrate`

### 新規ページの追加

1. ルートを作成: `src/app/(auth)/new-page/page.tsx`
2. コンポーネントを作成: `src/components/new-page/`
3. ナビゲーションリンクを追加
4. E2Eテストを作成: `tests/e2e/new-page.spec.ts`

### セッションイベントタイプの追加

セッションイベントシステムは拡張可能。新しいイベントタイプを追加するには:

1. スキーマの`SessionEventType`に型を追加
2. `eventData`構造を定義
3. `sessionEvent`ルーターにミューテーションを追加
4. UIを更新してイベントを記録/表示

---

## 10. トラブルシューティング

### データベース接続の問題

```bash
# PostgreSQLが動作しているか確認
pg_isready

# 接続文字列を確認
psql $DATABASE_URL -c "SELECT 1"
```

### マイグレーションエラー

```bash
# リセットして再実行（開発のみ）
bun run db:reset

# マイグレーション状態を確認
bun run db:studio
```

### スキーマ変更後の型エラー

```bash
# 型を再生成
bun run db:generate
```

### PWAがインストールできない

- HTTPS（またはlocalhost）を確認
- `app/manifest.ts`が有効か確認
- `public/`内の指定パスにアイコンが存在するか確認
- DevToolsでサービスワーカー登録を確認

### Bunの問題

```bash
# bunキャッシュをクリア
bun pm cache rm

# 依存関係を再インストール
rm -rf node_modules bun.lockb
bun install
```

---

## 11. 便利なスクリプト

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun run scripts/migrate.ts",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun run scripts/seed.ts",
    "db:reset": "bun run scripts/reset.ts"
  }
}
```

---

## 次のステップ

1. 環境変数を設定
2. データベースを初期化
3. 開発サーバーを起動
4. テストユーザーアカウントを作成
5. TDDワークフローに従って機能を実装開始
