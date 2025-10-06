use crate::database::models::{validate_hex_color, PlayerCategory, NAME_MAX_LENGTH, NAME_MIN_LENGTH};
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
    _name: &str,
    _color: &str,
    _db: &PlayerDatabase,
) -> Result<PlayerCategory, String> {
    // TODO: Greenフェーズで実装
    // 【実装予定】: 名前バリデーション、色バリデーション、UNIQUE制約チェック、INSERT実行
    Err("Not implemented".to_string())
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
    _id: i64,
    _name: Option<&str>,
    _color: Option<&str>,
    _db: &PlayerDatabase,
) -> Result<PlayerCategory, String> {
    // TODO: Greenフェーズで実装
    // 【実装予定】: 存在確認、名前バリデーション、色バリデーション、部分更新、updated_at自動更新
    Err("Not implemented".to_string())
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
pub(crate) fn delete_category_internal(_id: i64, _db: &PlayerDatabase) -> Result<(), String> {
    // TODO: Greenフェーズで実装
    // 【実装予定】: 存在確認、DELETE実行（ON DELETE SET NULLは自動実行）
    Err("Not implemented".to_string())
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
    _db: &PlayerDatabase,
) -> Result<Vec<PlayerCategory>, String> {
    // TODO: Greenフェーズで実装
    // 【実装予定】: SELECT * ORDER BY created_at ASC
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn get_all_categories(
    db: State<'_, PlayerDatabase>,
) -> Result<Vec<PlayerCategory>, String> {
    get_all_categories_internal(&db)
}
