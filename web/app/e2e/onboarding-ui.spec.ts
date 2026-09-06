import { expect, test } from '@playwright/test'
import { birthdayYearsAgo, settlePageLayout } from './helpers'

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  test(`onboarding keeps every step usable at ${viewport.width}px`, async ({ page }, testInfo) => {
    test.setTimeout(120_000)
    await page.setViewportSize(viewport)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/onboarding')
    await expect(page.getByRole('button', { name: 'Get started', exact: true })).toBeVisible()
    await settlePageLayout(page)
    const start = await page.getByRole('button', { name: 'Get started', exact: true }).boundingBox()
    expect(start!.y + start!.height).toBeLessThanOrEqual(viewport.height)
    await page.screenshot({ path: testInfo.outputPath('welcome.png'), animations: 'disabled' })
    await page.getByRole('button', { name: 'Next introduction' }).click()
    await expect(page.getByRole('button', { name: 'Previous introduction' })).toBeEnabled()
    await page.getByRole('button', { name: 'Previous introduction' }).click()
    await page.getByRole('button', { name: 'Get started', exact: true }).click()

    for (let step = 0; step < 8; step++) {
      await expect(page.getByRole('progressbar', { name: 'Onboarding progress' })).toHaveAttribute('aria-valuenow', String(step + 1))
      await settlePageLayout(page)
      const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth)
      expect(overflow, `Horizontal overflow at step ${step + 1}`).toBeLessThanOrEqual(1)
      if ([0, 3, 4, 6, 7].includes(step)) await page.screenshot({ path: testInfo.outputPath(`step-${step + 1}.png`), animations: 'disabled', fullPage: true })
      if (step === 0) await page.getByLabel('Date of birth').fill(birthdayYearsAgo(25))
      if (step === 4) {
        await page.getByRole('button', { name: /^Moderate / }).click()
        await expect(page.getByRole('button', { name: /^Moderate / })).toHaveAttribute('aria-pressed', 'true')
      }
      if (step === 7) {
        await page.getByLabel('Meal name').fill('Yogurt and berries')
        await page.getByLabel('Calories', { exact: true }).fill('320')
        await page.getByRole('button', { name: 'Log first meal' }).click()
      } else {
        await page.getByRole('button', { name: step === 6 ? 'Continue to first meal' : 'Continue', exact: true }).click()
      }
    }
    await expect(page.getByRole('dialog', { name: 'Meal logged' })).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('small screens, enlarged text and keyboard navigation keep setup readable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/onboarding')
  await expect(page.getByRole('button', { name: 'Get started', exact: true })).toBeVisible()
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  const fits = async () => {
    await settlePageLayout(page)
    const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  }
  await fits()
  await page.screenshot({ path: testInfo.outputPath('welcome-large-text.png'), animations: 'disabled', fullPage: true })
  await page.getByRole('button', { name: 'Get started', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'What is your date of birth?' })).toBeFocused()
  await fits()
  await page.getByLabel('Date of birth').fill(birthdayYearsAgo(25))
  for (let step = 1; step <= 3; step++) {
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await fits()
  }
  await page.getByRole('button', { name: /^Gain Weight/ }).focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: /^Gain Weight/ })).toHaveAttribute('aria-pressed', 'true')
  await fits()
  await page.screenshot({ path: testInfo.outputPath('goal-large-text.png'), animations: 'disabled', fullPage: true })
})
