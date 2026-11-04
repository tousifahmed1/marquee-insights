import { Link } from '@tanstack/react-router'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PAGE_SIZES } from '@/data/filters'
import { withPage } from '@/data/search'
import type { ResponsePage } from '@/data/types'
import { formatInteger } from '@/lib/format'

import { FilterSelect } from './filter-select'
import { useExplorerNavigate } from './use-explorer-navigate'

const SIZE_OPTIONS = PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))

function PageLink({ page, label, disabled, children }: {
  page: number
  label: string
  disabled: boolean
  children: React.ReactNode
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="sm" disabled aria-label={label}>
        {children}
      </Button>
    )
  }
  return (
    <Button asChild variant="outline" size="sm">
      <Link
        to="/explore"
        search={(prev) => withPage(prev, page)}
        resetScroll={false}
        aria-label={label}
      >
        {children}
      </Link>
    </Button>
  )
}

export function TablePagination({ page }: { page: ResponsePage }) {
  const { setPageSize } = useExplorerNavigate()
  const first = (page.page - 1) * page.pageSize + 1
  const last = Math.min(page.page * page.pageSize, page.total)

  return (
    <nav
      aria-label="Results pages"
      className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm"
    >
      <p className="text-muted-foreground tabular-nums">
        {page.rows.length === 0
          ? `No rows on this page. ${formatInteger(page.total)} responses in total.`
          : `Showing ${formatInteger(first)}–${formatInteger(last)} of ${formatInteger(page.total)}`}
      </p>
      <div className="flex flex-wrap items-center gap-6">
        <FilterSelect
          layout="inline"
          label="Rows per page"
          value={String(page.pageSize)}
          options={SIZE_OPTIONS}
          onChange={(size) => {
            const next = PAGE_SIZES.find((option) => String(option) === size)
            if (next) setPageSize(next)
          }}
        />
        <div className="flex items-center gap-2">
          <PageLink page={page.page - 1} label="Previous page" disabled={page.page <= 1}>
            <ChevronLeftIcon aria-hidden />
          </PageLink>
          <span className="px-1 tabular-nums">
            Page {formatInteger(page.page)} of {formatInteger(page.totalPages)}
          </span>
          <PageLink
            page={page.page + 1}
            label="Next page"
            disabled={page.page >= page.totalPages}
          >
            <ChevronRightIcon aria-hidden />
          </PageLink>
        </div>
      </div>
    </nav>
  )
}
