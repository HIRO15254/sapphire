// Import modules
pub mod database;
pub mod commands;
pub mod services;
pub mod utils;

use database::connection::DatabaseConnection;
use utils::init_logger;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logger
    init_logger();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Get the app data directory
            let app_data_dir = app.handle()
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data directory: {}", e))?;

            // Create the database file path
            let db_path = app_data_dir.join("sapphire.db");
            let db_path_str = db_path.to_str().ok_or("Invalid database path")?;

            // Initialize database connection
            let db = DatabaseConnection::new(db_path_str)
                .map_err(|e| format!("Failed to initialize database: {}", e))?;

            // Initialize migration system and run migrations
            let _migrator = database::migration::Migrator::new(&db)
                .map_err(|e| format!("Failed to initialize migrator: {}", e))?;

            tracing::info!("Database initialized successfully");

            // Manage the database connection for use in commands
            app.manage(db);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Player commands
            commands::get_players,
            commands::create_player,
            commands::update_player,
            commands::delete_player,
            // Tag commands
            commands::get_tags,
            commands::create_tag,
            commands::update_tag,
            commands::delete_tag,
            // Memo commands
            commands::get_player_memos,
            commands::create_memo,
            commands::update_memo,
            commands::delete_memo,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}