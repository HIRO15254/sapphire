# データモデル: ライブポーカーセッショントラッカー

**作成日**: 2025-12-12（更新: 2025-12-15）
**フィーチャーブランチ**: `001-poker-session-tracker`

本ドキュメントはDrizzle ORM + PostgreSQLを使用したポーカーセッショントラッカーアプリケーションのデータベーススキーマを定義します。

---

## エンティティ関連図

```
┌─────────────┐
│    User     │
└─────┬───────┘
      │ 1:N
      ├──────────────────┬──────────────────┬──────────────────┬──────────────────┐
      ▼                  ▼                  ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Currency   │    │    Store    │    │   Session   │    │   Player    │    │ ReviewFlag  │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘    └─────────────┘    └─────────────┘
      │ 1:N              │ 1:N              │ 1:N                                   │
      ├────────┐         ├────────┐         ├────────┐                             │
      ▼        ▼         ▼        ▼         ▼        ▼                             │
┌──────────┐ ┌──────────┐┌──────────┐ ┌──────────┐┌──────────┐ ┌──────────┐         │
│  Bonus   │ │ Purchase ││ CashGame │ │Tournament││ AllIn    │ │ Session  │         │
└──────────┘ └──────────┘└──────────┘ └────┬─────┘│ Record   │ │  Event   │         │
                                           │      └──────────┘ └──────────┘         │
                                           │ 1:N                                    │
                                     ┌─────┴─────┐                                  │
                                     ▼           ▼                                  │
                               ┌──────────┐ ┌──────────┐                            │
                               │PrizeLevel│ │BlindLevel│                            │
                               └──────────┘ └──────────┘                            │
                                                                                    │
┌──────────────────────────────────────────────────────────────────────────────────┐│
│                                     Hand                                          ││
├───────────────────────────────────────────────────────────────────────────────────┤│
│ handHistoryRaw (PHHフォーマットのみ)                                               ││
└─────┬────────────┬────────────────────────────────────────────────────────────────┘│
      │ 1:N        │ N:M                                                             │
      ▼            ▼                                                                 │
┌──────────┐  ┌──────────┐                                                           │
│ HandSeat │  │FlagAssign│◄──────────────────────────────────────────────────────────┘
└──────────┘  └──────────┘
      │
      │ N:1
      ▼
┌──────────┐
│  Player  │
└──────────┘
```

---

## 基本パターン

### タイムスタンプミックスイン
全エンティティに以下のタイムスタンプカラムを含める:

```typescript
// 全テーブルに適用
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
deletedAt: timestamp('deleted_at', { withTimezone: true }), // 論理削除
```

### ユーザー分離
全ユーザー所有エンティティに以下を含める:

```typescript
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
```

---

## エンティティ定義

### 1. User（ユーザー）- 認証

NextAuth.jsで管理。Credentialsプロバイダー用に`passwordHash`を拡張。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default random | 一意識別子 |
| name | varchar(255) | nullable | 表示名 |
| email | varchar(255) | NOT NULL, unique | メールアドレス |
| emailVerified | timestamptz | nullable | メール検証タイムスタンプ |
| image | varchar(255) | nullable | アバターURL |
| passwordHash | varchar(255) | nullable | bcryptハッシュ（Credentials認証用） |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |

**インデックス**: `email` (unique)

---

### 2. Account（アカウント）- NextAuth

（英語版と同様）

---

### ~~3. AuthSession（認証セッション）~~ - 削除済み

**このテーブルは削除されました。** NextAuth.js v5のCredentialsプロバイダーがデータベースセッションと互換性がないため、JWTセッションのみを使用します。全認証（OAuthとCredentials）でJWTセッションを使用。

---

### 3. VerificationToken（検証トークン）- NextAuth

（英語版と同様）

---

### 4. Currency（通貨）

アミューズメントポーカー施設の仮想通貨。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default random | 一意識別子 |
| userId | uuid | FK → users.id, cascade | 所有ユーザー |
| name | varchar(255) | NOT NULL | 通貨名（例:「ABCポーカーチップ」） |
| initialBalance | integer | NOT NULL, default 0 | 初期残高 |
| isArchived | boolean | NOT NULL, default false | アーカイブ済み（アクティブリストから非表示） |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | 論理削除 |

**インデックス**: `userId`, `isArchived`, `deletedAt`（NULLのみの部分インデックス）

---

### 6-7. BonusTransaction / PurchaseTransaction

（英語版と同様）

---

### 8. Store（店舗）

ポーカー施設 / アミューズメント店舗（Google Maps連携）。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default random | 一意識別子 |
| userId | uuid | FK → users.id, cascade | 所有ユーザー |
| name | varchar(255) | NOT NULL | 店舗名 |
| address | text | nullable | フリーテキスト住所 |
| latitude | decimal(10,8) | nullable | 緯度 |
| longitude | decimal(11,8) | nullable | 経度 |
| placeId | varchar(255) | nullable | Google Place ID（安定参照用） |
| notes | text | nullable | リッチテキストメモ（HTML） |
| isArchived | boolean | NOT NULL, default false | アーカイブ済み |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | 論理削除 |

