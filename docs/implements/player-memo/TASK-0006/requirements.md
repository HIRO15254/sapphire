# TASK-0006: 種別影響カウントコマンド実装 - TDD要件定義書

## 🎯 機能の概要

### 🔵 何をする機能か（EARS要件定義書ベース）

プレイヤー種別を編集・削除する前に、その種別が割り当てられているプレイヤーの数をカウントして返す機能。フロントエンドの確認ダイアログで「X人のプレイヤーに影響があります」と表示するために使用される。

- **参照したEARS要件**: REQ-501, REQ-503
- **参照した設計文書**:
  - Issue #4 設計書コメント - Tauriコマンド設計
  - database-schema.sql (schema.rs:12-19)

### 🔵 どのような問題を解決するか

**問題**:
- ユーザーが種別を編集・削除する際、影響範囲が分からないと意図しない変更を加えてしまう可能性がある
- 大量のプレイヤーに影響がある操作を確認なしで実行してしまうリスクがある

**解決策**:
- 編集・削除前に影響を受けるプレイヤー数を表示
- ユーザーが操作の影響を理解した上で確認できる

**参照したEARS要件**:
- REQ-501: プレイヤー種別を編集する場合、システムは影響を受けるプレイヤー数を表示した確認ダイアログを表示しなければならない 🔵
- REQ-503: プレイヤー種別を削除する場合、システムは影響を受けるプレイヤー数を表示した確認ダイアログを表示しなければならない 🔵

### 🔵 想定されるユーザー

- ポーカープレイヤー（アプリ利用者）
- プレイヤー種別を管理する全てのユーザー

### 🔵 システム内での位置づけ

- **レイヤー**: バックエンド（Tauriコマンド）
- **モジュール**: `src-tauri/src/commands/categories.rs`
- **依存関係**:
  - データベース: `players` テーブル、`player_categories` テーブル
  - 既存実装: `update_category`、`delete_category` （フロント側で呼び出し前に使用）

**参照したアーキテクチャ**:
- Issue #4 設計書 - アーキテクチャ > バックエンド
- データフロー図: 種別編集時の影響確認フロー

---

## 📥 入力・出力の仕様

### 🔵 入力パラメータ（TypeScript型定義ベース）

```rust
category_id: i64
```

- **型**: `i64`
- **範囲**: 1以上の整数（プレイヤー種別ID）
- **制約**:
  - player_categoriesテーブルに存在するID
  - 0以下は不正

**参照したEARS要件**: REQ-501, REQ-503
**参照した設計文書**:
- Issue #4 設計書 - Tauri コマンド設計 > get_affected_players_count_by_category
- models.rs:215-218 (AffectedPlayersCountResponse型定義)

### 🔵 出力値（TypeScript型定義ベース）

```rust
Result<usize, String>
```

**成功時（Ok）**:
- **型**: `usize`
- **意味**: 影響を受けるプレイヤーの数
- **範囲**: 0以上の整数
- **例**:
  - `5` → 5人のプレイヤーがこの種別を使用
  - `0` → この種別を使用しているプレイヤーなし

**エラー時（Err）**:
- **型**: `String`
- **エラーメッセージ**:
  - `"Category not found"` - 種別IDが存在しない
  - `"Database error: <details>"` - データベースエラー

**参照したEARS要件**: REQ-501, REQ-503
**参照した設計文書**: models.rs:215-218

### 🔵 データフロー

```
1. フロントエンド（種別編集画面）
   ↓ invoke('get_affected_players_count_by_category', {category_id})
2. Tauriブリッジ
   ↓
3. get_affected_players_count_by_category コマンド
   ↓ SQL: SELECT COUNT(*) FROM players WHERE category_id = ?
4. SQLiteデータベース
   ↓ count (usize)
5. Tauriブリッジ（シリアライズ）
   ↓ JSON
6. フロントエンド
   ↓ 確認ダイアログ表示: 「X人のプレイヤーに影響があります」
```

**参照した設計文書**: Issue #4 設計書 - データフロー > 種別編集時の影響確認フロー

---

## 🚫 制約条件

