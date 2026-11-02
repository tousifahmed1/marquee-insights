// Browsers always revalidate HTML so CMS purges reach visitors at once. The edge
// policy lives in Cloudflare-CDN-Cache-Control, which Cloudflare strips before
// responding. Cloudflare ignores stale-while-revalidate when s-maxage is
// present, so the edge window uses max-age.
const BROWSER_REVALIDATE = 'public, max-age=0, must-revalidate'

export const CACHE_POLICIES = {
  content: {
    'Cache-Control': BROWSER_REVALIDATE,
    'Cloudflare-CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=86400',
  },
  notFound: {
    'Cache-Control': BROWSER_REVALIDATE,
    'Cloudflare-CDN-Cache-Control': 'max-age=300',
  },
  noStore: {
    'Cache-Control': 'no-store',
  },
} as const satisfies Record<string, Record<string, string>>

export type CachePolicy = keyof typeof CACHE_POLICIES

export function cacheHeaders(policy: CachePolicy): Record<string, string> {
  return { ...CACHE_POLICIES[policy] }
}

// With Workers caching on, Cloudflare caches responses that have no
// Cache-Control for up to 2 hours, so every response needs a policy.
export function applyDefaultCachePolicy(headers: Headers, status: number) {
  if (status >= 500) {
    setPolicy(headers, 'noStore')
  } else if (status === 404) {
    setPolicy(headers, 'notFound')
  } else if (!headers.has('Cache-Control')) {
    setPolicy(headers, 'noStore')
  }
}

function setPolicy(headers: Headers, policy: CachePolicy) {
  headers.delete('Cloudflare-CDN-Cache-Control')
  for (const [name, value] of Object.entries(CACHE_POLICIES[policy])) {
    headers.set(name, value)
  }
}
