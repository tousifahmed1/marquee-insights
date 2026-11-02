import { record } from '@/content/mappers/primitives'

export const ALL_URLS = '/*'

export type PublishedDocument = {
  id: string
  type: string
  operation: 'create' | 'update' | 'delete' | null
  slugs: string[]
  redirectSources: string[]
}

const text = (value: unknown) => (typeof value === 'string' && value !== '' ? value : null)

const unique = (values: (string | null)[]) => [
  ...new Set(values.filter((value) => value !== null)),
]

// Reads the payload sent by the webhook projection documented in README.md.
export function parsePublishedDocument(payload: unknown): PublishedDocument | null {
  const data = record(payload)
  const id = text(data?._id)
  const type = text(data?._type)
  if (!data || !id || !type) return null
  const operation = data.operation
  return {
    id,
    type,
    operation:
      operation === 'create' || operation === 'update' || operation === 'delete' ? operation : null,
    slugs: unique([text(data.slug), text(data.previousSlug)]),
    redirectSources: unique([text(data.from), text(data.previousFrom)]),
  }
}

const pagePath = (slug: string) => (slug === 'home' ? '/' : `/${slug}`)

// The URLs a change can affect. A CDN with per-URL purging would invalidate
// exactly these; the KV cache invalidates everything with one version bump.
// Paths cover every query string, so /reports includes its filtered pages.
export function affectedUrls(document: PublishedDocument): string[] {
  switch (document.type) {
    case 'siteSettings':
      return [ALL_URLS]
    case 'report':
      return unique(['/', '/reports', ...document.slugs.map((slug) => `/reports/${slug}`)])
    case 'page':
      return unique(document.slugs.map(pagePath))
    case 'redirect':
      return document.redirectSources.filter((path) => path.startsWith('/'))
    default:
      return []
  }
}
