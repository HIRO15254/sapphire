# Development（開発ガイド）

プロジェクトの開発を進めるための実践的なガイドドキュメント集です。

## 📁 ファイル一覧

| ファイル | 説明 | 対象読者 |
|---------|------|---------|
| [playernote-development-guide.md](playernote-development-guide.md) | PlayerNote機能開発の詳細ガイド | 開発者 |

## 🚀 開発の進め方

### 基本的な開発フロー

1. **要件確認**
   - `../specifications/`で仕様を確認
   - 不明点があれば仕様書を更新

2. **開発準備**
   - `../getting-started/`で環境確認
   - `../testing/`でTDD手法確認

3. **実装**
   - このディレクトリの開発ガイドに従って実装
   - TDDサイクルを実践

4. **品質確認**
   - `../testing/tdd-commands-reference.md`でテスト実行
   - コードレビュー

## 🔄 TDDとの連携

開発ガイドは以下のテストドキュメントと密接に連携しています：

- **[../testing/test-guide.md](../testing/test-guide.md)** - テスト作成の基礎
- **[../testing/tdd-examples.md](../testing/tdd-examples.md)** - 実装例
- **[../testing/tdd-commands-reference.md](../testing/tdd-commands-reference.md)** - コマンド

### 推奨する学習順序

```
1. ../getting-started/ (環境構築)
2. ../testing/test-guide.md (テスト基礎)
3. development/ (このディレクトリ)
4. ../testing/tdd-examples.md (実践例)
```

## 💡 開発のコツ

### 効率的な開発のために
- 小さな機能単位で開発
- テストファーストを心がける
- 定期的なリファクタリング
- ドキュメントの随時更新

### 困った時の対処法
1. 該当する開発ガイドを再確認
2. `../testing/`でテスト関連問題を解決
3. `../specifications/`で仕様を再確認
4. チームメンバーに相談

## 📝 ドキュメント更新

新機能や変更があった場合：
1. 開発ガイドの更新
2. 関連する仕様書の更新
3. テストドキュメントの更新
4. READMEの更新