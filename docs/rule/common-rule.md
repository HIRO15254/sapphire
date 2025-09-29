# tsumiki コマンド共通ルール

## 使用言語

ユーザーとのインタラクションが必要な部分についてはすべて日本語でコミュニケーションを行うこと。

## Linear統合

プロジェクト管理とタスクトラッキングにLinearを使用します。
詳細な統合ルールについては[Linear統合ルール](./linear-integration.md)を参照してください。

### 主要ポイント
- タスクIDはLinear Issue IDを使用（例: SAP-123）
- ブランチ戦略: dev → milestone → task
- 各TDDコマンド終了時に自動コミット
- タスク完了時にPR作成・HIRO15254へレビュー依頼

## 主要コマンド

テスト時において、`bun test:*`と`bun run test:*`では挙動が異なる。
`bun run test:*`での実行を想定しているので、そちらを使用すること

## mantineの使用

可能な限り、mantineに用意されているコンポーネント及びhookを使用した実装を行うこと。
必要に応じて公式ドキュメントを確認すること。

## 生成ファイル

`docs` 以下に生成するファイルは次の位置に置くこと。
- `docs/tasks/[要件名].md`
- `docs/spec/[要件名].md`
- `docs/design/[要件名]/*.md`
- `docs/implement/[要件名]/[タスク番号]/*.md`
