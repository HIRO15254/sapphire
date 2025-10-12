# tsumiki コマンド共通ルール

## 使用言語

ユーザーとのインタラクションが必要な部分についてはすべて日本語でコミュニケーションを行うこと。

## GitHub統合

プロジェクト管理とタスクトラッキングにGitHub Issues + Labels + Milestonesを使用します。
詳細な統合ルールについては[GitHub統合ルール](./github-integration.md)を参照してください。

### 主要ポイント
- タスクIDはGitHub Issue番号を使用（例: #123）
- ブランチ戦略: dev → milestone → task
- 各TDDコマンド終了時に自動コミット
- タスク完了時にPR作成・HIRO15254へレビュー依頼
- ステータス管理はLabels（`status: todo`、`status: in-progress`、`status: in-review`、`status: done`）

## 主要コマンド

テスト時において、`bun test:*`と`bun run test:*`では挙動が異なる。
`bun run test:*`での実行を想定しているので、そちらを使用すること

## mantineの使用

可能な限り、mantineに用意されているコンポーネント及びhookを使用した実装を行うこと。
必要に応じて公式ドキュメントを確認すること。

## ドキュメント管理

TsumikiワークフローではGitHub Issues/Comments上で文書管理を行います。
詳細は[GitHub統合ルール](./github-integration.md)を参照してください。

### ローカル `docs/` ディレクトリの用途
- `docs/rule/` - 開発ルール・ガイドライン
- `docs/tech-stack.md` - 技術スタック定義
- `docs/patterns/` - 実装パターン集（今後）
- `docs/architecture/` - プロジェクト詳細ドキュメント（今後）

## セッション管理

TDD開発では、各ステップ完了時にコンテキストを最適化するために `/compact` を実行してください。

詳細は [TDDセッション管理ルール](./tdd/session-management.md) を参照してください。

### 主要ポイント
- Red/Green/Refactorの各フェーズ完了後に `/compact` を実行
- 実行したコマンド履歴を保持
- プロジェクトルール（`docs/rule/` 配下）を保持
- 技術スタック定義を保持
- 次のステップを明確化
