# Project Structure

## Directory Organization

```
sapphire/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (main)/                   # 認証必須ルート（レイアウト共有）
│   │   │   ├── dashboard/            # ダッシュボード
│   │   │   ├── sessions/             # セッション管理
│   │   │   │   ├── active/           # アクティブセッション記録
│   │   │   │   └── [id]/             # セッション詳細
│   │   │   ├── players/              # 対戦相手管理
│   │   │   │   └── [id]/             # プレイヤー詳細
│   │   │   ├── currencies/           # 通貨管理
│   │   │   │   └── [id]/             # 通貨詳細
│   │   │   └── stores/               # 店舗管理
│   │   ├── auth/                     # 認証ページ
│   │   │   ├── signin/
│   │   │   └── register/
│   │   ├── api/                      # APIルート
│   │   └── layout.tsx                # ルートレイアウト
│   │
│   ├── components/
│   │   ├── layouts/                  # レイアウトコンポーネント
│   │   │   ├── AppShell.tsx          # メインアプリシェル
│   │   │   └── __fixtures__/         # React Cosmosフィクスチャ
│   │   ├── ui/                       # 再利用可能UIコンポーネント
│   │   ├── auth/                     # 認証関連コンポーネント
│   │   ├── sessions/                 # セッション固有コンポーネント
│   │   └── tournament/               # トーナメント関連コンポーネント
│   │
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/              # tRPCルーター（APIエンドポイント）
│   │   │   │   ├── session.ts        # セッションCRUD
│   │   │   │   ├── player.ts         # プレイヤー管理
│   │   │   │   ├── sessionEvent.ts   # ライブイベント追跡
│   │   │   │   ├── currency/         # 通貨関連
│   │   │   │   ├── tournament/       # トーナメント関連
│   │   │   │   └── ...
│   │   │   ├── schemas/              # Zodバリデーションスキーマ
│   │   │   ├── root.ts               # ルーター集約
│   │   │   └── trpc.ts               # tRPC設定・ミドルウェア
│   │   │
│   │   ├── db/
│   │   │   ├── schema/               # Drizzle ORMスキーマ
│   │   │   │   ├── index.ts          # スキーマエクスポート・リレーション
│   │   │   │   ├── user.ts
│   │   │   │   ├── session.ts
│   │   │   │   ├── player.ts
│   │   │   │   ├── common.ts         # 共通スキーマユーティリティ
│   │   │   │   └── ...
│   │   │   ├── migrate.ts
│   │   │   ├── seed.ts
│   │   │   └── index.ts
│   │   │
│   │   └── auth/
│   │       ├── index.ts
│   │       ├── config.ts             # NextAuth設定
│   │       └── edge-config.ts        # Edge互換設定
│   │
│   ├── trpc/
│   │   ├── react.tsx                 # クライアントtRPCプロバイダー
│   │   ├── server.tsx                # サーバーサイドtRPC呼び出し
│   │   └── query-client.ts           # React Query設定
│   │
│   ├── contexts/                     # Reactコンテキスト
│   │   └── PageTitleContext.tsx
│   │
│   ├── lib/                          # ユーティリティ
│   │   ├── google-maps.ts
│   │   └── version.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   └── middleware.ts                 # NextAuthミドルウェア
│
├── tests/
│   ├── e2e/                          # Playwright E2Eテスト
│   ├── integration/                  # 統合テスト
│   ├── unit/                         # ユニットテスト
│   ├── helpers/                      # テストユーティリティ
│   └── setup.ts
│
├── drizzle/                          # DBマイグレーションファイル
├── public/                           # 静的アセット
└── .github/                          # GitHub Actions
```

## Naming Conventions

### Files
- **Components**: `PascalCase.tsx`（例: `SessionList.tsx`, `PlayerTagModal.tsx`）
- **Pages/Routes**: `page.tsx`（Next.js App Router規約）
- **Routers**: `camelCase.ts`（例: `session.ts`, `playerTag.ts`）
- **Schemas**: `camelCase.ts`（例: `player.ts`, `tournament.ts`）
- **Tests**: `[filename].test.ts`（例: `session.test.ts`）

