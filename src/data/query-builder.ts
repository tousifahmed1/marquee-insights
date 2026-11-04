import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'
import type { AnyColumn, SQL } from 'drizzle-orm'

import type { ExplorerFilters, ExplorerQuery, SortDirection, SortField } from './filters'
import { responses, shows } from './schema'

export function waveDate(month: string): string {
  return `${month}-01`
}

// One SQL condition per filter. A filter added to the schema without a
// condition here fails the typecheck instead of being silently ignored.
const FILTER_CONDITIONS: { [K in keyof ExplorerFilters]-?: Condition<K> } = {
  show: (show) => eq(responses.showId, show),
  genre: (genre) =>
    sql`${responses.showId} in (select ${shows.id} from ${shows} where ${eq(shows.genre, genre)})`,
  platform: (platform) => eq(responses.platform, platform),
  region: (region) => eq(responses.region, region),
  ageGroup: (ageGroup) => eq(responses.ageGroup, ageGroup),
  waveFrom: (month) => gte(responses.wave, waveDate(month)),
  waveTo: (month) => lte(responses.wave, waveDate(month)),
  minAwareness: (score) => gte(responses.awareness, score),
}

type Condition<K extends keyof ExplorerFilters> = (value: NonNullable<ExplorerFilters[K]>) => SQL | undefined

function condition<K extends keyof ExplorerFilters>(filters: ExplorerFilters, key: K): SQL | undefined {
  const value = filters[key]
  // TypeScript can't relate FILTER_CONDITIONS[key] to filters[key] for a generic key.
  const build = FILTER_CONDITIONS[key] as Condition<K>
  return value === undefined ? undefined : build(value as NonNullable<ExplorerFilters[K]>)
}

export function whereClause(filters: ExplorerFilters): SQL | undefined {
  return and(...(Object.keys(FILTER_CONDITIONS) as (keyof ExplorerFilters)[]).map((key) => condition(filters, key)))
}

const SORT_COLUMNS: Record<SortField, AnyColumn> = {
  wave: responses.wave,
  show: shows.title,
  awareness: responses.awareness,
  intent: responses.intent,
  satisfaction: responses.satisfaction,
}

export function orderByClause(sort: SortField, dir: SortDirection): SQL[] {
  const direction = dir === 'asc' ? asc : desc
  return [direction(SORT_COLUMNS[sort]), direction(responses.id)]
}

export function pageOffset(query: Pick<ExplorerQuery, 'page' | 'pageSize'>): number {
  return (query.page - 1) * query.pageSize
}
