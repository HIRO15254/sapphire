use sapphire_lib::database::{Database, models::*};

#[cfg(test)]
mod tests {
    use super::*;

    // Test database helper
    fn create_test_database() -> Database {
        Database::new_test().expect("Failed to create test database")
    }

    #[tokio::test]
    async fn test_database_initialization() {
        let db = create_test_database();

        // Check if tables exist by querying them
        let conn = db.0.lock().unwrap();

        // Test player_types table
        let result = conn.prepare("SELECT COUNT(*) FROM player_types");
        assert!(result.is_ok());

        // Test players table
        let result = conn.prepare("SELECT COUNT(*) FROM players");
        assert!(result.is_ok());

        // Test tag_masters table
        let result = conn.prepare("SELECT COUNT(*) FROM tag_masters");
        assert!(result.is_ok());

        // Test player_tags table
        let result = conn.prepare("SELECT COUNT(*) FROM player_tags");
        assert!(result.is_ok());

        // Test player_notes table
        let result = conn.prepare("SELECT COUNT(*) FROM player_notes");
        assert!(result.is_ok());

        // Test that we can actually query the tables
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM player_types").unwrap();
        let count: Result<i64, _> = stmt.query_row([], |row| row.get(0));
        assert!(count.is_ok());
    }

    #[tokio::test]
    async fn test_default_player_type_exists() {
        let db = create_test_database();
        let player_types = db.get_player_types().unwrap();

        // Should have default "未分類" player type
        assert!(!player_types.is_empty());
        assert_eq!(player_types[0].name, "未分類");
        assert_eq!(player_types[0].color, "#6b7280");
    }

    #[tokio::test]
    async fn test_create_and_get_player() {
        let db = create_test_database();

        // Create a player
        let player_data = CreatePlayer {
            name: "Test Player".to_string(),
            identifier: Some("TP001".to_string()),
            player_type_id: Some(1), // Default "未分類" type
        };

        let player_id = db.create_player(&player_data).unwrap();
        assert!(player_id > 0);

        // Get all players
        let players = db.get_players().unwrap();
        assert_eq!(players.len(), 1);
        assert_eq!(players[0].name, "Test Player");
        assert_eq!(players[0].identifier, Some("TP001".to_string()));
        assert_eq!(players[0].player_type_id, Some(1));
        assert!(!players[0].is_deleted);
    }

    #[tokio::test]
    async fn test_comprehensive_memo_auto_creation() {
        let db = create_test_database();

        // Create a player
        let player_data = CreatePlayer {
            name: "Test Player".to_string(),
            identifier: None,
            player_type_id: None,
        };

        let player_id = db.create_player(&player_data).unwrap();

        // Check if comprehensive memo was automatically created
        let notes = db.get_player_notes(player_id).unwrap();
        assert_eq!(notes.len(), 1);
        assert_eq!(notes[0].note_type, "comprehensive");
        assert_eq!(notes[0].title, None);
        assert_eq!(notes[0].content, "");
        assert_eq!(notes[0].player_id, player_id);
    }

    #[tokio::test]
    async fn test_create_player_type() {
        let db = create_test_database();

        let player_type_data = CreatePlayerType {
            name: "上級者".to_string(),
            color: "#ef4444".to_string(),
        };

        let type_id = db.create_player_type(&player_type_data).unwrap();
        assert!(type_id > 0);

        let player_types = db.get_player_types().unwrap();
        // Should have default + new type
        assert_eq!(player_types.len(), 2);

        // Find the new type
        let new_type = player_types.iter().find(|t| t.name == "上級者").unwrap();
        assert_eq!(new_type.color, "#ef4444");
        assert!(!new_type.is_deleted);
    }

    #[tokio::test]
    async fn test_create_tag_master() {
        let db = create_test_database();

        let tag_data = CreateTagMaster {
            name: "アグレッシブ".to_string(),
            color: "#10b981".to_string(),
            has_level: true,
        };

        let tag_id = db.create_tag_master(&tag_data).unwrap();
        assert!(tag_id > 0);

        let tags = db.get_tag_masters().unwrap();
        assert_eq!(tags.len(), 1);
        assert_eq!(tags[0].name, "アグレッシブ");
        assert_eq!(tags[0].color, "#10b981");
        assert!(tags[0].has_level);
        assert!(!tags[0].is_deleted);
    }

    #[tokio::test]
    async fn test_create_simple_note() {
        let db = create_test_database();

        // Create a player first
        let player_data = CreatePlayer {
            name: "Test Player".to_string(),
            identifier: None,
            player_type_id: None,
        };
        let player_id = db.create_player(&player_data).unwrap();

        // Create a simple note
        let note_data = CreatePlayerNote {
            player_id,
            title: Some("Hand History".to_string()),
            content: "<p>Player folded on river with strong hand</p>".to_string(),
            note_type: "simple".to_string(),
        };

        let note_id = db.create_player_note(&note_data).unwrap();
        assert!(note_id > 0);

        let notes = db.get_player_notes(player_id).unwrap();
        // Should have comprehensive (auto-created) + simple note
        assert_eq!(notes.len(), 2);

        // Find the simple note
        let simple_note = notes.iter().find(|n| n.note_type == "simple").unwrap();
        assert_eq!(simple_note.title, Some("Hand History".to_string()));
        assert_eq!(simple_note.content, "<p>Player folded on river with strong hand</p>");
        assert_eq!(simple_note.player_id, player_id);
    }

