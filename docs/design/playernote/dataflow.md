# Player Note データフロー図

## ユーザーインタラクションフロー

### メイン機能フロー

```mermaid
flowchart TD
    A[ユーザー] --> B[Player Note UI]
    B --> C{操作選択}

    C -->|プレイヤー作成| D[PlayerForm]
    C -->|プレイヤー検索| E[PlayerSearch]
    C -->|プレイヤー詳細| F[PlayerCard]
    C -->|タイプ管理| G[PlayerTypeManager]
    C -->|タグ管理| H[TagManager]

    D --> I[Tauri Commands]
    E --> I
    F --> I
    G --> I
    H --> I

    I --> J[Rust Backend]
    J --> K[SQLite Database]

    K --> J
    J --> I
    I --> L[Frontend State Update]
    L --> B
```

🔵 **青信号**: 要件定義書のエピック構造（プレイヤー管理、分類システム、タグシステム、メモ機能、検索機能）に基づく

## データ処理フロー

### プレイヤー作成フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as PlayerForm
    participant H as usePlayer Hook
    participant T as Tauri Command
    participant R as Rust Backend
    participant D as SQLite

    U->>F: プレイヤー名入力
    U->>F: プレイヤータイプ選択
    U->>F: 保存ボタンクリック
    F->>H: createPlayer({name, type_id})
    H->>T: create_player command
    T->>R: create_player(CreatePlayerRequest)
    R->>D: INSERT INTO players
    D-->>R: player_id返却
    R-->>T: CreatePlayerResponse
    T-->>H: 作成結果
    H-->>F: 状態更新
    F-->>U: 成功通知表示
```

🔵 **青信号**: REQ-001（プレイヤー管理）とREQ-002（プレイヤータイプ）に基づく

### 多重タグ割り当てフロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant S as TagSelector
    participant H as useTag Hook
    participant T as Tauri Command
    participant R as Rust Backend
    participant D as SQLite

    U->>S: タグ選択（複数）
    U->>S: レベル設定（1-10）
    S->>H: assignTags(player_id, tag_assignments)
    H->>T: assign_multiple_tags command

    loop 各タグごと
        T->>R: assign_tag(player_id, tag_id, level)
        R->>D: INSERT INTO player_tags
    end

    D-->>R: 割り当て結果
    R-->>T: AssignTagsResponse
    T-->>H: 更新された tag assignments
    H-->>S: UIステート更新
    S-->>U: タグ表示更新（色・レベル反映）
```

🔵 **青信号**: REQ-003（多重タグシステム）とREQ-104, REQ-105（レベル設定）に基づく

### リアルタイム検索フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant S as PlayerSearch
    participant H as usePlayerSearch Hook
    participant T as Tauri Command
    participant R as Rust Backend
    participant D as SQLite

    U->>S: 検索文字入力
    Note over S,H: 500msデバウンス
    S->>H: searchPlayers(query)
    H->>T: search_players command
    T->>R: search_players(SearchRequest)
    R->>D: SELECT FROM players WHERE name LIKE %query%

    Note over R,D: パフォーマンス要件: ≤200ms

    D-->>R: 検索結果
    R-->>T: SearchResponse

    Note over T,H: 要件: ≤500ms応答

    T-->>H: プレイヤー一覧
    H-->>S: 検索結果表示
    S-->>U: リアルタイム結果更新
