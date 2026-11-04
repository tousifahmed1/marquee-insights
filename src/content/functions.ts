import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { getPreviewClient, getPublishedClient } from './client'
import { REPORTS_PAGE_SIZE } from './config'
import { parseReportsInput, parseSlugInput } from './inputs'
import {
  mapPage,
  mapReport,
  mapReportList,
  mapSiteSettings,
} from './mappers'
import { isPreviewEnabled } from './preview'
import type { ReportSummary } from './types'
import {
  PAGE_BY_SLUG_QUERY,
  REPORTS_QUERY,
  REPORT_BY_SLUG_QUERY,
  SITE_SETTINGS_QUERY,
} from './queries'

async function clientFor(preview: boolean) {
  if (!preview) return getPublishedClient()
  if (!(await isPreviewEnabled())) throw notFound()
  return getPreviewClient()
}

export const getPreviewStatus = createServerFn({ method: 'GET' }).handler(() =>
  isPreviewEnabled(),
)

export const getSiteSettings = createServerFn({ method: 'GET' }).handler(async () => {
  const raw = await getPublishedClient().fetch(SITE_SETTINGS_QUERY)
  return mapSiteSettings(raw)
})

export const getPage = createServerFn({ method: 'GET' })
  .validator(parseSlugInput)
  .handler(async ({ data }) => {
    const client = await clientFor(data.preview)
    if (!data.slug) return null
    const raw = await client.fetch(PAGE_BY_SLUG_QUERY, { slug: data.slug })
    return mapPage(raw)
  })

export const getReports = createServerFn({ method: 'GET' })
  .validator(parseReportsInput)
  .handler(async ({ data }) => {
    const start = (data.page - 1) * REPORTS_PAGE_SIZE
    const raw = await getPublishedClient().fetch(REPORTS_QUERY, {
      category: data.category,
      start,
      end: start + REPORTS_PAGE_SIZE,
    })
    return mapReportList(raw, { ...data, pageSize: REPORTS_PAGE_SIZE })
  })

export const getReport = createServerFn({ method: 'GET' })
  .validator(parseSlugInput)
  .handler(async ({ data }) => {
    const client = await clientFor(data.preview)
    if (!data.slug) return null
    const raw = await client.fetch(REPORT_BY_SLUG_QUERY, { slug: data.slug })
    return mapReport(raw)
  })

// The newest report for the home page. A failure here leaves the hero without
// it rather than failing the whole page.
export async function getLatestReport(): Promise<ReportSummary | null> {
  try {
    const list = await getReports({ data: { page: 1 } })
    return list.items[0] ?? null
  } catch {
    return null
  }
}
