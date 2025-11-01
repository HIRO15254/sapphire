# Quickstart: Sapphire - ポーカーセッショントラッカー

**Last Updated**: 2025-10-31
**Feature**: 004-rebrand-to-sapphire

## はじめに

このガイドでは、Sapphire（ポーカーセッショントラッカー）プロジェクトを初めて使用する方向けに、セットアップから開発開始までの手順を説明します。

## 前提条件

以下のツールがインストールされている必要があります：

- **Bun** v1.0以上 ([インストール方法](https://bun.sh))
- **Docker Desktop** ([インストール方法](https://www.docker.com/products/docker-desktop))
- **Git**

### 認証情報の準備

**重要**: 開発を開始する前に、以下のOAuth認証情報を取得する必要があります（NextAuth.js v5で使用）：

#### 1. Google OAuth 2.0 クライアントID

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth クライアント ID」を選択
5. アプリケーションの種類: **ウェブアプリケーション**
6. 承認済みのリダイレクトURIに追加:
   - `http://localhost:3000/api/auth/callback/google`
7. クライアントIDとクライアントシークレットを控える

#### 2. GitHub OAuth App

1. [GitHub Developer Settings](https://github.com/settings/developers)にアクセス
2. 「New OAuth App」をクリック
3. 以下を入力:
   - **Application name**: Sapphire (ローカル開発)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. 「Register application」をクリック
5. Client IDとGenerate a new client secretでClient Secretを取得

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd sapphire
```

### 2. 依存関係のインストール

```bash
bun install
```

### 3. 環境変数の設定

`.env.example`を`.env`にコピー：

```bash
cp .env.example .env
```

`.env`ファイルを編集し、取得したOAuth認証情報を設定：

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sapphire"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"  # openssl rand -base64 32 で生成
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

**Note**: `NEXTAUTH_SECRET`は以下のコマンドで生成できます：

```bash
openssl rand -base64 32
```

### 4. PostgreSQLの起動

Docker Composeを使用してPostgreSQLデータベースを起動します：

```bash
docker compose up -d
```

**Note**: データベース名は`sapphire`（本番用）と`sapphire_test`（テスト用）です。

### 5. データベーススキーマの適用

本番DBとテスト用DBの両方にスキーマを適用します：

```bash
bun run db:push:all
```

個別に適用する場合：

```bash
# 本番DBのみ
bun run db:push

# テスト用DBのみ
bun run db:push:test
```

### 6. 開発サーバーの起動

```bash
bun run dev
```

ブラウザで http://localhost:3000 を開くと、Sapphireアプリケーションが表示されます。

## 開発コマンド

### 開発・ビルド

```bash
# 開発サーバーの起動（ホットリロード有効）
bun run dev

# プロダクションビルド
bun run build

# プロダクションサーバーの起動（PWA有効）
bun run preview
```

### テスト

```bash
# 単体・契約テストの実行
bun run test

# テスト（watch mode）
bun run test:watch

# UIでテストを表示
bun run test:ui
```

**Note**: E2Eテストは削除されています。

### データベース

```bash
# スキーマ適用（両方）
bun run db:push:all

# スキーマ適用（本番DBのみ）
bun run db:push

# スキーマ適用（テスト用DBのみ）
bun run db:push:test

# データベース管理（Drizzle Studio）
bun run db:studio
```

### コード品質

```bash
# リント・フォーマットチェック
bun run check

# リント・フォーマット自動修正
bun run check:write

# 型チェック
bun run typecheck
```

## プロジェクト構造

```
sapphire/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx             # ルートレイアウト（Mantineテーマ設定）
│   │   ├── page.tsx               # トップページ
│   │   ├── manifest.ts            # PWA manifest
│   │   └── api/trpc/              # tRPC APIハンドラー
│   │
│   ├── server/                     # バックエンド（API層）
│   │   ├── api/
│   │   │   ├── routers/           # tRPCルーター
│   │   │   ├── root.ts            # ルートルーター
│   │   │   └── trpc.ts            # tRPC設定
│   │   └── db/
│   │       ├── schema.ts          # Drizzleスキーマ定義
│   │       └── index.ts           # PostgreSQLクライアント
│   │
│   ├── features/                   # フロントエンド機能
│   │   └── poker-sessions/        # ポーカーセッション機能（実装予定）
│   │       ├── components/        # Presentationコンポーネント
│   │       ├── containers/        # Containerコンポーネント
│   │       └── hooks/             # カスタムフック
│   │
│   └── lib/
│       └── utils/                 # ユーティリティ関数
│
├── tests/
│   ├── contract/                  # API契約テスト（tRPC）
│   └── components/                # コンポーネントテスト
│
├── specs/                         # 機能仕様書
│   ├── 002-poker-session-tracker/ # ポーカーセッショントラッカー仕様
│   └── 004-rebrand-to-sapphire/   # リブランディング仕様（このドキュメント）
│
└── public/                        # 静的ファイル
    └── [PWAアイコン]
```

## 実装状況

### 計画中の機能

- **ポーカーセッショントラッカー** (`specs/002-poker-session-tracker/`)
  - セッション記録機能（計画中）
  - セッション履歴表示（計画中）
  - 統計・分析機能（計画中）

詳細は `specs/002-poker-session-tracker/spec.md` を参照してください。

## 技術スタック

### コア

- **フロントエンド**: Next.js 15 (App Router) + React 19
- **UIライブラリ**: Mantine v8
- **バックエンド**: tRPC v11
- **データベース**: PostgreSQL 16 + Drizzle ORM v0.41
- **認証**: NextAuth.js v5

### ツール

- **ランタイム**: Bun
- **言語**: TypeScript 5.9
- **テスト**: Vitest
- **リント/フォーマット**: Biome
- **状態管理**: TanStack Query v5

## アーキテクチャパターン

このプロジェクトは**Presentation/Container分離パターン**を採用しています：

- **API層** (`src/server/`): ビジネスロジック、データアクセス、バリデーション
- **Container層** (`src/features/*/containers/`): 状態管理、API呼び出し、ロジック調整
- **Presentation層** (`src/features/*/components/`): UIコンポーネント、表示のみ

詳細は `CLAUDE.md` を参照してください。

## よくある質問（FAQ）

### Q1: データベース名が`todoapp`から`sapphire`に変更されましたが、古い環境はどうすればいいですか？

**A**: 既存の環境で`todoapp`データベースが残っている場合：

```bash
# 古いデータベースを削除（データは失われます）
docker exec sapphire-postgres psql -U postgres -c "DROP DATABASE todoapp;"
docker exec sapphire-postgres psql -U postgres -c "DROP DATABASE todoapp_test;"

# 新しいデータベースは自動的に作成されます
docker compose up -d
bun run db:push:all
```

### Q2: PWAアイコンが古いままで更新されません。

**A**: ブラウザキャッシュが原因です。以下を試してください：

1. ブラウザのキャッシュをクリア（Ctrl+Shift+Delete）
2. PWAをアンインストールして再インストール
3. Incognitoモード/プライベートブラウジングで開く

### Q3: OAuth認証がローカルで動作しません。

**A**: 以下を確認してください：

1. `.env`ファイルに正しいクライアントIDとシークレットが設定されているか
2. Google/GitHubのOAuth設定で、リダイレクトURIが`http://localhost:3000/api/auth/callback/{provider}`になっているか
3. `NEXTAUTH_SECRET`が設定されているか（空欄の場合はエラーになります）

### Q4: リブランディング後、どこから開発を始めればいいですか？

**A**: 現在計画中のポーカーセッショントラッカー機能から始めてください：

1. `specs/002-poker-session-tracker/spec.md` で仕様を確認
2. `/speckit.plan` で実装計画を確認/更新
3. `/speckit.tasks` コマンドでタスクリストを生成
4. タスクリスト順に実装を進める

### Q5: Todoアプリの仕様書（`specs/001-todo-app/`）は削除すべきですか？

**A**: いいえ、歴史的参照として保持してください。Todoアプリの機能は削除済みですが、仕様書は将来の参考資料として価値があります。

### Q6: テストを実行すると`sapphire_test`データベースが見つからないエラーが出ます。

**A**: テスト用データベースにスキーマが適用されていません：

```bash
bun run db:push:test
```

または、両方のデータベースにスキーマを適用：

```bash
bun run db:push:all
```

## トラブルシューティング

### PostgreSQLに接続できない

```bash
# コンテナの状態を確認
docker ps

# コンテナが起動していない場合
docker compose up -d

# ログを確認
docker compose logs postgres
```

### ポート5432が既に使用されている

`docker-compose.yml`のポートを変更：

```yaml
ports:
  - "5433:5432"  # ホスト側のポートを変更
```

`.env`も更新：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/sapphire"
```

### スキーマ適用が失敗する

```bash
# データベースをリセット
docker compose down -v
docker compose up -d

# スキーマを再適用
bun run db:push:all
```

### NextAuth.jsのエラー: "Invalid callback URL"

OAuth設定のリダイレクトURIを確認してください：
- Google: `http://localhost:3000/api/auth/callback/google`
- GitHub: `http://localhost:3000/api/auth/callback/github`

**Note**: `https`ではなく`http`であることに注意（ローカル開発の場合）

## 次のステップ

1. **仕様を読む**: `specs/002-poker-session-tracker/spec.md`でポーカーセッショントラッカーの仕様を確認
2. **実装計画を確認**: `specs/002-poker-session-tracker/plan.md`（存在する場合）
3. **タスクを生成**: `/speckit.tasks`コマンドでタスクリストを生成
4. **実装を開始**: タスクリスト順に実装を進める
5. **憲法を遵守**: `.specify/memory/constitution.md`で開発原則を確認

## サポート

問題が発生した場合は、以下を確認してください：

- `CLAUDE.md`: プロジェクト全体のコンテキストとアーキテクチャ
- `specs/*/spec.md`: 各機能の詳細仕様
- `README.md`: プロジェクトの最新情報

---

**Happy Coding with Sapphire! 💎**
