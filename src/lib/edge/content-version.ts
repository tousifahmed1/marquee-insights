import type { EdgeKv } from './types'

export const CONTENT_VERSION_KEY = 'content-version'

// The current content version, '0' before the first publish, or null when KV
// can't be read, in which case the request skips everything stored under it.
export async function readContentVersion(kv: EdgeKv): Promise<string | null> {
  try {
    return (await kv.get(CONTENT_VERSION_KEY)) ?? '0'
  } catch (error) {
    console.error('[edge] content version read failed', error)
    return null
  }
}

// The new version is the publish time rather than old + 1: KV reads can be up
// to 60 seconds stale, so incrementing could repeat a version and leave pages
// from a second publish cached.
export async function bumpContentVersion(
  kv: Pick<EdgeKv, 'put'>,
  now = Date.now(),
): Promise<string> {
  const version = String(now)
  await kv.put(CONTENT_VERSION_KEY, version)
  return version
}
