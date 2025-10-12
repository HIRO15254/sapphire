# TASK-0013: プレイヤー総合メモ更新コマンド実装 - TDD要件定義書

## 📋 メタ情報

- **タスクID**: TASK-0013
- **GitHub Issue**: #17
- **要件名**: プレイヤーメモ機能
- **機能名**: プレイヤー総合メモ更新・取得
- **作成日**: 2025-10-09
- **TDDフェーズ**: 要件定義（Requirements）

---

## 1. 機能の概要

### 🔵 機能の説明

プレイヤー総合メモの更新・取得機能を実装します。プレイヤーごとに1つ自動作成される総合メモ（HTML形式）の内容を更新し、取得するためのTauriコマンドを提供します。

#### 何をする機能か

- **update_player_summary**: プレイヤー総合メモのHTML内容を更新する
- **get_player_summary**: プレイヤー総合メモを取得する

#### どのような問題を解決するか

- プレイヤーに関する統合的な情報（攻略メモ、対戦履歴、傾向分析など）を一元管理
- プレイヤー作成時に自動生成される総合メモを後から編集可能にする
- HTML形式による豊富な表現力（フォーマット、リスト、テーブルなど）の提供

#### 想定されるユーザー

- ゲームプレイヤー分析を行うユーザー
- プレイヤーの総合的な攻略情報を記録したいユーザー
- Tiptapエディタを使用してリッチテキストメモを作成するユーザー

#### システム内での位置づけ

- **データベース層**: `player_summaries`テーブル（TASK-0001で作成済み）
- **FTS層**: `player_summaries_fts`テーブル（TASK-0002でトリガー設定済み）
- **CRUD層**: プレイヤーCRUD（TASK-0004）で総合メモ自動作成済み
- **UI層**: Tiptapエディタ統合（将来のフロントエンド実装）

### 🔵 参照したEARS要件

- **REQ-303**: システムは1プレイヤーに1つのプレイヤー総合メモを自動作成しなければならない
  - ※ プレイヤー作成時の自動作成はTASK-0004で実装済み
  - 本タスクでは更新・取得のみを実装
- **REQ-304**: プレイヤー総合メモはHTML形式で保存しなければならない
- **EDGE-104**: メモのHTML内容は最大1MBまでとする

### 🔵 参照した設計文書

- **データベーススキーマ**: `src-tauri/src/database/schema.rs`
  - `player_summaries`テーブル定義
  - FTSトリガー（`player_summaries_ai/au/ad`）
- **モデル定義**: `src-tauri/src/database/models.rs`
  - `PlayerSummary`エンティティ
  - `UpdateSummaryRequest`リクエスト型
  - `NOTE_CONTENT_MAX_BYTES`定数（1048576バイト）
- **既存実装パターン**: `src-tauri/src/commands/notes.rs`
  - ヘルパー関数パターン（validate, check, get）
  - エラーハンドリングパターン
  - サイズバリデーションロジック

---

## 2. 入力・出力の仕様

### 🔵 update_player_summary(player_id, content)

#### 入力パラメータ

| パラメータ名 | 型 | 必須 | 制約 | 説明 |
|------------|-----|------|------|------|
| `player_id` | `i64` | ✅ | 正の整数、存在するプレイヤーID | 総合メモを更新するプレイヤーのID |
| `content` | `String` | ✅ | HTML形式、最大1MB（1048576バイト） | 更新後のHTML内容 |

#### 出力値

- **成功時**: `Result<PlayerSummary, String>` の Ok バリアント
  - 更新後の総合メモ情報を含む`PlayerSummary`エンティティ

```rust
PlayerSummary {
    id: i64,              // 総合メモID
    player_id: i64,       // プレイヤーID
    content: String,      // 更新後のHTML内容
    created_at: String,   // 作成日時（ISO 8601）
    updated_at: String,   // 更新日時（ISO 8601、自動更新される）
}
```

- **エラー時**: `Result<PlayerSummary, String>` の Err バリアント

