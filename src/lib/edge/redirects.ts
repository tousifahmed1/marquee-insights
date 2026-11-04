import type { Redirect } from '@/content'
import { CACHE_POLICIES } from '@/lib/cache-control'

import type { EdgeStore } from './types'

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

// The redirect list is stored under the content version, so a publish (which
// bumps the version) picks up redirect changes. Without a version, KV is skipped.
export async function loadRedirects(
  store: EdgeStore,
  version: string | null,
  fetchRedirects: () => Promise<Redirect[]>,
): Promise<Redirect[]> {
  if (version === null) return fetchRedirects()
  const key = `redirects:v${version}`
  const stored = await store.kv.get(key)
  if (stored !== null) return JSON.parse(stored) as Redirect[]
  const redirects = await fetchRedirects()
  store.waitUntil(
    store.kv
      .put(key, JSON.stringify(redirects), { expirationTtl: store.redirectTtlSeconds })
      .catch((error: unknown) => console.error('[edge] redirects write failed', error)),
  )
  return redirects
}
