import { expect, test } from '@playwright/test'

import { gotoHydrated } from './helpers'

test('home page renders its CMS sections with a single h1', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty()
  expect(await page.locator('main section').count()).toBeGreaterThan(1)
})

test('reports listing filters by category and pages through results in the URL', async ({ page }) => {
  await gotoHydrated(page, '/reports')
  await expect(page.getByRole('heading', { level: 1, name: 'Reports' })).toBeVisible()
  const cards = page.locator('main article')
  await expect(cards.first()).toBeVisible()

  await page.getByRole('navigation', { name: 'Filter reports by category' }).getByRole('link', { name: 'TV' }).click()
  await expect(page).toHaveURL('/reports?category=tv')
  await expect(page.getByText(/^\d+ reports? in TV$/)).toBeVisible()
  for (const card of await cards.all()) {
    await expect(card.getByText('TV', { exact: true })).toBeVisible()
  }

  await gotoHydrated(page, '/reports')
  const older = page.getByRole('link', { name: 'Older reports' })
  if (await older.count()) {
    await older.click()
    await expect(page).toHaveURL('/reports?page=2')
    await expect(page.getByRole('link', { name: 'Newer reports' })).toBeVisible()
  }
})

test('a report opens from the listing and renders its body', async ({ page }) => {
  await gotoHydrated(page, '/reports')
  const firstTitle = page.locator('main article h2 a').first()
  const title = (await firstTitle.textContent())?.trim() ?? ''
  expect(title).not.toBe('')

  await firstTitle.click()
  await expect(page).toHaveURL(/\/reports\/[a-z0-9-]+$/)
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await expect(page.locator('article p').first()).toBeVisible()

  const direct = await page.request.get(new URL(page.url()).pathname)
  expect(direct.status()).toBe(200)
})

test('unknown report and page slugs return a 404 page', async ({ page }) => {
  for (const path of ['/reports/this-report-does-not-exist', '/this-page-does-not-exist', '/reports?page=999']) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(404)
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  }
})
