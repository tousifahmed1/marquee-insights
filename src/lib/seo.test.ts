import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CmsImage, Report, Seo, SiteSettings } from '@/content'

import { formatTitle, resolveSeo, seoHead } from './seo'
import { articleJsonLd, organizationJsonLd } from './structured-data'

beforeEach(() => {
  vi.stubEnv('SANITY_STUDIO_PROJECT_ID', 'test-project')
  vi.stubEnv('SANITY_STUDIO_DATASET', 'test')
})

const SITE = 'https://marquee-insights.tousifahmed.workers.dev'

const image = (alt: string): CmsImage => ({
  assetId: 'image-abc123-1600x1000-png',
  alt,
  width: 1600,
  height: 1000,
  lqip: null,
  hotspot: null,
  crop: null,
})

const settings: SiteSettings = {
  siteName: 'Marquee Insights',
  navLinks: [],
  footerLinks: [],
  defaultSeo: {
    title: 'Marquee Insights | Audience research',
    description: 'Default description.',
    ogImage: image('Default sharing image'),
  },
}

const seo = (overrides: Partial<Seo> = {}): Seo => ({
  title: null,
  description: null,
  ogImage: null,
  noindex: false,
  ...overrides,
})

type Tag = { name?: string; property?: string; content?: string }
const tag = (tags: Tag[], key: string) =>
  tags.find((entry) => entry.name === key || entry.property === key)?.content

describe('formatTitle', () => {
  it.each([
    ['About us', 'About us | Marquee Insights'],
    ['About us | Marquee Insights', 'About us | Marquee Insights'],
    ['Marquee Insights | Audience research', 'Audience research | Marquee Insights'],
    ['About us – Marquee Insights', 'About us | Marquee Insights'],
    ['  Reports  ', 'Reports | Marquee Insights'],
    ['Marquee Insights', 'Marquee Insights'],
    ['', 'Marquee Insights'],
  ])('formats %j as %j', (base, expected) => {
    expect(formatTitle(base, 'Marquee Insights')).toBe(expected)
  })

  it('treats the site name literally, not as a pattern', () => {
    expect(formatTitle('Home | A+B (Research)', 'A+B (Research)')).toBe('Home | A+B (Research)')
  })
})

describe('resolveSeo', () => {
  it('prefers the document SEO fields over the page fields and site defaults', () => {
    const resolved = resolveSeo(settings, {
      seo: seo({ title: 'Search title', description: 'Search description', ogImage: image('SEO') }),
      title: 'Page title',
      description: 'Excerpt',
      image: image('Cover'),
    })
    expect(resolved).toMatchObject({
      title: 'Search title | Marquee Insights',
      description: 'Search description',
      image: { alt: 'SEO' },
    })
  })

  it('falls back to the page fields, then the site defaults', () => {
    expect(resolveSeo(settings, { seo: seo(), title: 'Contact' })).toMatchObject({
      title: 'Contact | Marquee Insights',
      description: 'Default description.',
      image: { alt: 'Default sharing image' },
    })
    expect(resolveSeo(settings)).toMatchObject({
      title: 'Audience research | Marquee Insights',
      path: null,
      type: 'website',
    })
  })
})

describe('seoHead', () => {
  it('adds a canonical URL, Open Graph and Twitter tags for a page', () => {
    const { meta, links } = seoHead(resolveSeo(settings, { title: 'About us', path: '/about' }))
    expect(meta[0]).toEqual({ title: 'About us | Marquee Insights' })
    expect(links).toEqual([{ rel: 'canonical', href: `${SITE}/about` }])
    expect(tag(meta, 'og:url')).toBe(`${SITE}/about`)
    expect(tag(meta, 'og:site_name')).toBe('Marquee Insights')
    expect(tag(meta, 'og:type')).toBe('website')
    expect(tag(meta, 'twitter:card')).toBe('summary_large_image')
    expect(tag(meta, 'twitter:title')).toBe('About us | Marquee Insights')
    expect(tag(meta, 'twitter:description')).toBe('Default description.')
    expect(tag(meta, 'twitter:image')).toBe(tag(meta, 'og:image'))
    expect(tag(meta, 'og:image')).toMatch(/^https:\/\/cdn\.sanity\.io\/.*w=1200&h=630/)
    expect(tag(meta, 'twitter:image:alt')).toBe('Default sharing image')
  })

  it('gives every tag name or property once', () => {
    const { meta } = seoHead(resolveSeo(settings, { title: 'About us', path: '/about' }))
    const keys = meta.flatMap((entry) => [entry.name ?? entry.property ?? []].flat())
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('leaves out the canonical URL when there is no path or the page is hidden', () => {
    expect(seoHead(resolveSeo(settings, { title: 'Draft' })).links).toEqual([])
    const hidden = seoHead(resolveSeo(settings, { seo: seo({ noindex: true }), path: '/hidden' }))
    expect(hidden.links).toEqual([])
    expect(tag(hidden.meta, 'og:url')).toBeUndefined()
    expect(tag(hidden.meta, 'robots')).toBe('noindex')
  })

  it('uses a summary card without an image', () => {
    const { meta } = seoHead({ ...resolveSeo(settings, { path: '/' }), image: null })
    expect(tag(meta, 'twitter:card')).toBe('summary')
    expect(tag(meta, 'og:image')).toBeUndefined()
  })

  it('marks reports as articles with their dates', () => {
    const { meta } = seoHead(
      resolveSeo(settings, {
        title: 'The second-season slump',
        path: '/reports/the-second-season-slump',
        type: 'article',
        publishedAt: '2026-10-27',
        modifiedAt: '2026-11-02T08:39:21Z',
      }),
    )
    expect(tag(meta, 'og:type')).toBe('article')
    expect(tag(meta, 'article:published_time')).toBe('2026-10-27')
    expect(tag(meta, 'article:modified_time')).toBe('2026-11-02T08:39:21Z')
  })
})

describe('structured data', () => {
  const report: Report = {
    id: 'report-1',
    slug: 'the-second-season-slump',
    title: 'The second-season slump',
    publishedAt: '2026-10-27',
    updatedAt: '2026-11-02T08:39:21Z',
    category: 'tv',
    excerpt: 'Why viewers leave by episode four.',
    coverImage: image('Cover'),
    body: [],
    seo: seo(),
  }

  it('describes the organisation', () => {
    expect(organizationJsonLd(settings)['script:ld+json']).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Marquee Insights',
      url: `${SITE}/`,
      description: 'Default description.',
    })
  })

  it('describes a report as an Article published by the organisation', () => {
    const data = articleJsonLd(report, settings)['script:ld+json']
    expect(data).toMatchObject({
      '@type': 'Article',
      headline: 'The second-season slump',
      description: 'Why viewers leave by episode four.',
      url: `${SITE}/reports/the-second-season-slump`,
      mainEntityOfPage: `${SITE}/reports/the-second-season-slump`,
      datePublished: '2026-10-27',
      dateModified: '2026-11-02T08:39:21Z',
      author: { '@type': 'Organization', '@id': `${SITE}/#organization` },
      publisher: { '@type': 'Organization', name: 'Marquee Insights' },
    })
    expect(data.image).toMatch(/^https:\/\/cdn\.sanity\.io\//)
  })

  it('leaves out dates and the image when a report has none', () => {
    const data = articleJsonLd(
      { ...report, publishedAt: null, updatedAt: null, coverImage: null },
      { ...settings },
    )['script:ld+json']
    expect(data).not.toHaveProperty('datePublished')
    expect(data).not.toHaveProperty('dateModified')
    expect(data).not.toHaveProperty('image')
  })
})
