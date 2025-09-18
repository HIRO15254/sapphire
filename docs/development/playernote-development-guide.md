# PlayerNote機能 開発ガイド

## 概要

本ドキュメントは、PlayerNote機能の開発・実装に関する技術的な詳細と手順を記載しています。

## 前提条件

- Rustの基本的な知識
- React + TypeScriptの開発経験
- SQLiteの基本的な理解
- Tauriフレームワークの基本概念

## 開発環境セットアップ

### 必要な依存関係の追加

#### Rustバックエンド (`src-tauri/Cargo.toml`)

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "sqlite", "chrono"] }
tokio = { version = "1.0", features = ["full"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4"] }
```

#### フロントエンド (`package.json`)

```json
{
  "dependencies": {
    "@mantine/dates": "^8.3.0",
    "@mantine/form": "^8.3.0",
    "@mantine/spotlight": "^8.3.0",
    "react-hook-form": "^7.48.0",
    "use-debounce": "^10.0.0"
  }
}
```

## データベース実装

### 1. マイグレーション作成

`src-tauri/migrations/` ディレクトリを作成し、以下のファイルを追加:

#### `001_create_playernote_tables.sql`

```sql
-- ラベルテーブル
CREATE TABLE labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- タグテーブル
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- プレイヤーテーブル
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    label_id INTEGER REFERENCES labels(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- プレイヤー-タグ関連テーブル
CREATE TABLE player_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, tag_id)
);

-- ノートテーブル
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_label_id ON players(label_id);
CREATE INDEX idx_player_tags_player_id ON player_tags(player_id);
CREATE INDEX idx_player_tags_tag_id ON player_tags(tag_id);
CREATE INDEX idx_notes_player_id ON notes(player_id);
```

### 2. データベース接続設定

`src-tauri/src/database.rs` を作成:

```rust
use sqlx::{sqlite::SqlitePool, Pool, Sqlite};
use std::path::PathBuf;
use tauri::Manager;

pub type DbPool = Pool<Sqlite>;

pub async fn initialize_database(app_handle: &tauri::AppHandle) -> Result<DbPool, sqlx::Error> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .expect("failed to resolve app data directory");

    std::fs::create_dir_all(&app_dir).expect("failed to create app data directory");

    let database_path = app_dir.join("sapphire.db");
    let database_url = format!("sqlite:{}", database_path.display());

    let pool = SqlitePool::connect(&database_url).await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}
