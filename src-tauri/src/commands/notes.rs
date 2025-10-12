use crate::database::models::{PlayerNote, NOTE_CONTENT_MAX_BYTES};
use crate::database::PlayerDatabase;
use rusqlite::{params, Connection};
use tauri::State;

// ============================================
// ヘルパー関数（DRY原則による共通化）
// ============================================

/// 【ヘルパー関数】: メモ内容のサイズバリデーション 🔵
/// 【再利用性】: create_note, update_noteで共通利用 🔵
/// 【単一責任】: contentサイズチェックのみを担当 🔵
/// 【テスト対応】: TC-CREATE-NOTE-ERR-002, TC-UPDATE-NOTE-ERR-002, TC-CREATE-NOTE-BOUND-001 🔵
fn validate_note_content_size(content: &str) -> Result<(), String> {
    if content.len() > NOTE_CONTENT_MAX_BYTES {
        return Err("Note content exceeds 1MB limit".to_string());
    }
    Ok(())
}

/// 【ヘルパー関数】: プレイヤーのメモ個数チェック（最大100個） 🔵
/// 【再利用性】: create_noteで利用 🔵
/// 【単一責任】: メモ個数の制限チェックのみを担当 🔵
/// 【エラーハンドリング】: 100個に達している場合は明確なエラーメッセージを返す 🔵
/// 【セキュリティ】: DoS攻撃防止のため個数制限を実装 🔵
/// 【テスト対応】: TC-CREATE-NOTE-ERR-003, TC-CREATE-NOTE-BOUND-003, TC-CREATE-NOTE-BOUND-004 🔵
fn check_player_note_count(conn: &Connection, player_id: i64) -> Result<(), String> {
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes WHERE player_id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .map_err(|_| "Failed to check note count".to_string())?; // 【セキュリティ改善】: DB詳細を隠蔽 🔵

    if count >= 100 {
        return Err("Player has reached maximum note limit (100)".to_string());
    }
    Ok(())
}

/// 【ヘルパー関数】: メモ存在確認 🔵
/// 【再利用性】: update_note, delete_noteで共通利用 🔵
/// 【単一責任】: メモIDの存在チェックのみを担当 🔵
/// 【エラーハンドリング】: 存在しない場合は明確なエラーメッセージを返す 🔵
/// 【セキュリティ】: 不正なIDアクセスを防止し、DB詳細を隠蔽 🔵
/// 【テスト対応】: TC-UPDATE-NOTE-ERR-001, TC-DELETE-NOTE-ERR-001 🔵
fn check_note_exists(conn: &Connection, id: i64) -> Result<(), String> {
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_notes WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|_| "Failed to check note existence".to_string())?; // 【セキュリティ改善】: DB詳細を隠蔽 🔵

    if exists == 0 {
        return Err("Note not found".to_string());
    }
    Ok(())
}

/// 【ヘルパー関数】: プレイヤー存在確認 🔵
/// 【再利用性】: create_note, get_player_notesで共通利用 🔵
/// 【単一責任】: プレイヤーIDの存在チェックのみを担当 🔵
/// 【エラーハンドリング】: 存在しない場合は明確なエラーメッセージを返す 🔵
/// 【セキュリティ】: 不正なIDアクセスを防止し、DB詳細を隠蔽 🔵
/// 【テスト対応】: TC-CREATE-NOTE-ERR-001, TC-GET-NOTES-ERR-001 🔵
fn check_player_exists(conn: &Connection, player_id: i64) -> Result<(), String> {
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM players WHERE id = ?1",
            params![player_id],
            |row| row.get(0),
        )
        .map_err(|_| "Failed to check player existence".to_string())?; // 【セキュリティ改善】: DB詳細を隠蔽 🔵

    if exists == 0 {
        return Err("Player not found".to_string());
    }
    Ok(())
}

