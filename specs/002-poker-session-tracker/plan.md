# Implementation Plan: Poker Session Tracker

**Branch**: `002-poker-session-tracker` | **Date**: 2025-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-poker-session-tracker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements a multi-user poker session tracking application with OAuth2 authentication (Google and GitHub). Users can securely log in, record poker sessions (date, location, buy-in, cash-out, duration), view their session history, calculate statistics (total profit/loss, session count, averages), add notes to sessions, and filter sessions by location and date range. All data is isolated per user, ensuring complete privacy and security.

**Technical Approach**: Leverage existing Next.js 15 + tRPC + Drizzle ORM + NextAuth.js v5 stack. Extend the current Discord OAuth provider configuration to add Google and GitHub providers. Create new database schema for poker sessions with user foreign key. Implement tRPC routers for session CRUD operations with user-scoped queries. Build Mantine-based UI components following Container/Presentation pattern. Use TanStack Query for client-side state management. Implement comprehensive test coverage using Vitest (contract/integration) and Playwright (E2E).

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19 + Next.js 15 (App Router)
**Primary Dependencies**: Mantine v8, tRPC v11, Drizzle ORM v0.41, NextAuth.js v5, TanStack Query v5, Zod v3
**Storage**: PostgreSQL 16 (via Docker Compose, already configured)
**Testing**: Vitest v2 (contract/integration tests), Playwright v1 (E2E tests), @testing-library/react
**Target Platform**: Web (Server-side rendering + Client-side hydration)
**Project Type**: Web (integrated Next.js full-stack application)
**Performance Goals**: Session recording <60s, history/stats display <2s, filtering <1s, 1000 sessions per user supported
**Constraints**: OAuth sign-in <30s, 100% data isolation, browser refresh session persistence, 100 concurrent users
**Scale/Scope**: Multi-user application, ~1000 sessions per user, 5 user stories (P0-P4), 31 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 憲法遵守チェックリスト

- [x] **テスト駆動開発**: すべての機能にテストファーストアプローチを適用する計画があるか?
  - **遵守**: 契約テスト (tRPC procedures) → 統合テスト (React Testing Library) → E2Eテスト (Playwright) の順でRed-Green-Refactorサイクルを実施

- [x] **仕様の明確化**: 不明確な要件はすべて特定され、明確化プロセスが計画されているか?
  - **遵守**: OAuth2認証方法は仕様で確定済み (Google + GitHub)。すべての要件が明確で実装可能。

- [x] **日本語ファースト**: ドキュメント、UI、コミュニケーションが日本語で計画されているか?
  - **遵守**: すべてのUIテキスト、エラーメッセージ、ドキュメント (quickstart.md等) を日本語で作成。`src/lib/utils/currency.ts`で日本円フォーマット使用。

- [x] **レイヤー分離**: バックエンド(API層)とフロントエンド(Container層/Presentation層)の責務が明確に分離されているか?
  - **遵守**:
    - **API層** (`src/server/api/routers/sessions.ts`): ビジネスロジック、データアクセス、バリデーション
    - **Container層** (`src/features/poker-sessions/containers/`): tRPC呼び出し、状態管理、ロジック調整
    - **Presentation層** (`src/features/poker-sessions/components/`): UIコンポーネント、表示のみ

- [x] **コードレビュープロセス**: こまめなレビューとコミット承認プロセスが計画されているか?
  - **遵守**: 機能単位 (P0→P1→P2→P3→P4) でレビュー依頼。各フェーズでテスト合格確認後にコミット承認を得る。

- [x] **UX一貫性**: 一貫したユーザー体験を提供する設計方針があるか?
  - **遵守**: Mantine v8コンポーネント統一使用。レスポンシブデザイン (デスクトップ/タブレット/モバイル)。WCAG 2.1 AA準拠。

- [x] **ドキュメンテーション**: ユーザーガイド、クイックスタート、ヘルプの作成が計画されているか?
  - **遵守**: `quickstart.md` (ユーザー向け操作ガイド)、`data-model.md` (データモデル仕様)、`contracts/sessions-api.md` (API契約定義)、`research.md` (技術判断根拠) を作成。

**遵守状況**: すべて遵守

## Project Structure

### Documentation (this feature)

