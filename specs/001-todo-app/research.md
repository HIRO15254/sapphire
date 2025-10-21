# Research: レスポンシブTodoアプリ

**Date**: 2025-10-17
**Feature**: レスポンシブTodoアプリ
**Purpose**: 技術スタックの選定、ベストプラクティス、アーキテクチャパターンの調査

## 1. ローカル開発環境でのPostgreSQL選択

### Decision
Docker Composeを使用したローカルPostgreSQLコンテナを採用

### Rationale
- **開発環境の一貫性**: Docker Composeでチーム全体で同じDB環境を共有
- **セットアップの簡単さ**: `docker compose up`で即座に起動
- **本番環境との整合性**: 本番PostgreSQLと同じバージョンを使用可能
- **マイグレーション管理**: Drizzle Kitでマイグレーションを実行

### Alternatives Considered
- **Supabase Local**: 認証やStorage機能も提供されるが、今回は不要(オーバースペック)
- **SQLite**: 軽量だが、本番PostgreSQLと差異があり、型やクエリの互換性問題が発生する可能性

### Implementation Notes
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: todoapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

---

## 2. Next.js + tRPC + Drizzle ORMの統合パターン

### Decision
Next.js App RouterのAPI Routesでt RPC serverを配置し、Drizzle ORMでDB操作を実行

### Rationale
- **型安全性の徹底**: tRPCでフロントエンド〜バックエンド間の型を自動生成
- **シンプルな構成**: モノリポ不要で単一Next.jsプロジェクトに集約
- **パフォーマンス**: tRPCはREST APIよりも軽量で高速
- **Drizzle ORMの利点**: TypeScript-firstで型安全、軽量、Prismaより高速

### Best Practices
1. **tRPCルーターの分割**: 機能ごとにプロシージャを分割(`procedures/tasks.ts`)
2. **Drizzle Schemaの定義**: `src/server/db/schema.ts`で型安全なスキーマ定義
3. **tRPC Contextの活用**: DB clientをcontextに渡し、すべてのprocedureで利用可能に

### Reference Pattern
```typescript
// src/server/trpc/init.ts
export const createTRPCContext = async () => {
  return { db: getDbClient() };
};

// src/server/trpc/procedures/tasks.ts
export const tasksRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(tasks);
  }),
  create: publicProcedure
    .input(z.object({ content: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(tasks).values(input);
    }),
});
```

---

## 3. Mantine v8のレスポンシブデザイン実装

### Decision
Mantineの`rem`ユニット + `useMediaQuery`フックを使用したレスポンシブ実装

### Rationale
- **一貫性**: Mantineのテーマシステムでブレークポイントを統一管理
- **アクセシビリティ**: `rem`ユニットはユーザーのフォントサイズ設定を尊重
- **型安全性**: Mantineコンポーネントは完全TypeScript対応

### Best Practices
- **ブレークポイント定義**: `xs: 375px`, `sm: 768px`, `md: 1024px`, `lg: 1920px`
- **Stack/Groupコンポーネント**: レスポンシブレイアウトを簡単に実装
- **Grid system**: 複雑なレイアウトにはMantineのGridを使用

### Reference Pattern
```typescript
import { useMediaQuery } from '@mantine/hooks';
import { Stack, Button } from '@mantine/core';

function TaskInput() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <Stack spacing={isMobile ? 'sm' : 'md'}>
      <TextInput />
      <Button fullWidth={isMobile}>追加</Button>
    </Stack>
  );
}
```

---

## 4. PWA (Progressive Web App) 実装

### Decision
Next.js PWA pluginを使用せず、手動でService WorkerとManifestを実装

### Rationale
- **柔軟性**: 必要最小限のPWA機能を実装し、不要な複雑性を避ける
- **学習機会**: PWAの仕組みを理解しやすい
- **オフライン対応**: Service Workerでキャッシュ戦略を制御

