# Feature Specification: Poker Session Tracker

**Feature Branch**: `002-poker-session-tracker`
**Created**: 2025-10-21
**Status**: Draft
**Input**: User description: "このテンプレートから出発して、ポーカーにおけるセッション結果の記録アプリケーションを作成したいです。実際のアプリケーションを作成する前に、テンプレートを書き換えてアプリケーションのものに置き換えたいです。ログイン機能を作成して、ログインユーザーごとにデータを保存するようにしてください。"

## User Scenarios & Testing *(mandatory)*

### User Story 0 - User Registration and Authentication (Priority: P0)

A new user wants to create an account and securely log in to track their personal poker sessions, with their data kept separate from other users.

**Why this priority**: Authentication is the foundation for multi-user support. Without it, the application cannot maintain separate data for each user. This must be implemented first before any session tracking can be properly scoped to individual users.

**Independent Test**: Can be fully tested by creating a new account, logging out, logging back in, and verifying that the user can only see their own data.

**Acceptance Scenarios**:

1. **Given** a new user visits the application, **When** they click "Sign in with Google" or "Sign in with GitHub", **Then** they are redirected to the OAuth provider, authenticate, and return with a new account created
2. **Given** a registered user with saved sessions, **When** they log out and log back in via their OAuth provider, **Then** they can access their own sessions and cannot see other users' sessions
3. **Given** a user attempts to sign in with an OAuth provider account already linked to the application, **Then** they are logged into their existing account (not a duplicate)
4. **Given** an unauthenticated user, **When** they attempt to access session data or features, **Then** they are redirected to the login page
5. **Given** a user is logged in, **When** they request to log out, **Then** their session is terminated and they are returned to the login page

---

### User Story 1 - Record Basic Session Results (Priority: P1)

A logged-in poker player finishes a playing session and wants to quickly record the essential details: where they played, how long they played, how much money they brought and how much they left with. The session is saved to their personal account.

**Why this priority**: This is the core functionality - without the ability to record sessions, the application has no value. This represents the minimum viable product that delivers immediate value to users who want to track their poker performance.

**Independent Test**: Can be fully tested by logging in, entering a single poker session with buy-in amount, cash-out amount, session duration, and location, then verifying the session is saved under the user's account and can be viewed later.

**Acceptance Scenarios**:

1. **Given** a logged-in user accesses the session entry form, **When** they enter session details (date, location, buy-in, cash-out, duration), **Then** the session is saved to their account and the profit/loss is automatically calculated
2. **Given** a user has saved sessions, **When** they view their session history, **Then** they see only their own sessions with all entered details and calculated results
3. **Given** a user is entering session details, **When** they provide a buy-in amount and cash-out amount, **Then** the system displays the net profit or loss for that session

---

### User Story 2 - View Session History and Basic Statistics (Priority: P2)

A logged-in poker player wants to review their past sessions to understand their overall performance trends and see basic statistics like total profit/loss, number of sessions played, and average session results for their personal account.

**Why this priority**: Once users can record sessions, the next most valuable feature is being able to analyze that data. This provides the primary benefit of tracking - understanding performance over time.

**Independent Test**: Can be tested by logging in, creating multiple sessions with varying results, then viewing the history list and summary statistics to verify accurate calculations and display of only the user's own data.

**Acceptance Scenarios**:

1. **Given** a logged-in user has recorded multiple sessions, **When** they view their session history, **Then** they see a chronological list of only their own sessions with key details (date, location, profit/loss)
2. **Given** a user has session data, **When** they view statistics, **Then** they see total profit/loss, total number of sessions, and average profit/loss calculated only from their own sessions
3. **Given** a user has sessions recorded at different locations, **When** viewing statistics, **Then** they can see their personal performance broken down by location

---

### User Story 3 - Add Detailed Session Notes (Priority: P3)

A logged-in poker player wants to add notes to their own sessions to remember important hands, playing conditions, table dynamics, or lessons learned during that session.

**Why this priority**: While valuable for serious players who want to improve, note-taking is not essential for the core tracking functionality. Users can get value from basic session tracking without detailed notes.

**Independent Test**: Can be tested by logging in, adding notes to a session during creation or editing, then verifying the notes are saved to the user's session and displayed when viewing that session.

**Acceptance Scenarios**:

1. **Given** a logged-in user is recording a session, **When** they enter text in a notes field, **Then** the notes are saved with their session
2. **Given** a user has a session with notes, **When** they view that session, **Then** the notes are displayed along with other session details
3. **Given** a user has an existing session, **When** they edit it to add or modify notes, **Then** the updated notes are saved to their session

---

### User Story 4 - Filter and Search Sessions (Priority: P4)

A logged-in poker player wants to find specific sessions within their own data or analyze specific subsets, such as all sessions at a particular location, sessions within a date range, or only winning/losing sessions.

**Why this priority**: This becomes valuable as users accumulate many sessions, but is not necessary when starting out with few sessions. It's an enhancement that improves usability for experienced users.

**Independent Test**: Can be tested by logging in, creating sessions with varied attributes under the user's account, then applying different filters (location, date range, profit/loss) and verifying only matching sessions from the user's own data appear.

**Acceptance Scenarios**:

1. **Given** a logged-in user has multiple sessions, **When** they filter by location, **Then** only their own sessions at that location are displayed
2. **Given** a user has multiple sessions, **When** they filter by date range, **Then** only their own sessions within that range are displayed
3. **Given** a user has sessions with varied results, **When** they filter to show only winning sessions, **Then** only their own sessions with positive profit are displayed

---

### Edge Cases

