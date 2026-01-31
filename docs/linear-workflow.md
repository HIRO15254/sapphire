# Linear ワークフロー自動化ガイド

Linear Project の作成をトリガーとして、Claude Code が要件定義から実装までを自動で進行するワークフローシステム。

## 概要

```
User: Linear で Project 作成 (label + status: AI Queue)
  ↓
Webhook Server: 検知 → Claude を spawn
  ↓
Claude: Project を "In Progress" に変更 → 要件チェック → ドキュメント作成 → レビュー依頼 → 停止
  ↓
User: Issue を Done / Rejected
  ↓
Webhook Server: 検知 → Claude を再 spawn
  ↓
Claude: Project を "In Progress" に変更 → 次フェーズを実行 → ... → Implementation → PR 作成

※ ワークフローが途中終了した場合: Project を "AI Queue" に再設定 → 強制再開
```

## 事前準備

### 1. 環境変数

`.env` に以下を設定:

```
LINEAR_WEBHOOK_SECRET="<Linear Webhook 設定画面のシークレット>"
# WEBHOOK_PORT=3001  # デフォルト 3001
```

### 2. Linear 側の設定

#### プロジェクトラベル作成（Linear UI で手動）

| ラベル名 | 用途 |
|---|---|
| `full-spec-workflow` | Spec ワークフロー（Requirements → Design → Tasks → Implementation） |
| `fix-spec-workflow` | Fix ワークフロー（一括ドキュメント → Implementation） |

Linear の Settings → Labels → **Project labels** から作成する。

#### プロジェクトステータス作成（Linear UI で手動）

Settings → Teams → Sapphire → Workflows → **Project statuses** から以下のステータスを追加する:

| ステータス名 | 用途 |
|---|---|
| `AI Queue` | Webhook サーバーのトリガー（新規ワークフロー開始 / 強制再開） |
| `In Progress` | AI セッションが稼働中（Claude が自動設定） |

#### Issue ステータス作成（Linear UI で手動）

Settings → Teams → Sapphire → Workflows → **Issue statuses** から以下を追加する:

| ステータス名 | 用途 |
|---|---|
| `In Review` | Claude がレビューを依頼中（ユーザーのアクション待ち） |
| `Rejected` | ユーザーがリジェクト（フィードバック付きで修正を要求） |

#### Webhook 設定

Linear の Settings → API → Webhooks:

- **URL**: `http://<host>:3001/webhook/linear`
- **Resource types**: `Project`, `Issue`, `Project Update` を有効化
- **Secret**: `.env` の `LINEAR_WEBHOOK_SECRET` と同じ値

### 3. Webhook サーバー起動

```bash
bun run webhook:linear
```

サーバーが `http://0.0.0.0:3001` でリッスンを開始する。

## ワークフローの種類

### Spec ワークフロー（`full-spec-workflow`）

大きな機能追加向け。4つのフェーズを順番に進行し、各フェーズでレビュー承認を得る。

| フェーズ | 内容 | 承認単位 |
|---|---|---|
| Requirements | 要件定義 | Issue 単体 |
| Design | 設計書 | Issue 単体 |
| Tasks | タスク分割 | Issue 単体 |
| Implementation | 実装 + PR | Issue 単体 |

### Fix ワークフロー（`fix-spec-workflow`）

小規模な修正向け。Requirements / Design / Tasks を1つの Issue にまとめて一括承認。

| フェーズ | 内容 | 承認単位 |
|---|---|---|
| ドキュメント | Requirements + Design + Tasks 一括 | 1 Issue |
| Implementation | 実装 + PR | 同一 Issue |

## 使い方

### 自動起動（推奨）

1. Linear で **Project** を作成する
   - **Name**: 機能名やチケット名（spec 名に変換される）
   - **Description**: やりたいことを具体的に書く（要件として使われる）
   - **Label**: `full-spec-workflow` または `fix-spec-workflow`
   - **Status**: `AI Queue` に設定

2. Webhook サーバーが検知し、Claude が自動起動する

