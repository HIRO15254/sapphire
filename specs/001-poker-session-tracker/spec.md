# Feature Specification: Live Poker Session Tracker

**Feature Branch**: `001-poker-session-tracker`
**Created**: 2025-12-12
**Status**: Draft
**Input**: User description: Japanese live poker session and hand tracking application for amusement poker venues

## Clarifications

### Session 2025-12-12

- Q: データ永続化・ホスティングのアプローチは？ → A: Postgres + NextAuth.js v5
- Q: UIの言語対応は？ → A: 日本語のみ
- Q: データエクスポート機能は必要か？ → A: 初期リリースでは不要
- Q: セッションデータの保持期間は？ → A: 無期限（ユーザーが削除するまで永久保存）
- Q: フロントエンドフレームワークは？ → A: Next.js

### Session 2025-12-15

- Q: All-inのEV計算において、勝敗結果も記録するか？ → A: 勝敗結果も記録し、実際の結果とEV期待値を比較可能にする
- Q: ホーム画面に表示する主要な情報は？ → A: アクティブセッションへのナビゲーション優先 + 統計サマリー表示
- Q: 統計サマリーの期間フィルターは必要か？ → A: あり（今月/先月/全期間/カスタム期間）
- Q: 同時に複数のアクティブセッションを持てるか？ → A: 1つのみ（新規開始時に既存があれば終了を促す）
- Q: ユーザーガイドの配置場所は？ → A: アプリ内ヘルプページ（/help または /guide）

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record a Completed Session (Archive Recording) (Priority: P1)

As a poker player, I want to quickly log a completed poker session after leaving the venue so that I can track my results without needing to record during play.

**Why this priority**: This is the core value proposition - players need to track their results to improve. Archive recording provides immediate value with minimal friction for users who don't want to record during play.

**Independent Test**: Can be fully tested by creating a session record with store, game, time range, buy-in, and cashout. Delivers value by showing session profit/loss immediately.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I create a new archive session with store, game, start/end time, buy-in, and cashout, **Then** the session is saved and profit/loss is calculated and displayed
2. **Given** I have recorded sessions, **When** I view my session history, **Then** I see all sessions with their results sorted by date
3. **Given** I am creating an archive session, **When** I select a store, **Then** I can only choose games available at that store
4. **Given** I am creating an archive session, **When** I enter buy-in/cashout amounts, **Then** I must select which currency type to use
5. **Given** I am recording a session, **When** I add all-in records with pot amount, win probability, and actual result (won/lost) for each, **Then** the All-in EV is calculated and displayed (sum of pot × win probability for each all-in)
6. **Given** I have a session with all-in records, **When** I view the session, **Then** I see total all-in count, total pot amount, average win rate, calculated All-in EV, actual result total, and EV差分 (expected vs actual)

---

### User Story 2 - Manage Virtual Currencies (Priority: P1)

As a player at Japanese amusement poker venues, I want to track my different virtual currency balances so that I know my holdings across different venue currencies and can track bonuses and purchases.

**Why this priority**: Japanese amusement poker uses venue-specific virtual currencies rather than real money. Without currency tracking, session results cannot be properly recorded or analyzed.

**Independent Test**: Can be fully tested by creating currencies, setting initial balance, recording bonuses and purchases. Delivers value by showing current holdings calculated from all transactions.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I create a new currency with a name and initial balance, **Then** the currency is saved and available for use in sessions and games
2. **Given** I have currencies, **When** I record a bonus receipt with amount and source, **Then** the bonus is logged and reflected in balance calculation
3. **Given** I have currencies, **When** I record a purchase with amount and optional note, **Then** the purchase is logged and reflected in balance calculation
4. **Given** I have multiple currencies, **When** I view my currencies, **Then** I see all currencies with their current balances (calculated from: initial balance + bonuses + purchases - session buy-ins + session cashouts)
5. **Given** I have a currency with sessions, **When** I view the currency balance breakdown, **Then** I see each component (initial, bonuses, purchases, session results) contributing to the total
6. **Given** I have a currency, **When** I view the currency detail, **Then** I see a list of related games (cash games and tournaments) that use this currency with links to their stores
7. **Given** I have a currency with transactions, **When** I view the currency detail, **Then** I see a unified transaction history showing sessions, bonuses, and purchases in chronological order

---

### User Story 3 - Manage Stores and Games (Priority: P2)

As a player, I want to register the poker venues I visit and the games they offer so that I can select them when recording sessions and track performance by location and game type.

**Why this priority**: Stores and games are prerequisites for meaningful session tracking. Without them, session data lacks context for analysis.