**Authentication & Authorization**:
- What happens when a user attempts to access another user's session data directly (e.g., via URL manipulation)?
- What happens when a user's authentication session expires while they are entering data?
- What happens when OAuth provider authentication fails or is cancelled by the user?
- What happens when the OAuth provider is temporarily unavailable?
- What happens when a user tries to sign in from a different OAuth provider than they originally registered with?

**Session Data Entry**:
- What happens when a user enters a cash-out amount less than their buy-in (loss scenario)?
- What happens when buy-in and cash-out amounts are equal (break-even session)?
- How does the system handle sessions with very long durations (e.g., 24+ hour sessions)?
- What happens when a user enters a session with a date in the future?
- How does the system handle decimal/fractional currency amounts?
- What happens when required fields are left empty?

**Data Management**:
- How does the system handle editing or deleting a session that contributes to statistics?
- What happens when there are no sessions to display in history or statistics views?
- What happens when a user deletes all their sessions?
- What happens when a new user with zero sessions views statistics?

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & User Management**:
- **FR-001**: System MUST allow new users to sign in using OAuth2 providers (Google and GitHub at minimum)
- **FR-002**: System MUST create a new user account automatically upon first OAuth2 sign-in
- **FR-003**: System MUST link OAuth2 provider accounts to user accounts (preventing duplicate accounts for the same provider identity)
- **FR-004**: System MUST allow registered users to sign in through their linked OAuth2 provider
- **FR-005**: System MUST allow users to log out, terminating their session
- **FR-006**: System MUST restrict access to session data and features to authenticated users only
- **FR-007**: System MUST ensure users can only access, view, edit, and delete their own sessions
- **FR-008**: System MUST prevent users from accessing another user's data through any means (URL manipulation, API calls, etc.)
- **FR-009**: System MUST maintain user session state across page refreshes
- **FR-010**: System MUST handle OAuth2 authentication failures gracefully with user-friendly error messages

**Session Recording & Management**:
- **FR-011**: System MUST allow authenticated users to create a new poker session record with date, location, buy-in amount, cash-out amount, and session duration
- **FR-012**: System MUST associate each session record with the user who created it
- **FR-013**: System MUST automatically calculate profit/loss as the difference between cash-out and buy-in amounts
- **FR-014**: System MUST persist session records so they remain available after closing and reopening the application
- **FR-015**: System MUST display a list of the authenticated user's recorded sessions in chronological order (most recent first)
- **FR-016**: System MUST allow users to view detailed information for their own individual sessions
- **FR-017**: System MUST allow users to edit their own existing session records
- **FR-018**: System MUST allow users to delete their own session records
- **FR-019**: System MUST support adding optional text notes to sessions

**Statistics & Analytics**:
- **FR-020**: System MUST calculate and display total profit/loss across all of the user's sessions
- **FR-021**: System MUST calculate and display the total number of sessions recorded by the user
- **FR-022**: System MUST calculate and display average profit/loss per session for the user
- **FR-023**: System MUST recalculate statistics automatically when the user's sessions are added, edited, or deleted

**Filtering & Search**:
- **FR-024**: System MUST allow users to filter their own sessions by location
- **FR-025**: System MUST allow users to filter their own sessions by date range

**Display & Validation**:
- **FR-026**: System MUST clearly distinguish between winning sessions (positive profit) and losing sessions (negative profit) in the display
- **FR-027**: System MUST validate that cash-out and buy-in amounts are non-negative numbers
- **FR-028**: System MUST validate that session duration is a positive value
- **FR-029**: System MUST support currency amounts with decimal precision (e.g., dollars and cents)
- **FR-030**: System MUST prevent data loss by confirming before deleting a session
- **FR-031**: System MUST handle the case of zero sessions gracefully with appropriate messaging for new users

### Key Entities

- **User**: Represents a registered user account with attributes including unique identifier, email address, authentication credentials, and account creation timestamp. A user owns zero or more poker sessions.
- **Session**: Represents a single poker playing session with attributes including date/time, location (venue name), buy-in amount (money brought to table), cash-out amount (money left table with), duration (time played), calculated profit/loss, optional notes, and a reference to the owning user. Each session belongs to exactly one user.
- **Statistics Summary**: Represents aggregated data calculated from a specific user's sessions including total profit/loss, total sessions count, average profit/loss per session, and performance by location. Statistics are always user-specific.

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Authentication & Security**:
- **SC-001**: New users can complete OAuth2 sign-in (Google or GitHub) in under 30 seconds
- **SC-002**: 100% of user data is isolated - users can never access another user's sessions
- **SC-003**: User authentication sessions persist across browser refreshes without requiring re-login
- **SC-004**: OAuth2 authentication errors are handled gracefully with clear, actionable error messages for users

**Session Recording & Viewing**:
- **SC-005**: Authenticated users can record a complete poker session (all required fields) in under 60 seconds
- **SC-006**: The system accurately calculates profit/loss for 100% of sessions (verified by manual calculation)
- **SC-007**: Users can view their session history and statistics within 2 seconds of opening that view
- **SC-008**: The system maintains data integrity - no data loss occurs when closing and reopening the application

**User Experience**:
- **SC-009**: Users can successfully edit or delete their own session and see updated statistics immediately
- **SC-010**: 95% of users can complete their first session entry without errors or confusion after registration
- **SC-011**: New users with zero sessions see helpful messaging rather than errors when viewing empty statistics

**Performance & Scalability**:
- **SC-012**: The application handles at least 1000 session records per user without performance degradation
- **SC-013**: Filtering operations return results in under 1 second for datasets up to 1000 sessions per user
- **SC-014**: The system supports at least 100 concurrent users without performance degradation
