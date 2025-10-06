use crate::database::models::{
    validate_hex_color, PlayerCategory, NAME_MAX_LENGTH, NAME_MIN_LENGTH,
};
use crate::database::PlayerDatabase;
use rusqlite::{params, Connection};
use tauri::State;

// ============================================
// ヘルパー関数（DRY原則による共通化）
// ============================================

/// 【ヘルパー関数】: 種別名のバリデーション 🔵
/// 【再利用性】: create_category, update_categoryで共通利用 🔵
/// 【単一責任】: 名前の長さチェックのみを担当 🔵
fn validate_category_name(name: &str) -> Result<(), String> {
    let name_len = name.chars().count();
    if !(NAME_MIN_LENGTH..=NAME_MAX_LENGTH).contains(&name_len) {
        return Err(format!(
            "Category name must be between {} and {} characters, got: {}",
            NAME_MIN_LENGTH, NAME_MAX_LENGTH, name_len
        ));
    }
    Ok(())
}

/// 【ヘルパー関数】: 種別存在確認 🔵
/// 【再利用性】: update_category, delete_categoryで共通利用 🔵
/// 【単一責任】: 種別IDの存在チェックのみを担当 🔵
/// 【エラーハンドリング】: 存在しない場合は明確なエラーメッセージを返す 🔵
fn check_category_exists(conn: &Connection, id: i64) -> Result<(), String> {
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_categories WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Database error: {}", e))?;

    if exists == 0 {
        return Err("Category not found".to_string());
    }
    Ok(())
}

