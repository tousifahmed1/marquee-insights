import type { REDIRECTS_QUERY_RESULT, SITEMAP_QUERY_RESULT } from '../sanity.types'
import type { Redirect, SitemapEntry } from '../types'
import { pageUrl, reportUrl } from '../urls'
import { isoDateTime } from './documents'
import { list, record, text } from './primitives'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SITE_PATH = /^\/(?!\/)[^\s?#]*$/
const EXTERNAL = /^https:\/\/[^\s]+$/i

function entries(raw: unknown, toPath: (slug: string) => string): SitemapEntry[] {
  return list(raw).flatMap((item) => {
    const entry = record(item)
    const slug = text(entry?.slug)
    if (!slug || !SLUG.test(slug)) return []
    return [{ path: toPath(slug), updatedAt: isoDateTime(entry?.updatedAt) }]
  })
}

// Pages and reports for sitemap.xml. The home page document is listed as /.
export function mapSitemap(raw: SITEMAP_QUERY_RESULT | undefined): SitemapEntry[] {
  const data = record(raw)
  return [
    ...entries(data?.pages, pageUrl),
    ...entries(data?.reports, reportUrl),
  ]
}

function normalisePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

// Redirects whose source is a site path and whose target is a site path or an
// https:// URL. Anything else is dropped rather than risk an open redirect loop.
export function mapRedirects(raw: REDIRECTS_QUERY_RESULT | undefined): Redirect[] {
  const seen = new Set<string>()
  return list(raw).flatMap((item) => {
    const redirect = record(item)
    const from = text(redirect?.from)
    const to = text(redirect?.to)
    if (!from || !to || !SITE_PATH.test(from)) return []
    if (!SITE_PATH.test(to.split(/[?#]/)[0]) && !EXTERNAL.test(to)) return []
    const source = normalisePath(from)
    if (seen.has(source) || source === normalisePath(to)) return []
    seen.add(source)
    return [{ from: source, to, status: redirect?.permanent === false ? 302 : 301 }]
  })
}
