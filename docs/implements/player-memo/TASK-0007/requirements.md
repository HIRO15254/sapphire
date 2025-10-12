# TASK-0007: プレイヤー-種別関連付けのテスト補強 - TDD要件定義書

## 🎯 機能の概要

### 🔵 何をする機能か（EARS要件定義書ベース）

プレイヤーと種別の1対1関連付け機能について、既存のTASK-0004（プレイヤーCRUD）とTASK-0005（種別CRUD）では実装されていない統合テストシナリオを追加する機能。特に、種別編集・削除時のプレイヤーへの影響伝播と、ON DELETE SET NULLの動作を保証するテストケースを実装する。

- **参照したEARS要件**: REQ-104, REQ-502, REQ-504, NFR-202
- **参照した設計文書**:
  - Issue #4 EARS要件定義書 - 受け入れ基準
  - schema.rs:12-19 (playersテーブル FOREIGN KEY定義)
  - integration_tests.rs (既存統合テストパターン)

### 🔵 どのような問題を解決するか

**問題**:
- 既存のTASK-0004とTASK-0005では、プレイヤー単体・種別単体のCRUD操作はテストされているが、**両者の関連付け動作**が統合テストで検証されていない
- 種別を編集した際に、関連するすべてのプレイヤーに変更が反映される保証がない
- 種別を削除した際に、ON DELETE SET NULLが正しく動作し、プレイヤーのcategory_idがNULLになることが検証されていない

**解決策**:
- プレイヤー作成 → 種別割り当て → 種別編集 → プレイヤー情報再取得のフローで変更伝播を検証
- プレイヤー作成 → 種別割り当て → 種別削除 → プレイヤー情報再取得のフローでSET NULL動作を検証
- Rustの統合テストとして実装し、データベース層の制約動作を保証

**参照したEARS要件**:
- REQ-104: 1プレイヤーに割り当て可能な種別は最大1つでなければならない 🔵
- REQ-502: 種別編集を確認した場合、システムはすべての該当プレイヤーに変更を反映しなければならない 🔵
- REQ-504: 種別削除を確認した場合、システムは該当プレイヤーの種別を「なし」に設定しなければならない 🔵
- NFR-202: 種別削除時、該当プレイヤーの種別フィールドは安全に解除されなければならない 🔵

### 🔵 想定されるユーザー

このタスクは**開発者向けのテスト補強タスク**であり、エンドユーザーには直接影響しない。
- **対象**: 開発者、QAエンジニア
- **目的**: データベース制約とビジネスロジックの整合性を保証

### 🔵 システム内での位置づけ

- **レイヤー**: テスト層（Rust統合テスト）
- **モジュール**: `src-tauri/src/database/integration_tests.rs`
- **依存関係**:
  - TASK-0004: プレイヤーCRUD（create_player, update_player等）
  - TASK-0005: 種別CRUD（create_category, update_category, delete_category等）
  - データベーススキーマ: players.category_id FOREIGN KEY制約

**参照したアーキテクチャ**:
- Issue #4 設計書 - アーキテクチャ > バックエンド
- schema.rs:18 (ON DELETE SET NULL制約)
- integration_tests.rs:66-97 (既存統合テストパターン)

---

## 📥 入力・出力の仕様

### 🔵 テストシナリオの入出力（統合テストベース）

このタスクは**テスト実装タスク**であるため、通常の入出力ではなく、テストシナリオの入出力を定義します。

#### テストシナリオ1: プレイヤーに種別を割り当て（1-to-1関係）

**入力（テストデータ）**:
```rust
// 1. 種別作成
create_category("タイト", "#FF0000")

// 2. プレイヤー作成（種別割り当て）
create_player("山田太郎", category_id = 1)
```

**期待される出力**:
```rust
// プレイヤー情報取得
player.id = 1
player.name = "山田太郎"
player.category_id = Some(1)
```

#### テストシナリオ2: 種別を別の種別に変更

