# Research: プロジェクト品質向上・リファクタリング

**Feature**: 005-refactor-auth-testing
**Date**: 2025-12-02

## 1. NextAuth.js v5 Credentials Provider

### 1.1 複数プロバイダーの並行運用

**Decision**: NextAuth.js設定の`providers`配列にCredentials, Google, GitHubを並列で追加する。

**Rationale**: NextAuth.js v5は複数プロバイダーを標準でサポートし、各プロバイダーは独立したIDを持つ。ユーザーは好みの認証方法を選択できる。

**Alternatives considered**:
- カスタムオーケストレーション層 → 不要（NextAuthが処理）
- プロバイダー別の設定分離 → 単一設定原則に違反

### 1.2 アカウントリンク（同一メール = 同一ユーザー）

**Decision**: `signIn()`コールバックで手動アカウントリンクを実装。信頼できるOAuthプロバイダーには`allowDangerousEmailAccountLinking`フラグを使用。

**Rationale**:
- NextAuth.jsはデフォルトで自動リンクしない（`OAuthAccountNotLinked`エラー）
- OAuthメールは必ずしも検証されていないため、自動リンクはアカウント乗っ取りリスク
- Google/GitHubは信頼できるプロバイダーとして`allowDangerousEmailAccountLinking: true`を設定可能

**Implementation flow**:
1. `signIn()`コールバックでメールアドレスで既存ユーザーを検索
2. 既存ユーザーが存在すれば、そのユーザーを返す（アカウントリンク）
3. 新規メールなら新規ユーザー作成

**Alternatives considered**:
- 全プロバイダー自動リンク → 未検証メールでのセキュリティ脆弱性
- リンクなし → 重複アカウント作成でUX低下
- 設定画面での明示的リンク → より安全だが摩擦が大きい

### 1.3 パスワードハッシュ化

**Decision**: **bcryptjs**を使用（純粋JavaScript実装でサーバーレス環境対応）。

**Rationale**:
- bcryptjsは純粋JavaScript実装でネイティブバインディング不要
- Edge Runtimeでも動作
- コストファクター12以上を使用
- 広く使用され実績のあるアルゴリズム

**Alternatives considered**:
- Argon2id → 最新で優れているが、ネイティブバインディング必要でEdge Runtime非互換
- bcrypt（ネイティブ）→ パフォーマンス良好だがシステム依存
- scrypt/PBKDF2 → 古い標準

### 1.4 セッション戦略

**Decision**: **JWTセッション**を使用（Credentials Providerの要件）。

**Rationale**:
- **重要な制限**: NextAuth.js v5のCredentials Providerはデータベースセッションを自動作成しない
- Credentials認証はJWTセッションが必須
- Edge Runtime互換性（ミドルウェアでデータベースアクセス不可）

**Alternatives considered**:
- データベースセッション → Credentialsでは手動セッション作成が必要で複雑化
- 全てJWT → 監査証跡なし、セッション無効化不可

### 1.5 OAuth既存メールでのCredentials登録

**Decision**: `signIn()`コールバックで既存ユーザーを検出し、アカウントをリンク。

**Implementation flow**:
1. ユーザーがCredentialsで登録を試みる
2. メールアドレスで既存ユーザーを検索
3. 既存（OAuthから）なら、パスワードを追加してリンク
4. 新規なら新規ユーザー作成
5. データベースでメール一意制約を強制

---

## 2. Playwright E2Eテストパターン

### 2.1 認証パターン

**Decision**: **ストレージステート**をキャッシュし、グローバルセットアッププロジェクトで一度だけログインを実行。

**Rationale**:
- 認証は遅くコストが高い。セッションキャッシュで重複ログインを排除
- Playwrightのプロジェクト依存システムで認証セットアッププロジェクトを先に実行
- 機能テストでは認証済みユーザーを前提とし、認証フロー自体のテストは明示的に実施

**Alternatives considered**:
- 毎テストで認証 → 遅くflakeが増加
- ハードコードされた認証情報 → セキュリティリスクで脆弱
- 認証の完全モック → 実際の認証統合問題を検出できない

### 2.2 データセットアップ・クリーンアップ

**Decision**: **Playwrightフィクスチャ**と「クリーンアップ登録」パターンを使用。セットアップ/テアダウンにはAPIコールを使用。

**Rationale**:
- フィクスチャはセットアップとテアダウンを一箇所に整理
- 非同期クリーンアップはテスト失敗時も実行される
- APIベースのセットアップ/クリーンアップはUI操作より高速で信頼性が高い
- 並列実行のためにテストデータ分離が重要

