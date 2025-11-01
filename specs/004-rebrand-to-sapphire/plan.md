# Implementation Plan: Sapphireプロジェクト リブランディング

**Branch**: `004-rebrand-to-sapphire` | **Date**: 2025-10-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-rebrand-to-sapphire/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

テンプレート（Mantine Vibe Template）とTodoアプリの痕跡を完全に削除し、Sapphire（ポーカーセッショントラッカー）としてのブランドアイデンティティを確立する。主な変更対象は、メタデータファイル（package.json、LICENSE、constitution.md）、アプリケーションメタデータ（manifest.ts、layout.tsx）、ドキュメント（README.md）、およびPWAアイコンファイル群。

このタスクは**コード実装を伴わないメタデータとドキュメントの更新**であり、既存機能の動作には一切影響を与えない。技術的な複雑さは低いが、プロジェクトの第一印象とブランドアイデンティティを決定づける重要な作業である。

## Technical Context

**Language/Version**: TypeScript 5.9 + Next.js 15 (既存プロジェクトの技術スタックを使用)
**Primary Dependencies**: 依存関係の変更なし（既存のNext.js、tRPC、Drizzle ORMをそのまま使用）
**Storage**: N/A（データベーススキーマの変更なし）
**Testing**: 手動検証のみ（メタデータ更新の確認、ブラウザでの表示確認、PWAインストールテスト）
**Target Platform**: Web（ブラウザ + PWA）
**Project Type**: Web（既存のNext.js App Routerプロジェクト）
**Performance Goals**: N/A（パフォーマンスへの影響なし）
**Constraints**:
- 既存機能の動作を一切変更しないこと
- Git履歴を書き換えないこと（歴史的参照として保持）
- `specs/001-todo-app/`フォルダは歴史的参照として保持
**Scale/Scope**: 更新対象ファイル約10〜15個（メタデータ、ドキュメント、アイコン）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 憲法遵守チェックリスト

- [x] **テスト駆動開発**: **例外適用** - このタスクはメタデータとドキュメント更新のみであり、コード実装を伴わないため、TDDは適用されない。手動検証（ブラウザでの表示確認、PWAインストールテスト）で十分。
- [x] **仕様の明確化**: すべての要件は明確に定義されており、[NEEDS CLARIFICATION]マーカーなし。ユーザーとの対話を通じて、アイコン提供方法、プロジェクト目的、README内容が明確化済み。
- [x] **日本語ファースト**: README.mdは日本語で記述。すべてのドキュメント（plan.md、research.md、quickstart.md）も日本語で作成。
- [x] **レイヤー分離**: N/A - コード実装を伴わないため、アーキテクチャ層の分離は該当しない。
- [x] **コードレビュープロセス**: 各変更（メタデータ更新、ドキュメント更新、アイコン置き換え）ごとにレビューと承認を実施する計画。
- [x] **UX一貫性**: ブランディングの一貫性を確保（すべてのメタデータとアイコンをSapphireに統一）。ユーザー体験への影響は視覚的アイデンティティの改善のみ。
- [x] **ドキュメンテーション**: quickstart.mdを作成し、リブランディング後のセットアップ手順を記載。README.mdを刷新して、最新のプロジェクト情報を提供。

**遵守状況**: すべて遵守（TDDは例外適用：コード実装を伴わないタスクのため）

## Project Structure

### Documentation (this feature)

```
specs/004-rebrand-to-sapphire/
├── spec.md              # 機能仕様書
├── plan.md              # 実装計画（このファイル）
├── research.md          # リブランディング戦略とベストプラクティス
├── quickstart.md        # リブランディング後のクイックスタートガイド
└── checklists/
    └── requirements.md  # 仕様品質チェックリスト
```

**Note**: このタスクは**データモデルやAPI契約を伴わない**ため、`data-model.md`と`contracts/`は作成しない。

### 更新対象ファイル (repository root)

このリブランディングタスクでは、以下のファイルを更新する：

