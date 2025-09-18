# TDD コマンドリファレンス

このドキュメントでは、Sapphireプロジェクトで利用可能なすべてのテスト関連コマンドと、それぞれの使用場面について説明します。

## 📋 目次

1. [基本テストコマンド](#基本テストコマンド)
2. [開発時によく使うコマンド](#開発時によく使うコマンド)
3. [CI/CD用コマンド](#cicd用コマンド)
4. [デバッグ・トラブルシューティング](#デバッグトラブルシューティング)
5. [パフォーマンステスト](#パフォーマンステスト)
6. [コマンド組み合わせ例](#コマンド組み合わせ例)

## 基本テストコマンド

### フロントエンドテスト

#### `bun run test`
```bash
bun run test
```
**目的**: 開発時のライブテスト（watch mode）
**使用場面**:
- TDD開発中に常時実行
- ファイル変更時の自動テスト実行
- デバッグ時のリアルタイムフィードバック

**出力例**:
```
✓ src/test/App.test.tsx (7)
✓ src/test/integration/UserWorkflow.test.tsx (5)
✓ src/test/integration/NotesWorkflow.test.tsx (6)

Test Files  3 passed (3)
Tests  18 passed (18)
```

#### `bun run test:run`
```bash
bun run test:run
```
**目的**: 単発実行（CI/CD用）
**使用場面**:
- プルリクエスト前の最終確認
- CI/CDパイプライン
- 手動での全テスト実行

#### `bun run test:ui`
```bash
bun run test:ui
```
**目的**: ブラウザUIでのテスト実行
**使用場面**:
- ビジュアルでのテスト結果確認
- テストデバッグ
- テストカバレッジの詳細分析

**アクセス**: `http://localhost:51204/__vitest__/`

#### `bun run test:coverage`
```bash
bun run test:coverage
```
**目的**: テストカバレッジ付きでテスト実行
**使用場面**:
- コードカバレッジの測定
- 未テスト部分の特定
- 品質ゲートの確認

**出力例**:
```
 % Coverage report from v8
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
All files              |   85.47 |    78.26 |   82.14 |   85.47 |
 src                   |   90.24 |    83.33 |   85.71 |   90.24 |
  App.tsx              |   90.24 |    83.33 |   85.71 |   90.24 |
-----------------------|---------|----------|---------|---------|
```

### バックエンドテスト

#### `bun run test:rust`
```bash
bun run test:rust
```
**目的**: Rustユニットテスト実行
**使用場面**:
- データベース操作のテスト
- ビジネスロジックの検証
- Tauriコマンドのテスト

**内部実行**: `cd src-tauri && cargo test -- --test-threads=1`

**出力例**:
```
running 14 tests
test tests::test_create_and_get_users ... ok
test tests::test_create_user_duplicate_email ... ok
test tests::test_delete_user ... ok
test tests::test_cascade_delete_notes_when_user_deleted ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

### E2Eテスト

#### `bun run test:e2e`
```bash
bun run test:e2e
```
**目的**: エンドツーエンドテスト実行（ヘッドレス）
**使用場面**:
- CI/CDでの自動テスト
- 高速なE2Eテスト実行
- バッチ処理での検証

#### `bun run test:e2e:ui`
```bash
bun run test:e2e:ui
```
**目的**: PlaywrightのUIモードでE2Eテスト実行
**使用場面**:
- E2Eテストのデバッグ
- ステップバイステップでの実行確認
- テスト作成時の動作確認

#### `bun run test:e2e:headed`
```bash
bun run test:e2e:headed
```
**目的**: ブラウザを表示してE2Eテスト実行
**使用場面**:
- 実際のユーザー操作の確認
- UIの動作検証
- デモンストレーション

## 開発時によく使うコマンド

### TDD開発サイクル

#### 1. レッドフェーズ（失敗するテストを書く）
```bash
# watchモードでテスト実行
bun run test

# 特定のテストファイルのみ監視
bun run test src/test/NewFeature.test.tsx
```

#### 2. グリーンフェーズ（テストを通す最小実装）
```bash
# 特定のテストのみ実行
bun run test:run --reporter=verbose src/test/NewFeature.test.tsx

# Rustテストの場合
cd src-tauri && cargo test test_new_feature
```

#### 3. リファクターフェーズ（コード改善）
```bash
# 全テスト実行してリグレッション確認
bun run test:run

# カバレッジ確認
bun run test:coverage
```

### デバッグ用コマンド

#### テストファイル単体実行
```bash
# 特定のテストファイルのみ
bun run test src/test/integration/UserWorkflow.test.tsx

# 特定のテストケースのみ
bun run test:run --reporter=verbose -t "should create user"
```

#### 詳細出力でのテスト実行
```bash
# Vitestの詳細ログ
DEBUG=vitest:* bun run test:run

# Rustテストの詳細出力
cd src-tauri && RUST_LOG=debug cargo test
```

## CI/CD用コマンド

### 全体テストスイート

#### `bun run test:all`
```bash
bun run test:all
```
**目的**: フロントエンド + Rustテストの実行
**使用場面**:
- プルリクエスト前の確認
- 基本的なCI/CDチェック

**内部実行**: `bun run test:run && bun run test:rust`

#### `bun run test:full`
```bash
bun run test:full
```
**目的**: カバレッジ + Rust + E2Eの完全テスト
**使用場面**:
- リリース前の最終検証
- マスターブランチへのマージ前
- ナイトリービルド

**内部実行**: `bun run test:coverage && bun run test:rust && bun run test:e2e`

### 並列実行

#### 手動並列実行
```bash
# フロントエンドとRustを並列実行
bun run test:run & cd src-tauri && cargo test & wait

# 複数ブラウザでE2E並列実行
bun run test:e2e --project=chromium & \
bun run test:e2e --project=firefox & \
bun run test:e2e --project=webkit & wait
```

## デバッグ・トラブルシューティング

### テスト失敗時のデバッグ

#### 詳細エラー情報
```bash
# Vitestの詳細エラー出力
bun run test:run --reporter=verbose --no-coverage

# Rustテストのbacktrace
cd src-tauri && RUST_BACKTRACE=1 cargo test
```

#### スクリーンショット付きE2Eテスト
```bash
# 失敗時にスクリーンショット保存
bun run test:e2e --trace=on --screenshot=only-on-failure
```

### パフォーマンス分析

#### テスト実行時間の測定
```bash
# Vitestの実行時間詳細
bun run test:run --reporter=verbose

# Rustテストの時間測定
cd src-tauri && cargo test -- --show-output --test-threads=1
```

### ログレベル調整

#### フロントエンドテストのログ
```bash
# デバッグレベル
DEBUG=* bun run test:run

# 特定モジュールのみ
DEBUG=vitest:* bun run test:run
```

#### Rustテストのログ
```bash
cd src-tauri

# 全ログ表示
RUST_LOG=debug cargo test

# 特定モジュールのみ
RUST_LOG=sapphire=debug cargo test

# エラーレベルのみ
RUST_LOG=error cargo test
```

## パフォーマンステスト

### ベンチマークテスト

#### フロントエンドパフォーマンス
```bash
# パフォーマンステスト付きで実行
bun run test:run --reporter=verbose src/test/performance/

# メモリ使用量チェック
node --inspect bun run test:run
```

#### Rustパフォーマンステスト
```bash
cd src-tauri

# リリースモードでのテスト
cargo test --release

# ベンチマークテスト
cargo bench
```

### 大量データテスト

#### 大量ユーザーデータでのテスト
```bash
# 環境変数でテストデータサイズ指定
TEST_DATA_SIZE=1000 bun run test:run src/test/performance/

# Rustでの大量データテスト
cd src-tauri && TEST_DB_SIZE=large cargo test test_bulk_operations
```

## コマンド組み合わせ例

### 開発ワークフロー例

#### 新機能開発時
```bash
# 1. テストファイル作成後、watchモード開始
bun run test src/test/NewFeature.test.tsx

# 2. 実装完了後、関連テスト実行
bun run test:run src/test/integration/

# 3. 全体テスト実行
bun run test:all

# 4. E2Eテスト実行
bun run test:e2e:headed
```

#### バグ修正時
```bash
# 1. 失敗するテストケース追加
bun run test src/test/BugFix.test.tsx

# 2. 修正後の確認
bun run test:run --reporter=verbose

# 3. リグレッションテスト
bun run test:coverage

# 4. 関連E2Eテスト
bun run test:e2e --grep="user management"
```

### CI/CDパイプライン例

#### プルリクエスト時
```bash
# リント・フォーマットチェック
bun run lint && bun run format:check

# 基本テスト
bun run test:all

# カバレッジチェック
bun run test:coverage
```

#### リリース前
```bash
# 完全テストスイート
bun run test:full

# 複数環境でのE2Eテスト
bun run test:e2e --project=chromium
bun run test:e2e --project=firefox
bun run test:e2e --project=webkit

# ビルドテスト
bun run build
```

### トラブルシューティング例

#### テスト失敗時の調査
```bash
# 1. 詳細ログで実行
DEBUG=* bun run test:run --reporter=verbose

# 2. 単体テストで問題箇所特定
bun run test:run -t "specific failing test"

# 3. Rustテストのデバッグ
cd src-tauri && RUST_LOG=debug RUST_BACKTRACE=1 cargo test

# 4. E2Eテストのトレース
bun run test:e2e --trace=on --debug
```

#### パフォーマンス問題調査
```bash
# メモリ使用量調査
node --inspect --max-old-space-size=4096 bun run test:run

# 実行時間分析
time bun run test:all

# Rustのプロファイリング
cd src-tauri && cargo test --release -- --show-output
```

## 環境変数とオプション

### テスト環境設定

```bash
# テスト環境の指定
NODE_ENV=test bun run test:run

# データベース設定
TEST_DATABASE_URL=sqlite::memory: bun run test:rust

# ログレベル設定
LOG_LEVEL=debug bun run test:all

# ヘッドレスモード制御
HEADLESS=false bun run test:e2e
```

### カスタムテスト設定

```bash
# タイムアウト設定
TEST_TIMEOUT=30000 bun run test:run

# 並列度設定
MAX_WORKERS=4 bun run test:run

# カバレッジ閾値
COVERAGE_THRESHOLD=80 bun run test:coverage
```

このコマンドリファレンスを活用して、効率的なTDD開発を実践してください。状況に応じて適切なコマンドを選択することで、開発速度と品質の両方を向上させることができます。