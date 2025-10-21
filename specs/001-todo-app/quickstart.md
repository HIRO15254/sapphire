# クイックスタートガイド: レスポンシブTodoアプリ

**Date**: 2025-10-17
**Feature**: レスポンシブTodoアプリ
**Purpose**: 開発環境のセットアップと実行手順

## 前提条件

開発を開始する前に、以下のツールがインストールされていることを確認してください:

- **Bun**: v1.0以上 ([インストール手順](https://bun.sh))
- **Docker Desktop**: 最新版 ([インストール手順](https://www.docker.com/products/docker-desktop))
- **Git**: 最新版
- **エディタ**: VS Code推奨

---

## 1. リポジトリのクローンとブランチ切り替え

```bash
# リポジトリをクローン (既にクローン済みの場合はスキップ)
git clone <repository-url>
cd mantttine_vibe_template

# フィーチャーブランチに切り替え
git checkout 001-todo-app
```

---

## 2. 依存関係のインストール

```bash
# Bunで依存関係をインストール
bun install
```

**インストールされる主要な依存関係**:
- Next.js 15+
- tRPC
- Drizzle ORM
- Mantine v8
- Vitest
- Biome

---

## 3. データベースのセットアップ

### 3.1. PostgreSQLコンテナの起動

```bash
# Docker Composeでpostgresを起動
docker compose up -d
```

`docker-compose.yml`の内容:
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: todoapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

### 3.2. 環境変数の設定

`.env.local`ファイルをプロジェクトルートに作成:

```bash
# .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todoapp"
```

### 3.3. データベースマイグレーションの実行

```bash
# Drizzle Kitでマイグレーションを生成
bun run drizzle-kit generate:pg

# マイグレーションを実行
bun run drizzle-kit migrate
```

**マイグレーション内容**:
- `tasks`テーブルの作成
- インデックスの作成 (`idx_tasks_created_at`)

---

## 4. 開発サーバーの起動

```bash
# Next.js開発サーバーを起動
bun run dev
```

ブラウザで http://localhost:3000 を開く。

**期待される動作**:
- Todoアプリの画面が表示される
- タスクの追加、完了、削除が可能

---

## 5. リント・フォーマットの実行

```bash
# Biomeでリントチェック
bun run lint

# Biomeで自動フォーマット
bun run format
```

---

## 6. テストの実行

### 6.1. すべてのテストを実行

```bash
# Vitestですべてのテストを実行
bun test
```

### 6.2. テストをwatch modeで実行

```bash
# ファイル変更時に自動実行
bun test --watch
```

### 6.3. 特定のテストを実行

```bash
# 契約テストのみ
bun test tests/contract

# 統合テストのみ
bun test tests/integration

# 単体テストのみ
bun test tests/unit
```

---

## 7. PWA機能の確認

### 7.1. プロダクションビルド

```bash
# ビルド
bun run build

# プロダクションサーバー起動
bun run start
```

### 7.2. PWAインストール

1. Chrome/Edgeで http://localhost:3000 を開く
2. アドレスバーに「インストール」ボタンが表示される
3. クリックしてPWAとしてインストール

### 7.3. オフライン動作確認

1. DevToolsを開く (F12)
2. Networkタブで「Offline」を選択
3. ページをリロード → キャッシュから表示されることを確認

---

## 8. データベースの管理

### 8.1. Drizzle Studio (GUI)

```bash
# Drizzle Studioを起動
bun run drizzle-kit studio
```

ブラウザで https://local.drizzle.studio を開き、tasksテーブルを直接編集可能。

### 8.2. psqlでの直接接続

```bash
# psqlでPostgreSQLに接続
docker exec -it <container-name> psql -U postgres -d todoapp
```

**よく使うSQL**:
```sql
-- すべてのタスクを表示
SELECT * FROM tasks ORDER BY created_at DESC;

-- タスク数を確認
SELECT COUNT(*) FROM tasks;

-- すべてのタスクを削除 (開発環境のみ)
DELETE FROM tasks;
```

---

## 9. トラブルシューティング

### 問題: `bun install`が失敗する

**解決策**:
```bash
# キャッシュをクリア
bun pm cache clear

# 再インストール
rm -rf node_modules bun.lockb
bun install
```

### 問題: PostgreSQLに接続できない

**解決策**:
```bash
# Dockerコンテナの状態確認
docker ps

# コンテナが起動していない場合
docker compose up -d

# ポート5432が既に使用されている場合
docker compose down
# docker-compose.ymlのportsを変更 (例: "5433:5432")
# .env.localのDATABASE_URLも更新
```

### 問題: マイグレーションが失敗する

**解決策**:
```bash
# データベースをリセット
docker compose down -v
docker compose up -d

# マイグレーションを再実行
bun run drizzle-kit migrate
```

### 問題: テストが失敗する

**解決策**:
```bash
# テスト用のDB環境を確認
# .env.testファイルを作成し、テスト用DBを指定

# キャッシュをクリア
bun test --clearCache

# 再実行
bun test
```

---

## 10. 次のステップ

開発環境のセットアップが完了したら、以下のステップに進んでください:

1. **タスク実装**: `specs/001-todo-app/tasks.md`を確認し、タスクを実装
2. **テスト駆動開発**: 各タスクのテストを先に作成し、Red-Green-Refactorサイクルを実践
3. **コードレビュー**: 各タスク完了後に変更内容をレビュー依頼
4. **コミット**: 承認後にコミットを実行

---

## 11. 便利なコマンド一覧

| コマンド                  | 説明                                  |
|---------------------------|---------------------------------------|
| `bun run dev`             | 開発サーバー起動                      |
| `bun run build`           | プロダクションビルド                  |
| `bun run start`           | プロダクションサーバー起動            |
| `bun test`                | すべてのテストを実行                  |
| `bun test --watch`        | テストをwatch modeで実行              |
| `bun run lint`            | Biomeでリントチェック                 |
| `bun run format`          | Biomeで自動フォーマット               |
| `bun run drizzle-kit studio` | Drizzle Studio (DB GUI)起動        |
| `bun run drizzle-kit generate:pg` | マイグレーションファイル生成   |
| `bun run drizzle-kit migrate` | マイグレーション実行               |
| `docker compose up -d`    | PostgreSQLコンテナ起動                |
| `docker compose down`     | PostgreSQLコンテナ停止                |
| `docker compose down -v`  | PostgreSQLコンテナとボリューム削除    |

---

## 12. 開発環境の推奨設定

### VS Code拡張機能

以下の拡張機能をインストールすることを推奨:

- **Biome**: `biomejs.biome`
- **Tailwind CSS IntelliSense**: `bradlc.vscode-tailwindcss`
- **Vitest**: `ZixuanChen.vitest-explorer`
- **Docker**: `ms-azuretools.vscode-docker`

### VS Code設定 (`.vscode/settings.json`)

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

---

## まとめ

このクイックスタートガイドに従うことで、以下が完了します:

- ✅ 開発環境のセットアップ
- ✅ PostgreSQLデータベースの準備
- ✅ Next.js + tRPC + Drizzle ORMの動作確認
- ✅ テスト環境の構築
- ✅ リント・フォーマットの設定

問題が発生した場合は、トラブルシューティングセクションを参照してください。
