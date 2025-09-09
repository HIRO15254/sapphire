# 💎 Sapphire

Tauriフレームワークを使用したクロスプラットフォームデスクトップアプリケーションです。  
React + TypeScript + Rust の組み合わせで、軽量かつ高速なネイティブアプリを構築できます。

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
ban install

# 開発サーバー起動
ban dev

# Tauriアプリケーション起動（別ターミナル）
ban tauri dev
```

## 📝 利用可能なコマンド

| コマンド              | 説明            |
|-------------------|---------------|
| `ban dev`         | Vite開発サーバー起動  |
| `ban build`       | プロダクションビルド    |
| `ban preview`     | ビルド結果をプレビュー   |
| `ban tauri dev`   | Tauriアプリ開発モード |
| `ban tauri build` | Tauriアプリをビルド  |

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

### バックエンド
- **Rust** - システムプログラミング言語
- **Tauri** 2.x - デスクトップアプリフレームワーク

## 📚 ドキュメント

詳細な情報については [docs/project-overview.md](./docs/project-overview.md) をご覧ください。

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
