import { env, waitUntil } from 'cloudflare:workers'

import type { PageCache, PageCacheKv } from './page-cache'

// The KV-backed page cache, or null in development so code changes show at
// once. Server-only: imports cloudflare:workers.
export function getPageCache(): PageCache | null {
  if (import.meta.env.DEV) return null
  const kv = getPageCacheKv()
  if (!kv) return null
  const metadata = env.CF_VERSION_METADATA
  const release =
    typeof metadata === 'object' && metadata !== null && 'id' in metadata
      ? String(metadata.id)
      : 'local'
  return { release, kv, waitUntil }
}

// The KV namespace itself, in every environment, for the publish webhook.
export function getPageCacheKv(): PageCacheKv | null {
  const kv = env.PAGE_CACHE
  return typeof kv === 'object' && kv !== null ? (kv as PageCacheKv) : null
}
