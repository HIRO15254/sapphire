use super::players::*;
use crate::database::PlayerDatabase;
use rusqlite::params;

// ============================================
// テストヘルパー関数
// ============================================

/// テスト用データベースを作成
fn create_test_db() -> PlayerDatabase {
    PlayerDatabase::new_test().expect("Failed to create test database")
}

// テスト用のState型は作成できないため、内部関数を直接テストする
//　Greenフェーズでは、players.rsに内部関数（State不要）を実装予定

/// テスト用の種別を作成
fn insert_test_category(db: &PlayerDatabase, name: &str, color: &str) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params![name, color],
    )
    .expect("Failed to insert test category");
    conn.last_insert_rowid()
}

/// テスト用のプレイヤーを作成
fn insert_test_player(db: &PlayerDatabase, name: &str, category_id: Option<i64>) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params![name, category_id],
    )
    .expect("Failed to insert test player");
    conn.last_insert_rowid()
}

/// テスト用のタグを作成
fn insert_test_tag(db: &PlayerDatabase, name: &str, color: &str, has_intensity: bool) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO tags (name, color, has_intensity) VALUES (?1, ?2, ?3)",
        params![name, color, has_intensity],
    )
    .expect("Failed to insert test tag");
    conn.last_insert_rowid()
}

/// テスト用のプレイヤータグを作成
fn insert_test_player_tag(db: &PlayerDatabase, player_id: i64, tag_id: i64) {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_tags (player_id, tag_id, display_order) VALUES (?1, ?2, ?3)",
        params![player_id, tag_id, 0],
    )
    .expect("Failed to insert test player_tag");
}

// ============================================
// プレイヤータグフィルタリング機能のテストケース (TASK-0017)
// ============================================

// ============================================
// TC-FILTER-001: 単一タグでフィルタ 🔵
// ============================================

#[test]
fn test_filter_players_by_single_tag() {
    // 【テスト目的】: 指定した1つのタグを持つプレイヤーのみが取得されることを確認
    // 【テスト内容】: 単一タグでのフィルタリングが正しく動作することを検証
    // 【期待される動作】: そのタグを持つプレイヤーが全て取得され、持たないプレイヤーは除外される
    // 🔵 信頼性レベル: 要件定義（REQ-402: 特定タグでのフィルタリング）に基づく

    // 【テストデータ準備】: プレイヤー3人とタグ1つを作成し、一部にタグを割り当て
    // 【初期条件設定】: プレイヤーA（タグあり）、プレイヤーB（タグあり）、プレイヤーC（タグなし）
    let db = create_test_db();
    let player_a_id = insert_test_player(&db, "プレイヤーA", None);
    let player_b_id = insert_test_player(&db, "プレイヤーB", None);
    let player_c_id = insert_test_player(&db, "プレイヤーC", None);

    let tag_id = insert_test_tag(&db, "ブラフ", "#FF0000", false);
    insert_test_player_tag(&db, player_a_id, tag_id);
    insert_test_player_tag(&db, player_b_id, tag_id);

    // 【実際の処理実行】: 単一タグでフィルタリング
    // 【処理内容】: tag_ids=[tag_id] でプレイヤーを検索
    let result = filter_players_by_tags_internal(vec![tag_id], Some(1), Some(20), &db);

    // 【結果検証】: タグを持つプレイヤーのみが返されることを確認
    // 【期待値確認】: プレイヤーAとBが含まれ、Cは除外される
    assert!(result.is_ok(), "単一タグフィルタが成功すること"); // 【確認内容】: フィルタ処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 2); // 【確認内容】: 2件のプレイヤーが取得される 🔵
    assert_eq!(response.total, 2); // 【確認内容】: 総件数が2件 🔵

    let ids: Vec<i64> = response.data.iter().map(|p| p.id).collect();
    assert!(ids.contains(&player_a_id)); // 【確認内容】: プレイヤーAが含まれている 🔵
    assert!(ids.contains(&player_b_id)); // 【確認内容】: プレイヤーBが含まれている 🔵
    assert!(!ids.contains(&player_c_id)); // 【確認内容】: プレイヤーCは含まれていない 🔵
}

// ============================================
// TC-FILTER-002: 複数タグでフィルタ（OR条件） 🔵
// ============================================

