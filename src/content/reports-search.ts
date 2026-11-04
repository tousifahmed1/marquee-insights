import type { ReportCategory } from './categories'
import { parseCategory, parsePage } from './inputs'

// The /reports listing's search params. Defaults are left out, so every
// listing has exactly one URL, which is also the one the page cache stores.
export type ReportsSearch = { category?: ReportCategory; page?: number }

export function reportsSearch(category: ReportCategory | null, page: number): ReportsSearch {
  return { ...(category ? { category } : {}), ...(page > 1 ? { page } : {}) }
}

export function parseReportsSearch(raw: Record<string, unknown>): ReportsSearch {
  return reportsSearch(parseCategory(raw.category), parsePage(raw.page))
}

export function reportsPath(search: ReportsSearch): string {
  const params = new URLSearchParams()
  if (search.category) params.set('category', search.category)
  if (search.page) params.set('page', String(search.page))
  return params.size === 0 ? '/reports' : `/reports?${params}`
}
