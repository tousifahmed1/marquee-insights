import { describe, expect, it, vi } from 'vitest'

import type { Redirect } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'

import { CONTENT_VERSION_KEY, bumpContentVersion, createMemoryKv, handleEdgeRequest } from '.'
import type { EdgeStore } from '.'
import { PAGE_TTL_SECONDS, pageCacheKey } from './page-cache'

const SITE = 'https://marquee.test'
const REDIRECTS: Redirect[] = [
  { from: '/research', to: '/reports', status: 301 },
  { from: '/methodology', to: '/about', status: 302 },
  { from: '/explore/old', to: '/explore', status: 301 },
]

function edge(overrides: Partial<EdgeStore> = {}) {
  const kv = createMemoryKv()
  const pending: Promise<unknown>[] = []
  const store: EdgeStore = {
    kv,
    release: 'release-1',
    waitUntil: (promise) => pending.push(promise),
    cachePages: true,
    redirectTtlSeconds: 86_400,
    ...overrides,
  }
  const fetchRedirects = vi.fn(async () => REDIRECTS)
  const serve = (request: Request, render: () => Promise<Response>) =>
    handleEdgeRequest(request, { render, fetchRedirects, store })
  return { kv, store, fetchRedirects, serve, settle: () => Promise.all(pending) }
}

const page = (body: string, init: ResponseInit = {}) =>
  new Response(body, {
    status: 200,
    ...init,
    headers: { 'content-type': 'text/html; charset=utf-8', ...cacheHeaders('content'), ...init.headers },
  })

const get = (path: string, init?: RequestInit) => new Request(`${SITE}${path}`, init)

