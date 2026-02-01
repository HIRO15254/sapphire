$ARGUMENTS を Linear プロジェクト ID（新規起動時）または再開指示として受け取り、バージョンアップワークフローを実行してください。
Webhook サーバーが `/version-up` ProjectUpdate を検知した際に spawn されるエントリポイントです。

CHANGELOG の内容を Linear Issue としてレビュー依頼し、承認後に release ブランチ作成・PR 作成を行う2フェーズ構成です。

全データは **Linear issue の description に直接書き込む**（ローカルに .md ファイルを作成しない）。

---

## 前提条件

- `dev` ブランチに `main` へマージされていないコミットが存在すること
- `package.json` と `CHANGELOG.md` が正常な状態であること

---

## モード判定

1. `.claude/workflows/version-up.json` が存在するか確認する
2. `$ARGUMENTS` の内容を判定する:
   - 「強制再開」を含む → **強制再開モード**へ
   - 「再開」「続き」「continue」を含む → **再開モード**へ
   - workflow JSON が存在し `waitingFor` が `"changelog-review"` → **再開モード**へ（Webhook 経由の自動再開）
   - 上記いずれでもない → **新規作成モード**へ（`$ARGUMENTS` をプロジェクト ID として扱う）

---

## 新規作成モード

### Step 1: コミット分析とバージョン決定

1. `git fetch origin` で最新のリモート情報を取得する
2. `git log origin/main..origin/dev --oneline --no-merges` で main と dev の差分コミット一覧を取得する
3. **差分がない場合**: `mcp__linear__update_project` で `$ARGUMENTS` のプロジェクトの description に「dev と main に差分がありません。バージョンアップの必要はありません。」と追記して終了する
4. 全コミットメッセージの詳細を `git log origin/main..origin/dev --format="%s%n%b" --no-merges` で取得する
5. 各コミットのプレフィックスを解析してバージョンレベルを決定する:
   - コミットメッセージの本文に `BREAKING CHANGE:` が含まれる、またはプレフィックスに `!` がある（例: `feat!:`） → **major**
   - `feat:` または `feat(` プレフィックスがある → **minor**（少なくとも）
   - `fix:` または `fix(` プレフィックスのみ → **patch**
   - `refactor:`, `perf:`, `style:` 等のコード変更プレフィックスがある → **minor**
   - `chore:`, `ci:`, `docs:`, `test:` のみの場合 → **patch**
6. 最も高いバージョンレベルを採用する（major > minor > patch）
7. `package.json` の現在の `version` を読み取り、新しいバージョンを算出する:
   - major: `{X+1}.0.0`
   - minor: `{X}.{Y+1}.0`
   - patch: `{X}.{Y}.{Z+1}`

### Step 2: CHANGELOG 生成

1. 差分コミット一覧を以下のカテゴリに分類する:
   - **Added**: `feat:` プレフィックスのコミット → 新機能
   - **Changed**: `refactor:`, `perf:`, `style:`, `chore:` プレフィックスのコミット → 変更
   - **Fixed**: `fix:` プレフィックスのコミット → バグ修正
   - `ci:`, `test:`, `docs:` のみの変更はユーザー向けでないため省略する
2. 既存の `CHANGELOG.md` を Read ツールで読み取り、フォーマットを確認する
3. 新しいバージョンエントリを作成する:
   - 日付は今日の日付（YYYY-MM-DD 形式）
   - **日本語**でエントリを記述する（既存の CHANGELOG に合わせる）
   - コミットメッセージから意味のある日本語の説明文を生成する
   - 関連するコミットはグループ化してサブリストにまとめる
   - scope が同じコミットは1つのグループにまとめる
4. カテゴリに該当するコミットがない場合はそのセクションを省略する

### Step 3: Issue 作成 + 停止

1. `mcp__linear__list_issue_labels` で `Version Up` ラベルの存在を確認する。なければ `mcp__linear__create_issue_label` で作成（name: `Version Up`, color: `#00d084`）
2. `mcp__linear__create_issue` で CHANGELOG レビュー Issue を作成する:
   - `title`: `[Version Up] v{新バージョン}`
   - `team`: `Sapphire`
   - `labels`: `["Version Up"]`
   - `project`: projectId（`$ARGUMENTS` で渡されたプロジェクト ID）
   - `description`: 以下の内容を Markdown で構成する:
     ```
     ## Version Up: v{旧バージョン} → v{新バージョン}

     **Bump Level:** {major/minor/patch}

     ---

     ## CHANGELOG Preview

     {CHANGELOG の新エントリ内容}

     ---

     ## Commits

     {差分コミット一覧（hash + メッセージ）}
     ```
   - `state`: `In Review`
   - `assignee`: `"me"`（ユーザーにレビューを依頼）
