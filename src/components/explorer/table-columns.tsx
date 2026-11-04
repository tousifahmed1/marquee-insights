import { createColumnHelper, rowSortingFeature, tableFeatures } from '@tanstack/react-table'
import { CheckIcon } from 'lucide-react'

import { AGE_GROUPS, GENDERS, GENRES, PLATFORMS, REGIONS, labelFor } from '@/data/dimensions'
import type { ResponseRow } from '@/data/types'
import { formatInteger, formatMonth } from '@/lib/format'

export const tableFeaturesConfig = tableFeatures({ rowSortingFeature })

const column = createColumnHelper<typeof tableFeaturesConfig, ResponseRow>()

export type ColumnMeta = { numeric?: boolean }

// Scores run from 0 to 100, so the bar is the score as a share of its track.
// Only the column the table is sorted by gets bars, to keep the table narrow.
function Score({ value, meter }: { value: number; meter: boolean }) {
  if (!meter) return formatInteger(value)
  return (
    <span className="inline-flex items-center justify-end gap-3">
      <span aria-hidden className="hidden h-1.5 w-10 overflow-hidden rounded-full bg-border sm:block">
        <span
          className="block h-full origin-left rounded-full bg-primary"
          style={{ transform: `scaleX(${Math.min(Math.max(value, 0), 100) / 100})` }}
        />
      </span>
      <span className="w-7">{formatInteger(value)}</span>
    </span>
  )
}

export const columns = column.columns([
  column.accessor('wave', {
    id: 'wave',
    header: 'Wave',
    sortDescFirst: true,
    cell: (info) => <span className="whitespace-nowrap">{formatMonth(info.getValue(), 'short')}</span>,
  }),
  column.accessor('showTitle', {
    id: 'show',
    header: 'Show',
    sortDescFirst: false,
    cell: (info) => (
      <span className="block min-w-40">
        <span className="block font-medium">{info.getValue()}</span>
        <span className="sr-only">, </span>
        <span className="block text-xs text-muted-foreground">
          {labelFor(GENRES, info.row.original.genre)}
        </span>
      </span>
    ),
  }),
  column.accessor('awareness', {
    header: 'Awareness',
    sortDescFirst: true,
    meta: { numeric: true },
    cell: (info) => <Score value={info.getValue()} meter={Boolean(info.column.getIsSorted())} />,
  }),
  column.accessor('intent', {
    header: 'Intent to watch',
    sortDescFirst: true,
    meta: { numeric: true },
    cell: (info) => <Score value={info.getValue()} meter={Boolean(info.column.getIsSorted())} />,
  }),
  column.accessor('satisfaction', {
    header: 'Satisfaction',
    sortDescFirst: true,
    meta: { numeric: true },
    cell: (info) => <Score value={info.getValue()} meter={Boolean(info.column.getIsSorted())} />,
  }),
  column.accessor('platform', {
    header: 'Platform',
    enableSorting: false,
    cell: (info) => <span className="whitespace-nowrap">{labelFor(PLATFORMS, info.getValue())}</span>,
  }),
  column.accessor('ageGroup', {
    id: 'viewer',
    header: 'Viewer',
    enableSorting: false,
    cell: (info) => {
      const row = info.row.original
      return (
        <span className="block min-w-32">
          <span className="block">
            {labelFor(GENDERS, row.gender)}, {labelFor(AGE_GROUPS, row.ageGroup)}
          </span>
          <span className="sr-only">, </span>
          <span className="block text-xs text-muted-foreground">{labelFor(REGIONS, row.region)}</span>
        </span>
      )
    },
  }),
  column.accessor('wouldRecommend', {
    header: 'Recommends',
    enableSorting: false,
    cell: (info) =>
      info.getValue() ? (
        <span className="inline-flex items-center gap-1.5">
          <CheckIcon aria-hidden className="size-3.5 text-highlight" />
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span aria-hidden className="size-3.5" />
          No
        </span>
      ),
  }),
])
