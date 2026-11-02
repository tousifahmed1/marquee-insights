import { describe, expect, it } from 'vitest'

import { cacheHeaders } from './cache-control'

describe('cacheHeaders', () => {
  it('caches content pages at the edge with stale-while-revalidate', () => {
    expect(cacheHeaders('content')).toEqual({
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    })
  })

  it('disables caching for preview, draft and data routes', () => {
    expect(cacheHeaders('noStore')).toEqual({ 'Cache-Control': 'no-store' })
  })
})
