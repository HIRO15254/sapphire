# TASK-0011: タグ影響カウントコマンド - テストケース仕様書

## 概要
- **機能名**: `get_affected_players_count_by_tag`
- **実装ファイル**: `src-tauri/src/commands/player_tags.rs`
- **テストファイル**: `src-tauri/src/commands/player_tags_test.rs`
- **関連要件**: REQ-505, REQ-506, REQ-507, REQ-508, NFR-203

## テストケース一覧

### 正常系テスト (TC-COUNT-001 ~ TC-COUNT-004)

#### TC-COUNT-001: タグに紐づくプレイヤーが0人の場合 🔵
- **テスト目的**: タグが存在するが、どのプレイヤーにも割り当てられていない場合の動作確認
- **テスト内容**: player_tagsに該当tag_idのレコードが0件の状態でカウント取得
- **期待される動作**: `Ok(0)` が返される
- **信頼性レベル**: 🔵 要件定義書（REQ-505）に基づく

**テストデータ準備**:
```rust
let db = create_test_db();
let tag_id = insert_test_tag(&db, "未割り当てタグ", "#3498DB", false);
// player_tagsにはレコードを作成しない
```

**実際の処理実行**:
```rust
let result = get_affected_players_count_by_tag_internal(tag_id, &db);
```

**結果検証**:
```rust
assert!(result.is_ok(), "タグ存在時は成功すること");
assert_eq!(result.unwrap(), 0, "割り当てなしの場合は0");
```

---

#### TC-COUNT-002: タグに紐づくプレイヤーが1人の場合 🔵
- **テスト目的**: 基本的なカウント機能（1件）
- **テスト内容**: 1プレイヤーにタグを割り当ててカウント取得
- **期待される動作**: `Ok(1)` が返される
- **信頼性レベル**: 🔵 要件定義書（REQ-505）に基づく

**テストデータ準備**:
```rust
let db = create_test_db();
let player_id = insert_test_player(&db, "プレイヤー1");
let tag_id = insert_test_tag(&db, "レギュラー", "#3498DB", false);
assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();
```

**実際の処理実行**:
```rust
let result = get_affected_players_count_by_tag_internal(tag_id, &db);
```

**結果検証**:
```rust
assert!(result.is_ok(), "正常にカウント取得できること");
assert_eq!(result.unwrap(), 1, "1人のプレイヤーに割り当て済み");
```

---

#### TC-COUNT-003: タグに紐づくプレイヤーが複数人の場合 🔵
- **テスト目的**: 複数プレイヤーへのタグ割り当て時のカウント機能
- **テスト内容**: 3プレイヤーに同一タグを割り当ててカウント取得
- **期待される動作**: `Ok(3)` が返される
- **信頼性レベル**: 🔵 要件定義書（REQ-505）に基づく

**テストデータ準備**:
```rust
let db = create_test_db();
let p1 = insert_test_player(&db, "プレイヤー1");
let p2 = insert_test_player(&db, "プレイヤー2");
let p3 = insert_test_player(&db, "プレイヤー3");
let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

assign_tag_to_player_internal(p1, tag_id, Some(3), &db).unwrap();
assign_tag_to_player_internal(p2, tag_id, Some(5), &db).unwrap();
assign_tag_to_player_internal(p3, tag_id, Some(1), &db).unwrap();
```

**実際の処理実行**:
```rust
let result = get_affected_players_count_by_tag_internal(tag_id, &db);
```

**結果検証**:
```rust
assert!(result.is_ok(), "正常にカウント取得できること");
assert_eq!(result.unwrap(), 3, "3人のプレイヤーに割り当て済み");
```

---

#### TC-COUNT-004: DISTINCT動作確認（同一プレイヤー・異なる強度） 🔵
- **テスト目的**: REQ-507の核心機能（同一プレイヤー・異なる強度でも1人としてカウント）
- **テスト内容**: 1プレイヤーに同一タグを強度Ⅲと強度Ⅴで割り当て、DISTINCT player_idでカウント
- **期待される動作**: `Ok(1)` が返される（2ではなく1）
- **信頼性レベル**: 🔵 要件定義書（REQ-507, REQ-207）およびIssue #15の説明に基づく

**テストデータ準備**:
```rust
let db = create_test_db();
let player_id = insert_test_player(&db, "テストプレイヤー");
let tag_id = insert_test_tag(&db, "ブラフ", "#FF5733", true);

// 同一プレイヤーに異なる強度で2回割り当て（REQ-207により可能）
assign_tag_to_player_internal(player_id, tag_id, Some(3), &db).unwrap();
assign_tag_to_player_internal(player_id, tag_id, Some(5), &db).unwrap();
```

**実際の処理実行**:
```rust
let result = get_affected_players_count_by_tag_internal(tag_id, &db);
```

