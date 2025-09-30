use tauri::State;
use crate::database::connection::DatabaseConnection;
use crate::services::player_service::PlayerService;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Player {
    pub id: Option<i64>,
    pub name: String,
    pub identifier: Option<String>,
    pub player_type_id: Option<i64>,
    pub is_deleted: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub async fn get_players(
    db: State<'_, DatabaseConnection>,
) -> Result<Vec<Player>, String> {
    let service = PlayerService::new(&db);
    service.get_all_players()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_player(
    name: String,
    identifier: Option<String>,
    db: State<'_, DatabaseConnection>,
) -> Result<Player, String> {
    let service = PlayerService::new(&db);
    service.create_player(name, identifier)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_player(
    id: i64,
    name: String,
    identifier: Option<String>,
    db: State<'_, DatabaseConnection>,
) -> Result<Player, String> {
    let service = PlayerService::new(&db);
    service.update_player(id, name, identifier)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_player(
    id: i64,
    db: State<'_, DatabaseConnection>,
) -> Result<(), String> {
    let service = PlayerService::new(&db);
    service.delete_player(id)
        .await
        .map_err(|e| e.to_string())
}