---

### 9. CashGame（キャッシュゲーム）- 明示的なブラインド/アンティフィールド

店舗でのキャッシュゲーム設定（初期リリースはNLHEのみ）。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default random | 一意識別子 |
| storeId | uuid | FK → stores.id, cascade | 関連店舗 |
| userId | uuid | FK → users.id, cascade | 所有ユーザー |
| currencyId | uuid | FK → currencies.id, set null | 使用通貨 |
| smallBlind | integer | NOT NULL | スモールブラインド金額 |
| bigBlind | integer | NOT NULL | ビッグブラインド金額 |
| straddle1 | integer | nullable | ストラドル1（UTGストラドル） |
| straddle2 | integer | nullable | ストラドル2（UTG+1ストラドル） |
| ante | integer | nullable | アンティ金額（存在する場合） |
| anteType | varchar(20) | nullable | 'all_ante' または 'bb_ante' |
| notes | text | nullable | リッチテキストメモ（HTML） |
| isArchived | boolean | NOT NULL, default false | アーカイブ済み |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | 論理削除 |

**アンティタイプ**:
- `all_ante`: 全プレイヤーが毎ハンドアンティをポスト
- `bb_ante`: ビッグブラインドのみがアンティをポスト（ビッグブラインドと合算）

**表示形式例**: "1/2 (Ante: 2 BB Ante)" または "100/200/400/800 (Ante: 100 All)"

---

### 10. Tournament（トーナメント）- 構造テーブル分離

トーナメント設定。賞金/ブラインド構造は別テーブルで管理。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default random | 一意識別子 |
| storeId | uuid | FK → stores.id, cascade | 関連店舗 |
| userId | uuid | FK → users.id, cascade | 所有ユーザー |
| currencyId | uuid | FK → currencies.id, set null | 使用通貨 |
| name | varchar(255) | nullable | トーナメント名 |
| buyIn | integer | NOT NULL | トーナメントバイイン金額 |
| startingStack | integer | nullable | 開始時チップスタック |
| notes | text | nullable | リッチテキストメモ（HTML） |
| isArchived | boolean | NOT NULL, default false | アーカイブ済み |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | 論理削除 |

---

### 11. TournamentPrizeStructure（エントリー数範囲別プライズ構造）

トーナメントのプライズストラクチャーは複数のエントリー数範囲を持つことができる。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default random | 一意識別子 |
| tournamentId | uuid | FK → tournaments.id, cascade | 親トーナメント |
| minEntrants | integer | NOT NULL | 参加人数範囲の下限（a人から） |
| maxEntrants | integer | nullable | 参加人数範囲の上限（b人まで、nullは無制限） |
| sortOrder | integer | NOT NULL | 表示順序 |
| createdAt | timestamptz | NOT NULL, default now | |

---

### 11a. TournamentPrizeLevel（順位範囲別プライズレベル）

各エントリー数範囲内で、順位範囲ごとのプライズ配分を定義。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default random | 一意識別子 |
| prizeStructureId | uuid | FK → tournament_prize_structures.id, cascade | 親プライズ構造 |
| minPosition | integer | NOT NULL | 順位範囲の開始（a位から） |
| maxPosition | integer | NOT NULL | 順位範囲の終了（b位まで） |
| sortOrder | integer | NOT NULL | 表示順序 |
| createdAt | timestamptz | NOT NULL, default now | |

---

### 11b. TournamentPrizeItem（個別プライズアイテム）

順位範囲に対して付与される個別のプライズ（複数可）。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default random | 一意識別子 |
| prizeLevelId | uuid | FK → tournament_prize_levels.id, cascade | 親プライズレベル |
| prizeType | varchar(20) | NOT NULL | プライズタイプ: 'percentage', 'fixed_amount', 'custom_prize' |
| percentage | decimal(5,2) | nullable | 賞金プールの割合（prizeType='percentage'の場合） |
| fixedAmount | integer | nullable | 固定仮想通貨額（prizeType='fixed_amount'の場合） |
| customPrizeLabel | text | nullable | カスタムプライズの説明（prizeType='custom_prize'の場合） |
| customPrizeValue | integer | nullable | カスタムプライズの仮想通貨換算価値（prizeType='custom_prize'の場合） |
| sortOrder | integer | NOT NULL | 表示順序 |
| createdAt | timestamptz | NOT NULL, default now | |

**プライズタイプ**:
- `percentage`: プライズプールの何%が得られるか
- `fixed_amount`: バイインと同じ仮想通貨の特定数量
- `custom_prize`: カスタムプライズ（説明文と換算価値）

