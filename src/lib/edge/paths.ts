import { parseReportsSearch, reportsPath } from '@/content/reports-search'
import { isPreviewUrlPath } from '@/lib/preview-session'

// Left entirely to the app: never redirected, never cached.
const APP_PREFIXES = ['/api', '/_serverFn']
// Can be redirected, but always rendered fresh.
const UNCACHED_PREFIXES = ['/explore']
const MAX_PATH_LENGTH = 200

// A route with search params registers how it writes its canonical URL. Only a
// query that is already canonical is cached, so junk parameters can't fill KV
// and the cache always agrees with the route.
const CANONICAL_PATH: Record<string, (raw: Record<string, string>) => string> = {
  '/reports': (raw) => reportsPath(parseReportsSearch(raw)),
}

export type EdgeRoute = {
  redirects: boolean
  // The path and query a page is cached under, or null when it is never cached.
  cachePath: string | null
}

const hasPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

export function classify(request: Request): EdgeRoute {
  const url = new URL(request.url)
  const { pathname } = url
  if (isPreviewUrlPath(pathname) || APP_PREFIXES.some((prefix) => hasPrefix(pathname, prefix))) {
    return { redirects: false, cachePath: null }
  }
  return {
    redirects: request.method === 'GET' || request.method === 'HEAD',
    cachePath: request.method === 'GET' ? cacheablePath(url) : null,
  }
}

function cacheablePath({ pathname, searchParams }: URL): string | null {
  if (pathname.length > MAX_PATH_LENGTH || /\.[a-z0-9]+$/i.test(pathname)) return null
  if (UNCACHED_PREFIXES.some((prefix) => hasPrefix(pathname, prefix))) return null

  const params = [...searchParams.entries()].sort(([a], [b]) => a.localeCompare(b))
  if (params.length === 0) return pathname
  if (new Set(params.map(([name]) => name)).size !== params.length) return null

  const requested = `${pathname}?${new URLSearchParams(params)}`
  const canonical = CANONICAL_PATH[pathname]?.(Object.fromEntries(params))
  return canonical === requested ? canonical : null
}
