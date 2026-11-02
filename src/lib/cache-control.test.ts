import { describe, expect, it } from 'vitest'

import {
  CACHE_POLICIES,
  applyDefaultCachePolicy,
  cacheHeaders,
} from './cache-control'

const headersOf = (headers: Headers) => Object.fromEntries(headers.entries())

describe('cacheHeaders', () => {
  it('caches content at the edge with stale-while-revalidate and makes browsers revalidate', () => {
    expect(cacheHeaders('content')).toEqual({
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Cloudflare-CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=86400',
    })
  })

  it('never uses s-maxage, which disables stale-while-revalidate on Cloudflare', () => {
    for (const policy of Object.values(CACHE_POLICIES)) {
      expect(Object.values(policy).join(' ')).not.toContain('s-maxage')
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
})