#[test]
fn test_filter_players_by_multiple_tags_or_condition() {
    // 【テスト目的】: 指定した複数タグのいずれかを持つプレイヤーが取得されることを確認
    // 【テスト内容】: OR条件フィルタリングが正しく動作することを検証
    // 【期待される動作】: タグAまたはタグBを持つプレイヤーが全て取得される（AND条件ではない）
    // 🔵 信頼性レベル: 要件定義（REQ-402: OR条件フィルタ）と Issue #21 実装詳細に基づく

    // 【テストデータ準備】: プレイヤー4人とタグ2つを作成
    // 【初期条件設定】: プレイヤーA（タグ1）、B（タグ2）、C（タグ1+2）、D（タグなし）
    let db = create_test_db();
    let player_a_id = insert_test_player(&db, "プレイヤーA", None);
    let player_b_id = insert_test_player(&db, "プレイヤーB", None);
    let player_c_id = insert_test_player(&db, "プレイヤーC", None);
    let player_d_id = insert_test_player(&db, "プレイヤーD", None);

    let tag1_id = insert_test_tag(&db, "アグレッシブ", "#FF0000", false);
    let tag2_id = insert_test_tag(&db, "ブラフ", "#00FF00", false);

    insert_test_player_tag(&db, player_a_id, tag1_id);
    insert_test_player_tag(&db, player_b_id, tag2_id);
    insert_test_player_tag(&db, player_c_id, tag1_id);
    insert_test_player_tag(&db, player_c_id, tag2_id);

    // 【実際の処理実行】: 複数タグでフィルタリング（OR条件）
    // 【処理内容】: tag_ids=[tag1_id, tag2_id] でプレイヤーを検索
    let result = filter_players_by_tags_internal(vec![tag1_id, tag2_id], Some(1), Some(20), &db);

    // 【結果検証】: いずれかのタグを持つプレイヤーが全て返されることを確認
    // 【期待値確認】: プレイヤーA、B、Cが含まれ、Dは除外される
    assert!(result.is_ok(), "複数タグOR条件フィルタが成功すること"); // 【確認内容】: フィルタ処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 3); // 【確認内容】: 3件のプレイヤーが取得される 🔵
    assert_eq!(response.total, 3); // 【確認内容】: 総件数が3件 🔵

    let ids: Vec<i64> = response.data.iter().map(|p| p.id).collect();
    assert!(ids.contains(&player_a_id)); // 【確認内容】: タグ1のみ持つプレイヤーAが含まれている 🔵
    assert!(ids.contains(&player_b_id)); // 【確認内容】: タグ2のみ持つプレイヤーBが含まれている 🔵
    assert!(ids.contains(&player_c_id)); // 【確認内容】: 両方持つプレイヤーCが含まれている 🔵
    assert!(!ids.contains(&player_d_id)); // 【確認内容】: タグなしのプレイヤーDは含まれていない 🔵
}

// ============================================
// TC-FILTER-003: デフォルトページネーション 🔵
// ============================================

#[test]
fn test_filter_players_default_pagination() {
    // 【テスト目的】: ページ指定なしでデフォルト20件取得できることを確認
    // 【テスト内容】: ページネーションのデフォルト動作（page=1, per_page=20）を検証
    // 【期待される動作】: page=1, per_page=20 として処理される
    // 🔵 信頼性レベル: 既存の `get_players` パターンを踏襲

    // 【テストデータ準備】: プレイヤー30人とタグ1つを作成し、全員にタグを割り当て
    // 【初期条件設定】: デフォルトページサイズ（20件）での動作を確認
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "テスト", "#FF0000", false);

    for i in 1..=30 {
        let player_id = insert_test_player(&db, &format!("プレイヤー{}", i), None);
        insert_test_player_tag(&db, player_id, tag_id);
    }

    // 【実際の処理実行】: ページ指定なしでフィルタリング
    // 【処理内容】: page=None, per_page=None でデフォルト値が適用される
    let result = filter_players_by_tags_internal(vec![tag_id], None, None, &db);

    // 【結果検証】: デフォルト20件が取得されることを確認
    // 【期待値確認】: ページネーション情報が正しく設定されている
    assert!(result.is_ok(), "デフォルトページネーションが成功すること"); // 【確認内容】: フィルタ処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 20); // 【確認内容】: 20件取得されている 🔵
    assert_eq!(response.total, 30); // 【確認内容】: 総件数が30件 🔵
    assert_eq!(response.page, 1); // 【確認内容】: 現在ページが1 🔵
    assert_eq!(response.per_page, 20); // 【確認内容】: 1ページ件数が20 🔵
    assert_eq!(response.total_pages, 2); // 【確認内容】: 総ページ数が2（ceil(30/20)） 🔵
}

