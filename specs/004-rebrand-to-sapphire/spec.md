# Feature Specification: Sapphireプロジェクト リブランディング

**Feature Branch**: `004-rebrand-to-sapphire`
**Created**: 2025-10-31
**Status**: Draft
**Input**: User description: "このあたりで、いまだにテンプレートの痕跡が残っている点を全て更新したいです。
- アイコン画像をsapphireのものに
- サイトのメタデータを`Todoアプリ`から`Sapphire`に
- `README.md`を現在までのタスク履歴やコミット履歴から最新のものに
- その他メタデータや命名関係でテンプレートの痕跡が残っているものを一新する"

## User Scenarios & Testing

### User Story 1 - プロジェクトアイデンティティの確立 (Priority: P1)

新規ユーザーや開発者がプロジェクトを見たとき、一目で「Sapphire」プロジェクト（ポーカーセッショントラッカー）であることが認識でき、テンプレート（Mantine Vibe Template）やTodoアプリの痕跡が一切残っていない状態にする。

**Why this priority**: プロジェクトの第一印象とブランドアイデンティティは、採用率、開発者体験、ユーザー信頼性に直接影響する最重要要素である。特にポーカーセッショントラッカーとしての専門性を示すために、一貫したブランディングが不可欠。

**Independent Test**: 新しいブラウザタブでアプリを開き、ページタイトル、アイコン、メタデータがすべて「Sapphire」を反映していることを確認できる。README.mdを開いて、テンプレートやTodoアプリへの参照が存在しないことを確認できる。

**Acceptance Scenarios**:

1. **Given** ユーザーがブラウザでアプリを開いた時、**When** ブラウザタブを見る、**Then** タイトルが「Sapphire」または「Sapphire - ポーカーセッショントラッカー」で表示される
2. **Given** 開発者がREADME.mdを開いた時、**When** プロジェクト説明を読む、**Then** "Mantine Vibe Template"や"Todoアプリ"の参照が存在せず、Sapphire（ポーカーセッショントラッカー）としての説明が記載されている
3. **Given** ユーザーがPWAとしてインストールする時、**When** アプリアイコンを見る、**Then** Sapphire独自のアイコンが表示される
4. **Given** 開発者がpackage.jsonを開いた時、**When** nameフィールドを確認する、**Then** "sapphire"または適切なパッケージ名が設定されている
5. **Given** 開発者がapp/layout.tsxを開いた時、**When** metadataオブジェクトを確認する、**Then** titleとdescriptionがSapphire/ポーカートラッカーに関連した内容になっている

---

### User Story 2 - プロジェクト説明の刷新 (Priority: P2)

README.mdがプロジェクトの現在の状態を正確に反映し、技術スタック、実装中の機能（ポーカーセッショントラッカー）、セットアップ方法を明確に説明している。

**Why this priority**: 新規開発者のオンボーディングと既存開発者の理解を促進するために、正確で最新のドキュメントが必要。特にポーカートラッカーという専門的なアプリケーションであることを明確に伝える必要がある。

**Independent Test**: README.mdを読んで、Sapphireがポーカーセッショントラッカーであること、使用している技術スタック、セットアップ方法を理解でき、実際にローカル環境を構築できる。

**Acceptance Scenarios**:

1. **Given** 新規開発者がREADME.mdを開いた時、**When** プロジェクト概要を読む、**Then** Sapphireがポーカーセッションを記録・分析するアプリケーションであることが明確に理解できる
2. **Given** 開発者がREADME.mdの技術スタックセクションを読む時、**When** 使用技術を確認する、**Then** Next.js 15、tRPC、Drizzle ORM、Mantine v8、PostgreSQLが記載されている
3. **Given** 開発者がREADME.mdのセットアップセクションを読む時、**When** 手順に従う、**Then** Docker Composeでデータベースを起動し、開発サーバーを立ち上げられる
4. **Given** READMEに実装状況のセクションがある時、**When** 機能リストを確認する、**Then** ポーカーセッショントラッカーの計画中/実装中の機能が記載されている

---

### User Story 3 - メタデータとライセンスの統一 (Priority: P3)