**結果検証**:
```rust
assert!(result.is_ok(), "正常にカウント取得できること");
assert_eq!(result.unwrap(), 1, "同一プレイヤーは1人としてカウント（DISTINCT動作）");

// 追加検証: player_tagsには2件存在することを確認（DISTINCTなしなら2になるはず）
let conn = db.0.lock().unwrap();
let row_count: i64 = conn
    .query_row(
        "SELECT COUNT(*) FROM player_tags WHERE tag_id = ?1",
        params![tag_id],
        |row| row.get(0),
    )
    .unwrap();
assert_eq!(row_count, 2, "player_tagsには2件レコードが存在");
```

---

### 異常系テスト (TC-COUNT-ERR-001)

#### TC-COUNT-ERR-001: 存在しないtag_id 🔵
- **テスト目的**: 不正なタグIDでの操作を防止
- **テスト内容**: 存在しないtag_idでカウント取得を試行
- **期待される動作**: `Err("Tag not found")`
- **信頼性レベル**: 🔵 既存パターン（tags.rs:check_tag_exists）に基づく

**テストデータ準備**:
```rust
let db = create_test_db();
// タグは作成しない
```

**実際の処理実行**:
```rust
let result = get_affected_players_count_by_tag_internal(999, &db);
```

**結果検証**:
```rust
assert!(result.is_err(), "存在しないtag_idでエラーになること");
assert!(result.unwrap_err().contains("Tag not found"), "エラーメッセージが正しいこと");
```

---

### 境界値テスト (TC-COUNT-EDGE-001 ~ TC-COUNT-EDGE-002)

#### TC-COUNT-EDGE-001: CASCADE削除後のカウント 🔵
- **テスト目的**: ON DELETE CASCADEによる自動削除後の動作確認
- **テスト内容**: タグ削除後、該当player_tagsレコードが自動削除されることを確認
- **期待される動作**: タグ削除後は `Err("Tag not found")` が返される
- **信頼性レベル**: 🔵 schema.rs:48-49（ON DELETE CASCADE定義）に基づく

**テストデータ準備**:
```rust
let db = create_test_db();
let player_id = insert_test_player(&db, "プレイヤー1");
let tag_id = insert_test_tag(&db, "削除予定タグ", "#E74C3C", false);
assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();

// タグを削除（CASCADE削除でplayer_tagsも削除される）
let conn = db.0.lock().unwrap();
conn.execute("DELETE FROM tags WHERE id = ?1", params![tag_id]).unwrap();
drop(conn);
```

**実際の処理実行**:
```rust
let result = get_affected_players_count_by_tag_internal(tag_id, &db);
```

**結果検証**:
```rust
assert!(result.is_err(), "削除済みタグでエラーになること");
assert!(result.unwrap_err().contains("Tag not found"), "エラーメッセージが正しいこと");
```

---

#### TC-COUNT-EDGE-002: 大量のプレイヤー（パフォーマンステスト） 🟡
- **テスト目的**: 大量データでの性能確認（インデックス効果の検証）
- **テスト内容**: 100プレイヤーに同一タグを割り当ててカウント取得
- **期待される動作**: `Ok(100)` が返される（idx_player_tags_tag_idが機能すること）
- **信頼性レベル**: 🟡 NFR-203（パフォーマンス要件）から妥当な推測

**テストデータ準備**:
```rust
let db = create_test_db();
let tag_id = insert_test_tag(&db, "人気タグ", "#2ECC71", false);

// 100人のプレイヤーに割り当て
for i in 0..100 {
    let player_id = insert_test_player(&db, &format!("プレイヤー{}", i));
    assign_tag_to_player_internal(player_id, tag_id, None, &db).unwrap();
}
```

**実際の処理実行**:
```rust
let start = std::time::Instant::now();
let result = get_affected_players_count_by_tag_internal(tag_id, &db);
let elapsed = start.elapsed();
```

**結果検証**:
```rust
assert!(result.is_ok(), "大量データでも正常に動作すること");
assert_eq!(result.unwrap(), 100, "100人全員がカウントされること");
// パフォーマンス確認（インデックスあり: 10ms以内目安）
assert!(elapsed.as_millis() < 50, "インデックスにより高速に動作すること");
```

---

### 統合テスト (TC-COUNT-INT-001)

#### TC-COUNT-INT-001: タグ割り当て・カウント・解除・カウントの一連の流れ 🔵
- **テスト目的**: 既存機能との統合動作確認
- **テスト内容**: assign → count(1) → assign → count(2) → remove → count(1) → remove → count(0)
- **期待される動作**: 各操作後のカウントが正しく更新されること
- **信頼性レベル**: 🔵 設計書の統合テストとして

**テストデータ準備**:
```rust
let db = create_test_db();
let p1 = insert_test_player(&db, "プレイヤー1");
let p2 = insert_test_player(&db, "プレイヤー2");
let tag_id = insert_test_tag(&db, "テストタグ", "#9B59B6", false);
```

