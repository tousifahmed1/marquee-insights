import { createServerFn } from '@tanstack/react-start'

import { getPublishedClient } from './client'
import { REPORTS_PAGE_SIZE } from './config'
import { parseReportsInput, parseSlugInput } from './inputs'
import {
  mapPage,
  mapReport,
  mapReportList,
  mapSiteSettings,
} from './mappers'
import {
  PAGE_BY_SLUG_QUERY,
  REPORTS_QUERY,
  REPORT_BY_SLUG_QUERY,
  SITE_SETTINGS_QUERY,
} from './queries'

export const getSiteSettings = createServerFn({ method: 'GET' }).handler(async () => {
  const raw = await getPublishedClient().fetch(SITE_SETTINGS_QUERY)
  return mapSiteSettings(raw)
})

export const getPage = createServerFn({ method: 'GET' })
  .validator(parseSlugInput)
  .handler(async ({ data }) => {
    if (!data.slug) return null
    const raw = await getPublishedClient().fetch(PAGE_BY_SLUG_QUERY, { slug: data.slug })
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
    if (!data.slug) return null
    const raw = await getPublishedClient().fetch(REPORT_BY_SLUG_QUERY, { slug: data.slug })
    return mapReport(raw)
  })