| エラーメッセージ | 発生条件 |
|----------------|----------|
| `"Player not found"` | 指定されたplayer_idが存在しない |
| `"Summary not found"` | プレイヤーに総合メモが未作成（通常発生しない） |
| `"Summary content exceeds 1MB limit"` | contentのバイト数が1048576を超過 |
| `"Failed to update summary"` | DB更新エラー（その他） |

### 🔵 get_player_summary(player_id)

#### 入力パラメータ

| パラメータ名 | 型 | 必須 | 制約 | 説明 |
|------------|-----|------|------|------|
| `player_id` | `i64` | ✅ | 正の整数、存在するプレイヤーID | 総合メモを取得するプレイヤーのID |

#### 出力値

- **成功時**: `Result<PlayerSummary, String>` の Ok バリアント
  - プレイヤーの総合メモ情報を含む`PlayerSummary`エンティティ

- **エラー時**: `Result<PlayerSummary, String>` の Err バリアント

| エラーメッセージ | 発生条件 |
|----------------|----------|
| `"Player not found"` | 指定されたplayer_idが存在しない |
| `"Summary not found"` | プレイヤーに総合メモが未作成（通常発生しない） |

### 🔵 データフロー

```
[Frontend: Tiptapエディタ]
        ↓ (HTML content)
[Tauri Command: update_player_summary]
        ↓
[バリデーション: サイズチェック]
        ↓
[バリデーション: プレイヤー存在確認]
        ↓
[DB: UPDATE player_summaries]
        ↓ (トリガー自動実行)
[FTS: UPDATE player_summaries_fts]
        ↓
[DB: updated_at自動更新]
        ↓
[取得: get_summary_by_player_id]
        ↓
[Frontend: 更新完了表示]
```

### 🔵 参照したEARS要件

- **REQ-304**: HTML形式での保存（入力contentはHTML形式）
- **EDGE-104**: 最大1MB制限（入力バリデーション）

### 🔵 参照した設計文書

- **TypeScript型定義**: `src-tauri/src/database/models.rs`
  - `PlayerSummary`エンティティ（出力型）
  - `UpdateSummaryRequest`リクエスト型（入力型）

---

## 3. 制約条件

### 🔵 パフォーマンス要件

- **NFR-003**: 検索・フィルタリング結果は1秒以内に表示されなければならない
  - FTSトリガーによる自動インデックス更新（UPDATE時）
  - trigramトークナイザーによる日本語全文検索対応

### 🔵 セキュリティ要件

- **SQLインジェクション対策**: パラメータ化クエリの使用
- **DoS攻撃対策**: 1MBサイズ制限によるメモリ使用量制御
- **DB詳細の隠蔽**: エラーメッセージでDB内部エラーを露出しない

### 🔵 データベース制約

| 制約タイプ | 内容 | 実装箇所 |
|----------|------|---------|
| UNIQUE制約 | `player_id`カラム（1プレイヤー1総合メモ） | スキーマ定義 |
| CHECK制約 | `length(content) <= 1048576` | スキーマ定義 |
| FOREIGN KEY | `player_id`はplayersテーブルを参照（CASCADE削除） | スキーマ定義 |
| DEFAULT制約 | `updated_at = CURRENT_TIMESTAMP` | スキーマ定義 |

### 🔵 アーキテクチャ制約

- **ヘルパー関数パターン**: 既存のnotes.rsと一貫性を保つ
  - `validate_summary_content_size`: サイズバリデーション
  - `check_player_exists`: プレイヤー存在確認
  - `check_summary_exists`: 総合メモ存在確認（player_idベース）
  - `get_summary_by_player_id`: 総合メモ取得
- **内部関数 + Tauri コマンド**: テスタビリティの向上
  - `update_player_summary_internal` + `update_player_summary`
  - `get_player_summary_internal` + `get_player_summary`
- **エラーハンドリング**: `Result<T, String>`型で統一

### 🔵 API制約

- **命名規則**: 既存のCRUDコマンドと一貫性を保つ
  - `update_player_summary` (player_notes の `update_player_note` と同様)
  - `get_player_summary` (player_notes の `get_player_notes` と同様)
- **非同期関数**: `async fn` でTauriコマンドを実装

### 🔵 参照したEARS要件

