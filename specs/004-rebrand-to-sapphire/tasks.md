# Tasks: Sapphireプロジェクト リブランディング

**Input**: Design documents from `/specs/004-rebrand-to-sapphire/`
**Prerequisites**: ✅ plan.md, ✅ spec.md, ✅ research.md, ✅ quickstart.md

**Tests**: このリブランディングタスクは**TDD例外適用**（コード実装なし）のため、自動テストは作成しない。各フェーズ完了後に**手動検証**を実施する。

**Organization**: タスクはユーザーストーリー（P1、P2、P3）ごとにグループ化され、各ストーリーを独立して実装・検証できるようになっている。

## Format: `[ID] [P?] [Story] Description`
- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: ユーザーストーリーID（US1, US2, US3）
- ファイルパスは絶対パスで記載

## Path Conventions
- **Repository root**: すべてのファイルはリポジトリルートからの相対パス
- 主な更新対象: `package.json`, `LICENSE`, `README.md`, `src/app/`, `public/`, `.specify/memory/`

---

## Phase 1: 事前準備（アイコン確認）

**Purpose**: リブランディング実施前の準備確認

### アイコンファイルの準備

リブランディングを開始する前に、**Sapphireブランドアイコンファイル（6個）を準備**してください：

1. **favicon.ico** (16x16, 32x32, 48x48マルチサイズ)
2. **apple-touch-icon.png** (180x180)
3. **icon-192x192.png**
4. **icon-512x512.png**
5. **icon-192x192-maskable.png**
6. **icon-512x512-maskable.png**

これらのファイルを `public/` ディレクトリに配置する準備を整えてから、以下のタスクに進んでください。

**Note**: アイコンが未準備の場合、Phase 3の途中でアイコン置き換えタスク（T005〜T010）をスキップし、後で実施することもできます。

---

## Phase 2: User Story 1 - プロジェクトアイデンティティの確立 (Priority: P1) 🎯 MVP

**Goal**: ユーザーと開発者が一目で「Sapphire」プロジェクト（ポーカーセッショントラッカー）であることを認識できるようにする。ブラウザタブ、PWAマニフェスト、アイコンをSapphireブランドに統一。

**Independent Test**:
1. ブラウザで `http://localhost:3000` を開き、タブタイトルが「Sapphire」または「Sapphire - ポーカーセッショントラッカー」であることを確認
2. `src/app/manifest.ts` を開き、`name`、`short_name`、`description`がSapphireに関連した内容であることを確認
3. PWAとしてインストールし、アイコンがSapphireブランドであることを確認

### Implementation for User Story 1

- [X] T001 [P] [US1] `src/app/layout.tsx` のmetadata.titleを「Sapphire」または「Sapphire - ポーカーセッショントラッカー」に更新
- [X] T002 [P] [US1] `src/app/layout.tsx` のmetadata.descriptionを「ポーカーセッションを記録・分析して、パフォーマンスを向上させる」に更新
- [X] T003 [P] [US1] `src/app/layout.tsx` のappleWebApp.titleを「Sapphire」に更新
- [X] T004 [P] [US1] `src/app/manifest.ts` のnameを「Sapphire」または「Sapphire - ポーカーセッショントラッカー」に変更
- [X] T005 [P] [US1] `src/app/manifest.ts` のshort_nameを「Sapphire」に変更
- [X] T006 [P] [US1] `src/app/manifest.ts` のdescriptionを「ポーカーセッションを記録・分析するアプリケーション」に更新
- [X] T007 [P] [US1] `public/favicon.ico` をSapphireブランドアイコンに置き換え
- [X] T008 [P] [US1] `public/apple-touch-icon.png` をSapphireブランドアイコンに置き換え
- [X] T009 [P] [US1] `public/icon-192x192.png` をSapphireブランドアイコンに置き換え
- [X] T010 [P] [US1] `public/icon-512x512.png` をSapphireブランドアイコンに置き換え
- [X] T011 [P] [US1] `public/icon-192x192-maskable.png` をSapphireブランドアイコンに置き換え
- [X] T012 [P] [US1] `public/icon-512x512-maskable.png` をSapphireブランドアイコンに置き換え

### Verification for User Story 1 (手動検証)

- [X] T013 [US1] 開発サーバー起動（`bun run dev`）してブラウザで `http://localhost:3000` を開く
- [X] T014 [US1] ブラウザタブのタイトルが「Sapphire」または「Sapphire - ポーカーセッショントラッカー」であることを確認
- [X] T015 [US1] ブラウザタブのアイコン（favicon）がSapphireブランドであることを確認
- [X] T016 [US1] PWAとしてインストールし、ホーム画面のアイコンがSapphireブランドであることを確認
- [X] T017 [US1] `src/app/manifest.ts` を開き、name、short_name、descriptionが正しく更新されていることを目視確認