/// 【ヘルパー関数】: メモ情報を取得 🔵
/// 【再利用性】: create_note, update_noteで共通利用 🔵
/// 【単一責任】: IDからPlayerNoteエンティティを構築するのみを担当 🔵
/// 【パフォーマンス】: 単一のクエリで必要な情報を全て取得 🔵
/// 【セキュリティ】: DB詳細を隠蔽し、一般的なエラーメッセージを返す 🔵
fn get_note_by_id(conn: &Connection, id: i64) -> Result<PlayerNote, String> {
    conn.query_row(
        "SELECT id, player_id, content, created_at, updated_at FROM player_notes WHERE id = ?1",
        params![id],
        |row| {
            Ok(PlayerNote {
                id: row.get(0)?,
                player_id: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(|_| "Note not found".to_string()) // 【セキュリティ改善】: DB詳細を隠蔽 🔵
}

// ============================================
// CRUD内部関数（テスタビリティ）
// ============================================

/// プレイヤーのメモを作成する
///
/// # Arguments
/// * `player_id` - プレイヤーID
/// * `content` - HTML形式のメモ内容（最大1MB）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<PlayerNote, String>` - 作成されたメモまたはエラーメッセージ
///
/// 【機能概要】: プレイヤーにメモを作成し、FTSトリガーで自動的に検索インデックスを更新 🔵
/// 【実装方針】: バリデーション→存在確認→個数チェック→INSERT→取得の順で処理 🔵
/// 【設計方針】: ヘルパー関数を活用して単一責任原則を遵守 🔵
/// 【テスト対応】: TC-CREATE-NOTE-001, TC-CREATE-NOTE-004, TC-CREATE-NOTE-005 🔵
/// 【テスト対応】: TC-CREATE-NOTE-ERR-001, TC-CREATE-NOTE-ERR-002, TC-CREATE-NOTE-ERR-003 🔵
/// 【テスト対応】: TC-CREATE-NOTE-BOUND-001, TC-CREATE-NOTE-BOUND-002 🔵
pub(crate) fn create_note_internal(
    player_id: i64,
    content: &str,
    db: &PlayerDatabase,
) -> Result<PlayerNote, String> {
    // 【入力値検証】: ヘルパー関数を使用したcontentサイズバリデーション 🔵
    validate_note_content_size(content)?;

    let conn = db.0.lock().unwrap();

    // 【プレイヤー存在確認】: ヘルパー関数を使用したプレイヤー存在チェック 🔵
    check_player_exists(&conn, player_id)?;

    // 【個数制限チェック】: ヘルパー関数を使用したメモ個数チェック（最大100個） 🔵
    check_player_note_count(&conn, player_id)?;

    // 【メモ作成】: player_notesテーブルにINSERT 🔵
    // 【FTSトリガー自動実行】: player_notes_aiトリガーが自動実行され、FTSテーブルにも追加される 🔵
    // 【セキュリティ】: パラメータ化クエリでSQLインジェクション対策 🔵
    conn.execute(
        "INSERT INTO player_notes (player_id, content) VALUES (?1, ?2)",
        params![player_id, content],
    )
    .map_err(|_| "Failed to insert note".to_string())?; // 【セキュリティ改善】: DB詳細を隠蔽 🔵

    let note_id = conn.last_insert_rowid();

    // 【メモ取得】: ヘルパー関数を使用して作成したメモ情報を返す 🔵
    get_note_by_id(&conn, note_id)
}

/// メモを更新する
///
/// # Arguments
/// * `id` - メモID
/// * `content` - 新しいHTML形式のメモ内容（最大1MB）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<PlayerNote, String>` - 更新されたメモまたはエラーメッセージ
///
/// 【機能概要】: メモ内容を更新し、updated_atを自動更新、FTSトリガーで検索インデックスを同期 🔵
/// 【実装方針】: バリデーション→存在確認→UPDATE→取得の順で処理 🔵
/// 【設計方針】: ヘルパー関数を活用して単一責任原則を遵守 🔵
/// 【テスト対応】: TC-UPDATE-NOTE-001, TC-UPDATE-NOTE-002, TC-UPDATE-NOTE-003 🔵
/// 【テスト対応】: TC-UPDATE-NOTE-ERR-001, TC-UPDATE-NOTE-ERR-002 🔵
/// 【テスト対応】: TC-UPDATE-NOTE-BOUND-001 🔵
pub(crate) fn update_note_internal(
    id: i64,
    content: &str,
    db: &PlayerDatabase,
) -> Result<PlayerNote, String> {
    // 【入力値検証】: ヘルパー関数を使用したcontentサイズバリデーション 🔵
    validate_note_content_size(content)?;

    let conn = db.0.lock().unwrap();

    // 【メモ存在確認】: ヘルパー関数を使用したメモ存在チェック 🔵
    check_note_exists(&conn, id)?;

    // 【メモ更新】: player_notesテーブルのcontentとupdated_atを更新 🔵
    // 【updated_at自動更新】: CURRENT_TIMESTAMPで自動的に現在時刻に更新される 🔵
    // 【FTSトリガー自動実行】: player_notes_auトリガーが自動実行され、FTSテーブルも同期更新される 🔵
    // 【セキュリティ】: パラメータ化クエリでSQLインジェクション対策 🔵
    conn.execute(
        "UPDATE player_notes SET content = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        params![content, id],
    )
    .map_err(|_| "Failed to update note".to_string())?; // 【セキュリティ改善】: DB詳細を隠蔽 🔵

    // 【メモ取得】: ヘルパー関数を使用して更新後のメモ情報を返す 🔵
    get_note_by_id(&conn, id)
}

/// メモを削除する
///
/// # Arguments
/// * `id` - メモID
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<(), String>` - 成功またはエラーメッセージ
///
/// 【機能概要】: メモを削除し、FTSトリガーで検索インデックスからも削除 🔵
/// 【実装方針】: 存在確認→DELETEの順で処理 🔵
/// 【設計方針】: ヘルパー関数を活用して単一責任原則を遵守 🔵
/// 【テスト対応】: TC-DELETE-NOTE-001, TC-DELETE-NOTE-002 🔵
/// 【テスト対応】: TC-DELETE-NOTE-ERR-001 🔵
pub(crate) fn delete_note_internal(id: i64, db: &PlayerDatabase) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    // 【メモ存在確認】: ヘルパー関数を使用したメモ存在チェック 🔵
    check_note_exists(&conn, id)?;

    // 【メモ削除】: player_notesテーブルからDELETE 🔵
    // 【FTSトリガー自動実行】: player_notes_adトリガーが自動実行され、FTSテーブルからも削除される 🔵
    // 【セキュリティ】: パラメータ化クエリでSQLインジェクション対策 🔵
    conn.execute("DELETE FROM player_notes WHERE id = ?1", params![id])
        .map_err(|_| "Failed to delete note".to_string())?; // 【セキュリティ改善】: DB詳細を隠蔽 🔵

    Ok(())
}

/// プレイヤーのメモ一覧を取得する
///
/// # Arguments
/// * `player_id` - プレイヤーID
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<Vec<PlayerNote>, String>` - メモ一覧またはエラーメッセージ
///
/// 【機能概要】: プレイヤーの全メモをupdated_at降順で取得（空配列の可能性あり） 🔵
/// 【実装方針】: プレイヤー存在確認→SELECT→結果変換の順で処理 🔵
/// 【設計方針】: ヘルパー関数を活用して単一責任原則を遵守 🔵
/// 【テスト対応】: TC-GET-NOTES-001, TC-GET-NOTES-002, TC-GET-NOTES-003 🔵
/// 【テスト対応】: TC-GET-NOTES-ERR-001 🔵
pub(crate) fn get_player_notes_internal(
    player_id: i64,
    db: &PlayerDatabase,
) -> Result<Vec<PlayerNote>, String> {
    let conn = db.0.lock().unwrap();

    // 【プレイヤー存在確認】: ヘルパー関数を使用したプレイヤー存在チェック 🔵
    check_player_exists(&conn, player_id)?;

    // 【メモ一覧取得】: player_notesテーブルからSELECT（updated_at降順） 🔵
    // 【ソート順】: updated_at DESC で新しい順にソート 🔵
    // 【パフォーマンス】: インデックス(idx_player_notes_updated_at)を活用した効率的なソート 🔵
    let mut stmt = conn
        .prepare(
            "SELECT id, player_id, content, created_at, updated_at
             FROM player_notes
             WHERE player_id = ?1
             ORDER BY updated_at DESC",
        )
        .map_err(|_| "Failed to prepare query".to_string())?; // 【セキュリティ改善】: DB詳細を隠蔽 🔵

    let notes_iter = stmt
        .query_map(params![player_id], |row| {
            Ok(PlayerNote {
                id: row.get(0)?,
                player_id: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|_| "Failed to query notes".to_string())?; // 【セキュリティ改善】: DB詳細を隠蔽 🔵

    // 【結果変換】: Iterator<Result<PlayerNote>>からVec<PlayerNote>に変換 🔵
    // 【パフォーマンス】: collect()を使用した効率的な変換 🔵
    notes_iter
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| "Failed to parse note".to_string()) // 【セキュリティ改善】: DB詳細を隠蔽 🔵
                                                         // 【空配列対応】: メモが0件の場合は空配列を返す（エラーではない） 🔵
}

// ============================================
// Tauri コマンド
// ============================================

/// メモ作成
#[tauri::command]
pub async fn create_player_note(
    player_id: i64,
    content: String,
    db: State<'_, PlayerDatabase>,
) -> Result<PlayerNote, String> {
    create_note_internal(player_id, &content, &db)
}

/// メモ更新
#[tauri::command]
pub async fn update_player_note(
    id: i64,
    content: String,
    db: State<'_, PlayerDatabase>,
) -> Result<PlayerNote, String> {
    update_note_internal(id, &content, &db)
}

/// メモ削除
#[tauri::command]
pub async fn delete_player_note(id: i64, db: State<'_, PlayerDatabase>) -> Result<(), String> {
    delete_note_internal(id, &db)
}

/// プレイヤーのメモ一覧取得
#[tauri::command]
pub async fn get_player_notes(
    player_id: i64,
    db: State<'_, PlayerDatabase>,
) -> Result<Vec<PlayerNote>, String> {
    get_player_notes_internal(player_id, &db)
}
