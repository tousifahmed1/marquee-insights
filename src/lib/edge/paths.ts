import { parseCategory, parsePage } from '@/content/inputs'
import { isPreviewUrlPath } from '@/lib/preview-session'

// Left entirely to the app: never redirected, never cached.
const APP_PREFIXES = ['/api', '/_serverFn']
// Can be redirected, but always rendered fresh.
const UNCACHED_PREFIXES = ['/explore']
const MAX_PATH_LENGTH = 200

// Only canonical query strings are cached, so junk parameters can't fill KV.
const CACHEABLE_SEARCH: Record<string, Record<string, (value: string) => boolean>> = {
  '/reports': {
    category: (value) => parseCategory(value) === value,
    page: (value) => value !== '1' && String(parsePage(value)) === value,
  },
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

  const allowed = CACHEABLE_SEARCH[pathname] ?? {}
  const params = [...searchParams.entries()]
  const names = new Set(params.map(([name]) => name))
  if (names.size !== params.length) return null
  if (!params.every(([name, value]) => allowed[name]?.(value) === true)) return null

  const search = new URLSearchParams(params.sort(([a], [b]) => a.localeCompare(b)))
  return search.size === 0 ? pathname : `${pathname}?${search}`
}
