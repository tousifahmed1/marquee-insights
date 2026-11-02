import { describe, expect, it } from 'vitest'

import type {
  PAGE_BY_SLUG_QUERY_RESULT,
  REPORTS_QUERY_RESULT,
  REPORT_BY_SLUG_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
} from '../sanity.types'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_SITE_NAME,
  mapPage,
  mapReport,
  mapReportList,
  mapReportSummary,
  mapSiteSettings,
} from './documents'
import { malformed } from './test-fixtures'

const report = {
  _id: 'report-a',
  title: 'The second-season slump',
  slug: 'the-second-season-slump',
  publishedAt: '2026-10-27',
  category: 'tv',
  excerpt: 'A third of viewers drift away.',
  coverImage: null,
}

describe('mapSiteSettings', () => {
  it('returns complete defaults when settings are missing', () => {
    expect(mapSiteSettings(undefined)).toEqual({
      siteName: DEFAULT_SITE_NAME,
      navLinks: [],
      footerLinks: [],
      defaultSeo: { title: DEFAULT_SITE_NAME, description: DEFAULT_DESCRIPTION, ogImage: null },
    })
    expect(mapSiteSettings(null)).toEqual(mapSiteSettings(undefined))
  })

  it('survives malformed settings', () => {
    const settings = mapSiteSettings(
      malformed<SITE_SETTINGS_QUERY_RESULT>({ siteName: 42, navLinks: 'Home', defaultSeoTitle: [] }),
    )
    expect(settings.siteName).toBe(DEFAULT_SITE_NAME)
    expect(settings.navLinks).toEqual([])
    expect(settings.defaultSeo.title).toBe(DEFAULT_SITE_NAME)
  })

  it('uses the site name as the default search title', () => {
    expect(
      mapSiteSettings(malformed<SITE_SETTINGS_QUERY_RESULT>({ siteName: 'Marquee' })).defaultSeo.title,
    ).toBe('Marquee')
  })
})

describe('mapPage', () => {
  it('returns null when the page does not exist or has no id or slug', () => {
    expect(mapPage(null)).toBeNull()
    expect(mapPage(malformed<PAGE_BY_SLUG_QUERY_RESULT>({ _id: 'p', title: 'About' }))).toBeNull()
    expect(mapPage(malformed<PAGE_BY_SLUG_QUERY_RESULT>('page'))).toBeNull()
  })

  it('fills in a missing title, sections and SEO', () => {
    expect(mapPage(malformed<PAGE_BY_SLUG_QUERY_RESULT>({ _id: 'p', slug: 'about', sections: 'x' }))).toEqual({
      id: 'p',
      slug: 'about',
      title: DEFAULT_SITE_NAME,
      sections: [],
      seo: { title: null, description: null, ogImage: null, noindex: false },
    })
  })
})

describe('mapReportSummary', () => {
  it('requires an id, slug and title', () => {
    expect(mapReportSummary({ ...report, title: ' ' })).toBeNull()
    expect(mapReportSummary({ ...report, slug: null })).toBeNull()
  })

  it('turns unknown categories and invalid dates into null', () => {
    expect(mapReportSummary({ ...report, category: 'radio', publishedAt: '27/10/2026' })).toMatchObject({
      category: null,
      publishedAt: null,
    })
    expect(mapReportSummary({ ...report, publishedAt: '2026-13-45' })?.publishedAt).toBeNull()
  })

  it('handles a report with every optional field missing', () => {
    expect(mapReportSummary({ _id: 'r', slug: 'notes', title: 'Field notes' })).toEqual({
      id: 'r',
      slug: 'notes',
      title: 'Field notes',
      publishedAt: null,
      category: null,
      excerpt: null,
      coverImage: null,
    })
  })
})

describe('mapReport', () => {
  it('defaults the body and SEO', () => {
    const mapped = mapReport(malformed<REPORT_BY_SLUG_QUERY_RESULT>({ ...report, body: null }))
    expect(mapped?.body).toEqual([])
    expect(mapped?.seo.noindex).toBe(false)
  })

  it('keeps a valid last-updated time and drops anything else', () => {
    const at = (updatedAt: unknown) =>
      mapReport(malformed<REPORT_BY_SLUG_QUERY_RESULT>({ ...report, updatedAt }))?.updatedAt
    expect(at('2026-11-02T08:39:21Z')).toBe('2026-11-02T08:39:21Z')
    expect(at('2026-11-02T08:39:21.123Z')).toBe('2026-11-02T08:39:21.123Z')
    expect(at('2026-11-02')).toBeNull()
    expect(at('2026-13-40T00:00:00Z')).toBeNull()
    expect(at(42)).toBeNull()
    expect(at(undefined)).toBeNull()
  })

  it('returns null for a missing report', () => {
    expect(mapReport(null)).toBeNull()
  })
})

describe('mapReportList', () => {
  const request = { page: 1, pageSize: 6, category: null }

  it('returns an empty first page when the result is missing', () => {
    expect(mapReportList(undefined, request)).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 6,
      totalPages: 1,
      category: null,
    })
  })

  it('drops broken items and recovers from a malformed total', () => {
    const list = mapReportList(
      malformed<REPORTS_QUERY_RESULT>({ items: [report, null, { title: 'No id' }], total: -3 }),
      request,
    )
    expect(list.items.map((item) => item.id)).toEqual(['report-a'])
    expect(list.total).toBe(1)
  })

  it('works out the page count from the total', () => {
    const list = mapReportList(malformed<REPORTS_QUERY_RESULT>({ items: [report], total: 13 }), {
      ...request,
      page: 3,
      category: 'tv',
    })
    expect(list).toMatchObject({ total: 13, totalPages: 3, page: 3, category: 'tv' })
  })
})