3. Write ツールで `.claude/workflows/version-up.json` を保存する:
   ```json
   {
     "version": "2.0",
     "workflowType": "version-up",
     "specName": "version-up",
     "summary": "Version Up v{旧バージョン} → v{新バージョン}",
     "teamId": "{teamId}",
     "projectId": "{projectId}",
     "projectUrl": "",
     "phases": null,
     "issueId": "{issueId}",
     "issueIdentifier": "{identifier}",
     "issueUrl": "{issueUrl}",
     "taskIssues": [],
     "claudeSessionId": "{既存の claudeSessionId を維持}",
     "waitingFor": "changelog-review",
     "createdAt": "{既存の createdAt を維持}",
     "oldVersion": "{旧バージョン}",
     "newVersion": "{新バージョン}",
     "bumpLevel": "{major/minor/patch}",
     "changelogContent": "{CHANGELOG の新エントリ内容}"
   }
   ```
4. `mcp__linear__update_project` でプロジェクトの summary を更新: `"CHANGELOG レビュー待ち: v{新バージョン}"`
5. **「CHANGELOG のレビューを依頼しました。承認後に Webhook 経由で自動再開します。」と表示してワークフローを停止する。**

---

## 再開モード

Issue が Done（承認）または Rejected（リジェクト）になった時に Webhook 経由で呼び出される。

1. `.claude/workflows/version-up.json` を Read ツールで読み込む
2. Issue の最新ステータスを `mcp__linear__get_issue` で取得する
3. 現在の状態を判定する:
   - `waitingFor` が null → 「完了済みです」と表示して終了
   - Issue が Done（completed 系） → **Step 4** へ（release ブランチ作成）
   - Issue が Rejected → **修正フロー**へ
   - それ以外 → 「Issue がまだレビュー中です」と表示して終了
4. 判定結果を表示する:
   ```
   再開: version-up
   Issue: {issueIdentifier} {issueUrl}
   Status: {status}
   → {再開内容の説明}
   ```
5. 該当する Step から実行を開始する

### Step 4: release ブランチ作成とコミット（worktree 使用）

メインの作業ディレクトリに未コミットの変更があっても影響しないよう、git worktree を使用する。

1. workflow JSON から `newVersion`, `changelogContent` を取得する
2. `release/v{新バージョン}` ブランチが既に存在しないか確認する:
   ```
   git branch -a | grep release/v{新バージョン}
   ```
   存在する場合は Linear に報告して終了する
3. 前回の残骸がある場合はクリーンアップする:
   ```
   git worktree remove .worktrees/version-up --force 2>nul
   ```
   （存在しない場合のエラーは無視する）
4. `git fetch origin` で最新のリモート情報を取得する
5. git worktree で release ブランチを作成する:
   ```
   git worktree add .worktrees/version-up -b release/v{新バージョン} origin/dev
   ```
6. worktree 内の `package.json` の `version` フィールドを Edit ツールで新しいバージョンに更新する
   - パス: `.worktrees/version-up/package.json`（絶対パスで指定）
7. worktree 内の `CHANGELOG.md` の先頭（既存エントリの前、ヘッダーの後）に新しいエントリを Edit ツールで挿入する
   - パス: `.worktrees/version-up/CHANGELOG.md`（絶対パスで指定）
8. worktree ディレクトリ内で変更をコミットする:
   ```
   cd .worktrees/version-up && git add package.json CHANGELOG.md && git commit -m "$(cat <<'EOF'
   release: v{新バージョン}

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```
9. リモートにプッシュする:
   ```
   cd .worktrees/version-up && git push -u origin release/v{新バージョン}
   ```

### Step 5: PR 作成

1. `gh pr create --base main --head release/v{新バージョン}` で PR を作成する:
   - タイトル: `release: v{新バージョン}`
   - 本文: CHANGELOG の新エントリ内容を HEREDOC で渡す
2. PR URL を取得する

### Step 6: Linear に結果を報告 + cleanup

1. `mcp__linear__get_project` でプロジェクトを取得する
2. `mcp__linear__update_project` でプロジェクトの description に結果を追記する:

   ```markdown
   ## Version Up Complete

   **Version:** {旧バージョン} → {新バージョン}
   **Bump Level:** {major/minor/patch}
   **Branch:** release/v{新バージョン}
   **PR:** {PR URL}

   ### Changes
   {CHANGELOG の新エントリ内容}
   ```

3. `mcp__linear__update_project` でプロジェクトの summary を更新: `"完了: v{新バージョン} — PR: {PR URL}"`
4. `mcp__linear__update_issue` で Issue を `state: "Done"` に更新する（既に Done の場合はスキップ）
5. worktree を削除する: `git worktree remove .worktrees/version-up`
6. workflow JSON を **削除** する: `.claude/workflows/version-up.json` を Bash で `rm` する
   - 次回の `/version-up` で新規開始できるようにする
