import { test, expect } from '@playwright/test'
import { nav, signUpAndOnboard } from './helpers'

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

  test('sign out returns to pre-account onboarding', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'You' }).click()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/onboarding/)
    await expect(page.getByRole('heading', { name: 'Log a meal in seconds' })).toBeVisible()
  })
})
