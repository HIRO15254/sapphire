# tRPC Tasks API Contract

**Date**: 2025-10-17
**Feature**: レスポンシブTodoアプリ
**Purpose**: tRPC Tasks proceduresの契約仕様定義

## Overview

Tasks機能のためのtRPC procedures。CRUD操作(Create, Read, Update, Delete)を提供。

**Base Path**: `tasks.*`
**Authentication**: なし(MVP版は単一ユーザー)

---

## Procedures

### 1. `tasks.getAll`

**Type**: Query
**Description**: すべてのタスクを作成日時降順で取得(FR-004)

#### Input

```typescript
// 入力なし
void
```

#### Output

```typescript
Task[] // Task型の配列

interface Task {
  id: string;          // UUID
  content: string;     // タスク内容 (最大500文字)
  completed: boolean;  // 完了状態
  createdAt: Date;     // 作成日時
  updatedAt: Date;     // 更新日時
}
```

#### Example

```typescript
// Client side
const { data: tasks } = trpc.tasks.getAll.useQuery();

// Expected response
[
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    content: "牛乳を買う",
    completed: false,
    createdAt: new Date("2025-10-17T10:00:00Z"),
    updatedAt: new Date("2025-10-17T10:00:00Z")
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    content: "レポートを書く",
    completed: true,
    createdAt: new Date("2025-10-17T09:00:00Z"),
    updatedAt: new Date("2025-10-17T10:30:00Z")
  }
]
```

#### Success Response

- **Status**: 200 OK
- **Body**: `Task[]`

#### Error Responses

- **Database Error**: TRPCエラー(INTERNAL_SERVER_ERROR)

---

### 2. `tasks.create`

**Type**: Mutation
**Description**: 新しいタスクを作成(FR-002)

#### Input

```typescript
{
  content: string;  // タスク内容 (1〜500文字, 空白のみ不可)
}
```

#### Input Validation

- `content`: 必須、1文字以上500文字以下
- 空白のみの文字列は拒否(FR-003)

```typescript
z.object({
  content: z.string()
    .min(1, { message: "タスク内容を入力してください" })
    .max(500, { message: "タスク内容は500文字以内で入力してください" })
    .refine((val) => val.trim().length > 0, {
      message: "タスク内容を入力してください"
    })
})
```

#### Output

```typescript
Task  // 作成されたタスク

interface Task {
  id: string;
  content: string;
  completed: boolean;  // 常にfalse (新規作成時)
  createdAt: Date;
  updatedAt: Date;
}
```

#### Example

```typescript
// Client side
const createTask = trpc.tasks.create.useMutation();
createTask.mutate({ content: "牛乳を買う" });

// Expected response
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  content: "牛乳を買う",
  completed: false,
  createdAt: new Date("2025-10-17T10:00:00Z"),
  updatedAt: new Date("2025-10-17T10:00:00Z")
}
```

#### Success Response

- **Status**: 200 OK
- **Body**: `Task`

#### Error Responses

- **Validation Error**: TRPCエラー(BAD_REQUEST)
  - `content`が空、または500文字超過
  - エラーメッセージ: "タスク内容を入力してください" / "タスク内容は500文字以内で入力してください"

- **Database Error**: TRPCエラー(INTERNAL_SERVER_ERROR)

---

### 3. `tasks.toggleComplete`

**Type**: Mutation
**Description**: タスクの完了状態を切り替え(FR-005, FR-007)

#### Input

```typescript
{
  id: string;  // タスクID (UUID)
}
```

#### Input Validation

```typescript
z.object({
  id: z.string().uuid({ message: "無効なタスクIDです" })
})
```

#### Output

```typescript
Task  // 更新されたタスク

interface Task {
  id: string;
  content: string;
  completed: boolean;  // 切り替え後の状態
  createdAt: Date;
  updatedAt: Date;     // 更新日時が変更される
}
```

#### Example

```typescript
// Client side
const toggleComplete = trpc.tasks.toggleComplete.useMutation();
toggleComplete.mutate({ id: "550e8400-e29b-41d4-a716-446655440000" });

// Expected response (completed: false → true)
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  content: "牛乳を買う",
  completed: true,
  createdAt: new Date("2025-10-17T10:00:00Z"),
  updatedAt: new Date("2025-10-17T11:00:00Z")  // 更新された
}
```

