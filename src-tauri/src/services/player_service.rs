use crate::database::connection::DatabaseConnection;
use crate::utils::{AppError, AppResult};
use crate::commands::players::Player;
use rusqlite::params;

pub struct PlayerService<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> PlayerService<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn get_all_players(&self) -> AppResult<Vec<Player>> {
        self.db.execute(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, name, identifier, player_type_id, is_deleted, created_at, updated_at
                 FROM players
                 WHERE is_deleted = 0
                 ORDER BY name"
            )?;

            let players_iter = stmt.query_map([], |row| {
                Ok(Player {
                    id: Some(row.get(0)?),
                    name: row.get(1)?,
                    identifier: row.get(2)?,
                    player_type_id: row.get(3)?,
                    is_deleted: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })?;

            let mut players = Vec::new();
            for player in players_iter {
                players.push(player?);
            }

            Ok(players)
        })
    }

    pub async fn create_player(&self, name: String, identifier: Option<String>) -> AppResult<Player> {
        if name.is_empty() {
            return Err(AppError::Validation {
                message: "Player name cannot be empty".to_string(),
            });
        }

        self.db.execute(|conn| {
            conn.execute(
                "INSERT INTO players (name, identifier) VALUES (?1, ?2)",
                params![name, identifier],
            )?;

            let id = conn.last_insert_rowid();

            let mut stmt = conn.prepare(
                "SELECT id, name, identifier, player_type_id, is_deleted, created_at, updated_at
                 FROM players
                 WHERE id = ?1"
            )?;

            let player = stmt.query_row(params![id], |row| {
                Ok(Player {
                    id: Some(row.get(0)?),
                    name: row.get(1)?,
                    identifier: row.get(2)?,
                    player_type_id: row.get(3)?,
                    is_deleted: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })?;

            Ok(player)
        })
    }

    pub async fn update_player(&self, id: i64, name: String, identifier: Option<String>) -> AppResult<Player> {
        if name.is_empty() {
            return Err(AppError::Validation {
                message: "Player name cannot be empty".to_string(),
            });
        }

        self.db.execute(|conn| {
            let rows_affected = conn.execute(
                "UPDATE players
                 SET name = ?1, identifier = ?2, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?3 AND is_deleted = 0",
                params![name, identifier, id],
            )?;

            if rows_affected == 0 {
                return Err(rusqlite::Error::QueryReturnedNoRows.into());
            }

            let mut stmt = conn.prepare(
                "SELECT id, name, identifier, player_type_id, is_deleted, created_at, updated_at
                 FROM players
                 WHERE id = ?1"
            )?;

            let player = stmt.query_row(params![id], |row| {
                Ok(Player {
                    id: Some(row.get(0)?),
                    name: row.get(1)?,
                    identifier: row.get(2)?,
                    player_type_id: row.get(3)?,
                    is_deleted: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })?;

            Ok(player)
        })
    }

    pub async fn delete_player(&self, id: i64) -> AppResult<()> {
        self.db.execute(|conn| {
            let rows_affected = conn.execute(
                "UPDATE players SET is_deleted = 1 WHERE id = ?1",
                params![id],
            )?;

            if rows_affected == 0 {
                return Err(rusqlite::Error::QueryReturnedNoRows.into());
            }

            Ok(())
        })
    }
}