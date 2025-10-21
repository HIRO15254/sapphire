# Mantine Vibe Template

[![CI](https://img.shields.io/badge/CI-passing-brightgreen)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Mantine](https://img.shields.io/badge/Mantine-8-339af0)](https://mantine.dev/)
[![Spec Kit](https://img.shields.io/badge/Spec_Kit-compatible-purple)](https://github.com/github/spec-kit)
[![Claude Code](https://img.shields.io/badge/Claude_Code-optimized-orange)](https://www.anthropic.com/claude-code)

## 🤖 仕様駆動のLLM開発テンプレート

このテンプレートは、**[GitHub Spec Kit](https://github.com/github/spec-kit)** と **[Anthropic Claude Code](https://www.anthropic.com/claude-code)** を使った**仕様駆動開発（Spec-Driven Development）** のために最適化されています。

### Spec-Driven Development（SDD）とは？

従来の「コードを書いてからドキュメントを書く」アプローチではなく、**仕様から始める**開発手法です。仕様は、コードがどのように動作すべきかの契約となり、AIエージェントがコードを生成、テスト、検証する際の真実の源（Source of Truth）となります。

**なぜ仕様駆動か？**
- 🎯 **明確な意図**: AIに「何を作りたいか」を正確に伝えられる
- 🏗️ **一貫したアーキテクチャ**: 仕様に基づいて統一された設計が実現
- ✅ **品質保証**: 仕様がテストと検証の基準となる
- 🚀 **効率的な開発**: 特にゼロから始めるプロジェクトで威力を発揮

### このテンプレートの特徴

- **[`.specify/`](./.specify/)**: Spec Kitの設定とテンプレートを含む
- **実装済みのTodoアプリ**: 仕様駆動開発の参考実装
- **包括的なテスト**: 仕様を検証するテストスイート
- **Claude Code最適化**: エージェント型コーディングに最適化された構造

詳細は以下を参照してください：
- 📚 [GitHub Spec Kit Documentation](https://github.com/github/spec-kit)
- 🤖 [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code/overview)
- 📝 [Spec-Driven Development Guide](https://github.com/github/spec-kit/blob/main/spec-driven.md)

---

## 💻 技術スタック

モダンなフルスタックWebアプリケーションのための完全なスターターテンプレート。Next.js 15、tRPC、Drizzle ORM、Mantine v8で構築されています。

このテンプレートには、実例として**レスポンシブTodoアプリ**が実装されており、ベストプラクティスとアーキテクチャパターンを学ぶことができます。

## ✨ 主な機能

### フロントエンド
- ✅ **タスク管理**: タスクの作成、完了管理、削除（実装済み）
- 📱 **レスポンシブデザイン**: モバイル、タブレット、デスクトップで最適化
- ♿ **アクセシビリティ**: WCAG 2.1 AA準拠
- 🎨 **モダンUI**: Mantine v8によるクリーンで直感的なUI
- 📲 **PWA対応**: オフライン動作とインストール可能

### バックエンド
- 🔒 **型安全性**: TypeScript + tRPCによる完全なエンドツーエンド型安全性
- 💾 **データベース**: PostgreSQL + Drizzle ORMによる型安全なデータベース操作
- 🔐 **認証**: NextAuth.js v5 (準備済み)
- 🚀 **高速**: Bunランタイムによる超高速ビルド・実行

### 開発体験
- 🧪 **包括的なテスト**: Vitest（単体・契約）+ Playwright（E2E）
- 📝 **リント/フォーマット**: Biome（ESLint + Prettier代替）
- 🔄 **CI/CD**: GitHub Actions設定済み
- 🐳 **コンテナ化**: Docker Compose設定済み

## 🛠️ 技術スタック

### コア
- **フロントエンド**: [Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- **UIライブラリ**: [Mantine v8](https://mantine.dev/)
- **バックエンド**: [tRPC](https://trpc.io/) v11
- **データベース**: [PostgreSQL 16](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- **認証**: [NextAuth.js v5](https://authjs.dev/)

### ツール
- **ランタイム**: [Bun](https://bun.sh/)
- **言語**: [TypeScript](https://www.typescriptlang.org/) 5.9
- **テスト**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)
- **リント/フォーマット**: [Biome](https://biomejs.dev/)
- **状態管理**: [TanStack Query](https://tanstack.com/query)

## 🚀 クイックスタート

### 前提条件

- [Bun](https://bun.sh) v1.0以上
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Git

### インストール手順

1. **リポジトリのクローン**

```bash
git clone <repository-url>
cd mantttine_vibe_template
```

2. **依存関係のインストール**

```bash
bun install
```

3. **環境変数の設定**

`.env.example`を`.env`にコピー:

```bash
cp .env.example .env
```

必要に応じて`.env`ファイルを編集してください。デフォルト設定でローカル開発は可能です。

4. **PostgreSQLの起動**

```bash
docker compose up -d
```

5. **データベーススキーマの適用**

本番DBとテスト用DBの両方にスキーマを適用します:

```bash
bun run db:push:all
```

個別に適用する場合:

```bash
# 本番DBのみ
bun run db:push

# テスト用DBのみ
bun run db:push:test
```

6. **開発サーバーの起動**

```bash
bun run dev
```

ブラウザで http://localhost:3000 を開く

## 使い方

### タスクの作成

1. 入力欄に新しいタスクの内容を入力
2. 「追加」ボタンをクリック（またはEnterキーを押す）

### タスクの完了管理

- タスクの左側のチェックボックスをクリックして完了/未完了を切り替え
- 完了したタスクは取り消し線で表示される

### タスクの削除

1. 削除したいタスクの右側のゴミ箱アイコンをクリック
2. 確認ダイアログで「削除する」をクリック

## 開発コマンド

```bash
# 開発サーバーの起動
bun run dev

# プロダクションビルド
bun run build

# プロダクションサーバーの起動（PWA有効）
bun run preview

# テストの実行
bun run test

# テスト（watch mode）
bun run test:watch

# E2Eテスト（Playwright）
bun run test:e2e

# リントチェック
bun run lint

# フォーマット
bun run format

# データベーススキーマ適用
bun run db:push:all     # 本番・テスト両方
bun run db:push         # 本番DBのみ
bun run db:push:test    # テスト用DBのみ

# データベース管理（Drizzle Studio）
bun run db:studio
```

## プロジェクト構成

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト（Mantineテーマ設定）
│   ├── page.tsx           # トップページ
│   └── api/trpc/          # tRPC APIハンドラー
│
├── server/                 # バックエンド（API層）
│   ├── api/
│   │   ├── routers/       # tRPCルーター
│   │   │   └── tasks.ts   # タスク関連API
│   │   ├── root.ts        # ルートルーター
│   │   └── trpc.ts        # tRPC設定
│   └── db/
│       ├── schema.ts      # Drizzleスキーマ定義
│       └── index.ts       # PostgreSQLクライアント
│
├── features/               # フロントエンド機能
│   └── tasks/
│       ├── components/    # Presentationコンポーネント
│       ├── containers/    # Containerコンポーネント
│       └── hooks/         # カスタムフック
│
└── styles/
    └── globals.css        # グローバルCSS

tests/
├── contract/              # 契約テスト（tRPC API）
├── integration/           # 統合テスト（E2Eフロー）
└── unit/                  # 単体テスト（コンポーネント）
```

## テスト

### テスト用データベースのセットアップ

テストは本番データベースとは別の`todoapp_test`データベースを使用します。

#### 新規セットアップの場合

Docker Composeを使用している場合、初回起動時に自動的に`todoapp_test`データベースが作成されます。

```bash
docker compose up -d

# 本番DBとテスト用DBの両方にスキーマを適用
bun run db:push:all
```

#### 既存のDockerコンテナを使用している場合

以下のコマンドで手動でテスト用データベースを作成します:

```bash
# テスト用データベースの作成
docker exec todoapp-postgres psql -U postgres -c "CREATE DATABASE todoapp_test;"

# テスト用DBにスキーマを適用
bun run db:push:test
```

#### スキーマ変更時の注意

スキーマを変更した際は、必ず両方のデータベースに適用してください:

```bash
bun run db:push:all
```

### テストの実行

```bash
# すべてのテストを実行
bun run test

# テスト（watch mode）
bun run test:watch

# E2Eテスト（Playwright）
bun run test:e2e

# 特定のテストスイートのみ
bun run test tests/contract
bun run test tests/unit
```

### テストカバレッジ

プロジェクトは以下のテストでカバーされています:

- **契約テスト**: tRPC APIの入出力を検証
- **E2Eテスト**: ブラウザ上でのユーザーフローを検証（Playwright）
- **単体テスト**: 個別コンポーネントと関数を検証

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

`docker-compose.yml`のポートを変更:

```yaml
ports:
  - "5433:5432"  # ホスト側のポートを変更
```

`.env.local`も更新:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/todoapp"
```

### スキーマ適用が失敗する

```bash
# データベースをリセット
docker compose down -v
docker compose up -d

# スキーマを再適用（両方のDB）
bun run db:push:all
```

### テストDBと本番DBのスキーマがずれている

```bash
# テスト用DBのみスキーマを適用
bun run db:push:test

# または両方に適用
bun run db:push:all
```

## 📚 アーキテクチャとパターン

このテンプレートは、スケーラブルで保守性の高いアプリケーションを構築するためのベストプラクティスを採用しています：

### ディレクトリ構造
- **Presentation/Container パターン**: UI層とロジック層を分離
- **Feature-based 構造**: 機能ごとにコードを整理
- **Type-safe API**: tRPCによるエンドツーエンド型安全性

### テスト戦略
- **単体テスト**: コンポーネントと関数の独立したテスト
- **契約テスト**: API層の入出力検証
- **E2Eテスト**: 実際のユーザーフローのテスト

## 📄 ライセンス

このプロジェクトは[MIT License](./LICENSE)の下でライセンスされています。

## 🙏 謝辞

このテンプレートは以下のプロジェクトに基づいています：
- [T3 Stack](https://create.t3.gg/)
- [Mantine](https://mantine.dev/)
- そして素晴らしいオープンソースコミュニティ

## 📞 フィードバック

このテンプレートを使用して何か構築した場合や、改善の提案がある場合は、お気軽にフィードバックをお寄せください。

---

**このテンプレートで何か構築しましたか？** ぜひ教えてください！

🤖 Generated with [Claude Code](https://claude.com/claude-code)
