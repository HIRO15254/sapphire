# TDD開発メモ: データベースマイグレーションシステム

## 概要

- 機能名: データベースマイグレーションシステム
- 開発開始: 2025-09-30
- 現在のフェーズ: Red (失敗テスト作成完了)

## 関連ファイル

- 元タスクファイル: SAP-45 (Linear Issue)
- 要件定義: `docs/implements/playernote/SAP-45/database-migration-system-requirements.md`
- テストケース定義: `docs/implements/playernote/SAP-45/database-migration-system-testcases.md`
- 実装ファイル: `src-tauri/src/database/migration.rs` (未作成)
- テストファイル: `src-tauri/tests/migration_test.rs`

## Redフェーズ（失敗するテスト作成）

### 作成日時

2025-09-30

### テストケース

10個の包括的なテストケースを作成：

#### 正常系テストケース (5個)
1. **schema_migrationsテーブル初期化テスト**: マイグレーション管理テーブルの作成確認
2. **既存マイグレーションファイル読み込みテスト**: ファイルシステムからのマイグレーション読み込み
3. **最新バージョンマイグレーション実行テスト**: 全マイグレーションの順次実行
4. **特定バージョン指定マイグレーションテスト**: 部分的なマイグレーション制御
5. **マイグレーション状態取得テスト**: 適用状況の正確な把握

#### 異常系テストケース (3個)
6. **無効SQLマイグレーション失敗テスト**: SQLエラーハンドリング
7. **マイグレーションファイル読み込み失敗テスト**: ファイル不存在エラー
8. **チェックサム不一致エラーテスト**: データ整合性検証

#### 境界値テストケース (2個)
9. **初期状態（バージョン0）マイグレーションテスト**: 初回実行の特別処理
10. **最新バージョン状態での再実行テスト**: 冪等性の確保

### テストコード

```rust
// ファイル: src-tauri/tests/migration_test.rs
//
// 【実装した主要構造体】:
// - Migration: マイグレーション定義
// - MigrationResult: 実行結果
// - MigrationStatus: 状態情報
// - AppliedMigration: 適用履歴
// - Migrator: 実行エンジン
// - MigrationLoader: ファイル読み込み

// 【テスト実行コマンド】:
// cargo test --test migration_test
```

### 期待される失敗

✅ **確認済み**: 全10テストが期待通りに失敗

```
test result: FAILED. 0 passed; 10 failed; 0 ignored; 0 measured; 0 filtered out
```

**失敗理由**: `unimplemented!()` マクロにより、以下の関数が未実装:
- `Migrator::new()`
- `migrate_to_latest()`
- `migrate_to_version()`
- `get_migration_status()`
- `apply_migration()`
- `verify_migration_integrity()`
- `MigrationLoader::load_from_directory()`

### 次のフェーズへの要求事項

Greenフェーズで実装すべき内容：

#### 1. 基盤構造の実装
- `src-tauri/src/database/migration.rs` モジュール作成
- Database構造体への統合

#### 2. コア機能の最小実装
- `Migrator` 構造体の実装
- `schema_migrations` テーブル管理
- マイグレーションファイル読み込み機能
- 基本的な実行エンジン

#### 3. データ構造の実装
- Migration, MigrationResult, MigrationStatus構造体
- エラーハンドリング機能
- チェックサム検証機能

#### 4. 必須メソッドの実装
- `migrate_to_latest()`: 最新まで実行
- `migrate_to_version()`: 指定バージョンまで実行
- `get_migration_status()`: 状態取得
- ファイル読み込み機能

#### 5. テスト通過基準
- 10個全てのテストが通ること
- 既存のデータベーステストに影響しないこと
- インメモリテスト環境での動作確認

## Greenフェーズ（最小実装）

### 実装日時

[Green フェーズで記入]

### 実装方針

[Green フェーズで記入]

### 実装コード

[Green フェーズで記入]

### テスト結果

[Green フェーズで記入]

### 課題・改善点

[Green フェーズで記入]

## Refactorフェーズ（品質改善）

### リファクタ日時

[Refactor フェーズで記入]

### 改善内容

[Refactor フェーズで記入]

### セキュリティレビュー

[Refactor フェーズで記入]

### パフォーマンスレビュー

[Refactor フェーズで記入]

### 最終コード

[Refactor フェーズで記入]

### 品質評価

[Refactor フェーズで記入]