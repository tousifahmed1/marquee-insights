// The slice of Workers KV the edge uses. Satisfied by the PAGE_CACHE binding in
// production and by createMemoryKv() in development and tests.
export type EdgeKv = {
  get(key: string): Promise<string | null>
  getWithMetadata<Metadata>(
    key: string,
  ): Promise<{ value: string | null; metadata: Metadata | null }>
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; metadata?: unknown },
  ): Promise<void>
}

export type EdgeStore = {
  kv: EdgeKv
  // The deployed Worker version. Pages from an earlier deploy reference its
  // hashed assets, so they are never served after a new deploy.
  release: string
  waitUntil: (promise: Promise<unknown>) => void
  // Off in development so code changes show at once. Redirects are looked up either way.
  cachePages: boolean
  // How long the redirect list is kept: a day in production, where a publish
  // bumps the content version, and briefly in development, where nothing does.
  redirectTtlSeconds: number
}
