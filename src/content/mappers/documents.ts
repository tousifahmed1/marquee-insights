import { isReportCategory } from '../categories'
import type {
  PAGE_BY_SLUG_QUERY_RESULT,
  REPORTS_QUERY_RESULT,
  REPORT_BY_SLUG_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
} from '../sanity.types'
import type { ReportCategory } from '../categories'
import type { Page, Report, ReportList, ReportSummary, SiteSettings } from '../types'
import { list, mapImage, mapLinks, mapSeo, record, text } from './primitives'
import { mapRichText } from './rich-text'
import { mapSections } from './sections'

export const DEFAULT_SITE_NAME = 'Marquee Insights'
export const DEFAULT_DESCRIPTION =
  'Audience research for film, television, streaming, gaming and sport.'

export function mapSiteSettings(raw: SITE_SETTINGS_QUERY_RESULT | undefined): SiteSettings {
  const siteName = text(raw?.siteName) ?? DEFAULT_SITE_NAME
  return {
    siteName,
    navLinks: mapLinks(raw?.navLinks),
    footerLinks: mapLinks(raw?.footerLinks),
    defaultSeo: {
      title: text(raw?.defaultSeoTitle) ?? siteName,
      description: text(raw?.defaultSeoDescription) ?? DEFAULT_DESCRIPTION,
      ogImage: mapImage(raw?.defaultOgImage),
    },
  }
}

export function mapPage(raw: PAGE_BY_SLUG_QUERY_RESULT | undefined): Page | null {
  const id = text(raw?._id)
  const slug = text(raw?.slug)
  if (!id || !slug) return null
  return {
    id,
    slug,
    title: text(raw?.title) ?? DEFAULT_SITE_NAME,
    sections: mapSections(raw?.sections),
    seo: mapSeo(raw?.seo),
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isoDate(value: unknown): string | null {
  const date = text(value)
  if (!date || !ISO_DATE.test(date) || Number.isNaN(Date.parse(date))) return null
  return date
}

export function mapReportSummary(raw: unknown): ReportSummary | null {
  const report = record(raw)
  const id = text(report?._id)
  const slug = text(report?.slug)
  const title = text(report?.title)
  if (!id || !slug || !title) return null
  return {
    id,
    slug,
    title,
    publishedAt: isoDate(report?.publishedAt),
    category: isReportCategory(report?.category) ? report.category : null,
    excerpt: text(report?.excerpt),
    coverImage: mapImage(report?.coverImage),
  }
}

export function mapReport(raw: REPORT_BY_SLUG_QUERY_RESULT | undefined): Report | null {
  const summary = mapReportSummary(raw)
  if (!summary) return null
  return { ...summary, body: mapRichText(raw?.body), seo: mapSeo(raw?.seo) }
}

type ReportListRequest = {
  page: number
  pageSize: number
  category: ReportCategory | null
}

export function mapReportList(
  raw: REPORTS_QUERY_RESULT | undefined,
  { page, pageSize, category }: ReportListRequest,
): ReportList {
  const items = list(raw?.items)
    .map(mapReportSummary)
    .filter((item): item is ReportSummary => item !== null)
  const rawTotal = raw?.total
  const total =
    typeof rawTotal === 'number' && Number.isInteger(rawTotal) && rawTotal >= 0
      ? rawTotal
      : items.length
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    category,
  }
}