    #[tokio::test]
    async fn test_player_with_special_characters() {
        let db = create_test_database();

        // Test with Japanese characters and special symbols
        let player_data = CreatePlayer {
            name: "田中太郎★".to_string(),
            identifier: Some("@player_123".to_string()),
            player_type_id: None,
        };

        let _player_id = db.create_player(&player_data).unwrap();
        let players = db.get_players().unwrap();

        assert_eq!(players[0].name, "田中太郎★");
        assert_eq!(players[0].identifier, Some("@player_123".to_string()));
    }

    #[tokio::test]
    async fn test_multiple_players_same_name_different_identifier() {
        let db = create_test_database();

        // Create first player
        let player1_data = CreatePlayer {
            name: "John".to_string(),
            identifier: Some("John_Casino_A".to_string()),
            player_type_id: None,
        };
        let player1_id = db.create_player(&player1_data).unwrap();

        // Create second player with same name but different identifier
        let player2_data = CreatePlayer {
            name: "John".to_string(),
            identifier: Some("John_Casino_B".to_string()),
            player_type_id: None,
        };
        let player2_id = db.create_player(&player2_data).unwrap();

        assert_ne!(player1_id, player2_id);

        let players = db.get_players().unwrap();
        assert_eq!(players.len(), 2);

        // Both should have same name but different identifiers
        assert!(players.iter().all(|p| p.name == "John"));
        assert!(players.iter().any(|p| p.identifier == Some("John_Casino_A".to_string())));
        assert!(players.iter().any(|p| p.identifier == Some("John_Casino_B".to_string())));
    }

    #[tokio::test]
    async fn test_tag_level_constraints() {
        let db = create_test_database();

        // Create player and tag master
        let player_data = CreatePlayer {
            name: "Test Player".to_string(),
            identifier: None,
            player_type_id: None,
        };
        let player_id = db.create_player(&player_data).unwrap();

        let tag_data = CreateTagMaster {
            name: "Test Tag".to_string(),
            color: "#000000".to_string(),
            has_level: true,
        };
        let tag_id = db.create_tag_master(&tag_data).unwrap();

        // Test valid level (1-5)
        let conn = db.0.lock().unwrap();

        // Level 1 should work
        let result = conn.execute(
            "INSERT INTO player_tags (player_id, tag_master_id, level) VALUES (?1, ?2, ?3)",
            rusqlite::params![player_id, tag_id, 1],
        );
        assert!(result.is_ok());

        // Level 5 should work
        let result = conn.execute(
            "INSERT INTO player_tags (player_id, tag_master_id, level) VALUES (?1, ?2, ?3)",
            rusqlite::params![player_id, tag_id, 5],
        );
        assert!(result.is_ok());

        // Level 6 should fail (constraint violation)
        let result = conn.execute(
            "INSERT INTO player_tags (player_id, tag_master_id, level) VALUES (?1, ?2, ?3)",
            rusqlite::params![player_id, tag_id, 6],
        );
        assert!(result.is_err());

        // Level 0 should fail (constraint violation)
        let result = conn.execute(
            "INSERT INTO player_tags (player_id, tag_master_id, level) VALUES (?1, ?2, ?3)",
            rusqlite::params![player_id, tag_id, 0],
        );
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_cascading_delete() {
        let db = create_test_database();

        // Create player
        let player_data = CreatePlayer {
            name: "Test Player".to_string(),
            identifier: None,
            player_type_id: None,
        };
        let player_id = db.create_player(&player_data).unwrap();

        // Create additional note
        let note_data = CreatePlayerNote {
            player_id,
            title: Some("Test Note".to_string()),
            content: "Test content".to_string(),
            note_type: "simple".to_string(),
        };
        db.create_player_note(&note_data).unwrap();

        // Verify notes exist
        let notes_before = db.get_player_notes(player_id).unwrap();
        assert_eq!(notes_before.len(), 2); // comprehensive + simple

        // Delete player
        let conn = db.0.lock().unwrap();
        conn.execute("DELETE FROM players WHERE id = ?1", rusqlite::params![player_id]).unwrap();

        // Verify notes are also deleted (cascade)
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM player_notes WHERE player_id = ?1").unwrap();
        let count: i64 = stmt.query_row(rusqlite::params![player_id], |row| row.get(0)).unwrap();
        assert_eq!(count, 0);
    }
}