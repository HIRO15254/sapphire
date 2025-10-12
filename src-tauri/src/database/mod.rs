use rusqlite::{Connection, Result as SqliteResult};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub mod models;
pub mod schema;
pub mod seed;

#[cfg(test)]
mod integration_tests;

/// Database connection wrapper for player note system
pub struct PlayerDatabase(pub Mutex<Connection>);

impl PlayerDatabase {
    /// Create a new database connection
    pub fn new(app_handle: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        // Check if running in test mode
        if std::env::var("TAURI_TEST_MODE").is_ok() {
            return Self::new_test();
        }

        // Get the app data directory
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data directory");

        // Create the directory if it doesn't exist
        std::fs::create_dir_all(&app_data_dir)?;

        // Create database file path
        let db_path = app_data_dir.join("players.db");

        // Open connection
        let conn = Connection::open(&db_path)?;

        // Initialize schema
        schema::initialize_schema(&conn)?;

        Ok(Self(Mutex::new(conn)))
    }

    /// Create a new in-memory database for testing
    pub fn new_test() -> Result<Self, Box<dyn std::error::Error>> {
        let conn = Connection::open_in_memory()?;
        schema::initialize_schema(&conn)?;
        Ok(Self(Mutex::new(conn)))
    }

    /// Execute a migration-safe query
    pub fn execute_schema(&self, sql: &str) -> SqliteResult<()> {
        let conn = self.0.lock().unwrap();
        conn.execute_batch(sql)?;
        Ok(())
    }
}