**入力（テストデータ）**:
```rust
// 1. プレイヤーに種別Aを割り当て
create_player("田中一郎", category_id = 1)

// 2. 種別Bを作成
create_category("ルース", "#00FF00")

// 3. プレイヤーの種別をBに変更
update_player(player_id = 1, category_id = Some(2))
```

**期待される出力**:
```rust
// プレイヤー情報取得
player.category_id = Some(2)  // 種別が変更されている
```

#### テストシナリオ3: 種別をNULLに設定

**入力（テストデータ）**:
```rust
// 1. プレイヤーに種別を割り当て
create_player("佐藤花子", category_id = 1)

// 2. プレイヤーの種別を解除
update_player(player_id = 1, category_id = None)
```

**期待される出力**:
```rust
// プレイヤー情報取得
player.category_id = None  // 種別が解除されている
```

#### テストシナリオ4: 種別を編集した際の影響確認

**入力（テストデータ）**:
```rust
// 1. 種別「タイト」を作成
create_category("タイト", "#FF0000")

// 2. 3人のプレイヤーに種別を割り当て
create_player("A", category_id = 1)
create_player("B", category_id = 1)
create_player("C", category_id = 1)

// 3. 種別名を「タイトパッシブ」に変更
update_category(category_id = 1, name = "タイトパッシブ")

// 4. プレイヤー情報を再取得
```

**期待される出力**:
```rust
// すべてのプレイヤーから参照される種別名が更新されている
category.name = "タイトパッシブ"  // ←全プレイヤーに反映
```

#### テストシナリオ5: 種別を削除した際のSET NULL動作確認

**入力（テストデータ）**:
```rust
// 1. 種別「アグレッシブ」を作成
create_category("アグレッシブ", "#0000FF")

// 2. 2人のプレイヤーに種別を割り当て
create_player("X", category_id = 1)
create_player("Y", category_id = 1)

// 3. 種別を削除
delete_category(category_id = 1)

// 4. プレイヤー情報を再取得
```

**期待される出力**:
```rust
// すべてのプレイヤーのcategory_idがNULLになる
player_x.category_id = None
player_y.category_id = None
```

**参照したEARS要件**: REQ-104, REQ-502, REQ-504, NFR-202
**参照した設計文書**: schema.rs:18, integration_tests.rs:66-97

---

## 🚫 制約条件

### 🔵 パフォーマンス要件

統合テストのため、個別のパフォーマンス要件はなし。ただし、以下を考慮：
- **テスト実行時間**: 各テストケースは1秒以内に完了すること
- **テストデータ量**: 最大10件のプレイヤー・種別データで検証

### 🔵 テスト実装制約

- **テストフレームワーク**: Rust標準の `#[test]` アノテーション使用
- **データベース**: `PlayerDatabase::new_test()` でインメモリDBを使用
- **テストファイル**: `src-tauri/src/database/integration_tests.rs`
- **命名規則**: `test_player_category_*` プレフィックス

**参照した設計文書**: integration_tests.rs:4-21 (既存テストパターン)

### 🔵 データベース制約

**既存スキーマ定義**（schema.rs:12-19）:
```sql
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 100),
  category_id INTEGER,  -- ← NULL許可
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES player_categories(id) ON DELETE SET NULL
                                                              -- ↑ この動作を検証
);
```

**検証すべき制約**:
- `category_id` はNULL許可（種別未設定を許可）
- `ON DELETE SET NULL` - 種別削除時に自動的にNULLに設定
- 外部キー整合性（存在しないcategory_idは設定不可）

**参照した設計文書**: schema.rs:12-19

---

## 💡 想定される使用例（テストケース）

### 🔵 基本的なテストパターン（通常要件REQ-104, REQ-502, REQ-504）

#### テストケース1: プレイヤーに種別を割り当て（1-to-1関係）

```rust
#[test]
fn test_player_category_one_to_one_assignment() {
    let db = PlayerDatabase::new_test().unwrap();
    let conn = db.0.lock().unwrap();

    // 種別作成
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["タイト", "#FF0000"],
    ).unwrap();

    // プレイヤー作成（種別割り当て）
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["山田太郎", 1],
    ).unwrap();

    // プレイヤー情報取得
    let (name, category_id): (String, Option<i64>) = conn.query_row(
        "SELECT name, category_id FROM players WHERE id = 1",
        [],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).unwrap();

    assert_eq!(name, "山田太郎");
    assert_eq!(category_id, Some(1));  // ← 種別が正しく割り当てられている
}
```