### Code
- **Classes/Types**: `PascalCase`（例: `Session`, `Player`, `NewSession`）
- **Functions/Methods**: `camelCase`（例: `createSession`, `getPlayerById`）
- **Constants**: `UPPER_SNAKE_CASE` または `camelCase`（コンテキストによる）
- **Variables**: `camelCase`（例: `userId`, `sessionData`）
- **Database Tables**: `camelCase`（例: `pokerSessions`, `players`）
- **tRPC Procedures**: `camelCase`（例: `list`, `create`, `update`, `delete`, `get`）

## Import Patterns

### Import Order
1. React/Next.js関連
2. 外部ライブラリ（Mantine, tRPC等）
3. 内部モジュール（`@/`パス）
4. 相対インポート
5. スタイルインポート

### Module/Package Organization
```typescript
// 絶対パスインポート（@/エイリアス使用）
import { api } from "@/trpc/react";
import { Button } from "@mantine/core";

// サーバー/クライアント分離
import { createCaller } from "@/server/api/root";  // サーバーのみ
import { api } from "@/trpc/react";                 // クライアントのみ
```

## Code Structure Patterns

### tRPCルーター構成
```typescript
// src/server/api/routers/[entity].ts
export const entityRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ ctx, input }) => { ... }),

  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => { ... }),

  update: protectedProcedure
    .input(updateSchema)
    .mutation(async ({ ctx, input }) => { ... }),

  delete: protectedProcedure
    .input(deleteSchema)
    .mutation(async ({ ctx, input }) => { ... }),
});
```

### DBスキーマ構成
```typescript
// src/server/db/schema/[entity].ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { timestampColumns } from "./common";

export const entities = pgTable("entities", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  // ...フィールド定義
  ...timestampColumns,
});

// 型エクスポート
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
```

### Reactコンポーネント構成
```typescript
// src/app/(main)/[feature]/[Feature]Content.tsx
"use client";

import { ... } from "@mantine/core";
import { api } from "@/trpc/react";

export function FeatureContent() {
  const { data, isLoading } = api.feature.list.useQuery();

  if (isLoading) return <Loader />;

  return (
    <Container>
      {/* コンテンツ */}
    </Container>
  );
}
```

## Code Organization Principles

1. **Single Responsibility**: 各ファイルは1つの明確な目的を持つ
2. **Co-location**: コンポーネントはルート近くに配置（`SessionsContent.tsx`は`sessions/`内）
3. **Separation of Concerns**:
   - スキーマファイル（バリデーション）
   - ルーターファイル（ビジネスロジック）
   - コンポーネントファイル（UI）
4. **Type Safety**: 全体で完全な型安全性を維持

## Module Boundaries

### レイヤー分離
```
UI Layer (src/app, src/components)
  ├── Server Components: データフェッチ担当
  ├── Client Components: データ表示・クエリ用データ作成担当
  └── Server Actions: Mutation処理（順次移行予定）
    ↓ tRPC calls / Server Actions
API Layer (src/server/api/routers)
    ↓ Drizzle queries
Data Layer (src/server/db/schema)
    ↓ PostgreSQL
Database
```

### UIレイヤーの責務分担
- **Server Components**: データフェッチを担当。DBからデータを取得しクライアントに渡す
- **Client Components**: データ表示とユーザーインタラクション。クエリ用パラメータの作成
- **Server Actions**: Mutation処理（現在はtRPC mutation使用、順次Server Actionへ移行予定）

### 依存関係の方向
- UIレイヤー → APIレイヤー → データレイヤー（単方向）
- スキーマ定義はルーターとUIの両方から参照可能
- `src/server/db/schema/index.ts`でリレーションを一元管理（循環参照回避）

### マルチテナント分離
- 全クエリに`eq(table.userId, ctx.session.user.id)`を必須適用
- ユーザー間のデータアクセスを完全に分離

## Code Size Guidelines

- **File size**: 500行以下を推奨（大規模ルーターは例外）
- **Function size**: 50行以下を推奨
- **Component size**: 200行以下を推奨（複雑なものは分割）
- **Nesting depth**: 最大4レベル

## Documentation Standards

- 複雑なビジネスロジックにはインラインコメント
- Zodスキーマによる自己文書化API
- TypeScriptの型による暗黙的ドキュメンテーション
- 主要な設計決定はコード内コメントで記録
