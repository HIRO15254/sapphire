# TDD Requirements - TASK-0511: リッチテキストメモAPI実装

## 概要

プレイヤーごとのリッチテキスト形式メモ機能を提供するAPIを実装する。TipTapエディタとの統合、効率的なUPSERT操作、JSON/HTML形式のリッチテキスト処理、高性能なメモ取得・保存システムを構築する。

## 要件ソース

- **要件定義**: REQ-004, REQ-106, NFR-103
- **依存タスク**: TASK-0510 ✅ 完了済み
- **推定工数**: 12時間（1.5日）

## 機能要件

### 🔵 青信号項目（要件準拠）

#### FS-01: プレイヤーメモ取得API
- **要件**: REQ-004
- **説明**: プレイヤーごとのリッチテキストメモを取得
- **APIコマンド**: `get_player_note`
- **対象データ**: player_notes.content フィールド
- **リッチテキスト形式**: TipTap JSON/HTML対応
- **メモ未存在**: 空レスポンスを返す

#### FS-02: プレイヤーメモ保存API
- **要件**: REQ-004, REQ-106
- **説明**: プレイヤーごとのリッチテキストメモを保存・更新
- **APIコマンド**: `save_player_note`
- **操作方式**: UPSERT（既存更新/新規作成）
- **TipTapエディタ**: JSON形式コンテンツ対応
- **HTML対応**: HTMLエスケープ・サニタイゼーション

#### FS-03: リッチテキスト処理
- **要件**: REQ-106, NFR-103
- **エディタ統合**: TipTapエディタからのJSON形式
- **サポート機能**: 太字、斜体、色付け、箇条書き、リンク
- **データ形式**: JSONとHTMLの相互変換
- **文字エンコーディング**: UTF-8対応

### 🟡 黄信号項目（妥当な推測）

#### FS-04: データバリデーション
- **コンテンツサイズ**: 最大10MB制限
- **HTML安全性**: XSS対策サニタイゼーション
- **JSON形式検証**: TipTap形式準拠チェック
- **プレイヤー存在確認**: 有効なplayer_id検証

#### FS-05: 自動タイムスタンプ
- **作成日時**: created_atの自動設定
- **更新日時**: updated_atの自動更新
- **ISO 8601形式**: 標準的な日時フォーマット
- **タイムゾーン**: UTC統一

## パフォーマンス要件

### 🔵 青信号項目（要件準拠）

#### NFR-01: レスポンス時間
- **要件**: NFR-103
- **目標**: ≤300ms（エディタ起動・保存）
- **測定条件**: 中程度サイズのリッチテキスト（10KB）
- **最適化**: データベースインデックス活用

#### NFR-02: メモリ効率
- **リッチテキスト処理**: 効率的なJSON/HTMLパース
- **バッファサイズ**: 適切なメモリ使用量
- **ガベージコレクション**: 最小限のメモリリーク

### 🟡 黄信号項目（妥当な推測）

#### NFR-03: 同時実行性能
- **同時リクエスト**: 5req/sec以上
- **データベースロック**: 最小限の排他制御
- **競合回避**: 楽観的排他制御の検討

## API仕様

### 入力仕様

```typescript
interface GetPlayerNoteRequest {
  player_id: string;           // プレイヤーID（必須）
}

interface SavePlayerNoteRequest {
  player_id: string;           // プレイヤーID（必須）
  content: string;             // TipTap JSON/HTML形式（必須）
}
```

### 出力仕様

```typescript
interface GetPlayerNoteResponse {
  success: boolean;
  data?: PlayerNote;
  error?: ApiError;
}

interface SavePlayerNoteResponse {
  success: boolean;
  data?: PlayerNote;
  error?: ApiError;
}

interface PlayerNote {
  id: string;                  // メモID
  player_id: string;           // プレイヤーID
  content: string;             // リッチテキストコンテンツ
  content_type: 'json' | 'html'; // コンテンツ形式
  created_at: string;          // 作成日時（ISO 8601）
  updated_at: string;          // 更新日時（ISO 8601）
}
```

### エラー仕様

```typescript
interface NoteError {
  code: string;
  message: string;
  details?: {
    player_id?: string;
    content_size?: number;
    validation_errors?: string[];
  };
}

// エラーコード定義
const NOTE_ERROR_CODES = {
  PLAYER_NOT_FOUND: 'NOTE_PLAYER_NOT_FOUND',         // プレイヤー未存在
  CONTENT_TOO_LARGE: 'NOTE_CONTENT_TOO_LARGE',       // コンテンツ過大
  INVALID_JSON: 'NOTE_INVALID_JSON',                 // 無効JSON形式
  INVALID_HTML: 'NOTE_INVALID_HTML',                 // 無効HTML形式
  DATABASE_ERROR: 'NOTE_DATABASE_ERROR',             // DB接続エラー
  VALIDATION_ERROR: 'NOTE_VALIDATION_ERROR',         // バリデーションエラー
  SANITIZATION_FAILED: 'NOTE_SANITIZATION_FAILED',  // サニタイゼーション失敗
} as const;
```

