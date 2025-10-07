use crate::database::models::{
    validate_hex_color, CreateTagRequest, Tag, UpdateTagRequest, NAME_MAX_LENGTH, NAME_MIN_LENGTH,
};
use crate::database::PlayerDatabase;
use rusqlite::{params, Connection};

// ============================================
// ヘルパー関数（DRY原則による共通化）
// ============================================

/// 【ヘルパー関数】: タグ名のバリデーション 🔵
/// 【再利用性】: create_tag, update_tagで共通利用 🔵
/// 【単一責任】: 名前の長さチェックのみを担当 🔵
fn validate_tag_name(name: &str) -> Result<(), String> {
    let name_len = name.chars().count();
    if !(NAME_MIN_LENGTH..=NAME_MAX_LENGTH).contains(&name_len) {
        return Err(format!(
            "Tag name must be between {} and {} characters, got: {}",
            NAME_MIN_LENGTH, NAME_MAX_LENGTH, name_len
        ));
    }
    Ok(())
}

/// 【ヘルパー関数】: タグ存在確認 🔵
/// 【再利用性】: update_tag, delete_tagで共通利用 🔵
/// 【単一責任】: タグIDの存在チェックのみを担当 🔵
/// 【エラーハンドリング】: 存在しない場合は明確なエラーメッセージを返す 🔵
fn check_tag_exists(conn: &Connection, id: i64) -> Result<(), String> {
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tags WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Database error: {}", e))?;

    if exists == 0 {
        return Err("Tag not found".to_string());
    }
    Ok(())
}

/// 【ヘルパー関数】: タグ情報を取得 🔵
/// 【再利用性】: create_tag, update_tagで共通利用 🔵
/// 【単一責任】: IDからTagエンティティを構築するのみを担当 🔵
/// 【パフォーマンス】: 単一のクエリで必要な情報を全て取得 🔵
fn get_tag_by_id(conn: &Connection, id: i64) -> Result<Tag, String> {
    conn.query_row(
        "SELECT id, name, color, has_intensity, created_at, updated_at FROM tags WHERE id = ?1",
        params![id],
        |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                has_intensity: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    )
    .map_err(|e| format!("Tag not found: {}", e))
}

/// 【ヘルパー関数】: タグ名のUNIQUE制約チェック 🟡
/// 【再利用性】: create_tag, update_tagで共通利用 🟡
/// 【単一責任】: 名前の重複チェックのみを担当 🟡
/// 【改善内容】: コード重複を削減し、DRY原則を適用 🟡
fn check_tag_name_unique(
    conn: &Connection,
    name: &str,
    exclude_id: Option<i64>,
) -> Result<(), String> {
    let exists: i64 = if let Some(id) = exclude_id {
        // 【更新時】: 自分自身を除外して重複チェック 🔵
        conn.query_row(
            "SELECT COUNT(*) FROM tags WHERE name = ?1 AND id != ?2",
            params![name, id],
            |row| row.get(0),
        )
    } else {
        // 【作成時】: 同名のタグが存在しないかチェック 🔵
        conn.query_row(
            "SELECT COUNT(*) FROM tags WHERE name = ?1",
            params![name],
            |row| row.get(0),
        )
    }
    .map_err(|e| format!("Database error: {}", e))?;

    if exists > 0 {
        return Err("Tag name already exists".to_string());
    }
    Ok(())
}

// ============================================
// CRUDコマンド実装
// ============================================

