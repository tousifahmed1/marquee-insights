import { useTable } from '@tanstack/react-table'
import type { SortingState, Updater } from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SORT_FIELDS } from '@/data/filters'
import type { ExplorerQuery, SortField } from '@/data/filters'
import type { ResponsePage } from '@/data/types'
import { cn } from '@/lib/utils'

import { LoadError } from './inline-states'
import { columns, tableFeaturesConfig } from './table-columns'
import type { ColumnMeta } from './table-columns'
import { TablePagination } from './table-pagination'
import { useExplorerNavigate } from './use-explorer-navigate'

type ResultsTableProps = {
  page: ResponsePage | undefined
  query: ExplorerQuery
  error: boolean
  onRetry: () => void
}

const EMPTY: ResponsePage['rows'] = []

function isSortField(value: string): value is SortField {
  return (SORT_FIELDS as readonly string[]).includes(value)
}

export function ResultsTable({ page, query, error, onRetry }: ResultsTableProps) {
  const { setSort, clearFilters } = useExplorerNavigate()
  const sorting: SortingState = [{ id: query.sort, desc: query.dir === 'desc' }]

  const table = useTable({
    features: tableFeaturesConfig,
    columns,
    data: page?.rows ?? EMPTY,
    getRowId: (row) => String(row.id),
    manualSorting: true,
    enableSortingRemoval: false,
    enableMultiSort: false,
    state: { sorting },
    onSortingChange: (updater: Updater<SortingState>) => {
      const [next] = typeof updater === 'function' ? updater(sorting) : updater
      if (next && isSortField(next.id)) setSort(next.id, next.desc ? 'desc' : 'asc')
    },
  })

  if (!page) {
    return error ? <LoadError what="The responses" onRetry={onRetry} /> : null
  }

  if (page.total === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-lg">No responses match these filters.</p>
        <p className="mt-2 text-muted-foreground">
          Widen the wave range, lower the minimum awareness or clear a filter.
        </p>
        <Button variant="outline" className="mt-6" onClick={clearFilters}>
          Clear filters
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="sr-only">Responses</h2>
      <div
        className="max-h-table overflow-auto rounded-lg border"
        tabIndex={0}
        role="region"
        aria-label="Survey responses, scrollable"
      >
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const numeric = (header.column.columnDef.meta as ColumnMeta | undefined)?.numeric
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
                      }
                      className={cn(
                        'px-3 py-3 font-medium whitespace-nowrap text-muted-foreground',
                        numeric ? 'text-right' : 'text-left',
                      )}
                    >
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-sm hover:text-foreground',
                            sorted && 'text-foreground',
                          )}
                        >
                          <table.FlexRender header={header} />
                          {sorted === 'asc' ? (
                            <ArrowUpIcon className="size-3.5" aria-hidden />
                          ) : sorted === 'desc' ? (
                            <ArrowDownIcon className="size-3.5" aria-hidden />
                          ) : (
                            <ChevronsUpDownIcon className="size-3.5 opacity-50" aria-hidden />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-muted/50">
                {row.getAllCells().map((cell) => {
                  const numeric = (cell.column.columnDef.meta as ColumnMeta | undefined)?.numeric
                  return (
                    <td
                      key={cell.id}
                      className={cn('px-3 py-2.5', numeric && 'text-right tabular-nums')}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} />
    </div>
  )
}