## データベース設計

### テーブル構造

```sql
-- プレイヤーノートテーブル
CREATE TABLE IF NOT EXISTS player_notes (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    player_id TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'json', -- 'json' or 'html'
    content_hash TEXT, -- コンテンツハッシュ（重複検出用）
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(player_id) -- 1プレイヤー1メモ制約
);
```

### インデックス作成

```sql
-- プレイヤーID検索用インデックス
CREATE INDEX IF NOT EXISTS idx_player_notes_player_id
ON player_notes(player_id);

-- 更新日時ソート用インデックス
CREATE INDEX IF NOT EXISTS idx_player_notes_updated_at
ON player_notes(updated_at DESC);

-- コンテンツハッシュ用インデックス（重複検出）
CREATE INDEX IF NOT EXISTS idx_player_notes_content_hash
ON player_notes(content_hash);
```

### UPSERT クエリ最適化

```sql
-- メモ保存（UPSERT）クエリ
INSERT INTO player_notes (player_id, content, content_type, content_hash, updated_at)
VALUES (?, ?, ?, ?, datetime('now'))
ON CONFLICT(player_id) DO UPDATE SET
    content = excluded.content,
    content_type = excluded.content_type,
    content_hash = excluded.content_hash,
    updated_at = datetime('now')
RETURNING *;

-- メモ取得クエリ
SELECT
    id,
    player_id,
    content,
    content_type,
    created_at,
    updated_at
FROM player_notes
WHERE player_id = ?;
```

## Rustバックエンド実装

### コマンド実装

```rust
#[tauri::command]
pub async fn get_player_note(
    player_id: String,
) -> Result<GetPlayerNoteResponse, ApiError> {
    // プレイヤー存在確認
    validate_player_exists(&player_id).await?;

    // データベース接続
    let connection = get_database_connection()?;

    // メモ取得クエリ実行
    let note = query_player_note(&connection, &player_id).await?;

    Ok(GetPlayerNoteResponse {
        success: true,
        data: note,
        error: None,
    })
}

#[tauri::command]
pub async fn save_player_note(
    player_id: String,
    content: String,
) -> Result<SavePlayerNoteResponse, ApiError> {
    let start_time = std::time::Instant::now();

    // バリデーション
    validate_player_exists(&player_id).await?;
    validate_note_content(&content)?;

    // コンテンツ処理
    let processed_content = sanitize_rich_text_content(&content)?;
    let content_type = detect_content_type(&content);
    let content_hash = calculate_content_hash(&processed_content);

    // データベース保存
    let connection = get_database_connection()?;
    let saved_note = upsert_player_note(
        &connection,
        &player_id,
        &processed_content,
        &content_type,
        &content_hash
    ).await?;

    let execution_time = start_time.elapsed().as_millis();
    log::info!("Note saved in {}ms for player {}", execution_time, player_id);

    Ok(SavePlayerNoteResponse {
        success: true,
        data: Some(saved_note),
        error: None,
    })
}
```

### ヘルパー関数

```rust
async fn validate_player_exists(player_id: &str) -> Result<(), ApiError> {
    let connection = get_database_connection()?;
    let exists = sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM players WHERE id = ? LIMIT 1"
    )
    .bind(player_id)
    .fetch_optional(&connection)
    .await?
    .is_some();

    if !exists {
        return Err(ApiError::not_found(
            "NOTE_PLAYER_NOT_FOUND",
            &format!("Player not found: {}", player_id)
        ));
    }

    Ok(())
}

fn validate_note_content(content: &str) -> Result<(), ApiError> {
    // サイズ制限チェック
    if content.len() > 10 * 1024 * 1024 { // 10MB
        return Err(ApiError::validation(
            "NOTE_CONTENT_TOO_LARGE",
            "Content exceeds 10MB limit"
        ));
    }

    // JSON形式の場合の検証
    if content.trim_start().starts_with('{') {
        validate_tiptap_json(content)?;
    }

    Ok(())
}

fn sanitize_rich_text_content(content: &str) -> Result<String, ApiError> {
    // HTMLサニタイゼーション
    let sanitized = html_sanitizer::sanitize(content)
        .map_err(|e| ApiError::validation(
            "NOTE_SANITIZATION_FAILED",
            &format!("HTML sanitization failed: {}", e)
        ))?;

    Ok(sanitized)
}

fn calculate_content_hash(content: &str) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn detect_content_type(content: &str) -> String {
    if content.trim_start().starts_with('{') {
        "json".to_string()
    } else {
        "html".to_string()
    }
}
```

