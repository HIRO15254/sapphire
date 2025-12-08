# Implementation Plan: 通貨・ゲーム登録機能

**Branch**: `007-store-currency-games` | **Date**: 2025-12-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-store-currency-games/spec.md`

## Summary

日本のアミューズメントポーカーで使用される通貨とゲームを登録・管理する機能を実装する。通貨はユーザーに直接紐付き、店舗から独立して管理される。ゲームは店舗に紐付き、通貨を参照する。セッション記録時にゲームを選択可能にし、ゲーム別・通貨別の統計機能を提供する。

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19 + Next.js 15 (App Router)
**Primary Dependencies**: tRPC v11, Drizzle ORM v0.41, Mantine v8, Zod v3
**Storage**: PostgreSQL 16 (Docker Compose)
**Testing**: Vitest v2 (契約テスト), Playwright v1 (E2Eテスト)
**Target Platform**: Web (フロントエンド+バックエンド統合型Next.jsアプリ)
**Project Type**: Web (既存プロジェクト拡張)
**Performance Goals**: 店舗選択後1秒以内にゲーム一覧表示, 1000セッション対応
**Constraints**: 100通貨、100店舗、各店舗50ゲームの規模でも性能劣化なし
**Scale/Scope**: 既存ユーザー向け機能追加

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 憲法遵守チェックリスト

- [x] **テスト駆動開発**: 契約テスト（API）とE2Eテストを先に作成する計画を策定
- [x] **仕様の明確化**: spec.md で 23 の機能要件と 9 のエッジケースを特定・明確化済み
- [x] **日本語ファースト**: UIテキスト、エラーメッセージ、ドキュメントすべて日本語で作成
- [x] **レイヤー分離**: Container/Presentation分離パターンを適用（currencies, games feature）
- [x] **コードレビュープロセス**: P1→P2→P3→P4の優先度順で段階的にコミット・レビュー
- [x] **UX一貫性**: 既存のlocations, tagsパターンに従ったUI設計
- [x] **ドキュメンテーション**: quickstart.md, data-model.md, contracts/ を作成済み

**遵守状況**: すべて遵守

## Project Structure

### Documentation (this feature)

```text
specs/007-store-currency-games/
├── plan.md              # This file
├── research.md          # 技術的判断の根拠
├── data-model.md        # データベーススキーマ設計
├── quickstart.md        # ユーザー向け操作ガイド
├── contracts/           # API契約定義
│   ├── currencies-api.md
│   ├── games-api.md
│   └── sessions-api-extension.md
├── checklists/
│   └── requirements.md  # 仕様品質チェックリスト
└── tasks.md             # 実装タスク（/speckit.tasks で生成）
```

### Source Code (repository root)

```text
src/
├── app/
│   └── settings/
│       └── currencies/
│           └── page.tsx           # 通貨管理ページ (新規)
├── server/
│   ├── api/
│   │   ├── routers/
│   │   │   ├── currencies.ts      # 通貨API (新規)
│   │   │   ├── games.ts           # ゲームAPI (新規)
│   │   │   └── sessions.ts        # セッションAPI (変更)
│   │   └── root.ts                # ルーター登録 (変更)
│   └── db/
│       └── schema.ts              # スキーマ (変更)
├── features/
│   ├── currencies/                # 通貨機能 (新規)
│   │   ├── components/
│   │   │   ├── CurrencyList.tsx
│   │   │   ├── CurrencyForm.tsx
│   │   │   └── CurrencyCard.tsx
│   │   ├── containers/
│   │   │   ├── CurrencyListContainer.tsx
│   │   │   └── CurrencyFormContainer.tsx
│   │   └── hooks/
│   │       └── useCurrencies.ts
│   ├── games/                     # ゲーム機能 (新規)
│   │   ├── components/
│   │   │   ├── GameList.tsx
│   │   │   ├── GameForm.tsx
│   │   │   └── GameCard.tsx
│   │   ├── containers/
│   │   │   ├── GameListContainer.tsx
│   │   │   └── GameFormContainer.tsx
│   │   └── hooks/
│   │       └── useGames.ts
│   └── poker-sessions/            # 既存 (変更)
│       ├── components/
│       │   └── SessionForm.tsx    # ゲーム選択追加
│       └── containers/
│           └── SessionFormContainer.tsx
└── lib/
    └── utils/
        └── game.ts                # 表示フォーマットヘルパー (新規)

tests/
├── contract/
│   ├── currencies.test.ts         # 通貨API契約テスト (新規)
│   ├── games.test.ts              # ゲームAPI契約テスト (新規)
│   └── sessions.test.ts           # セッションAPI契約テスト (変更)
└── e2e/
    ├── currencies.spec.ts         # 通貨E2Eテスト (新規)
    ├── games.spec.ts              # ゲームE2Eテスト (新規)
    └── sessions.spec.ts           # セッションE2Eテスト (変更)
```

**Structure Decision**: 既存のNext.js App Router + tRPC + featuresディレクトリ構造を継続。locations, tagsの実装パターンに従って currencies, games を追加。

## Implementation Phases

### Phase 0: Research (完了)

- [x] 既存スキーマパターンの調査
- [x] tRPCルーターパターンの確認
- [x] research.md 作成

### Phase 1: Design (完了)

- [x] data-model.md 作成
- [x] contracts/ 作成
  - [x] currencies-api.md
  - [x] games-api.md
  - [x] sessions-api-extension.md
- [x] quickstart.md 作成
- [x] plan.md 完成

### Phase 2: Tasks (次ステップ)

`/speckit.tasks` コマンドで tasks.md を生成

### Priority Order (実装順序)

1. **P1**: 通貨管理機能
   - currencies テーブル追加
   - currencies API 実装
   - 通貨管理画面 実装

2. **P2**: ゲーム管理機能
   - games テーブル追加
   - games API 実装
   - 店舗詳細画面にゲームタブ追加

3. **P3**: セッション記録拡張
   - pokerSessions テーブル変更
   - sessions API 拡張
   - セッションフォームにゲーム選択追加

4. **P4**: 統計機能拡張
   - getStats API 拡張
   - 統計画面にゲーム別・通貨別表示追加

## Complexity Tracking

> 憲法違反なし - このセクションは空

## Related Documentation

- **Spec**: [spec.md](spec.md)
- **Research**: [research.md](research.md)
- **Data Model**: [data-model.md](data-model.md)
- **Quickstart**: [quickstart.md](quickstart.md)
- **API Contracts**: [contracts/](contracts/)
- **Requirements Checklist**: [checklists/requirements.md](checklists/requirements.md)
