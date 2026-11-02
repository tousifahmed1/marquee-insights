import { env, waitUntil } from 'cloudflare:workers'

import type { PageCache } from './page-cache'

// The KV-backed page cache, or null in development so code changes show at
// once. Server-only: imports cloudflare:workers.
export function getPageCache(): PageCache | null {
  if (import.meta.env.DEV) return null
  const kv = env.PAGE_CACHE
  if (typeof kv !== 'object' || kv === null) return null
  const metadata = env.CF_VERSION_METADATA
  const release =
    typeof metadata === 'object' && metadata !== null && 'id' in metadata
      ? String(metadata.id)
      : 'local'
  return { release, kv: kv as PageCache['kv'], waitUntil }
}
