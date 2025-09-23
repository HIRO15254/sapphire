# `tdd-verify-complete` ルール

## 実装フォルダの整理

すべての実装が終了している場合、`docs/implements/[要件名]/[タスク番号]/`内を以下の通り整理すること。

```
docs/implements/[要件名]/[タスク番号]/
├ memo.md
├ requrements.md
└ testcases.md
```

各ファイルには以下のような内容を含めること。
- `memo.md` 実装記録と重要情報のサマリー
- `requrements.md` 要件定義・機能仕様のログ
- `testcases.md` 実装テストケース

## lint及びformatの確認

以下のコマンドをすべて実行し、すべてエラーが出ないことを確認すること。
- `bunx tsc --noemit`
- `bun run format`
- `bun run lint:fix`