**参照したEARS要件**: REQ-104

#### テストケース2: 種別を別の種別に変更

```rust
#[test]
fn test_player_category_reassignment() {
    let db = PlayerDatabase::new_test().unwrap();
    let conn = db.0.lock().unwrap();

    // 種別A・Bを作成
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["タイト", "#FF0000"],
    ).unwrap();
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["ルース", "#00FF00"],
    ).unwrap();

    // プレイヤー作成（種別A）
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["田中一郎", 1],
    ).unwrap();

    // 種別をBに変更
    conn.execute(
        "UPDATE players SET category_id = ?1 WHERE id = ?2",
        params![2, 1],
    ).unwrap();

    // プレイヤー情報取得
    let category_id: Option<i64> = conn.query_row(
        "SELECT category_id FROM players WHERE id = 1",
        [],
        |row| row.get(0),
    ).unwrap();

    assert_eq!(category_id, Some(2));  // ← 種別が変更されている
}
```

**参照したEARS要件**: REQ-104

#### テストケース3: 種別をNULLに設定

```rust
#[test]
fn test_player_category_set_null() {
    let db = PlayerDatabase::new_test().unwrap();
    let conn = db.0.lock().unwrap();

    // 種別作成
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["タイト", "#FF0000"],
    ).unwrap();

    // プレイヤー作成（種別あり）
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["佐藤花子", 1],
    ).unwrap();

    // 種別をNULLに設定
    conn.execute(
        "UPDATE players SET category_id = NULL WHERE id = ?1",
        params![1],
    ).unwrap();

    // プレイヤー情報取得
    let category_id: Option<i64> = conn.query_row(
        "SELECT category_id FROM players WHERE id = 1",
        [],
        |row| row.get(0),
    ).unwrap();

    assert_eq!(category_id, None);  // ← 種別が解除されている
}
```

**参照したEARS要件**: REQ-104

#### テストケース4: 種別を編集した際の影響確認（統合テスト）

```rust
#[test]
fn test_category_update_affects_all_players() {
    let db = PlayerDatabase::new_test().unwrap();
    let conn = db.0.lock().unwrap();

    // 種別作成
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["タイト", "#FF0000"],
    ).unwrap();

    // 3人のプレイヤーに同じ種別を割り当て
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["A", 1],
    ).unwrap();
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["B", 1],
    ).unwrap();
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["C", 1],
    ).unwrap();

    // 種別名を変更
    conn.execute(
        "UPDATE player_categories SET name = ?1 WHERE id = ?2",
        params!["タイトパッシブ", 1],
    ).unwrap();

    // プレイヤーから種別情報を再取得（JOINで確認）
    let category_names: Vec<String> = conn
        .prepare("SELECT c.name FROM players p JOIN player_categories c ON p.category_id = c.id")
        .unwrap()
        .query_map([], |row| row.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();

    // すべてのプレイヤーで種別名が更新されている
    assert_eq!(category_names.len(), 3);
    assert!(category_names.iter().all(|name| name == "タイトパッシブ"));
}
```

**参照したEARS要件**: REQ-502

#### テストケース5: 種別を削除した際のSET NULL動作確認（統合テスト）

```rust
#[test]
fn test_category_delete_sets_players_to_null() {
    let db = PlayerDatabase::new_test().unwrap();
    let conn = db.0.lock().unwrap();

    // 種別作成
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params!["アグレッシブ", "#0000FF"],
    ).unwrap();

    // 2人のプレイヤーに種別を割り当て
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["X", 1],
    ).unwrap();
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params!["Y", 1],
    ).unwrap();

    // 種別を削除
    conn.execute(
        "DELETE FROM player_categories WHERE id = ?1",
        params![1],
    ).unwrap();

    // プレイヤー情報を再取得
    let category_ids: Vec<Option<i64>> = conn
        .prepare("SELECT category_id FROM players")
        .unwrap()
        .query_map([], |row| row.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();

    // すべてのプレイヤーのcategory_idがNULLになっている
    assert_eq!(category_ids.len(), 2);
    assert!(category_ids.iter().all(|id| id.is_none()));
}
```