- **NFR-003**: 検索パフォーマンス（1秒以内）
- **REQ-701**: SQLiteデータベース使用
- **EDGE-104**: 1MB制限（セキュリティ・パフォーマンス両面）

### 🔵 参照した設計文書

- **データベーススキーマ**: `src-tauri/src/database/schema.rs`
  - UNIQUE制約、CHECK制約、FOREIGN KEY制約
  - FTSトリガー定義
- **既存実装パターン**: `src-tauri/src/commands/notes.rs`
  - ヘルパー関数アーキテクチャ
  - エラーハンドリングパターン

---

## 4. 想定される使用例

### 🔵 基本的な使用パターン

#### ケース1: 総合メモの初回編集

```
前提条件: プレイヤー作成時に空の総合メモが自動作成されている
入力: player_id=1, content="<h1>攻略メモ</h1><p>初心者</p>"
処理: 総合メモを更新
期待結果: PlayerSummary { id=1, player_id=1, content="<h1>攻略メモ</h1><p>初心者</p>", updated_at=現在時刻 }
```

#### ケース2: 総合メモの取得

```
前提条件: プレイヤーに総合メモが存在する
入力: player_id=1
処理: 総合メモを取得
期待結果: PlayerSummary { id=1, player_id=1, content="...", created_at="...", updated_at="..." }
```

#### ケース3: 総合メモの複数回更新

```
前提条件: プレイヤーに総合メモが存在する
操作1: update_player_summary(1, "<p>内容1</p>") → updated_at = T1
操作2: update_player_summary(1, "<p>内容2</p>") → updated_at = T2 (T2 > T1)
期待結果: 最新の内容が保存され、updated_atが更新される
```

### 🟡 エッジケース

#### エッジ1: 空文字列のメモ

```
入力: player_id=1, content=""
処理: 空のHTML内容で更新
期待結果: 成功（0バイトは1MB以下なのでOK）
```

#### エッジ2: 最大サイズのメモ（1MB丁度）

```
入力: player_id=1, content=（1048576バイトのHTML）
処理: 最大サイズのHTML内容で更新
期待結果: 成功（ちょうど1MBなのでOK）
```

#### エッジ3: 最大サイズ+1バイトのメモ

```
入力: player_id=1, content=（1048577バイトのHTML）
処理: サイズ超過のバリデーションエラー
期待結果: Err("Summary content exceeds 1MB limit")
```

#### エッジ4: 特殊HTML文字を含むメモ

```
入力: player_id=1, content="<p>&lt;script&gt;alert('test')&lt;/script&gt;</p>"
処理: エスケープ済みHTML内容で更新
期待結果: 成功（HTMLとしてそのまま保存、フロントエンド側でサニタイズ）
```

### 🔵 エラーケース

#### エラー1: 存在しないプレイヤー

```
入力: player_id=99999, content="<p>テスト</p>"
処理: プレイヤー存在確認でエラー
期待結果: Err("Player not found")
```

#### エラー2: 総合メモが未作成（異常ケース）

```
前提条件: 何らかの理由でplayer_summariesにエントリがない
入力: player_id=1, content="<p>テスト</p>"
処理: 総合メモ存在確認でエラー
期待結果: Err("Summary not found")
注記: 通常は発生しない（プレイヤー作成時に必ず作成されるため）
```

#### エラー3: サイズ超過

```
入力: player_id=1, content=（2MBのHTML）
処理: サイズバリデーションでエラー
期待結果: Err("Summary content exceeds 1MB limit")
```

### 🔵 FTSトリガーの動作確認

#### シナリオ: 総合メモ更新時のFTS同期

```
1. update_player_summary(1, "<p>攻略メモ: 初心者向け</p>")
   → player_summaries テーブル更新
   → player_summaries_au トリガー実行
   → player_summaries_fts テーブル自動更新
2. 検索クエリ: SELECT * FROM player_summaries_fts WHERE content MATCH '攻略'
   → summary_id=1 がヒット（FTSが正しく更新されている）
```

### 🔵 参照したEARS要件

- **REQ-303**: 自動作成（エッジケース4参照）
- **REQ-304**: HTML形式（全ケース）
- **EDGE-104**: 1MB制限（エッジケース2, 3参照）

