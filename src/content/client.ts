import { createClient } from '@sanity/client'
import type { SanityClient } from '@sanity/client'

import { serverSecret } from '@/lib/server-env'

import { getSanityConfig } from './config'

let publishedClient: SanityClient | undefined

export function getPublishedClient(): SanityClient {
  // Rendered pages are cached in KV, so reads skip Sanity's CDN: it can lag a
  // publish by a few seconds and the first render after a purge must be fresh.
  publishedClient ??= createClient({
    ...getSanityConfig(),
    useCdn: false,
    perspective: 'published',
  })
  return publishedClient
}

let previewClient: SanityClient | undefined

export function getPreviewClient(): SanityClient {
  const token = serverSecret('SANITY_READ_TOKEN')
  if (!token) throw new Error('Set SANITY_READ_TOKEN to preview drafts')
  previewClient ??= createClient({
    ...getSanityConfig(),
    token,
    useCdn: false,
    perspective: 'drafts',
  })
  return previewClient
}
