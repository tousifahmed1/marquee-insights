import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'
import type { AnyColumn, SQL } from 'drizzle-orm'

import type { ExplorerFilters, ExplorerQuery, SortDirection, SortField } from './filters'
import { responses, shows } from './schema'

export function waveDate(month: string): string {
  return `${month}-01`
}

export function whereClause(filters: ExplorerFilters): SQL | undefined {
  return and(
    filters.show === undefined ? undefined : eq(responses.showId, filters.show),
    filters.genre === undefined
      ? undefined
      : sql`${responses.showId} in (select ${shows.id} from ${shows} where ${eq(shows.genre, filters.genre)})`,
    filters.platform === undefined ? undefined : eq(responses.platform, filters.platform),
    filters.region === undefined ? undefined : eq(responses.region, filters.region),
    filters.ageGroup === undefined ? undefined : eq(responses.ageGroup, filters.ageGroup),
    filters.waveFrom === undefined ? undefined : gte(responses.wave, waveDate(filters.waveFrom)),
    filters.waveTo === undefined ? undefined : lte(responses.wave, waveDate(filters.waveTo)),
    filters.minAwareness === undefined
      ? undefined
      : gte(responses.awareness, filters.minAwareness),
  )
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