// ============================================
// TC-FILTER-004: カスタムページネーション 🔵
// ============================================

#[test]
fn test_filter_players_custom_pagination() {
    // 【テスト目的】: per_page=50 でカスタムページサイズが機能することを確認
    // 【テスト内容】: ページサイズのカスタマイズが機能することを検証
    // 【期待される動作】: 指定した50件が取得される
    // 🔵 信頼性レベル: 既存の `get_players` パターンを踏襲

    // 【テストデータ準備】: プレイヤー100人とタグ1つを作成
    // 【初期条件設定】: カスタムページサイズ（50件）での動作を確認
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "テスト", "#FF0000", false);

    for i in 1..=100 {
        let player_id = insert_test_player(&db, &format!("プレイヤー{}", i), None);
        insert_test_player_tag(&db, player_id, tag_id);
    }

    // 【実際の処理実行】: per_page=50でフィルタリング
    // 【処理内容】: カスタムページサイズでの取得処理を実行
    let result = filter_players_by_tags_internal(vec![tag_id], Some(1), Some(50), &db);

    // 【結果検証】: 50件が取得されることを確認
    // 【期待値確認】: ページネーション情報がカスタム設定に従っている
    assert!(result.is_ok(), "カスタムページネーションが成功すること"); // 【確認内容】: フィルタ処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 50); // 【確認内容】: 50件取得されている 🔵
    assert_eq!(response.total, 100); // 【確認内容】: 総件数が100件 🔵
    assert_eq!(response.per_page, 50); // 【確認内容】: 1ページ件数が50 🔵
    assert_eq!(response.total_pages, 2); // 【確認内容】: 総ページ数が2（ceil(100/50)） 🔵
}

// ============================================
// TC-FILTER-005: 2ページ目の取得 🔵
// ============================================

#[test]
fn test_filter_players_page_two() {
    // 【テスト目的】: 2ページ目のデータが正しく取得できることを確認
    // 【テスト内容】: OFFSET計算の正確性を検証
    // 【期待される動作】: OFFSET計算が正確で、21～40件目が取得される
    // 🔵 信頼性レベル: 既存の `get_players` パターンを踏襲

    // 【テストデータ準備】: プレイヤー50人とタグ1つを作成
    // 【初期条件設定】: ページング計算の正確性を確認
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "テスト", "#FF0000", false);

    for i in 1..=50 {
        let player_id = insert_test_player(&db, &format!("プレイヤー{:03}", i), None);
        insert_test_player_tag(&db, player_id, tag_id);
    }

    // 【実際の処理実行】: 2ページ目を取得
    // 【処理内容】: OFFSET計算が正しく機能することを確認
    let result = filter_players_by_tags_internal(vec![tag_id], Some(2), Some(20), &db);

    // 【結果検証】: 2ページ目のデータが取得されることを確認
    // 【期待値確認】: OFFSET=20で21～40件目が取得される
    assert!(result.is_ok(), "2ページ目取得が成功すること"); // 【確認内容】: フィルタ処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 20); // 【確認内容】: 20件取得されている 🔵
    assert_eq!(response.page, 2); // 【確認内容】: 現在ページが2 🔵
}

// ============================================
// TC-FILTER-006: updated_at降順ソート確認 🔵
// ============================================