/// 【ヘルパー関数】: 種別情報を取得 🔵
/// 【再利用性】: create_category, update_categoryで共通利用 🔵
/// 【単一責任】: IDからPlayerCategoryエンティティを構築するのみを担当 🔵
/// 【パフォーマンス】: 単一のクエリで必要な情報を全て取得 🔵
fn get_category_by_id(conn: &Connection, id: i64) -> Result<PlayerCategory, String> {
    conn.query_row(
        "SELECT id, name, color, created_at, updated_at FROM player_categories WHERE id = ?1",
        params![id],
        |row| {
            Ok(PlayerCategory {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| format!("Category not found: {}", e))
}

/// 【ヘルパー関数】: 種別名のUNIQUE制約チェック 🟡
/// 【再利用性】: create_category, update_categoryで共通利用 🟡
/// 【単一責任】: 名前の重複チェックのみを担当 🟡
/// 【改善内容】: コード重複を削減し、DRY原則を適用 🟡
fn check_category_name_unique(
    conn: &Connection,
    name: &str,
    exclude_id: Option<i64>,
) -> Result<(), String> {
    let exists: i64 = if let Some(id) = exclude_id {
        // 【更新時】: 自分自身を除外して重複チェック 🔵
        conn.query_row(
            "SELECT COUNT(*) FROM player_categories WHERE name = ?1 AND id != ?2",
            params![name, id],
            |row| row.get(0),
        )
    } else {
        // 【作成時】: 同名の種別が存在しないかチェック 🔵
        conn.query_row(
            "SELECT COUNT(*) FROM player_categories WHERE name = ?1",
            params![name],
            |row| row.get(0),
        )
    }
    .map_err(|e| format!("Database error: {}", e))?;

    if exists > 0 {
        return Err("Category name already exists".to_string());
    }
    Ok(())
}

// ============================================
// CRUDコマンド実装
// ============================================

/// プレイヤー種別を作成
///
/// # Arguments
/// * `name` - 種別名（1～50文字、UNIQUE）
/// * `color` - HEXカラーコード（#RRGGBB形式）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<PlayerCategory, String>` - 作成された種別またはエラーメッセージ
///
/// 【機能概要】: プレイヤー種別を作成する 🔵
/// 【設計方針】: ヘルパー関数を活用してコードの重複を削減、可読性を向上 🔵
/// 【テスト対応】: TC-CREATE-CAT-001～002, TC-CREATE-CAT-ERR-001～004, TC-CREATE-CAT-BOUND-001～002 🔵
pub(crate) fn create_category_internal(
    name: &str,
    color: &str,
    db: &PlayerDatabase,
) -> Result<PlayerCategory, String> {
    // 【入力値検証】: ヘルパー関数を使用した名前バリデーション 🔵
    validate_category_name(name)?;

    // 【色バリデーション】: HEXカラーコード形式チェック 🔵
    validate_hex_color(color)?;

    let conn = db.0.lock().unwrap();

    // 【UNIQUE制約チェック】: ヘルパー関数を使用した重複チェック 🟡
    // 【改善内容】: 共通ヘルパー関数により、コード重複を削減 🟡
    check_category_name_unique(&conn, name, None)?;

    // 【種別作成】: player_categoriesテーブルにINSERT 🔵
    conn.execute(
        "INSERT INTO player_categories (name, color) VALUES (?1, ?2)",
        params![name, color],
    )
    .map_err(|e| format!("Failed to insert category: {}", e))?;

    let category_id = conn.last_insert_rowid();

    // 【種別取得】: ヘルパー関数を使用して作成した種別情報を返す 🔵
    get_category_by_id(&conn, category_id)
}

#[tauri::command]
pub async fn create_category(
    name: String,
    color: String,
    db: State<'_, PlayerDatabase>,
) -> Result<PlayerCategory, String> {
    create_category_internal(&name, &color, &db)
}

/// プレイヤー種別を更新
///
/// # Arguments
/// * `id` - 種別ID
/// * `name` - 新しい種別名（オプション）
/// * `color` - 新しいHEXカラーコード（オプション）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<PlayerCategory, String>` - 更新された種別またはエラーメッセージ
///
/// 【機能概要】: プレイヤー種別を部分更新 🔵
/// 【設計方針】: ヘルパー関数を活用してコードの重複を削減 🔵
/// 【テスト対応】: TC-UPDATE-CAT-001～003, TC-UPDATE-CAT-ERR-001～002, TC-UPDATE-CAT-BOUND-001～002 🔵
pub(crate) fn update_category_internal(
    id: i64,
    name: Option<&str>,
    color: Option<&str>,
    db: &PlayerDatabase,
) -> Result<PlayerCategory, String> {
    let conn = db.0.lock().unwrap();

    // 【種別存在確認】: ヘルパー関数を使用した存在チェック 🔵
    check_category_exists(&conn, id)?;

    // 【名前バリデーション】: ヘルパー関数を使用した名前チェック 🔵
    if let Some(new_name) = name {
        validate_category_name(new_name)?;

        // 【UNIQUE制約チェック】: ヘルパー関数を使用した重複チェック 🟡
        // 【改善内容】: 共通ヘルパー関数により、コード重複を削減 🟡
        check_category_name_unique(&conn, new_name, Some(id))?;
    }

    // 【色バリデーション】: HEXカラーコード形式チェック 🔵
    if let Some(new_color) = color {
        validate_hex_color(new_color)?;
    }

    // 【部分更新実装】: nameまたはcolorが指定された場合のみ更新 🔵
    match (name, color) {
        (Some(new_name), Some(new_color)) => {
            // 両方更新
            conn.execute(
                "UPDATE player_categories SET name = ?1, color = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
                params![new_name, new_color, id],
            )
        }
        (Some(new_name), None) => {
            // 名前のみ更新
            conn.execute(
                "UPDATE player_categories SET name = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                params![new_name, id],
            )
        }
        (None, Some(new_color)) => {
            // 色のみ更新
            conn.execute(
                "UPDATE player_categories SET color = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                params![new_color, id],
            )
        }
        (None, None) => {
            // 何も更新しないが、エラーにはしない（updated_atのみ更新）
            conn.execute(
                "UPDATE player_categories SET updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
                params![id],
            )
        }
    }
    .map_err(|e| format!("Failed to update category: {}", e))?;

    // 【更新後の種別取得】: ヘルパー関数を使用して更新された種別情報を返す 🔵
    get_category_by_id(&conn, id)
}

#[tauri::command]
pub async fn update_category(
    id: i64,
    name: Option<String>,
    color: Option<String>,
    db: State<'_, PlayerDatabase>,
) -> Result<PlayerCategory, String> {
    update_category_internal(id, name.as_deref(), color.as_deref(), &db)
}

/// プレイヤー種別を削除
///
/// # Arguments
/// * `id` - 種別ID
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<(), String>` - 成功またはエラーメッセージ
///
/// 【機能概要】: プレイヤー種別を削除（ON DELETE SET NULLにより該当プレイヤーのcategory_idはNULLに） 🔵
/// 【設計方針】: ヘルパー関数を活用してコードの重複を削減 🔵
/// 【テスト対応】: TC-DELETE-CAT-001, TC-DELETE-CAT-ERR-001, TC-DELETE-CAT-CASCADE-001 🔵
pub(crate) fn delete_category_internal(id: i64, db: &PlayerDatabase) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    // 【種別存在確認】: ヘルパー関数を使用した存在チェック 🔵
    check_category_exists(&conn, id)?;

    // 【種別削除】: DELETE実行（ON DELETE SET NULLは外部キー制約で自動実行） 🔵
    // スキーマ定義: ON DELETE SET NULL により、該当プレイヤーの category_id が NULL に
    conn.execute("DELETE FROM player_categories WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete category: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_category(id: i64, db: State<'_, PlayerDatabase>) -> Result<(), String> {
    delete_category_internal(id, &db)
}

/// 全種別を取得
///
/// # Arguments
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<Vec<PlayerCategory>, String>` - 全種別のリストまたはエラーメッセージ
///
/// 【機能概要】: 全種別をcreated_at昇順で取得 🔵
/// 【設計方針】: シンプルなSELECT文でマスタデータ全件取得 🔵
/// 【テスト対応】: TC-GET-ALL-CAT-001～002, TC-GET-ALL-CAT-SORT-001 🔵
pub(crate) fn get_all_categories_internal(
    db: &PlayerDatabase,
) -> Result<Vec<PlayerCategory>, String> {
    let conn = db.0.lock().unwrap();

    // 【全種別取得】: created_at昇順でソート 🔵
    let mut stmt = conn
        .prepare(
            "SELECT id, name, color, created_at, updated_at
             FROM player_categories
             ORDER BY created_at ASC",
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let categories = stmt
        .query_map([], |row| {
            Ok(PlayerCategory {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| format!("Failed to query categories: {}", e))?
        .collect::<Result<Vec<PlayerCategory>, _>>()
        .map_err(|e| format!("Failed to collect categories: {}", e))?;

    // 【レスポンス構築】: Vec<PlayerCategory>を返す 🔵
    Ok(categories)
}

#[tauri::command]
pub async fn get_all_categories(
    db: State<'_, PlayerDatabase>,
) -> Result<Vec<PlayerCategory>, String> {
    get_all_categories_internal(&db)
}