### Implementation Approach
1. **Manifest**: `src/app/manifest.ts`でPWA manifestを定義
2. **Service Worker**: `public/sw.js`でキャッシュ戦略を実装
3. **登録**: `src/app/layout.tsx`でService Workerを登録

### Offline Strategy
- **Cache First**: 静的アセット(CSS, JS, images)
- **Network First**: APIリクエスト(tRPC)、失敗時にキャッシュにフォールバック

---

## 5. Vitestでのテスト戦略

### Decision
Vitestで契約テスト、統合テスト、単体テストを実装

### Rationale
- **高速**: JestよりVitestの方が起動・実行が高速
- **Vite互換**: Next.jsと親和性が高い
- **React Testing Library統合**: コンポーネントテストが容易

### Test Structure
1. **契約テスト** (`tests/contract/`): tRPC proceduresの入出力を検証
2. **統合テスト** (`tests/integration/`): ユーザーストーリー全体のフローを検証
3. **単体テスト** (`tests/unit/`): 個別コンポーネント、関数を検証

### Reference Pattern
```typescript
// tests/contract/tasks.contract.test.ts
import { describe, it, expect } from 'vitest';
import { tasksRouter } from '@/server/trpc/procedures/tasks';

describe('Tasks Contract', () => {
  it('should create a task', async () => {
    const result = await tasksRouter.create({ content: 'Test' });
    expect(result).toHaveProperty('id');
  });
});
```

---

## 6. Biomeでのリント・フォーマット設定

### Decision
Biomeを使用し、ESLint + Prettierを置き換え

### Rationale
- **高速**: RustベースでESLint/Prettierより数十倍高速
- **オールインワン**: リントとフォーマットを統合
- **型安全性**: TypeScriptとの親和性が高い

### Configuration
```json
// biome.json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

---

## 7. GitHub Actions CI/CDパイプライン

### Decision
GitHub ActionsでCI/CDを実装し、Biome lint + Vitestを自動実行

### Rationale
- **統合性**: GitHubと完全統合
- **無料**: パブリックリポジトリは無料
- **並列実行**: lint, test, buildを並列実行可能

### Workflow Structure
```yaml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
```

---

## 8. Container層とPresentation層の分離パターン

### Decision
`features/*/containers/`でロジック、`features/*/components/`でUIを分離

### Rationale
- **再利用性**: Presentationコンポーネントは他の場所でも再利用可能
- **テスト容易性**: ロジックとUIを独立してテスト
- **憲法遵守**: 憲法原則IV「レイヤーの責務分離」を実現

### Pattern
```typescript
// Container層: features/tasks/containers/TaskListContainer.tsx
export function TaskListContainer() {
  const { data: tasks, isLoading } = trpc.tasks.getAll.useQuery();
  const createTask = trpc.tasks.create.useMutation();

  const handleCreate = (content: string) => {
    createTask.mutate({ content });
  };

  return (
    <TaskList
      tasks={tasks}
      isLoading={isLoading}
      onCreateTask={handleCreate}
    />
  );
}

// Presentation層: features/tasks/components/TaskList.tsx
interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onCreateTask: (content: string) => void;
}

export function TaskList({ tasks, isLoading, onCreateTask }: TaskListProps) {
  return (
    <Stack>
      <TaskInput onSubmit={onCreateTask} />
      {tasks.map(task => <TaskItem key={task.id} task={task} />)}
    </Stack>
  );
}
```

---

## Summary

すべての技術選定とパターンは以下の方針に基づいています:

1. **型安全性**: TypeScript + tRPC + Drizzle ORMで完全な型安全性
2. **シンプルさ**: モノリポ不要、最小限の依存関係
3. **パフォーマンス**: Bun + Vitest + Biomeで高速開発体験
4. **憲法遵守**: レイヤー分離、TDD、日本語ファースト、UX一貫性を実現
5. **モダンスタック**: 最新のベストプラクティスを採用
