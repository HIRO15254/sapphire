$ARGUMENTS を Linear プロジェクト ID として受け取り、バージョンアップワークフローを実行してください。
Webhook サーバーが `/version-up` ProjectUpdate を検知した際に spawn されるエントリポイントです。

---

## 前提条件

- `dev` ブランチに `main` へマージされていないコミットが存在すること
- `package.json` と `CHANGELOG.md` が正常な状態であること

---

## Step 1: コミット分析とバージョン決定

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

---

## Step 2: CHANGELOG 生成

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

---

## Step 3: release ブランチ作成とコミット（worktree 使用）

メインの作業ディレクトリに未コミットの変更があっても影響しないよう、git worktree を使用する。

1. `release/v{新バージョン}` ブランチが既に存在しないか確認する:
   ```
   git branch -a | grep release/v{新バージョン}
   ```
   存在する場合は Linear に報告して終了する
2. 前回の残骸がある場合はクリーンアップする:
   ```
   git worktree remove .worktrees/version-up --force 2>nul
   ```
   （存在しない場合のエラーは無視する）
3. git worktree で release ブランチを作成する:
   ```
   git worktree add .worktrees/version-up -b release/v{新バージョン} origin/dev
   ```
4. worktree 内の `package.json` の `version` フィールドを Edit ツールで新しいバージョンに更新する
   - パス: `.worktrees/version-up/package.json`（絶対パスで指定）
5. worktree 内の `CHANGELOG.md` の先頭（既存エントリの前、ヘッダーの後）に新しいエントリを Edit ツールで挿入する
   - パス: `.worktrees/version-up/CHANGELOG.md`（絶対パスで指定）
6. worktree ディレクトリ内で変更をコミットする:
   ```
   cd .worktrees/version-up && git add package.json CHANGELOG.md && git commit -m "$(cat <<'EOF'
   release: v{新バージョン}

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```
7. リモートにプッシュする:
   ```
   cd .worktrees/version-up && git push -u origin release/v{新バージョン}
   ```

---

## Step 4: PR 作成

1. `gh pr create --base main --head release/v{新バージョン}` で PR を作成する:
   - タイトル: `release: v{新バージョン}`
   - 本文: CHANGELOG の新エントリ内容を HEREDOC で渡す
2. PR URL を取得する

---

## Step 5: Linear に結果を報告

1. `mcp__linear__get_project` で `$ARGUMENTS` のプロジェクトを取得する
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

3. worktree を削除する: `git worktree remove .worktrees/version-up`

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
- workflow JSON は **作成しない**（一回完結のワークフローのため）
- CHANGELOG は **日本語** で記述する（既存フォーマットに厳密に従う）
- コミットメッセージは HEREDOC で渡し、末尾に `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>` を含める
- Linear MCP ツール名はすべて `mcp__linear__` プレフィックス付きで呼び出す
- git ブランチ名は `release/v{バージョン}` 形式にする
- PR のベースは `main` ブランチにする
- git worktree を使用し、メインの作業ディレクトリは変更しない（`.worktrees/version-up/`）
- worktree 内のファイルを Edit/Read する際は **絶対パス** を使用する
- 作業完了後は worktree を削除する
