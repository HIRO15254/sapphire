$ARGUMENTS を修正内容の要約テキスト、または既存 spec 名として受け取り、簡素な fix ワークフローを実行してください。
全ドキュメント（requirements / design / tasks）を一括生成し、1つの Linear Issue でまとめて承認を得てから実装します。

全ドキュメントは **Linear issue の description に直接書き込む**（ローカルに .md ファイルを作成しない）。
実装ログは **Linear sub-issue のコメントとして記録する**。

ドキュメント作成後、Linear issue をレビュー待ちにしてワークフローを **停止** する。
承認/リジェクトは Linear Webhook サーバー経由で検出され、再開モードで自動的に実装が開始される。

---

## モード判定

1. `.claude/workflows/` 配下の JSON ファイルを Glob で確認し、一覧を取得する
2. `$ARGUMENTS` が既存 spec 名（JSON ファイル名）に一致するか、「続き」「再開」「強制再開」「continue」等のキーワードを含むか判定する
3. 一致する workflow JSON がある:
   - 「強制再開」を含む → **強制再開モード**へ
   - それ以外 → **再開モード**へ
4. 一致しない → `mcp__linear__list_issues` で Sapphire チームの `label: "Fix"` issue を検索し、`$ARGUMENTS` に合致するものを探す
5. 合致する issue がある → ユーザーに確認して **再開モード**へ
6. いずれも該当しない → **新規作成モード**へ（手動フォールバック）

---

## Steering ドキュメント読み込み（全モード共通・必須）

以下の steering ドキュメントを **必ず Read ツールで読み込む**。これらはプロジェクトの方針・技術スタック・構造を定義しており、全フェーズで参照する:

- `.claude/steering/product.md` — プロダクトの目的、ターゲットユーザー、主要機能、原則
- `.claude/steering/tech.md` — 技術スタック、アーキテクチャ、開発ツール、制約事項
- `.claude/steering/structure.md` — ディレクトリ構成、命名規則、コード構造パターン

---

## 進捗報告（Project Summary）

各チェックポイントで `mcp__linear__update_project` を呼び出し、プロジェクトの `summary` を更新して現在の進捗を Linear 上で確認できるようにする。

投稿タイミングは各 Step 内に記載。`id` は workflow JSON の `projectId` を使用する。

---

## 新規作成モード（手動フォールバック）

### Step 1: セットアップ + ドキュメント一括生成

1. `$ARGUMENTS` を修正内容の要約として取得
2. 要約から英語 kebab-case の spec 名を生成する（例: `fix-balance-calculation`）
3. Read ツールで `.claude/templates/requirements-template.md`, `design-template.md`, `tasks-template.md` を読み込む
4. **steering ドキュメント（product.md, tech.md, structure.md）の内容を踏まえ**、コードベースを分析し、以下の3ドキュメントを **連続して** 作成する:

   a. **Requirements**: テンプレートに従い作成（fix 規模に合わせて簡潔に）
   b. **Design**: Requirements を踏まえて作成（fix 規模に合わせて簡潔に）
   c. **Tasks**: Requirements と Design を踏まえて作成（各タスクに `_Prompt` フィールドを含める）

### Step 2: Linear Issue 作成 + 承認依頼

1. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Fix ドキュメントを作成中..."2. `mcp__linear__list_issue_labels` で `Fix` ラベルの存在を確認する。なければ `mcp__linear__create_issue_label` で作成（name: `Fix`, color: `#e5484d`）
3. `mcp__linear__create_project` でプロジェクトを作成:
   - `name`: spec 名
   - `team`: `Sapphire`
   - `description`: 修正内容の要約
4. `mcp__linear__create_issue` で **1つの Fix Issue** を作成する:
   - `title`: `[Fix] {spec-name}`
   - `team`: `Sapphire`
   - `labels`: `["Fix"]`
   - `project`: プロジェクト名
   - `description`: 以下の内容を Markdown で構成する:
     ```
     ## 概要
     {修正内容の要約}

     ## Requirements
     {Requirements の全文}

     ## Design
     {Design の全文}

     ## Tasks
     {Tasks のタスク一覧}
     ```
   - `state`: `In Review`
   - `assignee`: `"me"`（ユーザーにレビューを依頼）