```
specs/002-poker-session-tracker/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technical decisions and rationale)
├── data-model.md        # Phase 1 output (entity definitions and relationships)
├── quickstart.md        # Phase 1 output (user guide in Japanese)
├── contracts/           # Phase 1 output (API contracts)
│   └── sessions-api.md  # tRPC sessions router contract
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Specification quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── app/                        # Next.js App Router
│   ├── poker-sessions/         # ポーカーセッション管理ページ
│   │   ├── page.tsx           # セッション一覧 + 統計表示
│   │   ├── new/
│   │   │   └── page.tsx       # 新規セッション作成フォーム
│   │   └── [id]/
│   │       ├── page.tsx       # セッション詳細表示
│   │       └── edit/
│   │           └── page.tsx   # セッション編集フォーム
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth.js handler (既存)
│   │   └── trpc/[trpc]/route.ts         # tRPC handler (既存)
│   ├── layout.tsx             # ルートレイアウト (既存)
│   └── page.tsx               # ホームページ (既存)
│
├── server/                     # バックエンド (API層)
│   ├── api/
│   │   ├── routers/
│   │   │   ├── tasks.ts       # 既存タスクルーター
│   │   │   └── sessions.ts    # 新規: ポーカーセッションAPI
│   │   ├── root.ts            # tRPCルート (sessions追加)
│   │   └── trpc.ts            # tRPC設定 (既存)
│   ├── auth/
│   │   ├── index.ts           # NextAuth.js auth() (既存)
│   │   └── config.ts          # 認証設定 (Google/GitHub追加)
│   └── db/
│       ├── schema.ts           # Drizzleスキーマ (sessions追加)
│       └── index.ts            # DB接続 (既存)
│
├── features/                   # フロントエンド機能
│   ├── tasks/                  # 既存タスク機能
│   └── poker-sessions/         # 新規: ポーカーセッション機能
│       ├── components/         # Presentationコンポーネント
│       │   ├── SessionCard.tsx
│       │   ├── SessionForm.tsx
│       │   ├── SessionList.tsx
│       │   ├── SessionStats.tsx
│       │   ├── SessionFilters.tsx
│       │   └── DeleteConfirmModal.tsx
│       ├── containers/         # Containerコンポーネント
│       │   ├── SessionCardContainer.tsx
│       │   ├── SessionFormContainer.tsx
│       │   ├── SessionListContainer.tsx
│       │   ├── SessionStatsContainer.tsx
│       │   └── SessionFiltersContainer.tsx
│       └── hooks/
│           └── useSessions.ts  # tRPC hooks wrapper
│
├── lib/
│   └── utils/
│       └── currency.ts         # 新規: 通貨フォーマット (日本円)
│
├── trpc/                       # tRPCクライアント設定 (既存)
│   ├── query-client.ts
│   └── server.ts
│
└── env.js                      # 環境変数 (Google/GitHub OAuth追加)

tests/
├── contract/                   # 契約テスト (tRPC procedures)
│   └── sessions.test.ts        # sessionsルーター契約テスト
├── integration/                # 統合テスト (React Testing Library)
│   ├── create-session.test.tsx
│   ├── view-sessions.test.tsx
│   ├── edit-session.test.tsx
│   └── filter-sessions.test.tsx
└── e2e/                        # E2Eテスト (Playwright)
    ├── poker-sessions.spec.ts  # メインフロー (作成/表示/編集/削除)
    └── poker-sessions-filters.spec.ts  # フィルタリング機能
```

**Structure Decision**: Next.js統合型フルスタックアプリケーション (Option 2: Web application相当)。既存のプロジェクト構造 (`src/app/`, `src/server/`, `src/features/`) を踏襲し、新規機能として `poker-sessions` を追加。認証機能は既存のNextAuth.js v5設定を拡張 (Discord → Google/GitHub追加)。

## Complexity Tracking

*該当なし: 憲法違反なし*

## Phase 0: Research

### Research Areas

1. **NextAuth.js v5 OAuth2プロバイダー追加方法**
   - 既存のDiscord providerに加えてGoogle/GitHub providerを追加する手順
   - 環境変数設定 (client ID, client secret)
   - `src/env.js`へのスキーマ追加

2. **Drizzle ORM セッションテーブル設計**
   - PostgreSQLデータ型選択 (numeric for currency, timestamp for dates)
   - ユーザー外部キー設定とカスケード削除
   - インデックス戦略 (date, location, date+location composite)

3. **tRPC user-scoped queries実装パターン**
   - `protectedProcedure`を使用したユーザー認証チェック
   - `ctx.session.user.id`によるデータフィルタリング
   - Zodバリデーションスキーマ共有 (フロントエンド/バックエンド)

4. **Mantine v8 フォームベストプラクティス**
   - `TextInput`, `NumberInput`, `DateTimePicker`, `Textarea`の使用方法
   - バリデーションとエラーメッセージ表示
   - レスポンシブレイアウト (Grid, Stack)

5. **TanStack Query キャッシュ無効化戦略**
   - mutation成功時の`invalidate`パターン
   - 楽観的更新 (optimistic updates) の実装
   - 関連クエリの連鎖無効化 (`getAll`, `getStats`同時無効化)