/// タグを作成
///
/// # Arguments
/// * `name` - タグ名（1～50文字、UNIQUE）
/// * `color` - HEXカラーコード（#RRGGBB形式）
/// * `has_intensity` - 強度設定あり/なし
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<Tag, String>` - 作成されたタグまたはエラーメッセージ
///
/// 【機能概要】: タグを作成する 🔵
/// 【設計方針】: ヘルパー関数を活用してコードの重複を削減、可読性を向上 🔵
/// 【テスト対応】: TC-CREATE-TAG-001～003, TC-CREATE-TAG-ERR-001～006, TC-CREATE-TAG-BOUND-001～002, TC-CREATE-TAG-HEX-001～003 🔵
pub(super) fn create_tag_internal(
    name: &str,
    color: &str,
    has_intensity: bool,
    db: &PlayerDatabase,
) -> Result<Tag, String> {
    // 【入力値検証】: ヘルパー関数を使用した名前バリデーション 🔵
    validate_tag_name(name)?;

    // 【色バリデーション】: HEXカラーコード形式チェック 🔵
    validate_hex_color(color)?;

    let conn = db.0.lock().unwrap();

    // 【UNIQUE制約チェック】: ヘルパー関数を使用した重複チェック 🟡
    // 【改善内容】: 共通ヘルパー関数により、コード重複を削減 🟡
    check_tag_name_unique(&conn, name, None)?;

    // 【タグ作成】: tagsテーブルにINSERT 🔵
    conn.execute(
        "INSERT INTO tags (name, color, has_intensity) VALUES (?1, ?2, ?3)",
        params![name, color, has_intensity],
    )
    .map_err(|e| format!("Failed to insert tag: {}", e))?;

    let tag_id = conn.last_insert_rowid();

    // 【タグ取得】: ヘルパー関数を使用して作成したタグ情報を返す 🔵
    get_tag_by_id(&conn, tag_id)
}

/// タグを更新
///
/// # Arguments
/// * `id` - タグID
/// * `name` - 新しいタグ名（オプション）
/// * `color` - 新しいHEXカラーコード（オプション）
/// * `has_intensity` - 新しい強度設定（オプション）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<Tag, String>` - 更新されたタグまたはエラーメッセージ
///
/// 【機能概要】: タグを部分更新 🔵
/// 【設計方針】: ヘルパー関数を活用してコードの重複を削減 🔵
/// 【テスト対応】: TC-UPDATE-TAG-001～004, TC-UPDATE-TAG-ERR-001～002 🔵
pub(super) fn update_tag_internal(
    id: i64,
    name: Option<&str>,
    color: Option<&str>,
    has_intensity: Option<bool>,
    db: &PlayerDatabase,
) -> Result<Tag, String> {
    let conn = db.0.lock().unwrap();

    // 【タグ存在確認】: ヘルパー関数を使用した存在チェック 🔵
    check_tag_exists(&conn, id)?;

    // 【名前バリデーション】: ヘルパー関数を使用した名前チェック 🔵
    if let Some(new_name) = name {
        validate_tag_name(new_name)?;

        // 【UNIQUE制約チェック】: ヘルパー関数を使用した重複チェック 🟡
        // 【改善内容】: 共通ヘルパー関数により、コード重複を削減 🟡
        check_tag_name_unique(&conn, new_name, Some(id))?;
    }

    // 【色バリデーション】: HEXカラーコード形式チェック 🔵
    if let Some(new_color) = color {
        validate_hex_color(new_color)?;
    }

    // 【部分更新実装】: name、color、has_intensityが指定された場合のみ更新 🔵
    match (name, color, has_intensity) {
        (Some(new_name), Some(new_color), Some(new_intensity)) => {
            // 全フィールド更新
            conn.execute(
                "UPDATE tags SET name = ?1, color = ?2, has_intensity = ?3, updated_at = CURRENT_TIMESTAMP WHERE id = ?4",
                params![new_name, new_color, new_intensity, id],
            )
        }
        (Some(new_name), Some(new_color), None) => {
            // 名前と色のみ更新
            conn.execute(
                "UPDATE tags SET name = ?1, color = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
                params![new_name, new_color, id],
            )
        }
        (Some(new_name), None, Some(new_intensity)) => {
            // 名前と強度設定のみ更新
            conn.execute(
                "UPDATE tags SET name = ?1, has_intensity = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
                params![new_name, new_intensity, id],
            )
        }
        (None, Some(new_color), Some(new_intensity)) => {
            // 色と強度設定のみ更新
            conn.execute(
                "UPDATE tags SET color = ?1, has_intensity = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
                params![new_color, new_intensity, id],
            )
        }
        (Some(new_name), None, None) => {
            // 名前のみ更新
            conn.execute(
                "UPDATE tags SET name = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                params![new_name, id],
            )
        }
        (None, Some(new_color), None) => {
            // 色のみ更新
            conn.execute(
                "UPDATE tags SET color = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                params![new_color, id],
            )
        }
        (None, None, Some(new_intensity)) => {
            // 強度設定のみ更新
            conn.execute(
                "UPDATE tags SET has_intensity = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                params![new_intensity, id],
            )
        }
        (None, None, None) => {
            // 何も更新しないが、エラーにはしない（updated_atのみ更新）
            conn.execute(
                "UPDATE tags SET updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
                params![id],
            )
        }
    }
    .map_err(|e| format!("Failed to update tag: {}", e))?;

    // 【更新後のタグ取得】: ヘルパー関数を使用して更新されたタグ情報を返す 🔵
    get_tag_by_id(&conn, id)
}