5. セッション開始コメントを Fix issue に投稿する（セッション開始コメント参照）
6. Write ツールで `.claude/workflows/{spec-name}.json` を保存する:
   ```json
   {
     "version": "2.0",
     "workflowType": "fix",
     "specName": "{spec-name}",
     "summary": "{修正内容の要約}",
     "teamId": "{teamId}",
     "projectId": "{projectId}",
     "projectUrl": "{projectUrl}",
     "clarificationIssueId": null,
     "phases": null,
     "issueId": "{issueId}",
     "issueIdentifier": "{identifier}",
     "issueUrl": "{issueUrl}",
     "prReviewIssue": null,
     "taskIssues": [],
     "waitingFor": "approval",
     "createdAt": "{ISO 8601}"
   }
   ```
7. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Fix ドキュメント完了。レビュー待ち。"8. **「Fix のレビューを依頼しました。承認後に Webhook 経由で自動再開します。」と表示してワークフローを停止する。**

### Step 3: Implementation

1. セッション開始コメントを Fix issue に投稿する
2. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Implementation 開始"3. **git worktree を作成する:**
   ```
   git worktree add .worktrees/{spec-name} -b fix/{spec-name} dev
   ```
4. Fix issue の `description` から Tasks セクションを読み取り、各タスクを `mcp__linear__create_issue` で Fix issue の sub-issue として作成する:
   - `title`: `{タスク番号}. {タスクタイトル}`
   - `description`: タスクの詳細
   - `team`: `Sapphire`
   - `parentId`: Fix issue の issueId
   - `labels`: `["Fix"]`
   - `project`: プロジェクト名
5. workflow JSON の `taskIssues` を更新して保存
6. 各タスクを順番に実装する（**作業ディレクトリは `.worktrees/{spec-name}/`**）:
   a. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Task {n}/{total}: {タスク名}"   b. 対応する sub-issue を `mcp__linear__update_issue` で `state: "In Progress"` に更新
   c. 既に Done の sub-issue はスキップする
   d. `_Prompt` フィールドの指示に従って実装する
   e. 実装詳細を `mcp__linear__create_comment` で対応する sub-issue にコメントとして記録する:
      ```markdown
      ## Implementation Log
      **Summary:** {実装内容}
      **Files Modified:** {変更ファイル一覧}
      **Files Created:** {作成ファイル一覧}
      **Lines:** +{追加行} -{削除行}
      ```
   f. sub-issue を `state: "Done"` に更新
   g. **DB スキーマ変更がある場合**: `src/server/db/schema/` のファイルを変更した場合は、worktree 内で `bun run db:generate` を実行してマイグレーションファイルを生成する。生成された `drizzle/` 配下のファイルもコミットに含める
   h. 変更ファイルを `git add` して commit を作成する:
      ```
      git commit -m "$(cat <<'EOF'
      fix({scope}): {修正内容の要約}

      Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
      EOF
      )"
      ```
