import type { Page, Report, SiteSettings } from '@/content'
import { pageUrl, reportUrl } from '@/content/urls'

import { resolveSeo, seoHead } from './seo'
import { articleJsonLd } from './structured-data'

// Route heads for CMS documents. With no loader data (a 404) they return {},
// so the root's "Page not found" head applies. Previews are noindex, so they
// get no canonical URL and no structured data.
type HeadOptions = { preview: boolean }
type Head = ReturnType<typeof seoHead> | Record<string, never>

export function homeHead(settings: SiteSettings, page: Page | undefined, { preview }: HeadOptions): Head {
  if (!page) return {}
  return seoHead(resolveSeo(settings, { seo: page.seo, path: preview ? null : pageUrl(page.slug) }))
}

export function pageHead(settings: SiteSettings, page: Page | undefined, { preview }: HeadOptions): Head {
  if (!page) return {}
  return seoHead(
    resolveSeo(settings, {
      seo: page.seo,
      title: page.title,
      path: preview ? null : pageUrl(page.slug),
    }),
  )
}

export function reportHead(settings: SiteSettings, report: Report | undefined, { preview }: HeadOptions): Head {
  if (!report) return {}
  const head = seoHead(
    resolveSeo(settings, {
      seo: report.seo,
      title: report.title,
      description: report.excerpt,
      image: report.coverImage,
      path: preview ? null : reportUrl(report.slug),
      type: 'article',
      publishedAt: report.publishedAt,
      modifiedAt: report.updatedAt,
    }),
  )
  return preview ? head : { ...head, meta: [...head.meta, articleJsonLd(report, settings)] }
}
