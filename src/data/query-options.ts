import { queryOptions } from '@tanstack/react-query'

import type { ExplorerFilters, ExplorerQuery } from './filters'
import { getExplorerCharts, getExplorerOptions, getExplorerRows } from './functions'

const MINUTE = 60_000

export const explorerRowsQueryOptions = (query: ExplorerQuery) =>
  queryOptions({
    queryKey: ['explorer', 'rows', query],
    queryFn: () => getExplorerRows({ data: query }),
    staleTime: 5 * MINUTE,
  })

export const explorerChartsQueryOptions = (filters: ExplorerFilters) =>
  queryOptions({
    queryKey: ['explorer', 'charts', filters],
    queryFn: () => getExplorerCharts({ data: filters }),
    staleTime: 5 * MINUTE,
  })

export const explorerOptionsQueryOptions = queryOptions({
  queryKey: ['explorer', 'options'],
  queryFn: () => getExplorerOptions(),
  staleTime: 60 * MINUTE,
})
