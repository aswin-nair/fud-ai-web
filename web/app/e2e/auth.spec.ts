import { test, expect } from '@playwright/test'
import { clearAppStorage, clickAuthTab, signUp, uniqueEmail, signInWithEmail } from './helpers'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
  })

  test('shows login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Fud AI' })).toBeVisible()
    await expect(page.locator('.auth-tabs').getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
    await expect(page.locator('.auth-tabs').getByRole('button', { name: 'Sign up' })).toBeVisible()
  })

  test('sign up with email and password', async ({ page }) => {
    await page.goto('/login')
    const email = uniqueEmail()

    await signUp(page, { email, name: 'Test User' })
    await expect(page).toHaveURL(/\/onboarding/)
    await expect(page.getByRole('heading', { name: 'Welcome to Fud AI' })).toBeVisible()
  })

  test('rejects mismatched passwords on sign up', async ({ page }) => {
    await page.goto('/login')
    await clickAuthTab(page, 'Sign up')
    await page.getByLabel('Name').fill('Test')
    await page.getByLabel('Email').fill(uniqueEmail())
    await page.getByLabel('Password', { exact: true }).fill('TestPass123!')
    await page.getByLabel('Confirm password').fill('DifferentPass!')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })

  test('sign in after sign up and sign out', async ({ page }) => {
    await page.goto('/login')
    const email = uniqueEmail()
    const password = 'TestPass123!'

    await signUp(page, { email, password })
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Continue' }).click()
    }
    await page.getByRole('button', { name: 'Get started' }).click()
    await page.waitForURL('/')

    await page.getByLabel('Main').getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login/)

    await signInWithEmail(page, email, password)

    await expect(page).toHaveURL('/')
    await expect(page.getByText("Today's Food")).toBeVisible()
  })
})
