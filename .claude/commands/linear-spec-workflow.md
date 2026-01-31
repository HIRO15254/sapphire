$ARGUMENTS を要件の要約テキスト、または既存 spec 名として受け取り、spec-workflow の全フェーズ（Requirements → Design → Tasks → Implementation）を Linear で管理しながら実行してください。

全ドキュメントは **Linear issue の description に直接書き込む**（ローカルに .md ファイルを作成しない）。
実装ログは **Linear sub-issue のコメントとして記録する**。

各フェーズのドキュメント作成後、Linear issue をレビュー待ちにしてワークフローを **停止** する。
承認/リジェクトは Linear Webhook サーバー経由で検出され、再開モードで自動的に次フェーズが開始される。

---

## モード判定

1. `.claude/workflows/` 配下の JSON ファイルを Glob で確認し、一覧を取得する
2. `$ARGUMENTS` が既存 spec 名（JSON ファイル名）に一致するか、「続き」「再開」「強制再開」「continue」等のキーワードを含むか判定する
3. 一致する workflow JSON がある:
   - 「強制再開」を含む → **強制再開モード**へ
   - それ以外 → **再開モード**へ
4. 一致しない → `mcp__linear__list_projects` で Sapphire チームのプロジェクトを検索し、`$ARGUMENTS` に合致するものを探す
5. 合致するプロジェクトがある → ユーザーに確認して **再開モード**へ
6. いずれも該当しない → **新規作成モード**へ（手動フォールバック）

---

## Steering ドキュメント読み込み（全モード共通・必須）

以下の steering ドキュメントを **必ず Read ツールで読み込む**。これらはプロジェクトの方針・技術スタック・構造を定義しており、全フェーズで参照する:

- `.claude/steering/product.md` — プロダクトの目的、ターゲットユーザー、主要機能、原則
- `.claude/steering/tech.md` — 技術スタック、アーキテクチャ、開発ツール、制約事項
- `.claude/steering/structure.md` — ディレクトリ構成、命名規則、コード構造パターン

---

## 進捗報告（Project Summary）

ワークフロー実行中、`mcp__linear__update_project` でプロジェクトの `summary` を更新し、現在の進捗を Linear 上で確認できるようにする。

投稿タイミングは各 Step 内に記載。`id` は workflow JSON の `projectId` を使用する。

---

## 新規作成モード（手動フォールバック）

### Step 0: 初期セットアップ

1. `$ARGUMENTS` を要件要約として取得
2. 要約から英語 kebab-case の spec 名を生成する（例: `currency-page-rework`）
3. `mcp__linear__list_issue_labels` で `Phase` ラベルの存在を確認する。なければ `mcp__linear__create_issue_label` で作成（name: `Phase`, color: `#5e6ad2`）
4. `mcp__linear__create_project` でプロジェクトを作成:
   - `name`: spec 名
   - `team`: `Sapphire`
   - `description`: 要件要約テキスト
5. 4つの Phase Issue を `mcp__linear__create_issue` で **順番に** 作成する（前の issue の ID が次の `blockedBy` に必要なため）:

   a. Requirements issue:
      - `title`: `[Requirements] {spec-name}`
      - `team`: `Sapphire`
      - `labels`: `["Phase", "Feature"]`
      - `project`: 作成したプロジェクト名

   b. Design issue:
      - `title`: `[Design] {spec-name}`
      - `team`: `Sapphire`
      - `labels`: `["Phase", "Feature"]`
      - `project`: 作成したプロジェクト名
      - `blockedBy`: [Requirements issue の identifier]

   c. Tasks issue:
      - `title`: `[Tasks] {spec-name}`
      - `team`: `Sapphire`
      - `labels`: `["Phase", "Feature"]`
      - `project`: 作成したプロジェクト名
      - `blockedBy`: [Design issue の identifier]

   d. Implementation issue:
      - `title`: `[Implementation] {spec-name}`
      - `team`: `Sapphire`
      - `labels`: `["Phase", "Feature"]`
      - `project`: 作成したプロジェクト名
      - `blockedBy`: [Tasks issue の identifier]

