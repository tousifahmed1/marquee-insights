export const CACHE_CONTROL = {
  content: 'public, s-maxage=3600, stale-while-revalidate=86400',
  noStore: 'no-store',
} as const

export type CachePolicy = keyof typeof CACHE_CONTROL

export function cacheHeaders(policy: CachePolicy): Record<string, string> {
  return { 'Cache-Control': CACHE_CONTROL[policy] }
}
