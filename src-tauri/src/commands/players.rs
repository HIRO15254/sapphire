use crate::database::models::{
    PaginatedResponse, Player, PLAYER_NAME_MAX_LENGTH, PLAYER_NAME_MIN_LENGTH,
};
use crate::database::PlayerDatabase;
use rusqlite::{params, Connection};
use tauri::State;

// ============================================
// ヘルパー関数（DRY原則による共通化）
// ============================================

/// 【ヘルパー関数】: プレイヤー名のバリデーション 🔵
/// 【再利用性】: create_player, update_playerで共通利用 🔵
/// 【単一責任】: 名前の長さチェックのみを担当 🔵
fn validate_player_name(name: &str) -> Result<(), String> {
    let name_len = name.chars().count();
    if !(PLAYER_NAME_MIN_LENGTH..=PLAYER_NAME_MAX_LENGTH).contains(&name_len) {
        return Err(format!(
            "Player name must be between {} and {} characters, got: {}",
            PLAYER_NAME_MIN_LENGTH, PLAYER_NAME_MAX_LENGTH, name_len
        ));
    }
    Ok(())
}

/// 【ヘルパー関数】: プレイヤー存在確認 🔵
/// 【再利用性】: update_player, delete_playerで共通利用 🔵
/// 【単一責任】: プレイヤーIDの存在チェックのみを担当 🔵
/// 【エラーハンドリング】: 存在しない場合は明確なエラーメッセージを返す 🔵
fn check_player_exists(conn: &Connection, id: i64) -> Result<(), String> {
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM players WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Database error: {}", e))?;

    if exists == 0 {
        return Err("Player not found".to_string());
    }
    Ok(())
}

