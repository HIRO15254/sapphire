# 💎 Sapphire

Tauriフレームワークを使用したクロスプラットフォームデスクトップアプリケーションです。
React + TypeScript + Rust の組み合わせで、軽量かつ高速なネイティブアプリを実現しています。

## 🚀 特徴

- **軽量**: OSネイティブWebViewを使用し、Electronより高速・省メモリ
- **安全**: Rustの型安全性とTauriのサンドボックス化でセキュリティ強化
- **モダン**: React 19 + TypeScript 5.8 + Vite 7 の最新技術スタック
- **クロスプラットフォーム**: Windows・macOS・Linux対応

## 📋 必要な環境

- **Node.js** 18+ 
- **Rust** 1.70+
- **Bun** (パッケージマネージャー)

## ⚡ クイックスタート

```bash
# 依存関係のインストール
bun install

# 開発サーバー起動
bun dev

# Tauriアプリケーション起動（別ターミナル）
bun tauri dev
```

## 📝 利用可能なコマンド

| コマンド              | 説明            |
|-------------------|---------------|
| `bun dev`         | Vite開発サーバー起動  |
| `bun build`       | プロダクションビルド    |
| `bun preview`     | ビルド結果をプレビュー   |
| `bun tauri dev`   | Tauriアプリ開発モード |
| `bun tauri build` | Tauriアプリをビルド  |

## 📁 プロジェクト構造

```
sapphire/
├── src/                    # React フロントエンド
│   ├── App.tsx            # メインコンポーネント
│   ├── main.tsx           # Reactエントリーポイント
│   └── assets/            # 静的アセット
├── src-tauri/             # Rust バックエンド
│   ├── src/               # Rustソースコード
│   ├── Cargo.toml         # Rust依存関係
│   └── tauri.conf.json    # Tauri設定
├── docs/                  # プロジェクトドキュメント
└── public/                # 公開静的ファイル
```

## 🛠 技術スタック

### フロントエンド
- **React** 19.1.0 - UIライブラリ
- **TypeScript** 5.8.3 - 型安全なJavaScript
- **Vite** 7.0.4 - 高速ビルドツール
- **Mantine** 8.3.0 - UIコンポーネントライブラリ

### バックエンド
- **Rust** - システムプログラミング言語
- **Tauri** 2.x - デスクトップアプリフレームワーク
- **SQLite** + rusqlite 0.32 - ローカルデータベース

## 🎯 完了した機能

### SAP-44: SQLiteデータベースとスキーマ設計
- **実装日**: 2025-09-30
- **概要**: プレイヤーノート機能のための包括的なデータベース設計
- **主な機能**:
  - プレイヤー管理（同一名識別対応）
  - プレイヤー種別・タグシステム
  - 簡易メモ・総合メモ機能
  - 論理削除とカスケード削除
  - パフォーマンス最適化インデックス
- **テスト**: 11テストケース全て通過

## 🧪 テスト実行

```bash
# Rustテスト実行
bun test:rust

# データベーステスト実行
cd src-tauri && cargo test --test database_test

# 全テスト実行
bun test:all
```

## 📚 ドキュメント

- [技術スタック](./docs/tech-stack.md) - 技術スタックとアーキテクチャの詳細
- [開発ルール](./docs/rule/) - 開発フローとガイドライン
- [プレイヤーノート要件](./docs/spec/playernote-requirements.md) - 機能要件定義書
- [実装記録](./docs/implements/playernote/SAP-44/) - SAP-44実装詳細

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