```
# メタデータファイル
├── package.json                    # name, description, keywords, author, repository更新
├── LICENSE                         # 著作権表示をSapphire Contributorsに変更
└── .specify/memory/constitution.md  # タイトルをSapphireプロジェクト憲法に変更

# ドキュメント
└── README.md                        # 全面刷新（技術スタック、セットアップ、実装状況）

# アプリケーションメタデータ
├── src/app/layout.tsx               # metadata.title, description, appleWebApp.title更新
└── src/app/manifest.ts              # PWA manifest (name, short_name, description更新)

# PWAアイコン
└── public/
    ├── favicon.ico                  # Sapphireブランドアイコンに置き換え
    ├── apple-touch-icon.png         # Sapphireブランドアイコンに置き換え
    ├── icon-192x192.png             # Sapphireブランドアイコンに置き換え
    ├── icon-512x512.png             # Sapphireブランドアイコンに置き換え
    ├── icon-192x192-maskable.png    # Sapphireブランドアイコンに置き換え
    └── icon-512x512-maskable.png    # Sapphireブランドアイコンに置き換え
```

**更新対象外（歴史的参照として保持）**:
- `specs/001-todo-app/` - Todoアプリの仕様ドキュメント（削除済み機能の記録）
- Git履歴とコミットメッセージ（変更不可能）

**Structure Decision**: このタスクは既存のNext.js App Routerプロジェクト構造をそのまま使用し、メタデータとドキュメントファイルのみを更新する。新しいディレクトリやモジュールの作成は不要。

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| TDD exemption | メタデータとドキュメント更新のみで、コード実装を伴わないため | 手動検証（ブラウザ確認、PWAインストールテスト）で十分であり、自動テストを書くオーバーヘッドが不要 |

**Note**: これは唯一の憲法例外であり、技術的な理由（コード実装なし）によるもの。他のすべての原則は遵守される。

---

## Phase 0: Research & Best Practices ✅ COMPLETE

**Status**: Complete
**Output**: [research.md](./research.md)

### 調査項目

このフェーズでは、リブランディング実施に必要なベストプラクティスと技術的判断を調査しました：

1. **R-001: プロジェクトリブランディングのベストプラクティス**
   - **Decision**: 優先度順（P1→P2→P3）に更新し、フェーズごとにレビューを実施
   - **Rationale**: ユーザーの第一印象（ブラウザタブ、アイコン）を最優先し、段階的な更新で問題の早期発見を実現

2. **R-002: PWAアイコンとマニフェスト更新の標準手法**
   - **Decision**: manifest.tsのメタデータを更新し、6個のアイコンファイルをSapphireブランドに置き換え
   - **Rationale**: PWA標準（192x192, 512x512）とmaskableアイコンでAndroid Adaptive Iconsに対応

3. **R-003: README.md刷新の構成とコンテンツ戦略**
   - **Decision**: プロジェクト概要、技術スタック、セットアップ手順、実装状況を含む7セクション構成
   - **Rationale**: ユーザーファースト（5秒以内の理解）と開発者フレンドリー（10分以内のオンボーディング）を両立

4. **R-004: package.json メタデータ更新の標準フィールド**
   - **Decision**: name, description, keywords, author, repository URLを更新
   - **Rationale**: npm標準準拠とSEO/発見性の向上、法的明確性（"Contributors"形式）

5. **R-005: Git履歴と歴史的参照の保持戦略**
   - **Decision**: Git履歴は一切変更せず、`specs/001-todo-app/`も歴史的参照として保持
   - **Rationale**: Git履歴の不変性と開発の透明性、仕様書の将来的な参考価値

6. **R-006: constitution.md 更新の影響範囲**
   - **Decision**: タイトル部分のみ「Sapphireプロジェクト憲法」に更新
   - **Rationale**: 憲法の原則はプロジェクト名に依存しない普遍的な開発原則のため

### 重要な技術的判断

- **検証手法**: 手動検証（ブラウザ表示、PWAインストール、メタデータレビュー）
- **Git戦略**: フェーズごとにコミット作成、日本語コミットメッセージ、履歴の書き換えなし
- **リスク対策**: PWAアイコンキャッシュ、データベース移行、リポジトリURL未確定への対応を明確化

**Phase 0完了**: すべての技術的判断が明確化され、実装に必要な情報が揃った。

---

## Phase 1: Design Artifacts ✅ COMPLETE

**Status**: Complete
**Output**: [quickstart.md](./quickstart.md)

### 生成されたアーティファクト

このフェーズでは、リブランディング後のプロジェクト使用を支援するドキュメントを作成しました：

#### quickstart.md

**セットアップガイド**の作成完了（主要な内容）:

