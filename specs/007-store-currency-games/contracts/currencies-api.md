# API Contract: 通貨 (Currencies) API

**Feature Branch**: `007-store-currency-games`
**Created**: 2025-12-05
**Status**: Planning

## Overview

通貨を管理するtRPC API。ユーザーがアミューズメントポーカーで使用する通貨（ポイント、チップなど）を登録・管理する。

## Router: `currencies`

ファイルパス: `src/server/api/routers/currencies.ts`

すべてのプロシージャは `protectedProcedure` を使用し、認証必須。

---

## Procedures

### currencies.create

新しい通貨を作成する。

**Type**: `mutation`

**Input Schema**:
```typescript
const createCurrencySchema = z.object({
  name: z.string()
    .min(1, "通貨名は必須です")
    .max(100, "通貨名は100文字以内です")
    .trim(),
});
```

**Output Schema**:
```typescript
type CreateCurrencyOutput = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};
```

**Validation Rules**:
- 通貨名はユーザー内で一意（大文字小文字区別なし）
- 重複時はエラー

**Error Cases**:
| Code | Message | Condition |
|------|---------|-----------|
| BAD_REQUEST | 同じ名前の通貨が既に存在します | 通貨名重複 |
| INTERNAL_SERVER_ERROR | 通貨の作成に失敗しました | DB挿入失敗 |

**Example**:
```typescript
// Client
const { mutate } = api.currencies.create.useMutation({
  onSuccess: () => {
    void ctx.currencies.getAll.invalidate();
  },
});
mutate({ name: "GGポイント" });
```

---

### currencies.getAll

ユーザーの全通貨を取得する。

**Type**: `query`

**Input**: なし

**Output Schema**:
```typescript
type GetAllCurrenciesOutput = Array<{
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    games: number;  // この通貨を使用しているゲーム数
  };
}>;
```

**Example**:
```typescript
// Client
const { data: currencies } = api.currencies.getAll.useQuery();
```

---

### currencies.getById

IDで通貨を取得する。

**Type**: `query`

**Input Schema**:
```typescript
const getByIdSchema = z.object({
  id: z.number().int().positive(),
});
```

**Output Schema**:
```typescript
type GetByIdCurrencyOutput = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  games: Array<{
    id: number;
    name: string;
    locationId: number;
    locationName: string;
  }>;
} | null;
```

**Error Cases**:
| Code | Message | Condition |
|------|---------|-----------|
| - | Returns null | 通貨が存在しない or 他ユーザーの通貨 |

---

### currencies.update

通貨名を更新する。

**Type**: `mutation`

**Input Schema**:
```typescript
const updateCurrencySchema = z.object({
  id: z.number().int().positive(),
  name: z.string()
    .min(1, "通貨名は必須です")
    .max(100, "通貨名は100文字以内です")
    .trim(),
});
```

**Output Schema**:
```typescript
type UpdateCurrencyOutput = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};
```

**Error Cases**:
| Code | Message | Condition |
|------|---------|-----------|
| NOT_FOUND | 通貨が見つかりません | 存在しない or 他ユーザーの通貨 |
| BAD_REQUEST | 同じ名前の通貨が既に存在します | 通貨名重複 |

---

### currencies.delete

通貨を削除する。使用中の通貨は削除不可。

**Type**: `mutation`

**Input Schema**:
```typescript
const deleteCurrencySchema = z.object({
  id: z.number().int().positive(),
});
```

**Output Schema**:
```typescript
type DeleteCurrencyOutput = {
  success: boolean;
};
```

**Error Cases**:
| Code | Message | Condition |
|------|---------|-----------|
| NOT_FOUND | 通貨が見つかりません | 存在しない or 他ユーザーの通貨 |
| BAD_REQUEST | この通貨はゲームで使用されているため削除できません | ゲームが紐付いている |

**Business Logic**:
1. 通貨の存在と所有権を確認
2. この通貨を使用しているゲームがあるか確認
3. ゲームがある場合はエラーを返す（使用中のゲーム名をメッセージに含める）
4. ゲームがない場合は削除を実行

---

### currencies.checkUsage

通貨の使用状況を確認する（削除前確認用）。

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
  usedByGames: Array<{
    id: number;
    name: string;
    locationId: number;
    locationName: string;
  }>;
};
```

---

## Client Integration

### Cache Invalidation Strategy

```typescript
// 通貨作成・更新・削除時
void ctx.currencies.getAll.invalidate();
void ctx.currencies.getById.invalidate({ id });
void ctx.games.getAll.invalidate(); // ゲームリストも更新（通貨名表示のため）
```

### Hook Example

```typescript
// src/features/currencies/hooks/useCurrencies.ts
export function useCurrencies() {
  const { data: currencies, isLoading } = api.currencies.getAll.useQuery();

  return {
    currencies: currencies ?? [],
    isLoading,
  };
}

export function useCreateCurrency() {
  const ctx = api.useContext();

  return api.currencies.create.useMutation({
    onSuccess: () => {
      void ctx.currencies.getAll.invalidate();
    },
  });
}
```