#[test]
fn test_filter_players_sorted_by_updated_at() {
    // 【テスト目的】: フィルタ結果が更新日時の降順で返されることを確認
    // 【テスト内容】: ORDER BY updated_at DESC の動作を検証
    // 【期待される動作】: 最近更新されたプレイヤーが先頭に表示される
    // 🔵 信頼性レベル: 要件定義（フィルタリング条件: updated_at降順ソート）に基づく

    // 【テストデータ準備】: プレイヤー3人を時間差で作成し、一部を更新
    // 【初期条件設定】: ソート順の確認用データ
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "テスト", "#FF0000", false);

    let player1_id = insert_test_player(&db, "プレイヤー1", None);
    insert_test_player_tag(&db, player1_id, tag_id);

    std::thread::sleep(std::time::Duration::from_millis(1100));
    let player2_id = insert_test_player(&db, "プレイヤー2", None);
    insert_test_player_tag(&db, player2_id, tag_id);

    std::thread::sleep(std::time::Duration::from_millis(1100));
    let player3_id = insert_test_player(&db, "プレイヤー3", None);
    insert_test_player_tag(&db, player3_id, tag_id);

    // player1を更新（最新にする）
    std::thread::sleep(std::time::Duration::from_millis(1100));
    update_player_internal(player1_id, Some("プレイヤー1（更新）"), None, &db)
        .expect("Failed to update player");

    // 【実際の処理実行】: タグでフィルタリング
    // 【処理内容】: updated_at降順でソートされることを確認
    let result = filter_players_by_tags_internal(vec![tag_id], Some(1), Some(10), &db);

    // 【結果検証】: updated_at降順でソートされることを確認
    // 【期待値確認】: 最新更新のplayer1が先頭
    assert!(result.is_ok(), "ソートが成功すること"); // 【確認内容】: フィルタ処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 3); // 【確認内容】: 3件取得されている 🔵
    assert_eq!(response.data[0].id, player1_id); // 【確認内容】: 最新更新が先頭であること 🔵
    assert_eq!(response.data[1].id, player3_id); // 【確認内容】: 2番目が次に新しいこと 🔵
    assert_eq!(response.data[2].id, player2_id); // 【確認内容】: 3番目が最も古いこと 🔵
}

// ============================================
// TC-FILTER-ERR-001: 空のtag_idsでエラー 🟡
// ============================================

#[test]
fn test_filter_players_empty_tag_ids_error() {
    // 【テスト目的】: tag_ids が空配列の場合、適切なエラーを返すことを確認
    // 【テスト内容】: 入力バリデーションが機能することを検証
    // 【期待される動作】: "Tag IDs cannot be empty" エラーが返される
    // 🟡 信頼性レベル: 要件定義（エッジケース: 空のtag_ids）に基づく

    // 【テストデータ準備】: 空のデータベース
    // 【初期条件設定】: バリデーションエラーを発生させる
    let db = create_test_db();

    // 【実際の処理実行】: 空のtag_idsでフィルタリング
    // 【処理内容】: バリデーションチェックが機能することを確認
    let result = filter_players_by_tags_internal(vec![], Some(1), Some(20), &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: "Tag IDs cannot be empty" エラーメッセージが含まれている
    assert!(result.is_err(), "空のtag_idsではエラーが返されること"); // 【確認内容】: エラーが発生している 🟡
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("Tag IDs") && error_message.contains("empty"),
        "エラーメッセージにTag IDsが空であることが含まれること"
    ); // 【確認内容】: 適切なエラーメッセージが返される 🟡
}

// ============================================
// TC-FILTER-ERR-002: 存在しないタグIDは結果0件 🟡
// ============================================

#[test]
fn test_filter_players_nonexistent_tag_returns_empty() {
    // 【テスト目的】: 存在しないタグIDでフィルタリングした場合、エラーではなく0件を返すことを確認
    // 【テスト内容】: 存在しないIDへの対応を検証
    // 【期待される動作】: エラーではなく空の結果が返される
    // 🟡 信頼性レベル: 要件定義（エッジケース: 存在しないタグID）に基づく

    // 【テストデータ準備】: プレイヤーを作成するが、タグは作成しない
    // 【初期条件設定】: 存在しないタグIDでの動作を確認
    let db = create_test_db();
    insert_test_player(&db, "プレイヤーA", None);

    // 【実際の処理実行】: 存在しないタグIDでフィルタリング
    // 【処理内容】: エラーではなく0件が返されることを確認
    let result = filter_players_by_tags_internal(vec![999], Some(1), Some(20), &db);

    // 【結果検証】: エラーではなく空の結果が返されることを確認
    // 【期待値確認】: data=[], total=0の空のPaginatedResponse
    assert!(result.is_ok(), "存在しないタグIDでもエラーにならないこと"); // 【確認内容】: エラーではなく成功している 🟡
    let response = result.unwrap();
    assert_eq!(response.data.len(), 0); // 【確認内容】: 0件が返される 🟡
    assert_eq!(response.total, 0); // 【確認内容】: 総件数が0件 🟡
}

// ============================================
// TC-FILTER-BOUND-001: per_page=1（最小値） 🔵
// ============================================