プロジェクトのすべてのメタデータファイル（package.json、LICENSE、constitution.mdなど）がSapphireプロジェクトとして統一され、一貫性がある。

**Why this priority**: 法的・技術的メタデータの整合性は、プロフェッショナリズムとプロジェクトの信頼性を示す。特にオープンソースプロジェクトとして公開する場合、正確なメタデータは不可欠。

**Independent Test**: package.json、LICENSE、constitution.mdを開いて、すべてのファイルでプロジェクト名とブランドが統一されていることを確認できる。

**Acceptance Scenarios**:

1. **Given** 開発者がLICENSEファイルを開いた時、**When** 著作権表示を確認する、**Then** "Sapphire Contributors"または適切な著作権者が記載されている
2. **Given** 開発者がconstitution.mdを開いた時、**When** タイトルを確認する、**Then** "Sapphireプロジェクト憲法"として記載されている
3. **Given** 開発者がpackage.jsonを開いた時、**When** description、keywords、repository URLを確認する、**Then** Sapphireプロジェクトの正しい情報が設定されている
4. **Given** 開発者がpackage.jsonを開いた時、**When** authorフィールドを確認する、**Then** "Sapphire Contributors"または適切な著作者情報が記載されている

---

### Edge Cases

- **PWAアイコンキャッシュ**: ユーザーが既にPWAとしてインストールしている場合、新しいアイコンが反映されるまで時間がかかる可能性がある（ブラウザキャッシュの問題）。マニフェストのバージョン更新やキャッシュバスティングが必要かもしれない。
- **Git履歴**: 既存のコミット履歴やブランチ名には"todo"や"mantine-vibe-template"が含まれるが、これは変更不可能（履歴は保持すべき）
- **データベース名**: `sapphire`と`sapphire_test`はすでに更新済みだが、古いデータベース名（`todoapp`）が残っている環境への移行手順が必要かもしれない
- **specs/001-todo-app/フォルダ**: Todoアプリの機能は削除済みだが、仕様ドキュメントは歴史的参照として残すべきか、削除すべきかの判断が必要
- **外部リンク**: README.mdやドキュメント内に、GitHubリポジトリURLや外部リンクが含まれる場合、これらも更新が必要

## Requirements

### Functional Requirements

- **FR-001**: アプリケーションのブラウザタブタイトルをSapphire関連の名称（例: "Sapphire - ポーカーセッショントラッカー"）に変更しなければならない
- **FR-002**: PWA manifest（manifest.ts）の`name`を"Sapphire"または"Sapphire - ポーカーセッショントラッカー"に、`short_name`を"Sapphire"に変更しなければならない
- **FR-003**: PWA manifest（manifest.ts）の`description`をポーカーセッショントラッカーの説明に更新しなければならない
- **FR-004**: README.mdを以下の内容で刷新しなければならない：
  - プロジェクト説明（Sapphire - ポーカーセッショントラッカー）
  - 技術スタック（Next.js 15、tRPC、Drizzle ORM、Mantine v8、PostgreSQL）
  - セットアップ手順（Docker Compose、データベース初期化、開発サーバー起動）
  - 実装状況（ポーカーセッショントラッカーの計画/実装中機能）
- **FR-005**: package.jsonの`name`フィールドを"sapphire"に変更しなければならない
- **FR-006**: package.jsonの`description`をポーカーセッショントラッカーの説明に更新しなければならない
- **FR-007**: package.jsonの`keywords`をSapphire/ポーカー関連のキーワードに更新しなければならない
- **FR-008**: package.jsonの`author`フィールドを"Sapphire Contributors"に変更しなければならない
- **FR-009**: LICENSEファイルの著作権表示を"Sapphire Contributors"に変更しなければならない
- **FR-010**: constitution.mdのタイトルを"Sapphireプロジェクト憲法"に変更しなければならない
- **FR-011**: PWAアイコン（favicon.ico、icon-*.png、apple-touch-icon.png）をユーザー提供のSapphireブランドアイコンに置き換えなければならない
- **FR-012**: app/layout.tsxのmetadata.titleとmetadata.descriptionをSapphire/ポーカートラッカー関連の内容に更新しなければならない
- **FR-013**: app/layout.tsxのappleWebApp.titleをSapphire関連の名称に更新しなければならない

