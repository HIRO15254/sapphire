import { expect, test } from '@playwright/test'

/**
 * E2E tests for archive session recording flows.
 *
 * Tests cover:
 * - Session CRUD operations (create, read, update, delete)
 * - All-in record management
 * - EV calculation display
 * - Store/game/currency association
 * - Session list with pagination
 * - Empty state handling
 *
 * NOTE: Uses getByRole and getByLabel for stable selectors.
 *
 * @see data-model.md Section 13. PokerSession, Section 15. AllInRecord
 */

test.describe('Archive Session Recording', () => {
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
    const uniqueEmail = `session-test-${Date.now()}@example.com`
    const password = 'testpassword123'

    await page.goto('/auth/register')
    await page.getByLabel('名前').fill('セッションテストユーザー')
    await page.getByLabel('メールアドレス').fill(uniqueEmail)
    await page.getByPlaceholder('8文字以上').fill(password)
    await page.getByPlaceholder('もう一度入力').fill(password)
    await page.getByRole('button', { name: '登録' }).click()

    await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

    return { email: uniqueEmail, password }
  }

  // Helper to create a currency for testing
  async function _createCurrency(
    page: import('@playwright/test').Page,
    name: string,
  ) {
    await page.goto('/currencies/new')
    await page.getByLabel('通貨名').fill(name)
    await page.getByLabel('初期残高').fill('10000')
    await page.getByRole('button', { name: '作成' }).click()
    await expect(page.getByText('通貨を作成しました')).toBeVisible({
      timeout: 10000,
    })
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

  test.describe('Session List Page', () => {
    test('should show empty state when no sessions exist', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions')

      // Wait for title to appear (page loaded)
      await expect(
        page.getByRole('heading', { name: 'セッション履歴' }),
      ).toBeVisible({
        timeout: 15000,
      })

      // Should show empty state message
      await expect(
        page.getByText('セッションが記録されていません'),
      ).toBeVisible({
        timeout: 15000,
      })

      // Should show create button
      await expect(
        page.getByRole('link', { name: '新しいセッションを記録' }),
      ).toBeVisible()
    })

    test('should navigate to create session page', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await page.goto('/sessions')

      // Wait for page content to load
      await expect(
        page.getByRole('heading', { name: 'セッション履歴' }),
      ).toBeVisible({
        timeout: 15000,
      })

      // Click create button
      await page
        .getByRole('link', { name: '新しいセッションを記録' })
        .first()
        .click()

      // Should be on create page
      await expect(page).toHaveURL(/\/sessions\/new/)
    })
  })

  test.describe('Create Archive Session', () => {
    test('should show session form with stores when stores exist', async ({
      page,
    }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // First create a store
      await createStore(page, 'テスト店舗')
      await createCashGame(page, '100', '200')

      await page.goto('/sessions/new')

      // Should show the form title
      await expect(
        page.getByRole('heading', { name: 'セッションを記録' }),
      ).toBeVisible({
        timeout: 15000,
      })

      // Should have store selector
      await expect(page.getByRole('textbox', { name: '店舗' })).toBeVisible()
    })

    test('should create a new session with minimum fields', async ({
      page,
    }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      // Setup: Create store and cash game
      await createStore(page, 'セッションテスト店舗')
      await createCashGame(page, '100', '200')

      // Navigate to create session
      await page.goto('/sessions/new')

      // Game type is already "キャッシュ" by default (SegmentedControl)
      // Select store
      await page.getByLabel('店舗').click()
      await page.getByRole('option', { name: 'セッションテスト店舗' }).click()

      // Wait for cash game selector to appear and select it
      const cashGameSelect = page.getByRole('textbox', {
        name: 'キャッシュゲーム',
      })
      await expect(cashGameSelect).toBeVisible({ timeout: 5000 })
      await cashGameSelect.click()
      await page.getByRole('option', { name: '100/200' }).click()

      // Fill start time (required)
      await page.getByLabel('開始時間').fill('20:00')

      // Fill buy-in and cash-out
      await page.getByLabel('バイイン').fill('10000')
      await page.getByLabel('キャッシュアウト').fill('15000')

      // Submit form
      await page.getByRole('button', { name: 'セッションを記録' }).click()

      // Should show success and redirect
      await expect(page.getByText('セッションを記録しました')).toBeVisible({
        timeout: 10000,
      })

      // Should redirect to session list or detail
      await expect(page).not.toHaveURL(/\/sessions\/new/)
    })

    test('should create a session with negative profit (loss)', async ({
      page,
    }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await createStore(page, 'ロステスト店舗')
      await createCashGame(page, '50', '100')

      await page.goto('/sessions/new')

      // Game type is already "キャッシュ" by default
      await page.getByLabel('店舗').click()
      await page.getByRole('option', { name: 'ロステスト店舗' }).click()

      const cashGameSelect = page.getByRole('textbox', {
        name: 'キャッシュゲーム',
      })
      await expect(cashGameSelect).toBeVisible({ timeout: 5000 })
      await cashGameSelect.click()
      await page.getByRole('option', { name: '50/100' }).click()

      // Fill start time (required)
      await page.getByLabel('開始時間').fill('20:00')

      // Create a losing session
      await page.getByLabel('バイイン').fill('20000')
      await page.getByLabel('キャッシュアウト').fill('5000')

      await page.getByRole('button', { name: 'セッションを記録' }).click()

      await expect(page.getByText('セッションを記録しました')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should create a session with zero cash-out (busted)', async ({
      page,
    }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await createStore(page, 'バストテスト店舗')
      await createCashGame(page, '200', '400')

      await page.goto('/sessions/new')

      // Game type is already "キャッシュ" by default
      await page.getByLabel('店舗').click()
      await page.getByRole('option', { name: 'バストテスト店舗' }).click()

      const cashGameSelect = page.getByRole('textbox', {
        name: 'キャッシュゲーム',
      })
      await expect(cashGameSelect).toBeVisible({ timeout: 5000 })
      await cashGameSelect.click()
      await page.getByRole('option', { name: '200/400' }).click()

      // Fill start time (required)
      await page.getByLabel('開始時間').fill('20:00')

      await page.getByLabel('バイイン').fill('30000')
      await page.getByLabel('キャッシュアウト').fill('0')

      await page.getByRole('button', { name: 'セッションを記録' }).click()

      await expect(page.getByText('セッションを記録しました')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should show validation error for empty buy-in', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await createStore(page, 'バリデーションテスト店舗')
      await createCashGame(page, '100', '200')

      await page.goto('/sessions/new')

      await page.getByLabel('店舗').click()
      await page
        .getByRole('option', { name: 'バリデーションテスト店舗' })
        .click()

      // Fill start time but don't fill buy-in
      await page.getByLabel('開始時間').fill('20:00')

      await page.getByRole('button', { name: 'セッションを記録' }).click()

      // Should show validation error (バイイン額 or バイイン)
      await expect(page.getByText(/バイイン.*1以上/)).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Session Detail Page', () => {
    test('should display session details with profit/loss', async ({
      page,
    }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await createStore(page, '詳細テスト店舗')
      await createCashGame(page, '100', '200')

      // Create session
      await page.goto('/sessions/new')
      await page.getByLabel('店舗').click()
      await page.getByRole('option', { name: '詳細テスト店舗' }).click()
      const cashGameSelect = page.getByRole('textbox', {
        name: 'キャッシュゲーム',
      })
      await expect(cashGameSelect).toBeVisible({ timeout: 5000 })
      await cashGameSelect.click()
      await page.getByRole('option', { name: '100/200' }).click()
      await page.getByLabel('開始時間').fill('20:00')
      await page.getByLabel('バイイン').fill('10000')
      await page.getByLabel('キャッシュアウト').fill('25000')
      await page.getByRole('button', { name: 'セッションを記録' }).click()

      await expect(page.getByText('セッションを記録しました')).toBeVisible({
        timeout: 10000,
      })

      // Wait for redirect to detail page
      await page.waitForURL(/\/sessions\/[^/]+$/, { timeout: 10000 })

      // Should show session info
      await expect(page.getByText('詳細テスト店舗')).toBeVisible({
        timeout: 15000,
      })

      // Should show profit/loss
      await expect(page.getByText('+15,000')).toBeVisible({ timeout: 10000 })
    })

    test('should display negative profit/loss for losing session', async ({
      page,
    }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await createStore(page, '負けセッション店舗')
      await createCashGame(page, '100', '200')

      await page.goto('/sessions/new')
      await page.getByLabel('店舗').click()
      await page.getByRole('option', { name: '負けセッション店舗' }).click()
      const cashGameSelect = page.getByRole('textbox', {
        name: 'キャッシュゲーム',
      })
      await expect(cashGameSelect).toBeVisible({ timeout: 5000 })
      await cashGameSelect.click()
      await page.getByRole('option', { name: '100/200' }).click()
      await page.getByLabel('開始時間').fill('20:00')
      await page.getByLabel('バイイン').fill('30000')
      await page.getByLabel('キャッシュアウト').fill('10000')
      await page.getByRole('button', { name: 'セッションを記録' }).click()

      await expect(page.getByText('セッションを記録しました')).toBeVisible({
        timeout: 10000,
      })

      await page.waitForURL(/\/sessions\/[^/]+$/, { timeout: 10000 })

      // Should show negative profit/loss
      await expect(page.getByText('-20,000')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('All-In Records', () => {
    test('should add all-in record to session', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await createStore(page, 'オールインテスト店舗')
      await createCashGame(page, '100', '200')

      // Create session
      await page.goto('/sessions/new')
      await page.getByLabel('店舗').click()
      await page.getByRole('option', { name: 'オールインテスト店舗' }).click()
      const cashGameSelect = page.getByRole('textbox', {
        name: 'キャッシュゲーム',
      })
      await expect(cashGameSelect).toBeVisible({ timeout: 5000 })
      await cashGameSelect.click()
      await page.getByRole('option', { name: '100/200' }).click()
      await page.getByLabel('開始時間').fill('20:00')
      await page.getByLabel('バイイン').fill('20000')
      await page.getByLabel('キャッシュアウト').fill('30000')
      await page.getByRole('button', { name: 'セッションを記録' }).click()

      await expect(page.getByText('セッションを記録しました')).toBeVisible({
        timeout: 10000,
      })

      await page.waitForURL(/\/sessions\/[^/]+$/, { timeout: 10000 })

      // Add all-in record
      await page.getByRole('button', { name: 'オールインを追加' }).click()

      await expect(page.locator('.mantine-Modal-content')).toBeVisible()

      await page
        .locator('.mantine-Modal-content')
        .getByLabel('ポット額')
        .fill('10000')
      await page
        .locator('.mantine-Modal-content')
        .getByLabel('勝率 (%)')
        .fill('65.5')
      // Result is a SegmentedControl with "勝ち" selected by default

      await page
        .locator('.mantine-Modal-content')
        .getByRole('button', { name: '追加' })
        .click()

      await expect(page.getByText('オールイン記録を追加しました')).toBeVisible({
        timeout: 10000,
      })

      // Should show all-in in the list (use specific selector to avoid strict mode violation)
      await expect(
        page.getByRole('cell', { name: '10,000', exact: true }),
      ).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('cell', { name: '65.5%' })).toBeVisible({
        timeout: 10000,
      })
    })

    test('should display EV summary for multiple all-ins', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await createStore(page, 'EV計算テスト店舗')
      await createCashGame(page, '200', '400')

      // Create session
      await page.goto('/sessions/new')
      await page.getByLabel('店舗').click()
      await page.getByRole('option', { name: 'EV計算テスト店舗' }).click()
      const cashGameSelect = page.getByRole('textbox', {
        name: 'キャッシュゲーム',
      })
      await expect(cashGameSelect).toBeVisible({ timeout: 5000 })
      await cashGameSelect.click()
      await page.getByRole('option', { name: '200/400' }).click()
      await page.getByLabel('開始時間').fill('20:00')
      await page.getByLabel('バイイン').fill('50000')
      await page.getByLabel('キャッシュアウト').fill('80000')
      await page.getByRole('button', { name: 'セッションを記録' }).click()

      await expect(page.getByText('セッションを記録しました')).toBeVisible({
        timeout: 10000,
      })

      await page.waitForURL(/\/sessions\/[^/]+$/, { timeout: 10000 })

      // Add first all-in (win) - "勝ち" is selected by default
      await page.getByRole('button', { name: 'オールインを追加' }).click()
      await page
        .locator('.mantine-Modal-content')
        .getByLabel('ポット額')
        .fill('15000')
      await page
        .locator('.mantine-Modal-content')
        .getByLabel('勝率 (%)')
        .fill('70')
      await page
        .locator('.mantine-Modal-content')
        .getByRole('button', { name: '追加' })
        .click()
      await expect(page.getByText('オールイン記録を追加しました')).toBeVisible({
        timeout: 10000,
      })

      // Add second all-in (loss) - click on "負け" segment
      await page.getByRole('button', { name: 'オールインを追加' }).click()
      await page
        .locator('.mantine-Modal-content')
        .getByLabel('ポット額')
        .fill('20000')
      await page
        .locator('.mantine-Modal-content')
        .getByLabel('勝率 (%)')
        .fill('45')
      // Click on "負け" in SegmentedControl
      await page.locator('.mantine-Modal-content').getByText('負け').click()
      await page
        .locator('.mantine-Modal-content')
        .getByRole('button', { name: '追加' })
        .click()
      await expect(page.getByText('オールイン記録を追加しました')).toBeVisible({
        timeout: 10000,
      })

      // Should show EV in session detail (EV考慮収支 is displayed)
      // The EV info is shown next to main profit as "(EV: +X,XXX)"
      await expect(page.getByText(/\(EV:/)).toBeVisible({
        timeout: 10000,
      })
    })
  })

  test.describe('Update Session', () => {
    test('should update session notes', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await createStore(page, '更新テスト店舗')
      await createCashGame(page, '100', '200')

      // Create session
      await page.goto('/sessions/new')
      await page.getByLabel('店舗').click()
      await page.getByRole('option', { name: '更新テスト店舗' }).click()
      const cashGameSelect = page.getByRole('textbox', {
        name: 'キャッシュゲーム',
      })
      await expect(cashGameSelect).toBeVisible({ timeout: 5000 })
      await cashGameSelect.click()
      await page.getByRole('option', { name: '100/200' }).click()
      await page.getByLabel('開始時間').fill('20:00')
      await page.getByLabel('バイイン').fill('10000')
      await page.getByLabel('キャッシュアウト').fill('15000')
      await page.getByRole('button', { name: 'セッションを記録' }).click()

      await expect(page.getByText('セッションを記録しました')).toBeVisible({
        timeout: 10000,
      })

      await page.waitForURL(/\/sessions\/[^/]+$/, { timeout: 10000 })

      // Click edit button (it's a Link, not a button)
      await page.getByRole('link', { name: '編集' }).click()

      // Wait for edit form to appear
      await expect(
        page.getByRole('button', { name: 'セッションを更新' }),
      ).toBeVisible({
        timeout: 5000,
      })

      // Update notes
      await page.getByLabel('メモ').fill('良いセッションだった')

      // Save
      await page.getByRole('button', { name: 'セッションを更新' }).click()

      // Should show success
      await expect(page.getByText('セッションを更新しました')).toBeVisible({
        timeout: 10000,
      })
    })
  })

  test.describe('Delete Session', () => {
    test('should delete a session (soft delete)', async ({ page }) => {
      const { email, password } = await createTestUser(page)
      await loginUser(page, email, password)

      await createStore(page, '削除テスト店舗')
      await createCashGame(page, '100', '200')

      // Create session
      await page.goto('/sessions/new')
      await page.getByLabel('店舗').click()
      await page.getByRole('option', { name: '削除テスト店舗' }).click()
      const cashGameSelect = page.getByRole('textbox', {
        name: 'キャッシュゲーム',
      })
      await expect(cashGameSelect).toBeVisible({ timeout: 5000 })
      await cashGameSelect.click()
      await page.getByRole('option', { name: '100/200' }).click()
      await page.getByLabel('開始時間').fill('20:00')
      await page.getByLabel('バイイン').fill('10000')
      await page.getByLabel('キャッシュアウト').fill('8000')
      await page.getByRole('button', { name: 'セッションを記録' }).click()

      await expect(page.getByText('セッションを記録しました')).toBeVisible({
        timeout: 10000,
      })

      await page.waitForURL(/\/sessions\/[^/]+$/, { timeout: 10000 })

      // Delete
      await page.getByRole('button', { name: '削除' }).click()

      // Confirm deletion in modal (button text is "削除を確認")
      await page.getByRole('button', { name: '削除を確認' }).click()

      // Should show success and redirect
      await expect(page.getByText('セッションを削除しました')).toBeVisible({
        timeout: 10000,
      })
      await expect(page).toHaveURL(/\/sessions$/)
    })
  })

  test.describe('Data Isolation', () => {
    test('should not show other users sessions', async ({ page }) => {
      // Create first user and add session
      const user1 = await createTestUser(page)
      await loginUser(page, user1.email, user1.password)

      await createStore(page, 'ユーザー1の店舗')
      await createCashGame(page, '100', '200')

      await page.goto('/sessions/new')
      await page.getByLabel('店舗').click()
      await page.getByRole('option', { name: 'ユーザー1の店舗' }).click()
      const cashGameSelect = page.getByRole('textbox', {
        name: 'キャッシュゲーム',
      })
      await expect(cashGameSelect).toBeVisible({ timeout: 5000 })
      await cashGameSelect.click()
      await page.getByRole('option', { name: '100/200' }).click()
      await page.getByLabel('開始時間').fill('20:00')
      await page.getByLabel('バイイン').fill('10000')
      await page.getByLabel('キャッシュアウト').fill('15000')
      await page.getByRole('button', { name: 'セッションを記録' }).click()

      await expect(page.getByText('セッションを記録しました')).toBeVisible({
        timeout: 10000,
      })

      // On mobile, open hamburger menu first
      const menuButton = page.getByRole('button', { name: 'メニューを開く' })
      if (await menuButton.isVisible()) {
        await menuButton.click()
      }

      await page.getByRole('button', { name: 'ログアウト' }).click()

      // Wait for redirect to signin
      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

      // Navigate to register page
      await page.goto('/auth/register')

      const user2 = await createTestUser(page)
      await loginUser(page, user2.email, user2.password)

      // Go to session list
      await page.goto('/sessions')

      // Wait for page to load
      await expect(
        page.getByRole('heading', { name: 'セッション履歴' }),
      ).toBeVisible({
        timeout: 15000,
      })

      // Should not see user1's session
      await expect(page.getByText('ユーザー1の店舗')).not.toBeVisible()

      // Should show empty state
      await expect(
        page.getByText('セッションが記録されていません'),
      ).toBeVisible({
        timeout: 10000,
      })
    })
  })
})
