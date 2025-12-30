# tRPC APIコントラクト

**作成日**: 2025-12-12（更新: 2025-12-15）
**フィーチャーブランチ**: `001-poker-session-tracker`

本ドキュメントはポーカーセッショントラッカーのtRPCルーターコントラクトを定義します。

---

## ルーター構造

```
appRouter
├── auth           # 認証（公開 + 保護）
├── currency       # 通貨管理
├── store          # 店舗管理
├── cashGame       # キャッシュゲーム設定
├── tournament     # トーナメント設定
├── session        # ポーカーセッション
├── sessionEvent   # アクティブセッションイベント
├── allIn          # オールイン記録
├── player         # プレイヤープロファイル
├── playerTag      # プレイヤータグ
├── hand           # ハンド記録
├── handSeat       # ハンドシート/プレイヤー情報
└── handReviewFlag # カスタムレビューフラグ
```

---

## 通貨ルーター（`currency`）

### `currency.list`（query、保護）

ユーザーの全通貨を計算済み残高付きで取得。

**入力**:
```typescript
{
  includeArchived?: boolean;  // デフォルト: false
}
```

**出力**:
```typescript
Array<{
  id: string;
  name: string;
  initialBalance: number;
  isArchived: boolean;
  totalBonuses: number;
  totalPurchases: number;
  totalBuyIns: number;
  totalCashOuts: number;
  currentBalance: number;
  createdAt: Date;
}>
```

### `currency.getById`（query、保護）

残高内訳を含む単一の通貨を取得。

**入力**:
```typescript
{ id: string }
```

**出力**: リスト項目と同様 + `bonusTransactions[]` + `purchaseTransactions[]`

**エラー**:
- `NOT_FOUND`: 通貨が見つからないか、ユーザーが所有していない

### `currency.create`（mutation、保護）

新規通貨を作成。

**入力**:
```typescript
{
  name: string;           // 1-255文字
  initialBalance: number; // >= 0
}
```

### `currency.update`（mutation、保護）

通貨の詳細を更新。

**入力**:
```typescript
{
  id: string;
  name?: string;
  initialBalance?: number;
}
```

### `currency.archive`（mutation、保護）

通貨をアーカイブ。

**入力**:
```typescript
{ id: string }
```

### `currency.unarchive`（mutation、保護）

通貨のアーカイブを解除。

**入力**:
```typescript
{ id: string }
```

### `currency.delete`（mutation、保護）

通貨をソフトデリート。

**入力**:
```typescript
{ id: string }
```

### `currency.addBonus`（mutation、保護）

ボーナストランザクションを記録。

**入力**:
```typescript
{
  currencyId: string;
  amount: number;         // > 0
  source?: string;        // 任意の説明
  transactionDate?: Date; // デフォルト: 現在時刻
}
```

### `currency.addPurchase`（mutation、保護）

購入トランザクションを記録。

**入力**:
```typescript
{
  currencyId: string;
  amount: number;         // > 0
  note?: string;          // 任意のメモ
  transactionDate?: Date;
}
```

### `currency.listBonuses`（query、保護）

通貨のボーナストランザクション一覧を取得。

**入力**:
```typescript
{ currencyId: string }
```

**出力**:
```typescript
{
  bonuses: Array<{
    id: string;
    currencyId: string;
    userId: string;
    amount: number;
    source?: string;
    transactionDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
```

### `currency.updateBonus`（mutation、保護）

ボーナストランザクションを更新。

**入力**:
```typescript
{
  id: string;
  amount?: number;
  source?: string;
  transactionDate?: Date;
}
```

### `currency.deleteBonus`（mutation、保護）

ボーナストランザクションをソフトデリート。

**入力**:
```typescript
{ id: string }
```

### `currency.listPurchases`（query、保護）

通貨の購入トランザクション一覧を取得。

**入力**:
```typescript
{ currencyId: string }
```

**出力**:
```typescript
{
  purchases: Array<{
    id: string;
    currencyId: string;
    userId: string;
    amount: number;
    note?: string;
    transactionDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
```

### `currency.updatePurchase`（mutation、保護）

購入トランザクションを更新。

**入力**:
```typescript
{
  id: string;
  amount?: number;
  note?: string;
  transactionDate?: Date;
}
```

### `currency.deletePurchase`（mutation、保護）

購入トランザクションをソフトデリート。

**入力**:
```typescript
{ id: string }
```

---

## 店舗ルーター（`store`）

### `store.list`（query、保護）

ユーザーの全店舗を取得。

**入力**:
```typescript
{
  includeArchived?: boolean;  // デフォルト: false
}
```

**出力**:
```typescript
Array<{
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  isArchived: boolean;
  cashGameCount: number;
  tournamentCount: number;
  createdAt: Date;
}>
```

### `store.archive`（mutation、保護）

店舗をアーカイブまたはアーカイブ解除。

**入力**:
```typescript
{
  id: string;
  isArchived: boolean;
}
```

---

## キャッシュゲームルーター（`cashGame`）

### `cashGame.listByStore`（query、保護）

特定店舗のキャッシュゲームを取得。

**入力**:
```typescript
{
  storeId: string;
  includeArchived?: boolean;  // デフォルト: false
}
```

**出力**:
```typescript
Array<{
  id: string;
  currencyId?: string;
  currencyName?: string;
  smallBlind: number;
  bigBlind: number;
  straddle1?: number;
  straddle2?: number;
  ante?: number;
  anteType?: 'all_ante' | 'bb_ante';
  isArchived: boolean;
  displayName: string;    // 生成: "1/2" または "1/2 (Ante: 2 BB)"
}>
```

