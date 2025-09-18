# PlayerNote機能仕様書

## 概要

ライブポーカーにおける他プレイヤーの行動パターンや特徴を記録・管理する機能。プレイヤー情報はデータベースに永続化され、将来の対戦時に参照できる。

## 目的

- 他プレイヤーの戦略パターン、傾向、行動の記録
- 過去の対戦情報の蓄積と活用
- ライブポーカーでの意思決定支援
- プレイヤー分類による戦略調整

## データモデル

### Player（プレイヤー）

```typescript
interface Player {
  id?: number;              // 自動生成ID
  name: string;             // プレイヤー名（必須）
  label_id?: number;        // 割り当てられたLabel ID（最大1つ）
  note_id?: number;         // 関連するNote ID（自動生成）
  created_at?: string;      // 作成日時
  updated_at?: string;      // 更新日時
}
```

### Label（ラベル）

```typescript
interface Label {
  id?: number;              // 自動生成ID
  name: string;             // ラベル名（必須、最大20文字）
  color: string;            // 色（HEX形式、例: "#FF5733"）
  description?: string;     // ラベルの説明（任意）
  created_at?: string;      // 作成日時
  updated_at?: string;      // 更新日時
}
```

### Tag（タグ）

```typescript
interface Tag {
  id?: number;              // 自動生成ID
  name: string;             // タグ名（必須、最大15文字）
  color: string;            // 色（HEX形式、例: "#33FF57"）
  description?: string;     // タグの説明（任意）
  created_at?: string;      // 作成日時
  updated_at?: string;      // 更新日時
}
```

### PlayerTag（プレイヤー-タグ関連）

```typescript
interface PlayerTag {
  id?: number;              // 自動生成ID
  player_id: number;        // プレイヤーID
  tag_id: number;           // タグID
  created_at?: string;      // 関連付け日時
}
```

### Note（ノート）

```typescript
interface Note {
  id?: number;              // 自動生成ID
  player_id: number;        // 関連プレイヤーID
  content: string;          // メモ内容（最大5000文字）
  created_at?: string;      // 作成日時
  updated_at?: string;      // 更新日時
}
```

## 機能仕様

### 1. プレイヤー管理

#### 1.1 プレイヤー作成
- **目的**: 新しいプレイヤーの登録
- **入力**: プレイヤー名（必須）
- **処理**:
  1. プレイヤー名の重複チェック（同名可、警告表示）
  2. プレイヤーレコード作成
  3. 空のノートレコード自動作成
- **出力**: 作成されたプレイヤー情報

#### 1.2 プレイヤー検索・一覧表示
- **目的**: 既存プレイヤーの検索・表示
- **機能**:
  - 名前による部分検索
  - ラベルによるフィルタリング
  - タグによるフィルタリング
  - 作成日順/更新日順ソート
- **表示項目**: 名前、ラベル、タグ一覧、最終更新日

#### 1.3 プレイヤー編集
- **目的**: プレイヤー情報の更新
- **可能な操作**:
  - 名前の変更
  - ラベルの割り当て/解除
  - タグの追加/削除
  - ノート内容の編集

#### 1.4 プレイヤー削除
- **目的**: 不要なプレイヤーの削除
- **処理**:
  1. 削除確認ダイアログ表示
  2. 関連ノート、プレイヤータグ関連の連鎖削除
  3. 削除実行

### 2. ラベル管理

#### 2.1 ラベル作成
- **入力**:
  - ラベル名（必須、最大20文字）
  - 色（カラーピッカーで選択）
  - 説明（任意、最大100文字）
- **制約**: 同名ラベルの作成不可

#### 2.2 ラベル一覧・編集
- **表示**: 名前、色、使用中プレイヤー数
- **操作**: 編集、削除（使用中でない場合のみ）

#### 2.3 ラベル割り当て
- **制約**: 1プレイヤーにつき最大1ラベル
- **操作**: ドロップダウンまたはクリックで選択

### 3. タグ管理