**Independent Test**: Can be fully tested by creating stores, adding games to stores, and viewing store details. Delivers value by organizing venue information.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I create a store with name and optional location, **Then** the store is saved to my account
2. **Given** I have a store, **When** I add a cash game (NLHE) with currency and rate, **Then** the game is associated with that store
3. **Given** I have a store, **When** I add a tournament (NLHE) with buy-in, prize structure, and blind structure, **Then** the tournament is associated with that store
4. **Given** I have stores with games, **When** I view a store, **Then** I see the store details and all games offered there

---

### User Story 4 - Active Session Recording (Priority: P2)

As a serious player, I want to record sessions in real-time while playing so that I can capture every hand and track my stack progression throughout the session.

**Why this priority**: Real-time recording enables detailed hand analysis and stack tracking. This is valuable for players serious about improvement but requires more effort than archive recording.

**Independent Test**: Can be fully tested by starting an active session, recording hands and stack changes, and completing the session. Delivers value by providing detailed session timeline.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I start an active session with store and game, **Then** an active session is created with start time
2. **Given** I have an active session, **When** I record a hand, **Then** the hand is saved to the session with timestamp
3. **Given** I have an active session, **When** I update my stack amount, **Then** the stack history is updated
4. **Given** I have an active session, **When** I record a rebuy or add-on, **Then** it is logged with timestamp and amount
5. **Given** I have an active session, **When** I end the session, **Then** the session is finalized with end time and cashout

---

### User Story 5 - Track Players at the Table (Priority: P3)

As a player, I want to record information about opponents I've played against so that I can reference notes about their play style in future sessions.

**Why this priority**: Player tracking enhances the value of session recording but is supplementary to the core session tracking functionality.

**Independent Test**: Can be fully tested by creating player profiles, adding notes, and viewing player history. Delivers value by building an opponent database.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I create a player with a name, **Then** the player is saved to my account
2. **Given** I have a player, **When** I add a tag to the player, **Then** the tag is associated with that player
3. **Given** I have a player, **When** I add a note for a specific date, **Then** the note is saved with the date
4. **Given** I am in an active session, **When** I add a player to the table, **Then** that player is associated with the session
5. **Given** I have players with session history, **When** I view a player, **Then** I see all sessions where they were present

---

### User Story 6 - Record Hand Details (Priority: P3)

As a player analyzing my play, I want to record detailed hand information including cards, actions, and results so that I can review and learn from specific situations.

**Why this priority**: Hand recording provides the deepest level of analysis but requires significant effort during play. It enhances active sessions but is not required for basic session tracking.

**Independent Test**: Can be fully tested by recording a hand with position, cards, actions by street, and result. Delivers value by creating a hand history for review.

**Acceptance Scenarios**:

1. **Given** I am in an active session, **When** I record a hand with my hole cards and position, **Then** the hand is saved with basic information
2. **Given** I am recording a hand, **When** I add actions for each street (preflop/flop/turn/river), **Then** the action sequence is saved
3. **Given** I am recording a hand, **When** I mark a hand as noteworthy, **Then** the hand is flagged for later review
4. **Given** I am recording a hand involving another player, **When** I pin the hand to that player's profile, **Then** the hand appears in that player's notable hands

---

### User Story 7 - User Authentication and Data Privacy (Priority: P1)

As a user, I want to securely log in and have my data kept private so that only I can access my poker records.

**Why this priority**: Authentication is fundamental for multi-user systems and data privacy. Without it, users cannot have private data.

**Independent Test**: Can be fully tested by registering, logging in, and verifying data isolation between accounts.

**Acceptance Scenarios**:

1. **Given** I am not registered, **When** I sign up with email and password, **Then** my account is created and I am logged in
2. **Given** I am not logged in, **When** I authenticate with Google, **Then** I am logged in to my account
3. **Given** I am not logged in, **When** I authenticate with Discord, **Then** I am logged in to my account
4. **Given** I am logged in, **When** I access the app, **Then** I only see my own data
5. **Given** I am logged in, **When** I log out, **Then** my session is ended and I cannot access protected features

---

### User Story 8 - Responsive Design and Theme Support (Priority: P2)

As a user, I want to use the app on both mobile and desktop with support for light and dark themes so that I can comfortably use it in any environment.

**Why this priority**: Mobile usability is critical since users will record sessions at venues using phones. Theme support reduces eye strain in low-light poker rooms.

**Independent Test**: Can be fully tested by accessing the app on different screen sizes and switching themes.

**Acceptance Scenarios**:

1. **Given** I access the app on mobile, **When** I navigate the interface, **Then** all features are accessible and usable on a small screen
2. **Given** I access the app on desktop, **When** I navigate the interface, **Then** the layout uses available space effectively
3. **Given** I am in the app, **When** I toggle the theme, **Then** the entire interface switches between light and dark modes
4. **Given** I set a theme preference, **When** I return to the app later, **Then** my preference is remembered