### `cashGame.create`（mutation、保護）

キャッシュゲームを作成。

**入力**:
```typescript
{
  storeId: string;
  currencyId?: string;
  smallBlind: number;     // > 0
  bigBlind: number;       // > smallBlind
  straddle1?: number;     // > bigBlind
  straddle2?: number;     // > straddle1
  ante?: number;          // > 0
  anteType?: 'all_ante' | 'bb_ante';  // ante設定時は必須
  notes?: string;
}
```

### `cashGame.archive`（mutation、保護）

キャッシュゲームをアーカイブまたはアーカイブ解除。

**入力**:
```typescript
{
  id: string;
  isArchived: boolean;
}
```

---

## トーナメントルーター（`tournament`）

### `tournament.listByStore`（query、保護）

特定店舗のトーナメントを取得。

**入力**:
```typescript
{
  storeId: string;
  includeArchived?: boolean;  // デフォルト: false
}
```

**出力**:
```typescript
Array<{
  id: string;
  name?: string;
  currencyId?: string;
  currencyName?: string;
  buyIn: number;
  startingStack?: number;
  isArchived: boolean;
}>
```

### `tournament.getById`（query、保護）

構造情報を含むトーナメント詳細を取得。

**出力**:
```typescript
{
  id: string;
  storeId: string;
  storeName: string;
  name?: string;
  currencyId?: string;
  buyIn: number;
  startingStack?: number;
  prizeLevels: TournamentPrizeLevel[];
  blindLevels: TournamentBlindLevel[];
  notes?: string;
  isArchived: boolean;
}
```

### `tournament.create`（mutation、保護）

トーナメントを作成。

**入力**:
```typescript
{
  storeId: string;
  name?: string;
  currencyId?: string;
  buyIn: number;          // > 0
  startingStack?: number; // > 0
  prizeLevels?: Array<{
    position: number;     // >= 1
    percentage?: number;  // 0-100
    fixedAmount?: number; // > 0
  }>;
  blindLevels?: Array<{
    level: number;        // >= 1
    smallBlind: number;   // > 0
    bigBlind: number;     // > smallBlind
    ante?: number;
    durationMinutes: number; // > 0
  }>;
  notes?: string;
}
```

### `tournament.setPrizeLevels`（mutation、保護）

トーナメントの全賞金レベルを置換。

**入力**:
```typescript
{
  tournamentId: string;
  levels: Array<{
    position: number;
    percentage?: number;
    fixedAmount?: number;
  }>;
}
```

### `tournament.setBlindLevels`（mutation、保護）

トーナメントの全ブラインドレベルを置換。

**入力**:
```typescript
{
  tournamentId: string;
  levels: Array<{
    level: number;
    smallBlind: number;
    bigBlind: number;
    ante?: number;
    durationMinutes: number;
  }>;
}
```

### `tournament.archive`（mutation、保護）

トーナメントをアーカイブまたはアーカイブ解除。

**入力**:
```typescript
{
  id: string;
  isArchived: boolean;
}
```

---

## ハンドルーター（`hand`）- 簡素化版

### `hand.listBySession`（query、保護）

セッションのハンドを取得。

**出力**:
```typescript
{
  items: Array<{
    id: string;
    handNumber?: number;
    reviewFlags: HandReviewFlag[];
    recordedAt: Date;
  }>;
  nextCursor?: string;
}
```

### `hand.getById`（query、保護）

PHHデータを含む完全なハンド詳細を取得。

**出力**:
```typescript
{
  id: string;
  sessionId: string;
  handNumber?: number;
  handHistoryRaw?: string;  // PHHフォーマット
  notes?: string;
  seats: HandSeat[];
  reviewFlags: HandReviewFlag[];
  recordedAt: Date;
}
```

### `hand.create`（mutation、保護）

新規ハンドを記録。

**入力**:
```typescript
{
  sessionId: string;
  handNumber?: number;
  handHistoryRaw?: string;  // PHHフォーマット
  notes?: string;
  seats?: Array<{
    seatNumber: number;
    position: string;
    playerId?: string;
    playerName?: string;
  }>;
  flagIds?: string[];
}
```

---

## ハンドシートルーター（`handSeat`）- 簡素化版

### `handSeat.listByHand`（query、保護）

ハンドのシート/プレイヤーを取得。

**出力**:
```typescript
Array<{
  id: string;
  seatNumber: number;
  position: string;
  playerId?: string;
  playerName?: string;
}>
```

### `handSeat.upsert`（mutation、保護）

ハンドのシートを追加または更新。

**入力**:
```typescript
{
  handId: string;
  seatNumber: number;
  position: string;
  playerId?: string;
  playerName?: string;
}
```

---

## 共通型

```typescript
// アンティタイプenum
type AnteType = 'all_ante' | 'bb_ante'

// トーナメント賞金レベル
type TournamentPrizeLevel = {
  id: string;
  position: number;
  percentage?: number;
  fixedAmount?: number;
}

// トーナメントブラインドレベル
type TournamentBlindLevel = {
  id: string;
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante?: number;
  durationMinutes: number;
}
```

---

## 削除されたルーター

### ~~gameNote~~ （削除）
GameNoteテーブル削除に伴い削除。ゲームメモはCashGame/Tournamentのnotesフィールドで対応。

---

（その他のルーター - sessionEvent, allIn, player, playerTag, handReviewFlag は英語版と同様）
