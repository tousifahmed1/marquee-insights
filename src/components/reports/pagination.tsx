import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import type { ReportList } from '@/content'

type PaginationProps = Pick<ReportList, 'page' | 'totalPages' | 'category'>

export function Pagination({ page, totalPages, category }: PaginationProps) {
  if (totalPages <= 1) return null
  const searchFor = (target: number) => ({
    ...(category ? { category } : {}),
    ...(target > 1 ? { page: target } : {}),
  })

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Button asChild variant="outline">
          <Link to="/reports" search={searchFor(page - 1)} rel="prev">
            Newer reports
          </Link>
        </Button>
      ) : (
        <span />
      )}
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      {page < totalPages ? (
        <Button asChild variant="outline">
          <Link to="/reports" search={searchFor(page + 1)} rel="next">
            Older reports
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  )
}
