import { EXPLORER_DEFAULTS, filterShape, queryShape } from './filters'
import type { ExplorerFilters, ExplorerQuery, PageSize, SortDirection, SortField } from './filters'

export type ExplorerSearch = Partial<ExplorerQuery>

// The filter schema is the only list of filters.
export const FILTER_KEYS = Object.keys(filterShape) as (keyof ExplorerFilters)[]

const SEARCH_KEYS = [...FILTER_KEYS, ...(Object.keys(queryShape) as (keyof typeof queryShape)[])]

const FIELD_SCHEMAS = { ...filterShape, ...queryShape }

// URL values arrive as strings. A digit string that fails its schema is tried
// again as a number, so numeric fields need no list of their own.
function parseField(key: (typeof SEARCH_KEYS)[number], raw: unknown) {
  const schema = FIELD_SCHEMAS[key]
  const direct = schema.safeParse(raw)
  if (direct.success || typeof raw !== 'string' || !/^\d+$/.test(raw)) return direct
  return schema.safeParse(Number(raw))
}

function isDefault(key: string, value: unknown): boolean {
  return key in EXPLORER_DEFAULTS && EXPLORER_DEFAULTS[key as keyof typeof EXPLORER_DEFAULTS] === value
}

export function cleanSearch(input: Record<string, unknown>): ExplorerSearch {
  const search: Record<string, unknown> = {}
  for (const key of SEARCH_KEYS) {
    const raw = input[key]
    if (raw === undefined || raw === null || raw === '') continue
    const parsed = parseField(key, raw)
    if (parsed.success && parsed.data !== undefined && !isDefault(key, parsed.data)) {
      search[key] = parsed.data
    }
  }
  const { waveFrom, waveTo } = search as ExplorerSearch
  if (waveFrom && waveTo && waveFrom > waveTo) {
    search.waveFrom = waveTo
    search.waveTo = waveFrom
  }
  return search as ExplorerSearch
}

export function toExplorerQuery(search: ExplorerSearch): ExplorerQuery {
  return { ...EXPLORER_DEFAULTS, ...cleanSearch(search) }
}

export function toFilters(search: ExplorerSearch): ExplorerFilters {
  const filters: Record<string, unknown> = {}
  for (const key of FILTER_KEYS) {
    if (search[key] !== undefined) filters[key] = search[key]
  }
  return filters as ExplorerFilters
}

export type FilterPatch = Partial<Record<keyof ExplorerFilters, unknown>>

// Every change to an explorer URL. Each returns a clean search, and any change
// that alters which rows are shown starts again from the first page.
export function withFilters(search: ExplorerSearch, patch: FilterPatch): ExplorerSearch {
  return cleanSearch({ ...search, ...patch, page: undefined })
}

export function withoutFilters(search: ExplorerSearch): ExplorerSearch {
  return cleanSearch({ sort: search.sort, dir: search.dir, pageSize: search.pageSize })
}

export function withSort(search: ExplorerSearch, sort: SortField, dir: SortDirection): ExplorerSearch {
  return cleanSearch({ ...search, sort, dir, page: undefined })
}

export function withPageSize(search: ExplorerSearch, pageSize: PageSize): ExplorerSearch {
  return cleanSearch({ ...search, pageSize, page: undefined })
}

export function withPage(search: ExplorerSearch, page: number): ExplorerSearch {
  return cleanSearch({ ...search, page })
}

export function activeFilterCount(search: ExplorerSearch): number {
  return FILTER_KEYS.filter((key) => search[key] !== undefined).length
}
