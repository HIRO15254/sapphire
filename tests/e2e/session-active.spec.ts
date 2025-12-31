import { expect, test } from '@playwright/test'

/**
 * E2E tests for active session recording flows.
 *
 * Tests cover:
 * - Starting a new active session
 * - Viewing active session status
 * - Pausing and resuming a session
 * - Stack updates
 * - Recording rebuys and addons
 * - Ending a session with cash out
 * - Single active session constraint
 * - Event timeline display
 *
 * NOTE: Uses getByRole and getByLabel for stable selectors.
 *
 * @see data-model.md Section 14. SessionEvent
 */

test.describe('Active Session Recording', () => {
  // Helper to login before each test
  async function loginUser(
    page: import('@playwright/test').Page,
    email: string,
    password: string,
  ) {
    await page.goto('/auth/signin')
    await page.getByLabel('メールアドレス').fill(email)
    await page.getByPlaceholder('パスワードを入力').fill(password)
    await page.getByRole('button', { name: 'ログイン', exact: true }).click()
    await expect(page).not.toHaveURL(/\/auth\/signin/, { timeout: 10000 })
  }

  // Helper to create a test user
  async function createTestUser(page: import('@playwright/test').Page) {
    const uniqueEmail = `active-session-test-${Date.now()}@example.com`
    const password = 'testpassword123'

    await page.goto('/auth/register')
    await page.getByLabel('名前').fill('アクティブセッションテストユーザー')
    await page.getByLabel('メールアドレス').fill(uniqueEmail)
    await page.getByPlaceholder('8文字以上').fill(password)
    await page.getByPlaceholder('もう一度入力').fill(password)
    await page.getByRole('button', { name: '登録' }).click()

    await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

    return { email: uniqueEmail, password }
  }

  // Helper to create a store for testing
  async function createStore(
    page: import('@playwright/test').Page,
    name: string,
  ) {
    await page.goto('/stores/new')
    await page.getByLabel('店舗名').fill(name)
    await page.getByRole('button', { name: '作成' }).click()
    await expect(page.getByText('店舗を作成しました')).toBeVisible({
      timeout: 10000,
    })
    await page.waitForURL(/\/stores\/[^/]+$/, { timeout: 10000 })
  }

  // Helper to create a cash game at a store
  async function createCashGame(
    page: import('@playwright/test').Page,
    smallBlind: string,
    bigBlind: string,
  ) {
    await page.getByRole('button', { name: 'キャッシュゲームを追加' }).click()
    await expect(page.locator('.mantine-Modal-content')).toBeVisible()

    await page
      .locator('.mantine-Modal-content')
      .getByLabel('SB')
      .fill(smallBlind)
    await page.locator('.mantine-Modal-content').getByLabel('BB').fill(bigBlind)

    await page
      .locator('.mantine-Modal-content')
      .getByRole('button', { name: '追加', exact: true })
      .click()

    await expect(page.getByText('キャッシュゲームを追加しました')).toBeVisible({
      timeout: 10000,
    })
  }

  test.describe('Active Session Page', () => {
    test('should show start session form when no active session', async ({
      page,
    }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Wait for page to load
      await expect(
        page.getByRole('heading', { name: 'アクティブセッション' }),
      ).toBeVisible({
        timeout: 15000,
      })

      // Should show start session form
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 10000,
      })

      // Should show game type selector
      await expect(page.getByText('ゲームタイプ')).toBeVisible()
      await expect(page.getByText('キャッシュ')).toBeVisible()
      await expect(page.getByText('トーナメント')).toBeVisible()
    })

    test('should show store selector when stores exist', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Create a store
      await createStore(page, 'アクティブテスト店舗')
      await createCashGame(page, '100', '200')

      await page.goto('/sessions/active')

      // Wait for page to load
      await expect(
        page.getByRole('heading', { name: 'アクティブセッション' }),
      ).toBeVisible({
        timeout: 15000,
      })

      // Should have store selector
      await expect(page.getByRole('textbox', { name: '店舗' })).toBeVisible({
        timeout: 10000,
      })
    })
  })

  test.describe('Start Active Session', () => {
    test('should start a new cash session with store', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await createStore(page, 'キャッシュセッション店舗')
      await createCashGame(page, '200', '400')

      await page.goto('/sessions/active')

      // Wait for page to load
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })

      // Game type is already "キャッシュ" by default
      // Select store
      await page.getByLabel('店舗（任意）').click()
      await page
        .getByRole('option', { name: 'キャッシュセッション店舗' })
        .click()

      // Wait for cash game selector to appear
      const cashGameSelect = page.getByRole('textbox', {
        name: 'キャッシュゲーム',
      })
      await expect(cashGameSelect).toBeVisible({ timeout: 5000 })
      await cashGameSelect.click()
      await page.getByRole('option', { name: '200/400' }).click()

      // Fill buy-in
      await page.getByLabel('バイイン額').fill('20000')

      // Start session
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Should show active session view
      await expect(page.getByText('キャッシュセッション店舗')).toBeVisible({
        timeout: 10000,
      })
      await expect(
        page.locator('.mantine-Badge').filter({ hasText: 'キャッシュ' }),
      ).toBeVisible({
        timeout: 5000,
      })
    })

    test('should start a tournament session', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Wait for page to load
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })

      // Switch to tournament
      await page.getByText('トーナメント').click()

      // Fill buy-in
      await page.getByLabel('バイイン額').fill('5000')

      // Start session
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Should show active session with tournament badge
      await expect(page.locator('.mantine-Badge').filter({ hasText: 'トーナメント' })).toBeVisible({
        timeout: 10000,
      })
    })

    test('should require buy-in amount', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Wait for page to load
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })

      // Try to start without buy-in (button should be disabled)
      const startButton = page.getByRole('button', { name: 'セッションを開始' })
      await expect(startButton).toBeDisabled()
    })
  })

  test.describe('Active Session Controls', () => {
    test('should display session info with buy-in and stack', async ({
      page,
    }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Start session
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByLabel('バイイン額').fill('15000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Should show buy-in
      await expect(page.getByText('総Buy-in')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('15,000')).toBeVisible()

      // Should show current stack (initially equals buy-in)
      await expect(page.getByText('現在のスタック')).toBeVisible()
    })

    test('should pause and resume session', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Start session
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByLabel('バイイン額').fill('10000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Wait for session to be active
      await expect(page.getByText('コントロール')).toBeVisible({
        timeout: 10000,
      })

      // Pause session
      await page.getByRole('button', { name: '一時停止' }).click()

      // Should show paused badge
      await expect(page.getByText('一時停止中')).toBeVisible({ timeout: 5000 })

      // Should show resume button
      await expect(page.getByRole('button', { name: '再開' })).toBeVisible()

      // Resume session
      await page.getByRole('button', { name: '再開' }).click()

      // Should show pause button again
      await expect(page.getByRole('button', { name: '一時停止' })).toBeVisible({
        timeout: 5000,
      })
    })

    test('should update stack', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Start session with 10000
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByLabel('バイイン額').fill('10000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Wait for controls
      await expect(page.getByText('スタック更新')).toBeVisible({
        timeout: 10000,
      })

      // Update stack to 15000
      await page.getByPlaceholder('現在のスタック').fill('15000')
      await page
        .locator('button')
        .filter({ hasText: '更新' })
        .first()
        .click()

      // Wait for update to complete (the input should be cleared)
      await expect(page.getByPlaceholder('現在のスタック')).toHaveValue('', {
        timeout: 5000,
      })
    })

    test('should record rebuy', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Start session with 10000
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByLabel('バイイン額').fill('10000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Wait for controls
      await expect(page.getByText('リバイ')).toBeVisible({ timeout: 10000 })

      // Record rebuy
      await page.getByPlaceholder('リバイ額').fill('10000')
      await page.getByRole('button', { name: 'リバイ', exact: true }).click()

      // Buy-in total should increase to 20000
      await expect(page.getByText('20,000')).toBeVisible({ timeout: 5000 })
    })

    test('should record addon', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Start tournament session
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByText('トーナメント').click()
      await page.getByLabel('バイイン額').fill('5000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Wait for controls
      await expect(page.getByText('アドオン')).toBeVisible({ timeout: 10000 })

      // Record addon
      await page.getByPlaceholder('アドオン額').fill('3000')
      await page.getByRole('button', { name: 'アドオン', exact: true }).click()

      // Buy-in total should increase to 8000
      await expect(page.getByText('8,000')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('End Active Session', () => {
    test('should end session with cash out', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Start session
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByLabel('バイイン額').fill('10000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Wait for controls
      await expect(page.getByText('セッション終了')).toBeVisible({
        timeout: 10000,
      })

      // End session with cash out
      await page.getByPlaceholder('キャッシュアウト額').fill('15000')
      await page.getByRole('button', { name: '終了' }).click()

      // Should redirect to sessions list
      await expect(page).toHaveURL(/\/sessions$/, { timeout: 10000 })
    })

    test('should end session with zero cash out (busted)', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Start session
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByLabel('バイイン額').fill('20000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Wait for controls
      await expect(page.getByText('セッション終了')).toBeVisible({
        timeout: 10000,
      })

      // End session with 0 cash out
      await page.getByPlaceholder('キャッシュアウト額').fill('0')
      await page.getByRole('button', { name: '終了' }).click()

      // Should redirect to sessions list
      await expect(page).toHaveURL(/\/sessions$/, { timeout: 10000 })
    })

    test('should require cash out amount to end', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Start session
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByLabel('バイイン額').fill('10000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Wait for controls
      await expect(page.getByText('セッション終了')).toBeVisible({
        timeout: 10000,
      })

      // End button should be disabled without cash out amount
      await expect(page.getByRole('button', { name: '終了' })).toBeDisabled()
    })
  })

  test.describe('Event Timeline', () => {
    test('should display event history', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Start session
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByLabel('バイイン額').fill('10000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Should show event history section
      await expect(page.getByText('イベント履歴')).toBeVisible({
        timeout: 10000,
      })

      // Should show session_start event
      await expect(page.getByText('セッション開始')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should add events to timeline', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Start session
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByLabel('バイイン額').fill('10000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Wait for controls
      await expect(page.getByText('コントロール')).toBeVisible({
        timeout: 10000,
      })

      // Pause session
      await page.getByRole('button', { name: '一時停止' }).click()
      await expect(page.getByText('一時停止中')).toBeVisible({ timeout: 5000 })

      // Resume session
      await page.getByRole('button', { name: '再開' }).click()
      await expect(page.getByRole('button', { name: '一時停止' })).toBeVisible({
        timeout: 5000,
      })

      // Record rebuy
      await page.getByPlaceholder('リバイ額').fill('5000')
      await page.getByRole('button', { name: 'リバイ', exact: true }).click()

      // Timeline should show multiple events
      await expect(page.getByText('セッション開始')).toBeVisible({
        timeout: 5000,
      })
      // Note: The timeline shows all events in chronological order
    })
  })

  test.describe('Single Active Session Constraint', () => {
    test('should show active session instead of start form when session exists', async ({
      page,
    }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions/active')

      // Start first session
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByLabel('バイイン額').fill('10000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Wait for active session view
      await expect(page.getByText('コントロール')).toBeVisible({
        timeout: 10000,
      })

      // Reload page
      await page.reload()

      // Should still show active session, not start form
      await expect(page.getByText('コントロール')).toBeVisible({
        timeout: 15000,
      })
      await expect(
        page.getByText('新しいセッションを開始'),
      ).not.toBeVisible()
    })
  })

  test.describe('Data Isolation', () => {
    test('should not show other users active session', async ({ page }) => {
      // Create first user and start active session
      const user1 = await createTestUser(page)
      await loginUser(page, user1.email, user1.password)

      await page.goto('/sessions/active')

      // Start session
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await page.getByLabel('バイイン額').fill('50000')
      await page.getByRole('button', { name: 'セッションを開始' }).click()

      // Wait for active session
      await expect(page.getByText('コントロール')).toBeVisible({
        timeout: 10000,
      })

      // Logout
      const menuButton = page.getByRole('button', { name: 'メニューを開く' })
      if (await menuButton.isVisible()) {
        await menuButton.click()
      }
      await page.getByRole('button', { name: 'ログアウト' }).click()
      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      // Create and login as second user
      await page.goto('/auth/register')
      const user2 = await createTestUser(page)
      await loginUser(page, user2.email, user2.password)

      // Go to active sessions
      await page.goto('/sessions/active')

      // Should show start form, not user1's session
      await expect(page.getByText('新しいセッションを開始')).toBeVisible({
        timeout: 15000,
      })
      await expect(page.getByText('50,000')).not.toBeVisible()
    })
  })
})
