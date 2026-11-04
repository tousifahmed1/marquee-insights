import { env, waitUntil } from 'cloudflare:workers'

import { createMemoryKv } from './memory-kv'
import type { EdgeKv, EdgeStore } from './types'

const DAY_SECONDS = 86_400
const LOCAL_REDIRECT_TTL_SECONDS = 30

// Lives as long as the isolate, so development keeps redirects between requests.
const localKv = createMemoryKv()

// The edge store from the Worker bindings. Server-only: imports cloudflare:workers.
export function getEdgeStore(): EdgeStore {
  const kv = getContentKv()
  if (import.meta.env.DEV || !kv) {
    return {
      kv: localKv,
      release: 'local',
      waitUntil: (promise) => void promise,
      cachePages: false,
      redirectTtlSeconds: LOCAL_REDIRECT_TTL_SECONDS,
    }
  }
  const metadata = env.CF_VERSION_METADATA
  const release =
    typeof metadata === 'object' && metadata !== null && 'id' in metadata
      ? String(metadata.id)
      : 'local'
  return { kv, release, waitUntil, cachePages: true, redirectTtlSeconds: DAY_SECONDS }
}

// The KV namespace itself, in every environment, for the publish webhook.
export function getContentKv(): EdgeKv | null {
  const kv = env.PAGE_CACHE
  return typeof kv === 'object' && kv !== null ? (kv as EdgeKv) : null
}
