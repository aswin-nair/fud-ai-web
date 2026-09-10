import { expect, test } from '@playwright/test'

test('signup keeps its URL, password privacy, and validation feedback in sync', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/login?mode=signup&claim=1')
  await expect(page.getByRole('heading', { name: 'Join the food club.' })).toBeVisible()
  await page.getByLabel('Name', { exact: true }).fill('Preview guest')
  await page.getByLabel('Email', { exact: true }).fill('preview@example.test')
  await page.getByLabel('Password', { exact: true }).fill('SamplePassword123')
  await expect(page.getByText('Eyes closed. Your password is your business.')).toBeVisible()
  await page.getByRole('button', { name: 'Show password', exact: true }).click()
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByLabel('Confirm password', { exact: true }).fill('Mismatch123')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Passwords do not match')
  await expect(page.getByRole('alert')).toBeFocused()
  await page.locator('.auth-tabs').getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/mode=signin&claim=1/)
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Welcome back!' })).toBeVisible()
  expect(errors).toEqual([])
})

for (const width of [320, 390, 1440]) {
  test(`food-club signup stays readable in both themes at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width > 900 ? 1100 : 844 })
    await page.goto('/login?mode=signup')
    await expect(page.getByRole('heading', { name: 'Join the food club.' })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('radio', { name: theme, exact: true }).check()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.toLowerCase())
      await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Create account', exact: true }).scrollIntoViewIfNeeded()
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
      expect(fits).toBe(true)
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: testInfo.outputPath(`signup-${theme.toLowerCase()}.png`), fullPage: true, animations: 'disabled' })
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Join the food club.' })).toBeVisible()
    await expect(page.getByLabel('Email', { exact: true })).toBeEditable()
  })
}
