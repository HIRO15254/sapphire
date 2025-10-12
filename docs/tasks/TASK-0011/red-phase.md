# TASK-0011: Red Phase 設計内容

## フェーズ概要
- **フェーズ**: Red（失敗するテストを書く）
- **実施日時**: 2025-10-08 15:33 JST
- **対象機能**: `get_affected_players_count_by_tag`（タグ影響カウントコマンド）
- **GitHub Issue**: #15 (TASK-0011)

## 実装したテストケース

### 合計数
- **合計**: 8件
- **正常系**: 4件
- **異常系**: 1件
- **境界値**: 2件
- **統合**: 1件

### テストケース詳細

#### 正常系テスト

##### 1. TC-COUNT-001: 0人のケース
```rust
#[test]
fn test_get_affected_players_count_zero() {
    // タグ存在、プレイヤー割り当て0件
    // 期待値: Ok(0)
}
```
- **信頼性レベル**: 🔵
- **根拠**: REQ-505

##### 2. TC-COUNT-002: 1人のケース
```rust
#[test]
fn test_get_affected_players_count_one() {
    // 1プレイヤーにタグ割り当て
    // 期待値: Ok(1)
}
```
- **信頼性レベル**: 🔵
- **根拠**: REQ-505

##### 3. TC-COUNT-003: 複数人のケース
```rust
#[test]
fn test_get_affected_players_count_multiple() {
    // 3プレイヤーに同一タグ割り当て
    // 期待値: Ok(3)
}
```
- **信頼性レベル**: 🔵
- **根拠**: REQ-505

##### 4. TC-COUNT-004: DISTINCT動作確認 ⭐最重要
```rust
#[test]
fn test_get_affected_players_count_distinct() {
    // 1プレイヤーに同一タグを強度Ⅲと強度Ⅴで割り当て
    // player_tagsには2件レコード存在
    // 期待値: Ok(1) ← DISTINCT player_idにより
}
```
- **信頼性レベル**: 🔵
- **根拠**: REQ-507, REQ-207, Issue #15
- **重要性**: REQ-507の核心機能を検証

#### 異常系テスト

##### 5. TC-COUNT-ERR-001: 存在しないタグ
```rust
#[test]
fn test_get_affected_players_count_nonexistent_tag() {
    // 存在しないtag_id = 999でカウント取得
    // 期待値: Err("Tag not found")
}
```
- **信頼性レベル**: 🔵
- **根拠**: tags.rs:check_tag_existsパターン

#### 境界値テスト

##### 6. TC-COUNT-EDGE-001: CASCADE削除
```rust
#[test]
fn test_get_affected_players_count_after_cascade_delete() {
    // タグ削除後にカウント取得（CASCADE削除でplayer_tagsも削除済み）
    // 期待値: Err("Tag not found")
}
```
- **信頼性レベル**: 🔵
- **根拠**: schema.rs:48-49 (ON DELETE CASCADE)

##### 7. TC-COUNT-EDGE-002: パフォーマンステスト
```rust
#[test]
fn test_get_affected_players_count_performance() {
    // 100プレイヤーに同一タグ割り当て
    // 期待値: Ok(100)、50ms以内に完了
}
```
- **信頼性レベル**: 🟡
- **根拠**: NFR-203（パフォーマンス要件）から妥当な推測

#### 統合テスト

##### 8. TC-COUNT-INT-001: 一連の流れ
```rust
#[test]
fn test_get_affected_players_count_integration() {
    // assign → count(1) → assign → count(2)
    // → remove → count(1) → remove → count(0)
    // 各操作後のカウントが正しく更新されることを確認
}
```
- **信頼性レベル**: 🔵
- **根拠**: 設計書の統合テスト

## テスト失敗の確認

### コンパイルエラー
```
error[E0425]: cannot find function `get_affected_players_count_by_tag_internal` in this scope
   --> src\commands\player_tags_test.rs:796:18
```

### エラー発生箇所
全12箇所で同じエラー発生:
- test_get_affected_players_count_zero: line 796
- test_get_affected_players_count_one: line 821
- test_get_affected_players_count_multiple: line 851
- test_get_affected_players_count_distinct: line 879
- test_get_affected_players_count_nonexistent_tag: line 917
- test_get_affected_players_count_after_cascade_delete: line 953
- test_get_affected_players_count_performance: line 983
- test_get_affected_players_count_integration: lines 1019, 1025, 1031, 1037, 1043

### 失敗理由
`get_affected_players_count_by_tag_internal`関数が未実装のため、コンパイルエラーが発生。
これはRedフェーズの**期待される失敗**。

## Greenフェーズへの要求事項

### 関数シグネチャ
```rust
pub(crate) fn get_affected_players_count_by_tag_internal(
    tag_id: i64,
    db: &PlayerDatabase,
) -> Result<usize, String>
```

### 実装要件

#### 1. バリデーション
- tags.rs:check_tag_existsヘルパー関数を再利用
- 存在しないtag_idの場合は`Err("Tag not found")`

