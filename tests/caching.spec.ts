import { expect, test } from '@playwright/test'

import { NAV_LINKS } from '../src/components/nav-links'
import { CACHE_POLICIES } from '../src/lib/cache-control'

const expectPolicy = (
  headers: Record<string, string>,
  policy: Record<string, string>,
) => {
  for (const [name, value] of Object.entries(policy)) {
    expect(headers[name.toLowerCase()], name).toBe(value)
  }
}

for (const { to } of NAV_LINKS) {
  test(`${to} is cached at the edge as a content page`, async ({ request }) => {
    const response = await request.get(to)
    expect(response.status()).toBe(200)
    expectPolicy(response.headers(), CACHE_POLICIES.content)
  })
}

test('unknown URLs return a short-lived 404 page', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist')
  expect(response?.status()).toBe(404)
  expectPolicy(response?.headers() ?? {}, CACHE_POLICIES.notFound)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Go to the home page' }),
  ).toBeVisible()
})
