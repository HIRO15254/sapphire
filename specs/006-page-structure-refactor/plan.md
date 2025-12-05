# Implementation Plan: ページ構造リファクタリング

**Branch**: `006-page-structure-refactor` | **Date**: 2025-12-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-page-structure-refactor/spec.md`

## Summary

ポーカーセッショントラッカーのページ構造をリファクタリングし、UXを改善する。具体的には：
- Mantine AppShellを使用したサイドバーナビゲーションの追加（デスクトップでは常に展開表示）
- トップページ（/）のダッシュボード化（統計情報とクイックアクション）
- モーダルを廃止し、専用ページ（新規作成、詳細表示、編集）に統一
- 壊れたリダイレクトの修正

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19 + Next.js 15 (App Router)
**Primary Dependencies**: Mantine v8 (AppShell), TanStack Query v5, tRPC v11, NextAuth.js v5
**Storage**: PostgreSQL 16 (Drizzle ORM)
**Testing**: Vitest v2 (契約テスト), Playwright v1 (E2Eテスト)
**Target Platform**: Web (デスクトップ・タブレット・モバイル)
**Project Type**: Web (フロントエンド+バックエンド統合型Next.jsアプリ)
**Performance Goals**: ダッシュボード初期表示 < 2秒、ページ間遷移 < 500ms
**Constraints**: 375px以上の画面幅で全ページが正常に動作
**Scale/Scope**: 既存アプリケーションのリファクタリング（約10画面）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 憲法遵守チェックリスト

- [x] **テスト駆動開発**: すべての機能にテストファーストアプローチを適用する計画があるか?
  - E2Eテストで主要なナビゲーションフローを検証
  - コンポーネントテストでサイドバー、ダッシュボードを検証
- [x] **仕様の明確化**: 不明確な要件はすべて特定され、明確化プロセスが計画されているか?
  - spec.mdのClarificationsセクションで3つの質問を解決済み
- [x] **日本語ファースト**: ドキュメント、UI、コミュニケーションが日本語で計画されているか?
  - すべてのUIテキスト、ナビゲーションリンクは日本語
- [x] **レイヤー分離**: バックエンド(API層)とフロントエンド(Container層/Presentation層)の責務が明確に分離されているか?
  - AppLayout: Container層（認証状態管理、ナビゲーション状態）
  - Navbar, Dashboard: Presentation層（UIのみ）
- [x] **コードレビュープロセス**: こまめなレビューとコミット承認プロセスが計画されているか?
  - 機能単位（サイドバー→ダッシュボード→専用ページ）でレビュー
- [x] **UX一貫性**: 一貫したユーザー体験を提供する設計方針があるか?
  - Mantine AppShellによる統一されたレイアウト
  - 専用ページに統一し、モーダルとの混在を解消
- [x] **ドキュメンテーション**: ユーザーガイド、クイックスタート、ヘルプの作成が計画されているか?
  - quickstart.mdを作成予定

**遵守状況**: すべて遵守

## Project Structure

### Documentation (this feature)

```text
specs/006-page-structure-refactor/
├── spec.md              # 機能仕様
├── plan.md              # このファイル
├── research.md          # Phase 0: リサーチ結果
├── data-model.md        # Phase 1: データモデル（変更なし）
├── quickstart.md        # Phase 1: ユーザーガイド
├── contracts/           # Phase 1: API契約（変更なし）
├── checklists/          # 品質チェックリスト
│   └── requirements.md
└── tasks.md             # Phase 2: タスクリスト（/speckit.tasks）
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 変更: AppLayoutContainerをラップ
│   ├── page.tsx                  # 変更: ダッシュボード化
│   ├── auth/                     # 変更なし（サイドバーなし）
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   └── poker-sessions/
│       ├── page.tsx              # 変更: モーダル削除
│       ├── new/page.tsx          # 変更: 専用ページ有効化
│       └── [id]/
│           ├── page.tsx          # 新規: 詳細表示ページ
│           └── edit/page.tsx     # 変更: リダイレクト修正
│
├── features/
│   ├── layout/                   # 新規: レイアウト機能
│   │   ├── components/
│   │   │   ├── AppLayout.tsx     # 新規: AppShellラッパー
│   │   │   └── Navbar.tsx        # 新規: ナビゲーションUI
│   │   └── containers/
│   │       └── AppLayoutContainer.tsx  # 新規: 認証・状態管理
│   │
│   ├── dashboard/                # 新規: ダッシュボード機能
│   │   ├── components/
│   │   │   ├── DashboardStats.tsx      # 新規: 統計表示
│   │   │   ├── RecentSessions.tsx      # 新規: 最近のセッション
│   │   │   └── QuickActions.tsx        # 新規: クイックアクション
│   │   └── containers/
│   │       └── DashboardContainer.tsx  # 新規: データ取得
│   │
│   └── poker-sessions/
│       ├── components/
│       │   ├── SessionDetail.tsx       # 新規: 詳細表示
│       │   └── ... (既存コンポーネント)
│       └── containers/
│           ├── SessionDetailContainer.tsx  # 新規: 詳細ページ用
│           └── ... (既存コンテナ)
│
└── server/
    └── api/routers/
        └── sessions.ts           # 変更なし（既存APIを使用）

tests/
├── e2e/
│   └── navigation.spec.ts        # 新規: ナビゲーションE2Eテスト
└── components/
    ├── AppLayout.test.tsx        # 新規: レイアウトテスト
    ├── Navbar.test.tsx           # 新規: ナビバーテスト
    └── DashboardStats.test.tsx   # 新規: ダッシュボードテスト
```

**Structure Decision**: Next.js App Router構造を維持し、`features/layout/`と`features/dashboard/`を新規追加。既存の`features/poker-sessions/`にSessionDetailコンポーネントを追加。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |

すべての憲法原則に遵守しているため、複雑性トラッキングは不要。