#### 3.1 タグ作成
- **入力**:
  - タグ名（必須、最大15文字）
  - 色（カラーピッカーで選択）
  - 説明（任意、最大100文字）
- **制約**: 同名タグの作成不可

#### 3.2 タグ一覧・編集
- **表示**: 名前、色、使用中プレイヤー数
- **操作**: 編集、削除（使用中でない場合のみ）

#### 3.3 タグ割り当て
- **制約**: 1プレイヤーに複数タグ可能
- **操作**: チェックボックスまたはタグクラウドで選択

### 4. ノート管理

#### 4.1 ノート表示・編集
- **機能**:
  - プレイヤー作成時に空ノート自動作成
  - リッチテキスト編集（改行、基本的な書式設定）
  - 自動保存機能（5秒間隔）
  - 最大5000文字制限
- **履歴**: 更新日時の表示

## UI仕様

### メイン画面構成

#### 1. プレイヤー一覧画面
```
┌─────────────────────────────────────────────────┐
│ 🔍 [検索ボックス] [ラベルフィルタ] [タグフィルタ]      │
│ [+ 新しいプレイヤー追加]                          │
├─────────────────────────────────────────────────┤
│ プレイヤー名    │ ラベル │ タグ     │ 最終更新   │
├─────────────────────────────────────────────────┤
│ 🎭 Alice       │ ■ TAG │ ●●○     │ 2024-01-15 │
│ 🐺 Bob         │       │ ●○○     │ 2024-01-14 │
│ 🔥 Charlie     │ ■ LAG │ ●●●     │ 2024-01-13 │
└─────────────────────────────────────────────────┘
```

#### 2. プレイヤー詳細画面
```
┌─────────────────────────────────────────────────┐
│ プレイヤー名: [Alice            ] [保存] [削除]   │
│ ラベル: [TAG ▼] (■ 青色で表示)                  │
│ タグ: [☑アグレッシブ] [☑ブラフ] [☐パッシブ]        │
├─────────────────────────────────────────────────┤
│ ノート:                                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ アグレッシブなプレイスタイル                   │ │
│ │ プリフロップで頻繁にレイズ                    │ │
│ │ ブラフを多用する傾向                          │ │
│ │ ...                                          │ │
│ └─────────────────────────────────────────────┘ │
│ 最終更新: 2024-01-15 14:30                       │
└─────────────────────────────────────────────────┘
```

