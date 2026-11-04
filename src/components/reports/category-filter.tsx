import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { REPORT_CATEGORIES, reportsSearch } from '@/content'
import type { ReportCategory } from '@/content'

const OPTIONS: { value: ReportCategory | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  ...REPORT_CATEGORIES,
]

export function CategoryFilter({ active }: { active: ReportCategory | null }) {
  return (
    <nav aria-label="Filter reports by category">
      <ul className="flex flex-wrap gap-2">
        {OPTIONS.map((option) => {
          const current = (option.value ?? null) === active
          return (
            <li key={option.label}>
              <Button
                asChild
                variant={current ? 'default' : 'outline'}
                className="h-9 rounded-full px-4"
              >
                <Link
                  to="/reports"
                  search={reportsSearch(option.value ?? null, 1)}
                  aria-current={current ? 'page' : undefined}
                >
                  {option.label}
                </Link>
              </Button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