**Alternatives considered**:
- beforeEach/afterEach → フィクスチャより構成性が低い
- グローバルセットアップ/テアダウン → 静的なプロジェクト全体のセットアップにのみ適切
- テスト内での手動クリーンアップ → エラーが起きやすく冗長

### 2.3 Page Object Model vs フィクスチャ

**Decision**: **複合アプローチ** - Page Object Modelクラスをフィクスチャ経由で注入。

**Rationale**:
- POM単独では各テストで手動インスタンス化が必要（ボイラープレート）
- フィクスチャ単独ではPOMの構造的な整理が欠ける
- 複合：POMフィクスチャでtestを拡張 - 反復を排除しつつクリーンなアーキテクチャを維持

**Alternatives considered**:
- POMのみ → テストセットアップが冗長、スケールしにくい
- フィクスチャのみ → POM構造の組織的利点を失う

### 2.4 安定したセレクター

**Decision**: **ロールベースロケーター**（getByRole）を優先し、複雑な要素には**data-testid**をフォールバックとして使用。

**Rationale**:
- ロールベースセレクター（getByRole('button')）はアクセシビリティと実際のユーザー操作に準拠
- data-testidはスタイル/構造変更に影響されず安定
- CSS/XPathチェーンは避ける（DOM構造変更に脆弱）

**Alternatives considered**:
- 純粋CSSセレクター → スタイル変更で壊れる
- XPath → 脆弱で冗長
- テキストコンテンツ → 動的/変化するテキストで失敗

### 2.5 非同期操作とウェイト

**Decision**: Playwrightの**組み込み動的ウェイト**を使用（自動待機 + 明示的waitForメソッド）。ハードコードタイムアウトは避ける。

**Rationale**:
- Playwrightはアクション前に要素がアタッチ・可視・安定・有効・遮蔽されていないことを自動で待機
- 特定条件には明示的ウェイトを使用：`waitForLoadState('networkidle')`, `waitForSelector()`
- 各awaitは次のアクション前に完了する必要がある（レース条件防止）

**Alternatives considered**:
- ハードコードタイムアウト（waitForTimeout(2000)）→ flake、遅い、信頼性なし
- 待機なし → レース条件とflake
- 手動ポーリング → 非効率で冗長

---

## 3. UIリデザイン方針

### 3.1 デザインシステム

**Decision**: 既存のMantine v8デザインシステムを継続使用。テーマカスタマイズで一貫性を強化。

**Rationale**:
- 既存コンポーネントがMantineベース
- 新規ライブラリ導入のオーバーヘッド回避
- Mantineは豊富なコンポーネントとアクセシビリティサポートを提供

### 3.2 レスポンシブデザイン

**Decision**: Mantineのレスポンシブユーティリティ（`visibleFrom`, `hiddenFrom`, Flexbox/Gridプロパティ）を活用。

**Rationale**:
- 既存パターンとの一貫性
- モバイルファーストアプローチ
- ブレークポイント：xs(0), sm(576px), md(768px), lg(992px), xl(1200px)

---

## 4. コンポーネントテスト方針

### 4.1 テストライブラリ

**Decision**: Vitest + React Testing Libraryを使用（既存設定を活用）。

**Rationale**:
- プロジェクトに既に設定済み
- Vitestは高速でHMR対応
- React Testing Libraryはユーザー中心のテストを促進

### 4.2 テスト対象コンポーネント

**Decision**: 主要Presentationコンポーネント5種を優先的にテスト。

**Priority order**:
1. SessionCard - セッション表示の基本単位
2. SessionForm - ユーザー入力の検証
3. SessionList - リスト表示とインタラクション
4. SessionStats - 統計表示
5. SessionFilters - フィルタリングUI

---

## Summary

| 領域 | 決定 | 主要な制約/理由 |
|------|------|-----------------|
| 認証プロバイダー | Credentials + OAuth並列 | NextAuth v5標準サポート |
| アカウントリンク | signIn()コールバックで手動 | セキュリティとUXのバランス |
| パスワードハッシュ | bcryptjs | Edge Runtime互換、純粋JS |
| セッション戦略 | JWT | Credentials Providerの要件 |
| E2E認証 | ストレージステートキャッシュ | 高速化、flake削減 |
| E2Eデータ | フィクスチャ + API | 信頼性、クリーンアップ保証 |
| セレクター | getByRole > data-testid | アクセシビリティ準拠 |
| UIリデザイン | Mantine継続 | 既存資産活用 |
| コンポーネントテスト | Vitest + RTL | 既存設定活用 |
