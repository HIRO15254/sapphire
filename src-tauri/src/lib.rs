use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

// Data structures
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: Option<i64>,
    pub name: String,
    pub email: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: Option<i64>,
    pub title: String,
    pub content: Option<String>,
    pub user_id: i64,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUser {
    pub name: String,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNote {
    pub title: String,
    pub content: Option<String>,
    pub user_id: i64,
}

// Database connection wrapper
pub struct Database(pub Mutex<Connection>);

impl Database {
    pub fn new(app_handle: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        // Get the app data directory
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;

        // Ensure the directory exists
        fs::create_dir_all(&app_data_dir)?;

        // Create the database file path
        let db_path = app_data_dir.join("sapphire.db");
        let conn = Connection::open(&db_path)?;

        // Create tables
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                user_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )",
            [],
        )?;

        Ok(Database(Mutex::new(conn)))
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_users(db: State<'_, Database>) -> Result<Vec<User>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let user_iter = stmt
        .query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut users = Vec::new();
    for user in user_iter {
        users.push(user.map_err(|e| e.to_string())?);
    }

    Ok(users)
}

#[tauri::command]
async fn create_user(db: State<'_, Database>, user: CreateUser) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO users (name, email) VALUES (?1, ?2)",
        params![user.name, user.email],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn delete_user(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM users WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn get_notes(db: State<'_, Database>) -> Result<Vec<Note>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, title, content, user_id, created_at, updated_at FROM notes ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;

    let note_iter = stmt
        .query_map([], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                user_id: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut notes = Vec::new();
    for note in note_iter {
        notes.push(note.map_err(|e| e.to_string())?);
    }

    Ok(notes)
}

#[tauri::command]
async fn create_note(db: State<'_, Database>, note: CreateNote) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO notes (title, content, user_id) VALUES (?1, ?2, ?3)",
        params![note.title, note.content, note.user_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn delete_note(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM notes WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db = Database::new(app.handle()).expect("Failed to initialize database");
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_users,
            create_user,
            delete_user,
            get_notes,
            create_note,
            delete_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet_command() {
        let result = greet("World");
        assert_eq!(result, "Hello, World! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_empty_name() {
        let result = greet("");
        assert_eq!(result, "Hello, ! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_with_special_characters() {
        let result = greet("John Doe");
        assert_eq!(result, "Hello, John Doe! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_with_unicode() {
        let result = greet("世界");
        assert_eq!(result, "Hello, 世界! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_with_numbers() {
        let result = greet("User123");
        assert_eq!(result, "Hello, User123! You've been greeted from Rust!");
    }
}
