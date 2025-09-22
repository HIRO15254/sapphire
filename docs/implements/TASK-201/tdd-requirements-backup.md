# TASK-201 ナビゲーション統合とルーティング - TDD実装詳細要件

## 概要

**タスク**: TASK-201 ナビゲーション統合とルーティング
**要件リンク**: REQ-202
**実装方針**: Test-Driven Development (TDD)
**完了基準**: 全ナビゲーションコンポーネントでアクティブ状態同期、ページ遷移正常動作、モバイルメニュー自動クローズ

### 現在の実装状況
- ✅ ResponsiveLayoutコンポーネント（10テスト全通過）
- ✅ HeaderNavigation（15テスト全通過）
- ✅ FooterNavigation（15テスト全通過）
- ✅ SideNavigation（17テスト全通過）
- ✅ HamburgerMenu（20テスト全通過）

## 1. 実装対象コンポーネント

### 1.1 NavigationProvider（新規実装）
**ファイル**: `src/providers/NavigationProvider.tsx`
**責務**: React Router統合、ナビゲーション状態管理、アクティブ状態の一元管理

#### 機能要件
- React Router v6のBrowserRouterラップ
- 現在のルート監視とアクティブ状態判定
- パンくずリスト自動生成
- ナビゲーション状態の Context提供
- ページ遷移時のローディング状態管理

#### TypeScript型定義
```typescript
interface NavigationContextValue {
  currentPath: string;
  previousPath?: string;
  isLoading: boolean;
  breadcrumbs: BreadcrumbItem[];
  isActive: (path: string) => boolean;
  navigate: (path: string) => void;
  goBack: () => void;
  setPageTitle: (title: string) => void;
}

interface BreadcrumbItem {
  id: string;
  label: string;
  path: string;
  isActive: boolean;
}
```

### 1.2 useNavigation Hook（新規実装）
**ファイル**: `src/hooks/useNavigation.ts`
**責務**: NavigationProviderのContext消費、ナビゲーション操作のAPI提供

#### 機能要件
- NavigationContextの型安全な取得
- ページ遷移関数の提供
- アクティブ状態判定ヘルパー
- パンくずリスト取得
- ページタイトル設定

### 1.3 RouteComponents（新規実装）
**ファイル**: `src/components/routes/`
**責務**: アプリケーション内の各ページコンポーネント

#### 実装対象ページ
- `HomePage.tsx` - トップページ
- `AboutPage.tsx` - アバウトページ
- `ContactPage.tsx` - お問い合わせページ
- `NotFoundPage.tsx` - 404エラーページ
- `LoadingPage.tsx` - ローディングページ

### 1.4 既存コンポーネントの改修

#### ResponsiveLayout.tsx
- NavigationProvider統合
- Router対応の調整
- Route定義の統合

#### HeaderNavigation.tsx
- useNavigation hookの使用
- アクティブ状態の動的判定
- ナビゲーション項目のRouter Link化

#### FooterNavigation.tsx
- useNavigation hookの使用
- アクティブ状態の動的判定
- ナビゲーション項目のRouter Link化

#### SideNavigation.tsx
- useNavigation hookの使用
- アクティブ状態の動的判定
- ナビゲーション項目のRouter Link化

#### HamburgerMenu.tsx
- useNavigation hookの使用
- ページ遷移時の自動クローズ
- モバイル遷移後のメニュークローズ

## 2. TDD実装サイクル

### Phase 1: NavigationProvider基本実装
#### Red - テストケース作成
1. NavigationProvider基本機能テスト
2. React Router統合テスト
3. Context値提供テスト
4. 現在パス監視テスト

#### Green - 最小実装
1.基本的なNavigationProvider実装
2. BrowserRouter統合
3. useLocation hook使用
4. Context Provider実装

#### Refactor - リファクタリング
1. TypeScript型定義の最適化
2. パフォーマンス最適化
3. エラーハンドリング追加

### Phase 2: アクティブ状態判定実装
#### Red - テストケース作成
1. パス完全一致判定テスト
2. パス部分一致判定テスト
3. クエリパラメータ考慮テスト
4. ハッシュフラグメント考慮テスト

#### Green - 最小実装
1. isActive関数実装
2. パスマッチングロジック
3. 正規化処理

#### Refactor - リファクタリング
1. マッチングアルゴリズム最適化
2. エッジケース対応

### Phase 3: パンくずリスト生成実装
#### Red - テストケース作成
1. 単純なパス階層でのパンくず生成
2. 複雑な階層構造での生成
3. 動的セグメント対応
4. カスタムラベル対応

#### Green - 最小実装
1. パス解析ロジック
2. ナビゲーション設定からのラベル取得
3. 階層構造の構築

#### Refactor - リファクタリング
1. パンくず生成アルゴリズム最適化
2. メモ化によるパフォーマンス向上

### Phase 4: 既存コンポーネント統合
#### Red - テストケース作成
1. HeaderNavigationのRouter統合テスト
2. FooterNavigationのRouter統合テスト
3. SideNavigationのRouter統合テスト
4. HamburgerMenuの遷移後クローズテスト

#### Green - 最小実装
1. 各コンポーネントでのuseNavigation hook使用
2. Link コンポーネント化
3. アクティブクラス適用

#### Refactor - リファクタリング
1. 共通化可能な処理の抽出
2. アクセシビリティ改善

