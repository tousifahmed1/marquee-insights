import { createClient } from '@sanity/client'
import type { SanityClient } from '@sanity/client'

import { getSanityConfig } from './config'

let publishedClient: SanityClient | undefined

export function getPublishedClient(): SanityClient {
  publishedClient ??= createClient({
    ...getSanityConfig(),
    useCdn: true,
    perspective: 'published',
  })
  return publishedClient
}

let previewClient: SanityClient | undefined

export function getPreviewClient(): SanityClient {
  const token = process.env.SANITY_READ_TOKEN
  if (!token) throw new Error('Set SANITY_READ_TOKEN to preview drafts')
  previewClient ??= createClient({
    ...getSanityConfig(),
    token,
    useCdn: false,
    perspective: 'drafts',
  })
  return previewClient
}