3. Claude が要件を分析し:
   - 不明点がある → **Clarification Issue** を作成して停止。コメントで回答後、Issue を Done にする
   - 明確 → ドキュメントを作成し、レビュー待ちで停止

4. 各フェーズの Issue をレビューする:
   - **承認**: Issue を **Done** にする → 次フェーズが自動開始
   - **リジェクト**: Issue にコメントでフィードバックを書き、**Rejected** にする → Claude が修正して再提出

5. Implementation 完了後、PR が作成される。PR Review Issue を Done にすると worktree が自動削除され、Project も Done になる

### AI Queue 再割り当てによる強制再開

ワークフローが途中終了した場合、Project の status を **AI Queue** に再設定することで強制再開できる。

通常の再開（Issue を Done/Rejected にする）とは異なり、強制再開は:
- workflow JSON の `waitingFor` を無視し、全 Issue の実際のステータスを確認する
- 現在地を自動判定し、適切な Step から再開する
- Project の status を自動的に "In Progress" に戻す

### 手動起動（フォールバック）

Webhook サーバーなしでも、Claude Code のスラッシュコマンドで直接起動できる:

```
/linear-spec-workflow 通貨ページのリワーク
/linear-fix-workflow バランス計算のバグ修正
```

既存ワークフローの再開:

```
/linear-spec-workflow currency-page-rework を再開
/linear-fix-workflow fix-balance-calculation を再開
```

## ファイル構成

```
.claude/
├── commands/
│   ├── linear-workflow-init.md      # Webhook 起点の初期化コマンド
│   ├── linear-spec-workflow.md      # Spec ワークフローコマンド
│   └── linear-fix-workflow.md       # Fix ワークフローコマンド
├── steering/                        # プロジェクト方針ドキュメント
│   ├── product.md                   # プロダクト概要・原則
│   ├── tech.md                      # 技術スタック・制約
│   └── structure.md                 # ディレクトリ構成・命名規則
├── templates/                       # ドキュメントテンプレート
│   ├── requirements-template.md
│   ├── design-template.md
│   ├── tasks-template.md
│   ├── product-template.md
│   ├── tech-template.md
│   └── structure-template.md
├── workflows/                       # ワークフロー状態 JSON
│   └── {spec-name}.json
└── settings.local.json

scripts/
└── linear-webhook-server.ts         # Webhook サーバー

.worktrees/                          # Implementation 用 git worktree（.gitignore 済み）
```

## データの配置先

全データは Linear に集約され、ローカルファイルは最小限。

| データ | 配置先 |
|---|---|
| Requirements / Design / Tasks | Linear Issue の description |
| 実装ログ | Linear sub-issue のコメント |
| ワークフロー状態 | `.claude/workflows/{name}.json` |
| テンプレート | `.claude/templates/` |
| Steering ドキュメント | `.claude/steering/` |

## Steering ドキュメント

ワークフローの各フェーズで Claude が必ず参照するプロジェクト方針ドキュメント。
要件定義・設計・タスク作成がプロジェクトの方針に沿うよう保証する。

| ファイル | 内容 |
|---|---|
| `product.md` | プロダクトの目的、ターゲットユーザー、主要機能、原則 |
| `tech.md` | 技術スタック、アーキテクチャ、開発ツール、制約事項 |
| `structure.md` | ディレクトリ構成、命名規則、コード構造パターン |

更新する場合は `.claude/steering/` 配下のファイルを直接編集する。

## ワークフロー状態 JSON

`.claude/workflows/{spec-name}.json` にワークフローの進行状態を保存する。

