# Testing（テスト関連ドキュメント）

Sapphireプロジェクトのテスト関連ドキュメント集です。TDD（テスト駆動開発）の実践に必要な情報がすべて含まれています。

## 📚 ドキュメント構成

### 🎯 目的別ガイド

| ドキュメント | 目的 | 対象レベル | 読む順序 |
|-------------|------|-----------|---------|
| [test-guide.md](test-guide.md) | テスト作成の基礎 | 初級〜中級 | 1番目 |
| [tdd-examples.md](tdd-examples.md) | 実装例とベストプラクティス | 中級〜上級 | 2番目 |
| [tdd-commands-reference.md](tdd-commands-reference.md) | コマンドリファレンス | 全レベル | 随時参照 |

## 🚀 学習パス

### 🔰 初心者向け（TDD未経験）
```
1. test-guide.md (基礎概念とセットアップ)
   ↓
2. tdd-examples.md (実装例の読解)
   ↓
3. tdd-commands-reference.md (コマンド習得)
```

### 🏃 中級者向け（TDD経験あり）
```
1. tdd-examples.md (プロジェクト固有の実装パターン)
   ↓
2. tdd-commands-reference.md (効率的なコマンド活用)
   ↓
3. ../architecture/testing-architecture.md (アーキテクチャ理解)
```

### 🎓 上級者向け（設計・アーキテクチャ）
```
1. ../architecture/testing-architecture.md (設計思想)
   ↓
2. tdd-examples.md (高度なパターン)
   ↓
3. test-guide.md (レビュー・指導用)
```

## 📖 ドキュメント詳細

### 1. [test-guide.md](test-guide.md) - テスト作成ガイド
**内容**:
- テスト戦略の概要
- フロントエンド・バックエンドテストの書き方
- E2Eテストの実装方法
- トラブルシューティング

**こんな時に読む**:
- 初めてプロジェクトのテストを書く時
- テストの書き方で迷った時
- エラーが発生してトラブルシューティングが必要な時

### 2. [tdd-examples.md](tdd-examples.md) - TDD実装例
**内容**:
- Red-Green-Refactorサイクルの具体例
- Rustデータベーステストの実装パターン
- フロントエンド統合テストの例
- モックとテストデータの活用法

**こんな時に読む**:
- TDD開発を実践する時
- 具体的な実装パターンを知りたい時
- コードレビューの参考にしたい時

### 3. [tdd-commands-reference.md](tdd-commands-reference.md) - コマンドリファレンス
**内容**:
- 全テストコマンドの使用方法
- 開発ワークフロー別のコマンド例
- デバッグとトラブルシューティング手順
- CI/CD用コマンド

**こんな時に読む**:
- 日常のテスト作業中（常時参照）
- 新しいコマンドを覚えたい時
- CI/CD設定を変更する時

## 🛠️ 実践的な使い方

### 💼 日常開発での活用

#### 新機能開発時
1. `tdd-examples.md`でTDDサイクルを確認
2. `tdd-commands-reference.md`でwatchモード開始
3. Red → Green → Refactorを実践
4. `test-guide.md`で品質確認

#### バグ修正時
1. `tdd-examples.md`でテストファースト修正の例を確認
2. `tdd-commands-reference.md`でデバッグコマンド実行
3. `test-guide.md`でリグレッションテスト

#### コードレビュー時
1. `tdd-examples.md`のベストプラクティスと比較
2. `test-guide.md`のトラブルシューティングで問題確認
3. `../architecture/testing-architecture.md`で設計適合性確認

### 🎯 チーム活動での活用

#### 新メンバーのオンボーディング
```bash
# 学習順序
1. test-guide.md (基礎理解)
2. tdd-commands-reference.md (実行環境確認)
3. tdd-examples.md (実践練習)
```

#### チーム開発標準化
- `tdd-examples.md`をベースにコーディング規約作成
- `tdd-commands-reference.md`でCI/CD設定統一
- `test-guide.md`でレビュー基準策定

## 🔧 テスト環境

### 推奨セットアップ
```bash
# 基本テスト環境の確認
bun run test:all

# UI付きテスト環境
bun run test:ui

# E2Eテスト環境
bun run test:e2e:ui
```

### トラブルシューティング
問題が発生した場合の対処順序：

1. `tdd-commands-reference.md`のデバッグセクション確認
2. `test-guide.md`のトラブルシューティング参照
3. `../architecture/testing-architecture.md`でシステム理解

## 📈 継続的改善

### ドキュメント更新タイミング
- 新しいテストパターンを発見した時
- トラブルシューティング手順が追加された時
- コマンドが追加・変更された時
- チーム内でベストプラクティスが更新された時

### フィードバック
- 不明な点や改善提案がある場合は積極的に共有
- 実際の使用感をドキュメントに反映
- 新しい知見を随時追加

## 🎉 成果測定

### テスト習熟度チェック
- [ ] TDDサイクルを理解し実践できる
- [ ] フロントエンド・バックエンドテストを書ける
- [ ] E2Eテストを設計・実装できる
- [ ] デバッグ・トラブルシューティングができる
- [ ] CI/CDパイプラインを理解している
- [ ] チームメンバーにテスト手法を教えられる

---

**💡 Tip**: これらのドキュメントは実践しながら読むことで、より深く理解できます。まずは `test-guide.md` から始めて、実際にテストを書きながら他のドキュメントも参照してください。