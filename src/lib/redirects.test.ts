import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Redirect } from '@/content'

import { CONTENT_VERSION_KEY } from './page-cache'
import type { PageCache } from './page-cache'
import {
  checksRedirects,
  findRedirect,
  loadRedirects,
  resetRedirectCacheForTests,
  serveRedirect,
} from './redirects'

const SITE = 'https://marquee.test'
const REDIRECTS: Redirect[] = [
  { from: '/research', to: '/reports', status: 301 },
  { from: '/methodology', to: '/about', status: 302 },
]

function memoryCache() {
  const entries = new Map<string, string>()
  const pending: Promise<unknown>[] = []
  const cache: PageCache = {
    release: 'release-1',
    kv: {
      get: async (key) => entries.get(key) ?? null,
      getWithMetadata: async () => ({ value: null, metadata: null }),
      put: async (key, value) => {
        entries.set(key, value)
      },
    },
    waitUntil: (promise) => pending.push(promise),
  }
  return { cache, entries, settle: () => Promise.all(pending) }
}

beforeEach(() => resetRedirectCacheForTests())

describe('checksRedirects', () => {
  it.each(['/research', '/', '/reports/a-report'])('checks GET %s', (path) => {
    expect(checksRedirects(new Request(`${SITE}${path}`))).toBe(true)
  })

  it.each(['/api/revalidate', '/_serverFn/abc', '/preview/about'])('skips %s', (path) => {
    expect(checksRedirects(new Request(`${SITE}${path}`))).toBe(false)
  })

  it('skips anything but GET and HEAD', () => {
    expect(checksRedirects(new Request(`${SITE}/research`, { method: 'POST' }))).toBe(false)
    expect(checksRedirects(new Request(`${SITE}/research`, { method: 'HEAD' }))).toBe(true)
  })
})

describe('findRedirect', () => {
  it('matches the path with or without a trailing slash', () => {
    expect(findRedirect('/research', REDIRECTS)?.to).toBe('/reports')
    expect(findRedirect('/research/', REDIRECTS)?.to).toBe('/reports')
    expect(findRedirect('/reports', REDIRECTS)).toBeNull()
  })
})

describe('serveRedirect', () => {
  it('answers with the redirect status, target and a re-checked cache policy', async () => {
    const permanent = await serveRedirect(new Request(`${SITE}/research`), null, async () => REDIRECTS)
    expect(permanent?.status).toBe(301)
    expect(permanent?.headers.get('location')).toBe('/reports')
    expect(permanent?.headers.get('cache-control')).toBe('public, max-age=0, s-maxage=3600')

    const temporary = await serveRedirect(new Request(`${SITE}/methodology`), null, async () => REDIRECTS)
    expect(temporary?.status).toBe(302)
  })

  it('lets the page render when nothing matches or the lookup fails', async () => {
    expect(await serveRedirect(new Request(`${SITE}/about`), null, async () => REDIRECTS)).toBeNull()
    resetRedirectCacheForTests()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const failing = async (): Promise<Redirect[]> => {
      throw new Error('Sanity is down')
    }
    expect(await serveRedirect(new Request(`${SITE}/research`), null, failing)).toBeNull()
  })
})

describe('loadRedirects', () => {
  it('stores the list in KV under the content version and reuses it', async () => {
    const { cache, entries, settle } = memoryCache()
    const fetchRedirects = vi.fn(async () => REDIRECTS)

    expect(await loadRedirects(cache, fetchRedirects)).toEqual(REDIRECTS)
    await settle()
    expect(JSON.parse(entries.get('redirects:v0') ?? 'null')).toEqual(REDIRECTS)
    expect(await loadRedirects(cache, fetchRedirects)).toEqual(REDIRECTS)
    expect(fetchRedirects).toHaveBeenCalledTimes(1)
  })

  it('fetches again after a publish bumps the content version', async () => {
    const { cache, entries, settle } = memoryCache()
    const fetchRedirects = vi.fn(async () => REDIRECTS)
    await loadRedirects(cache, fetchRedirects)
    await settle()
    entries.set(CONTENT_VERSION_KEY, '1793632734004')
    await loadRedirects(cache, fetchRedirects)
    expect(fetchRedirects).toHaveBeenCalledTimes(2)
  })

  it('keeps the list in memory briefly when there is no KV cache', async () => {
    const fetchRedirects = vi.fn(async () => REDIRECTS)
    await loadRedirects(null, fetchRedirects)
    await loadRedirects(null, fetchRedirects)
    expect(fetchRedirects).toHaveBeenCalledTimes(1)
  })
})
