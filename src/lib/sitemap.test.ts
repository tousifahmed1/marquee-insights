import { describe, expect, it } from 'vitest'

import { STATIC_SITEMAP_PATHS, buildRobotsTxt, buildSitemapXml } from './sitemap'

const SITE = 'https://marquee-insights.tousifahmed.workers.dev'
const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

describe('buildSitemapXml', () => {
  it('lists the static routes and CMS entries as absolute URLs', () => {
    const xml = buildSitemapXml([
      { path: '/about', updatedAt: '2026-11-02T15:18:53Z' },
      { path: '/reports/the-second-season-slump', updatedAt: null },
    ])
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset')).toBe(true)
    expect(locs(xml)).toEqual([
      ...STATIC_SITEMAP_PATHS.map((path) => `${SITE}${path}`),
      `${SITE}/about`,
      `${SITE}/reports/the-second-season-slump`,
    ])
    expect(xml).toContain(`<loc>${SITE}/about</loc>\n    <lastmod>2026-11-02T15:18:53Z</lastmod>`)
  })

  it('lists the home page once, with the CMS date', () => {
    const xml = buildSitemapXml([{ path: '/', updatedAt: '2026-11-02T08:39:21Z' }])
    expect(locs(xml).filter((loc) => loc === `${SITE}/`)).toHaveLength(1)
    expect(xml).toContain(`<loc>${SITE}/</loc>\n    <lastmod>2026-11-02T08:39:21Z</lastmod>`)
  })

  it('escapes XML special characters', () => {
    expect(buildSitemapXml([{ path: '/a&b', updatedAt: null }])).toContain(`<loc>${SITE}/a&amp;b</loc>`)
  })
})

describe('buildRobotsTxt', () => {
  it('allows crawling, hides previews and APIs, and points to the sitemap', () => {
    const robots = buildRobotsTxt()
    expect(robots).toContain('User-agent: *\nAllow: /\nDisallow: /preview\nDisallow: /api/')
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`)
  })
})
