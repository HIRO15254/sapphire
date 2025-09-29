# プロジェクト技術スタック定義

## 🔧 生成情報
- **生成日**: 2025-09-20
- **生成ツール**: init-tech-stack.md
- **プロジェクトタイプ**: Tauriクロスプラットフォームアプリ（Windows + Android）
- **配布方法**: 現在GitHub Releases、将来的にアプリストア・独自サイト
- **予算**: コスト最小化（無料・低コストツール優先）

## 🎯 プロジェクト要件サマリー
- **対象プラットフォーム**: Windows、Android
- **配布方法**: GitHub Releases → 将来的にアプリストア・独自サイト
- **技術スキル**: JavaScript/TypeScript、HTML/CSS、React/Vue/Svelte、Rust経験あり
- **学習コスト許容度**: バランス重視（新技術と安定技術のバランス）
- **予算制約**: コスト最小化（無料・低コストツール優先）
- **開発期間**: 長期的なメンテナンスを前提

## 🚀 Core Framework
- **フレームワーク**: Tauri 2.0+
- **理由**: モバイル対応強化、セキュリティ向上
- **メリット**: 軽量バンドル、ネイティブパフォーマンス、クロスプラットフォーム対応
- **学習コスト**: 中（既存Rust経験を活用）

## 🎨 Frontend
- **フレームワーク**: React 19.1.0
- **言語**: TypeScript 5.8.3
- **バンドラー**: Vite 7.0.4
- **状態管理**: React hooks
- **スタイリング**: Mantine 8.3.0 + Emotion

### 選択理由
- 既存のReact経験を最大活用
- TypeScriptで型安全性を確保
- Viteで高速な開発環境
- Mantineでコンポーネント開発効率化
- Tauri公式サポートで安定性

## ⚙️ Backend (Rust)
- **コマンドシステム**: Tauri Commands
- **シリアライゼーション**: serde
- **非同期処理**: tokio
- **HTTP クライアント**: reqwest（必要に応じて）
- **ログ**: tracing

### 選択理由
- Tauriとのネイティブ統合
- 型安全なデータ交換
- 高パフォーマンス非同期処理
- 既存Rust経験を活用

## 💾 データストレージ
- **ローカルDB**: SQLite + rusqlite
- **設定管理**: Tauri store API
- **ファイル管理**: Tauri filesystem API

### 設計方針
- オフラインファースト
- 軽量で配布容易
- クロスプラットフォーム対応
- バックアップ・復元機能

## 🛠️ 開発環境
- **Node.js**: 18+ LTS
- **Rust**: 1.70+ (最新stable)
- **パッケージマネージャー**: bun + cargo
- **AI開発支援**: [Tsumiki](https://github.com/classmethod/tsumiki) - TDD・要件定義支援フレームワーク

### 開発ツール
- **フロントエンドビルド**: Vite
- **Rustビルド**: cargo
- **フォーマッタ**: Biome (JS/TS), rustfmt
- **リンター**: Biome, clippy

### Tsumiki TDD支援機能
- **要件定義**: tdd-requirements（TDD要件定義）
- **テストケース作成**: tdd-testcases（テストケース生成）
- **Red-Green-Refactorサイクル**: tdd-red/tdd-green/tdd-refactor
- **完了検証**: tdd-verify-complete（TDD完了確認）
- **包括的開発フロー**: kairo（要件→設計→実装の一貫支援）

## 🧪 テスト
- **フロントエンド単体テスト**: Vitest + React Testing Library
- **Rust単体テスト**: cargo test
- **E2Eテスト**: WebdriverIO (WDIO)
- **カバレッジ**: Vitest coverage + tarpaulin

### テスト戦略
- コンポーネント単位でのテスト
- Tauriコマンドの単体テスト
- クロスプラットフォームE2Eテスト
- 継続的品質管理

## ☁️ CI/CD
- **CI/CD**: GitHub Actions
- **ビルド**: Windows & Android両対応
- **テスト**: 自動テスト実行
- **リリース**: GitHub Releases自動作成
- **配布**: 将来的にアプリストア対応

### ワークフロー
```yaml
# 主要ワークフロー
- プルリクエスト: テスト + ビルド確認
- メインブランチ: フルテスト + リリース候補作成
- タグ作成: 本番リリース + GitHub Releases
```

## 🔒 セキュリティ
- **Tauriセキュリティ**: allowlist設定で最小権限
- **依存関係**: cargo audit + npm audit
- **コード品質**: clippy + Biome
- **バイナリ署名**: 将来的にコード署名対応

## 📊 品質基準
- **テストカバレッジ**: 80%以上
- **コード品質**: clippy + Biome clean
- **型安全性**: TypeScript strict mode
- **パフォーマンス**: バンドルサイズ最適化
- **クロスプラットフォーム**: Windows・Android両対応

## 📁 推奨ディレクトリ構造

```
sapphire/
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── commands/         # Tauri commands
│   │   ├── database/         # DB関連
│   │   ├── utils/           # ユーティリティ
│   │   └── main.rs          # エントリーポイント
│   ├── Cargo.toml
│   └── tauri.conf.json      # Tauri設定
├── src/                     # React frontend
│   ├── components/          # 再利用可能コンポーネント
│   ├── pages/              # ページコンポーネント
│   ├── hooks/              # カスタムフック
│   ├── types/              # 型定義
│   ├── utils/              # ユーティリティ
│   └── App.tsx             # アプリルート
├── tests/                  # E2Eテスト
├── docs/                   # プロジェクトドキュメント
├── package.json           # Node.js dependencies
└── README.md              # プロジェクト概要
```

## 🚀 セットアップ手順

### 1. 開発環境準備
```bash
# Rustツールチェインインストール
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node.js依存関係インストール
bun install

# Tauriセットアップ
bun run tauri build
```

### 2. 主要コマンド
```bash
# 開発サーバー起動
bun run tauri dev

# テスト実行
bun test                    # フロントエンドテスト
cargo test                  # Rustテスト
bun run test:e2e           # E2Eテスト

# ビルド
bun run tauri build        # 本番ビルド
bun run tauri build --debug # デバッグビルド

# 品質チェック
bun run lint               # Biome
cargo clippy              # Rust lint
```

## 💰 コスト最適化戦略

### 無料ツール活用
- **開発環境**: 全て無料・オープンソース
- **CI/CD**: GitHub Actions無料枠活用
- **配布**: GitHub Releases（無料）
- **テスト**: 全て無料ツール

### 将来のコスト考慮
- **アプリストア**: 年間登録費用（Google Play: $25, Microsoft Store: $19）
- **コード署名**: Windows用証明書（年間$100-300）
- **独自サイト**: ホスティング費用（$5-20/月）

## 📝 カスタマイズ方法

このファイルはプロジェクトの進行に応じて更新してください：

1. **依存関係の追加**: 新しいライブラリ・ツールを追加
2. **プラットフォーム拡張**: iOS・Linux対応の検討
3. **配布戦略の変更**: アプリストア・独自サイトへの移行
4. **チーム変更**: メンバー増減に応じた技術選択の見直し

## 🔄 更新履歴
- 2025-09-20: 初回生成 (init-tech-stack.mdにより自動生成)
  - Tauri 2.0+ベースのクロスプラットフォーム構成
  - React + TypeScript + Rustスタック
  - GitHub Actions CI/CD設定
  - コスト最小化重視の構成