1. **前提条件**
   - Bun、Docker Desktop、Gitのインストール要件
   - **重要**: Google/GitHub OAuth 2.0認証情報の取得手順を追加（ユーザーフィードバック反映）
     - Google Cloud ConsoleでのOAuthクライアントID取得
     - GitHub Developer SettingsでのOAuth App作成
   - NextAuth.js v5のOAuth認証に必須のAPIキー設定を明記

2. **セットアップ手順**
   - リポジトリクローン、依存関係インストール
   - 環境変数設定（`.env`に認証情報を含める）
   - PostgreSQL起動とスキーマ適用（`sapphire`と`sapphire_test`データベース）

3. **開発コマンド**
   - 開発・ビルドコマンド
   - **テストコマンド**: E2Eテスト（`bun run test:e2e`）を除外（ユーザーフィードバック反映：既に削除済み）
   - データベース管理コマンド
   - コード品質チェックコマンド

4. **プロジェクト構造**
   - 既存のNext.js App Router構造を説明
   - ポーカーセッション機能（実装予定）のディレクトリ構造

5. **実装状況**
   - ポーカーセッショントラッカーが計画中であることを明記
   - `specs/002-poker-session-tracker/`への参照

6. **よくある質問（FAQ）**
   - データベース名変更の対応（`todoapp` → `sapphire`）
   - PWAアイコンキャッシュの問題
   - **OAuth認証のトラブルシューティング**（リダイレクトURI、環境変数設定）
   - テスト用DB未作成エラーの対処
   - NextAuth.jsエラーの対処

7. **トラブルシューティング**
   - PostgreSQL接続、ポート競合、スキーマ適用失敗、OAuth設定エラーの解決方法

### ユーザーフィードバックの反映

- ✅ **Google/GitHub APIキー**: OAuth認証情報取得の詳細手順を追加
- ✅ **E2Eテスト削除**: Playwright関連のコマンドと記述を全て除外
- ✅ **認証トラブルシューティング**: OAuth設定エラーのFAQとトラブルシューティングを追加

### データモデルとAPI契約

**Note**: このリブランディングタスクは**メタデータとドキュメント更新のみ**であり、データモデルの変更やAPI契約の定義を伴わないため、`data-model.md`と`contracts/`ディレクトリは作成しません。

**Phase 1完了**: quickstart.mdが作成され、リブランディング後のプロジェクト使用をサポートするドキュメントが整った。

---

## Phase 2: Task Generation (Next Step)

**Status**: Not Started
**Tool**: `/speckit.tasks`

Phase 1完了後、次のステップは`/speckit.tasks`コマンドを実行して、実装タスクリスト（`tasks.md`）を生成することです。

タスクリストには以下が含まれる予定：

### P1タスク: プロジェクトアイデンティティ確立
- src/app/layout.tsx のmetadata更新
- src/app/manifest.ts のPWA manifest更新
- public/ の6個のアイコンファイル置き換え

### P2タスク: ドキュメント刷新
- README.md の全面刷新（技術スタック、セットアップ、実装状況）
- Google/GitHub APIキー取得手順の追加

### P3タスク: メタデータ統一
- package.json 更新（name, description, keywords, author）
- LICENSE 更新（著作権表示）
- .specify/memory/constitution.md 更新（タイトル）

---

## Summary

### 完了したフェーズ

✅ **Phase 0: Research** - リブランディングのベストプラクティスと技術的判断を調査・文書化
✅ **Phase 1: Design** - quickstart.mdを作成し、OAuth認証手順とE2Eテスト削除を反映

### 生成されたドキュメント

- ✅ **spec.md** - 機能仕様書（P1〜P3のユーザーストーリー、13個の機能要件）
- ✅ **plan.md** - 実装計画（このファイル）
- ✅ **research.md** - リブランディング戦略（6個の技術的判断）
- ✅ **quickstart.md** - セットアップガイド（OAuth認証、トラブルシューティング）
- ✅ **checklists/requirements.md** - 仕様品質チェックリスト

### 次のアクション

実装を開始するには、以下のコマンドを実行してください：

```bash
/speckit.tasks
```

これにより、`tasks.md`が生成され、具体的な実装タスクのリストと優先度が提供されます。タスクリストに従って、P1 → P2 → P3の順に実装を進めてください。

---

**Phase 1 Planning Complete - Ready for `/speckit.tasks`**
