import type { CmsImage, Seo, SiteSettings } from '@/content'
import { imageUrl } from '@/lib/sanity-image'
import { absoluteUrl } from '@/lib/site'

type HeadMeta = NonNullable<React.JSX.IntrinsicElements['meta'] & { title?: string }>
type HeadLink = React.JSX.IntrinsicElements['link']

export type SeoInput = {
  title: string
  description: string
  image: CmsImage | null
  noindex: boolean
  siteName: string
  // Site path of the canonical URL, or null for pages that should not have one.
  path: string | null
  type: 'website' | 'article'
  publishedAt: string | null
  modifiedAt: string | null
}

type ResolveOptions = {
  seo?: Seo
  title?: string
  description?: string | null
  image?: CmsImage | null
  path?: string | null
  type?: SeoInput['type']
  publishedAt?: string | null
  modifiedAt?: string | null
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// "Page title | Site name". Editors may already have typed the site name at
// either end, so it is removed before the suffix is added.
export function formatTitle(base: string, siteName: string): string {
  const name = escapeRegExp(siteName)
  const page = base
    .trim()
    .replace(new RegExp(`^${name}\\s*[|–—-]\\s*`, 'i'), '')
    .replace(new RegExp(`\\s*[|–—-]\\s*${name}$`, 'i'), '')
    .trim()
  return page === '' || page.toLowerCase() === siteName.toLowerCase()
    ? siteName
    : `${page} | ${siteName}`
}

export function resolveSeo(
  settings: SiteSettings,
  {
    seo,
    title,
    description,
    image,
    path = null,
    type = 'website',
    publishedAt = null,
    modifiedAt = null,
  }: ResolveOptions = {},
): SeoInput {
  return {
    title: formatTitle(seo?.title ?? title ?? settings.defaultSeo.title, settings.siteName),
    description: seo?.description ?? description ?? settings.defaultSeo.description,
    image: seo?.ogImage ?? image ?? settings.defaultSeo.ogImage,
    noindex: seo?.noindex ?? false,
    siteName: settings.siteName,
    path,
    type,
    publishedAt,
    modifiedAt,
  }
}

// For 404 and error pages: a plain title, no canonical URL and kept out of search.
export function statusSeo(settings: SiteSettings, title: string): SeoInput {
  return { ...resolveSeo(settings, { title }), noindex: true }
}

export function seoHead(input: SeoInput): { meta: HeadMeta[]; links: HeadLink[] } {
  const { title, description, image, noindex, siteName, path, type } = input
  const url = path !== null && !noindex ? absoluteUrl(path) : null
  const meta: HeadMeta[] = [
    { title },
    { name: 'description', content: description },
    { property: 'og:site_name', content: siteName },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: type },
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ]
  if (url) meta.push({ property: 'og:url', content: url })
  if (type === 'article' && input.publishedAt) {
    meta.push({ property: 'article:published_time', content: input.publishedAt })
  }
  if (type === 'article' && input.modifiedAt) {
    meta.push({ property: 'article:modified_time', content: input.modifiedAt })
  }
  if (image) {
    const src = imageUrl(image, 1200, 630)
    meta.push(
      { property: 'og:image', content: src },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: image.alt },
      { name: 'twitter:image', content: src },
      { name: 'twitter:image:alt', content: image.alt },
    )
  }
  if (noindex) meta.push({ name: 'robots', content: 'noindex' })
  return { meta, links: url ? [{ rel: 'canonical', href: url }] : [] }
}
