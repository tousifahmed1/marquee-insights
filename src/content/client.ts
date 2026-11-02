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
