# Research: 通貨・ゲーム登録機能

**Feature Branch**: `007-store-currency-games`
**Date**: 2025-12-05

## 技術的な決定事項

### 1. データベーススキーマ設計

**Decision**: Drizzle ORMを使用し、既存のスキーマパターンに従って`currencies`テーブルと`games`テーブルを追加

**Rationale**:
- プロジェクトは既にDrizzle ORM v0.41を使用しており、`locations`や`tags`テーブルの実装パターンが確立されている
- `createTable`関数によるプレフィックス付きテーブル名（`sapphire_*`）のパターンを継続
- リレーションは`relations`関数で定義する既存パターンを踏襲

**Alternatives considered**:
- Prisma: 既存プロジェクトがDrizzleを使用しているため却下
- Raw SQL: 型安全性とマイグレーション管理のためDrizzle ORMを継続

### 2. 通貨エンティティの設計

**Decision**: `currencies`テーブルをユーザーに直接紐付け、店舗から独立したエンティティとして設計

**Rationale**:
- 日本のアミューズメントポーカーでは、JOPTポイント等の複数店舗で共通使用される通貨が存在
- 通貨を店舗の子エンティティにすると、同一通貨を複数店舗で使用する際にデータ重複が発生
- `games`テーブルから`currencies`テーブルを外部キーで参照する設計が柔軟性を提供

**Alternatives considered**:
- 通貨を店舗の子エンティティにする: データ重複と管理の複雑さから却下
- 通貨をグローバルマスターにする: ユーザー間での通貨共有は不要なため却下

### 3. ゲームエンティティの設計

**Decision**: `games`テーブルを店舗（`locations`）に紐付け、通貨（`currencies`）を外部キーで参照

**Rationale**:
- ゲームは特定の店舗で行われるものであり、店舗との1対多関係が自然
- ブラインド構造（SB/BB/Ante）とbuy-in範囲は整数型で管理し、BB単位で表現
- アーカイブ状態はboolean型で管理し、論理削除パターンを適用

**Alternatives considered**:
- ゲームを店舗から独立させる: ゲームは特定の店舗で行われるため却下
- ブラインドを文字列で保存: 数値計算が必要なため整数型を採用

### 4. セッションとゲームの関連

**Decision**: `pokerSessions`テーブルに`gameId`カラム（nullable）を追加

**Rationale**:
- 既存セッションとの後方互換性を維持するためnullable
- 外部キー制約により参照整合性を保証
- `onDelete: "set null"`で、ゲーム削除時にセッションは残る（ただし削除は通常防止される）

**Alternatives considered**:
- 必須フィールドにしてマイグレーション: 既存データの破壊を避けるため却下
- 中間テーブル: 1対多の関係なので不要

### 5. tRPC APIルーター設計

**Decision**: 新規ルーター`currencies`と`games`を作成し、既存の`sessions`ルーターを拡張

**Rationale**:
- 既存の`sessions`、`locations`ルーターのパターンに従う
- `protectedProcedure`を使用して認証必須に
- Zodスキーマでバリデーションを定義

**Alternatives considered**:
- REST API: プロジェクトがtRPCを採用しているため却下
- GraphQL: 既存アーキテクチャとの一貫性のためtRPCを継続

### 6. フロントエンドコンポーネント構成

**Decision**: `src/features/currencies/`と`src/features/games/`ディレクトリを新規作成し、Container/Presentation分離パターンを適用

**Rationale**:
- 憲法原則IVのレイヤー分離に従う
- 既存の`poker-sessions`機能のパターンを踏襲
- コンポーネントの再利用性とテスト容易性を確保

**Alternatives considered**:
- 単一コンポーネント: テスト容易性のためContainer/Presentation分離を採用

### 7. UI配置

**Decision**: 通貨管理は独立した設定ページ、ゲーム管理は店舗詳細画面内のタブ

**Rationale**:
- 通貨は店舗横断で使用されるため、設定画面で一元管理
- ゲームは店舗に紐付くため、店舗コンテキスト内で管理が直感的
- 階層構造（店舗 → ゲーム）がUIに反映される

**Alternatives considered**:
- 両方を独立ページに: ゲームは店舗コンテキストが重要なため却下
- 両方を店舗詳細内に: 通貨は店舗横断のため独立ページを採用

### 8. バリデーション戦略

**Decision**: Zodスキーマをバックエンドとフロントエンドで共有

**Rationale**:
- 既存プロジェクトのパターンに従う
- 型安全性とバリデーションロジックの一元化
- `SB <= BB`、`minBuyIn <= maxBuyIn`等のカスタムバリデーションをrefineで実装

**Alternatives considered**:
- フロントエンド・バックエンドで別々のバリデーション: 重複と不整合を避けるため却下

### 9. 統計機能の拡張

**Decision**: 既存の`sessions.getStats`を拡張し、ゲーム別・通貨別のグルーピングオプションを追加

**Rationale**:
- 既存のPostgreSQL集計関数パターンを活用
- `gameId`でGROUP BYすることでゲーム別統計を算出
- 通貨別統計はgameのcurrencyIdでJOINしてグルーピング

**Alternatives considered**:
- 別エンドポイント: 既存エンドポイントの拡張が一貫性を維持

### 10. テスト戦略

**Decision**: 契約テスト（API）、コンポーネントテスト（UI）、E2Eテストの3層でカバー

**Rationale**:
- CLAUDE.mdで定義されたテスト方針に従う
- TDD原則に基づき、テストを先に作成
- `tests/contract/currencies.test.ts`、`tests/contract/games.test.ts`を新規作成

**Alternatives considered**:
- 統合テストのみ: プロジェクト方針でE2Eでカバーするため契約テストを優先

## 技術的リスクと対策

### リスク1: 既存セッションデータとの互換性

**リスク**: `gameId`カラム追加時の既存データへの影響

**対策**:
- `gameId`をnullableとして追加
- マイグレーションでデフォルト値を設定しない
- UIでは「未設定」として表示

### リスク2: パフォーマンス

**リスク**: ゲーム・通貨の増加に伴うクエリ性能劣化

**対策**:
- インデックス設計: `userId + locationId`、`userId + currencyId`
- 100通貨、100店舗、各50ゲームの規模でも性能要件を満たすことを確認

### リスク3: 削除時の参照整合性

**リスク**: 通貨削除時のゲームへの影響、ゲーム削除時のセッションへの影響

**対策**:
- 使用中の通貨/ゲームの削除を防止（バリデーション）
- 削除前に関連データをチェックし、警告メッセージを表示
- 店舗削除時はカスケード削除（通貨は残す）

## 未解決事項

なし - すべての技術的決定事項が確定しました。