### 🔵 パフォーマンス要件（EARS非機能要件ベース）

- **応答時間**: 1秒以内（NFR-003: 検索・フィルタリング結果は1秒以内）
- **データベースクエリ**: 単一のSELECT COUNT(*)クエリで完結
- **インデックス活用**: `idx_players_category_id` インデックスを使用

**参照したEARS要件**: NFR-003
**参照した設計文書**: schema.rs:87 (インデックス定義)

### 🔵 セキュリティ要件

- **SQLインジェクション対策**: パラメータバインディング使用（rusqlite::params!）
- **権限管理**: なし（ローカルアプリ）

### 🔵 アーキテクチャ制約

- **実装場所**: `src-tauri/src/commands/categories.rs`
- **命名規則**:
  - 内部関数: `get_affected_players_count_by_category_internal`
  - Tauriコマンド: `get_affected_players_count_by_category`
- **エラーハンドリング**: `Result<T, String>` 型を使用
- **テスタビリティ**: `_internal` 関数で単体テスト可能にする

**参照した設計文書**: categories.rs:115-152 (既存パターン)

### 🔵 データベース制約

```sql
-- playersテーブル（schema.rs:12-19）
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 100),
  category_id INTEGER,  -- NULL許可（ON DELETE SET NULL）
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES player_categories(id) ON DELETE SET NULL
);

-- インデックス（schema.rs:87）
CREATE INDEX IF NOT EXISTS idx_players_category_id ON players(category_id);
```

**参照した設計文書**: schema.rs:12-19, schema.rs:87

---

## 💡 想定される使用例

### 🔵 基本的な使用パターン（通常要件REQ-501, REQ-503）

#### ユースケース1: 種別編集前の確認

```typescript
// フロントエンド（CategoryManager.tsx）
const handleEditCategory = async (categoryId: number) => {
  // 影響を受けるプレイヤー数を取得
  const count = await invoke<number>('get_affected_players_count_by_category', {
    category_id: categoryId
  });

  // 確認ダイアログを表示
  const confirmed = await showConfirmDialog(
    `${count}人のプレイヤーに影響があります。更新しますか？`
  );

  if (confirmed) {
    await invoke('update_category', {...});
  }
};
```

**参照したEARS要件**: REQ-501
**参照したデータフロー**: Issue #4 設計書 - 種別編集時の影響確認フロー

#### ユースケース2: 種別削除前の確認

```typescript
// フロントエンド（CategoryManager.tsx）
const handleDeleteCategory = async (categoryId: number) => {
  // 影響を受けるプレイヤー数を取得
  const count = await invoke<number>('get_affected_players_count_by_category', {
    category_id: categoryId
  });

  // 確認ダイアログを表示
  const confirmed = await showConfirmDialog(
    `${count}人のプレイヤーに影響があります。削除しますか？（種別は「なし」に設定されます）`
  );

  if (confirmed) {
    await invoke('delete_category', { id: categoryId });
  }
};
```

**参照したEARS要件**: REQ-503

### 🔵 エッジケース（EDGE-XXX）

#### エッジケース1: 種別が存在しない

```rust
// 入力
category_id = 999 (存在しないID)

// 期待される動作
Err("Category not found")
```

#### エッジケース2: 影響を受けるプレイヤーが0人

```rust
// 入力
category_id = 3 (誰も使っていない種別)

// 期待される動作
Ok(0)
```

#### エッジケース3: 大量のプレイヤーがいる場合

```rust
// 入力
category_id = 1 (500人が使用)

// 期待される動作
Ok(500)

// パフォーマンス要件
- COUNT(*)クエリは idx_players_category_id インデックスを活用
- 1秒以内に応答
```

**参照したEARS要件**: NFR-001 (システムは50～500人のプレイヤーデータを適切に管理できなければならない)

### 🔵 エラーケース

#### エラーケース1: 不正なcategory_id（0以下）

```rust
// 入力
category_id = 0

// 期待される動作
Err("Category not found")
```

#### エラーケース2: データベース接続エラー

```rust
// 状況
データベースファイルが破損

// 期待される動作
Err("Database error: <詳細>")
```