```

🔵 **青信号**: REQ-005（検索機能）とNFR-102（500ms応答時間）に基づく

### リッチテキストメモ編集フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant E as RichTextEditor (TipTap)
    participant H as usePlayerNote Hook
    participant T as Tauri Command
    participant R as Rust Backend
    participant D as SQLite

    U->>E: プレイヤー詳細開く
    E->>H: loadPlayerNote(player_id)
    H->>T: get_player_note command
    T->>R: get_player_note(player_id)
    R->>D: SELECT FROM player_notes WHERE player_id
    D-->>R: メモ内容
    R-->>T: PlayerNoteResponse
    T-->>H: note content

    Note over E,H: TipTap起動要件: ≤300ms

    H-->>E: リッチテキスト表示

    U->>E: メモ編集（フォーマット適用）
    U->>E: 保存
    E->>H: savePlayerNote(player_id, rich_content)
    H->>T: save_player_note command
    T->>R: save_player_note(SaveNoteRequest)
    R->>D: UPDATE player_notes SET content
    D-->>R: 保存完了
    R-->>T: SaveNoteResponse
    T-->>H: 保存結果
    H-->>E: 保存状態更新
    E-->>U: 保存完了通知
```

🔵 **青信号**: REQ-004（リッチテキストメモ）、REQ-106（TipTap）、NFR-103（300ms起動）に基づく

## エラーハンドリングフロー

### データベースエラー処理

```mermaid
flowchart TD
    A[Frontend Request] --> B[Tauri Command]
    B --> C[Rust Backend]
    C --> D[SQLite Operation]

    D -->|Success| E[Success Response]
    D -->|Error| F{エラー種別}

    F -->|Constraint Violation| G[制約違反エラー]
    F -->|Database Lock| H[ロックエラー]
    F -->|Disk Space| I[容量不足エラー]
    F -->|Other| J[一般DB エラー]

    G --> K[ユーザー向けメッセージ]
    H --> L[再試行機能]
    I --> M[容量警告]
    J --> N[ログ記録]

    K --> O[Error Response]
    L --> O
    M --> O
    N --> O

    O --> P[Frontend Error Handling]
    P --> Q[ユーザー通知]
    E --> R[Success UI Update]
```

🟡 **黄信号**: 要件定義書のエラー処理要件とTauriアプリの一般的なエラーハンドリングから推測

## パフォーマンス最適化フロー

### 仮想化リスト処理

```mermaid
flowchart TD
    A[大量プレイヤーデータ] --> B{表示件数チェック}
    B -->|≤100件| C[通常リスト表示]
    B -->|>100件| D[仮想化リスト適用]

    D --> E[可視範囲計算]
    E --> F[必要データのみ取得]
    F --> G[レンダリング最適化]
    G --> H[スクロール監視]
    H --> I{スクロール位置変更?}
    I -->|Yes| E
    I -->|No| J[表示維持]

    C --> K[全データ表示]
    J --> L[ユーザー体験]
    K --> L
```

🟡 **黄信号**: NFR-101（1秒以内表示）要件を満たすための一般的な最適化手法

## システム間連携フロー

### 既存Note機能との独立性保証

```mermaid
flowchart LR
    A[Player Note Feature] -->|独立データベース| B[player_* tables]
    C[既存 Note Feature] -->|既存データベース| D[note_* tables]

    E[共通UI Layer] --> A
    E --> C

    F[User Action] --> G{機能選択}
    G -->|Player Note| A
    G -->|従来Note| C

    B -.->|将来的移行| D
```

🔵 **青信号**: 要件定義書で明確に指定された「既存Note機能からの独立性」

## データ整合性保証フロー

### カスケード削除処理

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as Frontend
    participant T as Tauri Command
    participant R as Rust Backend
    participant D as SQLite

    U->>F: プレイヤー削除確認
    F->>T: delete_player command
    T->>R: delete_player(player_id)

    Note over R,D: トランザクション開始

    R->>D: DELETE FROM player_notes WHERE player_id
    R->>D: DELETE FROM player_tags WHERE player_id
    R->>D: DELETE FROM players WHERE id

    Note over R,D: カスケード削除（REQ-401）

    D-->>R: 削除結果

    Note over R,D: トランザクションコミット

    R-->>T: DeletePlayerResponse
    T-->>F: 削除完了
    F-->>U: 削除完了通知
```

🔵 **青信号**: REQ-401（カスケード削除）要件に基づく整合性保証処理