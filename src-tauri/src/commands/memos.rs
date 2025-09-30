use tauri::State;
use crate::database::connection::DatabaseConnection;
use crate::services::memo_service::MemoService;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Memo {
    pub id: Option<i64>,
    pub player_id: i64,
    pub content: String,
    pub is_deleted: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub async fn get_player_memos(
    player_id: i64,
    db: State<'_, DatabaseConnection>,
) -> Result<Vec<Memo>, String> {
    let service = MemoService::new(&db);
    service.get_player_memos(player_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_memo(
    player_id: i64,
    content: String,
    db: State<'_, DatabaseConnection>,
) -> Result<Memo, String> {
    let service = MemoService::new(&db);
    service.create_memo(player_id, content)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_memo(
    id: i64,
    content: String,
    db: State<'_, DatabaseConnection>,
) -> Result<Memo, String> {
    let service = MemoService::new(&db);
    service.update_memo(id, content)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_memo(
    id: i64,
    db: State<'_, DatabaseConnection>,
) -> Result<(), String> {
    let service = MemoService::new(&db);
    service.delete_memo(id)
        .await
        .map_err(|e| e.to_string())
}