7. 「Version Up 完了。PR をマージしてください: {PR URL}」と表示して終了

---

## 強制再開モード

Project の `/version-up` 再発行、または Webhook サーバーからの強制再開で呼び出される。
`waitingFor` の値を **無視** し、Linear Issue の実際のステータスのみを基に現在地を判定して強制的に進行する。

1. `.claude/workflows/version-up.json` を Read ツールで読み込む
2. `issueId` がある場合は `mcp__linear__get_issue` で Issue のステータスを取得する
3. Issue の実際のステータスで現在地を判定する（`waitingFor` は参照しない）:
   - `issueId` が null → Phase 1 からやり直し（Step 1 へ）
   - Issue が Done → Step 4 へ（release ブランチ作成）
   - Issue が Rejected → **修正フロー**へ
   - Issue が In Review → 「CHANGELOG レビュー中です」と表示して終了
   - Issue がそれ以外のステータス → Step 4 へ（承認済みとみなす）
4. workflow JSON の `waitingFor` を判定結果に応じて修正・保存する
5. 判定結果を表示する:
   ```
   強制再開: version-up
   Issue: {issueIdentifier} ({status})
   → Step {N} を強制再開します。
   ```
6. 該当する Step から実行を開始する

---

## 修正フロー（Rejected 検出時 — Webhook サーバーから呼び出される）

1. セッション開始コメントを Issue に投稿する（`mcp__linear__create_comment`）
2. `mcp__linear__list_comments` で Issue のコメント一覧を取得する
3. 最新のコメントからフィードバック内容を読み取る
4. フィードバック内容を表示する:
   ```
   CHANGELOG がリジェクトされました。
   フィードバック: {コメント内容}
   修正を開始します...
   ```
5. フィードバックに基づいて CHANGELOG 内容を修正する
6. `mcp__linear__update_issue` で Issue の `description` を更新する（修正した CHANGELOG で上書き）
7. workflow JSON の `changelogContent` も更新して保存する
8. 修正内容の要約を `mcp__linear__create_comment` で Issue にコメントとして追加する
9. `mcp__linear__update_issue` で Issue を `state: "In Review"`, `assignee: "me"` に更新（再度レビュー依頼）
10. `mcp__linear__update_project` でプロジェクトの summary を更新: `"CHANGELOG 修正完了。レビュー待ち。"`
11. workflow JSON の `waitingFor` は `"changelog-review"` のまま維持して保存
12. **「修正を完了し、再度レビューを依頼しました。」と表示してワークフローを停止する。**

---

## セッション開始コメント

各フェーズ再開時に対象 Issue に `mcp__linear__create_comment` でセッション開始コメントを投稿する:

```markdown
Claude Code session started
Phase: version-up
Spec: version-up
Timestamp: {ISO 8601}
```

---

## エラーハンドリング

各ステップでエラーが発生した場合は、`mcp__linear__update_project` でプロジェクトの description にエラー内容を追記して終了する:

- **dev に main からの差分がない場合**: 「dev と main に差分がありません。バージョンアップの必要はありません。」
- **release ブランチが既に存在する場合**: 「release/v{バージョン} ブランチが既に存在します。既存の release ブランチを削除してから再実行してください。」
- **git worktree 作成失敗**: エラー内容を Linear に報告（前回の残骸がある場合は `git worktree remove --force` でクリーンアップしてリトライ）
- **git push 失敗**: エラー内容を Linear に報告、worktree を削除してからクリーンアップ
- **PR 作成失敗**: エラー内容を Linear に報告
- **いずれのエラーでも**: worktree が残っている場合は `git worktree remove .worktrees/version-up --force` で削除してから終了する

---

## 重要なルール

- steering ドキュメントの読み込みは **不要**（コードベース分析を行わないため）
- CHANGELOG は **日本語** で記述する（既存フォーマットに厳密に従う）
- コミットメッセージは HEREDOC で渡し、末尾に `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>` を含める
- Linear MCP ツール名はすべて `mcp__linear__` プレフィックス付きで呼び出す
- git ブランチ名は `release/v{バージョン}` 形式にする
- PR のベースは `main` ブランチにする
- git worktree を使用し、メインの作業ディレクトリは変更しない（`.worktrees/version-up/`）
- worktree 内のファイルを Edit/Read する際は **絶対パス** を使用する
- 作業完了後は worktree を削除する
- workflow JSON (`.claude/workflows/version-up.json`) は Phase 2 完了時に **削除** する（次回新規開始のため）
- ドキュメント作成後は **ワークフローを停止する**（ポーリングしない）。承認検出は Webhook サーバーが行う
- 承認判定は Linear issue の status で行う（`Done` = 承認、`Rejected` = リジェクト → 修正フロー）
- レビュー依頼時は必ず `assignee: "me"` でユーザーにアサインする
