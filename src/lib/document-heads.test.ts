import { describe, expect, it } from 'vitest'

import type { Page, Report, SiteSettings } from '@/content'
import { pageUrl, reportUrl } from '@/content/urls'

import { homeHead, pageHead, reportHead } from './document-heads'

const SITE = 'https://marquee-insights.tousifahmed.workers.dev'
const seo = { title: null, description: null, ogImage: null, noindex: false }

const settings: SiteSettings = {
  siteName: 'Marquee Insights',
  navLinks: [],
  footerLinks: [],
  defaultSeo: { title: 'Audience research', description: 'Default description.', ogImage: null },
}

const page = (slug: string): Page => ({ id: slug, title: 'About us', slug, sections: [], seo })

const report: Report = {
  id: 'r',
  title: 'The second-season slump',
  slug: 'the-second-season-slump',
  publishedAt: '2026-10-27',
  updatedAt: '2026-10-28T09:00:00Z',
  category: 'tv',
  excerpt: 'A third of viewers drift away.',
  coverImage: null,
  body: [],
  seo,
}

const canonical = (head: ReturnType<typeof pageHead>) =>
  'links' in head ? head.links.find((link) => link.rel === 'canonical')?.href : undefined
const hasJsonLd = (head: ReturnType<typeof reportHead>) =>
  'meta' in head && head.meta.some((meta) => 'script:ld+json' in meta)

describe('document URLs', () => {
  it('serves the home page document at / and reports under /reports', () => {
    expect(pageUrl('home')).toBe('/')
    expect(pageUrl('about')).toBe('/about')
    expect(reportUrl('a-report')).toBe('/reports/a-report')
  })
})

describe('document heads', () => {
  it.each([
    ['home', () => homeHead(settings, undefined, { preview: false })],
    ['page', () => pageHead(settings, undefined, { preview: true })],
    ['report', () => reportHead(settings, undefined, { preview: false })],
  ])('leaves the %s head to the root when there is no data', (_name, head) => {
    expect(head()).toEqual({})
  })

  it('gives published documents their canonical URL', () => {
    expect(canonical(homeHead(settings, page('home'), { preview: false }))).toBe(`${SITE}/`)
    expect(canonical(pageHead(settings, page('about'), { preview: false }))).toBe(`${SITE}/about`)
    expect(canonical(reportHead(settings, report, { preview: false }))).toBe(
      `${SITE}/reports/the-second-season-slump`,
    )
  })

  it('gives previews no canonical URL and no structured data', () => {
    expect(canonical(pageHead(settings, page('about'), { preview: true }))).toBeUndefined()
    const preview = reportHead(settings, report, { preview: true })
    expect(canonical(preview)).toBeUndefined()
    expect(hasJsonLd(preview)).toBe(false)
  })

  it('adds Article data to published reports', () => {
    expect(hasJsonLd(reportHead(settings, report, { preview: false }))).toBe(true)
  })

  it('titles pages by their document but leaves the home title to its SEO fields', () => {
    const title = (head: ReturnType<typeof pageHead>) =>
      'meta' in head ? head.meta.find((meta) => 'title' in meta)?.title : undefined
    expect(title(pageHead(settings, page('about'), { preview: false }))).toBe('About us | Marquee Insights')
    expect(title(homeHead(settings, page('home'), { preview: false }))).toBe('Audience research | Marquee Insights')
  })
})