### Phase 5: ページコンポーネント実装
#### Red - テストケース作成
1. 各ページの基本レンダリングテスト
2. ページタイトル設定テスト
3. 404ページのエラーハンドリングテスト
4. ローディングページのスピナー表示テスト

#### Green - 最小実装
1. 基本的なページコンポーネント
2. useEffect でのページタイトル設定
3. エラーバウンダリ統合

#### Refactor - リファクタリング
1. ページ共通レイアウトの抽出
2. SEO対応の追加

## 3. UI/UX要件詳細

### 3.1 ローディング状態
**要件**: ページ遷移時のローディング表示

#### 実装仕様
- ページ遷移開始時にローディング状態をtrue
- コンポーネントマウント完了時にローディング状態をfalse
- ローディング中はスピナーまたはスケルトン表示
- 最小表示時間: 200ms（フラッシュ防止）
- 最大表示時間: 5秒（タイムアウト）

#### テストケース
- ページ遷移時のローディング状態変化
- ローディングUI表示/非表示
- タイムアウト処理
- 連続遷移時の状態管理

### 3.2 エラー表示
**要件**: ルート不存在時の404ページ

#### 実装仕様
- 未定義ルートアクセス時に404ページ表示
- 404ページには戻るボタンとホームリンク
- ブラウザの戻るボタン対応
- SEO対応（適切なmetaタグ設定）

#### テストケース
- 不正なパスアクセス時の404表示
- 404ページ内リンクの動作
- ブラウザ履歴の正常性
- エラー状態からの復帰

### 3.3 モバイル対応
**要件**: 遷移後のハンバーガーメニュー自動クローズ

#### 実装仕様
- ページ遷移検知時にメニュー状態をfalse
- アニメーション考慮の適切なタイミング
- タッチ操作との競合回避
- 戻る操作時は状態維持

#### テストケース
- リンククリック時のメニュークローズ
- 戻る操作時の状態維持
- アニメーション中の状態管理
- 画面サイズ変更時の動作

### 3.4 アクセシビリティ
**要件**: ページ変更の音声読み上げ対応

#### 実装仕様
- ページ遷移時のaria-live領域更新
- 適切なページタイトル設定
- フォーカス管理（メインコンテンツにフォーカス）
- skip linkの提供

#### テストケース
- スクリーンリーダーでの読み上げ
- キーボードナビゲーション
- フォーカストラップ機能
- タブオーダーの妥当性

## 4. パフォーマンス要件

### 4.1 レンダリング最適化
- React.memoによるコンポーネント最適化
- useMemoによる計算結果キャッシュ
- useCallbackによるイベントハンドラ最適化

### 4.2 バンドルサイズ最適化
- 遅延読み込み（React.lazy）の活用
- ルートベースコード分割
- 未使用ライブラリの削除

### 4.3 ナビゲーション応答性
- 遷移アニメーション: 300ms以下
- ローディング表示: 200ms以降
- アクティブ状態更新: 同期的

## 5. エラーハンドリング

### 5.1 Router関連エラー
- 不正なルート遷移
- ナビゲーション設定の不整合
- パンくず生成エラー

### 5.2 状態管理エラー
- Context値の未定義状態
- 状態更新失敗
- 非同期処理エラー

### 5.3 UI表示エラー
- コンポーネントレンダリングエラー
- アイコン読み込みエラー
- アニメーション実行エラー

## 6. テスト戦略

### 6.1 単体テスト
- 各コンポーネントの独立テスト
- Hook の単体テスト
- ユーティリティ関数テスト

### 6.2 統合テスト
- Provider + Consumerの統合テスト
- ルーティング統合テスト
- ナビゲーション状態同期テスト

### 6.3 E2Eテスト
- 実際のページ遷移シナリオ
- マルチデバイス対応
- アクセシビリティテスト

## 7. 完了基準

### 7.1 機能面
- ✅ すべてのナビゲーションコンポーネントでアクティブ状態が同期
- ✅ ページ遷移が正常に動作
- ✅ モバイルでメニューが自動クローズ
- ✅ パンくずリストが適切に生成
- ✅ 404エラーページが表示
- ✅ ローディング状態が表示

### 7.2 品質面
- ✅ すべてのテストケースが通過（95%以上のカバレッジ）
- ✅ TypeScriptエラーがゼロ
- ✅ ESLintエラーがゼロ
- ✅ アクセシビリティチェック通過

### 7.3 パフォーマンス面
- ✅ ページ遷移が300ms以内
- ✅ バンドルサイズ増加が10%以内
- ✅ メモリリークなし

### 7.4 ドキュメント面
- ✅ API仕様ドキュメント更新
- ✅ 使用方法のサンプルコード追加
- ✅ CHANGELOG.md更新

## 8. 実装順序

1. **Phase 1**: NavigationProvider + useNavigation Hook
2. **Phase 2**: アクティブ状態判定機能
3. **Phase 3**: パンくずリスト生成機能
4. **Phase 4**: 既存コンポーネント統合
5. **Phase 5**: ページコンポーネント実装
6. **Phase 6**: エラーハンドリング + 404ページ
7. **Phase 7**: アクセシビリティ対応
8. **Phase 8**: パフォーマンス最適化

この要件定義に基づいて、TDDサイクル（Red-Green-Refactor）で段階的に実装を進めていきます。