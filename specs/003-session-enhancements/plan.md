# Implementation Plan: ポーカーセッション記録機能の改善

**Branch**: `003-session-enhancements` | **Date**: 2025-10-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-session-enhancements/spec.md`

## Summary

既存のポーカーセッション記録機能を改善し、UX向上とデータ管理の柔軟性を実現する。主な改善点は以下の通り:

1. **モーダルUI**: セッション追加・編集をモーダルウィンドウで実行し、画面遷移を削減
2. **場所の正規化**: 場所を独立したDBエンティティとして管理し、オートコンプリート機能を提供
3. **リッチテキストメモ**: Tiptapエディタを使用してHTML形式のメモを記録
4. **タグシステム**: 多対多関係でセッションにタグを設定し、柔軟なフィルタリングを実現

**Clarification (2025-10-26)**: 場所/タグの削除時、参照しているセッションは保持され、場所は「削除された場所」デフォルト値に置換、タグは関連付けのみ削除される（FR-020, FR-021）。

技術的アプローチ:
- Mantine v8のModalコンポーネントでモーダルUI実装
- PostgreSQLの正規化テーブル設計（locations、tags、session_tags）
- Tiptap v2 + @mantine/tiptap + DOMPurifyでセキュアなリッチテキスト編集
- tRPC v11で型安全なAPI拡張

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19 + Next.js 15 (App Router)
**Primary Dependencies**: Mantine v8, TanStack Query v5, tRPC v11, Drizzle ORM v0.41, Tiptap v2, DOMPurify
**Storage**: PostgreSQL 16 (Docker Compose)
**Testing**: Vitest v2 (契約・統合テスト), @testing-library/react, Playwright v1 (E2E)
**Target Platform**: Web (Next.js フルスタックアプリ)
**Project Type**: Web - フロントエンド+バックエンド統合型Next.jsアプリ
**Performance Goals**:
- モーダル開閉 < 200ms
- セッション記録 < 60秒
- タグフィルタリング < 1秒（1000セッション）
- オートコンプリート < 300ms

**Constraints**:
- XSS攻撃成功率 0%（DOMPurifyによるサニタイズ）
- HTMLメモ最大50,000文字
- タグ最大20個/セッション
- WCAG 2.1 AA準拠

**Scale/Scope**:
- 想定ユーザー数: 100〜10,000
- セッション数: 100〜1000/ユーザー
- 場所数: 10〜50/ユーザー
- タグ数: 10〜100/ユーザー

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 憲法遵守チェックリスト

- [x] **テスト駆動開発**: すべての機能にテストファーストアプローチを適用する計画があるか?
  - 契約テスト: tRPC procedures（sessions、locations、tags）
  - 統合テスト: モーダルフォーム、場所選択、タグ選択、リッチテキストエディタ
  - E2Eテスト: セッション作成・編集・削除・フィルタリングフロー

- [x] **仕様の明確化**: 不明確な要件はすべて特定され、明確化プロセスが計画されているか?
  - research.mdで技術的判断をすべて文書化
  - /speckit.clarifyで削除動作を明確化（FR-020, FR-021追加）
  - タグ最大数、メモ最大長、HTMLサニタイゼーション戦略を明確化済み

- [x] **日本語ファースト**: ドキュメント、UI、コミュニケーションが日本語で計画されているか?
  - quickstart.md: 日本語ユーザーガイド
  - エラーメッセージ: 日本語で解決策を提示
  - コミットメッセージ: 日本語

- [x] **レイヤー分離**: バックエンド(API層)とフロントエンド(Container層/Presentation層)の責務が明確に分離されているか?
  - API層: tRPC routers（sessions、locations、tags）、Zodバリデーション、ビジネスロジック
  - Container層: モーダル状態管理、フォーム状態、API呼び出し
  - Presentation層: SessionModal、SessionForm、LocationSelect、TagMultiSelect、RichTextEditor

- [x] **コードレビュープロセス**: こまめなレビューとコミット承認プロセスが計画されているか?
  - 機能単位（P1→P2→P3→P4）で段階的にレビュー・コミット
  - 各優先度完了時にレビュー依頼

- [x] **UX一貫性**: 一貫したユーザー体験を提供する設計方針があるか?
  - Mantine v8コンポーネントで統一されたUIデザイン
  - WCAG 2.1 AA準拠（キーボードナビゲーション、aria-live、ラベル）
  - レスポンシブデザイン（デスクトップ・タブレット・モバイル）

- [x] **ドキュメンテーション**: ユーザーガイド、クイックスタート、ヘルプの作成が計画されているか?
  - quickstart.md: 詳細なユーザーガイド（基本操作、FAQ、トラブルシューティング）
  - data-model.md: データモデル仕様
  - sessions-api.md: API契約定義（削除エンドポイント追加）
  - research.md: 技術的判断の根拠

**遵守状況**: すべて遵守

## Project Structure

### Documentation (this feature)

```
specs/003-session-enhancements/
├── spec.md              # 機能仕様（clarification含む）
├── plan.md              # このファイル（実装計画）
├── research.md          # Phase 0 output（技術調査）
├── data-model.md        # Phase 1 output（データモデル+削除動作）
├── quickstart.md        # Phase 1 output（ユーザーガイド）
├── contracts/           # Phase 1 output（API契約+削除エンドポイント）
│   └── sessions-api.md
├── checklists/          # 品質チェックリスト
│   └── requirements.md
└── tasks.md             # Phase 2 output（/speckit.tasks - このコマンドでは作成しない）
```

### Source Code (repository root)

```
src/
├── app/                          # Next.js App Router
│   ├── poker-sessions/           # セッション管理ページ（既存を更新）
│   │   ├── page.tsx              # 一覧画面（モーダル追加）
│   │   ├── new/page.tsx          # 削除（モーダルに移行）
│   │   └── [id]/
│   │       ├── page.tsx          # 詳細画面
│   │       └── edit/page.tsx     # 削除（モーダルに移行）
│   └── api/trpc/[trpc]/route.ts  # tRPC エンドポイント
│
├── server/                       # バックエンド(API層)
│   ├── api/
│   │   ├── routers/
│   │   │   ├── sessions.ts      # 更新（locationId, tagIds対応）
│   │   │   ├── locations.ts     # 新規（getAll, create, delete）
│   │   │   └── tags.ts          # 新規（getAll, create, delete）
│   │   ├── root.ts               # 更新（locations, tags router追加）
│   │   └── trpc.ts
│   └── db/
│       ├── schema.ts             # 更新（locations, tags, session_tags追加）
│       ├── migrations/           # マイグレーションスクリプト
│       │   └── add-default-deleted-location.sql  # 新規（削除された場所デフォルト値）
│       └── index.ts
│
├── features/                     # フロントエンド機能
│   └── poker-sessions/
│       ├── components/           # Presentationコンポーネント
│       │   ├── SessionModal.tsx            # 新規（モーダルコンポーネント）
│       │   ├── SessionForm.tsx             # 新規（フォーム本体）
│       │   ├── LocationSelect.tsx          # 新規（場所選択）
│       │   ├── TagMultiSelect.tsx          # 新規（タグ選択）
│       │   ├── RichTextEditor.tsx          # 新規（リッチテキストエディタ）
│       │   ├── SessionCard.tsx             # 更新（tags表示追加）
│       │   └── SessionList.tsx             # 更新（タグフィルター追加）
│       │
│       ├── containers/           # Containerコンポーネント
│       │   ├── SessionModalContainer.tsx   # 新規（モーダル状態管理）
│       │   ├── SessionFormContainer.tsx    # 新規（フォーム状態・API）
│       │   ├── LocationSelectContainer.tsx # 新規（場所データ取得）
│       │   ├── TagMultiSelectContainer.tsx # 新規（タグデータ取得）
│       │   └── SessionListContainer.tsx    # 更新（フィルター状態）
│       │
│       └── hooks/
│           ├── useSessionModal.ts          # 新規（モーダル開閉状態）
│           ├── useSessionForm.ts           # 新規（フォーム状態）
│           ├── useLocations.ts             # 新規（場所データ）
│           └── useTags.ts                  # 新規（タグデータ）
│
└── lib/
    └── utils/
        ├── currency.ts           # 既存
        └── sanitize.ts           # 新規（HTMLサニタイゼーション）