```jsonc
{
  "version": "2.0",
  "workflowType": "spec",        // "spec" | "fix" | "pending" | "version-up"
  "specName": "currency-rework",
  "summary": "通貨ページのリワーク",
  "teamId": "...",
  "projectId": "...",
  "projectUrl": "...",
  "clarificationIssueId": null,  // Clarification issue がある場合
  "phases": {                    // Spec ワークフローのみ
    "requirements": { "issueId": "...", "issueIdentifier": "SAP-1", "issueUrl": "..." },
    "design":       { "issueId": "...", "issueIdentifier": "SAP-2", "issueUrl": "..." },
    "tasks":        { "issueId": "...", "issueIdentifier": "SAP-3", "issueUrl": "..." },
    "implementation": { "issueId": "...", "issueIdentifier": "SAP-4", "issueUrl": "..." }
  },
  "issueId": null,               // Fix ワークフローのメイン Issue
  "prReviewIssue": null,          // Fix ワークフローの PR Review Issue
  "taskIssues": [],               // Implementation sub-issues
  "waitingFor": "requirements",   // 現在待機中のフェーズ
  "createdAt": "2026-01-30T..."
}
```

### `waitingFor` の値

| 値 | 意味 |
|---|---|
| `"init"` | 初期化待ち（Webhook サーバーが作成直後） |
| `"clarification"` | ユーザーの回答待ち |
| `"requirements"` | Requirements レビュー待ち |
| `"design"` | Design レビュー待ち |
| `"tasks"` | Tasks レビュー待ち |
| `"approval"` | Fix ドキュメント一括レビュー待ち |
| `"pr-review"` | PR レビュー待ち |
| `"changelog-review"` | CHANGELOG レビュー待ち（version-up） |
| `null` | 完了済み |

## Git Worktree

Implementation フェーズでは git worktree を使い、メインディレクトリとは独立した作業ディレクトリで実装を行う。
これにより複数ワークフローの並行実行時にブランチの競合を防ぐ。

```bash
# Spec ワークフロー
git worktree add .worktrees/{spec-name} -b spec/{spec-name} dev

# Fix ワークフロー
git worktree add .worktrees/{spec-name} -b fix/{spec-name} dev
```

worktree は PR Review Issue が **Done** になった時点で自動削除される。
`.worktrees/` は `.gitignore` に追加済み。

## セッション開始コメント

Claude が各フェーズを開始する際、対象の Linear Issue にセッション開始コメントを自動投稿する。
これにより Linear 上でどのワークフローが現在アクティブか確認できる。

```markdown
Claude Code session started
Phase: requirements
Spec: currency-rework
Timestamp: 2026-01-30T12:00:00.000Z
```

## セッション管理

### 同時実行制御

1つの spec に対して同時に走る Claude セッションは最大1つに制限される。
Webhook サーバーは各 spec の実行中プロセスを追跡し、既にセッションが走っている spec に対する新たな spawn をスキップする。

### ステータスダッシュボード

Webhook サーバーは以下のタイミングでワークフロー状態テーブルを出力する:
- サーバー起動時
- Claude セッションの起動・終了時

テーブルには各ワークフローの spec 名、種類、待機中フェーズ、セッション PID が表示される。

## バージョン管理

### 概要

dev ブランチに蓄積されたコミットを分析し、セマンティックバージョニングに基づいてバージョンを決定、CHANGELOG 生成・リリースブランチ作成・PR 作成までを自動化する。

```
dev ブランチにコミットが蓄積
  ↓
/version-up トリガー（自動）または /release-notes（手動）
  ↓
コミット分析 → バージョン決定 → CHANGELOG 生成
  ↓
release/v{version} ブランチ作成 → main への PR 作成
```

### version-up（自動 — Webhook 経由）

Linear の Project Updates に `/version-up` を投稿すると、Webhook サーバーが検知して Claude を起動する。
CHANGELOG の内容を Linear Issue として作成し、承認/リジェクトのレビューフローを挟んでから release ブランチと PR を作成する。

```
/version-up 発行
  ↓
Phase 1: コミット分析 → CHANGELOG 生成 → Issue 作成（In Review）→ 停止
  ↓
User: Issue を Done / Rejected
  ↓
Phase 2: release ブランチ作成 → PR 作成 → Linear 報告 → workflow JSON 削除
```

#### 使い方

