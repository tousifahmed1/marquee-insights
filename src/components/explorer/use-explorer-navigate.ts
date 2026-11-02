import { useNavigate } from '@tanstack/react-router'

import type { SortDirection, SortField, PageSize } from '@/data/filters'
import { applyFilters, cleanSearch } from '@/data/search'
import type { ExplorerSearch, FILTER_KEYS } from '@/data/search'

export type FilterPatch = Partial<Record<(typeof FILTER_KEYS)[number], unknown>>

export function useExplorerNavigate() {
  const navigate = useNavigate({ from: '/explore' })
  const go = (next: (prev: ExplorerSearch) => ExplorerSearch) =>
    void navigate({ search: next, resetScroll: false })

  return {
    setFilters: (patch: FilterPatch) => go((prev) => applyFilters(prev, patch)),
    clearFilters: () =>
      go((prev) => cleanSearch({ sort: prev.sort, dir: prev.dir, pageSize: prev.pageSize })),
    setSort: (sort: SortField, dir: SortDirection) =>
      go((prev) => cleanSearch({ ...prev, sort, dir, page: undefined })),
    setPageSize: (pageSize: PageSize) =>
      go((prev) => cleanSearch({ ...prev, pageSize, page: undefined })),
  }
}
