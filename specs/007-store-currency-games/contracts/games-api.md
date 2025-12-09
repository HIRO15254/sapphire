# API Contract: ゲーム (Games) API

**Feature Branch**: `007-store-currency-games`
**Created**: 2025-12-05
**Status**: Planning

## Overview

ゲーム（NLHEリングゲーム）を管理するtRPC API。各店舗で行われるポーカーゲームの詳細情報を登録・管理する。

## Router: `games`

ファイルパス: `src/server/api/routers/games.ts`

すべてのプロシージャは `protectedProcedure` を使用し、認証必須。

---

## Procedures

### games.create

新しいゲームを作成する。

**Type**: `mutation`

**Input Schema**:
```typescript
const createGameSchema = z.object({
  locationId: z.number().int().positive("店舗を選択してください"),
  currencyId: z.number().int().positive("通貨を選択してください"),
  name: z.string()
    .min(1, "ゲーム名は必須です")
    .max(100, "ゲーム名は100文字以内です")
    .trim(),
  smallBlind: z.number().int().positive("SBは1以上の整数です"),
  bigBlind: z.number().int().positive("BBは1以上の整数です"),
  ante: z.number().int().min(0, "Anteは0以上の整数です").default(0),
  minBuyIn: z.number().int().positive("最小バイインは1以上の整数です"),
  maxBuyIn: z.number().int().positive("最大バイインは1以上の整数です"),
  rules: z.string().max(50000).optional(),
}).refine(
  (data) => data.bigBlind >= data.smallBlind,
  { message: "BBはSB以上でなければなりません", path: ["bigBlind"] }
).refine(
  (data) => data.maxBuyIn >= data.minBuyIn,
  { message: "最大バイインは最小バイイン以上でなければなりません", path: ["maxBuyIn"] }
);
```

**Output Schema**:
```typescript
type CreateGameOutput = {
  id: number;
  locationId: number;
  currencyId: number;
  name: string;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  minBuyIn: number;
  maxBuyIn: number;
  rules: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  location: { id: number; name: string };
  currency: { id: number; name: string };
};
```

**Validation Rules**:
- ゲーム名は同一店舗内で一意（大文字小文字区別なし）
- locationIdは現在のユーザーの店舗でなければならない
- currencyIdは現在のユーザーの通貨でなければならない
- BB >= SB
- maxBuyIn >= minBuyIn

**Error Cases**:
| Code | Message | Condition |
|------|---------|-----------|
| NOT_FOUND | 店舗が見つかりません | 存在しない or 他ユーザーの店舗 |
| NOT_FOUND | 通貨が見つかりません | 存在しない or 他ユーザーの通貨 |
| BAD_REQUEST | 同じ名前のゲームがこの店舗に既に存在します | ゲーム名重複 |
| INTERNAL_SERVER_ERROR | ゲームの作成に失敗しました | DB挿入失敗 |

---

### games.getAll

ユーザーの全ゲームを取得する（全店舗）。

**Type**: `query`

**Input Schema**:
```typescript
const getAllGamesSchema = z.object({
  includeArchived: z.boolean().default(true),
}).optional();
```

**Output Schema**:
```typescript
type GetAllGamesOutput = Array<{
  id: number;
  name: string;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  minBuyIn: number;
  maxBuyIn: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  location: { id: number; name: string };
  currency: { id: number; name: string };
  _count: {
    sessions: number;  // このゲームを使用しているセッション数
  };
}>;
```

---

### games.getByLocation

指定した店舗のゲームを取得する。

**Type**: `query`

**Input Schema**:
```typescript
const getByLocationSchema = z.object({
  locationId: z.number().int().positive(),
  includeArchived: z.boolean().default(true),
});
```

**Output Schema**:
```typescript
type GetByLocationOutput = Array<{
  id: number;
  name: string;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  minBuyIn: number;
  maxBuyIn: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  currency: { id: number; name: string };
  _count: {
    sessions: number;
  };
}>;
```

---

### games.getActiveByLocation

指定した店舗のアクティブなゲームのみを取得する（セッション作成時のドロップダウン用）。

**Type**: `query`

**Input Schema**:
```typescript
const getActiveByLocationSchema = z.object({
  locationId: z.number().int().positive(),
});
```

**Output Schema**:
```typescript
type GetActiveByLocationOutput = Array<{
  id: number;
  name: string;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  minBuyIn: number;
  maxBuyIn: number;
  currency: { id: number; name: string };
}>;
```

**Note**: `isArchived: false` のゲームのみを返す。

---

### games.getById

IDでゲームを取得する。

**Type**: `query`

**Input Schema**:
```typescript
const getByIdSchema = z.object({
  id: z.number().int().positive(),
});
```

**Output Schema**:
```typescript
type GetByIdGameOutput = {
  id: number;
  name: string;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  minBuyIn: number;
  maxBuyIn: number;
  rules: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  location: { id: number; name: string };
  currency: { id: number; name: string };
  _count: {
    sessions: number;
  };
} | null;
```

---

### games.update

ゲームを更新する。

**Type**: `mutation`

