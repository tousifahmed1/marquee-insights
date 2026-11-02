import { isReportCategory } from './categories'
import type { ReportCategory } from './categories'
import { record } from './mappers/primitives'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_PAGE = 1000

export type SlugInput = { slug: string | null }

export type ReportsInput = { page: number; category: ReportCategory | null }

export function parseSlugInput(input: unknown): SlugInput {
  const slug = record(input)?.slug
  return { slug: typeof slug === 'string' && slug.length <= 96 && SLUG.test(slug) ? slug : null }
}

export function parsePage(value: unknown): number {
  const page = typeof value === 'string' ? Number(value) : value
  return typeof page === 'number' && Number.isInteger(page) && page >= 1 && page <= MAX_PAGE
    ? page
    : 1
}

export function parseCategory(value: unknown): ReportCategory | null {
  return isReportCategory(value) ? value : null
}

export function parseReportsInput(input: unknown): ReportsInput {
  const data = record(input)
  return { page: parsePage(data?.page), category: parseCategory(data?.category) }
}