6. Write ツールで `.claude/workflows/{spec-name}.json` を保存する:
   ```json
   {
     "version": "2.0",
     "workflowType": "spec",
     "specName": "{spec-name}",
     "summary": "{要件要約}",
     "teamId": "{teamId}",
     "projectId": "{projectId}",
     "projectUrl": "{projectUrl}",
     "clarificationIssueId": null,
     "phases": {
       "requirements": { "issueId": "...", "issueIdentifier": "...", "issueUrl": "..." },
       "design":       { "issueId": "...", "issueIdentifier": "...", "issueUrl": "..." },
       "tasks":        { "issueId": "...", "issueIdentifier": "...", "issueUrl": "..." },
       "implementation": { "issueId": "...", "issueIdentifier": "...", "issueUrl": "..." }
     },
     "issueId": null,
     "issueIdentifier": null,
     "issueUrl": null,
     "prReviewIssue": null,
     "taskIssues": [],
     "waitingFor": null,
     "createdAt": "{ISO 8601}"
   }
   ```
7. → Step 1 へ進む

---

### Step 1: Requirements フェーズ

1. セッション開始コメントを Requirements issue に投稿する（セッション開始コメント参照）
2. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Requirements ドキュメントを作成中..."3. `mcp__linear__update_issue` で Requirements issue を `state: "In Progress"` に更新
4. Read ツールで `.claude/templates/requirements-template.md` を読み込む
5. **steering ドキュメント（product.md, tech.md, structure.md）の内容を踏まえ**、コードベースを分析して Requirements ドキュメントを作成する
6. `mcp__linear__update_issue` で Requirements issue の `description` にドキュメントを直接書き込む
7. `mcp__linear__update_issue` で Requirements issue を `state: "In Review"`, `assignee: "me"` に更新（= ユーザーにレビューを依頼）
8. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Requirements 完了。レビュー待ち。"9. workflow JSON の `waitingFor` を `"requirements"` に更新して保存
10. **「Requirements のレビューを依頼しました。承認後に Webhook 経由で自動再開します。」と表示してワークフローを停止する。**

### Step 2: Design フェーズ

1. セッション開始コメントを Design issue に投稿する
2. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Design ドキュメントを作成中..."3. `mcp__linear__update_issue` で Design issue を `state: "In Progress"` に更新
4. Read ツールで `.claude/templates/design-template.md` を読み込む
5. Requirements issue の `description` を `mcp__linear__get_issue` で読み取る
6. **steering ドキュメントの内容を踏まえ**、コードベースを分析して Design ドキュメントを作成する
7. `mcp__linear__update_issue` で Design issue の `description` にドキュメントを直接書き込む
8. `mcp__linear__update_issue` で Design issue を `state: "In Review"`, `assignee: "me"` に更新
9. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Design 完了。レビュー待ち。"10. workflow JSON の `waitingFor` を `"design"` に更新して保存
11. **「Design のレビューを依頼しました。承認後に Webhook 経由で自動再開します。」と表示してワークフローを停止する。**

### Step 3: Tasks フェーズ

1. セッション開始コメントを Tasks issue に投稿する
2. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Tasks を作成中..."3. `mcp__linear__update_issue` で Tasks issue を `state: "In Progress"` に更新
3. Read ツールで `.claude/templates/tasks-template.md` を読み込む
4. Requirements issue と Design issue の `description` を `mcp__linear__get_issue` で読み取る
5. **steering ドキュメントの内容を踏まえ**、タスクドキュメントを作成する（各タスクに `_Prompt` フィールドを含める）
6. `mcp__linear__update_issue` で Tasks issue の `description` にドキュメントを直接書き込む
7. Tasks ドキュメントの各タスクを `mcp__linear__create_issue` で Implementation issue の sub-issue として作成する:
   - `title`: `{タスク番号}. {タスクタイトル}`
   - `description`: タスクの全詳細（File, Purpose, Leverage, Requirements, Prompt）
   - `team`: `Sapphire`
   - `parentId`: Implementation issue の issueId
   - `labels`: `["Feature"]`
   - `project`: プロジェクト名
9. `mcp__linear__update_issue` で Tasks issue を `state: "In Review"`, `assignee: "me"` に更新
10. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Tasks 完了。レビュー待ち。"11. workflow JSON を更新（`taskIssues` + `waitingFor: "tasks"`）して保存
12. **「Tasks のレビューを依頼しました。承認後に Webhook 経由で自動再開します。」と表示してワークフローを停止する。**

### Step 4: Implementation フェーズ

1. セッション開始コメントを Implementation issue に投稿する
2. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Implementation 開始"3. `mcp__linear__update_issue` で Implementation issue を `state: "In Progress"` に更新
3. **git worktree を作成する:**
   ```
   git worktree add .worktrees/{spec-name} -b spec/{spec-name} dev
   ```