#[test]
fn test_filter_players_per_page_one() {
    // 【テスト目的】: per_page=1で1件ずつ取得できることを確認
    // 【テスト内容】: 最小ページサイズが機能することを検証
    // 【期待される動作】: 1件のみ取得される
    // 🔵 信頼性レベル: 既存の `get_players` パターンを踏襲

    // 【テストデータ準備】: プレイヤー3人とタグ1つを作成
    // 【初期条件設定】: 最小ページサイズでの動作を確認
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "テスト", "#FF0000", false);

    for i in 1..=3 {
        let player_id = insert_test_player(&db, &format!("プレイヤー{}", i), None);
        insert_test_player_tag(&db, player_id, tag_id);
    }

    // 【実際の処理実行】: per_page=1で取得
    // 【処理内容】: 最小境界値での取得処理を実行
    let result = filter_players_by_tags_internal(vec![tag_id], Some(1), Some(1), &db);

    // 【結果検証】: 1件のみ取得されることを確認
    // 【期待値確認】: LIMIT 1 が正しく適用される
    assert!(result.is_ok(), "per_page=1で取得できること"); // 【確認内容】: フィルタ処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 1); // 【確認内容】: 1件のみ取得されること 🔵
    assert_eq!(response.per_page, 1); // 【確認内容】: per_pageが1であること 🔵
}

// ============================================
// TC-FILTER-BOUND-002: per_page=100（最大値） 🔵
// ============================================

#[test]
fn test_filter_players_per_page_hundred() {
    // 【テスト目的】: per_page=100で100件まで取得できることを確認
    // 【テスト内容】: 最大ページサイズが機能することを検証
    // 【期待される動作】: 100件取得される（データが十分にある場合）
    // 🔵 信頼性レベル: 既存の `get_players` パターンを踏襲、NFR-003（パフォーマンス要件）に配慮

    // 【テストデータ準備】: プレイヤー150人とタグ1つを作成
    // 【初期条件設定】: 最大ページサイズでの動作を確認
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "テスト", "#FF0000", false);

    for i in 1..=150 {
        let player_id = insert_test_player(&db, &format!("プレイヤー{}", i), None);
        insert_test_player_tag(&db, player_id, tag_id);
    }

    // 【実際の処理実行】: per_page=100で取得
    // 【処理内容】: 最大境界値での取得処理を実行
    let result = filter_players_by_tags_internal(vec![tag_id], Some(1), Some(100), &db);

    // 【結果検証】: 100件取得されることを確認
    // 【期待値確認】: LIMIT 100 が正しく適用される
    assert!(result.is_ok(), "per_page=100で取得できること"); // 【確認内容】: フィルタ処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 100); // 【確認内容】: 100件取得されること 🔵
    assert_eq!(response.per_page, 100); // 【確認内容】: per_pageが100であること 🔵
    assert_eq!(response.total, 150); // 【確認内容】: 総件数が150件であること 🔵
}

// ============================================
// TC-FILTER-BOUND-003: page=0は1に補正 🟡
// ============================================

#[test]
fn test_filter_players_page_zero_correction() {
    // 【テスト目的】: page=0の場合、1に自動補正されることを確認
    // 【テスト内容】: 不正なページ番号の自動補正が機能することを検証
    // 【期待される動作】: エラーではなく、page=1として処理される
    // 🟡 信頼性レベル: 既存の `get_players` パターンを踏襲

    // 【テストデータ準備】: プレイヤー数人とタグ1つを作成
    // 【初期条件設定】: 不正なページ番号での動作を確認
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "テスト", "#FF0000", false);

    for i in 1..=5 {
        let player_id = insert_test_player(&db, &format!("プレイヤー{}", i), None);
        insert_test_player_tag(&db, player_id, tag_id);
    }

    // 【実際の処理実行】: page=0で取得
    // 【処理内容】: 自動補正が機能することを確認
    let result = filter_players_by_tags_internal(vec![tag_id], Some(0), Some(20), &db);

    // 【結果検証】: page=1として処理されることを確認
    // 【期待値確認】: エラーではなく補正される
    assert!(result.is_ok(), "page=0でもエラーにならないこと"); // 【確認内容】: エラーではなく成功している 🟡
    let response = result.unwrap();
    assert_eq!(response.page, 1); // 【確認内容】: pageが1に補正されること 🟡
    assert!(response.data.len() >= 5); // 【確認内容】: データが取得されること 🟡
}

