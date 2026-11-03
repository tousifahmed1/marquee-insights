import { expect, test } from '@playwright/test'

import { gotoHydrated } from './helpers'

const RESULTS = { name: 'Survey responses, scrollable' }

test('explore filters update the URL and table, and a reload restores the view', async ({ page }) => {
  await gotoHydrated(page, '/explore')
  const status = page.locator('main [aria-live="polite"]')
  const table = page.getByRole('region', RESULTS)
  const rows = table.locator('tbody tr')
  const platformCells = table.locator('tbody td:nth-child(3)')
  const platformSelect = page
    .getByRole('complementary', { name: 'Filters' })
    .getByRole('combobox', { name: 'Platform' })

  await expect(status).toHaveText(/^[\d,]+ responses$/)
  const totalBefore = await status.textContent()
  expect(new Set(await platformCells.allTextContents()).size).toBeGreaterThan(1)

  await platformSelect.click()
  await page.getByRole('option', { name: 'Tidewell' }).click()

  await expect(page).toHaveURL(/\/explore\?platform=tidewell$/)
  await expect(status).toHaveText(/^[\d,]+ responses$/)
  await expect(status).not.toHaveText(totalBefore ?? '')
  await expect
    .poll(async () => [...new Set(await platformCells.allTextContents())])
    .toEqual(['Tidewell'])
  const totalAfter = await status.textContent()
  const rowsAfter = await rows.allTextContents()
  expect(rowsAfter).toHaveLength(25)

  await page.reload()
  await page.locator('html[data-hydrated="true"]').waitFor({ state: 'attached' })
  await expect(page).toHaveURL(/\/explore\?platform=tidewell$/)
  await expect(platformSelect).toHaveText('Tidewell')
  await expect(status).toHaveText(totalAfter ?? '')
  expect(await rows.allTextContents()).toEqual(rowsAfter)

  await page.goBack()
  await expect(page).toHaveURL(/\/explore$/)
  await expect(platformSelect).toHaveText('All platforms')
  await expect(status).toHaveText(totalBefore ?? '')
})

test('the first view of a filtered explore URL is rendered on the server', async ({ request }) => {
  const response = await request.get('/explore?region=west&sort=awareness')
  expect(response.status()).toBe(200)
  const html = await response.text()
  expect(html.match(/<tr/g)?.length ?? 0).toBeGreaterThan(25)
  expect(html).toMatch(/Showing 1–25 of [\d,]+/)
  expect(html.match(/class="recharts-surface"/g)).toHaveLength(2)
  expect(html).not.toMatch(/Responses unavailable/)
})

test('sorting by a column is kept in the URL', async ({ page }) => {
  await gotoHydrated(page, '/explore?genre=documentary')
  const table = page.getByRole('region', RESULTS)
  await table.getByRole('button', { name: 'Intent to watch' }).click()

  await expect(page).toHaveURL(/\/explore\?genre=documentary&sort=intent$/)
  const header = table.getByRole('columnheader', { name: 'Intent to watch' })
  await expect(header).toHaveAttribute('aria-sort', 'descending')
  await expect
    .poll(async () => {
      const values = (await table.locator('tbody td:nth-child(8)').allTextContents()).map(Number)
      return values.length === 25 && values.every((value, i) => i === 0 || values[i - 1]! >= value)
    })
    .toBe(true)
})

test('explore says "intent to watch", ranks platforms and separates show names from genres', async ({ page }) => {
  await page.goto('/explore')
  const text = await page.locator('body').innerText()
  expect(text).not.toMatch(/purchase/i)
  await expect(page.getByRole('heading', { name: 'Intent to watch by platform' })).toBeVisible()

  const averages = (
    await page.locator('table', { has: page.locator('caption', { hasText: 'Intent to watch by platform' }) })
      .locator('tbody td:first-of-type')
      .allTextContents()
  ).flatMap((cell) => (cell === 'No responses' ? [] : [Number(cell)]))
  expect(averages.length).toBeGreaterThan(1)
  expect(averages).toEqual([...averages].sort((a, b) => b - a))

  const show = await page.getByRole('region', RESULTS).locator('tbody td:nth-child(2)').first().textContent()
  expect(show).toMatch(/^\S.*, \S/)
})
