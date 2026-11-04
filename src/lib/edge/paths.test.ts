import { describe, expect, it } from 'vitest'

import { classify } from './paths'

const SITE = 'https://marquee.test'
const route = (path: string, method = 'GET') => classify(new Request(`${SITE}${path}`, { method }))

describe('classify', () => {
  it.each(['/', '/about', '/contact', '/reports', '/reports/the-second-season-slump'])(
    'redirects and caches the content page %s',
    (path) => {
      expect(route(path)).toEqual({ redirects: true, cachePath: path })
    },
  )

  it.each(['/api/revalidate', '/api/preview/enable', '/_serverFn/abc', '/preview', '/preview/about'])(
    'leaves %s to the app',
    (path) => {
      expect(route(path)).toEqual({ redirects: false, cachePath: null })
    },
  )

  it.each(['/explore', '/explore?platform=tidewell', '/ask', '/assets/app.css', '/robots.txt', `/${'a'.repeat(201)}`])(
    'redirects but never caches %s',
    (path) => {
      expect(route(path)).toEqual({ redirects: true, cachePath: null })
    },
  )

  it('redirects HEAD requests without caching them, and skips other methods', () => {
    expect(route('/about', 'HEAD')).toEqual({ redirects: true, cachePath: null })
    expect(route('/about', 'POST')).toEqual({ redirects: false, cachePath: null })
  })

  it('keeps canonical report listing filters in a stable order', () => {
    expect(route('/reports?page=2&category=film').cachePath).toBe('/reports?category=film&page=2')
  })

  it.each([
    '/about?utm_source=x',
    '/reports?page=1',
    '/reports?page=02',
    '/reports?page=abc',
    '/reports?category=not-a-category',
    '/reports?category=film&category=tv',
    '/reports?sort=new',
  ])('does not cache non-canonical query strings like %s', (path) => {
    expect(route(path).cachePath).toBeNull()
  })
})
