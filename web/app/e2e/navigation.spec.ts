import { test, expect } from '@playwright/test'
import { clearAppStorage, nav, signUpAndOnboard } from './helpers'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndOnboard(page)
  })

  test('bottom nav visits all tabs', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Discover' }).click()
    await expect(page).toHaveURL('/discover')
    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible()

    await nav(page).getByRole('link', { name: 'Insights' }).click()
    await expect(page).toHaveURL('/progress')
    await expect(page.getByRole('heading', { name: 'Insights' })).toBeVisible()

    await nav(page).getByRole('link', { name: 'You' }).click()
    await expect(page).toHaveURL('/settings')
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

    await page.getByRole('link', { name: 'About Fud AI' }).click()
    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()

    await nav(page).getByRole('link', { name: 'Today' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'You showed up.' })).toBeVisible()
  })

  test('discover tab and you coach reach their full pages', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Discover' }).click()
    await expect(page).toHaveURL('/discover')
    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible()

    await nav(page).getByRole('link', { name: 'Today' }).click()
    await expect(page).toHaveURL('/')

    await nav(page).getByRole('link', { name: 'You' }).click()
    await page.getByLabel('Chat with your coach').click()
    await expect(page).toHaveURL('/coach')
    await expect(page.getByText('AI Coach')).toBeVisible()
  })

  test('log FAB reaches photo then manual entry', async ({ page }) => {
    await page.getByTestId('fab').click()
    await expect(page).toHaveURL('/log/photo')
    await page.getByRole('link', { name: /Manual entry/i }).click()
    await expect(page).toHaveURL(/\/log\/manual/)
  })

  /* This asserted a return to onboarding until the sign-out trap was fixed: a
     device that has held an account belongs to someone coming back, so sending
     them through a seven-step rebuild of a profile they already have was wrong.
     The guest journey is still the default for a device that has never seen an
     account — covered by the test below. */
  test('sign out returns a known account to the login screen', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'You' }).click()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('a device that has never held an account still starts at onboarding', async ({ page }) => {
    await clearAppStorage(page)
    await page.goto('/')
    await expect(page).toHaveURL(/\/onboarding/)
    await expect(page.getByRole('heading', { name: 'Log a meal in seconds' })).toBeVisible()
  })

  test('onboarding always offers a way back to an existing account', async ({ page }) => {
    await clearAppStorage(page)
    await page.goto('/onboarding')
    await page.getByRole('link', { name: 'I already have an account' }).first().click()
    await expect(page).toHaveURL(/\/login/)
  })
})
