import { describe, expect, it } from 'vitest'

import type { REDIRECTS_QUERY_RESULT, SITEMAP_QUERY_RESULT } from '../sanity.types'
import { mapRedirects, mapSitemap } from './routing'
import { malformed } from './test-fixtures'

describe('mapSitemap', () => {
  it('lists pages at their path, the home page at / and reports under /reports', () => {
    expect(
      mapSitemap({
        pages: [
          { slug: 'home', updatedAt: '2026-11-02T08:39:21Z' },
          { slug: 'about', updatedAt: '2026-11-02T15:18:53Z' },
        ],
        reports: [{ slug: 'the-second-season-slump', updatedAt: '2026-11-01T10:00:00Z' }],
      }),
    ).toEqual([
      { path: '/', updatedAt: '2026-11-02T08:39:21Z' },
      { path: '/about', updatedAt: '2026-11-02T15:18:53Z' },
      { path: '/reports/the-second-season-slump', updatedAt: '2026-11-01T10:00:00Z' },
    ])
  })

  it('drops entries with missing or unsafe slugs and bad dates', () => {
    expect(
      mapSitemap(
        malformed<SITEMAP_QUERY_RESULT>({
          pages: [{ slug: null }, { slug: '../admin' }, { slug: 'Contact Us' }, 'junk'],
          reports: [{ slug: 'ok', updatedAt: 'yesterday' }],
        }),
      ),
    ).toEqual([{ path: '/reports/ok', updatedAt: null }])
  })

  it('returns nothing for a missing result', () => {
    expect(mapSitemap(undefined)).toEqual([])
  })
})

describe('mapRedirects', () => {
  const map = (items: unknown[]) => mapRedirects(malformed<REDIRECTS_QUERY_RESULT>(items))

  it('maps permanent redirects to 301 and temporary ones to 302', () => {
    expect(
      map([
        { from: '/research', to: '/reports', permanent: true },
        { from: '/methodology', to: '/about', permanent: false },
        { from: '/elsewhere', to: 'https://example.com/page', permanent: null },
      ]),
    ).toEqual([
      { from: '/research', to: '/reports', status: 301 },
      { from: '/methodology', to: '/about', status: 302 },
      { from: '/elsewhere', to: 'https://example.com/page', status: 301 },
    ])
  })

  it('ignores a trailing slash on the source path', () => {
    expect(map([{ from: '/research/', to: '/reports', permanent: true }])).toEqual([
      { from: '/research', to: '/reports', status: 301 },
    ])
  })

  it.each([
    ['a protocol-relative target', { from: '/a', to: '//evil.example' }],
    ['a javascript: target', { from: '/a', to: 'javascript:alert(1)' }],
    ['a plain http target', { from: '/a', to: 'http://example.com' }],
    ['a relative target', { from: '/a', to: 'reports' }],
    ['a full URL as the source', { from: 'https://example.com/a', to: '/b' }],
    ['a source with a query string', { from: '/a?x=1', to: '/b' }],
    ['a redirect to itself', { from: '/a/', to: '/a' }],
    ['a missing target', { from: '/a', to: null }],
  ])('drops %s', (_name, redirect) => {
    expect(map([redirect])).toEqual([])
  })

  it('keeps only the first redirect for a source path', () => {
    expect(
      map([
        { from: '/a', to: '/one', permanent: true },
        { from: '/a/', to: '/two', permanent: true },
      ]),
    ).toEqual([{ from: '/a', to: '/one', status: 301 }])
  })

  it('returns nothing for a missing result', () => {
    expect(mapRedirects(undefined)).toEqual([])
  })
})
