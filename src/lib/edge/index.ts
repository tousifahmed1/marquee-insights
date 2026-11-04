import type { Redirect } from '@/content'

import { readContentVersion } from './content-version'
import { pageCacheKey, servePage } from './page-cache'
import { classify } from './paths'
import { findRedirect, loadRedirects, redirectResponse } from './redirects'
import type { EdgeStore } from './types'

export { CONTENT_VERSION_KEY, bumpContentVersion } from './content-version'
export { createMemoryKv } from './memory-kv'
export type { EdgeKv, EdgeStore } from './types'

type EdgeDeps = {
  render: () => Promise<Response>
  fetchRedirects: () => Promise<Redirect[]>
  store: EdgeStore
}

// Every request passes through here before the app: a CMS redirect wins, then
// a cached page, then a fresh render. The content version is read once.
export async function handleEdgeRequest(
  request: Request,
  { render, fetchRedirects, store }: EdgeDeps,
): Promise<Response> {
  const route = classify(request)
  if (!route.redirects && route.cachePath === null) return render()

  const version = await readContentVersion(store.kv)

  if (route.redirects) {
    try {
      const redirects = await loadRedirects(store, version, fetchRedirects)
      const redirect = findRedirect(new URL(request.url).pathname, redirects)
      if (redirect) return redirectResponse(redirect)
    } catch (error) {
      console.error('[edge] redirect lookup failed', error)
    }
  }

  if (route.cachePath === null || !store.cachePages || version === null) return render()
  return servePage(store, pageCacheKey(store.release, version, route.cachePath), render)
}
