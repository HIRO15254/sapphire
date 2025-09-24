# レスポンシブレイアウト データフロー図

## システム全体のデータフロー

```mermaid
flowchart TD
    A[ブラウザイベント] --> B[ResizeObserver]
    A --> C[MediaQuery API]
    A --> D[ユーザーインタラクション]

    B --> E[BreakpointProvider]
    C --> E

    E --> F[ResponsiveLayout]
    F --> G{画面サイズ判定}

    G -->|≤768px| H[MobileLayout]
    G -->|>768px| I[DesktopLayout]

    H --> J[FooterNavigation]
    H --> K[HamburgerMenu]

    I --> L[HeaderNavigation]
    I --> M[SideNavigation]

    D --> N[NavigationProvider]
    N --> O[Route Change]
    O --> F
```

## レスポンシブ状態管理フロー

```mermaid
stateDiagram-v2
    [*] --> InitialLoad
    InitialLoad --> ScreenSizeDetection

    ScreenSizeDetection --> MobileMode : width ≤ 768px
    ScreenSizeDetection --> DesktopMode : width > 768px

    MobileMode --> MobileUI
    DesktopMode --> DesktopUI

    MobileUI --> FooterMenu
    MobileUI --> HamburgerMenu

    DesktopUI --> HeaderMenu
    DesktopUI --> SideMenu

    FooterMenu --> NavigationUpdate
    HamburgerMenu --> NavigationUpdate
    HeaderMenu --> NavigationUpdate
    SideMenu --> NavigationUpdate

    NavigationUpdate --> RouteChange
    RouteChange --> MobileMode : if mobile
    RouteChange --> DesktopMode : if desktop

    MobileMode --> DesktopMode : screen resize
    DesktopMode --> MobileMode : screen resize
```

## ユーザーインタラクションフロー

### モバイルユーザーのナビゲーション

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant FM as FooterMenu
    participant HM as HamburgerMenu
    participant NP as NavigationProvider
    participant R as Router
    participant ML as MobileLayout

    Note over U,ML: 主要画面への遷移
    U->>FM: フッターメニュータップ
    FM->>NP: ナビゲーション要求
    NP->>R: ルート変更
    R->>ML: 新しいページレンダリング
    ML-->>U: 画面更新

    Note over U,ML: 詳細画面への遷移
    U->>HM: ハンバーガーアイコンタップ
    HM->>HM: メニュー開く
    HM-->>U: メニュー表示
    U->>HM: メニュー項目タップ
    HM->>NP: ナビゲーション要求
    NP->>R: ルート変更
    R->>ML: 新しいページレンダリング
    HM->>HM: メニュー閉じる
    ML-->>U: 画面更新
```

### デスクトップユーザーのナビゲーション

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant HN as HeaderNavigation
    participant SN as SideNavigation
    participant NP as NavigationProvider
    participant R as Router
    participant DL as DesktopLayout

    Note over U,DL: 主要画面への遷移
    U->>HN: ヘッダーメニュークリック
    HN->>NP: ナビゲーション要求
    NP->>R: ルート変更
    R->>DL: 新しいページレンダリング
    DL-->>U: 画面更新

    Note over U,DL: 補助機能への遷移
    U->>SN: サイドメニュークリック
    SN->>NP: ナビゲーション要求
    NP->>R: ルート変更
    R->>DL: 新しいページレンダリング
    DL-->>U: 画面更新
```

## 画面サイズ変更時のフロー

```mermaid
sequenceDiagram
    participant B as Browser
    participant RO as ResizeObserver
    participant BP as BreakpointProvider
    participant RL as ResponsiveLayout
    participant MC as MobileComponents
    participant DC as DesktopComponents

    B->>RO: window resize
    RO->>BP: サイズ変更通知
    BP->>BP: ブレークポイント判定
    BP->>RL: レイアウトモード変更

    alt モバイルモードへ切り替え
        RL->>DC: コンポーネント非表示
        RL->>MC: コンポーネント表示
        MC-->>B: モバイルUIレンダリング
    else デスクトップモードへ切り替え
        RL->>MC: コンポーネント非表示
        RL->>DC: コンポーネント表示
        DC-->>B: デスクトップUIレンダリング
    end
```

## メニュー状態管理フロー

### ハンバーガーメニューの開閉

```mermaid
flowchart TD
    A[ハンバーガーアイコンタップ] --> B{メニュー状態確認}
    B -->|閉じている| C[メニューを開く]
    B -->|開いている| D[メニューを閉じる]

    C --> E[オーバーレイ表示]
    C --> F[メニューアニメーション]
    C --> G[スクロール無効化]
    C --> H[フォーカストラップ設定]

    D --> I[オーバーレイ非表示]
    D --> J[メニューアニメーション]
    D --> K[スクロール有効化]
    D --> L[フォーカス復帰]

    E --> M[メニュー表示完了]
    F --> M
    G --> M
    H --> M

    I --> N[メニュー非表示完了]
    J --> N
    K --> N
    L --> N
```

## アクセシビリティフロー

### キーボードナビゲーション

```mermaid
flowchart TD
    A[Tabキー入力] --> B[次のフォーカス可能要素へ]
    C[Shift+Tabキー入力] --> D[前のフォーカス可能要素へ]

    B --> E{要素タイプ判定}
    D --> E

    E -->|メニューボタン| F[ボタンフォーカス]
    E -->|メニュー項目| G[リンクフォーカス]
    E -->|メニュー境界| H[フォーカストラップ]

    F --> I[Enter/Space待機]
    G --> J[Enter待機]
    H --> K[最初/最後の要素へ]

    I --> L[メニュー開閉実行]
    J --> M[ナビゲーション実行]
    K --> B
```

## エラーハンドリングフロー

```mermaid
flowchart TD
    A[ユーザーアクション] --> B{JavaScript有効確認}
    B -->|無効| C[フォールバック動作]
    B -->|有効| D[通常処理]

    D --> E{CSS読み込み確認}
    E -->|失敗| F[最小限レイアウト]
    E -->|成功| G[完全レイアウト]

    C --> H[基本的なナビゲーション]
    F --> I[テキストベースメニュー]
    G --> J[リッチUIコンポーネント]

    H --> K[ページ遷移]
    I --> K
    J --> K
```

## パフォーマンス最適化フロー

### レンダリング最適化

```mermaid
flowchart TD
    A[状態変更] --> B[React.memo チェック]
    B -->|props変更なし| C[レンダリングスキップ]
    B -->|props変更あり| D[再レンダリング実行]

    D --> E[useMemo キャッシュ確認]
    E -->|キャッシュヒット| F[計算済み値使用]
    E -->|キャッシュミス| G[値再計算]

    G --> H[useCallback 確認]
    H -->|同じ依存配列| I[関数再利用]
    H -->|異なる依存配列| J[新しい関数作成]

    F --> K[仮想DOM更新]
    I --> K
    J --> K

    K --> L[必要最小限のDOM更新]
```