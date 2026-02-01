# Technology Stack

## Project Type

Progressive Web Application (PWA) - ライブポーカーセッション追跡のためのフルスタックWebアプリケーション。モバイルとデスクトップの両方に対応し、ネイティブアプリに近い体験を提供。

## Core Technologies

### Primary Language(s)
- **Language**: TypeScript 5.8.2
- **Runtime**: Node.js (サーバーサイド)、ブラウザ (クライアントサイド)
- **Package Manager**: Bun

### Key Dependencies/Libraries

**フロントエンド:**
- **Next.js 15.2.3**: React 19ベースのフルスタックフレームワーク（App Router使用）
- **Mantine v8.3.10**: UIコンポーネントライブラリ（Charts, Form, Dates, Notifications含む）
- **TipTap v3.13.0**: リッチテキストエディタ
- **dnd-kit v6.3.1**: ドラッグ&ドロップ機能
- **Recharts 2**: データ可視化・チャート
- **Tabler Icons React v3.36.0**: アイコンライブラリ

**バックエンド:**
- **tRPC 11.0.0**: 型安全なAPIレイヤー
- **Drizzle ORM v0.41.0**: TypeScriptファーストのORM
- **NextAuth 5.0.0-beta.25**: 認証（Google, Discord OAuth + Email/Password）
- **Zod v3.24.2**: スキーマバリデーション
- **SuperJSON v2.2.1**: データシリアライゼーション

**状態管理:**
- **React Query (TanStack) v5.69.0**: サーバー状態管理とキャッシング

### Application Architecture

**フルスタックモノリス with App Router:**
- Next.js App Routerによるファイルベースルーティング
- Server Components (RSC) とClient Componentsのハイブリッド
- tRPCによる型安全なクライアント-サーバー通信（データ読み取り用）
- Server Actionsによるミューテーション処理（データ書き込み用）
- React Queryによるデータフェッチングと状態同期

**データフロー原則:**
- **読み取り（Query）**: Server Component → tRPC server caller でデータ取得 → Client Component に props で渡す
- **書き込み（Mutation）**: Client Component → Server Actions（`'use server'`）→ DB操作 → `revalidateTag()` でキャッシュ無効化 → `router.refresh()` で再取得
- Client Componentでは `useMutation` / `useQuery` を使用しない。Mutation は Server Actions、表示データは props 経由で受け取る

**レイヤー構造:**
```
src/
├── app/           # ルーティング・ページ（Next.js App Router）
├── components/    # UIコンポーネント
├── server/        # サーバーサイドロジック
│   ├── api/       # tRPCルーター・スキーマ
│   ├── db/        # データベーススキーマ・マイグレーション
│   └── auth/      # 認証設定
├── trpc/          # tRPCクライアント設定
├── contexts/      # Reactコンテキスト
└── lib/           # ユーティリティ
```

### Data Storage
- **Primary storage**: PostgreSQL（postgres driver v3.4.4経由）
- **ORM**: Drizzle ORM（マイグレーション、スキーマ定義）
- **Data formats**: JSON（API通信）、SuperJSON（複雑な型のシリアライゼーション）

### External Integrations
- **APIs**: Google Maps API（店舗位置情報）
- **Authentication**: OAuth 2.0（Google, Discord）、bcryptによるパスワードハッシュ
- **Protocols**: HTTP/REST（Next.js API Routes）、tRPC over HTTP

### Monitoring & Dashboard Technologies
- **Dashboard Framework**: React 19 + Mantine
- **Real-time Communication**: React Queryによるポーリング・リフェッチ
- **Visualization Libraries**: Recharts、Mantine Charts
- **State Management**: React Query（サーバー状態）、React Context（UI状態）

## Development Environment

### Build & Development Tools
- **Build System**: Next.js（Turbopack対応）、tsx（スクリプト実行）
- **Package Management**: Bun
- **Development workflow**: `bun run dev`でホットリロード、Turbopackによる高速ビルド

### Code Quality Tools
- **Static Analysis**: Biome v2.2.5（リンティング）
- **Formatting**: Biome v2.2.5（フォーマッティング）
- **Testing Framework**:
  - Unit/Integration: Vitest v4.0.15
  - E2E: Playwright v1.57.0
  - Component Preview: React Cosmos v7.1.0
  - Coverage: v8（80%閾値）
- **Type Checking**: TypeScript strict mode

### Version Control & Collaboration
- **VCS**: Git
- **Branching Strategy**: Feature branches + main
- **Code Review Process**: GitHub Pull Request

### Dashboard Development
- **Live Reload**: Next.js Fast Refresh / Turbopack HMR
- **Port Management**: 設定可能（デフォルト3000）

## Deployment & Distribution
- **Target Platform(s)**: Webブラウザ（モバイル・デスクトップ）
- **Distribution Method**: Webホスティング（PWAとしてインストール可能）
- **Installation Requirements**: モダンブラウザ、PostgreSQLデータベース
- **Update Mechanism**: Service Workerによる自動更新通知、version.json監視

## Technical Requirements & Constraints

### Performance Requirements
- セッション記録時の即座なUI反応
- React Queryによる効率的なキャッシングとバックグラウンド更新
- httpBatchStreamLinkによるAPI呼び出しのバッチ処理

### Compatibility Requirements
- **Platform Support**: モダンブラウザ（Chrome, Firefox, Safari, Edge）
- **Dependency Versions**: Node.js 18+, PostgreSQL 14+
- **Standards Compliance**: PWA仕様、OAuth 2.0

### Security & Compliance
- **Security Requirements**:
  - NextAuth middlewareによるルート保護
  - bcryptによるパスワードハッシュ化
  - JWTベースのセッション管理
- **Data Isolation**: マルチテナント設計（全クエリにuserIdフィルタ）
- **Threat Model**: ユーザーデータの分離、認証必須

### Scalability & Reliability
- **Expected Load**: 個人利用〜中規模ユーザーベース
- **Availability Requirements**: PWAによるオンライン依存（オフライン機能は将来検討）
- **Growth Projections**: ユーザー数増加に応じたDBスケーリング

## Technical Decisions & Rationale

### Decision Log
1. **Next.js App Router**: Server Componentsによるパフォーマンス最適化、React 19の最新機能活用
2. **tRPC**: フロントエンド-バックエンド間の完全な型安全性、コード生成不要
3. **Drizzle ORM**: TypeScriptネイティブ、軽量、マイグレーション機能充実
4. **Mantine**: 豊富なコンポーネント、日本語対応、アクセシビリティ
5. **Biome**: ESLint + Prettierの代替として高速な単一ツール
6. **Bun**: npm/yarnより高速なパッケージ管理とスクリプト実行

## Known Limitations

- **オフライン機能なし**: 現時点ではオンライン接続必須
- **リアルタイム同期**: WebSocket未実装（React Queryポーリングで対応）
- **NextAuth Beta**: 5.0.0-beta版使用による潜在的な破壊的変更リスク
- **日付メモ機能**: 現在保留中
