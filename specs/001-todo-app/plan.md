# Implementation Plan: レスポンシブTodoアプリ

**Branch**: `001-todo-app` | **Date**: 2025-10-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-todo-app/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

レスポンシブデザインを備えたシンプルなTodoアプリを構築する。ユーザーはタスクの作成、完了管理、削除を行い、モバイル・タブレット・デスクトップのすべてのデバイスで快適に使用できる。データはPostgreSQLに永続化し、Next.js App Router + tRPC + Drizzle ORMを使用したモダンなフルスタック構成で実装する。

## Technical Context

**Language/Version**: TypeScript 5.x + Bun (最新版)
**Primary Dependencies**:
- Frontend: Next.js 15+ (App Router), Mantine v8+, tRPC client, NextAuth.js (Auth.js)
- Backend: tRPC server, Drizzle ORM, PostgreSQL client
- Testing: Vitest
- Linter/Formatter: Biome

**Storage**: PostgreSQL (本番用) / ローカル開発環境での選択肢を調査(Docker Compose or Supabase local)
**Testing**: Vitest (unit + integration tests)
**Target Platform**: Web (PWA対応), モダンブラウザ(Chrome, Firefox, Safari, Edge最新版)
**Project Type**: Web application (フルスタック - Next.js内にAPI Routesとしてバックエンドを配置)
**Performance Goals**:
- タスク追加: 3秒以内
- 100個のタスク表示: 1秒以内のレンダリング
- PWAとしてオフライン動作をサポート

**Constraints**:
- レスポンシブ対応必須(375px〜1920px)
- オフライン対応(PWA + Service Worker)
- 日本語UI必須
- アクセシビリティ(WCAG 2.1 AA以上)

**Scale/Scope**:
- 単一ユーザー向けMVP(将来的にマルチユーザー対応可能な設計)
- 1画面のシンプルなUI
- 約10-15のReactコンポーネント
- 3-5のtRPC APIエンドポイント

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 憲法遵守チェックリスト

- [x] **テスト駆動開発**: すべての機能にテストファーストアプローチを適用する計画があるか?
  - ✅ Vitestを使用した契約テスト、統合テスト、単位テストを実装
  - ✅ tasks.mdでテストを実装より先に記述する構造を採用

- [x] **仕様の明確化**: 不明確な要件はすべて特定され、明確化プロセスが計画されているか?
  - ✅ spec.mdですべての機能要件が明確に定義されている
  - ✅ [NEEDS CLARIFICATION]マーカーは0個

- [x] **日本語ファースト**: ドキュメント、UI、コミュニケーションが日本語で計画されているか?
  - ✅ すべてのUIテキストとエラーメッセージは日本語(FR-014)
  - ✅ ドキュメントは日本語で作成

- [x] **レイヤー分離**: バックエンド(API層)とフロントエンド(Container層/Presentation層)の責務が明確に分離されているか?
  - ✅ API層: tRPC server + Drizzle ORM (ビジネスロジック、データアクセス)
  - ✅ Container層: tRPC client呼び出し、状態管理(React hooks)
  - ✅ Presentation層: Mantineコンポーネント(UI、ユーザーインタラクション)

- [x] **コードレビュープロセス**: こまめなレビューとコミット承認プロセスが計画されているか?
  - ✅ 各タスク完了後にコードレビューを依頼
  - ✅ 承認後にコミット実行
  - ✅ GitHub ActionsでCIを実行(Biome lint, Vitestテスト)

- [x] **UX一貫性**: 一貫したユーザー体験を提供する設計方針があるか?
  - ✅ Mantine v8のデザインシステムを全体で使用
  - ✅ レスポンシブデザインで全デバイス対応
  - ✅ アクセシビリティ基準(WCAG 2.1 AA)を遵守

- [x] **ドキュメンテーション**: ユーザーガイド、クイックスタート、ヘルプの作成が計画されているか?
  - ✅ quickstart.mdで開発環境セットアップ手順を提供
  - ✅ UIにツールチップやヘルプテキストを組み込む
  - ✅ README.mdでユーザーガイドを提供

**遵守状況**: ✅ すべて遵守

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
# Next.js App Router構成 (フルスタック - monorepo不使用)
src/
├── app/                         # Next.js App Router
│   ├── layout.tsx              # ルートレイアウト
│   ├── page.tsx                # トップページ (Todoアプリ)
│   ├── api/
│   │   └── trpc/
│   │       └── [trpc]/
│   │           └── route.ts    # tRPC API handler
│   └── manifest.ts             # PWA manifest
│
├── server/                      # バックエンド(API層)
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema定義
│   │   ├── client.ts           # PostgreSQL client
│   │   └── migrations/         # DBマイグレーション
│   ├── trpc/
│   │   ├── init.ts             # tRPC初期化
│   │   ├── router.ts           # tRPCルーター
│   │   └── procedures/
│   │       └── tasks.ts        # タスク関連プロシージャ
│   └── auth/
│       └── config.ts           # NextAuth設定 (将来対応)
│
├── features/                    # フロントエンド(Container層 + Presentation層)
│   └── tasks/
│       ├── containers/         # Container層
│       │   └── TaskListContainer.tsx
│       ├── components/         # Presentation層
│       │   ├── TaskInput.tsx
│       │   ├── TaskItem.tsx
│       │   └── TaskList.tsx
│       └── hooks/
│           └── useTasks.ts     # tRPC hooks
│
├── lib/                         # 共通ユーティリティ
│   ├── trpc/
│   │   └── client.ts           # tRPC client
│   └── utils/
│       └── validators.ts       # バリデーション
│
└── styles/
    └── globals.css             # グローバルCSS

tests/
├── contract/                    # 契約テスト (tRPC procedures)
│   └── tasks.contract.test.ts
├── integration/                 # 統合テスト (E2E user flows)
│   └── tasks.integration.test.ts
└── unit/                        # 単体テスト (components, utils)
    └── components/
        └── TaskInput.test.tsx

public/
├── icons/                       # PWA icons
└── sw.js                        # Service Worker (PWA)

.github/
└── workflows/
    └── ci.yml                   # GitHub Actions CI

drizzle.config.ts               # Drizzle設定
vitest.config.ts                # Vitest設定
biome.json                      # Biome設定
```

**Structure Decision**:

Next.js App Routerのフルスタック構成を採用。バックエンドとフロントエンドを単一リポジトリに配置し、tRPCで型安全な通信を実現。

**レイヤー分離の実現**:
- **API層** (`src/server/`): tRPC procedures + Drizzle ORM + PostgreSQL
- **Container層** (`src/features/*/containers/`): tRPC hooks、状態管理、ビジネスロジック調整
- **Presentation層** (`src/features/*/components/`): Mantineコンポーネント、UI、イベントハンドリング

この構成により、憲法原則IV「レイヤーの責務分離」を遵守しつつ、型安全性とモノリポ不要のシンプルさを両立。

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