### TipTap JSON検証

```rust
fn validate_tiptap_json(content: &str) -> Result<(), ApiError> {
    let parsed: serde_json::Value = serde_json::from_str(content)
        .map_err(|e| ApiError::validation(
            "NOTE_INVALID_JSON",
            &format!("Invalid JSON format: {}", e)
        ))?;

    // TipTap基本構造検証
    if !parsed.is_object() {
        return Err(ApiError::validation(
            "NOTE_INVALID_JSON",
            "TipTap JSON must be an object"
        ));
    }

    let obj = parsed.as_object().unwrap();

    // 必須フィールド検証
    if !obj.contains_key("type") || !obj.contains_key("content") {
        return Err(ApiError::validation(
            "NOTE_INVALID_JSON",
            "TipTap JSON must contain 'type' and 'content' fields"
        ));
    }

    Ok(())
}
```

## TypeScript型定義

### リクエスト・レスポンス型

```typescript
// src/types/playerNote.ts

export interface GetPlayerNoteRequest {
  player_id: string;
}

export interface SavePlayerNoteRequest {
  player_id: string;
  content: string;
}

export interface GetPlayerNoteResponse {
  success: boolean;
  data?: PlayerNote;
  error?: NoteApiError;
}

export interface SavePlayerNoteResponse {
  success: boolean;
  data?: PlayerNote;
  error?: NoteApiError;
}

export interface PlayerNote {
  id: string;
  player_id: string;
  content: string;
  content_type: 'json' | 'html';
  created_at: string;
  updated_at: string;
}

// TipTap関連型定義
export interface TipTapContent {
  type: string;
  content?: TipTapContent[];
  attrs?: Record<string, any>;
  text?: string;
  marks?: TipTapMark[];
}

export interface TipTapMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface TipTapDocument {
  type: 'doc';
  content: TipTapContent[];
}

// エラー型定義
export const NOTE_ERROR_CODES = {
  PLAYER_NOT_FOUND: 'NOTE_PLAYER_NOT_FOUND',
  CONTENT_TOO_LARGE: 'NOTE_CONTENT_TOO_LARGE',
  INVALID_JSON: 'NOTE_INVALID_JSON',
  INVALID_HTML: 'NOTE_INVALID_HTML',
  DATABASE_ERROR: 'NOTE_DATABASE_ERROR',
  VALIDATION_ERROR: 'NOTE_VALIDATION_ERROR',
  SANITIZATION_FAILED: 'NOTE_SANITIZATION_FAILED',
} as const;

export type NoteErrorCode = typeof NOTE_ERROR_CODES[keyof typeof NOTE_ERROR_CODES];

export interface NoteApiError {
  code: NoteErrorCode;
  message: string;
  details?: {
    player_id?: string;
    content_size?: number;
    validation_errors?: string[];
  };
}
```

### TipTap統合ヘルパー

```typescript
// src/utils/tiptapHelper.ts

export class TipTapHelper {
  /**
   * TipTap JSONをHTMLに変換
   */
  static jsonToHtml(tiptapJson: TipTapDocument): string {
    // TipTapのgenerateHTMLを使用
    return generateHTML(tiptapJson, extensions);
  }

  /**
   * HTMLをTipTap JSONに変換
   */
  static htmlToJson(html: string): TipTapDocument {
    // TipTapのgenerateJSONを使用
    return generateJSON(html, extensions);
  }

  /**
   * TipTap JSONの妥当性検証
   */
  static validateTipTapJson(content: any): boolean {
    try {
      if (typeof content !== 'object' || !content.type || !content.content) {
        return false;
      }
      return content.type === 'doc' && Array.isArray(content.content);
    } catch {
      return false;
    }
  }

  /**
   * コンテンツサイズ計算
   */
  static calculateContentSize(content: string): number {
    return new TextEncoder().encode(content).length;
  }

  /**
   * コンテンツの安全性チェック
   */
  static sanitizeContent(content: string): string {
    // DOMPurifyまたは類似ライブラリを使用
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'style'],
    });
  }
}
```

## テスト要件

### 📊 単体テスト（Unit Tests）

#### UT-01: メモ取得機能テスト
- 有効なプレイヤーIDでのメモ取得
- メモ未存在時の空レスポンス
- 無効なプレイヤーIDエラー処理
- データベース接続エラー処理

