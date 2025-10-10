use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

// Player note database module
pub mod database;

// Player CRUD commands module
pub mod commands;

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

#[derive(Debug, Serialize, Deserialize, Clone)]
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
        // Check if running in test mode
        if std::env::var("TAURI_TEST_MODE").is_ok() {
            return Self::new_test_e2e(app_handle);
        }

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

        Self::create_tables(&conn)?;
        Ok(Database(Mutex::new(conn)))
    }

    fn new_test_e2e(app_handle: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        // Get the app data directory
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;

        // Create test database directory
        let test_db_dir = app_data_dir.join("test_databases");
        fs::create_dir_all(&test_db_dir)?;

        // Create a unique test database file path
        let test_id = std::env::var("TAURI_TEST_ID").unwrap_or_else(|_| {
            use std::time::{SystemTime, UNIX_EPOCH};
            let timestamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis();
            format!("test_{}", timestamp)
        });
        let db_path = test_db_dir.join(format!("sapphire_test_{}.db", test_id));

        let conn = Connection::open(&db_path)?;
        Self::create_tables(&conn)?;
        Ok(Database(Mutex::new(conn)))
    }

    pub fn new_with_path(db_path: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let conn = Connection::open(db_path)?;
        Self::create_tables(&conn)?;
        Ok(Database(Mutex::new(conn)))
    }

    pub fn new_test() -> Result<Self, Box<dyn std::error::Error>> {
        let conn = Connection::open(":memory:")?;
        Self::create_tables(&conn)?;
        Ok(Database(Mutex::new(conn)))
    }

    fn create_tables(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
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

        Ok(())
    }

    pub fn cleanup_test_databases(
        app_handle: &AppHandle,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if let Ok(app_data_dir) = app_handle.path().app_data_dir() {
            let test_db_dir = app_data_dir.join("test_databases");
            if test_db_dir.exists() {
                for entry in fs::read_dir(test_db_dir)? {
                    let entry = entry?;
                    let path = entry.path();
                    if path.is_file() {
                        if let Some(file_name) = path.file_name() {
                            if let Some(name_str) = file_name.to_str() {
                                if name_str.starts_with("sapphire_test_")
                                    && name_str.ends_with(".db")
                                {
                                    let _ = fs::remove_file(path);
                                }
                            }
                        }
                    }
                }
            }
        }
        Ok(())
    }

    pub fn cleanup_specific_test_database(
        app_handle: &AppHandle,
        test_id: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if let Ok(app_data_dir) = app_handle.path().app_data_dir() {
            let test_db_dir = app_data_dir.join("test_databases");
            let db_path = test_db_dir.join(format!("sapphire_test_{}.db", test_id));
            if db_path.exists() {
                fs::remove_file(db_path)?;
            }
        }
        Ok(())
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

#[tauri::command]
async fn cleanup_test_db(app: tauri::AppHandle, test_id: String) -> Result<(), String> {
    Database::cleanup_specific_test_database(&app, &test_id).map_err(|e| e.to_string())
}

// Seed database commands (development only)
#[tauri::command]
async fn seed_database_small(app: tauri::AppHandle) -> Result<String, String> {
    #[cfg(not(debug_assertions))]
    {
        return Err("Seeding is only available in debug mode".to_string());
    }

    #[cfg(debug_assertions)]
    {
        let player_db = database::PlayerDatabase::new(&app).map_err(|e| e.to_string())?;
        let conn = player_db.0.lock().map_err(|e| e.to_string())?;
        database::seed::seed_small(&conn).map_err(|e| e.to_string())?;
        Ok("Successfully seeded 50 players".to_string())
    }
}

#[tauri::command]
async fn seed_database_medium(app: tauri::AppHandle) -> Result<String, String> {
    #[cfg(not(debug_assertions))]
    {
        return Err("Seeding is only available in debug mode".to_string());
    }

    #[cfg(debug_assertions)]
    {
        let player_db = database::PlayerDatabase::new(&app).map_err(|e| e.to_string())?;
        let conn = player_db.0.lock().map_err(|e| e.to_string())?;
        database::seed::seed_medium(&conn).map_err(|e| e.to_string())?;
        Ok("Successfully seeded 200 players".to_string())
    }
}

#[tauri::command]
async fn seed_database_large(app: tauri::AppHandle) -> Result<String, String> {
    #[cfg(not(debug_assertions))]
    {
        return Err("Seeding is only available in debug mode".to_string());
    }

    #[cfg(debug_assertions)]
    {
        let player_db = database::PlayerDatabase::new(&app).map_err(|e| e.to_string())?;
        let conn = player_db.0.lock().map_err(|e| e.to_string())?;
        database::seed::seed_large(&conn).map_err(|e| e.to_string())?;
        Ok("Successfully seeded 500 players".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db = Database::new(app.handle()).expect("Failed to initialize database");
            app.manage(db);

            // PlayerDatabase for player notes
            let player_db = database::PlayerDatabase::new(app.handle())
                .expect("Failed to initialize player database");
            app.manage(player_db);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_users,
            create_user,
            delete_user,
            get_notes,
            create_note,
            delete_note,
            cleanup_test_db,
            seed_database_small,
            seed_database_medium,
            seed_database_large,
            // Player notes commands (簡易メモ)
            commands::notes::create_player_note,
            commands::notes::update_player_note,
            commands::notes::delete_player_note,
            commands::notes::get_player_notes,
            // Player CRUD commands
            commands::players::create_player,
            commands::players::get_players,
            commands::players::update_player,
            commands::players::delete_player,
            commands::players::get_player_detail,
            commands::players::search_players_by_name
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    // Test database helper
    fn create_test_database() -> Database {
        Database::new_test().expect("Failed to create test database")
    }

    // Helper to insert test user
    fn insert_test_user(db: &Database, name: &str, email: &str) -> i64 {
        let conn = db.0.lock().unwrap();
        conn.execute(
            "INSERT INTO users (name, email) VALUES (?1, ?2)",
            params![name, email],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    // Unit tests for greet command
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

    // Database tests
    #[tokio::test]
    async fn test_create_and_get_users() {
        let db = create_test_database();

        // Direct database test
        let user_data = CreateUser {
            name: "John Doe".to_string(),
            email: "john@example.com".to_string(),
        };

        // Test creating a user directly
        {
            let conn = db.0.lock().unwrap();
            conn.execute(
                "INSERT INTO users (name, email) VALUES (?1, ?2)",
                params![user_data.name, user_data.email],
            )
            .unwrap();
        }

        // Test getting users directly
        let conn = db.0.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC")
            .unwrap();
        let user_iter = stmt
            .query_map([], |row| {
                Ok(User {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    email: row.get(2)?,
                    created_at: row.get(3)?,
                })
            })
            .unwrap();

        let users: Vec<User> = user_iter.map(|u| u.unwrap()).collect();
        assert_eq!(users.len(), 1);
        assert_eq!(users[0].name, "John Doe");
        assert_eq!(users[0].email, "john@example.com");
        assert!(users[0].id.is_some());
        assert!(users[0].created_at.is_some());
    }

    #[tokio::test]
    async fn test_create_user_duplicate_email() {
        let db = create_test_database();

        // First user should succeed
        {
            let conn = db.0.lock().unwrap();
            let result = conn.execute(
                "INSERT INTO users (name, email) VALUES (?1, ?2)",
                params!["John Doe", "john@example.com"],
            );
            assert!(result.is_ok());
        }

        // Second user with same email should fail
        {
            let conn = db.0.lock().unwrap();
            let result = conn.execute(
                "INSERT INTO users (name, email) VALUES (?1, ?2)",
                params!["Jane Doe", "john@example.com"], // Same email
            );
            assert!(result.is_err());
            assert!(result
                .unwrap_err()
                .to_string()
                .contains("UNIQUE constraint failed"));
        }
    }

    #[tokio::test]
    async fn test_delete_user() {
        let db = create_test_database();

        // Create a user
        let user_id = insert_test_user(&db, "John Doe", "john@example.com");

        // Verify user exists
        {
            let conn = db.0.lock().unwrap();
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM users").unwrap();
            let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
            assert_eq!(count, 1);
        }

        // Delete user
        {
            let conn = db.0.lock().unwrap();
            let result = conn.execute("DELETE FROM users WHERE id = ?1", params![user_id]);
            assert!(result.is_ok());
        }

        // Verify user is deleted
        {
            let conn = db.0.lock().unwrap();
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM users").unwrap();
            let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
            assert_eq!(count, 0);
        }
    }

    #[tokio::test]
    async fn test_delete_nonexistent_user() {
        let db = create_test_database();

        // Try to delete non-existent user
        let conn = db.0.lock().unwrap();
        let result = conn.execute("DELETE FROM users WHERE id = ?1", params![999]);
        // Should succeed even if user doesn't exist (SQLite behavior)
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0); // 0 rows affected
    }

    #[tokio::test]
    async fn test_create_and_get_notes() {
        let db = create_test_database();

        // Create a user first
        let user_id = insert_test_user(&db, "John Doe", "john@example.com");

        // Create a note
        {
            let conn = db.0.lock().unwrap();
            let result = conn.execute(
                "INSERT INTO notes (title, content, user_id) VALUES (?1, ?2, ?3)",
                params!["Test Note", "This is a test note", user_id],
            );
            assert!(result.is_ok());
        }

        // Get notes
        let conn = db.0.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, title, content, user_id, created_at, updated_at FROM notes ORDER BY updated_at DESC").unwrap();
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
            .unwrap();

        let notes: Vec<Note> = note_iter.map(|n| n.unwrap()).collect();
        assert_eq!(notes.len(), 1);
        assert_eq!(notes[0].title, "Test Note");
        assert_eq!(notes[0].content, Some("This is a test note".to_string()));
        assert_eq!(notes[0].user_id, user_id);
        assert!(notes[0].id.is_some());
        assert!(notes[0].created_at.is_some());
        assert!(notes[0].updated_at.is_some());
    }

    #[tokio::test]
    async fn test_create_note_without_content() {
        let db = create_test_database();

        // Create a user first
        let user_id = insert_test_user(&db, "John Doe", "john@example.com");

        // Create a note without content
        {
            let conn = db.0.lock().unwrap();
            let result = conn.execute(
                "INSERT INTO notes (title, content, user_id) VALUES (?1, ?2, ?3)",
                params!["Title Only", None::<String>, user_id],
            );
            assert!(result.is_ok());
        }

        // Get notes
        let conn = db.0.lock().unwrap();
        let mut stmt = conn.prepare("SELECT title, content FROM notes").unwrap();
        let note_iter = stmt
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?))
            })
            .unwrap();

        let notes: Vec<(String, Option<String>)> = note_iter.map(|n| n.unwrap()).collect();
        assert_eq!(notes.len(), 1);
        assert_eq!(notes[0].0, "Title Only");
        assert_eq!(notes[0].1, None);
    }

    #[tokio::test]
    async fn test_delete_note() {
        let db = create_test_database();

        // Create user and note
        let user_id = insert_test_user(&db, "John Doe", "john@example.com");
        let note_id = {
            let conn = db.0.lock().unwrap();
            conn.execute(
                "INSERT INTO notes (title, content, user_id) VALUES (?1, ?2, ?3)",
                params!["Test Note", "Content", user_id],
            )
            .unwrap();
            conn.last_insert_rowid()
        };

        // Verify note exists
        {
            let conn = db.0.lock().unwrap();
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM notes").unwrap();
            let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
            assert_eq!(count, 1);
        }

        // Delete note
        {
            let conn = db.0.lock().unwrap();
            let result = conn.execute("DELETE FROM notes WHERE id = ?1", params![note_id]);
            assert!(result.is_ok());
        }

        // Verify note is deleted
        {
            let conn = db.0.lock().unwrap();
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM notes").unwrap();
            let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
            assert_eq!(count, 0);
        }
    }

    #[tokio::test]
    async fn test_cascade_delete_notes_when_user_deleted() {
        let db = create_test_database();

        // Create user
        let user_id = insert_test_user(&db, "John Doe", "john@example.com");

        // Create multiple notes for the user
        {
            let conn = db.0.lock().unwrap();
            for i in 1..=3 {
                conn.execute(
                    "INSERT INTO notes (title, content, user_id) VALUES (?1, ?2, ?3)",
                    params![format!("Note {}", i), format!("Content {}", i), user_id],
                )
                .unwrap();
            }
        }

        // Verify notes exist
        {
            let conn = db.0.lock().unwrap();
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM notes").unwrap();
            let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
            assert_eq!(count, 3);
        }

        // Delete user
        {
            let conn = db.0.lock().unwrap();
            conn.execute("DELETE FROM users WHERE id = ?1", params![user_id])
                .unwrap();
        }

        // Verify all notes are deleted due to cascade
        {
            let conn = db.0.lock().unwrap();
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM notes").unwrap();
            let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
            assert_eq!(count, 0);
        }
    }

    #[tokio::test]
    async fn test_multiple_users_and_notes() {
        let db = create_test_database();

        // Create multiple users
        let user1_id = insert_test_user(&db, "User 1", "user1@example.com");
        let user2_id = insert_test_user(&db, "User 2", "user2@example.com");

        // Create notes for each user
        {
            let conn = db.0.lock().unwrap();
            conn.execute(
                "INSERT INTO notes (title, content, user_id) VALUES (?1, ?2, ?3)",
                params!["User 1 Note", "User 1 content", user1_id],
            )
            .unwrap();
            conn.execute(
                "INSERT INTO notes (title, content, user_id) VALUES (?1, ?2, ?3)",
                params!["User 2 Note", "User 2 content", user2_id],
            )
            .unwrap();
        }

        // Verify both notes exist
        {
            let conn = db.0.lock().unwrap();
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM notes").unwrap();
            let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
            assert_eq!(count, 2);
        }

        // Verify users exist
        {
            let conn = db.0.lock().unwrap();
            let mut stmt = conn.prepare("SELECT COUNT(*) FROM users").unwrap();
            let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
            assert_eq!(count, 2);
        }
    }
}