#### 3. ラベル・タグ管理画面
```
┌─────────────────────────────────────────────────┐
│ ラベル管理 │ タグ管理                              │
├─────────────────────────────────────────────────┤
│ [+ 新しいラベル追加]                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ ■ TAG (青) - タイトプレイヤー (3人使用中)      │ │
│ │ ■ LAG (赤) - ルースプレイヤー (1人使用中)      │ │
│ │ ■ NIT (灰) - 非常にタイト (0人使用中) [削除]   │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 技術実装仕様

### データベース設計（SQLite）

```sql
-- プレイヤーテーブル
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    label_id INTEGER REFERENCES labels(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
```

### Rustバックエンド API

#### プレイヤー関連
```rust
#[tauri::command]
async fn create_player(name: String) -> Result<Player, String>

#[tauri::command]
async fn get_players(search: Option<String>, label_id: Option<i32>, tag_ids: Option<Vec<i32>>) -> Result<Vec<Player>, String>

#[tauri::command]
async fn update_player(id: i32, name: String, label_id: Option<i32>) -> Result<Player, String>

#[tauri::command]
async fn delete_player(id: i32) -> Result<(), String>
```

#### ラベル関連
```rust
#[tauri::command]
async fn create_label(name: String, color: String, description: Option<String>) -> Result<Label, String>

#[tauri::command]
async fn get_labels() -> Result<Vec<Label>, String>

#[tauri::command]
async fn update_label(id: i32, name: String, color: String, description: Option<String>) -> Result<Label, String>

#[tauri::command]
async fn delete_label(id: i32) -> Result<(), String>
```

#### タグ関連
```rust
#[tauri::command]
async fn create_tag(name: String, color: String, description: Option<String>) -> Result<Tag, String>

#[tauri::command]
async fn get_tags() -> Result<Vec<Tag>, String>

#[tauri::command]
async fn assign_tags_to_player(player_id: i32, tag_ids: Vec<i32>) -> Result<(), String>

#[tauri::command]
async fn get_player_tags(player_id: i32) -> Result<Vec<Tag>, String>
```

#### ノート関連
```rust
#[tauri::command]
async fn get_player_note(player_id: i32) -> Result<Note, String>

#[tauri::command]
async fn update_note(player_id: i32, content: String) -> Result<Note, String>
```

### フロントエンド実装

#### Reactコンポーネント構成
```
PlayerNote/
├── components/
│   ├── PlayerList.tsx         # プレイヤー一覧
│   ├── PlayerDetail.tsx       # プレイヤー詳細
│   ├── PlayerForm.tsx         # プレイヤー作成・編集
│   ├── LabelManager.tsx       # ラベル管理
│   ├── TagManager.tsx         # タグ管理
│   ├── NoteEditor.tsx         # ノート編集
│   └── SearchFilters.tsx      # 検索・フィルタ
├── hooks/
│   ├── usePlayer.ts           # プレイヤー関連API
│   ├── useLabel.ts            # ラベル関連API
│   ├── useTag.ts              # タグ関連API
│   └── useNote.ts             # ノート関連API
├── types/
│   └── player.ts              # 型定義
└── utils/
    └── validation.ts           # バリデーション
```

#### 主要コンポーネント仕様

##### PlayerList.tsx
- プレイヤー一覧表示
- 検索・フィルタリング機能
- ソート機能
- 新規作成ボタン

##### PlayerDetail.tsx
- プレイヤー詳細情報表示・編集
- ラベル割り当て
- タグ選択
- ノート編集

##### NoteEditor.tsx
- テキストエリアコンポーネント
- 自動保存機能
- 文字数カウンター
- 更新日時表示

## パフォーマンス要件

- **応答時間**:
  - プレイヤー一覧表示: < 200ms
  - 詳細画面遷移: < 100ms
  - ノート保存: < 300ms
- **データ量**: 最大10,000プレイヤーまで対応
- **同時操作**: 複数プレイヤーの同時編集可能

## セキュリティ要件

- **データ暗号化**: SQLiteデータベースの暗号化
- **入力検証**: 全入力データのサニタイゼーション
- **権限管理**: ローカルファイルアクセス制限

## テスト要件

### 単体テスト
- Rustバックエンド: 全API関数のテスト
- React コンポーネント: 主要機能のテスト

### 統合テスト
- フロントエンド-バックエンド間API通信
- データベース操作の整合性

### E2Eテスト
- プレイヤー作成から削除までの完全フロー
- 検索・フィルタ機能
- データ永続化の確認

## 将来の拡張予定

### フェーズ2機能
- **ゲーム履歴連携**: 実際のポーカーゲーム結果との紐付け
- **統計分析**: プレイヤータイプ別収支分析
- **データエクスポート**: CSV/JSON形式でのデータ出力
- **プレイヤー写真**: 顔写真の登録・表示

### フェーズ3機能
- **クラウド同期**: 複数デバイス間でのデータ同期
- **チーム共有**: ポーカーチーム内でのプレイヤー情報共有
- **AI分析**: 機械学習によるプレイヤー傾向分析
- **モバイル対応**: Tauri 2.0を使用したモバイルアプリ

## 実装スケジュール

### Week 1-2: バックエンド実装
- データベース設計・マイグレーション
- Rust API実装
- 単体テスト作成

### Week 3-4: フロントエンド実装
- Reactコンポーネント作成
- UI/UX実装
- API統合

### Week 5: テスト・デバッグ
- 統合テスト
- E2Eテスト
- パフォーマンステスト
- バグ修正

### Week 6: リリース準備
- ドキュメント更新
- パッケージング
- デプロイメント準備