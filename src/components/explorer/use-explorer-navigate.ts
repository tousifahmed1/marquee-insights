import { useNavigate } from '@tanstack/react-router'

import type { PageSize, SortDirection, SortField } from '@/data/filters'
import { withFilters, withPageSize, withSort, withoutFilters } from '@/data/search'
import type { ExplorerSearch, FilterPatch } from '@/data/search'

export function useExplorerNavigate() {
  const navigate = useNavigate({ from: '/explore' })
  const go = (next: (prev: ExplorerSearch) => ExplorerSearch) =>
    void navigate({ search: next, resetScroll: false })

  return {
    setFilters: (patch: FilterPatch) => go((prev) => withFilters(prev, patch)),
    clearFilters: () => go(withoutFilters),
    setSort: (sort: SortField, dir: SortDirection) => go((prev) => withSort(prev, sort, dir)),
    setPageSize: (pageSize: PageSize) => go((prev) => withPageSize(prev, pageSize)),
  }
}
