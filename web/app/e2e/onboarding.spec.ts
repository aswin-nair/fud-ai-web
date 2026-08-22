import { test, expect } from '@playwright/test'

import { birthdayYearsAgo, clearAppStorage, signUp } from './helpers'

test.describe('Onboarding activation', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
  })

  test('requires an explicit adult birthday and persists an under-age block', async ({ page }) => {
    await signUp(page)
    await page.getByRole('button', { name: 'Skip' }).click()

    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('Enter your date of birth to continue.')

    await page.getByLabel('Date of birth').fill(birthdayYearsAgo(17))
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'This one is built for adults' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'This one is built for adults' })).toBeVisible()
    await expect(page.getByLabel('Date of birth')).toHaveCount(0)
  })

  test('resumes the draft and activates only after a real first meal', async ({ page }) => {
    await signUp(page, { name: 'Activation User' })
    await page.getByRole('button', { name: 'Skip' }).click()

    // Exact eighteenth birthday is eligible.
    await page.getByLabel('Date of birth').fill(birthdayYearsAgo(18))
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'About you' })).toBeVisible()

    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Your goal' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Your body' })).toBeVisible()
    await page.getByLabel('Height (cm)').fill('182')

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Your body' })).toBeVisible()
    await expect(page.getByLabel('Height (cm)')).toHaveValue('182')

    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Activity level' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Your daily targets' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue to first meal' }).click()

    await page.getByLabel('Meal name').fill('Banana oat bowl')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Log your first meal' })).toBeVisible()
    await expect(page.getByLabel('Meal name')).toHaveValue('Banana oat bowl')

    await page.getByLabel('Calories', { exact: true }).fill('380')
    await page.getByLabel('Protein (g)').fill('14')
    await page.getByLabel('Carbs (g)').fill('62')
    await page.getByLabel('Fat (g)').fill('9')
    await page.getByRole('button', { name: 'Log first meal' }).click()

    await page.waitForURL('/')
    const celebration = page.getByRole('dialog', { name: 'Meal logged' })
    await expect(celebration).toContainText('Banana oat bowl')
    await celebration.waitFor({ state: 'hidden', timeout: 4000 })
    await expect(page.getByText('Banana oat bowl')).toBeVisible()

    const draftKeys = await page.evaluate(() => (
      Object.keys(localStorage).filter(key => key.startsWith('fud-onboarding-draft-'))
    ))
    expect(draftKeys).toEqual([])
  })

  test('refuses a goal weight below BMI 18.5 before showing targets', async ({ page }) => {
    await signUp(page)
    await page.getByRole('button', { name: 'Skip' }).click()
    await page.getByLabel('Date of birth').fill(birthdayYearsAgo(25))

    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

    await page.getByRole('button', { name: 'Lose Weight' }).click()
    await page.getByLabel('Goal weight (kg)').fill('50')
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('below a healthy weight')
    await expect(page.getByRole('heading', { name: 'Your goal' })).toBeVisible()

    await page.getByLabel('Goal weight (kg)').fill('60')
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Your body' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Activity level' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Your daily targets' })).toBeVisible()
  })
})
