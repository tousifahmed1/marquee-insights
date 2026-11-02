import { describe, expect, it } from 'vitest'

import {
  CACHE_POLICIES,
  applyDefaultCachePolicy,
  cacheHeaders,
} from './cache-control'

const headersOf = (headers: Headers) => Object.fromEntries(headers.entries())

describe('cacheHeaders', () => {
  it('lets shared caches keep content for an hour and serve it stale while revalidating', () => {
    expect(cacheHeaders('content')).toEqual({
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    })
  })

  it('never lets browsers cache HTML themselves, so a purge reaches visitors at once', () => {
    for (const policy of Object.values(CACHE_POLICIES)) {
      expect(policy['Cache-Control']).not.toMatch(/(^|[ ,])max-age=[1-9]/)
    }
  })

  it('disables caching for preview, draft and data routes', () => {
    expect(cacheHeaders('noStore')).toEqual({ 'Cache-Control': 'no-store' })
  })
})

describe('applyDefaultCachePolicy', () => {
  it('keeps the policy a route set on a successful response', () => {
    const headers = new Headers(cacheHeaders('content'))
    applyDefaultCachePolicy(headers, 200)
    expect(headersOf(headers)).toEqual(headersOf(new Headers(cacheHeaders('content'))))
  })

  it('marks responses without a policy as no-store', () => {
    const headers = new Headers()
    applyDefaultCachePolicy(headers, 200)
    expect(headersOf(headers)).toEqual({ 'cache-control': 'no-store' })
  })

  it('gives 404s a short edge cache, even on a content route', () => {
    const headers = new Headers(cacheHeaders('content'))
    applyDefaultCachePolicy(headers, 404)
    expect(headersOf(headers)).toEqual(headersOf(new Headers(cacheHeaders('notFound'))))
  })

  it('never caches server errors, even on a content route', () => {
    const headers = new Headers(cacheHeaders('content'))
    applyDefaultCachePolicy(headers, 500)
    expect(headersOf(headers)).toEqual({ 'cache-control': 'no-store' })
  })

  it.each(['/preview', '/preview/about', '/preview/reports/a-report', '/api/preview/enable'])(
    'never caches %s, whatever the status or route policy',
    (path) => {
      for (const status of [200, 307, 404]) {
        const headers = new Headers(cacheHeaders('content'))
        applyDefaultCachePolicy(headers, status, path)
        expect(headersOf(headers)).toEqual({ 'cache-control': 'no-store' })
      }
    },
  )

  it('does not treat lookalike paths as preview', () => {
    const headers = new Headers(cacheHeaders('content'))
    applyDefaultCachePolicy(headers, 200, '/previews')
    expect(headersOf(headers)).toEqual(headersOf(new Headers(cacheHeaders('content'))))
  })
})