### 🔵 参照した設計文書

- **データフロー**: FTSトリガーの自動実行フロー
- **データベーススキーマ**: トリガー定義（`player_summaries_au`）

---

## 5. EARS要件・設計文書との対応関係

### 🔵 参照したユーザストーリー

Issue #17のタスク説明より:

> **実装するTauriコマンド**:
> 1. `update_player_summary(player_id, content)` → `Result<PlayerSummary, String>`
> 2. `get_player_summary(player_id)` → `Result<PlayerSummary, String>`
>
> **注意事項**:
> - 総合メモの作成は TASK-0004 (create_player) で実装済み
> - このタスクでは更新・取得のみを実装

### 🔵 参照した機能要件

- **REQ-303**: システムは1プレイヤーに1つのプレイヤー総合メモを自動作成しなければならない 🔵
  - ※ TASK-0004で実装済み
- **REQ-304**: プレイヤー総合メモはHTML形式で保存しなければならない 🔵

### 🔵 参照した非機能要件

- **NFR-003**: 検索・フィルタリング結果は1秒以内に表示されなければならない 🟡
  - FTSトリガーによる全文検索インデックス自動更新

### 🔵 参照したEdgeケース

- **EDGE-104**: メモのHTML内容は最大1MBまでとする 🟡
  - `NOTE_CONTENT_MAX_BYTES = 1048576`でバリデーション

### 🔵 参照した受け入れ基準

Issue #17の完了条件より:

- [x] 2つのTauriコマンドが実装される
- [ ] Rustの単体テストが通過
- [ ] 1MBサイズ制限が正しく動作
- [ ] FTSトリガーが正しく動作（更新）
- [ ] updated_at が自動更新される

### 🔵 参照した設計文書

#### アーキテクチャ

- **コマンド層**: `src-tauri/src/commands/`
  - 既存パターン: `players.rs`, `notes.rs`と一貫性を保つ

#### データフロー

1. **更新フロー**:
   ```
   Frontend → Tauri Command → Validation → DB Update → Trigger (FTS) → Response
   ```

2. **取得フロー**:
   ```
   Frontend → Tauri Command → Validation → DB SELECT → Response
   ```

#### TypeScript型定義（Rustモデル）

- **PlayerSummary**: `src-tauri/src/database/models.rs:74-82`
  ```rust
  pub struct PlayerSummary {
      pub id: i64,
      pub player_id: i64,
      pub content: String, // HTML
      pub created_at: String,
      pub updated_at: String,
  }
  ```

- **UpdateSummaryRequest**: `src-tauri/src/database/models.rs:187-192`
  ```rust
  pub struct UpdateSummaryRequest {
      pub player_id: i64,
      pub content: String, // HTML
  }
  ```

- **バリデーション定数**: `src-tauri/src/database/models.rs:243`
  ```rust
  pub const NOTE_CONTENT_MAX_BYTES: usize = 1048576; // 1MB
  ```

#### データベーススキーマ

- **player_summariesテーブル**: `src-tauri/src/database/schema.rs:63-71`
  ```sql
  CREATE TABLE IF NOT EXISTS player_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL UNIQUE,
    content TEXT NOT NULL CHECK(length(content) <= 1048576),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  );
  ```

- **FTSトリガー**: `src-tauri/src/database/schema.rs:148-158`
  ```sql
  -- UPDATE時: FTSテーブルのエントリ更新
  CREATE TRIGGER IF NOT EXISTS player_summaries_au AFTER UPDATE ON player_summaries
  BEGIN
    UPDATE player_summaries_fts SET content = new.content WHERE summary_id = old.id;
  END;
  ```

#### API仕様

- **update_player_summary**
  - エンドポイント: Tauriコマンド（IPC）
  - リクエスト: `{ player_id: i64, content: String }`
  - レスポンス: `Result<PlayerSummary, String>`

- **get_player_summary**
  - エンドポイント: Tauriコマンド（IPC）
  - リクエスト: `{ player_id: i64 }`
  - レスポンス: `Result<PlayerSummary, String>`

---

## 6. 実装方針

### 🔵 ヘルパー関数の設計

