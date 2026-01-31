$ARGUMENTS を Linear プロジェクト ID として受け取り、ワークフローの初期化を実行してください。
Webhook サーバーが Linear Project の "Planned" 状態検知時に spawn するエントリポイントです。

---

## 前提条件

- Webhook サーバーが `.claude/workflows/{spec-name}.json` を既に作成済み（`waitingFor: "init"`）
- `$ARGUMENTS` はプロジェクト ID（UUID）

---

## Step 0: プロジェクト情報取得

1. `mcp__linear__get_project` で `$ARGUMENTS` のプロジェクトを取得する
2. プロジェクトの `labels` を確認する:
   - `full-spec-workflow` → `workflowType = "spec"`
   - `fix-spec-workflow` → `workflowType = "fix"`
   - **どちらもない → ワークフロー中止**（workflow JSON を削除して終了）
3. `.claude/workflows/` 配下の JSON ファイルを Glob で検索し、`projectId` が一致する workflow JSON を読み込む
4. workflow JSON の `waitingFor` を確認する:
   - `"init"` → Step 0.3 へ
   - `"clarification"` → Step 1b へ（Clarification 回答処理）
   - その他 → 「既にワークフロー進行中です」と表示して終了

---

## Step 0.3: Spec 名・プロジェクト名のリネーム

Webhook サーバーが仮生成した spec 名を、プロジェクトの内容に基づいて適切な英語 kebab-case 名にリネームする:

1. プロジェクトの `name` と `description` から、内容を正確に表す **英語 kebab-case** の spec 名を生成する
   - 例: "通貨ページリワーク" → `currency-page-rework`
   - 例: "セッション一覧のバグ修正" → `fix-session-list-bug`
   - 例: "Add dark mode support" → `dark-mode-support`
2. 現在の workflow JSON の `specName` と異なる場合:
   a. 旧 JSON ファイルを Read で読み込み、新しい spec 名で Write する: `.claude/workflows/{新名}.json`
   b. 旧 JSON ファイルを削除する（Bash: `rm .claude/workflows/{旧名}.json`）
   c. workflow JSON の `specName` を新しい名前に更新する
3. `mcp__linear__update_project` でプロジェクト名を新しい spec 名に更新する
4. → Step 1 へ

---

## Step 0.5: Steering ドキュメント読み込み（必須）

以下の steering ドキュメントを **必ず Read ツールで読み込む**。これらはプロジェクトの方針・技術スタック・構造を定義しており、全フェーズで参照する:

- `.claude/steering/product.md` — プロダクトの目的、ターゲットユーザー、主要機能、原則
- `.claude/steering/tech.md` — 技術スタック、アーキテクチャ、開発ツール、制約事項
- `.claude/steering/structure.md` — ディレクトリ構成、命名規則、コード構造パターン

---

## 進捗報告（Project Summary）

各チェックポイントで `mcp__linear__update_project` を呼び出し、プロジェクトの `summary` を更新して現在の進捗を Linear 上で確認できるようにする。

投稿タイミングは各 Step 内に記載。`id` は workflow JSON の `projectId` を使用する。

---

## Step 1: 要件明確性チェック（Clarification フェーズ）

1. `mcp__linear__update_project` でプロジェクトの summary を更新:`"ワークフロー初期化中..."2. プロジェクトの `description` を要件として読み取る
3. steering ドキュメントの内容を踏まえ、要件が十分明確かを判定する:
   - 何を実装するか具体的に分かるか？
   - 技術的に曖昧な点はないか？
   - 既存システムとの整合性に不明点はないか？

**要件が不明確な場合:**
1. `mcp__linear__create_issue` で Clarification issue を作成する:
   - `title`: `[Clarification] {spec-name}`
   - `team`: `Sapphire`
   - `project`: プロジェクト名
   - `description`: 質問事項リスト（Markdown）
   - `state`: `In Review`
   - `assignee`: `"me"`
2. workflow JSON を更新:
   - `clarificationIssueId`: 作成した issue の ID
   - `waitingFor`: `"clarification"`
3. `mcp__linear__update_project` でプロジェクトの summary を更新:`"確認事項あり。回答待ち。"4. **「確認事項を作成しました。回答後に Issue を Done にしてください。」と表示して停止**

**要件が明確な場合:**
→ Step 2 へ

---

## Step 1b: Clarification 回答処理

1. `mcp__linear__get_issue` で Clarification issue の状態を確認する
2. 状態が `completed` の場合:
   a. `mcp__linear__list_comments` で Clarification issue のコメントを読み取る
   b. コメント内容を要件に統合する
   c. → Step 2 へ
3. 状態が `canceled` の場合:
   a. workflow JSON の `waitingFor` を `null` に更新
   b. 「ワークフローがキャンセルされました」と表示して終了

---

## Step 2: ワークフロー開始

1. workflow JSON を更新:
   - `workflowType`: 判定結果（`"spec"` or `"fix"`）
   - `summary`: プロジェクト description の要約
   - `teamId`: プロジェクトの team ID
