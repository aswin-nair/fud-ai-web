import { test, expect } from '@playwright/test'
import { logManualMeal, signUpAndOnboard } from './helpers'

test.describe('Home & food logging', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndOnboard(page)
  })

  test('shows today ticket and macro segments', async ({ page }) => {
    await expect(page.locator('.ticket')).toBeVisible()
    await expect(page.getByText('Onboarding yogurt bowl')).toBeVisible()
    await expect(page.getByRole('progressbar', { name: 'Protein' })).toBeVisible()
    await expect(page.getByRole('progressbar', { name: 'Carbs' })).toBeVisible()
    await expect(page.getByRole('progressbar', { name: 'Fat' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'You showed up.' })).toBeVisible()
    await expect(page.getByRole('img', { name: '1 of 1 chosen steps complete' })).toBeVisible()
    await expect(page.locator('.home-quest-row')).toHaveCount(0)
    await expect(page.locator('.meal-path')).toHaveCount(0)
  })

  test('pause hides nutrition and engagement numbers on Home and Insights', async ({ page }) => {
    const mainNav = page.getByLabel('Main')
    await mainNav.getByRole('link', { name: 'You' }).click()

    const pauseRow = page.locator('.settings-row').filter({ hasText: 'Pause tracking' })
    await pauseRow.locator('input[type="checkbox"]').check()
    await page.getByRole('button', { name: 'Save settings' }).click()

    await mainNav.getByRole('link', { name: 'Today' }).click()
    await expect(page.getByText('Tracking is paused')).toBeVisible()
    await expect(page.locator('.home-quest-row')).toHaveCount(0)
    await expect(page.locator('.calorie-ring')).toHaveCount(0)
    await expect(page.getByRole('progressbar', { name: 'Protein' })).toHaveCount(0)
    await expect(page.getByText('Onboarding yogurt bowl')).toHaveCount(0)

    await mainNav.getByRole('link', { name: 'Insights' }).click()
    await expect(page.getByRole('heading', { name: 'Tracking is paused' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Weight', exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Calories', exact: true })).toHaveCount(0)
    await expect(page.locator('.progress-stat-value')).toHaveCount(0)
  })

  test('logs food via manual entry', async ({ page }) => {
    await logManualMeal(page, {
      name: 'Greek Yogurt',
      calories: '150',
      protein: '15',
      carbs: '8',
      fat: '4',
    })

    await expect(page.getByText('Greek Yogurt')).toBeVisible()
    await expect(page.locator('.home-today-kcal', { hasText: '150' })).toBeVisible()
  })

  test('date picker keeps today calories after switching dates', async ({ page }) => {
    await logManualMeal(page, {
      name: 'Oatmeal',
      calories: '320',
      protein: '12',
      carbs: '54',
      fat: '6',
    })

    await expect(page.getByText('Oatmeal')).toBeVisible()

    const yesterdayLabel = await page.evaluate(() => {
      const date = new Date()
      date.setDate(date.getDate() - 1)
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    })
    const needsPrevMonth = await page.evaluate(() => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const today = new Date()
      return yesterday.getMonth() !== today.getMonth()
    })
    await page.getByRole('button', { name: 'Choose date' }).click()
    if (needsPrevMonth) {
      await page.getByRole('button', { name: 'Previous month' }).click()
    }
    await page.getByRole('button', { name: yesterdayLabel }).click()
    await expect(page.getByText('Oatmeal')).toHaveCount(0)
    await expect(page.getByText('Yesterday’s snapshot')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Yesterday', exact: true })).toBeVisible()
    await expect(page.getByText('Nothing was logged yesterday.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log a meal today', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Choose date' }).click()
    await page.getByRole('button', { name: 'Jump to today' }).click()
    await expect(page.getByText('Oatmeal')).toBeVisible()
  })

  test('log FAB reaches every option from the log menu', async ({ page }) => {
    await page.getByTestId('fab').click()
    await expect(page).toHaveURL('/log')
    await expect(page.getByRole('link', { name: /Describe your meal/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Snap a photo/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Saved meals/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Manual entry/i })).toBeVisible()
  })

  test('shows the exact post-log celebration after manual entry', async ({ page }) => {
    await logManualMeal(page, {
      name: 'Toast Test Meal',
      calories: '420',
      protein: '22',
      carbs: '45',
      fat: '10',
    }, { dismissCelebration: false })

    const celebration = page.getByRole('dialog', { name: 'Meal logged' })
    await expect(celebration).toContainText('Toast Test Meal')
    await expect(celebration).toContainText('XP revealed')
    await expect(celebration.getByRole('button', { name: 'Continue' })).toBeVisible()
  })
})