/// タグを削除
///
/// # Arguments
/// * `id` - タグID
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<(), String>` - 成功またはエラーメッセージ
///
/// 【機能概要】: タグを削除（ON DELETE CASCADEにより該当player_tagsレコードも自動削除） 🔵
/// 【設計方針】: ヘルパー関数を活用してコードの重複を削減 🔵
/// 【テスト対応】: TC-DELETE-TAG-001, TC-DELETE-TAG-CASCADE-001, TC-DELETE-TAG-ERR-001 🔵
pub(super) fn delete_tag_internal(id: i64, db: &PlayerDatabase) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    // 【タグ存在確認】: ヘルパー関数を使用した存在チェック 🔵
    check_tag_exists(&conn, id)?;

    // 【タグ削除】: DELETE実行（ON DELETE CASCADEは外部キー制約で自動実行） 🔵
    // スキーマ定義: ON DELETE CASCADE により、該当 player_tags のレコードも自動削除
    conn.execute("DELETE FROM tags WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete tag: {}", e))?;

    Ok(())
}

/// 全タグを取得
///
/// # Arguments
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<Vec<Tag>, String>` - 全タグのリストまたはエラーメッセージ
///
/// 【機能概要】: 全タグをcreated_at昇順で取得 🔵
/// 【設計方針】: シンプルなSELECT文でマスタデータ全件取得 🔵
/// 【テスト対応】: TC-GET-ALL-TAGS-001～002 🔵
pub(super) fn get_all_tags_internal(db: &PlayerDatabase) -> Result<Vec<Tag>, String> {
    let conn = db.0.lock().unwrap();

    // 【全タグ取得】: created_at昇順でソート 🔵
    let mut stmt = conn
        .prepare(
            "SELECT id, name, color, has_intensity, created_at, updated_at
             FROM tags
             ORDER BY created_at ASC",
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let tags = stmt
        .query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                has_intensity: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
        .map_err(|e| format!("Failed to query tags: {}", e))?
        .collect::<Result<Vec<Tag>, _>>()
        .map_err(|e| format!("Failed to collect tags: {}", e))?;

    // 【レスポンス構築】: Vec<Tag>を返す 🔵
    Ok(tags)
}

// ============================================
// Tauri コマンド（外部公開）
// ============================================

/// タグを作成
#[tauri::command]
pub fn create_tag(
    request: CreateTagRequest,
    state: tauri::State<PlayerDatabase>,
) -> Result<Tag, String> {
    create_tag_internal(&request.name, &request.color, request.has_intensity, &state)
}

/// タグを更新
#[tauri::command]
pub fn update_tag(
    request: UpdateTagRequest,
    state: tauri::State<PlayerDatabase>,
) -> Result<Tag, String> {
    update_tag_internal(
        request.id,
        request.name.as_deref(),
        request.color.as_deref(),
        request.has_intensity,
        &state,
    )
}

/// タグを削除
#[tauri::command]
pub fn delete_tag(id: i64, state: tauri::State<PlayerDatabase>) -> Result<(), String> {
    delete_tag_internal(id, &state)
}

/// 全タグを取得
#[tauri::command]
pub fn get_all_tags(state: tauri::State<PlayerDatabase>) -> Result<Vec<Tag>, String> {
    get_all_tags_internal(&state)
}
