# ドキュメントサイトマップ

Sapphireプロジェクトの全ドキュメント一覧です。目的に応じて適切なドキュメントを見つけてください。

## 📁 完全なディレクトリ構造

```
docs/
├── README.md                           # メインインデックス
├── SITEMAP.md                          # このファイル（サイトマップ）
│
├── 🏁 getting-started/                  # プロジェクト開始時
│   ├── README.md                       # スタートガイド
│   ├── project-overview.md             # プロジェクト概要
│   └── database-setup-guide.md         # データベースセットアップ
│
├── 🔧 development/                      # 開発ガイド
│   ├── README.md                       # 開発ガイドインデックス
│   └── playernote-development-guide.md # PlayerNote開発ガイド
│
├── 🧪 testing/                         # テスト関連
│   ├── README.md                       # テストガイドインデックス
│   ├── test-guide.md                   # テスト作成ガイド
│   ├── tdd-examples.md                 # TDD実装例
│   └── tdd-commands-reference.md       # コマンドリファレンス
│
├── 🏗️ architecture/                    # アーキテクチャ
│   ├── README.md                       # アーキテクチャインデックス
│   └── testing-architecture.md         # テストアーキテクチャ
│
└── 📋 specifications/                   # 仕様書
    ├── README.md                       # 仕様書インデックス
    └── playernote.md                   # PlayerNote仕様
```

## 🎯 目的別ドキュメントマップ

### 👤 ロール別おすすめドキュメント

#### 🆕 新規参加メンバー
```
必読順序:
1. README.md (全体概要)
2. getting-started/README.md → project-overview.md → database-setup-guide.md
3. testing/README.md → test-guide.md
4. development/README.md → playernote-development-guide.md
```

#### 👨‍💻 開発者（フロントエンド）
```
日常参照:
• testing/tdd-commands-reference.md (コマンド)
• testing/tdd-examples.md (実装パターン)
• development/playernote-development-guide.md (開発手順)

深い理解:
• architecture/testing-architecture.md (システム理解)
• specifications/playernote.md (仕様確認)
```

#### 👨‍💻 開発者（バックエンド）
```
日常参照:
• testing/tdd-commands-reference.md (Rustテストコマンド)
• testing/tdd-examples.md (データベーステスト例)
• getting-started/database-setup-guide.md (DB操作)

深い理解:
• architecture/testing-architecture.md (DB設計思想)
• specifications/playernote.md (データ仕様)
```

#### 🧪 QAエンジニア
```
テスト設計:
• specifications/playernote.md (仕様ベースのテスト)
• testing/test-guide.md (テスト方針)
• testing/tdd-examples.md (E2Eテスト例)

実行・デバッグ:
• testing/tdd-commands-reference.md (E2Eコマンド)
• architecture/testing-architecture.md (システム理解)
```

#### 📋 プロジェクトマネージャー
```
計画・管理:
• getting-started/project-overview.md (全体像)
• specifications/playernote.md (機能仕様)
• development/playernote-development-guide.md (開発工程)

品質確認:
• testing/README.md (品質保証方針)
• architecture/testing-architecture.md (技術的品質)
```

#### 🏗️ アーキテクト・テックリード
```
設計・指導:
• architecture/ (全ファイル - 設計思想)
• testing/tdd-examples.md (実装指針)
• testing/test-guide.md (品質基準)

技術戦略:
• getting-started/project-overview.md (技術選定背景)
• development/playernote-development-guide.md (開発方針)
```

### 🔄 タスク別ドキュメントフロー

#### 新機能開発フロー
```
1. specifications/playernote.md (要件確認)
   ↓
2. architecture/testing-architecture.md (設計検討)
   ↓
3. development/playernote-development-guide.md (実装開始)
   ↓
4. testing/tdd-examples.md (TDD実践)
   ↓
5. testing/tdd-commands-reference.md (テスト実行)
```

#### バグ修正フロー
```
1. testing/tdd-commands-reference.md (問題再現)
   ↓
2. specifications/playernote.md (仕様確認)
   ↓
3. testing/tdd-examples.md (テストファースト修正)
   ↓
4. development/playernote-development-guide.md (実装修正)
   ↓
5. testing/test-guide.md (リグレッションテスト)
```

#### 学習・スキルアップフロー
```
基礎習得:
testing/README.md → test-guide.md → tdd-examples.md

応用理解:
architecture/testing-architecture.md → development/playernote-development-guide.md

実践マスター:
testing/tdd-commands-reference.md (日常活用)
```

## 📚 学習レベル別ガイド

### 🔰 初級（TDD未経験）
**推奨学習パス**:
1. `testing/README.md` - 学習計画の立案
2. `testing/test-guide.md` - 基礎概念の理解
3. `getting-started/project-overview.md` - プロジェクト理解
4. `testing/tdd-examples.md` - 実装例の読解
5. `testing/tdd-commands-reference.md` - コマンド習得

**習得目標**: 基本的なテストが書けるようになる

### 🏃 中級（TDD経験あり）
**推奨学習パス**:
1. `architecture/testing-architecture.md` - 設計思想の理解
2. `testing/tdd-examples.md` - 高度なパターンの習得
3. `development/playernote-development-guide.md` - プロジェクト固有の開発手法
4. `specifications/playernote.md` - 仕様駆動開発の実践

**習得目標**: プロジェクトの標準に沿った開発ができる

### 🎓 上級（指導・設計レベル）
**推奨学習パス**:
1. `architecture/` (全ファイル) - システム全体の理解
2. `testing/` (全ファイル) - 品質保証の包括的理解
3. `specifications/` - 要件定義との連携
4. チーム指導・レビュー実践

**習得目標**: チームのTDD文化を牽引できる

## 🔍 クイック検索

### キーワード別ドキュメント検索

| キーワード | ドキュメント |
|-----------|-------------|
| **環境構築** | getting-started/database-setup-guide.md |
| **コマンド** | testing/tdd-commands-reference.md |
| **実装例** | testing/tdd-examples.md |
| **エラー解決** | testing/test-guide.md (トラブルシューティング) |
| **仕様確認** | specifications/playernote.md |
| **アーキテクチャ** | architecture/testing-architecture.md |
| **開発手順** | development/playernote-development-guide.md |
| **TDD学習** | testing/README.md |

### 緊急度別ドキュメント

#### 🚨 緊急（すぐに解決が必要）
- `testing/tdd-commands-reference.md` - デバッグコマンド
- `testing/test-guide.md` - トラブルシューティング

#### ⚡ 高優先度（今日中に確認）
- `specifications/playernote.md` - 仕様確認
- `testing/tdd-examples.md` - 実装方法確認

#### 📅 中優先度（今週中に学習）
- `architecture/testing-architecture.md` - システム理解
- `development/playernote-development-guide.md` - 開発プロセス

#### 📖 低優先度（時間がある時に読む）
- `getting-started/project-overview.md` - 背景理解
- `testing/README.md` - 包括的な学習計画

---

**💡 使い方のコツ**:
- まずは自分のロールと目的を明確にする
- 該当するREADME.mdから始める
- 必要に応じて詳細ドキュメントに深掘りする
- 学習レベルに応じてパスを選択する