**Checkpoint**: ✅ User Story 1完了 - ブラウザとPWAでSapphireとして認識される

**レビューポイント**: この時点でコミットを作成し、レビューを受けることを推奨（憲法原則 V）

---

## Phase 3: User Story 2 - プロジェクト説明の刷新 (Priority: P2)

**Goal**: README.mdを刷新し、Sapphire（ポーカーセッショントラッカー）の技術スタック、セットアップ手順、実装状況を明確に記載する。新規開発者が10分以内にプロジェクトを理解できるようにする。

**Independent Test**:
1. README.mdを開き、プロジェクト概要でSapphireがポーカーセッショントラッカーであることが明記されているか確認
2. 技術スタックセクションで、Next.js 15、tRPC、Drizzle ORM、Mantine v8、PostgreSQLが記載されているか確認
3. セットアップ手順に従って、新規環境でプロジェクトをセットアップできるか確認（Google/GitHub APIキー取得手順を含む）

### Implementation for User Story 2

- [X] T018 [US2] `README.md` の全文を削除し、新しい構成で書き直す（以下のセクションを含める）
- [X] T019 [US2] `README.md` にプロジェクト概要セクションを追加（Sapphire - ポーカーセッショントラッカーの説明）
- [X] T020 [US2] `README.md` に技術スタックセクションを追加（Next.js 15、tRPC、Drizzle ORM、Mantine v8、PostgreSQL、Bun、TypeScript 5.9）
- [X] T021 [US2] `README.md` に主な機能セクションを追加（ポーカーセッショントラッカー実装予定を明記）
- [X] T022 [US2] `README.md` にクイックスタートセクションを追加（前提条件、認証情報準備、セットアップ手順）
- [X] T023 [US2] `README.md` の認証情報準備セクションで、Google OAuth 2.0 クライアントIDの取得手順を記載
- [X] T024 [US2] `README.md` の認証情報準備セクションで、GitHub OAuth Appの取得手順を記載
- [X] T025 [US2] `README.md` に開発コマンドセクションを追加（dev、build、test等）、**E2Eテストコマンドは除外**
- [X] T026 [US2] `README.md` にプロジェクト構造セクションを追加（既存のNext.js App Router構造を説明）
- [X] T027 [US2] `README.md` に実装状況セクションを追加（ポーカーセッショントラッカーが計画中であることを明記）
- [X] T028 [US2] `README.md` にトラブルシューティングセクションを追加（PostgreSQL接続、ポート競合、OAuth認証エラー等）
- [X] T029 [US2] `README.md` でテンプレート（Mantine Vibe Template）やTodoアプリへの参照が一切残っていないことを確認

### Verification for User Story 2 (手動検証)

- [X] T030 [US2] README.mdを開き、プロジェクト概要を読んで10分以内にSapphireがポーカーセッショントラッカーであることを理解できるか確認
- [X] T031 [US2] README.mdの技術スタックセクションで、Next.js 15、tRPC、Drizzle ORM、Mantine v8、PostgreSQLが記載されているか確認
- [X] T032 [US2] README.mdのセットアップ手順に従って、新規環境でプロジェクトをセットアップできるか確認（実際に手順を実行）
- [X] T033 [US2] README.md全体を検索し、"Mantine Vibe Template"、"mantttine_vibe"、"Todoアプリ"、"Todo"の参照が0件であることを確認（`specs/001-todo-app/`フォルダ除く）
- [X] T034 [US2] README.mdのE2Eテストコマンド（`bun run test:e2e`）が記載されていないことを確認

**Checkpoint**: ✅ User Story 2完了 - README.mdが最新の状態を反映し、新規開発者がプロジェクトを理解できる

**レビューポイント**: この時点でコミットを作成し、レビューを受けることを推奨（憲法原則 V）

---

## Phase 4: User Story 3 - メタデータとライセンスの統一 (Priority: P3)

**Goal**: package.json、LICENSE、constitution.mdのメタデータをSapphireプロジェクトとして統一し、一貫性を確保する。法的・技術的メタデータの整合性を実現。

**Independent Test**:
1. package.jsonを開き、name、description、keywords、author、repository URLがSapphireに関連した内容であることを確認
2. LICENSEを開き、著作権表示が「Sapphire Contributors」であることを確認
3. constitution.mdを開き、タイトルが「Sapphireプロジェクト憲法」であることを確認