4. Tasks issue の `description` を `mcp__linear__get_issue` で読み取り、全タスクを把握する
5. 各タスクを順番に実装する（**作業ディレクトリは `.worktrees/{spec-name}/`**）:
   a. workflow JSON から対応する sub-issue ID を取得し、`mcp__linear__update_issue` で `state: "In Progress"` に更新
   b. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Task {n}/{total}: {タスク名}"   c. 既に Done の sub-issue はスキップする
   c. `_Prompt` フィールドの指示に従って実装する
   d. 実装詳細を `mcp__linear__create_comment` で対応する sub-issue にコメントとして記録する:
      ```markdown
      ## Implementation Log
      **Summary:** {実装内容}
      **Files Modified:** {変更ファイル一覧}
      **Files Created:** {作成ファイル一覧}
      **Lines:** +{追加行} -{削除行}
      ```
   e. `mcp__linear__update_issue` で sub-issue を `state: "Done"` に更新
   f. **DB スキーマ変更がある場合**: `src/server/db/schema/` のファイルを変更した場合は、worktree 内で `bun run db:generate` を実行してマイグレーションファイルを生成する。生成された `drizzle/` 配下のファイルもコミットに含める
   g. 変更ファイルを `git add` して commit を作成する:
      ```
      git commit -m "$(cat <<'EOF'
      feat({scope}): {タスク内容の要約}

      Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
      EOF
      )"
      ```
6. 全タスク完了後:
   a. worktree ディレクトリから push: `git -C .worktrees/{spec-name} push -u origin spec/{spec-name}`
   b. `gh pr create --base dev --head spec/{spec-name}` で PR を作成する:
      - タイトル: spec の内容を簡潔に表すもの
      - 本文: Requirements の要約、実装タスク一覧、テスト計画を含める
   c. PR URL を `mcp__linear__update_issue` で Implementation issue に `links: [{url: PR_URL, title: "Pull Request"}]` として追加する
   d. PR URL を `mcp__linear__update_project` でプロジェクトの description に追記する
   e. `mcp__linear__create_issue` で **PR Review issue** を作成する:
      - `title`: `[PR Review] {spec-name}`
      - `team`: `Sapphire`
      - `labels`: `["Phase", "Feature"]`
      - `project`: プロジェクト名
      - `description`: PR URL と変更概要を含む Markdown
      - `state`: `In Review`
      - `assignee`: `"me"`
   f. workflow JSON を更新して保存:
      - `prReviewIssue`: `{ issueId, issueIdentifier, issueUrl }` — 作成した PR Review issue の情報
      - `waitingFor`: `"pr-review"`
   g. `mcp__linear__update_issue` で Implementation issue を `state: "Done"` に更新
   h. `mcp__linear__update_project` でプロジェクトの summary を更新:`"PR 作成完了: {PR_URL}。レビュー待ち。"   i. **worktree は残す**（PR レビューで追加修正の可能性あり）
   j. **「PR を作成しました: {PR_URL}。レビュー後に PR Review issue を Done にしてください。」と表示してワークフローを停止する。**

### Step 5: 完了処理（PR Review issue が Done になった時に Webhook 経由で実行）

1. `mcp__linear__update_issue` で Implementation issue を `state: "Done"` に更新（既に Done の場合はスキップ）
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
4. 各 Phase Issue の最新ステータスを `mcp__linear__get_issue` で取得する。`prReviewIssue` がある場合はその issue も取得する
5. 現在のフェーズを判定する:
   - いずれかの Phase Issue が **Rejected** → **修正フロー**へ（Rejected の issue を対象に実行）
   - 全フェーズ Done かつ（`prReviewIssue` が Done または存在しない） → 「全フェーズ完了済みです」と表示して終了
   - `prReviewIssue` が Done かつ `waitingFor` が `"pr-review"` → Step 5 へ
   - `prReviewIssue` が存在し未完了 → 「PR Review 待ちです」と表示して終了
   - Implementation が Done かつ `taskIssues` があり全 sub-issue が Done かつ `prReviewIssue` なし → Step 4.6 から再開（PR 作成 + PR Review issue 作成）
   - Implementation が In Progress かつ未完了 sub-issue あり → Step 4 の実装途中から再開（Done 済みタスクはスキップ）
   - Tasks が Done → Step 4 へ
   - Tasks が Done 以外で Design が Done → Step 3 へ
   - Design が Done 以外で Requirements が Done → Step 2 へ
   - Requirements が Done 以外 → Step 1 から開始
6. 判定結果を表示する:
   ```
   再開: {spec-name}
   Project: {projectUrl}
   Phase         | Status
   ------------- | -------
   Requirements  | Done
   Design        | Done
   Tasks         | Todo (レビュー待ち)
   Implementation| Backlog
   → Tasks フェーズの承認が検出されました。Step 4 を開始します。
   ```
7. 該当する Step から実行を開始する

---

## 強制再開モード

Project の "AI Queue" ステータス再割り当て経由で呼び出される。
`waitingFor` の値を **無視** し、Linear Issue の実際のステータスのみを基に現在地を判定して強制的に進行する。

1. workflow JSON を Read ツールで読み込む
2. `mcp__linear__update_project` でプロジェクトの status を更新: `id: projectId`, `state: "In Progress"`
3. **steering ドキュメントを Read ツールで読み込む**（全モード共通・必須）
4. 各 Phase Issue の最新ステータスを `mcp__linear__get_issue` で **すべて** 取得する
5. Implementation に `taskIssues` がある場合は、全 sub-issue のステータスも `mcp__linear__get_issue` で取得する
6. Issue の実際のステータスのみで現在地を判定する（`waitingFor` は参照しない）:
   - 全フェーズ Done かつ（`prReviewIssue` が Done または存在しない） → 「全フェーズ完了済みです」と表示して終了
   - `prReviewIssue` が Done → Step 5 へ（完了処理）
   - `prReviewIssue` が存在し未完了 → 「PR Review 待ちです」と表示して終了
   - Implementation が Done かつ全 sub-issue が Done かつ `prReviewIssue` なし → Step 4.6 から再開（PR 作成 + PR Review issue 作成）
   - Implementation が In Progress かつ未完了 sub-issue あり → Step 4 の実装途中から再開（Done 済みタスクはスキップ）
   - Tasks が Done かつ Implementation が未着手 → Step 4 へ
   - Design が Done かつ Tasks が未着手 → Step 3 へ
   - Requirements が Done かつ Design が未着手 → Step 2 へ
   - Requirements が未着手または In Progress → Step 1 へ
7. workflow JSON の `waitingFor` を判定結果に応じて修正・保存する
8. 判定結果を表示する:
   ```
   強制再開: {spec-name}
   Project: {projectUrl}
   Phase         | Status
   ------------- | -------
   Requirements  | Done
   Design        | Done
   Tasks         | Done
   Implementation| In Progress (3/5 tasks done)
   → Step 4 を強制再開します。
   ```
9. 該当する Step から実行を開始する

---

## 修正フロー（Rejected 検出時 — Webhook サーバーから呼び出される）

Rejected はリジェクトを意味する。コメントに記載されたフィードバックを反映して再提出する:

1. セッション開始コメントを対象 issue に投稿する
2. `mcp__linear__update_project` でプロジェクトの summary を更新:`"{phase} を修正中..."3. `mcp__linear__list_comments` で対象 issue のコメント一覧を取得する
4. 最新のコメントからフィードバック内容を読み取る
5. フィードバック内容を表示する:
   ```
   {phase} フェーズがリジェクトされました。
   フィードバック: {コメント内容}
   修正を開始します...
   ```
