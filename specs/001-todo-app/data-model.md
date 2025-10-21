# Data Model: レスポンシブTodoアプリ

**Date**: 2025-10-17
**Feature**: レスポンシブTodoアプリ
**Purpose**: データモデル、スキーマ定義、エンティティ関係の詳細設計

## Entity Relationship

```
┌─────────────────────────────┐
│         Task                │
├─────────────────────────────┤
│ id: string (UUID)           │
│ content: string (max 500)   │
│ completed: boolean          │
│ createdAt: timestamp        │
│ updatedAt: timestamp        │
└─────────────────────────────┘
```

**Note**: MVP版は単一ユーザー向けのため、Userエンティティは不要。将来的にマルチユーザー対応する場合は、TaskにuserIdを追加。

---

## Entity: Task

### Purpose
ユーザーが管理する個別のタスク(作業項目)を表現する。

### Attributes

| Attribute  | Type      | Constraints                          | Description                                    |
|------------|-----------|--------------------------------------|------------------------------------------------|
| id         | UUID      | PRIMARY KEY, NOT NULL, AUTO-GENERATED| タスクの一意識別子                              |
| content    | VARCHAR   | NOT NULL, MAX LENGTH 500             | タスクの内容(テキスト)                          |
| completed  | BOOLEAN   | NOT NULL, DEFAULT FALSE              | 完了状態 (true: 完了, false: 未完了)           |
| createdAt  | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP  | タスクの作成日時                                |
| updatedAt  | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP  | タスクの最終更新日時 (completeの変更時も更新)  |

### Validation Rules

**FR-003対応**: 空のタスク追加を防止
- `content`が空文字列または空白のみの場合、エラー

**FR-013対応**: 最大文字数制限
- `content`は最大500文字

**FR-015対応**: 絵文字と特殊文字のサポート
- UTF-8エンコーディングで絵文字と特殊文字を正しく保存・表示

### State Transitions

```
[未完了] --完了マーク--> [完了]
[完了]   --完了解除--> [未完了]
```

**FR-005, FR-007対応**:
- ユーザーは未完了タスクを完了状態にマークできる
- ユーザーは完了タスクを未完了状態に戻せる

### Indexes

```sql
-- 作成日時でソート(新しいものが上)
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
```

**FR-004対応**: タスクを時系列順(新しいものが上)に表示するため、createdAtにインデックスを作成。

---

## Drizzle ORM Schema

### Schema Definition

```typescript
// src/server/db/schema.ts
import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: varchar('content', { length: 500 }).notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
```

### Type Safety

Drizzle ORMは型安全なスキーマ定義を提供:
- `Task`: SELECT時の型(すべてのフィールドが必須)
- `NewTask`: INSERT時の型(デフォルト値があるフィールドはオプショナル)

これにより、TypeScriptでコンパイル時に型チェックが可能。

---

## Database Migrations

### Migration Strategy

Drizzle Kitを使用してスキーマ変更を管理:

```bash
# マイグレーションファイル生成
bun run drizzle-kit generate:pg

# マイグレーション実行
bun run drizzle-kit migrate
```

### Initial Migration

```sql
-- 0001_initial_tasks_table.sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content VARCHAR(500) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
```

---

## Data Access Patterns

### Query Patterns

1. **全タスク取得** (FR-004)
   ```typescript
   const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
   ```

2. **タスク作成** (FR-002)
   ```typescript
   const newTask = await db.insert(tasks).values({ content: '牛乳を買う' }).returning();
   ```

3. **完了状態の切り替え** (FR-005, FR-007)
   ```typescript
   await db.update(tasks)
     .set({ completed: !task.completed, updatedAt: new Date() })
     .where(eq(tasks.id, taskId));
   ```

4. **タスク削除** (FR-008)
   ```typescript
   await db.delete(tasks).where(eq(tasks.id, taskId));
   ```

### Performance Considerations

- **インデックス**: `created_at`にインデックスを設定し、ソートクエリを高速化
- **LIMIT**: 将来的にタスクが1000個以上になる場合、ページネーションを検討
- **キャッシュ**: tRPCのクエリキャッシュで頻繁なDBアクセスを削減

---

## Future Enhancements

将来的にマルチユーザー対応する場合の拡張案:

### User Entity

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id), // 追加
  content: varchar('content', { length: 500 }).notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### Additional Indexes

```sql
-- ユーザーごとのタスクを高速取得
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_id_created_at ON tasks(user_id, created_at DESC);
```

---

## Summary

このデータモデルは以下を満たしています:

- ✅ **FR-001〜FR-015**: すべての機能要件をサポート
- ✅ **シンプルさ**: 単一テーブル構成でMVPに最適
- ✅ **拡張性**: 将来のマルチユーザー対応が容易
- ✅ **パフォーマンス**: 適切なインデックス設計
- ✅ **型安全性**: Drizzle ORMで完全な型サポート
