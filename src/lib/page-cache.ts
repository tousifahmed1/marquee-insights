import { parseCategory, parsePage } from '@/content/inputs'

import { CACHE_POLICIES } from './cache-control'
import { isPreviewUrlPath } from './preview-session'

export const CONTENT_VERSION_KEY = 'content-version'

// Pages are invalidated by bumping the content version on publish, so the TTL
// only bounds how long an unused page lingers. A day keeps KV writes low.
export const PAGE_TTL_SECONDS = 86_400

const UNCACHED_PREFIXES = ['/explore', '/api', '/_serverFn']
const MAX_PATH_LENGTH = 200
const STORED_HEADERS = ['cache-control', 'content-type', 'content-language', 'link']

// Only canonical query strings are cached, so junk parameters can't fill KV.
const CACHEABLE_SEARCH: Record<string, Record<string, (value: string) => boolean>> = {
  '/reports': {
    category: (value) => parseCategory(value) === value,
    page: (value) => value !== '1' && String(parsePage(value)) === value,
  },
}

export type PageCacheKv = {
  get(key: string): Promise<string | null>
  getWithMetadata<Metadata>(
    key: string,
  ): Promise<{ value: string | null; metadata: Metadata | null }>
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; metadata?: unknown },
  ): Promise<void>
}

export type PageCache = {
  // The deployed Worker version. Pages from an earlier deploy reference its
  // hashed assets, so they are never served after a new deploy.
  release: string
  kv: PageCacheKv
  waitUntil: (promise: Promise<unknown>) => void
}

type StoredPage = { headers: [string, string][]; storedAt: number }

const hasPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

// The path and query a page is cached under, or null when it is never cached.
export function cacheablePath(url: URL): string | null {
  const { pathname, searchParams } = url
  if (pathname.length > MAX_PATH_LENGTH || /\.[a-z0-9]+$/i.test(pathname)) return null
  if (isPreviewUrlPath(pathname)) return null
  if (UNCACHED_PREFIXES.some((prefix) => hasPrefix(pathname, prefix))) return null

  const allowed = CACHEABLE_SEARCH[pathname] ?? {}
  const params = [...searchParams.entries()]
  const names = new Set(params.map(([name]) => name))
  if (names.size !== params.length) return null
  if (!params.every(([name, value]) => allowed[name]?.(value) === true)) return null

  const search = new URLSearchParams(params.sort(([a], [b]) => a.localeCompare(b)))
  return search.size === 0 ? pathname : `${pathname}?${search}`
}

export function pageCacheKey(release: string, version: string, path: string): string {
  return `page:${release}:v${version}:${path}`
}

export function isCacheableResponse(response: Response): boolean {
  return (
    response.status === 200 &&
    response.headers.get('cache-control') === CACHE_POLICIES.content['Cache-Control'] &&
    (response.headers.get('content-type') ?? '').startsWith('text/html')
  )
}

function withCacheStatus(response: Response, status: 'HIT' | 'MISS'): Response {
  const headers = new Headers(response.headers)
  headers.set('x-cache', status)
  return new Response(response.body, { status: response.status, headers })
}

export async function servePage(
  request: Request,
  render: () => Promise<Response>,
  cache: PageCache | null,
): Promise<Response> {
  const path = request.method === 'GET' ? cacheablePath(new URL(request.url)) : null
  if (!cache || path === null) return render()

  let key: string
  try {
    const version = (await cache.kv.get(CONTENT_VERSION_KEY)) ?? '0'
    key = pageCacheKey(cache.release, version, path)
    const hit = await cache.kv.getWithMetadata<StoredPage>(key)
    if (hit.value !== null && hit.metadata) {
      const headers = new Headers(hit.metadata.headers)
      headers.set('age', String(Math.max(0, Math.floor((Date.now() - hit.metadata.storedAt) / 1000))))
      headers.set('x-cache', 'HIT')
      return new Response(hit.value, { status: 200, headers })
    }
  } catch (error) {
    console.error('[page-cache] read failed', error)
    return render()
  }

  const response = await render()
  if (!isCacheableResponse(response)) return withCacheStatus(response, 'MISS')

  const body = await response.text()
  const metadata: StoredPage = {
    headers: STORED_HEADERS.flatMap((name) => {
      const value = response.headers.get(name)
      return value === null ? [] : [[name, value] as [string, string]]
    }),
    storedAt: Date.now(),
  }
  cache.waitUntil(
    cache.kv
      .put(key, body, { expirationTtl: PAGE_TTL_SECONDS, metadata })
      .catch((error: unknown) => console.error('[page-cache] write failed', error)),
  )
  return withCacheStatus(new Response(body, response), 'MISS')
}