既存の`notes.rs`パターンに従い、以下のヘルパー関数を実装します：

1. **validate_summary_content_size(content: &str)**
   - contentのバイト数が1MB以下かチェック
   - エラー時: `"Summary content exceeds 1MB limit"`

2. **check_player_exists(conn: &Connection, player_id: i64)**
   - ※ `players.rs`に既存のヘルパー関数があるため、それを再利用
   - エラー時: `"Player not found"`

3. **check_summary_exists(conn: &Connection, player_id: i64)**
   - player_idに対応する総合メモが存在するかチェック
   - エラー時: `"Summary not found"`

4. **get_summary_by_player_id(conn: &Connection, player_id: i64)**
   - player_idから総合メモを取得してPlayerSummaryエンティティを返す
   - エラー時: `"Summary not found"`

### 🔵 内部関数の設計

1. **update_player_summary_internal(player_id: i64, content: &str, db: &PlayerDatabase)**
   ```rust
   // 1. サイズバリデーション
   validate_summary_content_size(content)?;

   // 2. プレイヤー存在確認（players.rsのヘルパー関数を再利用）
   check_player_exists(&conn, player_id)?;

   // 3. 総合メモ存在確認
   check_summary_exists(&conn, player_id)?;

   // 4. UPDATE実行（updated_at自動更新、FTSトリガー自動実行）
   conn.execute(
       "UPDATE player_summaries SET content = ?1, updated_at = CURRENT_TIMESTAMP
        WHERE player_id = ?2",
       params![content, player_id]
   )?;

   // 5. 更新後の総合メモを取得して返す
   get_summary_by_player_id(&conn, player_id)
   ```

2. **get_player_summary_internal(player_id: i64, db: &PlayerDatabase)**
   ```rust
   // 1. プレイヤー存在確認
   check_player_exists(&conn, player_id)?;

   // 2. 総合メモ取得
   get_summary_by_player_id(&conn, player_id)
   ```

### 🔵 Tauriコマンドの設計

```rust
#[tauri::command]
pub async fn update_player_summary(
    player_id: i64,
    content: String,
    db: State<'_, PlayerDatabase>,
) -> Result<PlayerSummary, String> {
    update_player_summary_internal(player_id, &content, &db)
}

#[tauri::command]
pub async fn get_player_summary(
    player_id: i64,
    db: State<'_, PlayerDatabase>,
) -> Result<PlayerSummary, String> {
    get_player_summary_internal(player_id, &db)
}
```

---

## 7. テスト戦略（次フェーズで詳細化）

次の`/tdd-testcases`フェーズで以下のテストケースを洗い出します：

### 正常系
- 総合メモの初回更新
- 総合メモの複数回更新
- 総合メモの取得
- 空文字列の総合メモ更新

### 異常系
- 存在しないプレイヤーID
- 存在しないプレイヤーの総合メモ取得
- サイズ超過（1MB+1バイト）

### 境界値
- 最大サイズ丁度（1MB）
- 最大サイズ-1バイト
- 最大サイズ+1バイト

### 特殊ケース
- 特殊HTML文字を含むメモ
- 非常に長いHTML（ネスト深度の大きいHTML）
- FTSトリガーの動作確認（更新時の全文検索インデックス同期）

---

## 8. 品質判定

### ✅ 高品質: 要件定義完了

- **要件の曖昧さ**: なし 🔵
  - EARS要件、Issue #17、既存実装パターンから明確に定義
- **入出力定義**: 完全 🔵
  - 型、制約、エラーメッセージまで具体的に定義
- **制約条件**: 明確 🔵
  - DB制約、アーキテクチャ制約、セキュリティ要件を網羅
- **実装可能性**: 確実 🔵
  - 既存のnotes.rs、players.rsパターンを踏襲
  - ヘルパー関数の再利用で実装工数削減

---

## 9. 次のステップ

✅ 要件定義が完了しました。

次のお勧めステップ: **`/tdd-testcases 17`** でテストケースの洗い出しを行います。

このコマンドにより、以下のテストケースを網羅的に定義します：
- 正常系テストケース
- 異常系テストケース
- 境界値テストケース
- FTSトリガー動作確認テストケース