**階層構造の例**:
```
Tournament
└── PrizeStructure (10-20人参加時)
│   ├── PrizeLevel (1位)
│   │   ├── PrizeItem: 50% (percentage)
│   │   └── PrizeItem: トロフィー 5000相当 (custom_prize)
│   ├── PrizeLevel (2位)
│   │   └── PrizeItem: 30% (percentage)
│   └── PrizeLevel (3-4位)
│       └── PrizeItem: 10% (percentage)
└── PrizeStructure (21-40人参加時)
    ├── PrizeLevel (1位)
    │   └── PrizeItem: 40% (percentage)
    └── ...
```

---

### 12. TournamentBlindLevel（トーナメントブラインドレベル）- ブレイク対応

ブラインドレベルまたはブレイク（休憩）を定義。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default random | 一意識別子 |
| tournamentId | uuid | FK → tournaments.id, cascade | 親トーナメント |
| level | integer | NOT NULL | レベル番号（1, 2, 3等） |
| isBreak | boolean | NOT NULL, default false | ブレイク（休憩）かどうか |
| smallBlind | integer | nullable | スモールブラインド（isBreak=falseの場合は必須） |
| bigBlind | integer | nullable | ビッグブラインド（isBreak=falseの場合は必須） |
| ante | integer | nullable | アンティ（存在する場合） |
| durationMinutes | integer | NOT NULL | このレベル/ブレイクの継続時間（分） |
| createdAt | timestamptz | NOT NULL, default now | |

**注意**: isBreak=trueの場合、smallBlind/bigBlindは不要（休憩時間のみ定義）。

---

### 13. PokerSession（ポーカーセッション）

プレイセッション記録（アーカイブまたはアクティブ）。

（英語版と同様のフィールド構成）

---

### 14. SessionEvent（セッションイベント）- イベントソーシング

アクティブセッション記録用の拡張可能なイベントログ。JSONBを使用。

**なぜJSONB?**（調査に基づく）
- PostgreSQLでのイベントソーシングの標準パターン
- スキーマ変更なしで異なるイベントタイプに対応
- JSONBインデックスによる効率的なクエリ
- Zodスキーマによるアプリケーション層での型安全性

**イベントタイプ**:
| イベントタイプ | 説明 | eventData |
|------------|------|-----------|
| `session_start` | セッション開始 | `{}` |
| `session_resume` | 一時停止後の再開 | `{}` |
| `session_pause` | セッション一時停止 | `{}` |
| `session_end` | セッション完了 | `{ cashOut: number }` |
| `player_seated` | プレイヤー着席 | `{ playerId?, seatNumber, playerName }` |
| `hand_recorded` | 詳細ハンド記録 | `{ handId: string }` |
| `hands_passed` | 詳細なしでパスしたハンド | `{ count: number }` |
| `stack_update` | スタック金額変更 | `{ amount: number }` |
| `rebuy` | リバイ実行 | `{ amount: number }` |
| `addon` | アドオン実行 | `{ amount: number }` |

---

### 15-19. その他のテーブル（AllInRecord, Player, PlayerTag, PlayerTagAssignment, PlayerNote）

（英語版と同様）

---

### 20. Hand（ハンド）- 簡素化版（PHH生データのみ）

個別ハンド記録。全ハンドデータはPHHフォーマットで保存。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default random | 一意識別子 |
| sessionId | uuid | FK → poker_sessions.id, cascade | 親セッション |
| userId | uuid | FK → users.id, cascade | 所有ユーザー |
| handNumber | integer | nullable | セッション内ハンド番号 |
| handHistoryRaw | text | nullable | 完全なハンドヒストリー（PHHフォーマット） |
| notes | text | nullable | リッチテキストメモ（HTML） |
| recordedAt | timestamptz | NOT NULL, default now | 記録日時 |
| createdAt | timestamptz | NOT NULL, default now | |
| updatedAt | timestamptz | NOT NULL, default now | |
| deletedAt | timestamptz | nullable | 論理削除 |

**注意**: インデックス化フィールドは削除。PHHから必要に応じて解析。

---

### 21. HandSeat（ハンドシート）- 簡素化版

ハンドにテーブル上のプレイヤーをリンク。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default random | 一意識別子 |
| handId | uuid | FK → hands.id, cascade | 親ハンド |
| seatNumber | integer | NOT NULL | 席番号（1-9） |
| position | varchar(10) | NOT NULL | ポジション（BTN, SB, BB等） |
| playerId | uuid | FK → players.id, set null | 既知のプレイヤー |
| playerName | varchar(255) | nullable | プレイヤー名（フォールバック） |
| createdAt | timestamptz | NOT NULL, default now | |

**注意**: `startingStack`, `endingStack`, `holeCards`はPHHに含まれるため削除。

---

### 22-23. HandReviewFlag / HandReviewFlagAssignment

（英語版と同様）

---

## 削除されたテーブル

### ~~SessionPlayer~~ （削除）
SessionEventに置き換え。

### ~~GameNote~~ （削除）
不要と判断。CashGame/Tournamentのnotesフィールドで対応。

---

## アーカイブ vs 論理削除

- **isArchived**: アクティブリストから非表示にするが、データは完全にアクセス可能
- **deletedAt**: 論理削除、アイテムは実質的に削除されるが復旧可能