**Input Schema**:
```typescript
const updateGameSchema = z.object({
  id: z.number().int().positive(),
  currencyId: z.number().int().positive().optional(),
  name: z.string().min(1).max(100).trim().optional(),
  smallBlind: z.number().int().positive().optional(),
  bigBlind: z.number().int().positive().optional(),
  ante: z.number().int().min(0).optional(),
  minBuyIn: z.number().int().positive().optional(),
  maxBuyIn: z.number().int().positive().optional(),
  rules: z.string().max(50000).optional().nullable(),
}).refine(
  (data) => {
    if (data.smallBlind !== undefined && data.bigBlind !== undefined) {
      return data.bigBlind >= data.smallBlind;
    }
    return true;
  },
  { message: "BBはSB以上でなければなりません", path: ["bigBlind"] }
).refine(
  (data) => {
    if (data.minBuyIn !== undefined && data.maxBuyIn !== undefined) {
      return data.maxBuyIn >= data.minBuyIn;
    }
    return true;
  },
  { message: "最大バイインは最小バイイン以上でなければなりません", path: ["maxBuyIn"] }
);
```

**Output Schema**: `CreateGameOutput` と同じ

**Error Cases**:
| Code | Message | Condition |
|------|---------|-----------|
| NOT_FOUND | ゲームが見つかりません | 存在しない or 他ユーザーのゲーム |
| NOT_FOUND | 通貨が見つかりません | 存在しない or 他ユーザーの通貨 |
| BAD_REQUEST | 同じ名前のゲームがこの店舗に既に存在します | ゲーム名重複 |

---

### games.archive

ゲームをアーカイブする。

**Type**: `mutation`

**Input Schema**:
```typescript
const archiveGameSchema = z.object({
  id: z.number().int().positive(),
});
```

**Output Schema**:
```typescript
type ArchiveGameOutput = {
  success: boolean;
};
```

**Error Cases**:
| Code | Message | Condition |
|------|---------|-----------|
| NOT_FOUND | ゲームが見つかりません | 存在しない or 他ユーザーのゲーム |

---

### games.unarchive

ゲームのアーカイブを解除する。

**Type**: `mutation`

**Input Schema**:
```typescript
const unarchiveGameSchema = z.object({
  id: z.number().int().positive(),
});
```

**Output Schema**:
```typescript
type UnarchiveGameOutput = {
  success: boolean;
};
```

**Error Cases**:
| Code | Message | Condition |
|------|---------|-----------|
| NOT_FOUND | ゲームが見つかりません | 存在しない or 他ユーザーのゲーム |

---

### games.delete

ゲームを削除する。使用中のゲームは削除不可。

**Type**: `mutation`

**Input Schema**:
```typescript
const deleteGameSchema = z.object({
  id: z.number().int().positive(),
});
```

**Output Schema**:
```typescript
type DeleteGameOutput = {
  success: boolean;
};
```

**Error Cases**:
| Code | Message | Condition |
|------|---------|-----------|
| NOT_FOUND | ゲームが見つかりません | 存在しない or 他ユーザーのゲーム |
| BAD_REQUEST | このゲームはセッションで使用されているため削除できません | セッションが紐付いている |

**Business Logic**:
1. ゲームの存在と所有権を確認（店舗経由でユーザーをチェック）
2. このゲームを使用しているセッションがあるか確認
3. セッションがある場合はエラーを返す
4. セッションがない場合は削除を実行

**Recommendation**: 削除よりもアーカイブを推奨するUIを実装

---

### games.checkUsage

ゲームの使用状況を確認する（削除前確認用）。

**Type**: `query`

**Input Schema**:
```typescript
const checkUsageSchema = z.object({
  id: z.number().int().positive(),
});
```

**Output Schema**:
```typescript
type CheckUsageOutput = {
  canDelete: boolean;
  sessionCount: number;
};
```

---

## Client Integration

### Cache Invalidation Strategy

```typescript
// ゲーム作成・更新・削除・アーカイブ時
void ctx.games.getAll.invalidate();
void ctx.games.getByLocation.invalidate({ locationId });
void ctx.games.getActiveByLocation.invalidate({ locationId });
void ctx.games.getById.invalidate({ id });
void ctx.sessions.getAll.invalidate(); // セッションにゲーム情報が含まれる場合
```

### Hook Example

```typescript
// src/features/games/hooks/useGames.ts
export function useGamesByLocation(locationId: number | undefined) {
  const { data: games, isLoading } = api.games.getByLocation.useQuery(
    { locationId: locationId ?? 0, includeArchived: true },
    { enabled: !!locationId }
  );

  return {
    games: games ?? [],
    isLoading,
    activeGames: (games ?? []).filter((g) => !g.isArchived),
    archivedGames: (games ?? []).filter((g) => g.isArchived),
  };
}

export function useActiveGamesForSession(locationId: number | undefined) {
  const { data: games, isLoading } = api.games.getActiveByLocation.useQuery(
    { locationId: locationId ?? 0 },
    { enabled: !!locationId }
  );

  return {
    games: games ?? [],
    isLoading,
  };
}
```

---

## Display Format Helper

```typescript
// src/lib/utils/game.ts

// ブラインド構造を表示用文字列に変換
export function formatBlinds(
  smallBlind: number,
  bigBlind: number,
  ante?: number | null
): string {
  const base = `${smallBlind}/${bigBlind}`;
  if (ante && ante > 0) {
    return `${base} (Ante ${ante})`;
  }
  return base;
}

// バイイン範囲を表示用文字列に変換
export function formatBuyInRange(
  minBuyIn: number,
  maxBuyIn: number
): string {
  return `${minBuyIn}BB - ${maxBuyIn}BB`;
}

// ゲームサマリを表示用文字列に変換
export function formatGameSummary(game: {
  name: string;
  smallBlind: number;
  bigBlind: number;
  ante: number | null;
  currency: { name: string };
}): string {
  const blinds = formatBlinds(game.smallBlind, game.bigBlind, game.ante);
  return `${game.name} (${blinds}) - ${game.currency.name}`;
}
```
