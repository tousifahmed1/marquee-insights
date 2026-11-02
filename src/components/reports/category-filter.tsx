import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { REPORT_CATEGORIES } from '@/content'
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
                size="sm"
                variant={current ? 'default' : 'outline'}
                className="rounded-full"
              >
                <Link
                  to="/reports"
                  search={option.value ? { category: option.value } : {}}
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
