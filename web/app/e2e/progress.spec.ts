import { test, expect } from '@playwright/test'
import { signUpAndOnboard } from './helpers'

test.describe('Insights', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndOnboard(page)
    await page.getByLabel('Main').getByRole('link', { name: 'Insights' }).click()
  })

  test('shows week and month chips with descriptive logging copy', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Insights' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Consistency' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Most logged' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ticket archive' })).toBeVisible()
    await expect(page.getByText(/You logged breakfast \d of the last 7 days/)).toBeVisible()
  })

  test('logs weight via modal', async ({ page }) => {
    await page.getByRole('button', { name: '+ Log weight' }).click()
    await expect(page.getByRole('heading', { name: 'Log weight' })).toBeVisible()

    await page.getByLabel('Weight (kg)').fill('72.5')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Weight history')).toBeVisible()
    await expect(page.getByText('1 entry')).toBeVisible()
    await expect(page.locator('.progress-stat-value').first()).toContainText('72.5')
  })

  test('switches time range', async ({ page }) => {
    await page.getByRole('button', { name: 'Month' }).click()
    await expect(page.getByRole('button', { name: 'Month' })).toHaveClass(/active/)
  })
})