#### UT-02: メモ保存機能テスト
- 新規メモ作成（INSERT）
- 既存メモ更新（UPDATE）
- TipTap JSON形式の保存
- HTML形式の保存

#### UT-03: リッチテキスト処理テスト
- TipTap JSON検証機能
- HTMLサニタイゼーション
- JSON/HTML相互変換
- 特殊文字エスケープ

#### UT-04: バリデーション テスト
- コンテンツサイズ制限（10MB）
- 無効JSON形式エラー
- XSS攻撃対策検証
- プレイヤー存在確認

### 🔄 統合テスト（Integration Tests）

#### IT-01: データベース統合テスト
- UPSERT操作の動作確認
- インデックス活用検証
- トランザクション処理
- カスケード削除確認

#### IT-02: パフォーマンステスト
- 300ms以内レスポンス確認
- 大量リッチテキスト処理性能
- 同時リクエスト処理
- メモリ使用量監視

#### IT-03: TipTap統合テスト
- TipTapエディタとの連携
- JSON/HTML形式変換
- リッチテキスト機能検証
- クロスブラウザ対応

## 受け入れ基準

### ✅ 機能的受け入れ基準

1. **AC-01**: プレイヤーID"player123"のメモが正常に取得できる
2. **AC-02**: 新規プレイヤーのメモ保存で新しいレコードが作成される
3. **AC-03**: 既存プレイヤーのメモ保存で既存レコードが更新される
4. **AC-04**: TipTap JSON形式のリッチテキストが正常に保存・取得できる
5. **AC-05**: HTML形式のコンテンツが適切にサニタイズされて保存される
6. **AC-06**: 無効なプレイヤーIDで適切なエラーが返される

### ⚡ 非機能的受け入れ基準

1. **AC-NFR-01**: 中程度サイズ（10KB）のメモ保存が300ms以内で完了する
2. **AC-NFR-02**: メモ取得が300ms以内で完了する
3. **AC-NFR-03**: XSS攻撃に対して適切に防御される
4. **AC-NFR-04**: 10MBの制限を超えるコンテンツで適切なエラーが返される

### 🧪 品質受け入れ基準

1. **AC-QA-01**: 全単体テストが成功する
2. **AC-QA-02**: 全統合テストが成功する
3. **AC-QA-03**: コードカバレッジ90%以上を達成する
4. **AC-QA-04**: Rustコンパイル・TypeScriptビルドエラーなし

## 実装優先度

### 🚀 Phase 1: 基本機能（必須）
1. get_player_note コマンド基本実装
2. save_player_note コマンド基本実装
3. UPSERT操作実装
4. 基本バリデーション

### 🔧 Phase 2: リッチテキスト対応（重要）
1. TipTap JSON処理機能
2. HTMLサニタイゼーション
3. コンテンツ形式検出
4. エラーハンドリング強化

### ⭐ Phase 3: 最適化機能（推奨）
1. パフォーマンス監視
2. コンテンツハッシュ重複検出
3. 統合テスト充実
4. TypeScript型定義完備

## セキュリティ要件

### 🔒 XSS対策
- HTMLコンテンツの厳格なサニタイゼーション
- 許可タグ・属性の制限
- JavaScriptコード実行防止
- CSP（Content Security Policy）対応

### 🛡️ インジェクション対策
- SQLインジェクション対策（パラメータ化クエリ）
- NoSQLインジェクション対策
- コマンドインジェクション防止

### 📊 データ保護
- 機密情報のログ出力防止
- エラーメッセージの情報漏洩防止
- データベース接続情報の保護

## 注意事項・制約

### 🔒 セキュリティ制約
- XSS対策必須（HTMLサニタイゼーション）
- SQLインジェクション対策必須
- コンテンツサイズ制限必須（10MB）

### 📊 パフォーマンス制約
- NFR-103（≤300ms）準拠必須
- メモリ効率的な処理必須
- 大量データ処理最適化

### 🔗 依存関係制約
- TASK-0510完了に依存
- TipTapエディタライブラリ依存
- 既存API（TASK-0507/0508/0509/0510）との整合性

### 🧪 テスト制約
- `bun run test`コマンド使用必須
- モックベーステスト戦略
- 既存テストとの回帰防止

### 🎨 UI制約
- REQ-106（TipTapエディタ）使用必須
- NFR-103（中級機能）サポート必須
- レスポンシブレイアウト対応

---

**📝 作成者**: Claude Code
**📅 作成日時**: 2025-09-27
**🎯 実装目標**: 高性能・高品質なリッチテキストメモAPI
**⏱️ 推定工数**: 12時間（1.5日間）