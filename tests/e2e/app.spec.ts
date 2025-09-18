import { test, expect } from '@playwright/test';

test.describe('Sapphire App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for the app to load
    await page.goto('/');
    // Wait for the main title to appear
    await page.waitForSelector('h1:has-text("Sapphire - SQLite Database Demo")');
  });

  test('should display the main title and navigation tabs', async ({ page }) => {
    // Check main title
    await expect(page.locator('h1')).toContainText('Sapphire - SQLite Database Demo');

    // Check navigation tabs
    await expect(page.locator('text=Original Demo')).toBeVisible();
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Notes')).toBeVisible();
  });

  test('should greet user in the demo tab', async ({ page }) => {
    // Should be on Original Demo tab by default
    await expect(page.locator('input[placeholder="Enter a name..."]')).toBeVisible();

    // Enter a name
    await page.fill('input[placeholder="Enter a name..."]', 'E2E Test User');

    // Click greet button
    await page.click('button:has-text("Greet")');

    // Check for greeting message
    await expect(page.locator('text=Hello, E2E Test User! You\'ve been greeted from Rust!')).toBeVisible({
      timeout: 10000
    });
  });

  test('should navigate between tabs', async ({ page }) => {
    // Click on Users tab
    await page.click('text=Users');
    await expect(page.locator('text=Add New User')).toBeVisible();

    // Click on Notes tab
    await page.click('text=Notes');
    await expect(page.locator('text=Add New Note')).toBeVisible();

    // Go back to Original Demo
    await page.click('text=Original Demo');
    await expect(page.locator('input[placeholder="Enter a name..."]')).toBeVisible();
  });

  test('should create and display a new user', async ({ page }) => {
    // Navigate to Users tab
    await page.click('text=Users');
    await expect(page.locator('text=Add New User')).toBeVisible();

    // Fill in user form
    await page.fill('input[placeholder="Name"]', 'John Doe E2E');
    await page.fill('input[placeholder="Email"]', 'john.e2e@example.com');

    // Click Add User button
    await page.click('button:has-text("Add User")');

    // Wait for success notification
    await expect(page.locator('text=User created successfully')).toBeVisible({
      timeout: 10000
    });

    // Check if user appears in the list
    await expect(page.locator('text=John Doe E2E')).toBeVisible();
    await expect(page.locator('text=john.e2e@example.com')).toBeVisible();
  });

  test('should create a note after creating a user', async ({ page }) => {
    // First create a user
    await page.click('text=Users');
    await page.fill('input[placeholder="Name"]', 'Note Author');
    await page.fill('input[placeholder="Email"]', 'author@example.com');
    await page.click('button:has-text("Add User")');

    // Wait for user creation confirmation
    await expect(page.locator('text=User created successfully')).toBeVisible({
      timeout: 10000
    });

    // Navigate to Notes tab
    await page.click('text=Notes');
    await expect(page.locator('text=Add New Note')).toBeVisible();

    // Fill in note form
    await page.fill('input[placeholder="Note title"]', 'My E2E Test Note');
    await page.fill('textarea[placeholder*="note content"]', 'This is a test note created during E2E testing.');

    // Select the user we just created
    await page.click('[data-testid="user-select"]');
    await page.click('text=Note Author');

    // Click Add Note button
    await page.click('button:has-text("Add Note")');

    // Wait for success notification
    await expect(page.locator('text=Note created successfully')).toBeVisible({
      timeout: 10000
    });

    // Check if note appears in the list
    await expect(page.locator('text=My E2E Test Note')).toBeVisible();
    await expect(page.locator('text=This is a test note created during E2E testing.')).toBeVisible();
  });

  test('should delete a user', async ({ page }) => {
    // Create a user first
    await page.click('text=Users');
    await page.fill('input[placeholder="Name"]', 'User To Delete');
    await page.fill('input[placeholder="Email"]', 'delete@example.com');
    await page.click('button:has-text("Add User")');

    // Wait for user creation
    await expect(page.locator('text=User created successfully')).toBeVisible({
      timeout: 10000
    });

    // Find and click delete button for this user
    const userRow = page.locator('text=User To Delete').locator('..');
    await userRow.locator('button:has-text("Delete")').click();

    // Confirm deletion in dialog if it appears
    await page.locator('button:has-text("Delete")').click();

    // Wait for deletion confirmation
    await expect(page.locator('text=User deleted successfully')).toBeVisible({
      timeout: 10000
    });

    // Verify user is no longer in the list
    await expect(page.locator('text=User To Delete')).not.toBeVisible();
  });

  test('should handle empty form validation', async ({ page }) => {
    // Navigate to Users tab
    await page.click('text=Users');

    // Try to submit empty form
    await page.click('button:has-text("Add User")');

    // Should show validation error
    await expect(page.locator('text=Please fill in all fields')).toBeVisible({
      timeout: 5000
    });
  });

  test('should persist data after refresh', async ({ page }) => {
    // Create a user
    await page.click('text=Users');
    await page.fill('input[placeholder="Name"]', 'Persistent User');
    await page.fill('input[placeholder="Email"]', 'persistent@example.com');
    await page.click('button:has-text("Add User")');

    // Wait for creation
    await expect(page.locator('text=User created successfully')).toBeVisible({
      timeout: 10000
    });

    // Refresh the page
    await page.reload();

    // Wait for app to load again
    await page.waitForSelector('h1:has-text("Sapphire - SQLite Database Demo")');

    // Navigate to Users tab
    await page.click('text=Users');

    // Check if user is still there
    await expect(page.locator('text=Persistent User')).toBeVisible();
    await expect(page.locator('text=persistent@example.com')).toBeVisible();
  });
});