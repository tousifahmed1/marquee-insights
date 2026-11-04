import type { EdgeKv } from './types'

type Entry = { value: string; metadata: unknown; expires: number | null }

// An in-memory EdgeKv that honours expirationTtl. Used in development, where
// pages aren't cached but redirects are, and in tests.
export function createMemoryKv(now: () => number = Date.now): EdgeKv & { entries: Map<string, Entry> } {
  const entries = new Map<string, Entry>()
  const live = (key: string) => {
    const entry = entries.get(key)
    if (entry?.expires != null && entry.expires <= now()) {
      entries.delete(key)
      return undefined
    }
    return entry
  }
  return {
    entries,
    get: async (key) => live(key)?.value ?? null,
    getWithMetadata: async <Metadata>(key: string) => {
      const entry = live(key)
      return { value: entry?.value ?? null, metadata: (entry?.metadata ?? null) as Metadata | null }
    },
    put: async (key, value, options) => {
      const ttl = options?.expirationTtl
      entries.set(key, {
        value,
        metadata: options?.metadata ?? null,
        expires: ttl === undefined ? null : now() + ttl * 1000,
      })
    },
  }
}
