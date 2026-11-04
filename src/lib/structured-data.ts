import { reportUrl } from '@/content/urls'
import type { Report, SiteSettings } from '@/content'
import { imageUrl } from '@/lib/sanity-image'
import { absoluteUrl } from '@/lib/site'

// JSON-LD goes in route `head` meta as { 'script:ld+json': data }. TanStack
// serialises and HTML-escapes it, so CMS text can never close the script tag.
export type JsonLdMeta = React.JSX.IntrinsicElements['meta'] & {
  'script:ld+json': Record<string, unknown>
}

const ORGANIZATION_ID = () => `${absoluteUrl('/')}#organization`

export function organizationJsonLd(settings: SiteSettings): JsonLdMeta {
  return {
    'script:ld+json': {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': ORGANIZATION_ID(),
      name: settings.siteName,
      url: absoluteUrl('/'),
      description: settings.defaultSeo.description,
      logo: absoluteUrl('/logo.png'),
    },
  }
}

export function articleJsonLd(report: Report, settings: SiteSettings): JsonLdMeta {
  const url = absoluteUrl(reportUrl(report.slug))
  const image = report.seo.ogImage ?? report.coverImage
  return {
    'script:ld+json': {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: report.title,
      description: report.seo.description ?? report.excerpt ?? settings.defaultSeo.description,
      url,
      mainEntityOfPage: url,
      ...(report.publishedAt ? { datePublished: report.publishedAt } : {}),
      ...(report.updatedAt ? { dateModified: report.updatedAt } : {}),
      ...(image ? { image: imageUrl(image, 1200, 630) } : {}),
      author: { '@type': 'Organization', '@id': ORGANIZATION_ID(), name: settings.siteName },
      publisher: { '@type': 'Organization', '@id': ORGANIZATION_ID(), name: settings.siteName },
    },
  }
}
