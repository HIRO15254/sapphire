// Player Note Tauri Commands
// 🔵 青信号: メインのDatabase構造体を使用した統合コマンド

use tauri::{State, command};
use crate::Database;
use super::database::{health_check, get_database_stats, DatabaseStats};
// エラー型は必要に応じてインポート
use super::types::*;

/// Player Noteヘルスチェック
/// メインのデータベース接続を使用してヘルスチェックを実行
#[command]
pub async fn playernote_health_check(db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    match health_check(&*conn) {
        Ok(healthy) => Ok(healthy),
        Err(e) => Err(e.to_string()),
    }
}

/// Player Noteデータベース統計
/// メインのデータベースから統計情報を取得
#[command]
pub async fn playernote_database_stats(db: State<'_, Database>) -> Result<DatabaseStats, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    match get_database_stats(&*conn) {
        Ok(stats) => Ok(stats),
        Err(e) => Err(e.to_string()),
    }
}

/// 全プレイヤー一覧取得
/// メインデータベースからプレイヤー一覧を取得するサンプル実装
#[command]
pub async fn get_all_players(db: State<'_, Database>) -> Result<Vec<Player>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, player_type_id, created_at, updated_at FROM players ORDER BY name")
        .map_err(|e| e.to_string())?;

    let player_iter = stmt
        .query_map([], |row| {
            Ok(Player {
                id: row.get(0)?,
                name: row.get(1)?,
                player_type_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut players = Vec::new();
    for player in player_iter {
        players.push(player.map_err(|e| e.to_string())?);
    }

    Ok(players)
}

/// プレイヤー作成
/// メインデータベースを使用した新規プレイヤー作成
#[command]
pub async fn create_player(
    db: State<'_, Database>,
    name: String,
    player_type_id: Option<String>,
) -> Result<Player, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // プレイヤー名のバリデーション
    if name.trim().is_empty() {
        return Err("プレイヤー名は必須です".to_string());
    }

    // 重複チェック
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM players WHERE name = ?1)",
            [&name],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if exists {
        return Err("同名のプレイヤーが既に存在します".to_string());
    }

    // プレイヤータイプの存在確認（指定されている場合のみ）
    if let Some(ref type_id) = player_type_id {
        let type_exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM player_types WHERE id = ?1)",
                [type_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        if !type_exists {
            return Err("指定されたプレイヤータイプが存在しません".to_string());
        }
    }

    // プレイヤー作成
    match &player_type_id {
        Some(type_id) => {
            conn.execute(
                "INSERT INTO players (name, player_type_id) VALUES (?1, ?2)",
                [&name, type_id],
            )
        },
        None => {
            conn.execute(
                "INSERT INTO players (name) VALUES (?1)",
                [&name],
            )
        }
    }
    .map_err(|e| e.to_string())?;

    // 作成されたプレイヤーを取得
    let player = conn
        .query_row(
            "SELECT id, name, player_type_id, created_at, updated_at FROM players WHERE name = ?1 ORDER BY created_at DESC LIMIT 1",
            [&name],
            |row| {
                Ok(Player {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    player_type_id: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(player)
}

/// プレイヤータイプ一覧取得
#[command]
pub async fn get_player_types(db: State<'_, Database>) -> Result<Vec<PlayerType>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, color, created_at, updated_at FROM player_types ORDER BY name")
        .map_err(|e| e.to_string())?;

    let type_iter = stmt
        .query_map([], |row| {
            Ok(PlayerType {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut types = Vec::new();
    for player_type in type_iter {
        types.push(player_type.map_err(|e| e.to_string())?);
    }

    Ok(types)
}

/// タグ一覧取得
#[command]
pub async fn get_all_tags(db: State<'_, Database>) -> Result<Vec<Tag>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, color, created_at, updated_at FROM tags ORDER BY name")
        .map_err(|e| e.to_string())?;

    let tag_iter = stmt
        .query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut tags = Vec::new();
    for tag in tag_iter {
        tags.push(tag.map_err(|e| e.to_string())?);
    }

    Ok(tags)
}

// Tauriコマンドは tauri::generate_handler! マクロで自動登録されます