---

### User Story 9 - PWA and Offline Capability (Priority: P3)

As a player, I want to install the app and have it work reliably so that I can use it even with poor connectivity at venues.

**Why this priority**: PWA installation improves access and perceived performance. Some venues may have poor network connectivity.

**Independent Test**: Can be fully tested by installing the PWA and verifying basic functionality.

**Acceptance Scenarios**:

1. **Given** I am on the app in a supported browser, **When** I choose to install, **Then** the app is installed as a PWA
2. **Given** the app has been updated, **When** I access the app, **Then** I am notified of the update and can refresh to get the new version
3. **Given** I am using the installed PWA, **When** I launch it, **Then** it opens without browser chrome

---

### Edge Cases

- What happens when a user tries to create a session without any stores defined? System should prompt to create a store first or allow session without store association.
- What happens when a user deletes a store that has associated sessions? Sessions should retain store name but mark as "store deleted" to preserve historical data.
- What happens when a user deletes a currency that has associated transactions? Currency should be soft-deleted, preserving historical references.
- How does the system handle concurrent edits to an active session from multiple devices? Last-write-wins with timestamp; users should be warned about multi-device access.
- What happens when user loses connection during active session recording? User should be notified and encouraged to restore connection before continuing (no offline queue - requires network connectivity).
- What happens when a hand record is incomplete (missing required fields)? System should allow saving as draft and prompt for completion.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & User Management**
- **FR-001**: System MUST support user registration with email and password
- **FR-002**: System MUST support social login via Google OAuth
- **FR-003**: System MUST support social login via Discord OAuth
- **FR-004**: System MUST isolate user data so each user only sees their own records
- **FR-005**: System MUST allow users to log out and clear their session

**Currency Management**
- **FR-010**: System MUST allow users to create named currencies with an initial balance
- **FR-011**: System MUST calculate current balance as: initial balance + sum of bonuses + sum of purchases - sum of session buy-ins + sum of session cashouts
- **FR-012**: System MUST allow users to record bonus receipts with amount and optional source description
- **FR-013**: System MUST allow users to record purchases with amount and optional note
- **FR-014**: System MUST display balance breakdown showing each component (initial, bonuses, purchases, session results)

**Store Management**
- **FR-020**: System MUST allow users to create stores with name
- **FR-021**: System MUST allow users to record store location (latitude/longitude or address)
- **FR-022**: System MUST allow users to add notes to stores in rich text format
- **FR-023**: System MUST associate games with specific stores

**Game Management**
- **FR-030**: System MUST support cash game records with currency and rate (NLHE only)
- **FR-031**: System MUST support tournament records with currency, buy-in, prize structure, and blind structure (NLHE only)
- **FR-032**: System MUST allow notes in rich text format for each game

**Session Management - Archive**
- **FR-040**: System MUST allow archive session creation with store, game, start time, end time, buy-in, and cashout
- **FR-040a**: System MUST allow editing existing archive sessions (store, game, times, buy-in, cashout, notes)
- **FR-041**: System MUST calculate and display profit/loss for each session
- **FR-042**: System MUST allow recording individual all-in situations with pot amount, win probability (0-100%), actual result (won/lost), and "Run it X times" support (number of runouts and wins in runout)
- **FR-043**: System MUST calculate All-in EV as sum of (pot amount × win probability) for all all-ins in a session
- **FR-044**: System MUST display main profit/loss and EV-adjusted profit on session detail. EV-adjusted profit is calculated as "actual profit - EV difference" representing skill-based profit excluding luck variance. All-in records table shows actual result and EV difference for each all-in
- **FR-045**: System MUST allow session notes in rich text format

**Session Management - Active**
- **FR-050**: System MUST allow starting an active session with store and game (limited to one active session per user; if existing active session, prompt to end it first)
- **FR-051**: System MUST track players present at the table during active sessions
- **FR-052**: System MUST allow recording hands during active sessions
- **FR-053**: System MUST track stack progression during active sessions
- **FR-054**: System MUST allow recording rebuys and add-ons with timestamps
- **FR-055**: System MUST allow converting active sessions to completed archive sessions

**Player Management**
- **FR-060**: System MUST allow creating player profiles with name
- **FR-061**: System MUST allow tagging players with user-defined tags
- **FR-062**: System MUST allow date-specific notes for each player
- **FR-063**: System MUST allow general notes for each player in rich text format
- **FR-064**: System MUST track which stores/games a player has been encountered at
- **FR-065**: System MUST allow pinning specific hands to player profiles