**実際の処理実行**:
```rust
// 初期状態: 0人
let count0 = get_affected_players_count_by_tag_internal(tag_id, &db).unwrap();
assert_eq!(count0, 0, "初期状態は0人");

// プレイヤー1に割り当て
let pt1 = assign_tag_to_player_internal(p1, tag_id, None, &db).unwrap();
let count1 = get_affected_players_count_by_tag_internal(tag_id, &db).unwrap();
assert_eq!(count1, 1, "1人に割り当て後は1人");

// プレイヤー2に割り当て
let pt2 = assign_tag_to_player_internal(p2, tag_id, None, &db).unwrap();
let count2 = get_affected_players_count_by_tag_internal(tag_id, &db).unwrap();
assert_eq!(count2, 2, "2人に割り当て後は2人");

// プレイヤー1のタグを解除
remove_tag_from_player_internal(pt1.id, &db).unwrap();
let count3 = get_affected_players_count_by_tag_internal(tag_id, &db).unwrap();
assert_eq!(count3, 1, "1人解除後は1人");

// プレイヤー2のタグを解除
remove_tag_from_player_internal(pt2.id, &db).unwrap();
let count4 = get_affected_players_count_by_tag_internal(tag_id, &db).unwrap();
assert_eq!(count4, 0, "全解除後は0人");
```

**結果検証**:
```rust
// 上記のアサーションで全て検証済み
```

---

## テスト実装ガイドライン

### コメント形式
既存テストに合わせて以下の形式を使用:
```rust
// TC-COUNT-XXX: テストケース名 🔵
#[test]
fn test_function_name() {
    // 【テスト目的】: ...
    // 【テスト内容】: ...
    // 【期待される動作】: ...
    // 🔵 信頼性レベル: ...

    // 【テストデータ準備】: ...
    let db = create_test_db();

    // 【実際の処理実行】: ...
    let result = get_affected_players_count_by_tag_internal(tag_id, &db);

    // 【結果検証】: ...
    assert!(...); // 【確認内容】: ... 🔵
}
```

### 信頼性レベル
- 🔵: 要件定義書・設計書に明記されている仕様
- 🟡: 要件から妥当な推測
- 🔴: 実装者の判断（要確認事項）

### テストヘルパー関数
既存の関数を再利用:
- `create_test_db()`: テスト用DBインスタンス作成
- `insert_test_player(db, name)`: テスト用プレイヤー作成
- `insert_test_tag(db, name, color, has_intensity)`: テスト用タグ作成
- `assign_tag_to_player_internal(...)`: タグ割り当て
- `remove_tag_from_player_internal(...)`: タグ解除

---

## テストカバレッジ目標

### 機能カバレッジ
- ✅ 正常系: 0人/1人/複数人/DISTINCT（4ケース）
- ✅ 異常系: 存在しないタグ（1ケース）
- ✅ 境界値: CASCADE削除/大量データ（2ケース）
- ✅ 統合: 既存機能との組み合わせ（1ケース）

### コードカバレッジ目標
- **行カバレッジ**: 100%
- **分岐カバレッジ**: 100%
- **条件カバレッジ**: 100%

---

## SQL実行計画確認

### インデックス活用確認
```sql
-- idx_player_tags_tag_id が使用されることを確認
EXPLAIN QUERY PLAN
SELECT COUNT(DISTINCT player_id) FROM player_tags WHERE tag_id = ?;
```

**期待される実行計画**:
```
SEARCH player_tags USING INDEX idx_player_tags_tag_id (tag_id=?)
```

---

## 実装時の注意事項

1. **check_tag_exists再利用**:
   - tags.rs:29-42の既存ヘルパー関数を使用（コード重複を避ける）

2. **DISTINCT必須**:
   - REQ-507により、同一プレイヤー・異なる強度は1人とカウント
   - SQL: `SELECT COUNT(DISTINCT player_id) FROM player_tags WHERE tag_id = ?`

3. **インデックス活用**:
   - schema.rs:91 `idx_player_tags_tag_id` により高速化

4. **エラーメッセージ統一**:
   - 既存パターンに合わせた日本語メッセージ

---

## テストケース実装順序

1. TC-COUNT-001 (0人) - 最も単純
2. TC-COUNT-002 (1人) - 基本機能
3. TC-COUNT-003 (複数人) - 拡張
4. TC-COUNT-004 (DISTINCT) - 核心機能
5. TC-COUNT-ERR-001 (存在しないタグ) - エラー処理
6. TC-COUNT-EDGE-001 (CASCADE) - 境界値
7. TC-COUNT-INT-001 (統合) - 統合テスト
8. TC-COUNT-EDGE-002 (大量データ) - パフォーマンステスト（最後）

---

## 合計テストケース数
- **正常系**: 4件
- **異常系**: 1件
- **境界値**: 2件
- **統合**: 1件
- **合計**: 8件

---

## 関連ファイル
- 実装: `src-tauri/src/commands/player_tags.rs`
- テスト: `src-tauri/src/commands/player_tags_test.rs`
- モデル: `src-tauri/src/database/models.rs`
- スキーマ: `src-tauri/src/database/schema.rs`
- ヘルパー再利用: `src-tauri/src/commands/tags.rs:29-42` (check_tag_exists)