---

## 📋 EARS要件・設計文書との対応関係

### 参照したユーザストーリー
- ストーリー2.2: 種別の編集・削除（Issue #4）

### 参照した機能要件
- **REQ-501**: プレイヤー種別を編集する場合、システムは影響を受けるプレイヤー数を表示した確認ダイアログを表示しなければならない 🔵
- **REQ-503**: プレイヤー種別を削除する場合、システムは影響を受けるプレイヤー数を表示した確認ダイアログを表示しなければならない 🔵

### 参照した非機能要件
- **NFR-001**: システムは50～500人のプレイヤーデータを適切に管理できなければならない 🔵
- **NFR-003**: 検索・フィルタリング結果は1秒以内に表示されなければならない 🟡

### 参照した受け入れ基準
#### REQ-501-504: 種別編集・削除時の確認ダイアログ 🔵

**Given（前提条件）**:
- 種別「タイト」が5人のプレイヤーに割り当てられている
- 種別編集画面が表示されている

**When（実行条件）**:
- 種別名を「タイトパッシブ」に変更
- 保存ボタンをクリック

**Then（期待結果）**:
- 「5人のプレイヤーに影響があります。更新しますか?」というダイアログが表示される

### 参照した設計文書

#### アーキテクチャ
- Issue #4 設計書 - アーキテクチャ > バックエンド
- ディレクトリ構造: `src-tauri/src/commands/categories.rs`

#### データフロー
- Issue #4 設計書 - データフロー > 種別編集時の影響確認フロー

#### 型定義
- `src-tauri/src/database/models.rs`:
  - Line 215-218: `AffectedPlayersCountResponse`（参考情報、Rust側ではusizeを直接返す）

#### データベース
- `src-tauri/src/database/schema.rs`:
  - Line 12-19: `players` テーブル定義
  - Line 87: `idx_players_category_id` インデックス

#### API仕様
- Issue #4 設計書 - Tauri コマンド設計:
  ```rust
  /// 種別に関連するプレイヤー数を取得
  #[tauri::command]
  async fn get_affected_players_count_by_category(
      category_id: i64,
      state: tauri::State<'_, AppState>,
  ) -> Result<usize, String> {
      // SELECT COUNT(*) FROM players WHERE category_id = ?
  }
  ```

---

## ✅ 実装方針

### 実装手順

1. **内部関数実装** (`get_affected_players_count_by_category_internal`)
   - category_idの存在確認（既存ヘルパー関数 `check_category_exists` を使用）
   - COUNT(*)クエリ実行
   - usizeで返却

2. **Tauriコマンド実装** (`get_affected_players_count_by_category`)
   - `#[tauri::command]` アノテーション
   - 内部関数呼び出し

3. **テスト実装** (`categories_test.rs`)
   - 正常系テスト（0人、1人、複数人）
   - 異常系テスト（存在しない種別ID）
   - パフォーマンステスト（500人のデータ）

### コーディングルール

- **既存パターン踏襲**: `categories.rs` の既存実装スタイルを踏襲
- **ヘルパー関数活用**: `check_category_exists` を使用してDRY原則適用
- **エラーハンドリング**: `map_err` で明確なエラーメッセージ
- **テスタビリティ**: `_internal` 関数で単体テスト可能に

---

## 📊 品質判定

✅ **高品質**:
- ✅ 要件の曖昧さ: なし（EARS要件定義書から明確）
- ✅ 入出力定義: 完全（型定義・制約・範囲が明確）
- ✅ 制約条件: 明確（パフォーマンス・インデックス・エラーハンドリング）
- ✅ 実装可能性: 確実（既存パターンと類似、データベーススキーマ準備済み）

---

## 🎯 次のステップ

次のお勧めステップ: `/tdd-testcases` でテストケースの洗い出しを行います。

---

**作成日時**: 2025-10-06 15:53 (JST)
**作成者**: Claude Code (TDD Requirements Phase)
**参照Issue**: #10 (TASK-0006)
**親Issue**: #4 (プレイヤーメモ機能)