7. 全タスク完了後:
   a. worktree ディレクトリから push: `git -C .worktrees/{spec-name} push -u origin fix/{spec-name}`
   b. `gh pr create --base dev --head fix/{spec-name}` で PR を作成する:
      - タイトル: fix の内容を簡潔に表すもの
      - 本文: 修正内容の要約、変更タスク一覧、テスト計画を含める
   c. PR URL を `mcp__linear__update_issue` で Fix issue に `links: [{url: PR_URL, title: "Pull Request"}]` として追加する
   d. `mcp__linear__create_issue` で **PR Review issue** を作成する:
      - `title`: `[PR Review] {spec-name}`
      - `team`: `Sapphire`
      - `labels`: `["Fix"]`
      - `project`: プロジェクト名
      - `description`: PR URL と変更概要を含む Markdown
      - `state`: `In Review`
      - `assignee`: `"me"`
   e. workflow JSON を更新して保存:
      - `prReviewIssue`: `{ issueId, issueIdentifier, issueUrl }` — 作成した PR Review issue の情報
      - `waitingFor`: `"pr-review"`
   f. **worktree は残す**（PR レビューで追加修正の可能性あり）
   g. `mcp__linear__update_project` でプロジェクトの summary を更新:`"PR 作成完了: {PR_URL}。レビュー待ち。"   h. **「PR を作成しました: {PR_URL}。レビュー後に PR Review issue を Done にしてください。」と表示してワークフローを停止する。**

### Step 4: 完了処理（PR Review issue が Done になった時に Webhook 経由で実行）

1. `mcp__linear__update_issue` で Fix issue を `state: "Done"` に更新
2. `mcp__linear__update_issue` で PR Review issue を `state: "Done"` に更新（既に Done の場合はスキップ）
3. `mcp__linear__update_project` でプロジェクトを `state: "completed"` に更新する
4. `mcp__linear__update_project` でプロジェクトの summary を更新:`"完了。PR をマージしてください。"5. git worktree を削除する: `git worktree remove .worktrees/{spec-name}`
6. workflow JSON の `waitingFor` を `null` に更新して保存
7. 「実装完了。PR をマージしてください: {PR_URL}」と表示して終了

---

## 再開モード

1. workflow JSON を Read ツールで読み込む
2. `mcp__linear__update_project` でプロジェクトの status を更新: `id: projectId`, `state: "In Progress"`
3. **steering ドキュメントを Read ツールで読み込む**（全モード共通・必須）
4. Fix issue の最新ステータスを `mcp__linear__get_issue` で取得する。`prReviewIssue` がある場合はその issue も取得する
5. 現在の状態を判定する:
   - `waitingFor` が null → 「完了済みです」と表示して終了
   - `prReviewIssue` が Done かつ `waitingFor` が `"pr-review"` → Step 4 へ
   - `prReviewIssue` が存在し未完了 → 「PR Review 待ちです」と表示して終了
   - Fix issue が In Progress で `taskIssues` が空 → ドキュメント承認後。Step 3 へ
   - Fix issue が In Progress で `taskIssues` があり未完了 sub-issue がある → Step 3 の実装途中から再開（Done 済みタスクはスキップ）
   - Fix issue が In Progress で `taskIssues` があり全 sub-issue が Done かつ `prReviewIssue` なし → Step 3.6 から再開（PR 作成 + PR Review issue 作成）
   - Fix issue が Rejected → 修正フローを実行
6. 判定結果を表示する:
   ```
   再開: {spec-name} (fix)
   Issue: {issueIdentifier} {issueUrl}
   Status: {status}
   → {再開内容の説明}
   ```
7. 該当する Step から実行を開始する

---

## 強制再開モード

Project の "AI Queue" ステータス再割り当て経由で呼び出される。
`waitingFor` の値を **無視** し、Linear Issue の実際のステータスのみを基に現在地を判定して強制的に進行する。

1. workflow JSON を Read ツールで読み込む
2. `mcp__linear__update_project` でプロジェクトの status を更新: `id: projectId`, `state: "In Progress"`
3. **steering ドキュメントを Read ツールで読み込む**（全モード共通・必須）
4. Fix issue の最新ステータスを `mcp__linear__get_issue` で取得する。`prReviewIssue` がある場合はその issue も取得する
5. `taskIssues` がある場合は、全 sub-issue のステータスも `mcp__linear__get_issue` で取得する
6. Issue の実際のステータスのみで現在地を判定する（`waitingFor` は参照しない）:
   - Fix issue が Done かつ `prReviewIssue` が Done（または存在しない） → 「完了済みです」と表示して終了
   - `prReviewIssue` が Done → Step 4 へ（完了処理）
   - `taskIssues` があり全 sub-issue が Done かつ `prReviewIssue` なし → Step 3.6 から再開（PR 作成 + PR Review issue 作成）
   - `taskIssues` があり未完了 sub-issue がある → Step 3 の実装途中から再開（Done 済みタスクはスキップ）
   - `taskIssues` が空かつ Fix issue が Done → Step 3 へ（ドキュメント承認済み、実装開始）
   - `taskIssues` が空かつ Fix issue が In Progress → Step 3 へ（ドキュメント承認済みとみなして実装開始）
   - Fix issue が未着手 → 「Fix Issue がまだ作成されていません」と表示して終了
