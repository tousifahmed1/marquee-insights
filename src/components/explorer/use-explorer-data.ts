import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'

import { explorerQueries } from '@/data/explorer-queries'
import type { ExplorerSearch } from '@/data/search'

// The explorer's data for the current URL. While a new search loads, the
// previous rows and charts stay on screen and `updating` is true.
export function useExplorerData(search: ExplorerSearch) {
  const queries = explorerQueries(search)
  const { data: options } = useSuspenseQuery(queries.options)
  const rows = useQuery({ ...queries.rows, placeholderData: keepPreviousData })
  const charts = useQuery({ ...queries.charts, placeholderData: keepPreviousData })
  return {
    query: queries.query,
    options,
    rows,
    charts,
    updating: rows.isPlaceholderData || charts.isPlaceholderData,
  }
}