#### Success Response

- **Status**: 200 OK
- **Body**: `Task`

#### Error Responses

- **Not Found**: TRPCエラー(NOT_FOUND)
  - 指定されたIDのタスクが存在しない
  - エラーメッセージ: "タスクが見つかりません"

- **Validation Error**: TRPCエラー(BAD_REQUEST)
  - 無効なUUID形式
  - エラーメッセージ: "無効なタスクIDです"

- **Database Error**: TRPCエラー(INTERNAL_SERVER_ERROR)

---

### 4. `tasks.delete`

**Type**: Mutation
**Description**: タスクを削除(FR-008)

#### Input

```typescript
{
  id: string;  // タスクID (UUID)
}
```

#### Input Validation

```typescript
z.object({
  id: z.string().uuid({ message: "無効なタスクIDです" })
})
```

#### Output

```typescript
{
  success: boolean;  // 常にtrue (削除成功)
}
```

#### Example

```typescript
// Client side
const deleteTask = trpc.tasks.delete.useMutation();
deleteTask.mutate({ id: "550e8400-e29b-41d4-a716-446655440000" });

// Expected response
{
  success: true
}
```

#### Success Response

- **Status**: 200 OK
- **Body**: `{ success: true }`

#### Error Responses

- **Not Found**: TRPCエラー(NOT_FOUND)
  - 指定されたIDのタスクが存在しない
  - エラーメッセージ: "タスクが見つかりません"

- **Validation Error**: TRPCエラー(BAD_REQUEST)
  - 無効なUUID形式
  - エラーメッセージ: "無効なタスクIDです"

- **Database Error**: TRPCエラー(INTERNAL_SERVER_ERROR)

---

## tRPC Router Implementation Example

```typescript
// src/server/trpc/procedures/tasks.ts
import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { tasks } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const tasksRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }),

  create: publicProcedure
    .input(
      z.object({
        content: z.string()
          .min(1, { message: "タスク内容を入力してください" })
          .max(500, { message: "タスク内容は500文字以内で入力してください" })
          .refine((val) => val.trim().length > 0, {
            message: "タスク内容を入力してください"
          })
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db.insert(tasks).values(input).returning();
      return task;
    }),

  toggleComplete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db.select().from(tasks).where(eq(tasks.id, input.id));

      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'タスクが見つかりません' });
      }

      const [updated] = await ctx.db
        .update(tasks)
        .set({ completed: !task.completed, updatedAt: new Date() })
        .where(eq(tasks.id, input.id))
        .returning();

      return updated;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.delete(tasks).where(eq(tasks.id, input.id)).returning();

      if (result.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'タスクが見つかりません' });
      }

      return { success: true };
    }),
});
```

---

## Client Usage Example

```typescript
// features/tasks/hooks/useTasks.ts
import { trpc } from '@/lib/trpc/client';

export function useTasks() {
  const { data: tasks, isLoading } = trpc.tasks.getAll.useQuery();
  const createMutation = trpc.tasks.create.useMutation();
  const toggleMutation = trpc.tasks.toggleComplete.useMutation();
  const deleteMutation = trpc.tasks.delete.useMutation();

  const createTask = async (content: string) => {
    try {
      await createMutation.mutateAsync({ content });
    } catch (error) {
      // エラーハンドリング
      console.error('タスクの作成に失敗しました', error);
    }
  };

  return { tasks, isLoading, createTask, toggleMutation, deleteMutation };
}
```

---

## Testing Contract

契約テスト(`tests/contract/tasks.contract.test.ts`)で以下を検証:

1. **getAll**: 空配列、複数タスクの取得
2. **create**: 正常作成、バリデーションエラー(空文字、501文字)
3. **toggleComplete**: 完了状態の切り替え、存在しないID
4. **delete**: 正常削除、存在しないID

---

## Summary

このAPI契約は以下を満たしています:

- ✅ **FR-001〜FR-015**: すべての機能要件をサポート
- ✅ **型安全性**: tRPC + Zodで完全な型安全性
- ✅ **バリデーション**: 入力バリデーションでデータ整合性を保証
- ✅ **エラーハンドリング**: 明確なエラーメッセージ(日本語)
- ✅ **テスト可能性**: 契約テストで各procedureを検証
