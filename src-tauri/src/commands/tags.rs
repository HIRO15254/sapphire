use tauri::State;
use crate::database::connection::DatabaseConnection;
use crate::services::tag_service::TagService;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Tag {
    pub id: Option<i64>,
    pub name: String,
    pub color: Option<String>,
    pub is_deleted: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub async fn get_tags(
    db: State<'_, DatabaseConnection>,
) -> Result<Vec<Tag>, String> {
    let service = TagService::new(&db);
    service.get_all_tags()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_tag(
    name: String,
    color: Option<String>,
    db: State<'_, DatabaseConnection>,
) -> Result<Tag, String> {
    let service = TagService::new(&db);
    service.create_tag(name, color)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_tag(
    id: i64,
    name: String,
    color: Option<String>,
    db: State<'_, DatabaseConnection>,
) -> Result<Tag, String> {
    let service = TagService::new(&db);
    service.update_tag(id, name, color)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_tag(
    id: i64,
    db: State<'_, DatabaseConnection>,
) -> Result<(), String> {
    let service = TagService::new(&db);
    service.delete_tag(id)
        .await
        .map_err(|e| e.to_string())
}