**参照したEARS要件**: REQ-504, NFR-202

---

## 📋 EARS要件・設計文書との対応関係

### 参照したユーザストーリー
- ストーリー2.2: 種別の編集・削除（Issue #4）
- ストーリー1.1: プレイヤーの新規登録（Issue #4）

### 参照した機能要件
- **REQ-104**: 1プレイヤーに割り当て可能な種別は最大1つでなければならない 🔵
- **REQ-502**: 種別編集を確認した場合、システムはすべての該当プレイヤーに変更を反映しなければならない 🔵
- **REQ-504**: 種別削除を確認した場合、システムは該当プレイヤーの種別を「なし」に設定しなければならない 🔵

### 参照した非機能要件
- **NFR-202**: 種別削除時、該当プレイヤーの種別フィールドは安全に解除されなければならない 🔵

### 参照した受け入れ基準
#### REQ-501-504: 種別編集・削除時の確認ダイアログ 🔵

**Given（前提条件）**:
- 種別「タイト」が5人のプレイヤーに割り当てられている
- 種別編集画面が表示されている

**When（実行条件）**:
- 種別名を「タイトパッシブ」に変更
- 保存ボタンをクリック

**Then（期待結果）**:
- すべてのプレイヤーの種別名が更新される

### 参照した設計文書

#### データベース
- `src-tauri/src/database/schema.rs`:
  - Line 12-19: `players` テーブル定義
  - Line 18: `FOREIGN KEY (category_id) REFERENCES player_categories(id) ON DELETE SET NULL`
  - Line 22-28: `player_categories` テーブル定義

#### テストパターン
- `src-tauri/src/database/integration_tests.rs`:
  - Line 4-21: データベース初期化テスト
  - Line 41-63: カテゴリCRUDテスト
  - Line 66-97: 外部キーとJOINテスト

---

## ✅ 実装方針

### 実装手順

1. **テストファイル修正** (`integration_tests.rs`)
   - 新しいテストケースを追加
   - 既存のテストパターン（`test_player_with_foreign_key`）を参考にする

2. **テストケース実装順序**
   - ✅ テストケース1: プレイヤーに種別を割り当て（1-to-1関係）
   - ✅ テストケース2: 種別を別の種別に変更
   - ✅ テストケース3: 種別をNULLに設定
   - ✅ テストケース4: 種別を編集した際の影響確認（統合テスト）
   - ✅ テストケース5: 種別を削除した際のSET NULL動作確認（統合テスト）

3. **テスト実行** (`cargo test`)
   - すべてのテストがパスすることを確認
   - カバレッジ確認（既存の統合テストと合わせて）

### コーディングルール

- **既存パターン踏襲**: `integration_tests.rs` の既存テストスタイルを踏襲
- **テスト独立性**: 各テストは独立して実行可能（`new_test()`で毎回新規DB）
- **アサーション明確化**: `assert_eq!` で期待値を明示
- **コメント追加**: テストの意図をコメントで説明

---

## 📊 品質判定

✅ **高品質**:
- ✅ 要件の曖昧さ: なし（EARS要件定義書から明確）
- ✅ 入出力定義: 完全（テストシナリオの入出力が明確）
- ✅ 制約条件: 明確（ON DELETE SET NULL制約の検証）
- ✅ 実装可能性: 確実（既存のintegration_tests.rsパターンを踏襲）

---

## 🎯 次のステップ

次のお勧めステップ: `/tdd-testcases` でテストケースの洗い出しを行います。

---

**作成日時**: 2025-10-06 23:26 (JST)
**作成者**: Claude Code (TDD Requirements Phase)
**参照Issue**: #11 (TASK-0007)
**親Issue**: #4 (プレイヤーメモ機能)