// ============================================
// TC-FILTER-EDGE-001: 該当プレイヤーなし 🟡
// ============================================

#[test]
fn test_filter_players_no_matching_players() {
    // 【テスト目的】: 該当プレイヤーがいない場合は空の結果を返すことを確認
    // 【テスト内容】: 「該当なし」ケースの正常動作を検証
    // 【期待される動作】: エラーにせず、空の配列を返す
    // 🟡 信頼性レベル: 要件定義（エッジケース: 該当プレイヤーなし）に基づく

    // 【テストデータ準備】: タグを作成するが、そのタグを持つプレイヤーは作成しない
    // 【初期条件設定】: 該当なしケースでの動作を確認
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "未使用タグ", "#FF0000", false);
    insert_test_player(&db, "プレイヤーA", None); // タグを割り当てない

    // 【実際の処理実行】: 該当プレイヤーなしのタグでフィルタリング
    // 【処理内容】: 空の結果が返されることを確認
    let result = filter_players_by_tags_internal(vec![tag_id], Some(1), Some(20), &db);

    // 【結果検証】: 空の結果が返されることを確認
    // 【期待値確認】: data=[], total=0, total_pages=0
    assert!(result.is_ok(), "該当なしでもエラーにならないこと"); // 【確認内容】: エラーではなく成功している 🟡
    let response = result.unwrap();
    assert_eq!(response.data.len(), 0); // 【確認内容】: 空配列が返される 🟡
    assert_eq!(response.total, 0); // 【確認内容】: 総件数が0件 🟡
    assert_eq!(response.total_pages, 0); // 【確認内容】: 総ページ数が0 🟡
}

// ============================================
// TC-FILTER-EDGE-002: 複数タグを持つプレイヤーは1回のみ表示（DISTINCT確認） 🔵
// ============================================

#[test]
fn test_filter_players_distinct_no_duplicates() {
    // 【テスト目的】: 複数タグを持つプレイヤーが重複せずに1回のみ表示されることを確認
    // 【テスト内容】: DISTINCT動作を検証
    // 【期待される動作】: DISTINCTにより1回のみ表示される
    // 🔵 信頼性レベル: 要件定義（フィルタリング条件: 重複排除）に基づく

    // 【テストデータ準備】: プレイヤー1人に複数のタグを割り当て
    // 【初期条件設定】: 重複が発生する可能性のあるデータ
    let db = create_test_db();
    let player_id = insert_test_player(&db, "プレイヤーA", None);

    let tag1_id = insert_test_tag(&db, "タグ1", "#FF0000", false);
    let tag2_id = insert_test_tag(&db, "タグ2", "#00FF00", false);
    let tag3_id = insert_test_tag(&db, "タグ3", "#0000FF", false);

    insert_test_player_tag(&db, player_id, tag1_id);
    insert_test_player_tag(&db, player_id, tag2_id);
    insert_test_player_tag(&db, player_id, tag3_id);

    // 【実際の処理実行】: 複数タグでフィルタリング（プレイヤーAは全タグを持つ）
    // 【処理内容】: DISTINCT により重複排除されることを確認
    let result = filter_players_by_tags_internal(vec![tag1_id, tag2_id, tag3_id], Some(1), Some(20), &db);

    // 【結果検証】: プレイヤーが1回のみ表示されることを確認
    // 【期待値確認】: data.len()=1, total=1（重複なし）
    assert!(result.is_ok(), "DISTINCT処理が成功すること"); // 【確認内容】: フィルタ処理が成功している 🔵
    let response = result.unwrap();
    assert_eq!(response.data.len(), 1); // 【確認内容】: 1件のみ（重複なし） 🔵
    assert_eq!(response.total, 1); // 【確認内容】: 総件数も1件（重複カウントなし） 🔵
    assert_eq!(response.data[0].id, player_id); // 【確認内容】: プレイヤーAが含まれている 🔵
}

// ============================================
// TC-FILTER-EDGE-003: page超過で空データ 🟡
// ============================================