6. **Playwright多言語UIテスト**
   - 日本語UIテキストのセレクタ記述
   - 認証フローのE2Eテスト (OAuth2モック)
   - データベースリセットとテストデータ準備

### Research Output Location

`specs/002-poker-session-tracker/research.md`

## Phase 1: Design & Contracts

### Data Model

**Output**: `specs/002-poker-session-tracker/data-model.md`

**Entities**:
1. **User** (既存)
   - `id`: UUID (主キー)
   - `email`: TEXT
   - `name`: TEXT
   - `image`: TEXT
   - `emailVerified`: TIMESTAMP
   - Relationships: 1 User → Many Sessions

2. **Session** (新規)
   - `id`: SERIAL (主キー)
   - `userId`: UUID (外部キー → users.id, CASCADE DELETE)
   - `date`: TIMESTAMP NOT NULL
   - `location`: TEXT NOT NULL
   - `buyIn`: NUMERIC(10,2) NOT NULL (100万円まで対応、小数点以下2桁)
   - `cashOut`: NUMERIC(10,2) NOT NULL
   - `durationMinutes`: INTEGER NOT NULL
   - `notes`: TEXT (NULLABLE)
   - `createdAt`: TIMESTAMP NOT NULL DEFAULT NOW()
   - `updatedAt`: TIMESTAMP NOT NULL DEFAULT NOW()
   - Computed: `profit = cashOut - buyIn` (アプリケーション層で計算)
   - Indexes: `(userId, date DESC)`, `(userId, location)`, `(userId, date, location)`

### API Contracts

**Output**: `specs/002-poker-session-tracker/contracts/sessions-api.md`

**tRPC Router**: `sessions`

**Procedures**:
1. `create` (mutation)
   - Input: `{ date, location, buyIn, cashOut, durationMinutes, notes? }`
   - Output: `{ id, userId, date, location, buyIn, cashOut, durationMinutes, notes, profit, createdAt, updatedAt }`
   - Auth: Required (protectedProcedure)

2. `getAll` (query)
   - Input: None
   - Output: `Session[]` (user-scoped)
   - Auth: Required

3. `getFiltered` (query)
   - Input: `{ location?, startDate?, endDate? }`
   - Output: `Session[]` (user-scoped + filters)
   - Auth: Required

4. `getStats` (query)
   - Input: None
   - Output: `{ totalProfit, sessionCount, avgProfit, byLocation: { location, profit, count }[] }`
   - Auth: Required

5. `getById` (query)
   - Input: `{ id }`
   - Output: `Session | null` (user-scoped)
   - Auth: Required

6. `update` (mutation)
   - Input: `{ id, date?, location?, buyIn?, cashOut?, durationMinutes?, notes? }`
   - Output: `Session` (updated)
   - Auth: Required (owner check)

7. `delete` (mutation)
   - Input: `{ id }`
   - Output: `{ success: boolean }`
   - Auth: Required (owner check)

### User Guide

**Output**: `specs/002-poker-session-tracker/quickstart.md`

**Content** (日本語):
- アプリケーション概要
- Google/GitHubでのログイン手順
- セッション記録方法 (スクリーンショット付き)
- 履歴と統計の見方
- メモ追加とフィルタリングの使い方
- トラブルシューティング

### Agent Context Update

**Action**: Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`

**Expected Updates**:
- `CLAUDE.md`に新規技術情報を追加:
  - Poker sessions data model (sessions table)
  - tRPC sessions router API
  - Currency formatting utilities
  - OAuth2 providers (Google, GitHub)

## Implementation Priority

1. **P0 - Authentication** (User Story 0)
   - Google/GitHub OAuth providers追加
   - 環境変数設定
   - 認証フローE2Eテスト

2. **P1 - Session Recording MVP** (User Story 1)
   - Sessionsテーブル作成
   - tRPC `create`, `getAll`, `getById` procedures
   - セッションフォームUI
   - 契約テスト + 統合テスト

3. **P2 - History & Statistics** (User Story 2)
   - tRPC `getStats` procedure
   - 統計表示コンポーネント
   - 場所別パフォーマンス集計

4. **P3 - Notes** (User Story 3)
   - Notesフィールド追加 (既にスキーマに含む)
   - UI更新 (Textarea追加)

5. **P4 - Filtering** (User Story 4)
   - tRPC `getFiltered` procedure
   - フィルタUIコンポーネント
   - インデックス最適化

## Next Steps

1. **Phase 0 Complete**: Generate `research.md` with technical decisions
2. **Phase 1 Complete**: Generate `data-model.md`, `contracts/sessions-api.md`, `quickstart.md`
3. **Phase 1 Complete**: Run agent context update script
4. **Phase 2 (Separate Command)**: Run `/speckit.tasks` to generate `tasks.md` with implementation checklist

**Ready for**: Research phase execution