```

## バックエンド実装

### 1. データ構造定義

`src-tauri/src/models.rs` を作成:

```rust
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Player {
    pub id: Option<i64>,
    pub name: String,
    pub label_id: Option<i64>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Label {
    pub id: Option<i64>,
    pub name: String,
    pub color: String,
    pub description: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Tag {
    pub id: Option<i64>,
    pub name: String,
    pub color: String,
    pub description: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Note {
    pub id: Option<i64>,
    pub player_id: i64,
    pub content: String,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlayerWithDetails {
    #[serde(flatten)]
    pub player: Player,
    pub label: Option<Label>,
    pub tags: Vec<Tag>,
    pub note: Option<Note>,
}
```

### 2. API関数実装

`src-tauri/src/playernote_commands.rs` を作成:

```rust
use crate::{database::DbPool, models::*};
use tauri::State;
use sqlx::Row;

// プレイヤー関連コマンド
#[tauri::command]
pub async fn create_player(
    pool: State<'_, DbPool>,
    name: String,
) -> Result<Player, String> {
    let result = sqlx::query!(
        "INSERT INTO players (name) VALUES (?) RETURNING id, name, label_id, created_at, updated_at",
        name
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    // プレイヤー作成と同時にノートも作成
    sqlx::query!(
        "INSERT INTO notes (player_id) VALUES (?)",
        result.id
    )
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(Player {
        id: Some(result.id),
        name: result.name,
        label_id: result.label_id,
        created_at: result.created_at,
        updated_at: result.updated_at,
    })
}

#[tauri::command]
pub async fn get_players_with_details(
    pool: State<'_, DbPool>,
    search: Option<String>,
    label_id: Option<i64>,
    tag_ids: Option<Vec<i64>>,
) -> Result<Vec<PlayerWithDetails>, String> {
    let mut query = String::from("
        SELECT DISTINCT p.*, l.name as label_name, l.color as label_color
        FROM players p
        LEFT JOIN labels l ON p.label_id = l.id
    ");

    let mut conditions = Vec::new();
    let mut params = Vec::new();

    if let Some(search_term) = search {
        conditions.push("p.name LIKE ?");
        params.push(format!("%{}%", search_term));
    }

    if let Some(label_id) = label_id {
        conditions.push("p.label_id = ?");
        params.push(label_id.to_string());
    }

    if let Some(tag_ids) = tag_ids {
        if !tag_ids.is_empty() {
            conditions.push(&format!("p.id IN (
                SELECT pt.player_id FROM player_tags pt
                WHERE pt.tag_id IN ({})
            )", tag_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",")));
            for tag_id in tag_ids {
                params.push(tag_id.to_string());
            }
        }
    }

    if !conditions.is_empty() {
        query.push_str(" WHERE ");
        query.push_str(&conditions.join(" AND "));
    }

    query.push_str(" ORDER BY p.updated_at DESC");

    // 実際の実装では、より効率的なクエリを書く必要があります
    // ここでは簡略化したバージョンを示しています

    Ok(vec![]) // 実装省略
}

// その他のコマンド関数も同様に実装...
```

### 3. main.rs での登録

`src-tauri/src/main.rs` を更新:

```rust
mod database;
mod models;
mod playernote_commands;

use database::initialize_database;
use playernote_commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let pool = tauri::async_runtime::block_on(async {
                initialize_database(app.handle()).await
            }).expect("failed to initialize database");

            app.manage(pool);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_player,
            get_players_with_details,
            // その他のコマンド...
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## フロントエンド実装

### 1. API フック作成

`src/hooks/usePlayerNote.ts` を作成:

```typescript
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useState } from 'react';

export interface Player {
  id?: number;
  name: string;
  label_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Label {
  id?: number;
  name: string;
  color: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export function usePlayerNote() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlayer = useCallback(async (name: string): Promise<Player> => {
    try {
      setLoading(true);
      const player = await invoke<Player>('create_player', { name });
      setPlayers(prev => [player, ...prev]);
      return player;
    } catch (err) {
      const errorMsg = err as string;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlayers = useCallback(async (
    search?: string,
    labelId?: number,
    tagIds?: number[]
  ) => {
    try {
      setLoading(true);
      const playersData = await invoke<Player[]>('get_players_with_details', {
        search,
        labelId,
        tagIds,
      });
      setPlayers(playersData);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    players,
    labels,
    loading,
    error,
    createPlayer,
    loadPlayers,
  };
}
```

### 2. メインコンポーネント作成

`src/components/PlayerNote/PlayerNoteApp.tsx` を作成:

```tsx
import { useState } from 'react';
import { Container, Tabs } from '@mantine/core';
import { PlayerList } from './PlayerList';
import { LabelManager } from './LabelManager';
import { TagManager } from './TagManager';

export function PlayerNoteApp() {
  const [activeTab, setActiveTab] = useState<string | null>('players');

  return (
    <Container size="xl" py="md">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="players">プレイヤー</Tabs.Tab>
          <Tabs.Tab value="labels">ラベル管理</Tabs.Tab>
          <Tabs.Tab value="tags">タグ管理</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="players" pt="md">
          <PlayerList />
        </Tabs.Panel>

        <Tabs.Panel value="labels" pt="md">
          <LabelManager />
        </Tabs.Panel>

        <Tabs.Panel value="tags" pt="md">
          <TagManager />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
```

## テスト実装

### 1. バックエンドテスト

`src-tauri/src/tests/playernote_tests.rs` を作成:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    use tempfile::NamedTempFile;

    async fn setup_test_db() -> DbPool {
        let temp_file = NamedTempFile::new().unwrap();
        let database_url = format!("sqlite:{}", temp_file.path().display());

        let pool = SqlitePoolOptions::new()
            .connect(&database_url)
            .await
            .unwrap();

        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        pool
    }

    #[tokio::test]
    async fn test_create_player() {
        let pool = setup_test_db().await;
        let state = tauri::State::from(&pool);

        let result = create_player(state, "Test Player".to_string()).await;

        assert!(result.is_ok());
        let player = result.unwrap();
        assert_eq!(player.name, "Test Player");
        assert!(player.id.is_some());
    }

    // 他のテストケースも追加...
}
```

### 2. フロントエンドテスト

`src/components/PlayerNote/__tests__/PlayerNoteApp.test.tsx` を作成:

```tsx
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { PlayerNoteApp } from '../PlayerNoteApp';

const renderWithMantine = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('PlayerNoteApp', () => {
  test('renders tabs correctly', () => {
    renderWithMantine(<PlayerNoteApp />);

    expect(screen.getByText('プレイヤー')).toBeInTheDocument();
    expect(screen.getByText('ラベル管理')).toBeInTheDocument();
    expect(screen.getByText('タグ管理')).toBeInTheDocument();
  });
});
```

## デバッグとトラブルシューティング

### よくある問題

#### 1. データベース接続エラー
```
Error: failed to connect to database
```

**解決策:**
- アプリデータディレクトリの権限を確認
- SQLiteドライバーが正しくインストールされているか確認

#### 2. マイグレーションエラー
```
Error: migration failed
```

**解決策:**
- マイグレーションファイルのSQL構文を確認
- データベースファイルを削除して再作成

#### 3.型エラー
```
TypeScript error: Property 'xxx' does not exist
```

**解決策:**
- Rust側の型定義とTypeScript側の型定義が一致しているか確認
- Serdeの設定を確認

### デバッグ設定

#### Rust側のログ出力設定

`src-tauri/src/main.rs`:

```rust
use tracing::{info, error};
use tracing_subscriber;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::init();

    info!("Starting Sapphire application");

    // 既存のコード...
}
```

#### フロントエンド側のデバッグ

開発者ツールでTauriコマンドの呼び出しを確認:

```typescript
const debugInvoke = async (cmd: string, args?: any) => {
  console.log(`Invoking: ${cmd}`, args);
  try {
    const result = await invoke(cmd, args);
    console.log(`Result: ${cmd}`, result);
    return result;
  } catch (error) {
    console.error(`Error: ${cmd}`, error);
    throw error;
  }
};
```

## パフォーマンス最適化

### データベース最適化

1. **適切なインデックス作成**
   - 頻繁に検索されるカラムにインデックスを作成
   - 複合インデックスの検討

2. **クエリ最適化**
   - N+1問題の回避
   - 必要なデータのみを取得

3. **接続プール設定**
   - 適切な接続数の設定
   - 接続タイムアウトの調整

### フロントエンド最適化

1. **状態管理の最適化**
   - 不要な再レンダリングの回避
   - メモ化の活用

2. **遅延読み込み**
   - 大量データの場合のページネーション
   - 仮想スクロールの検討

## 本番環境への展開

### ビルド設定

`src-tauri/tauri.conf.json`:

```json
{
  "build": {
    "beforeBuildCommand": "bun run build",
    "beforeDevCommand": "bun run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Sapphire",
    "version": "0.0.4"
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis", "deb", "appimage", "dmg"]
  }
}
```

### リリースビルド

```bash
# 依存関係のインストール
bun install

# フロントエンドビルド
bun run build

# Tauriアプリケーションビルド
bun run tauri build
```

## 今後の拡張計画

### 短期的な改善点
- ユニットテストのカバレッジ向上
- エラーハンドリングの改善
- UIコンポーネントの最適化

### 長期的な機能拡張
- データのクラウド同期
- 統計分析機能
- モバイルアプリ対応（Tauri 2.0）

---

## 参考資料

- [Tauri公式ドキュメント](https://tauri.app/)
- [SQLx ドキュメント](https://github.com/launchbadge/sqlx)
- [Mantine UI ドキュメント](https://mantine.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)