#[test]
fn test_filter_players_page_exceeds_total_pages() {
    // 【テスト目的】: 存在しないページ番号を指定した場合、空の結果を返すことを確認
    // 【テスト内容】: ページ超過時の動作を検証
    // 【期待される動作】: エラーにせず、空の配列を返す
    // 🟡 信頼性レベル: 要件定義（エッジケース: page超過）に基づく

    // 【テストデータ準備】: プレイヤー25人とタグ1つを作成（総ページ数は2）
    // 【初期条件設定】: 存在しないページ番号での動作を確認
    let db = create_test_db();
    let tag_id = insert_test_tag(&db, "テスト", "#FF0000", false);

    for i in 1..=25 {
        let player_id = insert_test_player(&db, &format!("プレイヤー{}", i), None);
        insert_test_player_tag(&db, player_id, tag_id);
    }

    // 【実際の処理実行】: 存在しないページ番号（3ページ目）でフィルタリング
    // 【処理内容】: ページ超過時に空の結果が返されることを確認
    let result = filter_players_by_tags_internal(vec![tag_id], Some(3), Some(20), &db);

    // 【結果検証】: 空の結果が返されることを確認
    // 【期待値確認】: data=[], total=25, total_pages=2（ページ超過でも総件数情報は保持）
    assert!(result.is_ok(), "ページ超過でもエラーにならないこと"); // 【確認内容】: エラーではなく成功している 🟡
    let response = result.unwrap();
    assert_eq!(response.data.len(), 0); // 【確認内容】: 空配列が返される 🟡
    assert_eq!(response.total, 25); // 【確認内容】: 総件数は保持される 🟡
    assert_eq!(response.page, 3); // 【確認内容】: 指定したページ番号が返される 🟡
}

// ============================================
// TC-FILTER-PERF-001: 500件データで1秒以内 🔵
// ============================================

#[test]
fn test_filter_players_performance_500_players() {
    // 【テスト目的】: 500件のプレイヤーデータでフィルタリングが1秒以内に完了することを確認
    // 【テスト内容】: パフォーマンス要件NFR-003（1秒以内の応答時間）の検証
    // 【期待される動作】: idx_player_tags_tag_idインデックスにより高速に処理される
    // 🔵 信頼性レベル: 要件定義（NFR-003: パフォーマンス要件）に基づく

    // 【テストデータ準備】: プレイヤー500人とタグ3つを作成し、ランダムに割り当て
    // 【初期条件設定】: 実運用規模のデータ量でのパフォーマンス確認
    let db = create_test_db();
    let tag1_id = insert_test_tag(&db, "タグ1", "#FF0000", false);
    let tag2_id = insert_test_tag(&db, "タグ2", "#00FF00", false);
    let tag3_id = insert_test_tag(&db, "タグ3", "#0000FF", false);

    // 500人のプレイヤーを作成し、各プレイヤーに1～2個のタグをランダム割り当て
    for i in 1..=500 {
        let player_id = insert_test_player(&db, &format!("プレイヤー{}", i), None);

        // タグ1は全員に割り当て
        insert_test_player_tag(&db, player_id, tag1_id);

        // タグ2は偶数番号のみ
        if i % 2 == 0 {
            insert_test_player_tag(&db, player_id, tag2_id);
        }

        // タグ3は3の倍数のみ
        if i % 3 == 0 {
            insert_test_player_tag(&db, player_id, tag3_id);
        }
    }

    // 【実際の処理実行】: タグ1でフィルタリング（500件該当）し、処理時間を測定
    // 【処理内容】: パフォーマンス要件（1秒以内）の検証
    let start = std::time::Instant::now();
    let result = filter_players_by_tags_internal(vec![tag1_id], Some(1), Some(100), &db);
    let elapsed = start.elapsed();

    // 【結果検証】: 1秒以内に処理が完了することを確認
    // 【期待値確認】: 処理時間が1秒未満であること
    assert!(result.is_ok(), "500件のフィルタリングが成功すること"); // 【確認内容】: フィルタ処理が成功している 🔵
    assert!(
        elapsed.as_secs() < 1,
        "処理時間が1秒未満であること（実際: {:?}）",
        elapsed
    ); // 【確認内容】: NFR-003パフォーマンス要件を満たしている 🔵

    let response = result.unwrap();
    assert_eq!(response.total, 500); // 【確認内容】: 全500件が該当している 🔵
    assert_eq!(response.data.len(), 100); // 【確認内容】: 1ページ目の100件が取得されている 🔵
    assert_eq!(response.total_pages, 5); // 【確認内容】: 総ページ数が5（ceil(500/100)） 🔵
}