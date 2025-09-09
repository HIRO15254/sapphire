# Sapphire プロジェクト概要

## 基本情報
- **プロジェクト名**: sapphire
- **バージョン**: 0.1.0
- **プロジェクトタイプ**: Tauriデスクトップアプリケーション
- **フロントエンド**: React + TypeScript
- **バックエンド**: Rust (Tauri)
- **ビルドツール**: Vite
- **パッケージマネージャー**: Ban

## 技術スタック

### フロントエンド
- **React**: ^19.1.0
- **TypeScript**: ~5.8.3
- **Vite**: ^7.0.4 (開発サーバー・ビルドツール)

### バックエンド (Tauri)
- **Rust**: Tauriフレームワーク
- **@tauri-apps/api**: ^2 (フロントエンド-バックエンド通信)
- **@tauri-apps/plugin-opener**: ^2 (外部アプリケーション起動)

### 開発環境
- **推奨IDE**: VS Code
- **推奨拡張機能**:
  - Tauri VS Code Extension
  - rust-analyzer

## Tauriフレームワークについて

### 主要な特徴
- **軽量性**: OSのネイティブWebViewを利用し、Electronよりも軽量で高速
- **セキュリティ**: Rustの安全性とサンドボックス化されたWebView/UI
- **クロスプラットフォーム**: Windows、macOS、Linuxに対応
- **モバイル対応**: Tauri 2.0ではiOS・Androidも正式サポート

### アーキテクチャ
- **バックエンド**: Rust（高速・安全性）
- **フロントエンド**: JavaScript/TypeScript（WebView上で動作）
- **通信**: APIを通じてフロントエンド-バックエンド間で安全な通信

## ディレクトリ構成

```
sapphire/
├── .git/                    # Gitリポジトリ
├── .idea/                   # JetBrains IDE設定
├── .vscode/                 # VS Code設定
├── docs/                    # プロジェクトドキュメント
├── node_modules/            # Node.js依存関係
├── public/                  # 静的ファイル
├── src/                     # React フロントエンドソース
│   ├── assets/              # アセットファイル
│   ├── App.css              # アプリケーションスタイル
│   ├── App.tsx              # メインAppコンポーネント
│   ├── main.tsx             # Reactエントリーポイント
│   └── vite-env.d.ts        # Vite型定義
├── src-tauri/               # Tauriバックエンドソース
│   ├── capabilities/        # Tauri権限設定
│   ├── gen/                 # 自動生成ファイル
│   ├── icons/               # アプリケーションアイコン
│   ├── src/                 # Rustソースコード
│   ├── target/              # Rustビルド出力
│   ├── build.rs             # Rustビルドスクリプト
│   ├── Cargo.toml           # Rust依存関係管理
│   ├── Cargo.lock           # Rust依存関係ロック
│   └── tauri.conf.json      # Tauri設定
├── .gitignore               # Git除外設定
├── bun.lock                 # Banパッケージマネージャーロック
├── index.html               # HTMLエントリーポイント
├── package.json             # Node.js依存関係
├── README.md                # プロジェクト説明
├── tsconfig.json            # TypeScript設定
├── tsconfig.node.json       # Node.js用TypeScript設定
└── vite.config.ts           # Vite設定
```

## 利用可能なコマンド

### 開発
- `ban dev`: 開発サーバー起動
- `ban tauri`: Tauriコマンド実行
- `ban tauri dev`: Tauriアプリケーション開発モード起動

### ビルド
- `ban build`: TypeScriptコンパイル + Viteビルド
- `ban preview`: ビルド結果プレビュー

## セットアップ手順

1. 依存関係のインストール:
   ```bash
   ban install
   ```

2. 開発サーバー起動:
   ```bash
   ban dev
   ```

3. Tauriアプリケーションの起動:
   ```bash
   ban tauri dev
   ```

## プロジェクトの利点

### Electronとの比較
- **パフォーマンス**: バックエンドにRustを使用し、圧倒的に高速
- **セキュリティ**: 必要なAPIのみを明示的に有効化する安全な仕組み
- **メモリ効率**: OSのネイティブWebViewを活用し、メモリ使用量を削減
- **バイナリサイズ**: 軽量な実行ファイルを生成

### 将来性
- **モバイル展開**: 将来的にiOS・Androidアプリへの展開が可能
- **プラグインエコシステム**: 豊富なプラグインによる機能拡張
- **活発な開発**: 継続的にアップデートされる現代的なフレームワーク

## 注意事項
- このプロジェクトはTauriを使用したクロスプラットフォームデスクトップアプリケーションです
- フロントエンドはReact、バックエンドはRustで構築されています  
- パッケージマネージャーとしてBanを使用しています
- 開発にはRustとNode.jsの両方の環境が必要です