### Implementation for User Story 3

- [X] T035 [P] [US3] `package.json` のnameフィールドを「sapphire」に変更
- [X] T036 [P] [US3] `package.json` のdescriptionを「Sapphire - ポーカーセッションを記録・分析するアプリケーション」に更新
- [X] T037 [P] [US3] `package.json` のkeywordsを ["poker", "session-tracker", "sapphire", "nextjs", "trpc", "drizzle-orm", "mantine", "typescript"] に更新
- [X] T038 [P] [US3] `package.json` のauthorフィールドを「Sapphire Contributors」に変更
- [X] T039 [P] [US3] `package.json` のrepository.urlを実際のGitHubリポジトリURL（確定後）に更新（未確定の場合はplaceholder）
- [X] T040 [P] [US3] `package.json` のbugs.urlを実際のGitHub Issues URL（確定後）に更新（未確定の場合はplaceholder）
- [X] T041 [P] [US3] `package.json` のhomepageを実際のGitHubリポジトリURL（確定後）に更新（未確定の場合はplaceholder）
- [X] T042 [P] [US3] `LICENSE` の著作権表示（line 3）を「Copyright (c) 2025 Sapphire Contributors」に変更
- [X] T043 [P] [US3] `.specify/memory/constitution.md` のタイトル（line 17）を「# Sapphireプロジェクト憲法」に変更

### Verification for User Story 3 (手動検証)

- [X] T044 [US3] `package.json` を開き、name、description、keywords、author、repositoryフィールドが正しく更新されていることを確認
- [X] T045 [US3] `LICENSE` を開き、著作権表示が「Copyright (c) 2025 Sapphire Contributors」であることを確認
- [X] T046 [US3] `.specify/memory/constitution.md` を開き、タイトルが「Sapphireプロジェクト憲法」であることを確認
- [X] T047 [US3] プロジェクト全体を検索し、package.json、LICENSE、constitution.md、README.md、manifest.ts、layout.tsxのメタデータがすべてSapphireプロジェクトとして統一されていることを確認

**Checkpoint**: ✅ User Story 3完了 - すべてのメタデータファイルがSapphireプロジェクトとして統一されている

**レビューポイント**: この時点でコミットを作成し、レビューを受けることを推奨（憲法原則 V）

---

## Phase 5: 最終検証とポリッシュ

**Purpose**: すべてのユーザーストーリーが完了し、成功基準（SC-001〜SC-006）を満たしていることを確認

### Final Verification

- [X] T048 全体検証: プロジェクト全体をGrepで検索し、"Mantine Vibe Template"、"mantttine_vibe"、"Todoアプリ"、"Todo"の参照が0件であることを最終確認（`specs/001-todo-app/`、`node_modules/`、`bun.lock`を除く）
- [X] T049 ブラウザ検証: 開発サーバーを起動し、ブラウザで表示・動作を確認（SC-001: 5秒以内にSapphireと認識できるか）
- [X] T050 PWA検証: PWAとしてインストールし、アイコンとアプリ名がSapphireブランドで統一されていることを確認（SC-004）
- [X] T051 README検証: README.mdを読んで、10分以内にプロジェクトの目的、技術スタック、セットアップ方法を理解できるか確認（SC-002）
- [X] T052 セットアップ検証: README.mdのセットアップ手順に従って、新規環境でプロジェクトをセットアップできるか確認（SC-005: 30分以内）
- [X] T053 メタデータ検証: package.json、LICENSE、constitution.md、README.md、manifest.ts、layout.tsxを開き、すべてがSapphireプロジェクトとして統一されていることを最終確認（SC-006）

### Polish (Optional)

- [X] T054 [P] プロジェクトルートの不要なファイル・ディレクトリを削除（ある場合）
- [X] T055 [P] `.gitignore` にリブランディングで生成された一時ファイルがある場合、追加

---

## Dependencies & Execution Order

### User Story Dependencies

このリブランディングタスクでは、**ユーザーストーリー間の依存関係はない**。各ストーリーは独立して実装可能：

```
Phase 1 (事前準備: アイコン確認)
     ↓
Phase 2 (US1: プロジェクトアイデンティティの確立) ← MVP
     ↓ (推奨順序)
Phase 3 (US2: プロジェクト説明の刷新)
     ↓ (推奨順序)
Phase 4 (US3: メタデータとライセンスの統一)
     ↓
Phase 5 (最終検証とポリッシュ)
```

**推奨実装順序**: P1 → P2 → P3（優先度順）
**並列実装可能**: US1、US2、US3は異なるファイルを扱うため、理論上は並列実装可能だが、レビューの観点から順次実装を推奨

