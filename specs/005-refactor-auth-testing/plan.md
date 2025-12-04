# Implementation Plan: プロジェクト品質向上・リファクタリング

**Branch**: `005-refactor-auth-testing` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-refactor-auth-testing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

このフィーチャーは、既存のポーカーセッショントラッカーアプリケーションの品質向上を目的としたリファクタリングです。主な内容：

1. **メールアドレス/パスワード認証の追加** - NextAuth.js Credentials Providerを使用し、既存のOAuth認証と並行して動作。アカウントリンク方式で同一メールを単一ユーザーとして管理。
2. **E2Eテストの追加** - Playwrightを使用し、Credentials認証でテストユーザーをログインさせて主要機能を自動検証。
3. **ドキュメント更新** - README.mdを実装状況と同期させ、新機能のセットアップ手順を追加。
4. **UIリデザイン** - Mantineデザインシステムに準拠した一貫性のあるUIに更新。機能削減なし。
5. **コンポーネントテスト追加** - Vitest + React Testing Libraryで主要Presentationコンポーネントをテスト。

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19 + Next.js 15 (App Router)
**Runtime**: Bun v1.0以上
**Primary Dependencies**:
- NextAuth.js v5 (Credentials Provider追加)
- bcrypt (パスワードハッシュ化)
- Mantine v8 (UIライブラリ)
- tRPC v11 (型安全なAPI)
- Drizzle ORM v0.41 (データベースORM)
- Zod v3 (バリデーション)

**Storage**: PostgreSQL 16 (Docker Compose経由)
**Testing**:
- Vitest v2 (単体・契約・コンポーネントテスト)
- @testing-library/react (Reactテスト)
- Playwright v1 (E2Eテスト)

**Target Platform**: Web (デスクトップ・タブレット・モバイル対応)
**Project Type**: Web (フロントエンド+バックエンド統合型Next.jsアプリ)
**Performance Goals**:
- E2Eテストスイート: 5分以内完了
- コンポーネントテスト: 30秒以内完了
- ログイン: 10秒以内

**Constraints**:
- 既存機能を100%維持（機能削減なし）
- WCAG 2.1 AA準拠
- モバイル対応（幅375px以上）

**Scale/Scope**:
- 主要Presentationコンポーネント5種のテストカバレッジ80%以上
- E2Eテストで主要機能80%以上カバー

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 憲法遵守チェックリスト

- [x] **テスト駆動開発**: すべての機能にテストファーストアプローチを適用する計画があるか?
  - E2Eテスト、コンポーネントテストともにTDDで実装予定
  - 認証機能追加時もテストを先に作成

- [x] **仕様の明確化**: 不明確な要件はすべて特定され、明確化プロセスが計画されているか?
  - `/speckit.clarify`でOAuth/Credentials同一メール問題を解決済み（アカウントリンク方式）

- [x] **日本語ファースト**: ドキュメント、UI、コミュニケーションが日本語で計画されているか?
  - すべてのUIテキスト、エラーメッセージ、ドキュメントは日本語で作成

- [x] **レイヤー分離**: バックエンド(API層)とフロントエンド(Container層/Presentation層)の責務が明確に分離されているか?
  - 既存のPresentation/Container分離パターンを継続
  - 認証ロジックはNextAuth.js設定に集約

- [x] **コードレビュープロセス**: こまめなレビューとコミット承認プロセスが計画されているか?
  - P1→P2→P3→P4→P5の優先度順でこまめにコミット

- [x] **UX一貫性**: 一貫したユーザー体験を提供する設計方針があるか?
  - Mantineデザインシステムに準拠したUIリデザイン
  - ログイン前後で一貫したデザイン

- [x] **ドキュメンテーション**: ユーザーガイド、クイックスタート、ヘルプの作成が計画されているか?
  - README.md更新、quickstart.md作成、認証セットアップ手順追加

**遵守状況**: すべて遵守

## Project Structure

### Documentation (this feature)

```text
specs/005-refactor-auth-testing/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── auth-api.md      # 認証API契約
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/                        # Next.js App Router
│   ├── auth/                   # 認証ページ（新規追加）
│   │   ├── signin/page.tsx     # ログインページ
│   │   └── signup/page.tsx     # 新規登録ページ
│   ├── poker-sessions/         # ポーカーセッション管理ページ
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth.js APIルート
│   │   └── trpc/[trpc]/        # tRPC APIハンドラー
│   └── page.tsx                # ホームページ（リデザイン）
│
├── server/                     # バックエンド(API層)
│   ├── auth/
│   │   ├── config.ts           # NextAuth設定（Credentials追加）
│   │   └── index.ts
│   ├── api/routers/
│   └── db/
│       └── schema.ts           # usersテーブルにpassword追加
│
├── features/                   # フロントエンド機能
│   ├── auth/                   # 認証機能（新規追加）
│   │   ├── components/         # Presentationコンポーネント
│   │   │   ├── SignInForm.tsx
│   │   │   └── SignUpForm.tsx
│   │   └── containers/         # Containerコンポーネント
│   │       ├── SignInFormContainer.tsx
│   │       └── SignUpFormContainer.tsx
│   └── poker-sessions/         # ポーカーセッション機能（リデザイン）
│       ├── components/         # Presentationコンポーネント
│       └── containers/         # Containerコンポーネント
│
└── lib/
    └── utils/
        └── password.ts         # パスワードハッシュユーティリティ

tests/
├── contract/                   # API契約テスト
│   ├── sessions.test.ts
│   ├── locations.test.ts
│   └── tags.test.ts
├── components/                 # コンポーネントテスト（新規追加）
│   ├── SessionCard.test.tsx
│   ├── SessionForm.test.tsx
│   ├── SessionList.test.tsx
│   ├── SessionStats.test.tsx
│   ├── SessionFilters.test.tsx
│   ├── SignInForm.test.tsx
│   └── SignUpForm.test.tsx
└── e2e/                        # E2Eテスト（新規追加）
    ├── auth.spec.ts            # 認証テスト
    ├── sessions.spec.ts        # セッションCRUDテスト
    └── fixtures/
        └── test-user.ts        # テストユーザーフィクスチャ
```

**Structure Decision**: 既存のNext.js App Router構造を維持し、認証機能とE2Eテストを追加。Presentation/Container分離パターンを継続。

## Complexity Tracking

> 憲法違反なし。追加の複雑性正当化は不要。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (なし) | - | - |
