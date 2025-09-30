use rusqlite::{params, Connection, Result as SqliteResult};
use std::fs;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

// Re-export structures for public use
pub use self::models::*;
pub use self::migration::*;

// Data models module
pub mod models {
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct Player {
        pub id: Option<i64>,
        pub name: String,
        pub identifier: Option<String>,
        pub player_type_id: Option<i64>,
        pub is_deleted: bool,
        pub created_at: Option<String>,
        pub updated_at: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct PlayerType {
        pub id: Option<i64>,
        pub name: String,
        pub color: String,
        pub is_deleted: bool,
        pub created_at: Option<String>,
        pub updated_at: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct TagMaster {
        pub id: Option<i64>,
        pub name: String,
        pub color: String,
        pub has_level: bool,
        pub is_deleted: bool,
        pub created_at: Option<String>,
        pub updated_at: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct PlayerTag {
        pub id: Option<i64>,
        pub player_id: i64,
        pub tag_master_id: i64,
        pub level: Option<i32>,
        pub is_deleted: bool,
        pub created_at: Option<String>,
        pub updated_at: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    pub struct PlayerNote {
        pub id: Option<i64>,
        pub player_id: i64,
        pub title: Option<String>,
        pub content: String,
        pub note_type: String, // 'simple' | 'comprehensive'
        pub is_deleted: bool,
        pub created_at: Option<String>,
        pub updated_at: Option<String>,
    }

    // Create DTOs
    #[derive(Debug, Serialize, Deserialize)]
    pub struct CreatePlayer {
        pub name: String,
        pub identifier: Option<String>,
        pub player_type_id: Option<i64>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct CreatePlayerType {
        pub name: String,
        pub color: String,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct CreateTagMaster {
        pub name: String,
        pub color: String,
        pub has_level: bool,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct CreatePlayerTag {
        pub player_id: i64,
        pub tag_master_id: i64,
        pub level: Option<i32>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct CreatePlayerNote {
        pub player_id: i64,
        pub title: Option<String>,
        pub content: String,
        pub note_type: String,
    }
}

// Migration module
pub mod migration;

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
        // Read the schema file
        let schema_sql = include_str!("player_note_schema.sql");

        // Execute the schema commands
        conn.execute_batch(schema_sql)?;

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

// Database helper functions for player note operations
impl Database {
    // Player operations
    pub fn get_players(&self) -> SqliteResult<Vec<Player>> {
        let conn = self.0.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, identifier, player_type_id, is_deleted, created_at, updated_at
             FROM players WHERE is_deleted = 0 ORDER BY created_at DESC"
        )?;

        let player_iter = stmt.query_map([], |row| {
            Ok(Player {
                id: row.get(0)?,
                name: row.get(1)?,
                identifier: row.get(2)?,
                player_type_id: row.get(3)?,
                is_deleted: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        let mut players = Vec::new();
        for player in player_iter {
            players.push(player?);
        }

        Ok(players)
    }

    pub fn create_player(&self, player: &CreatePlayer) -> SqliteResult<i64> {
        let conn = self.0.lock().unwrap();
        conn.execute(
            "INSERT INTO players (name, identifier, player_type_id) VALUES (?1, ?2, ?3)",
            params![player.name, player.identifier, player.player_type_id],
        )?;
        Ok(conn.last_insert_rowid())
    }

    // Player type operations
    pub fn get_player_types(&self) -> SqliteResult<Vec<PlayerType>> {
        let conn = self.0.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, color, is_deleted, created_at, updated_at
             FROM player_types WHERE is_deleted = 0 ORDER BY name"
        )?;

        let type_iter = stmt.query_map([], |row| {
            Ok(PlayerType {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                is_deleted: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;

        let mut types = Vec::new();
        for player_type in type_iter {
            types.push(player_type?);
        }

        Ok(types)
    }

    pub fn create_player_type(&self, player_type: &CreatePlayerType) -> SqliteResult<i64> {
        let conn = self.0.lock().unwrap();
        conn.execute(
            "INSERT INTO player_types (name, color) VALUES (?1, ?2)",
            params![player_type.name, player_type.color],
        )?;
        Ok(conn.last_insert_rowid())
    }

    // Tag master operations
    pub fn get_tag_masters(&self) -> SqliteResult<Vec<TagMaster>> {
        let conn = self.0.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, color, has_level, is_deleted, created_at, updated_at
             FROM tag_masters WHERE is_deleted = 0 ORDER BY name"
        )?;

        let tag_iter = stmt.query_map([], |row| {
            Ok(TagMaster {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                has_level: row.get(3)?,
                is_deleted: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        let mut tags = Vec::new();
        for tag in tag_iter {
            tags.push(tag?);
        }

        Ok(tags)
    }

    pub fn create_tag_master(&self, tag: &CreateTagMaster) -> SqliteResult<i64> {
        let conn = self.0.lock().unwrap();
        conn.execute(
            "INSERT INTO tag_masters (name, color, has_level) VALUES (?1, ?2, ?3)",
            params![tag.name, tag.color, tag.has_level],
        )?;
        Ok(conn.last_insert_rowid())
    }

    // Player note operations
    pub fn get_player_notes(&self, player_id: i64) -> SqliteResult<Vec<PlayerNote>> {
        let conn = self.0.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, player_id, title, content, note_type, is_deleted, created_at, updated_at
             FROM player_notes WHERE player_id = ?1 AND is_deleted = 0 ORDER BY created_at DESC"
        )?;

        let note_iter = stmt.query_map(params![player_id], |row| {
            Ok(PlayerNote {
                id: row.get(0)?,
                player_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                note_type: row.get(4)?,
                is_deleted: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        let mut notes = Vec::new();
        for note in note_iter {
            notes.push(note?);
        }

        Ok(notes)
    }

    pub fn create_player_note(&self, note: &CreatePlayerNote) -> SqliteResult<i64> {
        let conn = self.0.lock().unwrap();
        conn.execute(
            "INSERT INTO player_notes (player_id, title, content, note_type) VALUES (?1, ?2, ?3, ?4)",
            params![note.player_id, note.title, note.content, note.note_type],
        )?;
        Ok(conn.last_insert_rowid())
    }
}