7. workflow JSON の `waitingFor` を判定結果に応じて修正・保存する
8. 判定結果を表示する:
   ```
   強制再開: {spec-name} (fix)
   Issue: {issueIdentifier} {issueUrl}
   Fix Issue Status: {status}
   Tasks: {done}/{total} done
   PR Review: {status or "未作成"}
   → Step {N} を強制再開します。
   ```
9. 該当する Step から実行を開始する

---

## 修正フロー（Rejected 検出時 — Webhook サーバーから呼び出される）

1. セッション開始コメントを Fix issue に投稿する
2. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Fix を修正中..."3. `mcp__linear__list_comments` で Fix issue のコメント一覧を取得する
4. 最新のコメントからフィードバック内容を読み取る
5. フィードバック内容を表示する:
   ```
   Fix がリジェクトされました。
   フィードバック: {コメント内容}
   修正を開始します...
   ```
6. **steering ドキュメントを踏まえ**、フィードバックに基づいて Fix issue の `description` を修正する（`mcp__linear__update_issue`）
7. 修正内容の要約を `mcp__linear__create_comment` で Fix issue にコメントとして追加する
8. `mcp__linear__update_issue` で Fix issue を `state: "In Review"`, `assignee: "me"` に更新（再度レビュー依頼）
9. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Fix 修正完了。レビュー待ち。"10. workflow JSON の `waitingFor` はそのまま維持して保存
11. **「修正を完了し、再度レビューを依頼しました。」と表示してワークフローを停止する。**

---

## セッション開始コメント

各フェーズ再開時に対象 Issue に `mcp__linear__create_comment` でセッション開始コメントを投稿する:

```markdown
Claude Code session started
Phase: {current phase}
Spec: {spec-name}
Timestamp: {ISO 8601}
```

---

## 重要なルール

- **steering ドキュメント（product.md, tech.md, structure.md）は全フェーズで必ず参照すること**
- テンプレート参照先: `.claude/templates/`（Read ツールで読み込む）
- workflow JSON の保存先: `.claude/workflows/{spec-name}.json`
- ドキュメントは **Linear issue の description に直接書き込む**（ローカルに .md ファイルを作成しない）
- 実装ログは **Linear sub-issue のコメントとして記録する**（`mcp__linear__create_comment`）
- fix 規模のドキュメントは簡潔に書く（長大な仕様書は不要）
- ドキュメント作成後は **ワークフローを停止する**（ポーリングしない）。承認検出は Webhook サーバーが行う
- 承認判定は Linear issue の status で行う（`Done` = 承認、`Rejected` = リジェクト → 修正フロー）
- レビュー依頼時は必ず `assignee: "me"` でユーザーにアサインする
- Implementation フェーズでは **git worktree**（`.worktrees/{spec-name}/`）を使用する
- PR 作成後は **PR Review issue** を別途作成し、Done を待って完了処理を行う
- worktree の削除は **PR Review issue が Done になった時**（Step 4）に行う
- git commit は HEREDOC でメッセージを渡し、末尾に `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>` を含める
- git ブランチは `fix/{spec-name}` 形式にする（`spec/` ではなく `fix/`）
- 再開モードでは Done 済みのタスクをスキップする
- Linear MCP ツール名はすべて `mcp__linear__` プレフィックス付きで呼び出す
