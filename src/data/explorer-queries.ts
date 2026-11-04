import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'

import type { ExplorerFilters, ExplorerQuery } from './filters'
import { getExplorerCharts, getExplorerOptions, getExplorerRows } from './functions'
import { toExplorerQuery, toFilters } from './search'
import type { ExplorerSearch } from './search'

const MINUTE = 60_000

const rowsQuery = (query: ExplorerQuery) =>
  queryOptions({
    queryKey: ['explorer', 'rows', query],
    queryFn: () => getExplorerRows({ data: query }),
    staleTime: 5 * MINUTE,
  })

const chartsQuery = (filters: ExplorerFilters) =>
  queryOptions({
    queryKey: ['explorer', 'charts', filters],
    queryFn: () => getExplorerCharts({ data: filters }),
    staleTime: 5 * MINUTE,
  })

const optionsQuery = queryOptions({
  queryKey: ['explorer', 'options'],
  queryFn: () => getExplorerOptions(),
  staleTime: 60 * MINUTE,
})

// The queries behind one explorer URL. The loader and the page both build them
// here, so the data the server renders is found again after hydration.
export function explorerQueries(search: ExplorerSearch) {
  const query = toExplorerQuery(search)
  return { query, rows: rowsQuery(query), charts: chartsQuery(toFilters(query)), options: optionsQuery }
}

// The first visit waits for every query so the server renders real data, and a
// page past the last is a 404. A search change on the page ('stay') only
// prefetches, so the controls never lag behind the URL.
export async function loadExplorer(
  queryClient: QueryClient,
  search: ExplorerSearch,
  cause: 'enter' | 'stay' | 'preload',
): Promise<void> {
  const { query, rows, charts, options } = explorerQueries(search)
  if (cause === 'stay') {
    void queryClient.prefetchQuery(rows)
    void queryClient.prefetchQuery(charts)
    return
  }
  const [, page] = await Promise.all([
    queryClient.ensureQueryData(options),
    queryClient.ensureQueryData(rows),
    queryClient.ensureQueryData(charts),
  ])
  if (query.page > page.totalPages) throw notFound()
}
