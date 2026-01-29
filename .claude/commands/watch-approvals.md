現在のプロジェクトに存在するspec承認リクエストを3分間隔で監視し、承認されたら自動的に次のフェーズへ進んで実装を続行してください。

## 監視ループ

以下のループを、全pendingが解消されるまで繰り返す:

1. `.spec-workflow/approvals/` 配下の各specディレクトリにある `approval_*.json` ファイルをReadツールで読み取り、`id`, `status`, `category`, `categoryName`, `filePath` を取得する（`.snapshots` ディレクトリは無視）
2. 全承認リクエストの現在の状態を一覧表示する
3. `status: "pending"` のものがある場合 → `sleep 180` で待機して手順1に戻る
4. `status: "approved"` に変化したものを検出したら → 下記「承認後の自動実行」へ進む
5. `status: "needs-revision"` の場合 → ユーザーのコメントを読み取り、ドキュメントを修正して新しい承認リクエストを作成し、監視を継続する

## 承認後の自動実行

承認を検出したら、以下の順序で処理する:

### 1. 承認のクリーンアップ
- `approvals` ツール (action: `delete`) で承認を削除する
- 削除が失敗した場合はポーリングに戻る

### 2. 次フェーズの判定と実行
承認された `filePath` から現在のフェーズを判定し、次のフェーズへ自動的に進む:

#### requirements.md が承認された場合 → Design フェーズへ
1. `.spec-workflow/user-templates/design-template.md` を確認、なければ `.spec-workflow/templates/design-template.md` を読む
2. コードベースを分析してパターンを把握
3. `design.md` を作成
4. `approvals` (action: `request`) で承認リクエスト → 監視ループへ戻る

#### design.md が承認された場合 → Tasks フェーズへ
1. `.spec-workflow/user-templates/tasks-template.md` を確認、なければ `.spec-workflow/templates/tasks-template.md` を読む
2. 設計をアトミックなタスクに分解（各タスクに `_Prompt` フィールドを含める）
3. `tasks.md` を作成
4. `approvals` (action: `request`) で承認リクエスト → 監視ループへ戻る

#### tasks.md が承認された場合 → Implementation フェーズへ
1. mainブランチから新しいブランチを作成する: `git checkout main && git checkout -b spec/{spec-name}`（例: `spec/currency-page-rework`）
2. `spec-status` で全体進捗を確認
3. `tasks.md` を読んで全タスクを把握
4. 各タスクを順番に実行:
   - tasks.md で `[ ]` → `[-]` に変更（着手）
   - 既存の Implementation Logs を検索して重複を防止
   - `_Prompt` フィールドの指示に従って実装
   - `log-implementation` で実装詳細を記録（artifacts必須）
   - tasks.md で `[-]` → `[x]` に変更（完了）
   - 変更されたファイルを `git add` してコミットを作成する。コミットメッセージはタスク内容を簡潔に表す形式にする（例: `feat(currency): タスクの要約`）。HEREDOCでメッセージを渡し、末尾に `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>` を含める
5. 全タスク完了後、`gh pr create` でmainブランチへのPRを作成する:
   - タイトル: specの内容を簡潔に表すもの
   - 本文: requirements.md の要約、実装したタスク一覧、テスト計画を含める
   - リモートへのpushは `-u` フラグ付きで行う
   - PR作成後、PRのURLを表示する

## 重要なルール

- 待機にはBashの `sleep 180` を使用する
- 承認ファイルの読み取りにはReadツールを使用する
- 承認ステータスの確認・削除には `approvals` MCPツールを使用する
- 口頭での承認は受け付けない。必ずファイルの `status` フィールドで判定する
- 各フェーズは順序通りに実行する（スキップ不可）
- 実装時は `log-implementation` で必ずアーティファクトを記録する