1. Linear で任意の **Project** を開く
2. Project の **Updates** タブに `/version-up` と投稿する
3. Webhook サーバーが検知し、Claude が自動起動する
4. Claude がコミットを分析し、CHANGELOG を生成して **[Version Up] v{version}** Issue を作成する
5. Issue をレビューする:
   - **承認**: Issue を **Done** にする → release ブランチ + PR が自動作成される
   - **リジェクト**: Issue にコメントでフィードバックを書き、**Rejected** にする → Claude が CHANGELOG を修正して再提出

#### 処理フロー

**Phase 1（CHANGELOG 生成 + レビュー依頼）:**

1. `main..dev` 間のコミットを取得し、Conventional Commits プレフィックスで分類
2. バージョンバンプレベルを決定:
   - `feat!` / `BREAKING CHANGE` → **メジャー**
   - `feat` → **マイナー**
   - `fix` / その他 → **パッチ**
3. CHANGELOG エントリを生成（日本語、Added / Changed / Fixed に分類）
4. CHANGELOG レビュー Issue を作成（`state: "In Review"`）
5. workflow JSON（`.claude/workflows/version-up.json`）を保存して停止

**Phase 2（release ブランチ + PR 作成）:**

6. `release/v{version}` ブランチを git worktree で作成
7. `package.json` のバージョンと `CHANGELOG.md` を更新してコミット
8. `main` ブランチへの PR を作成
9. Linear Project に結果を報告（バージョン、PR URL など）
10. workflow JSON を削除（次回新規開始のため）

#### ワークフロー状態

version-up は `.claude/workflows/version-up.json` に状態を保存する。`waitingFor` は `"changelog-review"` が設定される。

Phase 2 完了時に workflow JSON は **自動削除** される。これにより次回の `/version-up` で新規開始できる。

#### 注意事項

- 同時実行は1つまで（既に version-up セッションが走っている場合はスキップ）
- `chore` / `ci` / `docs` のみのコミットは CHANGELOG から除外される
- Rejected 時はコメントにフィードバックを書いてから Rejected にすること

### release-notes（手動 — CLI）

Claude Code のスラッシュコマンドで直接実行する。Webhook サーバー不要。

```
/release-notes
```

#### 処理フロー

1. `gh pr list --base main --state open` で現在の PR を特定
2. PR のコミット情報を取得し、内容を分類
3. 既存の `CHANGELOG.md` フォーマットに従いエントリを生成
4. `package.json` のバージョンをバンプ
5. 変更をコミット（メッセージ: `release: v{新バージョン}`）

### ビルド時のバージョン情報生成

`bun run build` 実行時に `prebuild` フックで `scripts/generate-version.js` が自動実行される。
`CHANGELOG.md` をパースして `public/version.json` を生成し、フロントエンドからバージョン情報を参照できるようにする。

```jsonc
// public/version.json（自動生成 — .gitignore 済み）
{
  "version": "1.2.0",
  "buildTime": "2026-01-30T05:29:40.190Z",
  "changelogs": [
    { "version": "1.2.0", "date": "2026-01-30", "content": "### Added\n..." }
  ]
}
```

## トラブルシューティング

### Webhook サーバーが反応しない

1. サーバーが起動しているか確認: `bun run webhook:linear`
2. ヘルスチェック: `curl http://localhost:3001/health`
3. `LINEAR_WEBHOOK_SECRET` が Linear の設定と一致しているか確認
4. Linear Webhook の Resource types に `Project` と `Issue` が含まれているか確認

### ワークフローが開始されない

1. プロジェクトに `full-spec-workflow` または `fix-spec-workflow` ラベルが付いているか確認
2. プロジェクトの status が `AI Queue` になっているか確認
3. 既に同じ Project の workflow JSON が存在する場合は強制再開が実行される（新規作成ではなくリカバリ動作）

### ワークフローが再開されない

1. Issue の状態が `Done`（承認）または `Rejected`（リジェクト）になっているか確認
2. workflow JSON の `waitingFor` が適切な値になっているか確認
3. Webhook サーバーのログで `[SKIP]` メッセージが出ていないか確認
