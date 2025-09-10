import { browser } from '@wdio/globals'

describe('Sapphire App E2E Tests', () => {
  beforeEach(async () => {
    // WebDriverIO will handle the app startup through Tauri driver
    await browser.pause(2000) // Wait for app to fully load
  })

  it('should display the welcome title', async () => {
    const title = await $('h1')
    await expect(title).toHaveText('Welcome to Tauri + React')
  })

  it('should display all three logos', async () => {
    const viteImg = await $('img[alt="Vite logo"]')
    const tauriImg = await $('img[alt="Tauri logo"]')
    const reactImg = await $('img[alt="React logo"]')

    await expect(viteImg).toBeDisplayed()
    await expect(tauriImg).toBeDisplayed()
    await expect(reactImg).toBeDisplayed()
  })

  it('should have a name input field and greet button', async () => {
    const input = await $('input[placeholder="Enter a name..."]')
    const button = await $('button*=Greet')

    await expect(input).toBeDisplayed()
    await expect(button).toBeDisplayed()
  })

  it('should greet the user when name is entered and button is clicked', async () => {
    const input = await $('input[placeholder="Enter a name..."]')
    const button = await $('button*=Greet')

    // Enter a name
    await input.setValue('World')
    
    // Click the greet button
    await button.click()

    // Wait for the greeting message to appear
    const greeting = await $('*=Hello, World!')
    await expect(greeting).toBeDisplayed()
    await expect(greeting).toHaveText("Hello, World! You've been greeted from Rust!")
  })

  it('should greet the user when name is entered and Enter key is pressed', async () => {
    const input = await $('input[placeholder="Enter a name..."]')

    // Enter a name and press Enter
    await input.setValue('E2E Test')
    await browser.keys('Enter')

    // Wait for the greeting message to appear
    const greeting = await $('*=Hello, E2E Test!')
    await expect(greeting).toBeDisplayed()
  })

  it('should clear previous greeting when new greeting is requested', async () => {
    const input = await $('input[placeholder="Enter a name..."]')
    const button = await $('button*=Greet')

    // First greeting
    await input.setValue('First')
    await button.click()
    
    let greeting = await $('*=Hello, First!')
    await expect(greeting).toBeDisplayed()

    // Second greeting
    await input.clearValue()
    await input.setValue('Second')
    await button.click()

    // Check that new greeting is displayed
    greeting = await $('*=Hello, Second!')
    await expect(greeting).toBeDisplayed()

    // Check that old greeting is not displayed
    const oldGreeting = await $('*=Hello, First!')
    await expect(oldGreeting).not.toBeDisplayed()
  })

  it('should handle empty input gracefully', async () => {
    const input = await $('input[placeholder="Enter a name..."]')
    const button = await $('button*=Greet')

    // Leave input empty and click greet
    await input.setValue('')
    await button.click()

    // Should still show greeting with empty name
    const greeting = await $('*=Hello, !')
    await expect(greeting).toBeDisplayed()
  })
})