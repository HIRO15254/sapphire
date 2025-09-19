# Sapphire プロジェクトドキュメント

このディレクトリには、Sapphireプロジェクトの包括的なドキュメントが含まれています。

## 📁 ディレクトリ構造

```
docs/
├── README.md                    # このファイル
├── getting-started/             # プロジェクト開始時に必要な情報
│   ├── project-overview.md      # プロジェクト概要
│   └── database-setup-guide.md  # データベースセットアップ
├── development/                 # 開発ガイド
│   └── playernote-development-guide.md  # 開発ガイド
├── testing/                     # テスト関連ドキュメント
│   ├── test-guide.md           # テスト作成ガイド
│   ├── tdd-examples.md         # TDD実装例
│   └── tdd-commands-reference.md # コマンドリファレンス
├── architecture/                # アーキテクチャドキュメント
│   └── testing-architecture.md  # テストアーキテクチャ
└── specifications/              # 仕様書
    └── playernote.md           # PlayerNote仕様
```

## 🚀 クイックスタート

### 新規開発者向け
1. **[プロジェクト概要](getting-started/project-overview.md)** - プロジェクトの目的と技術スタック
2. **[データベースセットアップ](getting-started/database-setup-guide.md)** - 開発環境の構築
3. **[開発ガイド](development/playernote-development-guide.md)** - 開発の進め方

### テスト関連
1. **[テスト作成ガイド](testing/test-guide.md)** - テストの書き方の基礎
2. **[TDD実装例](testing/tdd-examples.md)** - 具体的なコード例とベストプラクティス
3. **[コマンドリファレンス](testing/tdd-commands-reference.md)** - 日常で使うテストコマンド

### アーキテクチャ理解
1. **[テストアーキテクチャ](architecture/testing-architecture.md)** - テストシステムの設計思想

## 📖 ドキュメント一覧

### 🏁 Getting Started（スタートガイド）

| ファイル | 説明 | 対象読者 |
|---------|------|---------|
| [project-overview.md](getting-started/project-overview.md) | プロジェクトの概要、技術スタック、目的 | 全員 |
| [database-setup-guide.md](getting-started/database-setup-guide.md) | SQLiteデータベースのセットアップ手順 | 開発者 |

### 🔧 Development（開発ガイド）

| ファイル | 説明 | 対象読者 |
|---------|------|---------|
| [playernote-development-guide.md](development/playernote-development-guide.md) | PlayerNote機能の開発ガイド | 開発者 |

### 🧪 Testing（テスト関連）

| ファイル | 説明 | 対象読者 |
|---------|------|---------|
| [test-guide.md](testing/test-guide.md) | テスト作成の基本ガイド | 開発者 |
| [tdd-examples.md](testing/tdd-examples.md) | TDD実装例とベストプラクティス | 開発者 |
| [tdd-commands-reference.md](testing/tdd-commands-reference.md) | テストコマンドの完全リファレンス | 開発者 |

### 🏗️ Architecture（アーキテクチャ）

| ファイル | 説明 | 対象読者 |
|---------|------|---------|
| [testing-architecture.md](architecture/testing-architecture.md) | テストアーキテクチャの設計思想 | 上級開発者 |

### 📋 Specifications（仕様書）

| ファイル | 説明 | 対象読者 |
|---------|------|---------|
| [playernote.md](specifications/playernote.md) | PlayerNote機能の詳細仕様 | 開発者、PM |

## 🎯 利用シーン別ガイド

### 💼 新規参加メンバー
```
1. getting-started/project-overview.md
2. getting-started/database-setup-guide.md
3. development/playernote-development-guide.md
4. testing/test-guide.md
```

### 🧑‍💻 TDD実践時
```
1. testing/tdd-examples.md (実装パターン確認)
2. testing/tdd-commands-reference.md (コマンド実行)
3. architecture/testing-architecture.md (アーキテクチャ理解)
```

### 🔍 デバッグ・トラブルシューティング時
```
1. testing/tdd-commands-reference.md (デバッグコマンド)
2. testing/test-guide.md (トラブルシューティング)
3. architecture/testing-architecture.md (システム理解)
```

### 📝 新機能開発時
```
1. specifications/playernote.md (仕様確認)
2. development/playernote-development-guide.md (開発手順)
3. testing/tdd-examples.md (テスト実装例)
```

## 🔄 ドキュメント更新ガイド

### 更新が必要なタイミング
- 新機能追加時
- アーキテクチャ変更時
- テスト戦略変更時
- バグ修正に伴う仕様変更時

### 更新手順
1. 該当するドキュメントファイルを特定
2. 変更内容を反映
3. 関連ドキュメントとの整合性確認
4. 必要に応じてこのREADMEも更新

## 📞 サポート・質問

### よくある質問
- **テストが失敗する**: [testing/tdd-commands-reference.md](testing/tdd-commands-reference.md)のデバッグセクション参照
- **新機能の実装方法**: [testing/tdd-examples.md](testing/tdd-examples.md)のTDDサイクル例参照
- **アーキテクチャ理解**: [architecture/testing-architecture.md](architecture/testing-architecture.md)参照

### ドキュメントに関するフィードバック
- 不明な点や改善提案がある場合は、プロジェクトメンバーに相談してください
- ドキュメントの更新や追加が必要な場合は、適切なディレクトリに配置してください

---

**📌 このドキュメントは定期的に更新されます。最新情報は常にこのREADMEを確認してください。**