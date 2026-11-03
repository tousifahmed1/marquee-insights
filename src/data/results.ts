import type { ExplorerQuery } from './filters'
import { AGE_GROUPS, PLATFORMS, values } from './dimensions'
import type { AgeGroup, Platform } from './dimensions'
import type { ExplorerCharts, GroupAverage, ResponsePage, ResponseRow } from './types'

export function toResponsePage(
  rows: (Omit<ResponseRow, 'wave'> & { wave: string })[],
  total: number,
  query: Pick<ExplorerQuery, 'page' | 'pageSize'>,
): ResponsePage {
  return {
    rows: rows.map((row) => ({ ...row, wave: row.wave.slice(0, 7) })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  }
}

export function fillGroups<K extends string>(
  keys: readonly K[],
  rows: readonly { key: K; average: number | null; responses: number }[],
): GroupAverage<K>[] {
  const byKey = new Map(rows.map((row) => [row.key, row]))
  return keys.map((key) => {
    const row = byKey.get(key)
    const average = row && row.responses > 0 && Number.isFinite(row.average) ? row.average : null
    return {
      key,
      average: average === null ? null : Math.round(average * 10) / 10,
      responses: row?.responses ?? 0,
    }
  })
}

// Highest average first; groups without responses go last, in their original order.
export function sortByAverage<K extends string>(groups: readonly GroupAverage<K>[]): GroupAverage<K>[] {
  return [...groups].sort((a, b) => {
    if (a.average === null || b.average === null) return Number(a.average === null) - Number(b.average === null)
    return b.average - a.average
  })
}

type GroupRow<K> = { key: K; average: number | null; responses: number }

// Platforms have no natural order, so they are ranked; age groups keep their sequence.
export function toExplorerCharts(
  platforms: readonly GroupRow<Platform>[],
  ageGroups: readonly GroupRow<AgeGroup>[],
): ExplorerCharts {
  return {
    intentByPlatform: sortByAverage(fillGroups(values(PLATFORMS), platforms)),
    awarenessByAgeGroup: fillGroups(values(AGE_GROUPS), ageGroups),
  }
}

export function monthsBetween(first: string | null, last: string | null): string[] {
  if (!first || !last) return []
  const months: string[] = []
  const [startYear, startMonth] = first.split('-').map(Number) as [number, number]
  const end = last.slice(0, 7)
  for (let i = 0; i < 240; i++) {
    const month = new Date(Date.UTC(startYear, startMonth - 1 + i, 1)).toISOString().slice(0, 7)
    if (month > end) break
    months.push(month)
  }
  return months
}
