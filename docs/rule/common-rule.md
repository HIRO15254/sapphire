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

## TDDコマンド自動コミットルール

各TDDフェーズ完了時に必ずコミットを作成すること：

### コミット対象フェーズ
- `tdd-requirements` 完了時: 要件定義書の作成・更新
- `tdd-testcases` 完了時: テストケース設計書の作成・更新
- `tdd-red` 完了時: 失敗テストの実装
- `tdd-green` 完了時: テストを通す最小実装
- `tdd-refactor` 完了時: リファクタリング実施
- `tdd-verify-complete` 完了時: 品質確認・最終検証

### コミットメッセージ規約
Linear統合ルールに従い、以下の形式でコミットメッセージを作成：

```bash
feat(SAP-XXX): 要件定義を完了      # tdd-requirements
test(SAP-XXX): テストケースを作成   # tdd-testcases
test(SAP-XXX): 失敗するテストを実装 # tdd-red
feat(SAP-XXX): テストを通る最小実装 # tdd-green
refactor(SAP-XXX): コード品質改善  # tdd-refactor
chore(SAP-XXX): 品質確認完了      # tdd-verify-complete
```

## 主要コマンド

テスト時において、`bun test:*`と`bun run test:*`では挙動が異なる。
`bun run test:*`での実行を想定しているので、そちらを使用すること

## mantineの使用

可能な限り、mantineに用意されているコンポーネント及びhookを使用した実装を行うこと。
必要に応じて公式ドキュメントを確認すること。

## ドキュメント管理

LinearワークフローではLinear上で文書管理を行います。
詳細は[Linear統合ルール](./linear-integration.md)を参照してください。

### ローカル `docs/` ディレクトリの用途
- `docs/rule/` - 開発ルール・ガイドライン
- `docs/tech-stack.md` - 技術スタック定義
- `docs/patterns/` - 実装パターン集（今後）
- `docs/architecture/` - プロジェクト詳細ドキュメント（今後）