6. **steering ドキュメントを踏まえ**、フィードバックに基づいて対象 issue の `description` を修正する（`mcp__linear__update_issue`）
7. 修正内容の要約を `mcp__linear__create_comment` で対象 issue にコメントとして追加する
8. `mcp__linear__update_issue` で対象 issue を `state: "In Review"`, `assignee: "me"` に更新（= 再度ユーザーにレビューを依頼）
9. `mcp__linear__update_project` でプロジェクトの summary を更新:`"{phase} 修正完了。レビュー待ち。"10. workflow JSON の `waitingFor` はそのまま維持して保存
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
- 各フェーズのドキュメント作成後は **ワークフローを停止する**（ポーリングしない）。承認検出は Webhook サーバーが行う
- 承認判定は Linear issue の status で行う（`Done` = 承認、`Rejected` = リジェクト → 修正フロー）
- レビュー依頼時は必ず `assignee: "me"` でユーザーにアサインする
- Implementation フェーズでは **git worktree**（`.worktrees/{spec-name}/`）を使用する
- PR 作成後は **PR Review issue** を別途作成し、Done を待って完了処理を行う
- worktree の削除は **PR Review issue が Done になった時**（Step 5）に行う
- git commit は HEREDOC でメッセージを渡し、末尾に `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>` を含める
- 再開モードでは Done 済みのタスクをスキップする
- Linear MCP ツール名はすべて `mcp__linear__` プレフィックス付きで呼び出す
