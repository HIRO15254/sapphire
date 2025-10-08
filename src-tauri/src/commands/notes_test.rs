use super::notes::*;
use crate::database::PlayerDatabase;
use rusqlite::params;

// ============================================
// テストヘルパー関数
// ============================================

/// テスト用データベースを作成
fn create_test_db() -> PlayerDatabase {
    PlayerDatabase::new_test().expect("Failed to create test database")
}

/// テスト用のプレイヤーを作成
fn insert_test_player(db: &PlayerDatabase, name: &str) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO players (name) VALUES (?1)",
        params![name],
    )
    .expect("Failed to insert test player");
    conn.last_insert_rowid()
}

/// テスト用のメモを作成
fn insert_test_note(db: &PlayerDatabase, player_id: i64, content: &str) -> i64 {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, content],
    )
    .expect("Failed to insert test note");
    conn.last_insert_rowid()
}

// ============================================
// TC-CREATE-NOTE-001: 基本的なメモ作成 🔵
// ============================================

#[test]
fn test_create_note_basic() {
    // 【テスト目的】: プレイヤーに簡易メモを正常に作成できることを確認
    // 【テスト内容】: メモがplayer_notesテーブルに保存され、PlayerNoteエンティティが返される
    // 【期待される動作】: メモがデータベースに保存され、適切な構造が返される
    // 🔵 信頼性レベル: 要件定義書REQ-301, REQ-302に基づく

    // 【テストデータ準備】: 実際のユーザーが対戦メモとして記録する典型的なHTML内容
    // 【初期条件設定】: プレイヤーを事前に作成し、クリーンなデータベース状態を確保
    let db = create_test_db();
    let player_id = insert_test_player(&db, "山田太郎");

    // 【実際の処理実行】: メモ作成コマンドを呼び出し
    // 【処理内容】: HTML形式のメモ内容をplayer_notesテーブルに保存
    let result = create_note_internal(player_id, "<p>3ベット頻度が高い</p>", &db);

    // 【結果検証】: メモが正常に作成されることを確認
    // 【期待値確認】: PlayerNoteエンティティが返され、全フィールドが正しく設定される
    assert!(result.is_ok(), "メモ作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let note = result.unwrap();
    assert_eq!(note.player_id, player_id); // 【確認内容】: プレイヤーIDが正しく設定されている 🔵
    assert_eq!(note.content, "<p>3ベット頻度が高い</p>"); // 【確認内容】: メモ内容が正しく設定されている 🔵
    assert!(note.id > 0); // 【確認内容】: IDが自動採番されている 🔵
}

// ============================================
// TC-CREATE-NOTE-004: FTSトリガーが動作する 🔵
// ============================================

#[test]
fn test_create_note_fts_trigger() {
    // 【テスト目的】: メモ作成時にplayer_notes_aiトリガーが自動実行され、FTSテーブルが更新されることを確認
    // 【テスト内容】: player_notes_ftsテーブルにエントリが追加され、全文検索可能になる
    // 【期待される動作】: FTS5トリガーが自動実行され、検索インデックスが更新される
    // 🔵 信頼性レベル: schema.rs:121-124（トリガー定義）に基づく

    // 【テストデータ準備】: 全文検索対象となるメモ内容
    // 【初期条件設定】: プレイヤーを作成し、FTS同期を検証
    let db = create_test_db();
    let player_id = insert_test_player(&db, "佐藤次郎");

    // 【実際の処理実行】: メモを作成し、FTSトリガーが動作することを確認
    // 【処理内容】: メモ作成時にplayer_notes_ftsテーブルも自動更新される
    let result = create_note_internal(player_id, "<p>3ベット頻度が高い</p>", &db);
    assert!(result.is_ok(), "メモ作成が成功すること");
    let note = result.unwrap();

    // 【結果検証】: FTSテーブルにエントリが追加されていることを確認
    // 【期待値確認】: player_notes_ftsで検索可能になっている
    let conn = db.0.lock().unwrap();
    let fts_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes_fts WHERE note_id = ?1",
            params![note.id],
            |row| row.get(0),
        )
        .expect("Failed to query FTS table");
    assert_eq!(fts_count, 1); // 【確認内容】: FTSテーブルにエントリが追加されている 🔵
}

// ============================================
// TC-CREATE-NOTE-ERR-001: プレイヤーが存在しない 🔵
// ============================================

