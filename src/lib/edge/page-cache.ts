import { CACHE_POLICIES } from '@/lib/cache-control'

import type { EdgeStore } from './types'

// Pages are invalidated by bumping the content version on publish, so the TTL
// only bounds how long an unused page lingers. A day keeps KV writes low.
export const PAGE_TTL_SECONDS = 86_400

const STORED_HEADERS = ['cache-control', 'content-type', 'content-language', 'link']

type StoredPage = { headers: [string, string][]; storedAt: number }

export function pageCacheKey(release: string, version: string, path: string): string {
  return `page:${release}:v${version}:${path}`
}

function isCacheableResponse(response: Response): boolean {
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
  store: EdgeStore,
  key: string,
  render: () => Promise<Response>,
): Promise<Response> {
  try {
    const hit = await store.kv.getWithMetadata<StoredPage>(key)
    if (hit.value !== null && hit.metadata) {
      const headers = new Headers(hit.metadata.headers)
      headers.set('age', String(Math.max(0, Math.floor((Date.now() - hit.metadata.storedAt) / 1000))))
      headers.set('x-cache', 'HIT')
      return new Response(hit.value, { status: 200, headers })
    }
  } catch (error) {
    console.error('[edge] page read failed', error)
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
  store.waitUntil(
    store.kv
      .put(key, body, { expirationTtl: PAGE_TTL_SECONDS, metadata })
      .catch((error: unknown) => console.error('[edge] page write failed', error)),
  )
  return withCacheStatus(new Response(body, response), 'MISS')
}