**Hand Recording**
- **FR-070**: System MUST allow recording hands within active sessions
- **FR-071**: System MUST support recording hole cards for the user
- **FR-072**: System MUST support recording position at the table
- **FR-073**: System MUST support recording actions by street (preflop, flop, turn, river)
- **FR-074**: System MUST support recording board cards
- **FR-075**: System MUST support marking hands as noteworthy
- **FR-076**: System MUST allow hand notes in rich text format

**User Interface**
- **FR-080**: System MUST provide responsive design for mobile and desktop
- **FR-081**: System MUST support light and dark themes
- **FR-082**: System MUST remember user theme preference
- **FR-083**: System MUST be installable as a PWA
- **FR-084**: System MUST provide cache update mechanism for new versions
- **FR-085**: System MUST display home screen with: (1) prominent navigation to active session if one exists, (2) summary statistics (total profit/loss, session count, etc.), (3) recent sessions list
- **FR-086**: System MUST provide period filter for statistics with options: this month, last month, all time, and custom date range

**Data & Content**
- **FR-090**: System MUST store all user data persistently
- **FR-091**: System MUST include comprehensive user guide as in-app help pages (accessible via /help or /guide route)

### Key Entities

- **User**: Represents a registered user; has credentials/social auth links; owns all other entities
- **Currency**: Virtual currency at a venue; has name, initial balance; balance is calculated from transactions
- **BonusTransaction**: Record of bonus received; has amount, source, timestamp; belongs to a currency
- **PurchaseTransaction**: Record of currency purchase; has amount, note, timestamp; belongs to a currency
- **Store**: Poker venue; has name, location, notes; contains multiple games
- **Game**: Either cash game or tournament (NLHE only); has currency link, rate/buy-in; belongs to a store
- **Session**: Playing session (archive or active); has store link, game link, times, buy-in, cashout, notes; contains hands and all-in records
- **AllInRecord**: Individual all-in situation; has pot amount, win probability, actual result (won/lost), "Run it X times" support (runout count, wins in runout); belongs to session; used to calculate All-in EV and EV-adjusted profit
- **Player**: Opponent profile; has name, tags, notes; linked to sessions and hands
- **PlayerTag**: User-defined tag; has name; can be assigned to multiple players
- **Hand**: Individual hand record; has cards, position, actions, board, notes; belongs to session; can be pinned to players
- **StackUpdate**: Stack amount at a point in time; belongs to active session
- **RebuyAddon**: Rebuy or add-on record; has amount, timestamp, type; belongs to active session

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can record an archive session in under 60 seconds
- **SC-002**: Users can start an active session and record their first hand in under 30 seconds
- **SC-003**: System supports 1,000 concurrent users with p99 latency < 2s and error rate < 0.1%
- **SC-004**: All pages load within 2 seconds on 3G mobile connections
- **SC-005**: 90% of users successfully complete their first session recording on first attempt (measured via E2E test scenarios covering all happy paths)
- **SC-006**: Users can switch between light and dark themes instantly (under 100ms)
- **SC-007**: PWA installation completes successfully on all supported browsers (Chrome, Safari, Edge, Firefox)
- **SC-008**: Users can access their data from any device after logging in
- **SC-009**: Session profit/loss calculations are 100% accurate
- **SC-010**: User guide covers all features with the following sections: セッション記録, 通貨管理, 店舗・ゲーム管理, プレイヤー管理, ハンド記録, テーマ設定, PWAインストール

## Assumptions

- Users have basic familiarity with poker terminology (positions, actions, etc.)
- Japanese amusement poker venues use virtual currencies rather than real money
- Users have intermittent internet connectivity at venues (hence PWA support)
- Rich text notes use HTML format for storage and rendering
- Game variant is limited to NLHE (No-Limit Hold'em) for initial release
- Blind structures are stored as structured data (levels with blind amounts and durations)
- Prize structures are stored as structured data (payout percentages or amounts by position)
- Location data can be either coordinates or free-text address
- All dates/times are stored in UTC and displayed in user's local timezone
- All-in EV calculation: sum of (pot amount × win probability) for each all-in recorded in the session
- Currency balance is always calculated (not stored directly) to ensure accuracy with transactions
- Tech stack: PostgreSQL database with NextAuth.js v5 for authentication (supports email/password and OAuth providers)
- UI language: Japanese only (日本語のみ); no internationalization required for initial release
- Data export: Not required for initial release; may be added in future versions
- Data retention: Indefinite; user data is stored permanently until explicitly deleted by the user
- Frontend framework: Next.js (React-based with SSR/SSG support, excellent NextAuth.js integration, PWA-ready)