#[test]
fn test_create_note_player_not_found() {
    // 【テスト目的】: 存在しないplayer_idを指定した場合のエラーハンドリング
    // 【テスト内容】: 外部キー制約違反を防ぎ、データ整合性を保証
    // 【期待される動作】: "Player not found" エラーが返され、メモは作成されない
    // 🔵 信頼性レベル: 要件定義（エラーケース3）に基づく

    // 【テストデータ準備】: 存在しないIDを使用して外部キーエラーを発生させる
    // 【初期条件設定】: playersテーブルに存在しないIDを参照
    let db = create_test_db();

    // 【実際の処理実行】: 存在しないプレイヤーIDでメモ作成を試みる
    // 【処理内容】: プレイヤー存在チェックが機能することを確認
    let result = create_note_internal(999, "<p>メモ</p>", &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: "Player not found" エラーメッセージが含まれる
    assert!(result.is_err(), "存在しないプレイヤーIDではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("Player") && error_message.contains("not found"),
        "エラーメッセージにプレイヤー未検出が含まれること"
    ); // 【確認内容】: プレイヤー未検出のエラーメッセージが返される 🔵
}

// ============================================
// TC-CREATE-NOTE-ERR-002: contentが1MBを超過 🔵
// ============================================

#[test]
fn test_create_note_content_exceeds_limit() {
    // 【テスト目的】: メモサイズが1MB（1048576バイト）を超過した場合のバリデーションエラー
    // 【テスト内容】: データベース肥大化防止、パフォーマンス劣化防止
    // 【期待される動作】: "Note content exceeds 1MB limit" エラーが返され、メモは作成されない
    // 🔵 信頼性レベル: 要件定義EDGE-104に基づく

    // 【テストデータ準備】: 1MB + 1バイトの内容を生成してバリデーションエラーを発生させる
    // 【初期条件設定】: EDGE-104（メモ最大1MB）を超過
    let db = create_test_db();
    let player_id = insert_test_player(&db, "鈴木一郎");
    let large_content = "A".repeat(1048577); // 1MB + 1バイト

    // 【実際の処理実行】: 1MB超過のメモ作成を試みる
    // 【処理内容】: サイズ制限バリデーションが機能することを確認
    let result = create_note_internal(player_id, &large_content, &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: サイズ超過エラーメッセージが返される
    assert!(result.is_err(), "1MB超過ではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("1MB") && error_message.contains("limit"),
        "エラーメッセージにサイズ制限が含まれること"
    ); // 【確認内容】: サイズ超過のエラーメッセージが返される 🔵
}

// ============================================
// TC-CREATE-NOTE-ERR-003: メモ個数が100個を超過 🔵
// ============================================

#[test]
fn test_create_note_exceeds_count_limit() {
    // 【テスト目的】: 1プレイヤーに既に100個のメモが存在する状態で追加しようとした場合
    // 【テスト内容】: 1プレイヤーあたりのデータ量制限、データベース肥大化防止
    // 【期待される動作】: "Player has reached maximum note limit (100)" エラーが返される
    // 🔵 信頼性レベル: 要件定義EDGE-103に基づく

    // 【テストデータ準備】: プレイヤーに既に100個のメモを作成
    // 【初期条件設定】: EDGE-103（最大100個）を超過する状況を作る
    let db = create_test_db();
    let player_id = insert_test_player(&db, "田中花子");

    // 100個のメモを作成
    for i in 0..100 {
        insert_test_note(&db, player_id, &format!("<p>メモ{}</p>", i));
    }

    // 【実際の処理実行】: 101個目のメモ作成を試みる
    // 【処理内容】: 個数制限バリデーションが機能することを確認
    let result = create_note_internal(player_id, "<p>101個目のメモ</p>", &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: 個数制限エラーメッセージが返される
    assert!(result.is_err(), "100個超過ではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("100") && error_message.contains("limit"),
        "エラーメッセージに個数制限が含まれること"
    ); // 【確認内容】: 個数制限のエラーメッセージが返される 🔵
}

// ============================================
// TC-CREATE-NOTE-BOUND-001: contentが1MBちょうど 🔵
// ============================================

#[test]
fn test_create_note_content_at_1mb_limit() {
    // 【テスト目的】: サイズ制限の上限値での動作確認
    // 【テスト内容】: 1MBちょうどは許可される
    // 【期待される動作】: 1MBちょうどは制限内として処理される
    // 🔵 信頼性レベル: 要件定義EDGE-104に基づく

    // 【テストデータ準備】: 1MBちょうどの内容で境界値を検証
    // 【初期条件設定】: EDGE-104で定義された最大値
    let db = create_test_db();
    let player_id = insert_test_player(&db, "高橋三郎");
    let content_at_limit = "A".repeat(1048576); // 1MBちょうど

    // 【実際の処理実行】: 1MBちょうどのメモを作成
    // 【処理内容】: 境界値で正しく処理されることを確認
    let result = create_note_internal(player_id, &content_at_limit, &db);

    // 【結果検証】: 正常に作成されることを確認
    // 【期待値確認】: ちょうど1MBは制限内として成功する
    assert!(result.is_ok(), "1MBちょうどでは作成が成功すること"); // 【確認内容】: 作成処理が成功している 🔵
    let note = result.unwrap();
    assert_eq!(note.content.len(), 1048576); // 【確認内容】: 1MBちょうどのサイズが保存されている 🔵
}

// ============================================
// TC-UPDATE-NOTE-001: メモを更新できる 🔵
// ============================================

#[test]
fn test_update_note_basic() {
    // 【テスト目的】: メモ内容を正常に更新できることを確認
    // 【テスト内容】: player_notesテーブルのcontentが更新される
    // 【期待される動作】: メモ内容が新しい値に更新される
    // 🔵 信頼性レベル: 要件定義（update_note仕様）に基づく

    // 【テストデータ準備】: 事前にメモを作成してから更新を実行
    // 【初期条件設定】: プレイヤーとメモを作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "伊藤四郎");
    let note_id = insert_test_note(&db, player_id, "<p>古い内容</p>");

    // 【実際の処理実行】: メモ内容を更新
    // 【処理内容】: contentフィールドを新しい値に更新
    let result = update_note_internal(note_id, "<p>更新後の内容</p>", &db);

    // 【結果検証】: メモが正常に更新されることを確認
    // 【期待値確認】: 新しい内容が返される
    assert!(result.is_ok(), "メモ更新が成功すること"); // 【確認内容】: 更新処理が成功している 🔵
    let updated_note = result.unwrap();
    assert_eq!(updated_note.content, "<p>更新後の内容</p>"); // 【確認内容】: メモ内容が更新されている 🔵
}

// ============================================
// TC-UPDATE-NOTE-002: updated_atが自動更新される 🔵
// ============================================

#[test]
fn test_update_note_updates_timestamp() {
    // 【テスト目的】: メモ更新時にupdated_atが自動的に現在時刻に更新されることを確認
    // 【テスト内容】: updated_atが更新前より後の時刻になる
    // 【期待される動作】: updated_atのみが変更され、created_atは保持される
    // 🔵 信頼性レベル: 要件定義（updated_at自動更新）に基づく

    // 【テストデータ準備】: メモを作成してから少し待機して更新
    // 【初期条件設定】: 時間経過後のメモ更新を検証
    let db = create_test_db();
    let player_id = insert_test_player(&db, "渡辺五郎");
    let note_id = insert_test_note(&db, player_id, "<p>元の内容</p>");

    // 更新前のupdated_atを取得
    let conn = db.0.lock().unwrap();
    let original_updated_at: String = conn
        .query_row(
            "SELECT updated_at FROM player_notes WHERE id = ?1",
            params![note_id],
            |row| row.get(0),
        )
        .expect("Failed to get original updated_at");
    drop(conn);

    // 少し待機（タイムスタンプの差を確実にする）
    // SQLiteのCURRENT_TIMESTAMPは秒単位なので、1秒以上待機
    std::thread::sleep(std::time::Duration::from_secs(1));

    // 【実際の処理実行】: メモを更新
    // 【処理内容】: updated_atが自動更新されることを確認
    let result = update_note_internal(note_id, "<p>新しい内容</p>", &db);

    // 【結果検証】: updated_atが更新されることを確認
    // 【期待値確認】: updated_atが更新前より後の時刻になっている
    assert!(result.is_ok(), "メモ更新が成功すること");
    let updated_note = result.unwrap();
    assert_ne!(updated_note.updated_at, original_updated_at); // 【確認内容】: updated_atが更新されている 🔵
}

// ============================================
// TC-UPDATE-NOTE-ERR-001: メモが存在しない 🔵
// ============================================

#[test]
fn test_update_note_not_found() {
    // 【テスト目的】: 存在しないメモIDを指定した場合のエラーハンドリング
    // 【テスト内容】: 存在しないデータの更新試行を防ぐ
    // 【期待される動作】: "Note not found" エラーが返される
    // 🔵 信頼性レベル: 要件定義（エラーケース4）に基づく

    // 【テストデータ準備】: 存在しないメモIDを使用
    // 【初期条件設定】: player_notesテーブルに存在しないID
    let db = create_test_db();

    // 【実際の処理実行】: 存在しないメモIDで更新を試みる
    // 【処理内容】: メモ存在確認が機能することを確認
    let result = update_note_internal(999, "<p>更新内容</p>", &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: "Note not found" エラーメッセージが返される
    assert!(result.is_err(), "存在しないメモIDではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("Note") && error_message.contains("not found"),
        "エラーメッセージにメモ未検出が含まれること"
    ); // 【確認内容】: メモ未検出のエラーメッセージが返される 🔵
}

// ============================================
// TC-DELETE-NOTE-001: メモを削除できる 🔵
// ============================================

#[test]
fn test_delete_note_basic() {
    // 【テスト目的】: メモを正常に削除できることを確認
    // 【テスト内容】: player_notesテーブルからレコードが削除される
    // 【期待される動作】: メモがデータベースから削除される
    // 🔵 信頼性レベル: 要件定義（delete_note仕様）に基づく

    // 【テストデータ準備】: 事前にメモを作成してから削除
    // 【初期条件設定】: プレイヤーとメモを作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "加藤六郎");
    let note_id = insert_test_note(&db, player_id, "<p>削除対象</p>");

    // 【実際の処理実行】: メモを削除
    // 【処理内容】: DELETEクエリが正常実行されることを確認
    let result = delete_note_internal(note_id, &db);

    // 【結果検証】: 削除が成功することを確認
    // 【期待値確認】: Ok(())が返され、メモが削除されている
    assert!(result.is_ok(), "メモ削除が成功すること"); // 【確認内容】: 削除処理が成功している 🔵

    // 【追加検証】: メモが削除されていることを確認
    let conn = db.0.lock().unwrap();
    let note_exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes WHERE id = ?1",
            params![note_id],
            |row| row.get(0),
        )
        .expect("Failed to check note existence");
    assert_eq!(note_exists, 0); // 【確認内容】: メモが削除されている 🔵
}

// ============================================
// TC-DELETE-NOTE-ERR-001: メモが存在しない 🔵
// ============================================

#[test]
fn test_delete_note_not_found() {
    // 【テスト目的】: 存在しないメモIDを指定した場合のエラーハンドリング
    // 【テスト内容】: 存在しないデータの削除試行を防ぐ
    // 【期待される動作】: "Note not found" エラーが返される
    // 🔵 信頼性レベル: 要件定義（エラーケース4）に基づく

    // 【テストデータ準備】: 存在しないメモIDを使用
    // 【初期条件設定】: player_notesテーブルに存在しないID
    let db = create_test_db();

    // 【実際の処理実行】: 存在しないメモIDで削除を試みる
    // 【処理内容】: メモ存在確認が機能することを確認
    let result = delete_note_internal(999, &db);

    // 【結果検証】: エラーが返されることを確認
    // 【期待値確認】: "Note not found" エラーメッセージが返される
    assert!(result.is_err(), "存在しないメモIDではエラーが返されること"); // 【確認内容】: エラーが発生している 🔵
    let error_message = result.unwrap_err();
    assert!(
        error_message.contains("Note") && error_message.contains("not found"),
        "エラーメッセージにメモ未検出が含まれること"
    ); // 【確認内容】: メモ未検出のエラーメッセージが返される 🔵
}

// ============================================
// TC-GET-NOTES-001: プレイヤーのメモ一覧を取得 🔵
// ============================================

#[test]
fn test_get_player_notes_basic() {
    // 【テスト目的】: 指定プレイヤーのメモ一覧を正常に取得できることを確認
    // 【テスト内容】: player_idに関連するすべてのメモがVec<PlayerNote>で返される
    // 【期待される動作】: プレイヤーのメモ一覧が取得できる
    // 🔵 信頼性レベル: 要件定義（get_player_notes仕様）に基づく

    // 【テストデータ準備】: プレイヤーに3個のメモを作成
    // 【初期条件設定】: メモ一覧を表示したいプレイヤーID
    let db = create_test_db();
    let player_id = insert_test_player(&db, "山本七郎");
    insert_test_note(&db, player_id, "<p>メモ1</p>");
    insert_test_note(&db, player_id, "<p>メモ2</p>");
    insert_test_note(&db, player_id, "<p>メモ3</p>");

    // 【実際の処理実行】: プレイヤーのメモ一覧を取得
    // 【処理内容】: player_idに関連する全メモを取得
    let result = get_player_notes_internal(player_id, &db);

    // 【結果検証】: メモ一覧が取得されることを確認
    // 【期待値確認】: 3件のメモが返される
    assert!(result.is_ok(), "メモ一覧取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let notes = result.unwrap();
    assert_eq!(notes.len(), 3); // 【確認内容】: 3件のメモが取得されている 🔵
}

// ============================================
// TC-GET-NOTES-002: updated_at降順でソートされる 🔵
// ============================================

#[test]
fn test_get_player_notes_sorted_by_updated_at() {
    // 【テスト目的】: メモ一覧がupdated_at降順（新しい順）でソートされることを確認
    // 【テスト内容】: 最近更新されたメモが先頭に来る
    // 【期待される動作】: updated_atで降順ソートされる
    // 🔵 信頼性レベル: 要件定義（get_player_notes仕様）に基づく

    // 【テストデータ準備】: 時系列で管理されたメモ一覧
    // 【初期条件設定】: 3個のメモを時間差で作成
    let db = create_test_db();
    let player_id = insert_test_player(&db, "中村八郎");

    let note1_id = insert_test_note(&db, player_id, "<p>古いメモ</p>");
    std::thread::sleep(std::time::Duration::from_secs(1));
    let note2_id = insert_test_note(&db, player_id, "<p>中間メモ</p>");
    std::thread::sleep(std::time::Duration::from_secs(1));
    let note3_id = insert_test_note(&db, player_id, "<p>新しいメモ</p>");

    // 【実際の処理実行】: メモ一覧を取得
    // 【処理内容】: updated_at降順でソートされたメモ一覧を取得
    let result = get_player_notes_internal(player_id, &db);

    // 【結果検証】: 新しい順にソートされることを確認
    // 【期待値確認】: note3, note2, note1 の順序
    assert!(result.is_ok(), "メモ一覧取得が成功すること");
    let notes = result.unwrap();
    assert_eq!(notes.len(), 3);
    assert_eq!(notes[0].id, note3_id); // 【確認内容】: 最新のメモが先頭 🔵
    assert_eq!(notes[1].id, note2_id); // 【確認内容】: 中間のメモが2番目 🔵
    assert_eq!(notes[2].id, note1_id); // 【確認内容】: 古いメモが最後 🔵
}

// ============================================
// TC-GET-NOTES-003: 空配列を返す（メモ0個） 🔵
// ============================================

#[test]
fn test_get_player_notes_empty_list() {
    // 【テスト目的】: メモが0個のプレイヤーでも正常に空配列が返されることを確認
    // 【テスト内容】: エラーではなく、Ok(vec![])が返される
    // 【期待される動作】: メモ0個はエラーではなく、空配列として扱う
    // 🔵 信頼性レベル: 要件定義EDGE-201に基づく

    // 【テストデータ準備】: まだメモを作成していないプレイヤー
    // 【初期条件設定】: メモ0個の状態
    let db = create_test_db();
    let player_id = insert_test_player(&db, "小林九郎");

    // 【実際の処理実行】: メモ一覧を取得
    // 【処理内容】: メモが0個でも正常動作することを確認
    let result = get_player_notes_internal(player_id, &db);

    // 【結果検証】: 空配列が返されることを確認
    // 【期待値確認】: Ok(vec![])、Errではない
    assert!(result.is_ok(), "メモ0個でも取得が成功すること"); // 【確認内容】: 取得処理が成功している 🔵
    let notes = result.unwrap();
    assert_eq!(notes.len(), 0); // 【確認内容】: 空配列が返されている 🔵
}
