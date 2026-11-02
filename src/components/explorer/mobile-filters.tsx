import { SlidersHorizontalIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { activeFilterCount } from '@/data/search'
import type { ExplorerSearch } from '@/data/search'
import type { ExplorerOptions } from '@/data/types'
import { formatInteger } from '@/lib/format'

import { FilterPanel } from './filter-panel'

type MobileFiltersProps = {
  search: ExplorerSearch
  options: ExplorerOptions
  total: number | undefined
}

export function MobileFilters({ search, options, total }: MobileFiltersProps) {
  const active = activeFilterCount(search)
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontalIcon aria-hidden />
          Filters
          {active > 0 ? <span className="tabular-nums">({active})</span> : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-sheet">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Results update as you change each filter.</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4 pb-2">
          <FilterPanel search={search} options={options} />
        </div>
        <SheetFooter className="border-t">
          <SheetClose asChild>
            <Button>
              {total === undefined ? 'Show results' : `Show ${formatInteger(total)} responses`}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