2. `mcp__linear__update_project` でプロジェクトの status を更新: `id: projectId`, `state: "In Progress"`
3. セッション開始コメントを投稿する（Step 2.5 参照）

### Spec ワークフロー（`workflowType == "spec"`）:

1. `mcp__linear__list_issue_labels` で `Phase` ラベルの存在を確認。なければ `mcp__linear__create_issue_label` で作成（name: `Phase`, color: `#5e6ad2`）
2. 4つの Phase Issue を `mcp__linear__create_issue` で **順番に** 作成する:

   a. Requirements issue:
      - `title`: `[Requirements] {spec-name}`
      - `team`: `Sapphire`
      - `labels`: `["Phase", "Feature"]`
      - `project`: プロジェクト名

   b. Design issue:
      - `title`: `[Design] {spec-name}`
      - `team`: `Sapphire`
      - `labels`: `["Phase", "Feature"]`
      - `project`: プロジェクト名
      - `blockedBy`: [Requirements issue の identifier]

   c. Tasks issue:
      - `title`: `[Tasks] {spec-name}`
      - `team`: `Sapphire`
      - `labels`: `["Phase", "Feature"]`
      - `project`: プロジェクト名
      - `blockedBy`: [Design issue の identifier]

   d. Implementation issue:
      - `title`: `[Implementation] {spec-name}`
      - `team`: `Sapphire`
      - `labels`: `["Phase", "Feature"]`
      - `project`: プロジェクト名
      - `blockedBy`: [Tasks issue の identifier]

3. workflow JSON を更新して保存:
   - `phases`: 4つの issue 情報
   - `waitingFor`: なし（続けて Requirements を作成する）

4. **Requirements ドキュメント作成:**
   a. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Requirements ドキュメントを作成中..."   b. Read ツールで `.claude/templates/requirements-template.md` を読み込む
   c. steering ドキュメント（product.md, tech.md, structure.md）の内容を踏まえてコードベースを分析する
   d. Requirements issue の `description` にドキュメントを直接書き込む（`mcp__linear__update_issue`）
   e. Requirements issue を `state: "In Review"`, `assignee: "me"` に更新
   f. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Requirements 完了。レビュー待ち。"   g. workflow JSON の `waitingFor` を `"requirements"` に更新して保存
   h. **「Requirements のレビューを依頼しました。承認後に Webhook 経由で自動再開します。」と表示して停止**

### Fix ワークフロー（`workflowType == "fix"`）:

1. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Fix ドキュメントを作成中..."2. `mcp__linear__list_issue_labels` で `Fix` ラベルの存在を確認。なければ `mcp__linear__create_issue_label` で作成（name: `Fix`, color: `#e5484d`）
3. Read ツールで `.claude/templates/requirements-template.md`, `design-template.md`, `tasks-template.md` を読み込む
4. steering ドキュメント（product.md, tech.md, structure.md）の内容を踏まえてコードベースを分析する
5. `mcp__linear__create_issue` で 1つの Fix Issue を作成:
   - `title`: `[Fix] {spec-name}`
   - `team`: `Sapphire`
   - `labels`: `["Fix"]`
   - `project`: プロジェクト名
   - `description`: Requirements / Design / Tasks をまとめた Markdown
   - `state`: `In Review`
   - `assignee`: `"me"`
6. workflow JSON を更新して保存:
   - `issueId`, `issueIdentifier`, `issueUrl`: Fix issue の情報
   - `waitingFor`: `"approval"`
7. `mcp__linear__update_project` でプロジェクトの summary を更新:`"Fix ドキュメント完了。レビュー待ち。"8. **「Fix のレビューを依頼しました。承認後に Webhook 経由で自動再開します。」と表示して停止**

---

## Step 2.5: セッション開始コメント

ワークフロー開始時（Step 2 の冒頭）に、プロジェクトに紐づく最初の Issue（Spec: Requirements / Fix: Fix Issue）にセッション開始コメントを投稿する:

```markdown
Claude Code session started
Phase: initialization
Spec: {spec-name}
Timestamp: {ISO 8601}
```

`mcp__linear__create_comment` を使用する。

---

## 重要なルール

- **steering ドキュメントは必ず参照すること**（Step 0.5）。product.md のプロダクト原則、tech.md の技術制約、structure.md のコード構造パターンに従って要件・設計を行う
- テンプレート参照先: `.claude/templates/`（Read ツールで読み込む）
- workflow JSON の保存先: `.claude/workflows/{spec-name}.json`（Write ツールで書き込む）
- ドキュメントは **Linear issue の description に直接書き込む**（ローカルファイルに .md を作成しない）
- ドキュメント作成後は **ワークフローを停止する**（ポーリングしない）
- 承認検出は Webhook サーバーが行い、次のコマンドを spawn する
- レビュー依頼時は必ず `assignee: "me"` でユーザーにアサインする
- Linear MCP ツール名はすべて `mcp__linear__` プレフィックス付きで呼び出す
- ラベルが見つからない場合（`full-spec-workflow` / `fix-spec-workflow` のどちらもない）は **即座にワークフローを中止し、workflow JSON を削除する**
