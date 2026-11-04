import { z } from 'zod'

import { AGE_GROUPS, GENRES, PLATFORMS, REGIONS, values } from './dimensions'

export const SORT_FIELDS = ['wave', 'show', 'awareness', 'intent', 'satisfaction'] as const
export const SORT_DIRECTIONS = ['asc', 'desc'] as const
export const PAGE_SIZES = [25, 50, 100] as const
export const MAX_PAGE = 2000

export const EXPLORER_DEFAULTS: {
  sort: SortField
  dir: SortDirection
  page: number
  pageSize: PageSize
} = { sort: 'wave', dir: 'desc', page: 1, pageSize: 25 }

const WAVE_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

export const filterShape = {
  show: z.number().int().positive().optional(),
  genre: z.enum(values(GENRES)).optional(),
  platform: z.enum(values(PLATFORMS)).optional(),
  region: z.enum(values(REGIONS)).optional(),
  ageGroup: z.enum(values(AGE_GROUPS)).optional(),
  waveFrom: z.string().regex(WAVE_MONTH, 'Use YYYY-MM').optional(),
  waveTo: z.string().regex(WAVE_MONTH, 'Use YYYY-MM').optional(),
  minAwareness: z.number().int().min(0).max(100).optional(),
}

export const queryShape = {
  sort: z.enum(SORT_FIELDS).default(EXPLORER_DEFAULTS.sort),
  dir: z.enum(SORT_DIRECTIONS).default(EXPLORER_DEFAULTS.dir),
  page: z.number().int().min(1).max(MAX_PAGE).default(EXPLORER_DEFAULTS.page),
  pageSize: z
    .union(PAGE_SIZES.map((size) => z.literal(size)))
    .default(EXPLORER_DEFAULTS.pageSize),
}

function waveRangeInOrder(filters: { waveFrom?: string; waveTo?: string }, ctx: z.RefinementCtx) {
  if (filters.waveFrom && filters.waveTo && filters.waveFrom > filters.waveTo) {
    ctx.addIssue({
      code: 'custom',
      path: ['waveTo'],
      message: 'waveTo must not be before waveFrom',
    })
  }
}

export const explorerFiltersSchema = z.strictObject(filterShape).superRefine(waveRangeInOrder)

export const explorerQuerySchema = z
  .strictObject({ ...filterShape, ...queryShape })
  .superRefine(waveRangeInOrder)

export type ExplorerFilters = z.infer<typeof explorerFiltersSchema>
export type ExplorerQuery = z.infer<typeof explorerQuerySchema>
export type SortField = (typeof SORT_FIELDS)[number]
export type SortDirection = (typeof SORT_DIRECTIONS)[number]
export type PageSize = (typeof PAGE_SIZES)[number]

export function isSortField(value: string): value is SortField {
  return (SORT_FIELDS as readonly string[]).includes(value)
}

export function parseExplorerFilters(input: unknown): ExplorerFilters {
  return explorerFiltersSchema.parse(input ?? {})
}

export function parseExplorerQuery(input: unknown): ExplorerQuery {
  return explorerQuerySchema.parse(input ?? {})
}
