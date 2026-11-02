import { expect, test } from '@playwright/test'

const SITE = 'https://marquee-insights.tousifahmed.workers.dev'

function jsonLd(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (match) => JSON.parse(match[1]) as Record<string, unknown>,
  )
}

const canonicals = (html: string) =>
  [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((match) => match[1])

test('pages have a formatted title, one canonical URL and Organization data', async ({ request }) => {
  for (const path of ['/', '/about', '/reports', '/explore']) {
    const html = await (await request.get(path)).text()
    expect(html, path).toMatch(/<title>[^<]+ \| Marquee Insights<\/title>|<title>Marquee Insights<\/title>/)
    expect(canonicals(html), path).toEqual([`${SITE}${path}`])
    expect(html, path).toContain(`<meta property="og:url" content="${SITE}${path}"/>`)
    expect(html, path).toMatch(/<meta name="twitter:title" content="[^"]+"\/>/)
    expect(jsonLd(html).map((data) => data['@type']), path).toContain('Organization')
  }
})

test('a report has Article data that matches the page', async ({ page, request }) => {
  await page.goto('/reports')
  const href = await page.locator('a[href^="/reports/"]').first().getAttribute('href')
  expect(href).not.toBeNull()

  const html = await (await request.get(href ?? '')).text()
  const article = jsonLd(html).find((data) => data['@type'] === 'Article')
  const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1].replace(/<[^>]+>/g, '')
  expect(article).toMatchObject({
    headline: heading,
    url: `${SITE}${href}`,
    publisher: { '@type': 'Organization' },
  })
  expect(canonicals(html)).toEqual([`${SITE}${href}`])
  expect(html).toContain('<meta property="og:type" content="article"/>')
})

test('sitemap.xml lists the site and every report, and robots.txt points to it', async ({
  request,
}) => {
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  expect(sitemap.headers()['content-type']).toContain('application/xml')
  const xml = await sitemap.text()
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  expect(locs).toEqual(expect.arrayContaining([`${SITE}/`, `${SITE}/reports`, `${SITE}/explore`]))
  expect(new Set(locs).size).toBe(locs.length)

  const listing = await (await request.get('/reports')).text()
  const firstReport = /href="(\/reports\/[a-z0-9-]+)"/.exec(listing)?.[1]
  expect(locs).toContain(`${SITE}${firstReport}`)

  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`)
  expect(robots).toContain('Disallow: /preview')
})

test('unknown pages have no canonical URL', async ({ request }) => {
  const html = await (await request.get('/this-page-does-not-exist')).text()
  expect(canonicals(html)).toEqual([])
})
