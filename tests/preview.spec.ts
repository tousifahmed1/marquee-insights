import { expect, test } from '@playwright/test'

import { CACHE_POLICIES } from '../src/lib/cache-control'

const secret = process.env.SANITY_PREVIEW_SECRET ?? ''

test.beforeAll(() => {
  expect(secret, 'Set SANITY_PREVIEW_SECRET in .env to test preview mode').not.toBe('')
})

test('preview pages are hidden without a valid preview session', async ({ request }) => {
  const response = await request.get('/preview/about')
  expect(response.status()).toBe(404)
  expect(response.headers()['cache-control']).toBe(CACHE_POLICIES.noStore['Cache-Control'])

  const wrongSecret = await request.get('/api/preview/enable?secret=wrong&path=/about', {
    maxRedirects: 0,
  })
  expect(wrongSecret.status()).toBe(401)
})

test('preview mode shows a banner, sends no-store and can be exited', async ({ page }) => {
  await page.goto(`/api/preview/enable?secret=${encodeURIComponent(secret)}&path=/about`)
  await expect(page).toHaveURL('/preview/about')

  const banner = page.getByRole('complementary', { name: 'Preview mode' })
  await expect(banner).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const document = await page.request.get('/preview/about')
  expect(document.status()).toBe(200)
  expect(document.headers()['cache-control']).toBe(CACHE_POLICIES.noStore['Cache-Control'])
  expect(document.headers()['cloudflare-cdn-cache-control']).toBeUndefined()

  await banner.getByRole('link', { name: 'Exit preview' }).click()
  await expect(page).toHaveURL('/about')
  await expect(banner).toBeHidden()

  const afterExit = await page.request.get('/preview/about')
  expect(afterExit.status()).toBe(404)
})