tests/
├── contract/                     # 契約テスト
│   ├── sessions.test.ts          # 更新（新API追加）
│   ├── locations.test.ts         # 新規（削除動作テスト含む）
│   └── tags.test.ts              # 新規（削除動作テスト含む）
│
├── integration/                  # 統合テスト
│   ├── create-session-modal.test.tsx     # 新規（モーダルでセッション作成）
│   ├── edit-session-modal.test.tsx       # 新規（モーダルで編集）
│   ├── location-select.test.tsx          # 新規（場所選択）
│   ├── tag-multi-select.test.tsx         # 新規（タグ選択）
│   ├── rich-text-editor.test.tsx         # 新規（リッチテキスト）
│   ├── filter-by-tags.test.tsx           # 新規（タグフィルター）
│   └── delete-location-tag.test.tsx      # 新規（削除動作テスト）
│
└── e2e/                          # E2Eテスト
    ├── session-modal.spec.ts     # 新規（モーダルフロー）
    ├── locations.spec.ts         # 新規（場所管理+削除）
    ├── tags.spec.ts              # 新規（タグ管理+削除）
    └── filters.spec.ts           # 更新（タグフィルター追加）
```

**Structure Decision**: Web アプリケーション構造を継続。既存の`src/`ディレクトリに新規コンポーネント・ルーター・テーブルを追加。Next.js App Routerを活用し、`/poker-sessions/new`と`/poker-sessions/[id]/edit`ページを削除してモーダルに移行することで、ページ数を削減しUXを向上させる。

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**遵守状況**: すべて遵守のため、この表は空白

## Phase 0: Research (完了)

**Output**: [research.md](./research.md)

### 調査項目と結論

1. **Mantine Modal Component**: Mantine v8の`Modal`を使用（アクセシビリティ対応、レスポンシブ）
2. **Location Management**: `Select`コンポーネント（searchable, creatable）+ `locations`テーブル
3. **Rich Text Editor**: Tiptap v2 + @mantine/tiptap + DOMPurify
4. **Tagging System**: `tags`テーブル + `session_tags`中間テーブル + `MultiSelect`
5. **tRPC Router Updates**: 既存`sessions` router拡張 + 新規`locations`, `tags` router（削除エンドポイント含む）
6. **Component Architecture**: Presentation/Container分離パターン継続
7. **Migration Strategy**: 段階的マイグレーション（新規テーブル作成 → データ移行 → 既存カラム削除）
8. **Deletion Strategy**: 場所削除時はデフォルト値「削除された場所」に置換、タグ削除時は関連のみ削除（FR-020, FR-021）

### 新規依存関係

```json
{
  "dependencies": {
    "@tiptap/react": "^2.10.4",
    "@tiptap/starter-kit": "^2.10.4",
    "@tiptap/extension-link": "^2.10.4",
    "@mantine/tiptap": "^8.3.5",
    "dompurify": "^3.2.5"
  },
  "devDependencies": {
    "@types/dompurify": "^3.2.0"
  }
}
```

## Phase 1: Design & Contracts (完了)

**Prerequisites:** `research.md` complete ✓

### 成果物

1. **data-model.md**: データモデル定義完了（削除動作を含む）
   - 新規テーブル: `locations`, `tags`, `session_tags`
   - 既存テーブル更新: `poker_sessions` (location → locationId, notes → HTML)
   - 削除動作: FR-020（場所デフォルト値置換）、FR-021（タグ関連削除）
   - マイグレーション戦略（デフォルト場所作成を含む）
   - クエリパターン
   - パフォーマンス考慮事項

2. **contracts/sessions-api.md**: API契約定義完了（削除エンドポイント追加）
   - `sessions` router拡張（create, update, getAll, getFiltered, getById, delete）
   - `locations` router新規（getAll, create, **delete**）
   - `tags` router新規（getAll, create, **delete**）
   - Zodスキーマ定義
   - エラーハンドリング
   - HTMLサニタイゼーション仕様

3. **quickstart.md**: ユーザーガイド完了
   - 基本的な使い方
   - FAQ（10項目）
   - トラブルシューティング
   - ヒントとベストプラクティス

4. **Agent Context Update**: CLAUDE.md更新済み

### 憲法チェック再評価（Phase 1完了後）

すべての憲法原則が設計に反映されていることを確認:

- [x] **TDD**: 契約・統合・E2Eテストの計画が明確（削除動作テスト含む）
- [x] **仕様明確化**: すべての技術的不明点が research.md で解決済み、/speckit.clarifyで削除動作明確化
- [x] **日本語ファースト**: ドキュメントすべて日本語
- [x] **レイヤー分離**: API層、Container層、Presentation層が明確に分離
- [x] **コードレビュー**: 優先度ごとにレビュープロセスを計画
- [x] **UX一貫性**: Mantine v8で統一、WCAG 2.1 AA準拠
- [x] **ドキュメンテーション**: quickstart.md、data-model.md、contracts完備

**結論**: 設計フェーズ完了、実装準備完了

## Implementation Priority

### P1: モーダルでのセッション追加（MVP）

**目標**: セッション一覧からモーダルでセッションを記録できる

**Tasks**:
1. データベーススキーマ更新（locations, tags, session_tags追加、デフォルト場所作成）
2. マイグレーションスクリプト作成・実行
3. tRPC routers実装（sessions拡張、locations、tags新規）
4. Presentationコンポーネント実装（SessionModal、SessionForm、LocationSelect、TagMultiSelect）
5. Containerコンポーネント実装（状態管理、API呼び出し）
6. 既存一覧画面にモーダル統合
7. `/poker-sessions/new`ページ削除
8. テスト実装（契約・統合・E2E）

**Success Criteria**: SC-001（セッション記録 < 60秒）、SC-007（モーダル開閉 < 200ms）

---

### P2: 場所の管理と選択

**目標**: 場所のオートコンプリートと新規追加、削除機能

**Tasks**:
1. LocationSelectコンポーネント実装
2. locations APIテスト・実装（削除エンドポイント含む）
3. 既存セッションデータ移行検証
4. オートコンプリート機能テスト
5. 場所削除機能テスト（デフォルト値置換確認）

**Success Criteria**: SC-002（場所入力時間80%削減）、SC-008（重複率0%）

---

### P3: リッチテキストメモの記録

**目標**: HTML形式のメモをセキュアに記録・表示

**Tasks**:
1. Tiptap依存関係追加
2. RichTextEditorコンポーネント実装
3. DOMPurifyサニタイゼーション実装（フロントエンド+バックエンド）
4. 既存プレーンテキストメモの互換性確認
5. XSS攻撃テスト

**Success Criteria**: SC-003（5種類以上の書式設定）、SC-004（書式崩れ0%）、SC-009（XSS攻撃成功率0%）

---

### P4: タグによる分類とフィルタリング

**目標**: タグでセッションを分類・フィルタリング、削除機能

**Tasks**:
1. TagMultiSelectコンポーネント実装
2. tags APIテスト・実装（削除エンドポイント含む）
3. フィルタリングロジック実装（AND条件）
4. タグフィルターUI実装
5. パフォーマンステスト（1000セッション）
6. タグ削除機能テスト（関連削除確認）

**Success Criteria**: SC-005（フィルタリング < 1秒）、SC-006（オートコンプリート < 300ms）、SC-008（重複率0%）

---

## Testing Strategy

### Test-First Development (憲法原則 I)

すべての優先度で以下のサイクルを遵守:

1. **Red**: テストを先に作成し、失敗を確認
2. **Green**: 実装してテストを通す
3. **Refactor**: コードを改善

### Test Layers

#### 1. 契約テスト (Vitest)

tRPC proceduresの入出力を検証（削除動作を含む）:

```typescript
// tests/contract/locations.test.ts
describe('locations.delete', () => {
  it('should replace deleted location with default in sessions', async () => {
    // 場所を作成
    const location = await caller.locations.create({ name: 'Casino A' });
    // セッション作成
    const session = await caller.sessions.create({
      locationId: location.id,
      // ... other fields
    });
    // 場所削除
    const result = await caller.locations.delete({ id: location.id });
    expect(result.success).toBe(true);
    expect(result.affectedSessions).toBe(1);

    // セッション確認
    const updatedSession = await caller.sessions.getById({ id: session.id });
    expect(updatedSession.location.name).toBe('削除された場所');
  });
});
```

#### 2. 統合テスト (Vitest + React Testing Library)

ユーザーストーリー全体の動作を検証:

```typescript
// tests/integration/delete-location-tag.test.tsx
describe('Delete Location with Sessions', () => {
  it('should show default location after deletion', async () => {
    // 場所を持つセッションを作成
    // 場所削除
    // セッション一覧で「削除された場所」が表示されることを確認
  });
});
```

#### 3. E2Eテスト (Playwright)

実際のブラウザ動作を検証:

```typescript
// tests/e2e/locations.spec.ts
test('delete location updates sessions', async ({ page }) => {
  // 場所作成、セッション作成
  // 場所削除
  // セッション一覧で「削除された場所」表示確認
});
```

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| XSS攻撃（HTMLメモ） | Medium | Critical | DOMPurifyで二重サニタイゼーション（フロント+バック） |
| 既存データ移行失敗 | Low | High | マイグレーションスクリプトをテスト環境で検証、ロールバック計画 |
| デフォルト場所の破損/削除 | Low | Medium | システム保護（削除不可フラグ）、起動時チェック |
| パフォーマンス低下（タグフィルター） | Low | Medium | インデックス最適化、クエリ最適化、1000セッションでテスト |
| 大量セッション更新（場所削除） | Low | Medium | バッチ更新、トランザクション、パフォーマンステスト |
| モーダルのアクセシビリティ問題 | Low | Medium | WCAG 2.1 AA準拠チェック、キーボードナビゲーションテスト |
| Tiptap統合の複雑さ | Medium | Low | research.mdで技術調査完了、シンプルな拡張のみ使用 |

## Success Validation

実装完了後、以下のSuccess Criteriaをすべて検証:

- [ ] **SC-001**: セッション記録 < 60秒（E2Eテストで計測）
- [ ] **SC-002**: 場所入力時間80%削減（ユーザーテスト）
- [ ] **SC-003**: 5種類以上の書式設定対応（統合テスト）
- [ ] **SC-004**: 書式崩れ0%（E2Eテスト）
- [ ] **SC-005**: タグフィルタリング < 1秒（パフォーマンステスト）
- [ ] **SC-006**: オートコンプリート < 300ms（パフォーマンステスト）
- [ ] **SC-007**: モーダル開閉 < 200ms（E2Eテスト）
- [ ] **SC-008**: 重複率0%（統合テスト）
- [ ] **SC-009**: XSS攻撃成功率0%（セキュリティテスト）
- [ ] **SC-010**: ユーザー満足度90%以上（ユーザーフィードバック）

## Related Documentation

- **Spec**: [spec.md](./spec.md) （削除動作clarification含む）
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md) （削除動作仕様含む）
- **API Contracts**: [contracts/sessions-api.md](./contracts/sessions-api.md) （削除エンドポイント含む）
- **User Guide**: [quickstart.md](./quickstart.md)

## Next Steps

1. `/speckit.tasks`を実行してタスクリストを生成
2. P1（モーダルでのセッション追加）から実装開始
3. 各タスク完了後にレビュー依頼
4. すべての優先度完了後、Success Criteria検証

---

**Version**: 1.1 (Updated with FR-020/FR-021 deletion behavior)
**Status**: Planning Complete - Ready for Implementation
**Last Updated**: 2025-10-26
