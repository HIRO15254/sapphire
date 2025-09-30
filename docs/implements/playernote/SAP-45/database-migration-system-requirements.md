# TDD要件定義書: データベースマイグレーションシステム

**機能名**: データベースマイグレーションシステム
**Issue ID**: SAP-45
**関連プロジェクト**: プレイヤーノート機能
**作成日**: 2025-09-30
**TDDフェーズ**: Requirements Definition

## 1. 機能の概要（EARS要件定義書・設計文書ベース）

🔵 **青信号** - Linear Issue SAP-45とプレイヤーノート要件定義書に基づく

- **何をする機能か**: SQLiteデータベースのスキーマ変更を安全に管理するマイグレーションシステム
- **解決する問題**: アプリケーションのバージョンアップ時にデータの整合性を保ちながらスキーマを更新できるようにする
- **想定ユーザー**: アプリケーション開発者・保守担当者
- **システム内での位置づけ**: データベース基盤レイヤーの中核機能、Rustバックエンドモジュール
- **参照したEARS要件**: NFR-201（SQLiteローカルデータストレージ）、NFR-202（データ整合性保持）
- **参照した設計文書**: src-tauri/src/database/mod.rs、既存マイグレーションファイル

## 2. 入力・出力の仕様（EARS機能要件・TypeScript型定義ベース）

🔵 **青信号** - 既存のマイグレーションファイルと技術スタック定義から抽出

### 入力パラメータ
```rust
// マイグレーション実行入力
pub struct MigrationInput {
    pub target_version: Option<u32>,  // 適用するバージョン（Noneで最新まで）
    pub rollback: bool,              // ロールバック実行フラグ
}

// マイグレーション定義
pub struct Migration {
    pub version: u32,                // バージョン番号
    pub description: String,         // 説明文
    pub up_sql: String,             // 適用SQL
    pub down_sql: String,           // ロールバックSQL
    pub checksum: String,           // 整合性検証用チェックサム
}
```

### 出力値
```rust
// マイグレーション実行結果
pub struct MigrationResult {
    pub success: bool,              // 実行成功フラグ
    pub applied_migrations: Vec<u32>, // 適用されたマイグレーション一覧
    pub current_version: u32,       // 現在のスキーマバージョン
    pub error_message: Option<String>, // エラーメッセージ
}

// マイグレーション状態
pub struct MigrationStatus {
    pub current_version: u32,       // 現在のバージョン
    pub pending_migrations: Vec<u32>, // 未適用マイグレーション
    pub applied_migrations: Vec<AppliedMigration>, // 適用済み一覧
}

pub struct AppliedMigration {
    pub version: u32,
    pub applied_at: String,         // ISO8601形式
    pub checksum: String,
}
```

### データフロー
1. マイグレーションファイル読み込み（src-tauri/migrations/）
2. 現在のスキーマバージョン確認（schema_migrations table）
3. 未適用マイグレーション特定
4. 順次実行・検証・記録

**参照したEARS要件**: TECH-005（Rust + rusqliteでのデータベース操作）
**参照した設計文書**: src-tauri/src/database/mod.rs、マイグレーションファイル構造

## 3. 制約条件（EARS非機能要件・アーキテクチャ設計ベース）

🔵 **青信号** - 技術スタック定義とNFR要件から抽出

### パフォーマンス要件
- マイグレーション実行時間: 10秒以内（大規模な変更でも）
- バージョン確認: 100ms以内
- ロールバック実行: 5秒以内

### セキュリティ要件
- SQL Injection耐性: パラメータ化クエリ使用
- ファイル読み込み: 検証済みマイグレーションディレクトリのみ
- 権限制御: アプリケーション内のみ実行可能

### 互換性要件
- SQLite 3.x系との互換性
- 既存データベース構造との後方互換性
- rusqlite クレート依存関係維持

### アーキテクチャ制約
- Database構造体への統合実装
- 既存のCRUD操作との非干渉
- テスト環境での分離実行

### データベース制約
- schema_migrations テーブル自動作成
- トランザクション管理による原子性保証
- 外部キー制約の維持

**参照したEARS要件**: NFR-201（SQLite使用）、NFR-202（データ整合性）、TECH-005（Rust実装）
**参照した設計文書**: docs/tech-stack.md、src-tauri/src/database/mod.rs

## 4. 想定される使用例（EARSEdgeケース・データフローベース）

🔵 **青信号** - 既存のマイグレーションファイルと要件から推定

### 基本的な使用パターン
```rust
// アプリケーション起動時の自動マイグレーション
let migrator = Migrator::new(&database)?;
let result = migrator.migrate_to_latest()?;

// 特定バージョンへのマイグレーション
let result = migrator.migrate_to_version(2)?;

// 現在の状態確認
let status = migrator.get_migration_status()?;
```

### データフロー
1. アプリケーション起動
2. Database初期化
3. マイグレーション状態確認
4. 必要に応じて自動実行
5. 結果ログ出力

### エッジケース
- **破損したマイグレーションファイル**: チェックサム検証で検出・エラー停止
- **未完了のマイグレーション**: 途中失敗時のロールバック実行
- **循環依存**: バージョン順序性の強制
- **大量データ**: バッチ処理による段階実行

### エラーケース
- SQLエラー: トランザクションロールバック・詳細ログ
- ファイル不存在: 明確なエラーメッセージ・処理停止
- 権限不足: 適切なエラー通知
- ディスク容量不足: 事前チェック・警告

**参照したEARS要件**: データ整合性要件全般
**参照した設計文書**: 既存マイグレーションファイルのパターン

## 5. EARS要件・設計文書との対応関係

### 参照したユーザストーリー
- プレイヤーノート機能の基盤として安全なデータ管理が必要

### 参照した機能要件
- **REQ-303**: 論理削除処理（マイグレーションでサポート）
- **TECH-005**: Rust + rusqliteでのデータベース操作

### 参照した非機能要件
- **NFR-201**: SQLiteローカルデータストレージ使用
- **NFR-202**: データ整合性保持

### 参照したEdgeケース
- データベース破損時の復旧
- マイグレーション失敗時のロールバック

### 参照した受け入れ基準
- 全テストケース通過
- データ損失の完全防止
- 既存機能への非影響

### 参照した設計文書
- **アーキテクチャ**: src-tauri/src/database/mod.rs構造
- **データフロー**: Database初期化→マイグレーション実行のフロー
- **型定義**: rusqlite, serde依存の構造体設計
- **データベース**: 既存のplayer_note_schema.sqlとの統合
- **API仕様**: Database構造体のpublicメソッド設計

## 品質判定

✅ **高品質**:
- 要件の曖昧さ: なし（明確な入出力定義）
- 入出力定義: 完全（Rust構造体で型安全に定義）
- 制約条件: 明確（パフォーマンス・セキュリティ・互換性）
- 実装可能性: 確実（既存の基盤を活用）

## 実装方針

1. **マイグレーション管理テーブル作成**: schema_migrationsテーブル
2. **Migrator構造体実装**: Database構造体との統合
3. **ファイル読み込み機能**: src-tauri/migrations/ディレクトリ処理
4. **実行エンジン**: トランザクション管理とエラーハンドリング
5. **テストスイート**: 包括的なテストケース作成

## 次のステップ

TDD要件定義フェーズが完了しました。次のフェーズ `/tdd-testcases` でテストケースの洗い出しを行います。