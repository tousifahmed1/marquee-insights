import type { CmsImage, Seo, SiteSettings } from '@/content'
import { imageUrl } from '@/lib/sanity-image'

type HeadMeta = NonNullable<
  React.JSX.IntrinsicElements['meta'] & { title?: string }
>

export type SeoInput = {
  title: string
  description: string
  image: CmsImage | null
  noindex: boolean
}

type ResolveOptions = {
  seo?: Seo
  title?: string
  description?: string | null
  image?: CmsImage | null
}

export function resolveSeo(
  settings: SiteSettings,
  { seo, title, description, image }: ResolveOptions = {},
): SeoInput {
  return {
    title: seo?.title ?? (title ? `${title} | ${settings.siteName}` : settings.defaultSeo.title),
    description: seo?.description ?? description ?? settings.defaultSeo.description,
    image: seo?.ogImage ?? image ?? settings.defaultSeo.ogImage,
    noindex: seo?.noindex ?? false,
  }
}

export function seoHead({ title, description, image, noindex }: SeoInput): { meta: HeadMeta[] } {
  const meta: HeadMeta[] = [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
  ]
  if (image) {
    meta.push(
      { property: 'og:image', content: imageUrl(image, 1200, 630) },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: image.alt },
    )
  }
  if (noindex) meta.push({ name: 'robots', content: 'noindex' })
  return { meta }
}