### Within-Phase Parallelization

各フェーズ内のタスクは、ほぼすべてが **[P]マーカー付き** で並列実行可能：

**Phase 2 (US1)**: T001-T012 はすべて並列実行可能（異なるファイルまたは同一ファイルの異なるフィールド）
**Phase 3 (US2)**: T018-T029 は `README.md` への追記タスクで、順次実行が推奨
**Phase 4 (US3)**: T035-T043 はすべて並列実行可能（異なるファイル）

---

## Parallel Execution Examples

### Example 1: Phase 2 (US1) - アイデンティティ確立を並列実行

```bash
# セッション1: アプリケーションメタデータ更新
vim src/app/layout.tsx    # T001, T002, T003
vim src/app/manifest.ts   # T004, T005, T006

# セッション2: PWAアイコン置き換え（同時実行可能）
cp ~/sapphire-icons/favicon.ico public/               # T007
cp ~/sapphire-icons/apple-touch-icon.png public/      # T008
cp ~/sapphire-icons/icon-192x192.png public/          # T009
cp ~/sapphire-icons/icon-512x512.png public/          # T010
cp ~/sapphire-icons/icon-192x192-maskable.png public/ # T011
cp ~/sapphire-icons/icon-512x512-maskable.png public/ # T012
```

### Example 2: Phase 4 (US3) - メタデータ統一を並列実行

```bash
# セッション1: package.json更新
vim package.json  # T035-T041

# セッション2: LICENSE更新（同時実行可能）
vim LICENSE  # T042

# セッション3: constitution.md更新（同時実行可能）
vim .specify/memory/constitution.md  # T043
```

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**MVP = User Story 1 (P1)のみ**

最小限の価値提供：
- ブラウザタブとPWAでSapphireとして認識される
- ユーザーの第一印象が改善される
- SC-001とSC-004を満たす

MVP完了後、即座に価値を提供でき、残りのストーリー（P2、P3）は漸進的に追加可能。

### Incremental Delivery

1. **Sprint 1**: US1（アイデンティティ確立）→ 即座にブラウザでSapphireと認識
2. **Sprint 2**: US2（ドキュメント刷新）→ 新規開発者のオンボーディング改善
3. **Sprint 3**: US3（メタデータ統一）→ 法的・技術的整合性の完成

各スプリント完了後、独立して価値を提供し、レビューとコミットを実施。

---

## Task Summary

- **Total Tasks**: 55 tasks
- **US1 (P1)**: 17 tasks (Implementation: 12, Verification: 5)
- **US2 (P2)**: 17 tasks (Implementation: 12, Verification: 5)
- **US3 (P3)**: 13 tasks (Implementation: 9, Verification: 4)
- **Phase 5 (Final)**: 8 tasks (Verification: 6, Polish: 2)
- **Parallel Tasks**: 約30個のタスクが [P] マーカー付きで並列実行可能

---

## Success Criteria Verification

各フェーズ完了後、以下の成功基準を確認：

- **SC-001**: ✅ Phase 2 (US1) 完了後、ブラウザで5秒以内にSapphireと認識できる
- **SC-002**: ✅ Phase 3 (US2) 完了後、README.mdを読んで10分以内にプロジェクトを理解できる
- **SC-003**: ✅ Phase 5 完了後、テンプレート/Todo参照が0件
- **SC-004**: ✅ Phase 2 (US1) 完了後、PWAアイコンがSapphireブランドで統一
- **SC-005**: ✅ Phase 3 (US2) 完了後、README.mdの手順で30分以内にセットアップ可能
- **SC-006**: ✅ Phase 4 (US3) 完了後、全メタデータファイルが統一

---

## Notes

- **TDD例外**: このタスクはメタデータとドキュメント更新のみのため、自動テストは作成しない（憲法原則 I例外適用）
- **手動検証**: 各フェーズ完了後、ブラウザでの表示確認、PWAインストールテスト、メタデータの目視確認を実施
- **Git履歴**: Git履歴は一切書き換えない（既存のコミット履歴を保持）
- **歴史的参照**: `specs/001-todo-app/` フォルダは削除せず、歴史的参照として保持
- **コミット頻度**: 各フェーズ（US1、US2、US3）完了後にコミットを作成し、レビューを受ける（憲法原則 V）
- **アイコン未準備**: アイコンファイルが未準備の場合、Phase 2のアイコン置き換えタスク（T007-T012）をスキップし、後で実施可能

---

**Ready to implement - Start with Phase 1 → Phase 2 (US1) for MVP delivery! 💎**