#### 2. カウントSQL
```sql
SELECT COUNT(DISTINCT player_id) FROM player_tags WHERE tag_id = ?1
```

**重要**: `DISTINCT`キーワードが必須
- REQ-507により、同一プレイヤー・異なる強度は1人としてカウント
- TC-COUNT-004で検証

#### 3. インデックス活用
- schema.rs:91 `idx_player_tags_tag_id`を使用
- TC-COUNT-EDGE-002で性能検証（100人で50ms以内）

#### 4. エラーハンドリング
```rust
.map_err(|e| format!("Failed to count affected players: {}", e))?
```

### 推奨実装コード

```rust
/// タグに紐づくプレイヤー数をカウントする（内部関数）
///
/// 【機能概要】: 指定タグが割り当てられているプレイヤー数をカウント 🔵
/// 【実装方針】: タグ存在確認 → DISTINCT player_idでカウント 🔵
/// 【テスト対応】: TC-COUNT-001～008 🔵
#[allow(dead_code)]
pub(crate) fn get_affected_players_count_by_tag_internal(
    tag_id: i64,
    db: &PlayerDatabase,
) -> Result<usize, String> {
    let conn = db.0.lock().unwrap();

    // 【タグ存在確認】: tags.rsのヘルパー関数を再利用 🔵
    // 【テスト対応】: TC-COUNT-ERR-001, TC-COUNT-EDGE-001 🔵
    use crate::commands::tags::check_tag_exists;
    check_tag_exists(&conn, tag_id)?;

    // 【カウント取得】: DISTINCT player_idで重複を除外してカウント 🔵
    // 【SQL仕様】: REQ-507により同一プレイヤー・異なる強度は1人としてカウント 🔵
    // 【インデックス活用】: idx_player_tags_tag_idにより高速化 🔵
    // 【テスト対応】: TC-COUNT-001～004, TC-COUNT-EDGE-002, TC-COUNT-INT-001 🔵
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(DISTINCT player_id) FROM player_tags WHERE tag_id = ?1",
            params![tag_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to count affected players: {}", e))?;

    // 【型変換】: i64 → usize 🔵
    Ok(count as usize)
}
```

### コメント規約

既存パターンに合わせて以下を使用：
- `// 【機能概要】:` - 関数の目的
- `// 【実装方針】:` - 実装の方針
- `// 【テスト対応】:` - 対応するテストケース
- `// 🔵 信頼性レベル:` - 要件定義書に基づく実装

### テストカバレッジ目標

- **行カバレッジ**: 100%
- **分岐カバレッジ**: 100%（エラー処理含む）
- **条件カバレッジ**: 100%

### 検証ポイント

#### DISTINCT動作（TC-COUNT-004）
```rust
// player_tagsテーブルのレコード数
let row_count: i64 = conn.query_row(
    "SELECT COUNT(*) FROM player_tags WHERE tag_id = ?1",
    params![tag_id],
    |row| row.get(0),
).unwrap();
assert_eq!(row_count, 2); // レコード数は2件

// DISTINCT player_idでのカウント
let distinct_count = get_affected_players_count_by_tag_internal(tag_id, &db).unwrap();
assert_eq!(distinct_count, 1); // プレイヤー数は1人
```

#### パフォーマンス（TC-COUNT-EDGE-002）
```rust
let start = std::time::Instant::now();
let result = get_affected_players_count_by_tag_internal(tag_id, &db);
let elapsed = start.elapsed();

assert!(elapsed.as_millis() < 50); // 50ms以内
```

## テスト実行コマンド

### 個別テスト実行
```bash
cd src-tauri
cargo test --lib commands::player_tags_test::test_get_affected_players_count_zero -- --exact
```

### 全テスト実行
```bash
cd src-tauri
cargo test --lib commands::player_tags_test -- get_affected_players_count
```

### Greenフェーズ後の実行
```bash
cd src-tauri
cargo test --lib commands::player_tags_test
```

## 品質判定基準

### ✅ Red Phase完了条件
- [x] テストコード実装: 8件のテストケース作成
- [x] テスト実行: コンパイルエラー確認
- [x] 期待値明確化: 全テストケースで期待値を記述
- [x] アサーション適切性: 検証内容が明確
- [x] 実装方針明確化: Greenフェーズへの要求事項を文書化

### ⏭️ Green Phase移行条件
- 上記全ての条件を満たしている
- 失敗するテストが確認されている
- 次のフェーズでの実装方針が明確

## 次のステップ

**Green Phase**: `/tdd-green 15`でテストを通すための最小限の実装を行います。

### 実装すべき内容
1. `get_affected_players_count_by_tag_internal`関数の実装
2. tags.rs:check_tag_existsのインポート
3. DISTINCT player_idを使用したカウントSQL
4. usizeへの型変換

### 実装後の確認
```bash
cd src-tauri
cargo test --lib commands::player_tags_test -- get_affected_players_count
```

全8件のテストがPASSすることを確認。
