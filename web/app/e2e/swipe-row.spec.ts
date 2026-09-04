import { test, expect } from '@playwright/test'
import { signUpAndOnboard } from './helpers'

/* The swipe row is the one gesture in the app that shares an axis with an
   existing browser behaviour. These check the two ways it can go wrong: it
   stops working, or it starts eating vertical scrolling. */
test.describe('Swipe-to-edit meal rows', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 900 })
    await signUpAndOnboard(page)
    await page.goto('/')
    await page.getByLabel('Main').waitFor({ state: 'visible' })
    // The list renders after the reveal delay; without this the counts below
    // measure an empty page and the assertions are vacuous.
    await page.locator('.swipe-row').first().waitFor({ state: 'visible' })
    // Pointer coordinates need the row in the viewport, not merely rendered
    // below Today's summary. Keep both gesture tests independent of its height.
    await page.locator('.swipe-row').first().scrollIntoViewIfNeeded()
    await expect(page.locator('.swipe-row').first()).toBeInViewport()
  })

  test('a horizontal drag reveals the actions', async ({ page }) => {
    const row = page.locator('.swipe-row').first()
    await expect(row).toBeVisible()
    const box = (await row.boundingBox())!

    await page.mouse.move(box.x + box.width - 30, box.y + box.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(box.x + box.width - 30 - i * 16, box.y + box.height / 2)
    }
    await page.mouse.up()

    await expect(row).toHaveAttribute('data-open', 'true')
  })

  test('a vertical drag scrolls instead of opening the row', async ({ page }) => {
    const row = page.locator('.swipe-row').first()
    await expect(row).not.toHaveAttribute('data-open', 'true')
    const box = (await row.boundingBox())!

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - i * 14)
    }
    await page.mouse.up()

    await expect(row).not.toHaveAttribute('data-open', 'true')
  })

  test('the actions are real buttons, reachable without the gesture', async ({ page }) => {
    // A gesture-only control is unusable by keyboard and by anyone who cannot
    // swipe, so the buttons must exist in the DOM whether or not it is open.
    const actions = page.locator('.swipe-row-action')
    await expect(actions.filter({ hasText: 'Edit' }).first()).toBeAttached()
    await expect(actions.filter({ hasText: 'Delete' }).first()).toBeAttached()
  })

  test('delete removes the meal', async ({ page }) => {
    const rows = page.locator('.swipe-row')
    const before = await rows.count()
    expect(before).toBeGreaterThan(0)

    await page.locator('.swipe-row-action.is-danger').first().click({ force: true })
    await expect(rows).toHaveCount(before - 1)
  })
})
