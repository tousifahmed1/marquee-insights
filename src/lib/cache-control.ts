import { isPreviewUrlPath } from '@/lib/preview-session'

// s-maxage is for shared caches only, so browsers keep revalidating HTML while a
// CDN may hold it for an hour. On workers.dev the Workers cache is off and
// rendered pages are cached in KV instead (see page-cache-store.ts).
export const CACHE_POLICIES = {
  content: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
  notFound: {
    'Cache-Control': 'public, s-maxage=300',
  },
  // Browsers re-check redirects so an editor can change or remove one.
  redirect: {
    'Cache-Control': 'public, max-age=0, s-maxage=3600',
  },
  noStore: {
    'Cache-Control': 'no-store',
  },
} as const satisfies Record<string, Record<string, string>>

export type CachePolicy = keyof typeof CACHE_POLICIES

export function cacheHeaders(policy: CachePolicy): Record<string, string> {
  return { ...CACHE_POLICIES[policy] }
}

// Every response gets an explicit policy, so a CDN in front of the site never
// falls back to its own defaults (Cloudflare caches responses without one).
export function applyDefaultCachePolicy(
  headers: Headers,
  status: number,
  pathname = '/',
) {
  if (status >= 500 || isPreviewUrlPath(pathname)) {
    setPolicy(headers, 'noStore')
  } else if (status === 404) {
    setPolicy(headers, 'notFound')
  } else if (!headers.has('Cache-Control')) {
    setPolicy(headers, 'noStore')
  }
}

function setPolicy(headers: Headers, policy: CachePolicy) {
  for (const [name, value] of Object.entries(CACHE_POLICIES[policy])) {
    headers.set(name, value)
  }
}
