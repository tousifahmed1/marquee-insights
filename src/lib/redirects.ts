import type { Redirect } from '@/content'

import { CACHE_POLICIES } from './cache-control'
import { CONTENT_VERSION_KEY } from './page-cache'
import type { PageCache } from './page-cache'
import { isPreviewUrlPath } from './preview-session'

const SKIPPED_PREFIXES = ['/api', '/_serverFn']
const DEV_CACHE_MS = 30_000
const REDIRECTS_TTL_SECONDS = 86_400

export function checksRedirects(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  const { pathname } = new URL(request.url)
  if (isPreviewUrlPath(pathname)) return false
  return !SKIPPED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function findRedirect(pathname: string, redirects: Redirect[]): Redirect | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return redirects.find((redirect) => redirect.from === path) ?? null
}

export function redirectResponse(redirect: Redirect): Response {
  return new Response(null, {
    status: redirect.status,
    headers: { Location: redirect.to, ...CACHE_POLICIES.redirect },
  })
}

let devCache: { redirects: Redirect[]; expires: number } | null = null

// The redirect list is stored in KV under the content version, so a publish
// (which bumps the version) picks up redirect changes. Without a page cache,
// as in development, it is kept in memory for 30 seconds.
export async function loadRedirects(
  cache: PageCache | null,
  fetchRedirects: () => Promise<Redirect[]>,
): Promise<Redirect[]> {
  if (!cache) {
    if (devCache && devCache.expires > Date.now()) return devCache.redirects
    const redirects = await fetchRedirects()
    devCache = { redirects, expires: Date.now() + DEV_CACHE_MS }
    return redirects
  }
  const version = (await cache.kv.get(CONTENT_VERSION_KEY)) ?? '0'
  const key = `redirects:v${version}`
  const stored = await cache.kv.get(key)
  if (stored !== null) return JSON.parse(stored) as Redirect[]
  const redirects = await fetchRedirects()
  cache.waitUntil(
    cache.kv
      .put(key, JSON.stringify(redirects), { expirationTtl: REDIRECTS_TTL_SECONDS })
      .catch((error: unknown) => console.error('[redirects] write failed', error)),
  )
  return redirects
}

export async function serveRedirect(
  request: Request,
  cache: PageCache | null,
  fetchRedirects: () => Promise<Redirect[]>,
): Promise<Response | null> {
  if (!checksRedirects(request)) return null
  try {
    const redirect = findRedirect(new URL(request.url).pathname, await loadRedirects(cache, fetchRedirects))
    return redirect ? redirectResponse(redirect) : null
  } catch (error) {
    console.error('[redirects] lookup failed', error)
    return null
  }
}

export function resetRedirectCacheForTests() {
  devCache = null
}