### Key Entities

- **プロジェクトメタデータ**: プロジェクト名（"Sapphire"）、説明（ポーカーセッショントラッカー）、著作権情報、リポジトリURL、キーワード
- **視覚的アイデンティティ**: アイコン、ファビコン、PWAマニフェストアイコン（ユーザー提供のSapphire専用デザイン）
- **ドキュメント**: README.md（技術スタック、セットアップ、実装状況）、LICENSE、constitution.md
- **PWAマニフェスト**: アプリ名、短縮名、説明、アイコン、テーマカラー

## Success Criteria

### Measurable Outcomes

- **SC-001**: 新規ユーザーがプロジェクトを開いた時、5秒以内にSapphire（ポーカーセッショントラッカー）であることを認識できる（ブラウザタブタイトル、アイコン、README.mdから）
- **SC-002**: README.mdを読んで、新規開発者が10分以内にプロジェクトの目的、技術スタック、セットアップ方法を理解できる
- **SC-003**: プロジェクト全体で"Mantine Vibe Template"、"mantttine_vibe"、"Todoアプリ"、"Todo"の参照が0件になる（specs/001-todo-app/フォルダを除く）
- **SC-004**: PWAアイコンがすべてSapphireブランドで統一され、ブラウザタブ、PWAインストール画面、ホーム画面で一貫したアイコンが表示される
- **SC-005**: プロジェクトをクローンした新規開発者が、README.mdの手順に従って30分以内にローカル環境を構築し、開発サーバーを起動できる
- **SC-006**: package.json、LICENSE、constitution.md、README.md、manifest.ts、layout.tsxのメタデータがすべてSapphireプロジェクトとして統一されている

## Assumptions

- Sapphireプロジェクトは引き続きMIT Licenseで公開される
- 既存の技術スタック（Next.js、tRPC、Drizzle ORM、Mantine）は変更しない
- README.mdは日本語で記述する（憲法原則 III: 日本語ファーストに従う）
- アイコンデザインはユーザーが提供する（Sapphire専用のブランドアイコン）
- `specs/001-todo-app/`フォルダは歴史的参照として保持し、内容は更新しない
- Git履歴とコミットメッセージは変更しない（変更不可能なため）
- データベース名は既に`sapphire`と`sapphire_test`に更新済み
- プロジェクトのメインリポジトリURLは既に確定している（またはplaceholderとして記載）
- Todoアプリの機能とコードは完全に削除済み
- ポーカーセッショントラッカーの仕様は`specs/002-poker-session-tracker/`に存在し、実装は進行中

## Dependencies

- **アイコンデザイン**: Sapphireブランドのアイコン画像ファイル（favicon.ico、192x192.png、512x512.png、apple-touch-icon.png、maskable版）
- **リポジトリURL**: GitHubまたはGitLabのリポジトリURL（package.jsonとREADME.mdに記載）

## Out of Scope

以下は本機能の範囲外とする:

- コード内のコメントやドキュメント文字列の更新（既存コードのロジックには影響しないため）
- `specs/001-todo-app/`フォルダ内のドキュメント内容の更新（歴史的参照として保持）
- Git履歴の書き換え（git rebase -i等は使用しない）
- データベース名の変更（すでに`sapphire`と`sapphire_test`に更新済み）
- 既存機能のリファクタリングや改善（リブランディングのみに集中）
- ポーカーセッショントラッカーの新機能実装（別の機能として扱う）
- CI/CDパイプラインの設定変更（メタデータ更新のみ）
- .envファイルや環境変数の更新（データベース名は既に更新済みのため）

---

**Note**: この仕様は、プロジェクトのアイデンティティと第一印象を刷新するためのものであり、既存機能や動作には一切影響を与えない。すべての変更は、ユーザーと開発者に対する視覚的・文書的なブランディングに限定される。Todoアプリは既に削除済みであり、Sapphireはポーカーセッショントラッカーとしての専門性を持つプロジェクトとして位置づけられる。

