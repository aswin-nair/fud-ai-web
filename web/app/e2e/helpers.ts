import type { Page } from '@playwright/test'

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@fud-ai.test`
}

export async function clearAppStorage(page: Page): Promise<void> {
  await page.goto('/login')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

export async function clickAuthTab(page: Page, tab: 'Sign in' | 'Sign up'): Promise<void> {
  await page.locator('.auth-tabs').getByRole('button', { name: tab, exact: true }).click()
}

export async function signUp(page: Page, opts?: { name?: string; email?: string; password?: string }) {
  const email = opts?.email ?? uniqueEmail()
  const password = opts?.password ?? 'TestPass123!'
  const name = opts?.name ?? 'E2E User'

  await clickAuthTab(page, 'Sign up')
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()

  await page.waitForURL(/\/onboarding/)
  return { email, password, name }
}

export async function completeOnboarding(page: Page): Promise<void> {
  await page.getByRole('heading', { name: 'Welcome to Fud AI' }).waitFor()

  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Continue' }).click()
  }
  await page.getByRole('button', { name: 'Get started' }).click()
  await page.waitForURL('/')
}

export async function signUpAndOnboard(page: Page) {
  await clearAppStorage(page)
  const creds = await signUp(page)
  await completeOnboarding(page)
  return creds
}

export async function signInWithEmail(page: Page, email: string, password: string): Promise<void> {
  await clickAuthTab(page, 'Sign in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.locator('form.auth-form').getByRole('button', { name: 'Sign in' }).click()
}

export function nav(page: Page) {
  return page.getByLabel('Main')
}

export async function logManualMeal(
  page: Page,
  meal: { name: string; calories: string; protein?: string; carbs?: string; fat?: string },
): Promise<void> {
  await page.getByRole('button', { name: 'Log food' }).click()
  await page.getByRole('menuitem', { name: 'Manual Entry' }).click()
  await page.waitForURL(/\/log\/manual/)

  await page.getByLabel('Food name').fill(meal.name)
  await page.getByLabel('Calories').fill(meal.calories)
  if (meal.protein) await page.getByLabel('Protein (g)').fill(meal.protein)
  if (meal.carbs) await page.getByLabel('Carbs (g)').fill(meal.carbs)
  if (meal.fat) await page.getByLabel('Fat (g)').fill(meal.fat)

  await page.getByRole('button', { name: 'Log meal' }).click()
  await page.waitForURL('/')
}