describe('page cache', () => {
  it('renders and stores a miss, then serves the stored page as a hit', async () => {
    const { kv, serve, settle } = edge()
    const render = vi.fn(async () => page('<h1>About</h1>'))

    const miss = await serve(get('/about'), render)
    expect(miss.headers.get('x-cache')).toBe('MISS')
    expect(await miss.text()).toBe('<h1>About</h1>')
    await settle()
    expect(kv.entries.get(pageCacheKey('release-1', '0', '/about'))?.expires).toBeGreaterThan(
      Date.now() + (PAGE_TTL_SECONDS - 60) * 1000,
    )

    const hit = await serve(get('/about'), render)
    expect(render).toHaveBeenCalledTimes(1)
    expect(hit.status).toBe(200)
    expect(hit.headers.get('x-cache')).toBe('HIT')
    expect(hit.headers.get('cache-control')).toBe(cacheHeaders('content')['Cache-Control'])
    expect(hit.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(hit.headers.get('age')).toMatch(/^\d+$/)
    expect(await hit.text()).toBe('<h1>About</h1>')
  })

  it('stops serving every stored page once the content version changes', async () => {
    const { kv, serve, settle } = edge()
    const render = vi.fn(async () => page('<h1>Home</h1>'))
    await serve(get('/'), render)
    await settle()

    await bumpContentVersion(kv, 1)
    const after = await serve(get('/'), render)
    expect(after.headers.get('x-cache')).toBe('MISS')
    expect(render).toHaveBeenCalledTimes(2)
    await settle()
    expect(kv.entries.has(pageCacheKey('release-1', '1', '/'))).toBe(true)
  })

  it('never serves a page stored by an earlier deploy', async () => {
    const { store, fetchRedirects, serve, settle } = edge()
    const render = vi.fn(async () => page('<h1>Home</h1>'))
    await serve(get('/'), render)
    await settle()

    const redeployed = await handleEdgeRequest(get('/'), {
      render,
      fetchRedirects,
      store: { ...store, release: 'release-2' },
    })
    expect(redeployed.headers.get('x-cache')).toBe('MISS')
    expect(render).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['a 404', page('missing', { status: 404 })],
    ['a server error', page('error', { status: 500 })],
    ['a no-store page', page('draft', { headers: cacheHeaders('noStore') })],
    ['a non-HTML response', page('{}', { headers: { 'content-type': 'application/json' } })],
  ])('never stores %s', async (_name, response) => {
    const { kv, serve, settle } = edge()
    const served = await serve(get('/about'), async () => response)
    await settle()
    expect(served.headers.get('x-cache')).toBe('MISS')
    expect([...kv.entries.keys()].filter((key) => key.startsWith('page:'))).toEqual([])
  })

  it('passes app routes straight through without touching KV', async () => {
    const { kv, serve } = edge()
    const kvGet = vi.spyOn(kv, 'get')
    const response = new Response('ok', { headers: cacheHeaders('noStore') })
    const served = await serve(get('/api/revalidate', { method: 'POST' }), async () => response)
    expect(served).toBe(response)
    expect(kvGet).not.toHaveBeenCalled()
  })

  it('renders the explorer fresh on every request', async () => {
    const { kv, serve, settle } = edge()
    const render = vi.fn(async () => page('<h1>Explorer</h1>'))
    await serve(get('/explore?platform=tidewell'), render)
    const second = await serve(get('/explore?platform=tidewell'), render)
    await settle()
    expect(render).toHaveBeenCalledTimes(2)
    expect(second.headers.get('x-cache')).toBeNull()
    expect([...kv.entries.keys()].filter((key) => key.startsWith('page:'))).toEqual([])
  })

  it('never caches non-GET requests', async () => {
    const { kv, serve, settle } = edge()
    await serve(get('/about', { method: 'POST' }), async () => page('<h1>About</h1>'))
    await serve(get('/about', { method: 'HEAD' }), async () => page(''))
    await settle()
    expect([...kv.entries.keys()].filter((key) => key.startsWith('page:'))).toEqual([])
  })

  it('renders without caching when pages are not cached, as in development', async () => {
    const { serve } = edge({ cachePages: false })
    const response = page('<h1>About</h1>')
    expect(await serve(get('/about'), async () => response)).toBe(response)
  })
})

describe('redirects', () => {
  it('answers with the redirect status, target and cache policy', async () => {
    const { serve } = edge()
    const render = vi.fn(async () => page('page'))

    const permanent = await serve(get('/research'), render)
    expect(permanent.status).toBe(301)
    expect(permanent.headers.get('location')).toBe('/reports')
    expect(permanent.headers.get('cache-control')).toBe('public, max-age=0, s-maxage=3600')

    expect((await serve(get('/methodology/'), render)).status).toBe(302)
    expect((await serve(get('/research', { method: 'HEAD' }), render)).status).toBe(301)
    expect(render).not.toHaveBeenCalled()
  })

  it('redirects paths that are never cached, like the explorer', async () => {
    const { serve } = edge()
    const served = await serve(get('/explore/old'), async () => page('page'))
    expect(served.headers.get('location')).toBe('/explore')
  })

  it('wins over a cached page at the same path', async () => {
    const { kv, serve, settle } = edge()
    await kv.put(pageCacheKey('release-1', '0', '/research'), '<h1>Old</h1>', {
      metadata: { headers: [], storedAt: Date.now() },
    })
    await settle()
    expect((await serve(get('/research'), async () => page('page'))).status).toBe(301)
  })

  it('never looks up app routes', async () => {
    const { serve, fetchRedirects } = edge()
    await serve(get('/preview/research'), async () => page('draft'))
    await serve(get('/research', { method: 'POST' }), async () => page('post'))
    expect(fetchRedirects).not.toHaveBeenCalled()
  })

  it('stores the list under the content version and fetches again after a publish', async () => {
    const { kv, serve, fetchRedirects, settle } = edge()
    const render = async () => page('page')
    await serve(get('/about'), render)
    await settle()
    expect(JSON.parse((await kv.get('redirects:v0')) ?? 'null')).toEqual(REDIRECTS)
    await serve(get('/contact'), render)
    expect(fetchRedirects).toHaveBeenCalledTimes(1)

    await kv.put(CONTENT_VERSION_KEY, '1793632734004')
    await serve(get('/about'), render)
    expect(fetchRedirects).toHaveBeenCalledTimes(2)
  })

  it('keeps the list only as long as the store says', async () => {
    let now = 0
    const kv = createMemoryKv(() => now)
    const { serve, fetchRedirects, settle } = edge({ kv, cachePages: false, redirectTtlSeconds: 30 })
    const render = async () => page('page')
    await serve(get('/about'), render)
    await settle()
    now = 29_000
    await serve(get('/about'), render)
    expect(fetchRedirects).toHaveBeenCalledTimes(1)
    now = 31_000
    await serve(get('/about'), render)
    expect(fetchRedirects).toHaveBeenCalledTimes(2)
  })

  it('lets the page render when nothing matches or the lookup fails', async () => {
    const { serve, fetchRedirects } = edge()
    expect(await (await serve(get('/about'), async () => page('About'))).text()).toBe('About')

    const failing = edge()
    failing.fetchRedirects.mockRejectedValue(new Error('Sanity is down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const served = await failing.serve(get('/research'), async () => page('Research'))
    expect(served.status).toBe(200)
    expect(fetchRedirects).toHaveBeenCalledTimes(1)
  })
})

describe('when KV is unavailable', () => {
  it('still redirects, fetching the list directly, and renders without the cache', async () => {
    const { kv, serve, fetchRedirects } = edge()
    vi.spyOn(kv, 'get').mockRejectedValue(new Error('KV down'))
    vi.spyOn(kv, 'getWithMetadata').mockRejectedValue(new Error('KV down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect((await serve(get('/research'), async () => page('page'))).status).toBe(301)
    const response = page('<h1>About</h1>')
    expect(await serve(get('/about'), async () => response)).toBe(response)
    expect(fetchRedirects).toHaveBeenCalledTimes(2)
  })
})

describe('bumpContentVersion', () => {
  it('stores the publish time as the new content version', async () => {
    const kv = createMemoryKv()
    await expect(bumpContentVersion(kv, 1_793_620_000_000)).resolves.toBe('1793620000000')
    expect(await kv.get(CONTENT_VERSION_KEY)).toBe('1793620000000')
  })
})
