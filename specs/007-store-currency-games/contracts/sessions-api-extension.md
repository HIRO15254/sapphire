# API Contract: セッション API 拡張

**Feature Branch**: `007-store-currency-games`
**Created**: 2025-12-05
**Status**: Planning

## Overview

既存の `sessions` ルーターを拡張し、ゲームとの紐付け機能と統計のゲーム別フィルタリング機能を追加する。

## Router: `sessions` (既存ルーター拡張)

ファイルパス: `src/server/api/routers/sessions.ts`

---

## 変更点

### sessions.create - 変更

**変更内容**: `gameId` フィールドを追加（nullable）

**Input Schema 変更**:
```typescript
const createSessionSchema = z.object({
  // ... 既存フィールド ...
  gameId: z.number().int().positive().optional(), // 追加
}).refine(
  (data) => data.locationId !== undefined || data.newLocationName !== undefined,
  { message: "locationId または newLocationName のいずれかが必要です" }
);
```

**Output Schema 変更**:
```typescript
type CreateSessionOutput = {
  // ... 既存フィールド ...
  game: {
    id: number;
    name: string;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    minBuyIn: number;
    maxBuyIn: number;
    currency: { id: number; name: string };
  } | null; // 追加
};
```

**Additional Validation**:
- `gameId` が指定された場合:
  - ゲームが存在すること
  - ゲームがユーザーの所有であること（店舗経由で確認）
  - ゲームがアーカイブされていないこと
  - ゲームの `locationId` がセッションの `locationId` と一致すること

**Error Cases (追加)**:
| Code | Message | Condition |
|------|---------|-----------|
| NOT_FOUND | ゲームが見つかりません | 存在しない or 他ユーザーのゲーム |
| BAD_REQUEST | アーカイブされたゲームは選択できません | アーカイブ済みゲーム |
| BAD_REQUEST | ゲームと店舗が一致しません | ゲームの店舗が異なる |

---

### sessions.update - 変更

**変更内容**: `gameId` フィールドを追加（nullable）

**Input Schema 変更**:
```typescript
const updateSessionSchema = z.object({
  // ... 既存フィールド ...
  gameId: z.number().int().positive().optional().nullable(), // 追加
});
```

**Note**:
- `gameId: null` を明示的に指定するとゲーム紐付けを解除
- `gameId: undefined` (未指定) は変更なし

---

### sessions.getAll, sessions.getById, sessions.getFiltered - 変更

**Output Schema 変更**:

各セッションのレスポンスに `game` フィールドを追加:

```typescript
type SessionWithGame = {
  // ... 既存フィールド ...
  game: {
    id: number;
    name: string;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    minBuyIn: number;
    maxBuyIn: number;
    currency: { id: number; name: string };
  } | null;
};
```

---

### sessions.getFiltered - 変更

**Input Schema 変更**:
```typescript
const filterSessionsSchema = z.object({
  // ... 既存フィールド ...
  gameIds: z.array(z.number().int().positive()).optional(), // 追加
  currencyIds: z.array(z.number().int().positive()).optional(), // 追加
}).refine(/* ... */);
```

**Filter Logic**:
- `gameIds`: 指定されたゲームIDのいずれかに一致するセッションを返す (OR)
- `currencyIds`: 指定された通貨IDを使用するゲームのセッションを返す (OR)

---

### sessions.getStats - 変更

**Input Schema 追加**:
```typescript
const getStatsSchema = z.object({
  gameIds: z.array(z.number().int().positive()).optional(),
  currencyIds: z.array(z.number().int().positive()).optional(),
}).optional();
```

**Output Schema 変更**:
```typescript
type GetStatsOutput = {
  // ... 既存フィールド ...
  byGame: Array<{
    game: {
      id: number;
      name: string;
      smallBlind: number;
      bigBlind: number;
      currency: { id: number; name: string };
    };
    profit: number;
    count: number;
    avgProfit: number;
  }>; // 追加
  byCurrency: Array<{
    currency: { id: number; name: string };
    profit: number;
    count: number;
    avgProfit: number;
  }>; // 追加
};
```

**Filter Logic**:
- `gameIds` が指定された場合、そのゲームのセッションのみを集計
- `currencyIds` が指定された場合、その通貨を使用するゲームのセッションのみを集計

---

## 後方互換性

### データベース

- `gameId` カラムは nullable として追加
- 既存セッションの `gameId` は `NULL` のまま
- マイグレーション時にデフォルト値は設定しない

### API

- `gameId` は optional パラメータ
- 既存のAPIクライアントはそのまま動作
- レスポンスに `game: null` が追加されるが、クライアントは無視可能

### UI

- ゲーム未設定のセッションは「ゲーム: 未設定」と表示
- セッション作成時、ゲーム選択は任意

---

## Client Integration

### セッション作成時のゲーム選択

```typescript
// src/features/poker-sessions/containers/SessionFormContainer.tsx

function SessionFormContainer() {
  const [selectedLocationId, setSelectedLocationId] = useState<number>();
  const [selectedGameId, setSelectedGameId] = useState<number>();

  // 店舗が選択されたらアクティブなゲームを取得
  const { games } = useActiveGamesForSession(selectedLocationId);

  // 店舗が変更されたらゲーム選択をリセット
  useEffect(() => {
    setSelectedGameId(undefined);
  }, [selectedLocationId]);

  return (
    <SessionForm
      locationId={selectedLocationId}
      gameId={selectedGameId}
      availableGames={games}
      onLocationChange={setSelectedLocationId}
      onGameChange={setSelectedGameId}
      // ...
    />
  );
}
```

### 統計画面でのゲームフィルター

```typescript
// src/features/poker-sessions/containers/StatsContainer.tsx

function StatsContainer() {
  const [filterGameIds, setFilterGameIds] = useState<number[]>([]);
  const [filterCurrencyIds, setFilterCurrencyIds] = useState<number[]>([]);

  const { data: stats } = api.sessions.getStats.useQuery({
    gameIds: filterGameIds.length > 0 ? filterGameIds : undefined,
    currencyIds: filterCurrencyIds.length > 0 ? filterCurrencyIds : undefined,
  });

  return (
    <StatsView
      stats={stats}
      onGameFilterChange={setFilterGameIds}
      onCurrencyFilterChange={setFilterCurrencyIds}
    />
  );
}
```