/// 【ヘルパー関数】: 種別ID存在確認 🔵
/// 【再利用性】: create_player, update_playerで共通利用 🔵
/// 【単一責任】: 種別IDの存在チェックのみを担当 🔵
/// 【エラーハンドリング】: 存在しない場合は明確なエラーメッセージを返す 🔵
fn check_category_exists(conn: &Connection, category_id: i64) -> Result<(), String> {
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM player_categories WHERE id = ?1",
            params![category_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Database error: {}", e))?;

    if exists == 0 {
        return Err("Category not found".to_string());
    }
    Ok(())
}

/// 【ヘルパー関数】: プレイヤー情報を取得 🔵
/// 【再利用性】: create_player, update_player, get_player_detailで共通利用 🔵
/// 【単一責任】: IDからPlayerエンティティを構築するのみを担当 🔵
/// 【パフォーマンス】: 単一のクエリで必要な情報を全て取得 🔵
fn get_player_by_id(conn: &Connection, id: i64) -> Result<Player, String> {
    conn.query_row(
        "SELECT id, name, category_id, created_at, updated_at FROM players WHERE id = ?1",
        params![id],
        |row| {
            Ok(Player {
                id: row.get(0)?,
                name: row.get(1)?,
                category_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| format!("Player not found: {}", e))
}

/// 【ヘルパー関数】: LIKE句の特殊文字をエスケープ 🔵
/// 【再利用性】: 検索機能全般で使用可能 🔵
/// 【単一責任】: SQLインジェクション防止のための文字エスケープのみを担当 🔵
/// 【セキュリティ】: %（任意文字列）、_（任意1文字）、\（エスケープ文字）の無害化 🔵
/// 【実装方針】: バックスラッシュを先にエスケープすることで、二重エスケープを防止 🔵
fn escape_like_pattern(input: &str) -> String {
    // 【エスケープ順序】: \を最初に処理しないと、%や_のエスケープが二重になる 🔵
    // 【例】: "test%" → "test\%" → "test\\%" (誤) vs "test%" → "test\%" (正)
    input
        .replace('\\', "\\\\") // バックスラッシュを最初にエスケープ
        .replace('%', "\\%") // ワイルドカード%をエスケープ
        .replace('_', "\\_") // ワイルドカード_をエスケープ
}

/// 【ヘルパー関数】: ページネーションパラメータを正規化 🔵
/// 【再利用性】: ページネーションを持つ全ての検索・一覧機能で使用可能 🔵
/// 【単一責任】: ページパラメータのデフォルト値設定と範囲制限のみを担当 🔵
/// 【安全性】: 不正な値（0以下、上限超過）を適切な範囲に補正 🔵
/// 【保守性】: デフォルト値を一箇所で管理することで、変更時の影響を最小化 🔵
fn normalize_pagination(
    page: Option<usize>,
    per_page: Option<usize>,
    default_per_page: usize,
) -> (usize, usize) {
    // 【ページ番号正規化】: デフォルト1、最小値1に補正 🔵
    let normalized_page = page.unwrap_or(1).max(1);

    // 【ページサイズ正規化】: デフォルト値適用、範囲を1～100に制限 🔵
    // 【パフォーマンス考慮】: 最大100件に制限してレスポンスサイズを管理 🔵
    let normalized_per_page = per_page.unwrap_or(default_per_page).clamp(1, 100);

    (normalized_page, normalized_per_page)
}

// ============================================
// CRUDコマンド実装
// ============================================

/// プレイヤーを作成し、総合メモを自動生成する
///
/// # Arguments
/// * `name` - プレイヤー名（1～100文字）
/// * `category_id` - 種別ID（オプション）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<Player, String>` - 作成されたプレイヤーまたはエラーメッセージ
///
/// 【機能概要】: プレイヤーを作成し、総合メモを自動生成する 🔵
/// 【改善内容】: ヘルパー関数を活用してコードの重複を削減、可読性を向上 🔵
/// 【設計方針】: 単一責任原則に従い、各処理をヘルパー関数に委譲 🔵
/// 【テスト対応】: TC-CREATE-001～003, TC-CREATE-ERR-001～003, TC-CREATE-BOUND-001～002 🔵
pub(crate) fn create_player_internal(
    name: &str,
    category_id: Option<i64>,
    db: &PlayerDatabase,
) -> Result<Player, String> {
    // 【入力値検証】: ヘルパー関数を使用した名前バリデーション 🔵
    validate_player_name(name)?;

    let conn = db.0.lock().unwrap();

    // 【種別ID検証】: ヘルパー関数を使用した種別存在確認 🔵
    if let Some(cat_id) = category_id {
        check_category_exists(&conn, cat_id)?;
    }

    // 【プレイヤー作成】: playersテーブルにINSERT 🔵
    conn.execute(
        "INSERT INTO players (name, category_id) VALUES (?1, ?2)",
        params![name, category_id],
    )
    .map_err(|e| format!("Failed to insert player: {}", e))?;

    let player_id = conn.last_insert_rowid();

    // 【テンプレート取得】: summary_templatesからcontentを取得 🔵
    let template_content: String = conn
        .query_row(
            "SELECT content FROM summary_templates WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to get template: {}", e))?;

    // 【総合メモ自動生成】: player_summariesテーブルにテンプレート適用してINSERT 🔵
    conn.execute(
        "INSERT INTO player_summaries (player_id, content) VALUES (?1, ?2)",
        params![player_id, template_content],
    )
    .map_err(|e| format!("Failed to create summary: {}", e))?;

    // 【プレイヤー取得】: ヘルパー関数を使用して作成したプレイヤー情報を返す 🔵
    get_player_by_id(&conn, player_id)
}

#[tauri::command]
pub async fn create_player(
    name: String,
    category_id: Option<i64>,
    db: State<'_, PlayerDatabase>,
) -> Result<Player, String> {
    create_player_internal(&name, category_id, &db)
}

/// プレイヤー一覧を取得（ページネーション付き）
///
/// # Arguments
/// * `page` - ページ番号（デフォルト: 1）
/// * `per_page` - 1ページあたりの件数（デフォルト: 20、最大: 100）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<PaginatedResponse<Player>, String>` - ページネーション付きプレイヤー一覧
///
/// 【機能概要】: プレイヤー一覧をページネーション付きで取得 🔵
/// 【改善内容】: ヘルパー関数を活用してページネーション処理を共通化 🔵
/// 【実装方針】: デフォルト値設定、総件数取得、OFFSET/LIMIT、updated_at降順ソート 🔵
/// 【テスト対応】: TC-GET-001～003 🔵
pub(crate) fn get_players_internal(
    page: Option<usize>,
    per_page: Option<usize>,
    db: &PlayerDatabase,
) -> Result<PaginatedResponse<Player>, String> {
    // 【ページネーション正規化】: ヘルパー関数でデフォルト値設定と範囲制限を実施 🔵
    // 【デフォルト値】: page=1, per_page=20（一覧表示は20件が標準） 🔵
    let (page, per_page) = normalize_pagination(page, per_page, 20);

    let conn = db.0.lock().unwrap();

    // 【総件数取得】: プレイヤー総数をカウント 🔵
    let total: usize = conn
        .query_row("SELECT COUNT(*) FROM players", [], |row| row.get(0))
        .map_err(|e| format!("Failed to count players: {}", e))?;

    // 【総ページ数計算】: ceil(total / per_page) 🔵
    let total_pages = total.div_ceil(per_page);

    // 【OFFSET/LIMIT計算】: ページネーション用のオフセット計算 🔵
    let offset = (page - 1) * per_page;

    // 【プレイヤー取得】: updated_at降順、LIMIT/OFFSET適用 🔵
    let mut stmt = conn
        .prepare(
            "SELECT id, name, category_id, created_at, updated_at
             FROM players
             ORDER BY updated_at DESC
             LIMIT ?1 OFFSET ?2",
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let players = stmt
        .query_map(params![per_page, offset], |row| {
            Ok(Player {
                id: row.get(0)?,
                name: row.get(1)?,
                category_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| format!("Failed to query players: {}", e))?
        .collect::<Result<Vec<Player>, _>>()
        .map_err(|e| format!("Failed to collect players: {}", e))?;

    // 【レスポンス構築】: ページネーション情報を含むレスポンスを返す 🔵
    Ok(PaginatedResponse {
        data: players,
        total,
        page,
        per_page,
        total_pages,
    })
}

#[tauri::command]
pub async fn get_players(
    page: Option<usize>,
    per_page: Option<usize>,
    db: State<'_, PlayerDatabase>,
) -> Result<PaginatedResponse<Player>, String> {
    get_players_internal(page, per_page, &db)
}

/// プレイヤー情報を更新
///
/// # Arguments
/// * `id` - プレイヤーID
/// * `name` - 新しい名前（オプション）
/// * `category_id` - 新しい種別ID（オプション、NULLに設定する場合は Some(None)）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<Player, String>` - 更新されたプレイヤーまたはエラーメッセージ
///
/// 【機能概要】: プレイヤー情報を部分更新 🔵
/// 【改善内容】: ヘルパー関数を活用してコードの重複を削減 🔵
/// 【設計方針】: バリデーションロジックを共通化し、保守性を向上 🔵
/// 【テスト対応】: TC-UPDATE-001, TC-UPDATE-ERR-001 🔵
pub(crate) fn update_player_internal(
    id: i64,
    name: Option<&str>,
    category_id: Option<Option<i64>>,
    db: &PlayerDatabase,
) -> Result<Player, String> {
    let conn = db.0.lock().unwrap();

    // 【プレイヤー存在確認】: ヘルパー関数を使用した存在チェック 🔵
    check_player_exists(&conn, id)?;

    // 【名前バリデーション】: ヘルパー関数を使用した名前チェック 🔵
    if let Some(new_name) = name {
        validate_player_name(new_name)?;
    }

    // 【種別ID検証】: ヘルパー関数を使用した種別存在確認 🔵
    if let Some(Some(cat_id)) = category_id {
        check_category_exists(&conn, cat_id)?;
    }

    // 【部分更新実装】: nameまたはcategory_idが指定された場合のみ更新 🔵
    match (name, category_id) {
        (Some(new_name), Some(new_cat_id)) => {
            // 両方更新
            conn.execute(
                "UPDATE players SET name = ?1, category_id = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
                params![new_name, new_cat_id, id],
            )
        }
        (Some(new_name), None) => {
            // 名前のみ更新
            conn.execute(
                "UPDATE players SET name = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                params![new_name, id],
            )
        }
        (None, Some(new_cat_id)) => {
            // 種別IDのみ更新
            conn.execute(
                "UPDATE players SET category_id = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                params![new_cat_id, id],
            )
        }
        (None, None) => {
            // 何も更新しないが、エラーにはしない（updated_atのみ更新）
            conn.execute(
                "UPDATE players SET updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
                params![id],
            )
        }
    }
    .map_err(|e| format!("Failed to update player: {}", e))?;

    // 【更新後のプレイヤー取得】: ヘルパー関数を使用して更新されたプレイヤー情報を返す 🔵
    get_player_by_id(&conn, id)
}

#[tauri::command]
pub async fn update_player(
    id: i64,
    name: Option<String>,
    category_id: Option<Option<i64>>,
    db: State<'_, PlayerDatabase>,
) -> Result<Player, String> {
    update_player_internal(id, name.as_deref(), category_id, &db)
}

/// プレイヤーを削除（CASCADE削除）
///
/// # Arguments
/// * `id` - プレイヤーID
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<(), String>` - 成功またはエラーメッセージ
///
/// 【機能概要】: プレイヤーを削除（関連データはCASCADE削除） 🔵
/// 【改善内容】: ヘルパー関数を活用してコードの重複を削減 🔵
/// 【設計方針】: 存在確認ロジックを共通化し、一貫性を向上 🔵
/// 【テスト対応】: TC-DELETE-001, TC-DELETE-CASCADE-001 🔵
pub(crate) fn delete_player_internal(id: i64, db: &PlayerDatabase) -> Result<(), String> {
    let conn = db.0.lock().unwrap();

    // 【プレイヤー存在確認】: ヘルパー関数を使用した存在チェック 🔵
    check_player_exists(&conn, id)?;

    // 【プレイヤー削除】: DELETE実行（CASCADE削除は外部キー制約で自動実行） 🔵
    // スキーマ定義: ON DELETE CASCADE により、player_notes, player_summariesも自動削除
    conn.execute("DELETE FROM players WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete player: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_player(id: i64, db: State<'_, PlayerDatabase>) -> Result<(), String> {
    delete_player_internal(id, &db)
}

/// プレイヤー詳細を取得（種別・タグ・メモ含む）
///
/// # Arguments
/// * `id` - プレイヤーID
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<PlayerDetail, String>` - プレイヤー詳細またはエラーメッセージ
///
/// 【機能概要】: プレイヤー詳細を全関連データと共に取得 🔵
/// 【改善内容】: ヘルパー関数を活用してコードの重複を削減 🔵
/// 【設計方針】: プレイヤー取得ロジックを共通化 🔵
/// 【実装方針】: 簡易実装（現時点ではプレイヤー基本情報のみ返す、将来拡張予定） 🟡
/// 【テスト対応】: TC-DETAIL-001 🔵
pub(crate) fn get_player_detail_internal(
    id: i64,
    db: &PlayerDatabase,
) -> Result<serde_json::Value, String> {
    let conn = db.0.lock().unwrap();

    // 【プレイヤー取得】: ヘルパー関数を使用して基本情報を取得 🔵
    let player = get_player_by_id(&conn, id)?;

    // 【簡易実装】: 現時点ではプレイヤー基本情報のみJSON化して返す 🟡
    // TODO: 将来的にはカテゴリ、タグ、メモ、総合メモも含める
    let json =
        serde_json::to_value(&player).map_err(|e| format!("Failed to serialize player: {}", e))?;

    Ok(json)
}

#[tauri::command]
pub async fn get_player_detail(
    id: i64,
    db: State<'_, PlayerDatabase>,
) -> Result<serde_json::Value, String> {
    get_player_detail_internal(id, &db)
}

// ============================================
// 検索コマンド実装
// ============================================

/// プレイヤー名で検索（部分一致、ページネーション付き）
///
/// # Arguments
/// * `keyword` - 検索キーワード（空文字列の場合は全件取得）
/// * `page` - ページ番号（デフォルト: 1）
/// * `per_page` - 1ページあたりの件数（デフォルト: 50、最大: 100）
/// * `db` - データベース接続
///
/// # Returns
/// * `Result<PaginatedResponse<Player>, String>` - ページネーション付きプレイヤー一覧
///
/// 【機能概要】: プレイヤー名で部分一致検索、大文字小文字を区別しない 🔵
/// 【改善内容】: ヘルパー関数を活用してエスケープ処理とページネーション処理を共通化 🔵
/// 【実装方針】: LIKE句とCOLLATE NOCASE、idx_players_nameインデックス活用 🔵
/// 【セキュリティ】: LIKE特殊文字（%と_）をエスケープしてSQLインジェクション防止 🔵
/// 【パフォーマンス】: インデックススキャン + ページング最適化で高速検索を実現 🔵
/// 【保守性】: DRY原則に従いヘルパー関数で共通処理を抽出 🔵
/// 【テスト対応】: TC-SEARCH-001～013 🔵
pub(crate) fn search_players_by_name_internal(
    keyword: &str,
    page: Option<usize>,
    per_page: Option<usize>,
    db: &PlayerDatabase,
) -> Result<PaginatedResponse<Player>, String> {
    // 【ページネーション正規化】: ヘルパー関数でデフォルト値設定と範囲制限を実施 🔵
    // 【デフォルト値】: page=1, per_page=50（検索は一覧より多めに表示） 🔵
    let (page, per_page) = normalize_pagination(page, per_page, 50);

    // 【LIKE特殊文字エスケープ】: ヘルパー関数でワイルドカード展開を防ぐ 🔵
    // 【セキュリティ対応】: TC-SEARCH-EDGE-001, TC-SEARCH-EDGE-002対応 🔵
    let escaped_keyword = escape_like_pattern(keyword);

    let conn = db.0.lock().unwrap();

    // 【総件数取得】: 検索キーワードに一致するプレイヤー総数をカウント 🔵
    // 【COLLATE NOCASE】: 大文字小文字を区別しない検索（idx_players_name利用） 🔵
    // 【ESCAPE句】: バックスラッシュをエスケープ文字として明示 🔵
    let count_sql =
        "SELECT COUNT(*) FROM players WHERE name LIKE '%' || ? || '%' ESCAPE '\\' COLLATE NOCASE";
    let total: usize = conn
        .query_row(count_sql, params![escaped_keyword], |row| row.get(0))
        .map_err(|e| format!("Failed to count players: {}", e))?;

    // 【総ページ数計算】: ceil(total / per_page) 🔵
    let total_pages = if total == 0 {
        0 // 【エッジケース対応】: TC-SEARCH-ERR-001（ヒット0件時は0ページ） 🔵
    } else {
        total.div_ceil(per_page)
    };

    // 【OFFSET/LIMIT計算】: ページネーション用のオフセット計算 🔵
    let offset = (page - 1) * per_page;

    // 【プレイヤー検索】: LIKE部分一致、updated_at降順、LIMIT/OFFSET適用 🔵
    // 【パフォーマンス】: idx_players_name（COLLATE NOCASE）インデックスを活用 🔵
    // 【ソート】: TC-SEARCH-007対応、最新更新順で表示 🔵
    // 【ESCAPE句】: バックスラッシュをエスケープ文字として明示 🔵
    let search_sql = "SELECT id, name, category_id, created_at, updated_at
                      FROM players
                      WHERE name LIKE '%' || ? || '%' ESCAPE '\\' COLLATE NOCASE
                      ORDER BY updated_at DESC
                      LIMIT ? OFFSET ?";

    let mut stmt = conn
        .prepare(search_sql)
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let players = stmt
        .query_map(params![escaped_keyword, per_page, offset], |row| {
            Ok(Player {
                id: row.get(0)?,
                name: row.get(1)?,
                category_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| format!("Failed to query players: {}", e))?
        .collect::<Result<Vec<Player>, _>>()
        .map_err(|e| format!("Failed to collect players: {}", e))?;

    // 【レスポンス構築】: ページネーション情報を含むレスポンスを返す 🔵
    Ok(PaginatedResponse {
        data: players,
        total,
        page,
        per_page,
        total_pages,
    })
}

#[tauri::command]
pub async fn search_players_by_name(
    keyword: String,
    page: Option<usize>,
    per_page: Option<usize>,
    db: State<'_, PlayerDatabase>,
) -> Result<PaginatedResponse<Player>, String> {
    search_players_by_name_internal(&keyword, page, per_page, &db)
}
