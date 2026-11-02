import { describe, expect, it, vi } from 'vitest'

import { cacheHeaders } from './cache-control'
import {
  CONTENT_VERSION_KEY,
  PAGE_TTL_SECONDS,
  bumpContentVersion,
  cacheablePath,
  pageCacheKey,
  servePage,
} from './page-cache'
import type { PageCache } from './page-cache'

const SITE = 'https://marquee.test'

function memoryCache() {
  const entries = new Map<string, { value: string; metadata: unknown; ttl?: number }>()
  const pending: Promise<unknown>[] = []
  const cache: PageCache = {
    release: 'release-1',
    kv: {
      get: async (key) => entries.get(key)?.value ?? null,
      getWithMetadata: async <M,>(key: string) => {
        const entry = entries.get(key)
        return { value: entry?.value ?? null, metadata: (entry?.metadata ?? null) as M | null }
      },
      put: async (key, value, options) => {
        entries.set(key, { value, metadata: options?.metadata, ttl: options?.expirationTtl })
      },
    },
    waitUntil: (promise) => pending.push(promise),
  }
  return { cache, entries, settle: () => Promise.all(pending) }
}

const page = (body: string, init: ResponseInit = {}) =>
  new Response(body, {
    status: 200,
    ...init,
    headers: { 'content-type': 'text/html; charset=utf-8', ...cacheHeaders('content'), ...init.headers },
  })

const get = (path: string, init?: RequestInit) => new Request(`${SITE}${path}`, init)

describe('cacheablePath', () => {
  it.each(['/', '/about', '/contact', '/reports', '/reports/the-second-season-slump'])(
    'caches the content page %s',
    (path) => {
      expect(cacheablePath(new URL(`${SITE}${path}`))).toBe(path)
    },
  )

  it.each([
    '/explore',
    '/explore?platform=tidewell',
    '/preview/about',
    '/api/preview/enable',
    '/api/revalidate',
    '/_serverFn/abc',
    '/assets/app.css',
    '/robots.txt',
    `/${'a'.repeat(201)}`,
  ])('never caches %s', (path) => {
    expect(cacheablePath(new URL(`${SITE}${path}`))).toBeNull()
  })

  it('keeps canonical report listing filters in a stable order', () => {
    expect(cacheablePath(new URL(`${SITE}/reports?page=2&category=film`))).toBe(
      '/reports?category=film&page=2',
    )
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
    expect(cacheablePath(new URL(`${SITE}${path}`))).toBeNull()
  })
})

describe('servePage', () => {
  it('renders and stores a miss, then serves the stored page as a hit', async () => {
    const { cache, entries, settle } = memoryCache()
    const render = vi.fn(async () => page('<h1>About</h1>'))

    const miss = await servePage(get('/about'), render, cache)
    expect(miss.headers.get('x-cache')).toBe('MISS')
    expect(await miss.text()).toBe('<h1>About</h1>')
    await settle()

    const stored = entries.get(pageCacheKey('release-1', '0', '/about'))
    expect(stored?.ttl).toBe(PAGE_TTL_SECONDS)

    const hit = await servePage(get('/about'), render, cache)
    expect(render).toHaveBeenCalledTimes(1)
    expect(hit.status).toBe(200)
    expect(hit.headers.get('x-cache')).toBe('HIT')
    expect(hit.headers.get('cache-control')).toBe(cacheHeaders('content')['Cache-Control'])
    expect(hit.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(hit.headers.get('age')).toMatch(/^\d+$/)
    expect(await hit.text()).toBe('<h1>About</h1>')
  })

  it('stops serving every stored page once the content version changes', async () => {
    const { cache, entries, settle } = memoryCache()
    const render = vi.fn(async () => page('<h1>Home</h1>'))
    await servePage(get('/'), render, cache)
    await settle()

    entries.set(CONTENT_VERSION_KEY, { value: '1', metadata: null })
    const after = await servePage(get('/'), render, cache)
    expect(after.headers.get('x-cache')).toBe('MISS')
    expect(render).toHaveBeenCalledTimes(2)
    await settle()
    expect(entries.has(pageCacheKey('release-1', '1', '/'))).toBe(true)
  })

  it('never serves a page stored by an earlier deploy', async () => {
    const { cache, settle } = memoryCache()
    const render = vi.fn(async () => page('<h1>Home</h1>'))
    await servePage(get('/'), render, cache)
    await settle()

    const redeployed = await servePage(get('/'), render, { ...cache, release: 'release-2' })
    expect(redeployed.headers.get('x-cache')).toBe('MISS')
    expect(render).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['a 404', page('missing', { status: 404 })],
    ['a server error', page('error', { status: 500 })],
    ['a no-store page', page('draft', { headers: cacheHeaders('noStore') })],
    ['a non-HTML response', page('{}', { headers: { 'content-type': 'application/json' } })],
  ])('never stores %s', async (_name, response) => {
    const { cache, entries, settle } = memoryCache()
    const served = await servePage(get('/about'), async () => response, cache)
    await settle()
    expect(served.headers.get('x-cache')).toBe('MISS')
    expect(entries.size).toBe(0)
  })

  it('passes uncached routes straight through without touching KV', async () => {
    const { cache } = memoryCache()
    const kvGet = vi.spyOn(cache.kv, 'get')
    const response = new Response('rows', { headers: cacheHeaders('noStore') })
    const served = await servePage(
      new Request(`${SITE}/explore?platform=tidewell`),
      async () => response,
      cache,
    )
    expect(served).toBe(response)
    expect(served.headers.get('x-cache')).toBeNull()
    expect(kvGet).not.toHaveBeenCalled()
  })

  it('never caches non-GET requests', async () => {
    const { cache, entries, settle } = memoryCache()
    await servePage(get('/about', { method: 'POST' }), async () => page('<h1>About</h1>'), cache)
    await settle()
    expect(entries.size).toBe(0)
  })

  it('renders normally when KV is unavailable', async () => {
    const { cache } = memoryCache()
    vi.spyOn(cache.kv, 'get').mockRejectedValue(new Error('KV down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const served = await servePage(get('/about'), async () => page('<h1>About</h1>'), cache)
    expect(served.status).toBe(200)
    expect(await served.text()).toBe('<h1>About</h1>')
  })

  it('renders without caching when there is no cache, as in development', async () => {
    const response = page('<h1>About</h1>')
    expect(await servePage(get('/about'), async () => response, null)).toBe(response)
  })
})

describe('bumpContentVersion', () => {
  it('stores the publish time as the new content version', async () => {
    const { cache, entries } = memoryCache()
    await expect(bumpContentVersion(cache.kv, 1_793_620_000_000)).resolves.toBe('1793620000000')
    expect(entries.get(CONTENT_VERSION_KEY)?.value).toBe('1793620000000')
  })
})
